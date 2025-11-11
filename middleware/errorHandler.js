const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Sequelize validation error
  if (err.name === "SequelizeValidationError") {
    const errors = err.errors.map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  // Sequelize unique constraint error
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry",
      errors: [err.errors[0].message],
    });
  }

  // Sequelize foreign key constraint error
  if (err.name === "SequelizeForeignKeyConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Invalid reference to related data",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Multer file upload errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Too many files",
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  // ✅ اصلاح‌شده با template literal درست
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
