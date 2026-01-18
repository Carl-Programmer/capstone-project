// routes/helpRoutes.js
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// POST /help/submit
router.post("/submit", async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.session?.user?._id || null; // optional if not logged in

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    await Feedback.create({ userId, message });
    res.json({ success: true });
  } catch (err) {
    console.error("Feedback save error:", err);
    res.status(500).json({ error: "Server error while saving feedback." });
  }
});

module.exports = router;
