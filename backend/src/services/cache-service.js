const { redisClient } = require("../config/redis");

const OTP_PREFIX = "otp:";
const ATTEMPTS_PREFIX = "otp_attempts:";
const LOCK_PREFIX = "otp_lock:";

// ── OTP ──
const saveOtpRecord = async (email, data) => {
  const key = OTP_PREFIX + email;

  await redisClient.set(key, JSON.stringify(data), {
    EX: Math.floor((data.expiresAt - Date.now()) / 1000),
  });
};

const getOtpRecord = async (email) => {
  const data = await redisClient.get(OTP_PREFIX + email);
  return data ? JSON.parse(data) : null;
};

const deleteOtpRecord = async (email) => {
  await redisClient.del(OTP_PREFIX + email);
};

// ── Attempts ──
const getAttempts = async (email) => {
  const val = await redisClient.get(ATTEMPTS_PREFIX + email);
  return val ? Number(val) : 0;
};

const incrAttempts = async (email) => {
  const key = ATTEMPTS_PREFIX + email;

  const count = await redisClient.incr(key);
  await redisClient.expire(key, 10 * 60);

  return count;
};

const resetAttempts = async (email) => {
  await redisClient.del(ATTEMPTS_PREFIX + email);
};

// ── Lock (rate abuse) ──
const isLocked = async (email) => {
  return await redisClient.get(LOCK_PREFIX + email);
};

const lockEmail = async (email, seconds = 300) => {
  await redisClient.set(LOCK_PREFIX + email, "1", { EX: seconds });
};

const unlockEmail = async (email) => {
  await redisClient.del(LOCK_PREFIX + email);
};

module.exports = {
  saveOtpRecord,
  getOtpRecord,
  deleteOtpRecord,
  getAttempts,
  incrAttempts,
  resetAttempts,
  isLocked,
  lockEmail,
  unlockEmail,
};
