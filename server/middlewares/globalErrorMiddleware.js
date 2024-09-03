const multer = require("multer");
const AppError = require("../utils/AppError");

const handleCastErrorDB = (err) => {
  let message;

  if (err.valueType === "Object") {
    message = "Object value is not allowed, Please use proper value!";
  } else {
    message = `Invalid ${err.path}: ${err.value}.`;
  }

  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyPattern).join(" ");

  const capitalizeField =
    field.charAt(0).toUpperCase() + field.slice(1).toLocaleLowerCase();

  const message = `${capitalizeField} already exist, Please use another ${field}.`; // ${err.keyValue.name}
  return new AppError(message, 409);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors)
    .map((item) => item.message)
    .join(", ");

  const message = `Validation failed, ${errors}.`;
  return new AppError(message, 400);
};

const handleParallelExcludeIncludeDB = () => {
  const message = "Cannot perform exclusion & inclusion at the same time.";
  return new AppError(message, 409);
};

const handleJWTError = () => {
  const message = "Invalid token!, Please try again later.";
  return new AppError(message, 401);
};

const handleJWTExpiration = () => {
  const message = "Token has been expired! Try again later.";
  return new AppError(message, 401);
};

const handleMulterError = (err) => {
  let message;

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    message = "Too many files were uploaded";
  } else if (err.code === "LIMIT_FILE_SIZE") {
    message = "File size is too large";
  } else if (err.code === "LIMIT_FILE_COUNT") {
    message = "Too many files uploaded";
  } else {
    message = "File upload error";
  }

  return new AppError(message, 400);
};

const sendErrorProd = (err, req, res) => {
  // A) API ERRORS
  if (req.originalUrl.startsWith("/api")) {
    // 1) Operational, trusted error: Send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // 2) Programming or other unknown errro: Dont't leake error details
    console.error("ERROR --> ", err);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong, Try again!",
    });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (err.name === "CastError") err = handleCastErrorDB(err);
  if (err.code === 11000) err = handleDuplicateFieldsDB(err);
  if (err.name === "ValidationError") err = handleValidationErrorDB(err);
  if (err.code === 31254 || err.code === 31253) {
    err = handleParallelExcludeIncludeDB();
  }
  if (err.name === "JsonWebTokenError") err = handleJWTError();
  if (err.name === "TokenExpiredError") err = handleJWTExpiration();
  if (err instanceof multer.MulterError) err = handleMulterError(err);

  sendErrorProd(err, req, res);
};

module.exports = globalErrorHandler;
