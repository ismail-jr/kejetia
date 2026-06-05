// Local memory cache that tracks { email: { otp, password, fullName, expiresAt } }
const otpStore = new Map();

const saveOtpRecord = (email, data, ttlInMinutes = 30) => {
  const expiresAt = Date.now() + ttlInMinutes * 60 * 1000;
  otpStore.set(email, { ...data, expiresAt });
};

const getOtpRecord = (email) => {
  const record = otpStore.get(email);
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email); // Clean up expired token
    return null;
  }
  return record;
};

const deleteOtpRecord = (email) => {
  otpStore.delete(email);
};

module.exports = { saveOtpRecord, getOtpRecord, deleteOtpRecord };
