const { createClient } = require("redis");

let client;

const connectRedis = async () => {
  try {
    client = createClient({
      url: process.env.REDIS_URL,
    });

    client.on("error", (err) => {
      console.error("Redis error:", err.message);
    });

    await client.connect();

    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection failed:", err.message);
  }
};

const getClient = () => {
  if (!client) throw new Error("Redis not initialized");
  return client;
};

module.exports = {
  connectRedis,
  getClient,
};
