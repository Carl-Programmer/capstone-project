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
  },

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

module.exports = mongoose.model('Lesson', lessonSchema);
