// Minimal in-process fallback for the small Redis surface this backend
// actually uses (get / set+EX / incr / expire / del). getClient() in
// ./redis.js hands this out automatically whenever the real Redis
// connection isn't ready, so OTP codes and login-lockout counters keep
// working during a Redis outage instead of every auth request hard
// failing with a 500.
//
// Trade-offs vs real Redis (acceptable for keeping a single backend
// instance alive through an outage — NOT a substitute for real Redis in
// a multi-instance/horizontally scaled deployment):
//   - State is lost on process restart.
//   - Not shared across multiple server instances/processes.

const store = new Map(); // key -> { value: string, expiresAt: number|null }

function isExpired(entry) {
  return entry.expiresAt !== null && entry.expiresAt <= Date.now();
}

function read(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (isExpired(entry)) {
    store.delete(key);
    return null;
  }
  return entry;
}

// Periodic sweep so expired keys (e.g. OTPs nobody ever verified) don't
// accumulate in memory indefinitely. unref() so it never keeps the
// process alive on its own.
const sweepInterval = setInterval(() => {
  for (const [key, entry] of store) {
    if (isExpired(entry)) store.delete(key);
  }
}, 60_000);
sweepInterval.unref?.();

const memoryStore = {
  isReady: true,
  isMemoryFallback: true,

  async get(key) {
    const entry = read(key);
    return entry ? entry.value : null;
  },

  async set(key, value, opts) {
    const ttlSeconds = typeof opts?.EX === "number" ? opts.EX : null;
    store.set(key, {
      value: String(value),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
    return "OK";
  },

  async del(key) {
    return store.delete(key) ? 1 : 0;
  },

  async incr(key) {
    const entry = read(key);
    const next = (entry ? Number(entry.value) || 0 : 0) + 1;
    store.set(key, {
      value: String(next),
      expiresAt: entry ? entry.expiresAt : null,
    });
    return next;
  },

  async expire(key, seconds) {
    const entry = read(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    store.set(key, entry);
    return 1;
  },
};

module.exports = memoryStore;
