const express = require("express");
const router = express.Router();

const {
  initiateRegister,
  verifyRegisterOtp,
  signIn,
} = require("../controllers/auth-controller");

const { loginLimiter } = require("../middleware/rate-limit");
const { loginEmailLock } = require("../middleware/login-email-lock");
const { otpRateLimit } = require("../middleware/otp-rate-limit");

router.post("/register/initiate", otpRateLimit, initiateRegister);

// otpRateLimit added here — this endpoint previously had no per-IP
// throttling at all, unlike /register/initiate and /signin which both
// already had limiters. The controller's own internal attempt counter
// (locks after 5 wrong OTPs) only throttles by email; without a route
// limiter an attacker could still hammer the endpoint network-speed-fast
// from a single IP across many different emails.
router.post("/register/verify", otpRateLimit, verifyRegisterOtp);

router.post("/signin", loginLimiter, loginEmailLock, signIn);

module.exports = router;
