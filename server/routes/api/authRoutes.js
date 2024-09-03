const express = require("express");
const protectMiddleware = require("../../middlewares/protectMiddleware");
const {
  singupController,
  verifyUserController,
  loginController,
  forgotPasswordController,
  resetPasswordController,
  updatePasswordController,
} = require("../../controllers/authController");

const router = express.Router();

router.post("/signup", singupController);
router.get("/verify", verifyUserController);
router.post("/login", loginController);
router.post("/forgotPassword", forgotPasswordController);
router.patch("/resetPassword/:token", resetPasswordController);
router.patch("/updateMyPassword", protectMiddleware, updatePasswordController);

module.exports = router;
