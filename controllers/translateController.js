const Translation = require('../models/Translation');

exports.translateText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "No text provided" });
    }

    const input = text.toLowerCase().trim();

    // Find exact match in database
    const translation = await Translation.findOne({
      tagalog: input
    });

    if (!translation) {
      return res.json({
        translated: "No hay traduccion disponible todavía."
      });
    }

    res.json({
      translated: translation.chavacano
    });

  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
