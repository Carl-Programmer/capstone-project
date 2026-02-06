// models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  syllabusPath: { 
    type: String, 
    default: "" 
  },
  certificateFile: {
    type: String, // example: filename.pdf
    default: "1764336652379-BLANK-CERTICATE.pdf"
  },

   archived: { type: Boolean, default: false },

    examSettings: {
    timeLimit: { type: Number, default: 120 }, // minutes
    waitDays: { type: Number, default: 7 },
    passingGrade: { type: Number, default: 7 },
    gradingMethod: { type: String, default: 'highest' },
    description: { type: String, default: 'You have two (2) hours to complete the exam.' }
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


// Export the model
module.exports = mongoose.model('Course', courseSchema);
