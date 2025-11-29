// Backend/middleware/errorMiddleware.js
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  const status = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};

module.exports = errorHandler;
