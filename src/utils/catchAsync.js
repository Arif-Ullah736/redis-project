// ─────────────────────────────────────────
// 🛡️ catchAsync — Eliminate try/catch everywhere
// ─────────────────────────────────────────
// Wraps any async controller/middleware function.
// If an error is thrown inside, it automatically
// passes it to the global error handler (errorHandler middleware).
//
// USAGE:
//   const catchAsync = require('../utils/catchAsync');
//
//   const getUser = catchAsync(async (req, res, next) => {
//     const user = await User.findById(req.params.id); // if this throws, no crash!
//     res.status(200).json({ success: true, data: user });
//   });

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
    //                                         ↑
    //                    any error goes straight to errorHandler
  };
};

module.exports = catchAsync;
