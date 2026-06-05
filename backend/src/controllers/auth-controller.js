// controllers/auth.controller.js
const crypto = require("crypto");
const supabaseAdmin = require("../config/supabase");
const {
  saveOtpRecord,
  getOtpRecord,
  deleteOtpRecord,
} = require("../services/cache-service");
const { sendOtpEmail } = require("../services/email-service");

// ── Phase 1: Send OTP ─────────────────────────────────────────────────────────
const initiateRegister = async (req, res) => {
  try {
    const { email, password, fullName, studentId, role = "student" } = req.body;

    if (!email || !password || !fullName) {
      return res
        .status(400)
        .json({ error: "Email, password and full name are required." });
    }

    if (!["student", "provider"].includes(role)) {
      return res
        .status(400)
        .json({ error: "Role must be 'student' or 'provider'." });
    }

    if (
      role === "student" &&
      !email.endsWith(".ucc.edu.gh") &&
      !email.endsWith("@ucc.edu.gh")
    ) {
      return res
        .status(400)
        .json({ error: "Students must use their official UCC email." });
    }

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === email);

    if (existingUser) {
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", existingUser.id)
        .eq("role", role)
        .maybeSingle();

      if (existingRole) {
        return res.status(409).json({
          error: `This email is already registered as a ${role}. Please sign in instead.`,
        });
      }

      saveOtpRecord(email, {
        password,
        fullName,
        studentId,
        role,
        otp: crypto.randomInt(100000, 999999).toString(),
        existingUserId: existingUser.id,
      });
    } else {
      const otp = crypto.randomInt(100000, 999999).toString();
      saveOtpRecord(email, { password, fullName, studentId, role, otp });
    }

    const record = getOtpRecord(email);
    await sendOtpEmail(email, record.otp);

    return res
      .status(200)
      .json({ message: "Verification code sent to your email address." });
  } catch (error) {
    console.error("initiateRegister error:", error);
    return res
      .status(500)
      .json({ error: "An unexpected error occurred sending your OTP." });
  }
};
// ── Phase 2: Verify OTP and provision ─────────────────────────────────────────
const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ error: "Email and verification code are required." });
    }

    const cached = getOtpRecord(email);

    if (!cached || cached.otp !== otp) {
      return res
        .status(400)
        .json({ error: "Invalid or expired verification code." });
    }

    let userId = cached.existingUserId ?? null;

    // ── Path A: Existing Auth account, just add the new role ─────────────────
    if (userId) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: cached.role });

      if (roleError) {
        if (roleError.code === "23505") {
          return res
            .status(409)
            .json({ error: `You already have a ${cached.role} account.` });
        }
        throw roleError;
      }

      const { data: roles, error: rolesError } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;
      const roleList = roles.map((r) => r.role);

      deleteOtpRecord(email);
      return res.status(200).json({
        success: true,
        message: `${cached.role} role added to your account successfully.`,
        user: {
          id: userId,
          email,
          roles: roleList,
          activeRole: cached.role,
          isNewAccount: false,
        },
      });
    }

    // ── Path B: New Auth account — create user + insert role safely ───────────
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: cached.password,
        email_confirm: true,
        user_metadata: {
          full_name: cached.fullName,
          student_id: cached.studentId ?? null,
          primary_role: cached.role,
        },
      });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    userId = authData.user.id;

    // Securely push the profile's primary operational role assignment
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: cached.role });

    if (roleError) throw roleError;

    deleteOtpRecord(email);

    return res.status(201).json({
      success: true,
      message: "Account created and verified successfully!",
      user: {
        id: userId,
        email,
        roles: [cached.role],
        activeRole: cached.role,
        isNewAccount: true,
      },
    });
  } catch (error) {
    // This logs the real PostgreSQL problem to your local terminal console window
    console.error("====== VERIFY OTP CRITICAL FAILURE ======");
    console.error("Error Message:", error.message);
    console.error("Postgres Error Code:", error.code);
    console.error("Error Details:", error.details);
    console.error("=========================================");

    return res.status(500).json({
      error: error.message || "An error occurred creating your account.",
      code: error.code,
    });
  }
};

// ── Sign in — returns all roles the user has ──────────────────────────────────
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    if (rolesError) throw rolesError;

    const roleList = roles.map((r) => r.role);

    return res.status(200).json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        roles: roleList,
        activeRole: roleList.length === 1 ? roleList[0] : null,
      },
    });
  } catch (error) {
    console.error("signIn error:", error);
    return res.status(500).json({ error: "Sign in failed." });
  }
};

module.exports = { initiateRegister, verifyRegisterOtp, signIn };
