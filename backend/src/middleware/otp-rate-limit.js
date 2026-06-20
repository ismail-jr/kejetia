const { getClient } = require("../config/redis");

const OTP_LIMIT = 3;
const WINDOW = 10 * 60; // 10 minutes

const otpRateLimit = async (req, res, next) => {
  const client = getClient();

  const email = (req.body.email || "").toLowerCase().trim();
  const key = `otp_req:${email}`;

  const count = await client.incr(key);

  if (count === 1) {
    await client.expire(key, WINDOW);
  }

  if (count > OTP_LIMIT) {
    return res.status(429).json({
      error: "Too many OTP requests. Try later.",
    });
  }

  next();
};

module.exports = { otpRateLimit };
