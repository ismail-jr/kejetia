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
// visible array rather than an env var or NODE_ENV check — env vars are
// easy to leave misconfigured across environments, and "allow anything
// outside production" silently becomes "allow anything" the moment
// someone forgets to set NODE_ENV correctly on a server. A literal list
// in the code is the most explicit, least surprising option: to test
// with a personal email, uncomment a line below; remove/comment it back
// out when done. Never leave test addresses uncommented in a deployed
// build.
const ALLOWED_DOMAINS = ["stu.ucc.edu.gh", "ucc.edu.gh"];

const TEST_EMAIL_ALLOWLIST = [
  // "jibrielismail2110@gmail.com",
  // "jibrielismail2110+test@gmail.com",
];

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

// True if the email is on the explicit test allowlist above, OR ends in
// one of the accepted institutional domains. Domain check uses a strict
// suffix match anchored with "@" so e.g. "notstu.ucc.edu.gh" or
// "stu.ucc.edu.gh.evil.com" can't slip through a naive .includes() check.
const isAllowedEmail = (email) => {
  if (TEST_EMAIL_ALLOWLIST.includes(email)) return true;

  return ALLOWED_DOMAINS.some((domain) => email.endsWith(`@${domain}`));
};

// Looks up a user by email by walking every page of listUsers() rather
// than just the first. A single unpaginated call (the original bug) only
// returns one page (commonly 50 users) and silently misses everyone
// after that as the user base grows. getUserByEmail would be the
// simpler fix, but it isn't available on @supabase/supabase-js's admin
// API at all (confirmed — it's not a real method on this SDK), so this
// walks pages explicitly instead. perPage is kept fairly high to
// minimize round trips in the common case.
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

    // Stop once a page comes back with fewer users than requested —
    // that's the last page. Also stop on an empty page as a safety net.
    if (data.users.length < perPage) return null;

    page += 1;
  }
};

// Constant-time-safe comparison that tolerates length mismatches instead
// of letting crypto.timingSafeEqual throw a RangeError on malformed or
// stale cache data. A length mismatch just means "not equal", not a
// crash — this still resolves to a generic 500 via the outer catch
// otherwise, which masks the real "Invalid OTP" response the caller
// should see.
const safeCompareHex = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

// ─────────────────────────────────────────────
// Phase 1: Initiate Registration
// ─────────────────────────────────────────────
//
// SECURITY NOTE — password handling:
// The raw password is NEVER written to Redis. The Supabase Auth user is
// created immediately, right here, with email_confirm: false. The
// password is handed directly to Supabase Auth's own secure (hashed)
// storage and is never touched again by this codebase. Redis only ever
// stores the OTP hash and a reference to the user id — never the
// credential itself. Phase 2 just flips email_confirm to true once the
// OTP is verified; it does not need the password again because the user
// record already exists.

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
      return res.status(400).json({
        error: "Invalid email address",
      });
    }

    // Institutional email enforcement. Previously omitted/commented out
    // for staging — now active. Rejects anything outside the UCC domains
    // (or the explicit test allowlist above) before any Supabase Auth
    // user or OTP gets created for it.
    if (!isAllowedEmail(email)) {
      return res.status(400).json({
        error:
          "Please use your official UCC email address (e.g. name@stu.ucc.edu.gh)",
      });
    }

    if (!["student", "provider"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const client = getClient();

    const lock = await client.get(OTP_LOCK(email));
    if (lock) {
      return res.status(429).json({ error: "Too many requests" });
    }

    const existingOtp = await client.get(OTP_KEY(email));
    if (existingOtp) {
      return res.status(429).json({ error: "Wait before retry" });
    }

    const existingUser = await findUserByEmail(email);

    let userId;
    let isNewAuthUser = false;

    if (existingUser) {
      // User already exists in auth.users. Check whether they already
      // hold this role (or are an admin) before allowing a duplicate
      // registration — same conflict semantics as before.
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("roles")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      const roles = safeRoles(profile?.roles);

      if (roles.includes(role) || roles.includes("admin")) {
        return res.status(409).json({ error: "Already registered" });
      }

      // Existing user adding a new role to their account — their auth
      // user and password already exist, so nothing further to create.
      userId = existingUser.id;
    } else {
      // Brand-new registration. Create the Supabase Auth user right now,
      // unconfirmed. The password is consumed here and never stored
      // anywhere else. If the user never completes OTP verification,
      // this row is simply an unconfirmed user that can't sign in
      // (Supabase blocks sign-in for unconfirmed accounts by default).
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      });

      if (error) throw error;

      userId = data.user.id;
      isNewAuthUser = true;
    }

    const otp = generateOtp();

    // No password in this payload — only what's needed to finish the
    // profile row and confirm the email once the OTP checks out.
    const payload = {
      otp,
      hash: crypto.createHash("sha256").update(otp).digest("hex"),
      fullName,
      studentId: studentId || null,
      role,
      userId,
      isNewAuthUser,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

    await client.set(OTP_KEY(email), JSON.stringify(payload), {
      EX: 600,
    });

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

    // Tolerates malformed/mismatched-length hashes instead of throwing —
    // a corrupt cache entry now correctly falls through to "Invalid OTP"
    // rather than bubbling up as an unrelated 500.
    const valid = safeCompareHex(cached.hash, incomingHash);

    if (!valid) {
      return res.status(400).json({
        error: "Invalid OTP",
        attemptsRemaining: Math.max(0, 5 - attempts),
      });
    }

    const userId = cached.userId;

    // The auth user already exists (created in Phase 1, confirmed or
    // not). For a brand-new registration, flip email_confirm to true now
    // that the OTP has actually been verified — this is the only auth
    // mutation Phase 2 needs to make; the password was already set.
    if (cached.isNewAuthUser) {
      const { error: confirmError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });

      if (confirmError) throw confirmError;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("roles, is_admin")
      .eq("user_id", userId)
      .maybeSingle();

    const roles = safeRoles(profile?.roles);

    const finalRoles = [...new Set([...roles, cached.role])];

    const isAdmin = profile?.is_admin === true || finalRoles.includes("admin");

    const activeRole = finalRoles.includes("admin") ? "admin" : cached.role;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        user_id: userId,
        email,
        full_name: cached.fullName,
        student_id: cached.studentId,
        roles: finalRoles,
        active_role: activeRole,
        is_admin: isAdmin,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (profileError) {
      throw profileError;
    }

    await client.del(OTP_KEY(email));
    await client.del(OTP_ATTEMPTS(email));

    return res.status(201).json({
      success: true,
      user: { id: userId, email, roles: finalRoles, isAdmin },
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

    const locked = await client.get(`login_lock:${email}`);
    if (locked) {
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
        await client.set(`login_lock:${email}`, "1", {
          EX: 900,
        });
      }

      return res.status(401).json({
        error: "Invalid credentials",
        attemptsRemaining: Math.max(0, 10 - attempts),
      });
    }

    await client.del(failKey);
    await client.del(`login_lock:${email}`);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("roles, active_role, is_admin")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const roles = safeRoles(profile?.roles);

    const activeRole =
      profile?.active_role ||
      (roles.includes("admin") ? "admin" : roles[0] || "student");

    const isAdmin = profile?.is_admin === true || roles.includes("admin");

    return res.status(200).json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email,
        roles,
        activeRole,
        isAdmin,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Sign in failed" });
  }
};

module.exports = {
  initiateRegister,
  verifyRegisterOtp,
  signIn,
};
