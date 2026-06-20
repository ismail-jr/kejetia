const crypto = require("crypto");
const supabaseAdmin = require("../config/supabase");
const { getClient } = require("../config/redis");
const { sendOtpEmail } = require("../services/email-service");

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

// ─────────────────────────────────────────────
// Phase 1: Initiate Registration
// ─────────────────────────────────────────────

const initiateRegister = async (req, res) => {
  try {
    let { email, password, fullName, studentId, role = "student" } = req.body;

    email = normalizeEmail(email);

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: "Missing fields" });
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

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();

    const existingUser = users.find((u) => u.email?.toLowerCase() === email);

    if (existingUser) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("roles")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      const roles = safeRoles(profile?.roles);

      if (roles.includes(role) || roles.includes("admin")) {
        return res.status(409).json({ error: "Already registered" });
      }
    }

    const otp = generateOtp();

    const payload = {
      otp,
      hash: crypto.createHash("sha256").update(otp).digest("hex"),
      fullName,
      studentId: studentId || null,
      role,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      existingUserId: existingUser?.id || null,
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

    const valid = crypto.timingSafeEqual(
      Buffer.from(cached.hash),
      Buffer.from(incomingHash),
    );

    if (!valid) {
      return res.status(400).json({
        error: "Invalid OTP",
        attemptsRemaining: 5 - attempts,
      });
    }

    let userId = cached.existingUserId;

    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: crypto.randomBytes(32).toString("hex"),
        email_confirm: true,
      });

      if (error) throw error;
      userId = data.user.id;
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

    await supabaseAdmin.from("profiles").upsert({
      user_id: userId,
      email,
      full_name: cached.fullName,
      student_id: cached.studentId,
      roles: finalRoles,
      active_role: activeRole,
      is_admin: isAdmin,
      updated_at: new Date().toISOString(),
    });

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
