const rateLimit = require("express-rate-limit");

// Per-IP guard for the sign-in endpoint. This is a coarse abuse limit on
// top of the per-email lockout (login-email-lock + the controller). Kept
// reasonably generous so shared/NAT'd campus networks aren't blocked by
// legitimate traffic, while still capping automated hammering from one IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: "Too many attempts from this network. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter };
