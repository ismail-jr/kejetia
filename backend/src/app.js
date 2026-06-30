const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth-route");
const { connectRedis } = require("./config/redis");
const { verifyTransporter } = require("./services/email-service");
require("dotenv").config();

connectRedis();
// Validate SMTP config at boot so mail problems show up in logs early
// (non-fatal — the gateway still starts).
verifyTransporter();
const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS policy"));
    },
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

app.listen(PORT, () => {
  console.log(`Authentication gateway active on port ${PORT}`);
});
