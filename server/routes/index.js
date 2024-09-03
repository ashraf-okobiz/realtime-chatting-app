const express = require("express");
const errorRouteMiddleware = require("../middlewares/errorRouteMiddlware");
const baseURL = process.env.BASE_URL;
const apiRoutes = require("./api");

const router = express.Router();

router.use(baseURL, apiRoutes);
router.all("*", errorRouteMiddleware);

module.exports = router;
