const { getClient } = require("../config/redis");

// Per-email login lockout. Recommended policy: after MAX_ATTEMPTS failed
// sign-ins the account is locked for BLOCK_TIME. This mirrors the
// controller, which increments `login_fail:<email>` on each failure and
// sets `login_lock:<email>` once the threshold is hit. Here we simply
// short-circuit while either signal indicates a lock. Fails OPEN if Redis
// is down so a cache outage can't lock everyone out.
const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60; // 15 minutes (kept for reference/consumers)

const loginEmailLock = async (req, res, next) => {
  try {
    const client = getClient();
    const email = (req.body?.email || "").toLowerCase().trim();
    const failKey = `login_fail:${email}`;
    const lockKey = `login_lock:${email}`;

    const [locked, attempts] = await Promise.all([
      client.get(lockKey),
      client.get(failKey),
    ]);

    if (locked || (attempts && Number(attempts) >= MAX_ATTEMPTS)) {
      return res.status(429).json({
        error: "Account temporarily locked. Please try again later.",
      });
    }

    req.loginFailKey = failKey;
    next();
  } catch (err) {
    console.error("login lock error (failing open):", err.message);
    next();
  }
};

module.exports = { loginEmailLock, MAX_ATTEMPTS, BLOCK_TIME };
