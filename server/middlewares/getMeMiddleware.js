const getMeMiddleware = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

module.exports = getMeMiddleware;
