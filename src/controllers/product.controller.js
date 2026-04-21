const { Product } = require("../models");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { getPagination, getPagingData } = require("../utils/pagination");
const { Op } = require("sequelize");
// Create Product
exports.createProduct = catchAsync(async (req, res, next) => {
  const { name, description, quantity } = req.body;

  const existingProduct = await Product.findOne({ where: { name } });
  if (existingProduct) {
    return next(new ApiError(400, "Product with this name already exists"));
  }

  const product = await Product.create({
    name,
    description,
    quantity,
  });

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});
