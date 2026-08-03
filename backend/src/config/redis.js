const { createClient } = require("redis");
const memoryStore = require("./memory-store");

let client;

// Redis backs auxiliary features (OTP storage, login lockout counters) —
// controllers/middleware are written to fail open when it's unreachable,
// so a slow/flapping connection shouldn't spam the logs on every retry.
// Log at most once every 30s while an outage persists, and clearly log
// recovery so it's obvious when it comes back.
let lastErrorLogAt = 0;
const ERROR_LOG_INTERVAL_MS = 30_000;
let wasConnected = true;

const connectRedis = async () => {
  try {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(1000 * 2 ** retries, 30_000),
      },
    });

    client.on("error", (err) => {
      wasConnected = false;
      const now = Date.now();
      if (now - lastErrorLogAt > ERROR_LOG_INTERVAL_MS) {
        lastErrorLogAt = now;
        console.error("Redis error (auxiliary features degraded):", err.message);
      }
    });

    client.on("ready", () => {
      if (!wasConnected) console.log("Redis reconnected — using real Redis again");
      wasConnected = true;
    });

    await client.connect();

    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection failed:", err.message);
  }
};

// Transparent fallback: whenever the real Redis connection isn't ready
// (never connected, dropped, or connectRedis() itself failed), hand out
// the in-process memory store instead of throwing. Every caller in this
// codebase uses the same small subset of the ioredis/node-redis API, so
// this is a drop-in swap — OTP registration and login lockout keep
// working (single-instance, non-persistent) instead of hard failing
// every auth request during a Redis outage.
const getClient = () => {
  if (client?.isReady) return client;
  return memoryStore;
};

module.exports = {
  connectRedis,
  getClient,
};
