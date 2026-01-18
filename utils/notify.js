// utils/notify.js
const Notification = require("../models/Notification");

/**
 * Creates a new notification for a user.
 * Handles "notifications disabled" check automatically (via pre-save).
 * 
 * @param {Object} options
 * @param {String} options.userId - The user's MongoDB _id
 * @param {String} options.message - The notification text
 */
async function sendNotification({ userId, message }) {
  try {
    if (!userId || !message) return console.warn("⚠️ Missing userId or message for notification");

    const notif = new Notification({ userId, message });
    await notif.save(); // pre-save hook in model handles notifEnabled
    console.log(`✅ Notification sent to user ${userId}: ${message}`);
  } catch (err) {
    // Suppress error if skipped due to notifEnabled = false
    if (err === false) return;
    console.error("❌ Notification failed:", err.message);
  }
}

module.exports = { sendNotification };
