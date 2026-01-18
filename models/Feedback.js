// models/Feedback.js
const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "reviewed"],
    default: "pending",
  },
  archived: {
    type: Boolean,
    default: false, // ✅ not archived by default
  },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
