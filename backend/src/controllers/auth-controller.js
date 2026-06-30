const crypto = require("crypto");
const supabaseAdmin = require("../config/supabase");
const { getClient } = require("../config/redis");
const { sendOtpEmail } = require("../services/email-service");

// ─────────────────────────────────────────────
// Institutional email allowlist
// ─────────────────────────────────────────────
//
// Only @stu.ucc.edu.gh (students) and @ucc.edu.gh (staff/providers) are
// accepted for real account creation. This is intentionally a simple,
// visible array rather than an env var or NODE_ENV check. To test with a
// personal email, uncomment a line in TEST_EMAIL_ALLOWLIST; remove it
// before deploying.
const ALLOWED_DOMAINS = ["stu.ucc.edu.gh", "ucc.edu.gh"];

const TEST_EMAIL_ALLOWLIST = [
  // "jibrielismail2110@gmail.com",
];

// Role model
// ----------
// A UCC account (one email) can hold the "student" and/or "provider"
// role. Role membership is stored in Postgres as the existence of a row
// in student_profiles / provider_profiles (1:1 extensions of profiles).
// profiles.roles[] is a trigger-maintained projection of those tables
// and is what we read back to tell the client which roles a user has.
const VALID_ROLES = ["student", "provider"];
const ROLE_TABLE = {
  student: "student_profiles",
  provider: "provider_profiles",
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const normalizeEmail = (email = "") => email.toLowerCase().trim();

const safeRoles = (roles) =>
  Array.isArray(roles) ? roles.filter(Boolean) : [];

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const OTP_KEY = (email) => `otp:${email}`;
const OTP_ATTEMPTS = (email) => `otp_attempts:${email}`;
const OTP_LOCK = (email) => `otp_lock:${email}`;
const LOGIN_FAIL = (email) => `login_fail:${email}`;

const isAllowedEmail = (email) => {
  if (TEST_EMAIL_ALLOWLIST.includes(email)) return true;
  return ALLOWED_DOMAINS.some((domain) => email.endsWith(`@${domain}`));
};

// Walks every page of listUsers() to find a user by email. getUserByEmail
// is not available on the supabase-js admin API, so we page explicitly.
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

// Returns true if the user already holds the given role (the role's
// extension row exists). Used to reject duplicate role provisioning.
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

// Reads the trigger-maintained roles[] projection + active_role + admin
// flag for a user, with sensible fallbacks.
const loadRoleState = async (userId) => {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("roles, active_role, is_admin")
    .eq("user_id", userId)
    .maybeSingle();

  const roles = safeRoles(profile?.roles);
  const isAdmin = profile?.is_admin === true || roles.includes("admin");
  const activeRole =
    profile?.active_role ||
    (isAdmin ? "admin" : roles[0] || "student");

  return { roles, activeRole, isAdmin };
};

// Provisions identity + a single role for a freshly verified account.
// Creates the profiles row (idempotent upsert) then the role-extension
// row, whose insert fires the trigger that populates profiles.roles[].
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

// ─────────────────────────────────────────────
// Phase 1: Initiate Registration (brand-new accounts only)
// ─────────────────────────────────────────────
//
// This endpoint is for first-time sign-up. Adding a SECOND role to an
// existing account no longer happens here — that requires being signed
// in and goes through POST /api/auth/role/add (no OTP, since the email
// is already verified). If the email already has an auth user, we tell
// the caller to sign in instead.
const initiateRegister = async (req, res) => {
  try {
    let { email, password, fullName, studentId, role = "student" } = req.body;

    email = normalizeEmail(email);

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: "Password must be at least 8 characters",
      });
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

    if (await client.get(OTP_LOCK(email))) {
      return res.status(429).json({ error: "Too many requests" });
    }

    if (await client.get(OTP_KEY(email))) {
      return res.status(429).json({ error: "Wait before retry" });
    }

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      // Account already exists. Adding another role is a signed-in
      // action now, so direct the caller to sign in.
      return res.status(409).json({
        error: "Already registered. Please sign in to add another role.",
      });
    }

    // Brand-new registration. Create the Supabase Auth user now,
    // unconfirmed. The password is consumed here and never stored in
    // Redis. Phase 2 flips email_confirm to true once the OTP checks out.
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (error) throw error;

    const userId = data.user.id;
    const otp = generateOtp();

    const payload = {
      otp,
      hash: crypto.createHash("sha256").update(otp).digest("hex"),
      fullName,
      studentId: studentId || null,
      role,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    await client.set(OTP_KEY(email), JSON.stringify(payload), { EX: 600 });
    await client.set(OTP_ATTEMPTS(email), "0", { EX: 600 });

    await sendOtpEmail(email, otp);

    return res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "init failed" });
  }
};

// ─────────────────────────────────────────────
// Phase 2: Verify OTP
// ─────────────────────────────────────────────

const verifyRegisterOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    email = normalizeEmail(email);

    const client = getClient();
    const raw = await client.get(OTP_KEY(email));

    if (!raw) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const cached = JSON.parse(raw);

    if (Date.now() > cached.expiresAt) {
      await client.del(OTP_KEY(email));
      return res.status(400).json({ error: "OTP expired" });
    }

    const attempts = await client.incr(OTP_ATTEMPTS(email));

    if (attempts > 5) {
      await client.del(OTP_KEY(email));
      return res.status(429).json({ error: "Locked" });
    }

    const incomingHash = crypto.createHash("sha256").update(otp).digest("hex");
    const valid = safeCompareHex(cached.hash, incomingHash);

    if (!valid) {
      return res.status(400).json({
        error: "Invalid OTP",
        attemptsRemaining: Math.max(0, 5 - attempts),
      });
    }

    const userId = cached.userId;

    // Confirm the email now that the OTP has actually been verified.
    const { error: confirmError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });

    if (confirmError) throw confirmError;

    // Create the identity row + the chosen role extension. The role
    // table insert fires the trigger that populates profiles.roles[].
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

    return res.status(201).json({
      success: true,
      user: { id: userId, email, roles, activeRole, isAdmin },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "OTP verify failed" });
  }
};

// ─────────────────────────────────────────────
// Phase 3: Sign In
// ─────────────────────────────────────────────

const signIn = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = normalizeEmail(email);

    const client = getClient();
    const failKey = LOGIN_FAIL(email);

    if (await client.get(`login_lock:${email}`)) {
      return res.status(429).json({
        error: "Account temporarily locked. Try again later.",
      });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const attempts = await client.incr(failKey);
      await client.expire(failKey, 900);

      if (attempts >= 10) {
        await client.set(`login_lock:${email}`, "1", { EX: 900 });
      }

      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: Math.max(0, 10 - attempts),
      });
    }

    await client.del(failKey);
    await client.del(`login_lock:${email}`);

    const { roles, activeRole, isAdmin } = await loadRoleState(data.user.id);

    return res.status(200).json({
      success: true,
      session: data.session,
      user: { id: data.user.id, email, roles, activeRole, isAdmin },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Sign in failed" });
  }
};

// ─────────────────────────────────────────────
// Add a secondary role (signed-in, no OTP)
// ─────────────────────────────────────────────
//
// The caller is already authenticated (requireAuth populated req.user)
// and their email is already verified, so there is nothing to re-verify.
// We just provision the new role extension row and switch their active
// role to it. Rejects if they already hold that role.
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

    // Ensure an identity row exists (it should for any verified account),
    // then add the role extension and make it the active role.
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, student_id")
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
    console.error(err);
    return res.status(500).json({ error: "Failed to add role" });
  }
};

module.exports = {
  initiateRegister,
  verifyRegisterOtp,
  signIn,
  addRole,
};
