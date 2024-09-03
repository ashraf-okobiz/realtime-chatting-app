const path = require("path");
const multer = require("multer");
const sharp = require("sharp");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, Please upload images only", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

const uploadPhotoMiddleware = (multiple = false, maxFiles = 4) => {
  return multiple ? upload.array("photos", maxFiles) : upload.single("photo");
};

const resizePhotoMiddleware = (directory) => {
  return catchAsync(async (req, res, next) => {
    // Handle both single and multiple files
    const files = req.file ? [req.file] : req.files || [];

    if (files.length === 0) return next();

    const uniqueSuffix = () =>
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    const processImage = async (file) => {
      // Get the original file extension
      const originalExtension = path.extname(file.originalname);

      file.filename = `${directory}-${uniqueSuffix()}${originalExtension}`;

      const dimensions = {
        profile: { width: 550, height: 550, quality: 95 },
      }[directory] || { width: 500, height: 500, quality: 90 };

      try {
        const transformer = sharp(file.buffer);

        // Ignore resize() for Banner
        if (directory !== "blog") {
          transformer.resize(dimensions.width, dimensions.height);
        }

        transformer
          .toFormat(originalExtension.slice(1)) // Set the format to the original extension
          .toFile(`uploads/${directory}/${file.filename}`, {
            quality: dimensions.quality,
          });

        req.fileName = file.filename; // Save the filename for later use
      } catch (err) {
        return next(new AppError("Failed while processing the image", 500));
      }
    };

    // Process all files
    await Promise.all(files.map(processImage));

    next();
  });
};

module.exports = { uploadPhotoMiddleware, resizePhotoMiddleware };
