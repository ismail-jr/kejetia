const supabaseAdmin = require("../config/supabase");

// ─────────────────────────────────────────────
// requireAuth — verifies a Supabase access token
// ─────────────────────────────────────────────
//
// Used by endpoints that act on behalf of an already-signed-in user
// (e.g. adding a second role to an existing account). The browser sends
// its Supabase session access token as `Authorization: Bearer <token>`;
// we validate it with the admin client and attach the resolved user to
// req.user. No password or OTP is involved — the account and its email
// were already verified at first registration.
const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("requireAuth error:", err);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = { requireAuth };
