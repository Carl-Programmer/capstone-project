const Translation = require('../models/Translation');
const stringSimilarity = require("string-similarity");

function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[aeiou]/g, "") // remove vowels
    .replace(/(.)\1+/g, "$1"); // remove repeated letters
}

exports.translateText = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "No text provided" });
    }

    const input = text.toLowerCase().trim();

    // Find matches in tagalog (partial, case-insensitive)
    const results = await Translation.find({
         tagalog: { $regex: input, $options: 'i' } 
    }).limit(5);

if (!results.length) {

  // Get all words from database
  const allWords = await Translation.find({});
  const wordList = allWords.map(item => item.tagalog);

  const bestMatch = stringSimilarity.findBestMatch(input, wordList);

  if (bestMatch.bestMatch.rating > 0.5) {
    return res.json({
      translated: null,
      suggestions: [bestMatch.bestMatch.target],
      message: "Did you mean this?"
    });
  }

  return res.json({
    translated: null,
    suggestions: [],
    message: "No translation found yet."
  });
}

    // Detect direction automatically
    const translations = results.map(item => ({
        from: item.tagalog,
        to: item.chavacano,
        category: item.category
      }));

    res.json({
      translated: translations
    });

  } catch (error) {
    console.error("Translation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllWords = async (req, res) => {
  try {
    const words = await Translation.find({}, {
      tagalog: 1,
      chavacano: 1,
      category: 1
    });

    res.json(words);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};