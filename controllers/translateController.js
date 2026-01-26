const Translation = require('../models/Translation');

exports.translateText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "No text provided" });
    }

    const input = text.toLowerCase().trim();

    // Find matches in BOTH languages (partial, case-insensitive)
    const results = await Translation.find({
      $or: [
        { tagalog: { $regex: input, $options: 'i' } },
        { chavacano: { $regex: input, $options: 'i' } }
      ]
    }).limit(5);

    if (!results.length) {
      return res.json({
        translated: null,
        suggestions: [],
        message: "No translation found yet."
      });
    }

    // Detect direction automatically
    const translations = results.map(item => {
      const isTagalogInput = item.tagalog.toLowerCase().includes(input);

      return {
        from: isTagalogInput ? item.tagalog : item.chavacano,
        to: isTagalogInput ? item.chavacano : item.tagalog,
        category: item.category
      };
    });

    res.json({
      translated: translations
    });

  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
