const express = require("express");
const router = express.Router();

// const categoryRoutes = require("./category.routes");
const productRoutes = require("./product.routes");

// router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
// Import route modules
// const authRoutes = require("./auth.routes");

// Mount routes
// router.use("/auth", authRoutes);

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

module.exports = router;
