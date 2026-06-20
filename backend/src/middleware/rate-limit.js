const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,

  message: {
    error: "Too many login attempts. Try again in 15 minutes.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
};
