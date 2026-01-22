const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema(
  {
    tagalog: {
      type: String,
      required: true,
      trim: true
    },
    chavacano: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'general'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Translation', translationSchema);
