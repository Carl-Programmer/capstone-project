const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  enrolledAt: { type: Date, default: Date.now },
  // progress stored as integer 0..100 (optional; you can update it as users finish lessons)
  progress: { type: Number, default: 0 },
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
