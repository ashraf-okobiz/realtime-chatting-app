const crypto = require("crypto");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const Email = require("../utils/Email");
const catchAsync = require("../utils/catchAsync");
const signToken = require("../utils/signToken");

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.singupController = catchAsync(async (req, res) => {
  const user = await User.create(req.body);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  user.verificationToken = verificationToken;
  user.verificationTokenExpires = Date.now() + 10 * 24 * 60 * 60 * 1000; // Token valid for 10 days
  await user.save({ validateBeforeSave: false });

  const url = `http://localhost:5173/verify?token=${verificationToken}`;
  await new Email(user, url).sendWelcome();

  createSendToken(user, 201, res);
});

exports.verifyUserController = catchAsync(async (req, res, next) => {
  const { token } = req.query;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gte: Date.now() },
  });

  if (!user) {
    return next(new AppError("Invalid or experied token provided", 400));
  }

  user.verified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email verified successfully",
  });
});

exports.loginController = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

exports.forgotPasswordController = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new AppError("Email is required!", 400));

  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("No user found with that email address!", 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get("host")}${
      process.env.BASE_URL
    }auth/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Password reset email sent, Check your inbox please",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email, Try again later!",
        500
      )
    );
  }
});

exports.resetPasswordController = catchAsync(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  const { token } = req.params;

  // 1) Get user based on token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token is invalid or has expired!", 400));

  // 2) If token has not expired, if there is a user with that token, set the new password
  user.password = password;
  user.confirmPassword = confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Log the user in, send JWT
  createSendToken(user, 200, res);
});

// FOR LOGGED IN USER
exports.updatePasswordController = catchAsync(async (req, res, next) => {
  const { currentPassword, password, confirmPassword } = req.body;

  if (!currentPassword) {
    return next(new AppError("Enter your current password please!", 400));
  }

  // 1) Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  if (!user) return next(new AppError("You were not found on server!", 404));

  // 2) Check if POSTed current password is correct
  const isMatched = await user.correctPassword(currentPassword, user.password);
  if (!isMatched) {
    return next(new AppError("Your current password is wrong!", 401));
  }

  // 3) If so, update the password
  user.password = password;
  user.confirmPassword = confirmPassword;
  await user.save();

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});
