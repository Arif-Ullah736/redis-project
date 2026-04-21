const { Product } = require("../models");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { getPagination, getPagingData } = require("../utils/pagination");
const { Op } = require("sequelize");
const redisClient = require("../config/redis");

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

  // 🔥 IMPORTANT: clear cache
  await redisClient.del("products");

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const cacheKey = `product:${id}`;

  // 1. Check Redis cache
  const cachedProduct = await redisClient.get(cacheKey);

  if (cachedProduct) {
    return res.status(200).json({
      success: true,
      source: "cache",
      data: JSON.parse(cachedProduct),
      message: "Product retrieved from cache",
    });
  }

  // 2. Fetch from DB
  const product = await Product.findByPk(id);

  if (!product) {
    return next(new ApiError(404, "Product not found"));
  }

  // 3. Store in Redis (expire in 1000 sec)
  await redisClient.set(cacheKey, JSON.stringify(product), {
    EX: 1000,
  });

  return res.status(200).json({
    success: true,
    source: "db",
    data: product,
    message: "Product retrieved from database",
  });
});
