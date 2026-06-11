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

    // 1. Check if user already exists in Auth
    const {
      data: { users },
    } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("roles")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (
        profile &&
        (profile.roles.includes(role) || profile.roles.includes("admin"))
      ) {
        return res
          .status(409)
          .json({ error: `You are already registered as a ${role}.` });
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
      saveOtpRecord(email, {
        password,
        fullName,
        studentId,
        role,
        otp: crypto.randomInt(100000, 999999).toString(),
      });
    }

    const record = getOtpRecord(email);
    await sendOtpEmail(email, record.otp);
    return res
      .status(200)
      .json({ message: "Verification code sent to your email." });
  } catch (error) {
    console.error("initiateRegister error:", error);
    return res.status(500).json({ error: "Failed to initiate registration." });
  }
};

// ── Phase 2: Verify OTP and Provision ─────────────────────────────────────────
const verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const cached = getOtpRecord(email);

    if (!cached || cached.otp !== otp) {
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    let userId = cached.existingUserId;

    // Create auth account if brand new
    if (!userId) {
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email,
          password: cached.password,
          email_confirm: true,
        });
      if (authError) throw authError;
      userId = authData.user.id;
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("roles, is_admin")
      .eq("user_id", userId)
      .maybeSingle();

    let finalRoles = [cached.role];
    let existingIsAdmin = false;

    if (existingProfile) {
      existingIsAdmin = existingProfile.is_admin === true;
      if (existingProfile.roles) {
        finalRoles = [...new Set([...existingProfile.roles, cached.role])];
      }
    }

    // Determine default active role layer setup safely
    const finalActiveRole = finalRoles.includes("admin")
      ? "admin"
      : cached.role;

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        user_id: userId,
        email: email,
        full_name: cached.fullName,
        student_id: cached.studentId || null,
        roles: finalRoles,
        active_role: finalActiveRole,
        is_admin: existingIsAdmin || finalRoles.includes("admin"),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (profileError) throw profileError;

    deleteOtpRecord(email);
    return res.status(201).json({
      success: true,
      user: {
        id: userId,
        email,
        roles: finalRoles,
        activeRole: finalActiveRole,
        isAdmin: existingIsAdmin || finalRoles.includes("admin"),
      },
    });
  } catch (error) {
    console.error("====== VERIFY OTP CRITICAL FAILURE ======");
    console.error("Message:", error.message);
    console.error("=========================================");

    return res.status(500).json({
      error: "Database error creating new user",
      details: error.message,
    });
  }
};

// ── Phase 3: Sign In ──────────────────────────────────────────────────────────
const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return res.status(401).json({ error: error.message });

    // ── FIXED: Added 'is_admin' to the database select string statement query ──
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("roles, active_role, is_admin")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const userRoles = profile?.roles || ["student"];

    // Safety check: If roles includes admin but active_role is missing, prioritize admin workspace access
    const defaultActive = userRoles.includes("admin")
      ? "admin"
      : userRoles[0] || "student";
    const currentActive = profile?.active_role || defaultActive;

    // ── FIXED: Parse explicit boolean assessment for user administrative state accounts ──
    const checkIsAdmin =
      profile?.is_admin === true || userRoles.includes("admin");

    return res.status(200).json({
      success: true,
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        roles: userRoles,
        activeRole: currentActive,
        isAdmin: checkIsAdmin,
      },
    });
  } catch (error) {
    console.error("signIn error:", error);
    return res.status(500).json({ error: "Sign in failed: " + error.message });
  }
};

module.exports = {
  initiateRegister,
  verifyRegisterOtp,
  signIn,
};
