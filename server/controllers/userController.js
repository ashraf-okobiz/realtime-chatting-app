const fs = require("fs");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const {
  getAll,
  getOne,
  updateOne,
  deleteOne,
} = require("../utils/handleFactory");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((item) => {
    if (allowedFields.includes(item)) newObj[item] = obj[item];
  });

  return newObj;
};

exports.getAllUsersController = getAll(User);

exports.getUserController = getOne(User);

exports.updateUserController = updateOne(User); // Do NOT update Password with this!

exports.deleteUserController = deleteOne(User);

exports.getMeController = getOne(User);

exports.updateMeController = catchAsync(async (req, res, next) => {
  const { password, confirmPassword } = req.body;
  // 1) Create error if user POSTs password data
  if (password || confirmPassword) {
    return next(
      new AppError(
        "This route is not for password updates, Please use /auth/updateMyPassword.",
        400
      )
    );
  }

  let oldPhotoLink = null;
  if (req.user.photo) {
    const photoName = req.user.photo.split("/");
    oldPhotoLink = `uploads/profile/${photoName[photoName.length - 1]}`;
  }

  // 2) Filtered out unwanted field names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "photo");

  if (req.file) {
    filteredBody.photo = `uploads/profile/${req.file.filename}`;
  } else {
    delete filteredBody.photo;
  }

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  }).select("-__v");

  // Delete old photo if a new one was uploaded and an old photo exists
  if (req.file && oldPhotoLink) {
    fs.unlink(oldPhotoLink, (err) => {
      if (err) {
        console.error("Failed to delete old photo:", err);
      }
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMeController = catchAsync(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
