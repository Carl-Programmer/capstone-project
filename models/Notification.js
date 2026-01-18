const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// ⭐ STOP creating notification if user disabled notifications
notificationSchema.pre("save", async function (next) {
  const User = require("./User");

  const user = await User.findById(this.userId);

  if (user && user.notifEnabled === false) {
    console.log("Notifications disabled — skipping creation");
    return next(false); // silently cancels the save
  }

  next();
});

module.exports = mongoose.model("Notification", notificationSchema);
