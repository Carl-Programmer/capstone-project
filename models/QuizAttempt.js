const mongoose = require("mongoose");

const QuizAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: false, // ✅ make it optional for final exams
    default: null,   // ✅ add default so it’s cleanly saved
  },

  type: {
  type: String,
  enum: ["Quiz", "FinalExam"],
  default: "Quiz"
},

  // 🧮 Scores
  score: { type: Number, default: 0 }, // points earned
  totalScore: { type: Number, default: 0 }, // total possible points
  percentage: { type: Number, default: 0.0 }, // score in %
  status: {
    type: String,
    enum: ["Passed", "Failed"],
    default: "Failed",
  },

  // 🕒 When they took it
  takenAt: { type: Date, default: Date.now },
  
});

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
