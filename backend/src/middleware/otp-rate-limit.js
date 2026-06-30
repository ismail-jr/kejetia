const { getClient } = require("../config/redis");

// ─────────────────────────────────────────────
// Per-email OTP rate limiting
// ─────────────────────────────────────────────
//
// IMPORTANT: sending an OTP and verifying an OTP are throttled with
// SEPARATE counters. Previously a single shared counter was incremented
// by both the initiate and verify routes, so a user who mistyped their
// code a couple of times would trip the limit and see a correct code
// "fail". They are independent now, with recommended limits:
//
//   * send   — 5 requests / 15 min  (initiate + resend combined)
//   * verify — 12 attempts / 15 min (per-IP-ish abuse guard; the
//              controller additionally locks a single OTP after 5 wrong
//              tries, so this is just a coarse network-speed guard)
//
// If Redis is unavailable the limiter fails OPEN (allows the request)
// rather than blocking all auth — availability over strictness here.

const WINDOW = 15 * 60; // 15 minutes

const createOtpLimiter = ({ keyPrefix, max, message }) => {
  return async (req, res, next) => {
    try {
      const client = getClient();
      const email = (req.body?.email || "").toLowerCase().trim();

      if (!email) return next();

      const key = `${keyPrefix}:${email}`;
      const count = await client.incr(key);

      if (count === 1) {
        await client.expire(key, WINDOW);
      }

      if (count > max) {
        return res.status(429).json({ error: message });
      }

      next();
    } catch (err) {
      console.error("otp rate limiter error (failing open):", err.message);
      next();
    }
  };
};

const otpSendLimit = createOtpLimiter({
  keyPrefix: "otp_send",
  max: 5,
  message: "Too many code requests. Please try again in a few minutes.",
});

const otpVerifyLimit = createOtpLimiter({
  keyPrefix: "otp_verify",
  max: 12,
  message: "Too many verification attempts. Please try again later.",
});

module.exports = { otpSendLimit, otpVerifyLimit };
