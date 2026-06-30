const express = require("express");
const router = express.Router();

const {
  initiateRegister,
  resendOtp,
  verifyRegisterOtp,
  signIn,
  addRole,
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

// Add a secondary role to an already signed-in, email-verified account.
// No OTP — authentication is proven by the bearer token (requireAuth).
router.post("/role/add", requireAuth, addRole);

module.exports = router;
