const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProduct,
} = require("../controllers/product.controller");

router.post("/", createProduct);
router.get("/:id", getProduct);

module.exports = router;
