const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  lessonFile: String,
  assessmentFile: String,
  hasQuiz: {
    type: Boolean,
    default: false
  },
  // ✅ New: Soft delete flag
  isArchived: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Lesson', lessonSchema);
