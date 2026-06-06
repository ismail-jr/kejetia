const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth-route");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Configure options in production to restrict domains
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", (req, res) => res.status(200).json({ status: "UP" }));

app.listen(PORT, () => {
  console.log(` Authentication gateway active on port ${PORT}`);
});
