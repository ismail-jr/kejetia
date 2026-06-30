const crypto = require("crypto");
const supabaseAdmin = require("../config/supabase");
const { getClient } = require("../config/redis");
const { sendOtpEmail } = require("../services/email-service");

// ─────────────────────────────────────────────
// Institutional email allowlist
// ─────────────────────────────────────────────
//
// Only @stu.ucc.edu.gh (students) and @ucc.edu.gh (staff/providers) are
// accepted for real account creation. To test with a personal email,
// uncomment a line in TEST_EMAIL_ALLOWLIST; remove it before deploying.
const ALLOWED_DOMAINS = ["stu.ucc.edu.gh", "ucc.edu.gh"];

const TEST_EMAIL_ALLOWLIST = [
  // "jibrielismail2110@gmail.com",
];

// Role model
// ----------
// A UCC account (one email) can hold the "student" and/or "provider"
// role. Role membership is stored as the existence of a row in
// student_profiles / provider_profiles. profiles.roles[] is a
// trigger-maintained projection of those tables.
const VALID_ROLES = ["student", "provider"];
const ROLE_TABLE = {
  student: "student_profiles",
  provider: "provider_profiles",
};

// ─────────────────────────────────────────────
// Recommended security parameters
// ─────────────────────────────────────────────
const OTP_TTL_SECONDS = 10 * 60; // code lifetime: 10 minutes
const OTP_EXPIRY_MINUTES = 10; // human-readable, used in the email
const OTP_MAX_VERIFY_ATTEMPTS = 5; // wrong tries before a code is burned
const RESEND_COOLDOWN_SECONDS = 60; // min gap between code sends per email
const LOGIN_MAX_ATTEMPTS = 5; // failed sign-ins before lockout
const LOGIN_LOCK_SECONDS = 15 * 60; // lockout duration

// ─────────────────────────────────────────────
// Redis key helpers
// ─────────────────────────────────────────────
const OTP_KEY = (email) => `otp:${email}`;
const OTP_ATTEMPTS = (email) => `otp_attempts:${email}`;
const RESEND_CD = (email) => `otp_resend_cd:${email}`;
const LOGIN_FAIL = (email) => `login_fail:${email}`;
const LOGIN_LOCK = (email) => `login_lock:${email}`;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const normalizeEmail = (email = "") => email.toLowerCase().trim();

// Extracts a concise, useful description from an error (Supabase/Postgres
// errors carry message/code/details/hint). Surfaced in 500 responses so
// failures like "relation public.student_profiles does not exist" (schema
// not migrated) are visible to the client instead of a generic message.
const errorDetails = (err) => {
  if (!err) return undefined;
  const parts = [err.message, err.details, err.hint].filter(Boolean);
  const text = parts.join(" — ");
  return err.code ? `[${err.code}] ${text}` : text || String(err);
};

const safeRoles = (roles) =>
  Array.isArray(roles) ? roles.filter(Boolean) : [];

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const isAllowedEmail = (email) => {
  if (TEST_EMAIL_ALLOWLIST.includes(email)) return true;
  return ALLOWED_DOMAINS.some((domain) => email.endsWith(`@${domain}`));
};

// Walks every page of listUsers() to find a user by email (getUserByEmail
// is not available on the supabase-js admin API).
const findUserByEmail = async (email) => {
  const perPage = 1000;
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;

    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match;

    if (data.users.length < perPage) return null;
    page += 1;
  }
};

const safeCompareHex = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

const hasRole = async (userId, role) => {
  const table = ROLE_TABLE[role];
  if (!table) return false;

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
};

const loadRoleState = async (userId) => {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("roles, active_role, is_admin")
    .eq("user_id", userId)
    .maybeSingle();

  const roles = safeRoles(profile?.roles);
  const isAdmin = profile?.is_admin === true || roles.includes("admin");
  const activeRole =
    profile?.active_role || (isAdmin ? "admin" : roles[0] || "student");

  return { roles, activeRole, isAdmin };
};

const provisionRole = async ({ userId, email, fullName, studentId, role }) => {
  const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
    {
      user_id: userId,
      email,
      full_name: fullName,
      student_id: studentId,
      active_role: role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (profileError) throw profileError;

  const table = ROLE_TABLE[role];
  const { error: roleError } = await supabaseAdmin
    .from(table)
    .upsert({ user_id: userId }, { onConflict: "user_id" });
  if (roleError) throw roleError;
};

// Generates a fresh OTP, persists its hash + the pending-registration
// metadata in Redis, sends the email, and arms the resend cooldown.
// Throws if the email fails to send (so callers can roll back). Never
// stores the raw password — that already lives in Supabase Auth.
const issueOtp = async (client, email, meta) => {
  const otp = generateOtp();

  const payload = {
    hash: hashOtp(otp),
    fullName: meta.fullName,
    studentId: meta.studentId || null,
    role: meta.role,
    userId: meta.userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
  };

  await client.set(OTP_KEY(email), JSON.stringify(payload), {
    EX: OTP_TTL_SECONDS,
  });
  await client.set(OTP_ATTEMPTS(email), "0", { EX: OTP_TTL_SECONDS });

  // Send first; only arm the cooldown after a successful send so a failed
  // delivery doesn't block an immediate retry.
  await sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES);

  await client.set(RESEND_CD(email), "1", { EX: RESEND_COOLDOWN_SECONDS });
};

// ─────────────────────────────────────────────
// Phase 1: Initiate Registration (brand-new accounts)
// ─────────────────────────────────────────────
const initiateRegister = async (req, res) => {
  try {
    let { email, password, fullName, studentId, role = "student" } = req.body;

    email = normalizeEmail(email);

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }
    if (!isAllowedEmail(email)) {
      return res.status(400).json({
        error:
          "Please use your official UCC email address (e.g. name@stu.ucc.edu.gh)",
      });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const client = getClient();

    // Respect the resend cooldown so rapid double-submits don't spam mail.
    if (await client.get(RESEND_CD(email))) {
      return res.status(429).json({
        error: "A code was just sent. Please wait a moment before retrying.",
      });
    }

    const existingUser = await findUserByEmail(email);

    let userId;
    let isNewAuthUser = false;

    if (existingUser) {
      // If they already completed registration (hold any role / admin),
      // adding another role is a signed-in action — send them to login.
      const { roles, isAdmin } = await loadRoleState(existingUser.id);
      if (roles.length > 0 || isAdmin) {
        if (await hasRole(existingUser.id, role)) {
          return res.status(409).json({
            error: `You already have a ${role} account. Please sign in.`,
            code: "ROLE_ALREADY_EXISTS",
          });
        }
        // Same email, new role — client should call /role/add-with-credentials
        // with the existing password (no OTP; email already verified).
        return res.status(409).json({
          error:
            "You already have an account with this email. Enter your password to unlock the other role.",
          code: "ADD_ROLE_WITH_PASSWORD",
          existingRoles: roles,
          requestedRole: role,
        });
      }
      // Otherwise this is an abandoned registration (auth user exists but
      // was never confirmed/provisioned) — reuse it and re-issue a code.
      userId = existingUser.id;
    } else {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });
      if (error) throw error;
      userId = data.user.id;
      isNewAuthUser = true;
    }

    try {
      await issueOtp(client, email, { fullName, studentId, role, userId });
    } catch (mailErr) {
      // Roll back a just-created auth user so the email isn't permanently
      // stuck in a half-registered, can't-resend state.
      if (isNewAuthUser) {
        await supabaseAdmin.auth.admin
          .deleteUser(userId)
          .catch((e) => console.error("rollback deleteUser failed:", e.message));
      }
      await client.del(OTP_KEY(email));
      await client.del(OTP_ATTEMPTS(email));
      console.error("initiate email send failed:", mailErr.message);
      return res.status(502).json({
        error:
          "We couldn't send the verification email. Please check the address and try again.",
      });
    }

    return res.json({ message: "Verification code sent" });
  } catch (err) {
    console.error("initiateRegister error:", err);
    return res.status(500).json({
      error: "Registration failed to start",
      details: errorDetails(err),
    });
  }
};

// ─────────────────────────────────────────────
// Resend OTP (mid-registration)
// ─────────────────────────────────────────────
//
// Reuses the pending-registration metadata still cached in Redis and
// sends a brand-new code, resetting the wrong-attempt counter. Works only
// while the original verification session is still alive (within the OTP
// TTL); after that the user must restart registration.
const resendOtp = async (req, res) => {
  try {
    let { email } = req.body;
    email = normalizeEmail(email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const client = getClient();

    if (await client.get(RESEND_CD(email))) {
      return res.status(429).json({
        error: "Please wait a moment before requesting another code.",
      });
    }

    const raw = await client.get(OTP_KEY(email));
    if (!raw) {
      return res.status(400).json({
        error: "Your verification session has expired. Please register again.",
      });
    }

    const cached = JSON.parse(raw);

    try {
      await issueOtp(client, email, {
        fullName: cached.fullName,
        studentId: cached.studentId,
        role: cached.role,
        userId: cached.userId,
      });
    } catch (mailErr) {
      console.error("resend email send failed:", mailErr.message);
      return res.status(502).json({
        error: "We couldn't resend the verification email. Please try again.",
      });
    }

    return res.json({ message: "Verification code resent" });
  } catch (err) {
    console.error("resendOtp error:", err);
    return res
      .status(500)
      .json({ error: "Failed to resend code", details: errorDetails(err) });
  }
};

// ─────────────────────────────────────────────
// Phase 2: Verify OTP
// ─────────────────────────────────────────────
const verifyRegisterOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;
    email = normalizeEmail(email);

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const client = getClient();
    const raw = await client.get(OTP_KEY(email));

    if (!raw) {
      return res
        .status(400)
        .json({ error: "This code has expired. Please request a new one." });
    }

    const cached = JSON.parse(raw);

    if (Date.now() > cached.expiresAt) {
      await client.del(OTP_KEY(email));
      return res
        .status(400)
        .json({ error: "This code has expired. Please request a new one." });
    }

    const attempts = await client.incr(OTP_ATTEMPTS(email));
    if (attempts > OTP_MAX_VERIFY_ATTEMPTS) {
      await client.del(OTP_KEY(email));
      await client.del(OTP_ATTEMPTS(email));
      return res.status(429).json({
        error: "Too many incorrect attempts. Please request a new code.",
      });
    }

    const valid = safeCompareHex(cached.hash, hashOtp(otp));
    if (!valid) {
      return res.status(400).json({
        error: "Incorrect code. Please try again.",
        attemptsRemaining: Math.max(0, OTP_MAX_VERIFY_ATTEMPTS - attempts),
      });
    }

    const userId = cached.userId;

    // Confirm the email now that the OTP is verified.
    const { error: confirmError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
    if (confirmError) throw confirmError;

    // Create the identity row + the chosen role extension (the role table
    // insert fires the trigger that populates profiles.roles[]).
    await provisionRole({
      userId,
      email,
      fullName: cached.fullName,
      studentId: cached.studentId,
      role: cached.role,
    });

    const { roles, activeRole, isAdmin } = await loadRoleState(userId);

    await client.del(OTP_KEY(email));
    await client.del(OTP_ATTEMPTS(email));
    await client.del(RESEND_CD(email));

    return res.status(201).json({
      success: true,
      user: { id: userId, email, roles, activeRole, isAdmin },
    });
  } catch (err) {
    console.error("verifyRegisterOtp error:", err);
    return res
      .status(500)
      .json({ error: "Verification failed", details: errorDetails(err) });
  }
};

// ─────────────────────────────────────────────
// Phase 3: Sign In
// ─────────────────────────────────────────────
const signIn = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = normalizeEmail(email);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const client = getClient();
    const failKey = LOGIN_FAIL(email);

    if (await client.get(LOGIN_LOCK(email))) {
      return res.status(429).json({
        error: "Account temporarily locked. Please try again later.",
      });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const attempts = await client.incr(failKey);
      await client.expire(failKey, LOGIN_LOCK_SECONDS);

      if (attempts >= LOGIN_MAX_ATTEMPTS) {
        await client.set(LOGIN_LOCK(email), "1", { EX: LOGIN_LOCK_SECONDS });
      }

      return res.status(401).json({
        error: "Invalid email or password",
        attemptsRemaining: Math.max(0, LOGIN_MAX_ATTEMPTS - attempts),
      });
    }

    await client.del(failKey);
    await client.del(LOGIN_LOCK(email));

    const { roles, activeRole, isAdmin } = await loadRoleState(data.user.id);

    return res.status(200).json({
      success: true,
      session: data.session,
      user: { id: data.user.id, email, roles, activeRole, isAdmin },
    });
  } catch (err) {
    console.error("signIn error:", err);
    return res
      .status(500)
      .json({ error: "Sign in failed", details: errorDetails(err) });
  }
};

// ─────────────────────────────────────────────
// Add a secondary role (signed-in, no OTP)
// ─────────────────────────────────────────────
const addRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = req.user;

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (await hasRole(user.id, role)) {
      return res.status(409).json({ error: `Already registered as ${role}` });
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingProfile) {
      return res.status(400).json({ error: "Profile not found" });
    }

    const table = ROLE_TABLE[role];
    const { error: roleError } = await supabaseAdmin
      .from(table)
      .upsert({ user_id: user.id }, { onConflict: "user_id" });
    if (roleError) throw roleError;

    const { error: activeError } = await supabaseAdmin
      .from("profiles")
      .update({ active_role: role, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (activeError) throw activeError;

    const { roles, activeRole, isAdmin } = await loadRoleState(user.id);

    return res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, roles, activeRole, isAdmin },
    });
  } catch (err) {
    console.error("addRole error:", err);
    return res
      .status(500)
      .json({ error: "Failed to add role", details: errorDetails(err) });
  }
};

// ─────────────────────────────────────────────
// Add a secondary role with email + password (logged out)
// ─────────────────────────────────────────────
//
// Lets a student who already registered unlock the provider role (or vice
// versa) from the registration page using their existing credentials —
// no OTP, because the email was verified at first registration.
const addRoleWithCredentials = async (req, res) => {
  try {
    let { email, password, role } = req.body;
    email = normalizeEmail(email);

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const existingUser = await findUserByEmail(email);
    if (!existingUser) {
      return res.status(404).json({
        error: "No account found with this email. Please register first.",
      });
    }

    if (await hasRole(existingUser.id, role)) {
      return res.status(409).json({
        error: `You already have the ${role} role. Please sign in.`,
        code: "ROLE_ALREADY_EXISTS",
      });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("user_id", existingUser.id)
      .maybeSingle();

    if (!profile) {
      return res.status(400).json({ error: "Profile not found" });
    }

    const table = ROLE_TABLE[role];
    const { error: roleError } = await supabaseAdmin
      .from(table)
      .upsert({ user_id: existingUser.id }, { onConflict: "user_id" });
    if (roleError) throw roleError;

    const { error: activeError } = await supabaseAdmin
      .from("profiles")
      .update({ active_role: role, updated_at: new Date().toISOString() })
      .eq("user_id", existingUser.id);
    if (activeError) throw activeError;

    const { roles, activeRole, isAdmin } = await loadRoleState(existingUser.id);

    return res.status(201).json({
      success: true,
      session: data.session,
      user: {
        id: existingUser.id,
        email,
        roles,
        activeRole,
        isAdmin,
      },
    });
  } catch (err) {
    console.error("addRoleWithCredentials error:", err);
    return res.status(500).json({
      error: "Failed to add role",
      details: errorDetails(err),
    });
  }
};

module.exports = {
  initiateRegister,
  resendOtp,
  verifyRegisterOtp,
  signIn,
  addRole,
  addRoleWithCredentials,
};
