const express = require("express");
const router = express.Router();

const {
  initiateRegister,
  resendOtp,
  verifyRegisterOtp,
  signIn,
  addRole,
  addRoleWithCredentials,
} = require("../controllers/auth-controller");

const { loginLimiter } = require("../middleware/rate-limit");
const { loginEmailLock } = require("../middleware/login-email-lock");
const { otpSendLimit, otpVerifyLimit } = require("../middleware/otp-rate-limit");
const { requireAuth } = require("../middleware/require-auth");

// Sending a code (initiate + resend) and verifying a code use SEPARATE
// per-email limiters so verification attempts never burn the send budget.
router.post("/register/initiate", otpSendLimit, initiateRegister);
router.post("/register/resend", otpSendLimit, resendOtp);
router.post("/register/verify", otpVerifyLimit, verifyRegisterOtp);

router.post("/signin", loginLimiter, loginEmailLock, signIn);

// Unlock a second role using existing email + password (no session required).
// Uses the same per-email lockout as /signin — this endpoint is just as
// much a password-guessing target and previously only had the coarser
// per-IP limiter.
router.post(
  "/role/add-with-credentials",
  loginLimiter,
  loginEmailLock,
  addRoleWithCredentials,
);

// Add a secondary role to an already signed-in, email-verified account.
// No OTP — authentication is proven by the bearer token (requireAuth).
router.post("/role/add", requireAuth, addRole);

module.exports = router;
