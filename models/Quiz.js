const mongoose = require('mongoose');

const QuizSchema = new mongoose.Schema({
  // 🔹 Either lesson-based or course-based (final exam)
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },

  // 🔹 Distinguish between normal quiz and final exam
  isFinalExam: { type: Boolean, default: false },

  // 🔹 Quiz details
  title: { type: String, required: true },
  description: { 
    type: String, 
    default: "Answer all questions carefully. You must score at least the passing grade to pass this quiz." 
  },

  questions: [
    {
      questionText: { type: String, required: true },
      options: [String],
      correctAnswer: { type: String, required: true },
      points: { type: Number, default: 1 },
    },
  ],

  // 🔹 Quiz settings
  timeLimit: { type: Number, default: 1800 }, // seconds (default 30 minutes)
  passingGrade: { type: Number, default: 7 }, // out of 10
  gradingMethod: { type: String, default: "highest" }, // fixed for now

  createdAt: { type: Date, default: Date.now },

  reviewStatus: {
  type: String,
  enum: ['draft', 'pending', 'approved', 'rejected'],
  default: 'draft'
},

reviewedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  default: null
},

reviewedAt: {
  type: Date,
  default: null
},

reviewNotes: {
  type: String,
  default: ""
}

});

module.exports = mongoose.model("Quiz", QuizSchema);
