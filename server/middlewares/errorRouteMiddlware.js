const AppError = require("../utils/AppError");

const errorRouteMiddleware = (req, res, next) => {
  const error = `Can't find ${req.originalUrl} on this server!`;
  next(new AppError(error, 404));
};

module.exports = errorRouteMiddleware;
