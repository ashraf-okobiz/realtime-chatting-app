require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const corsOptions = require("./utils/corsOption");

// Handle UNCAUGHT EXCEPTIONS
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

// Database Connection
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB)
  .then(() => console.log("Database Connected ✓"))
  .catch((err) => {
    console.error("DB Connection Error -->", err.message);
    process.exit(1);
  });

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io with the same server and shared CORS options
const io = new Server(server, {
  cors: corsOptions,
});

// Socket.io Connection
io.on("connection", (socket) => {
  console.log("A user connected: ", socket.id);

  // Join a chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat: ${chatId}`);
  });

  // Send and receive messages
  socket.on("sendMessage", ({ chatId, senderId, content }) => {
    const message = { chatId, senderId, content, timestamp: new Date() };
    io.to(chatId).emit("messageReceived", message);
  });

  // Handle typing indicator
  socket.on("typing", ({ chatId, senderId }) => {
    socket.to(chatId).emit("typing", { senderId });
  });

  socket.on("stopTyping", ({ chatId, senderId }) => {
    socket.to(chatId).emit("stopTyping", { senderId });
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("A user disconnected: ", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});

// Handle UNHANDLED PROMISE REJECTIONS
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});
