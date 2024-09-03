const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat is required"],
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },

    content: {
      type: String,
      required: [true, "Content is required"],
    },
  },
  { timestamps: true }
);

const Message = model("Message", messageSchema);

module.exports = Message;
