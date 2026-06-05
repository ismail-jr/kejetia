const express = require("express");
const router = express.Router();
const {
  initiateRegister,
  verifyRegisterOtp,
  signIn,
} = require("../controllers/auth-controller");

// 2. Map the active endpoint routes precisely
router.post("/register/initiate", initiateRegister);
router.post("/register/verify", verifyRegisterOtp);
router.post("/signin", signIn);

module.exports = router;
