const express = require("express");
const restrictToMiddleware = require("../../middlewares/restrictToMiddleware");
const protectMiddleware = require("../../middlewares/protectMiddleware");
const getMeMiddleware = require("../../middlewares/getMeMiddleware");
const {
  uploadPhotoMiddleware,
  resizePhotoMiddleware,
} = require("../../middlewares/photoMiddleware");
const {
  getAllUsersController,
  getUserController,
  updateUserController,
  deleteUserController,
  updateMeController,
  deleteMeController,
  getMeController,
} = require("../../controllers/userController");

const router = express.Router();

router.use(protectMiddleware); // Check if Logged in or not
router.get("/getMe", getMeMiddleware, getMeController);

router.patch(
  "/updateMe",
  uploadPhotoMiddleware(),
  resizePhotoMiddleware("profile"),
  updateMeController
);

router.delete("/deleteMe", deleteMeController);

router.use(restrictToMiddleware("admin")); // Restrict all route after this middleware
router.get("/", getAllUsersController);

router
  .route("/:id")
  .get(getUserController)
  .patch(updateUserController)
  .delete(deleteUserController);

module.exports = router;
