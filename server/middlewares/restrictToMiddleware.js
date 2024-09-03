const AppError = require("../utils/AppError");

const restrictToMiddleware = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have the premission to perform this action",
          403
        )
      );
    }

    next();
  };
};

module.exports = restrictToMiddleware;
