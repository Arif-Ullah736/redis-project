const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const apiRoutes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Global middleware
// Allowlist multiple frontend origins (local dev + production domain)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://mahedeluxe.ae",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(
        new Error("CORS policy: This origin is not allowed"),
        false,
      );
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Xinkaile Hoisting Equipment API is running",
  });
});

// API routes
app.use("/api/v1", apiRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;
