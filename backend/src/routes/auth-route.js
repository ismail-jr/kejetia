const express = require("express");
const router = express.Router();

const {
  initiateRegister,
  verifyRegisterOtp,
  signIn,
  addRole,
} = require("../controllers/auth-controller");

const { loginLimiter } = require("../middleware/rate-limit");
const { loginEmailLock } = require("../middleware/login-email-lock");
const { otpRateLimit } = require("../middleware/otp-rate-limit");
const { requireAuth } = require("../middleware/require-auth");

router.post("/register/initiate", otpRateLimit, initiateRegister);

// otpRateLimit added here — this endpoint previously had no per-IP
// throttling at all, unlike /register/initiate and /signin which both
// already had limiters. The controller's own internal attempt counter
// (locks after 5 wrong OTPs) only throttles by email; without a route
// limiter an attacker could still hammer the endpoint network-speed-fast
// from a single IP across many different emails.
router.post("/register/verify", otpRateLimit, verifyRegisterOtp);

router.post("/signin", loginLimiter, loginEmailLock, signIn);

// Add a secondary role to an already signed-in, email-verified account.
// No OTP — authentication is proven by the bearer token (requireAuth).
router.post("/role/add", requireAuth, addRole);

module.exports = router;
