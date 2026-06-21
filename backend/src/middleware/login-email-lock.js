const { getClient } = require("../config/redis");

const MAX_ATTEMPTS = 5;
const BLOCK_TIME = 15 * 60; // 15 minutes

const loginEmailLock = async (req, res, next) => {
  const client = getClient();

  const email = (req.body.email || "").toLowerCase().trim();
  const key = `login_fail:${email}`;

  const attempts = await client.get(key);

  if (attempts && Number(attempts) >= MAX_ATTEMPTS) {
    return res.status(429).json({
      error: "Account locked. Try again later.",
    });
  }

  req.loginFailKey = key;
  next();
};

module.exports = { loginEmailLock };
