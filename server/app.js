const path = require("path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const bodyParser = require("body-parser");
const cors = require("cors");

const globalErrorMiddleware = require("./middlewares/globalErrorMiddleware");
const routes = require("./routes");
const corsOptions = require("./utils/corsOption"); // Importing the shared CORS configuration

const app = express();

// GLOBAL MIDDLEWARES:
app.use(cors(corsOptions)); // Using shared CORS configuration

app.use(helmet()); // Set security HTTP headers

// Body parsers
app.use(bodyParser.json({ limit: "10kb" })); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Serving static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rate limiting (uncomment and configure as needed)
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: "Too many requests from this IP, please try again after an hour!",
// });
// app.use("/api", limiter);

app.use(routes);
app.use(globalErrorMiddleware);

module.exports = app;
