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

router.post("/register/initiate", initiateRegister, otpRateLimit);
router.post("/register/verify", verifyRegisterOtp);

router.post("/signin", loginLimiter, loginEmailLock, signIn);
module.exports = router;
