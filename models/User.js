const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  givenName: { type: String, required: true },
  surname: { type: String, required: true },
  gender: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  avatar: {
    type: String,
    default: null
  },

  resetToken: String,
  resetTokenExpire: Date,

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  status: {
    type: String,
    enum: ['active', 'deactivated', 'suspended'],
    default: 'active'
  },

  notifEnabled: { 
    type: Boolean, 
    default: true 
  },

  certificates: [{
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course"
  },
  file: String,
  dateIssued: Date
}],

archived: { type: Boolean, default: false },

  resetOTP: { type: String },
  resetOTPExpire: { type: Date },

loginDays: { type: Number, default: 0 },
lastLoginDate: { type: Date },

reasonSuspended: { type: String, default: "" },
reasonArchived: { type: String, default: "" },

});



// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
