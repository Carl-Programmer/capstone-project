const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // ✅ ADD THIS
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date }
});

module.exports = mongoose.model('LessonProgress', lessonProgressSchema);
