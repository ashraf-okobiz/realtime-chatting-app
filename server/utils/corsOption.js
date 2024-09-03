const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8000",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true, // Enable this if you need to send cookies with requests
};

module.exports = corsOptions;
