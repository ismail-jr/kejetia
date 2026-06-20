const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth-route");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Production CORS configuration
const allowedOrigins = [
  "http://localhost:3000", // For local frontend development
  "https://kejetia-kayb.vercel.app", // Your live production Vercel frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS policy"));
      }
    },
    credentials: true, // Needed if you plan on passing HTTP-Only cookies or sessions later
  }),
);

// Middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));

app.listen(PORT, () => {
  console.log(`🚀 Authentication gateway active on port ${PORT}`);
});
