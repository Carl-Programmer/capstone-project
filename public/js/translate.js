const inputField = document.getElementById('tagalogInput');
const outputField = document.getElementById('chavacanoOutput');

let allWords = [];
let tagalogMap = new Map();
let sentences = [];
let singleWords = [];
let debounceTimer;

/* ===============================
   LOAD + PREPROCESS
================================= */
window.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/users/all-words');
  allWords = await res.json();

  allWords.forEach(entry => {
    const tl = entry.tagalog.toLowerCase().trim();

    tagalogMap.set(tl, entry);

    if (tl.includes(" ")) {
      sentences.push(entry);
    } else {
      singleWords.push(entry);
    }
  });
});

/* ===============================
   UTILITIES
================================= */

// Normalize text
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[.,!?]/g, "")
    .trim();
}

// Normalize for comparison (remove vowels and repeated letters)
function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/[aeiou]/g, "") // remove vowels
    .replace(/(.)\1+/g, "$1"); // remove repeated letters
}

// Stopwords (grammar glue words)
const stopwords = [
  "ako", "akong", "ka", "ikaw", "siya",
  "kami", "tayo", "kayo",
  "ang", "ng", "sa", "ni", "kay",
  "ba", "ay", "na"
];

// Remove stopwords for comparison only
function removeStopwords(text) {
  return text
    .split(/\s+/)
    .filter(word => !stopwords.includes(word))
    .join(" ");
}

// Sentence containment check
function isContained(input, target) {

  const cleanInput = removeStopwords(input);
  const cleanTarget = removeStopwords(target);

  const inputWords = cleanInput.split(/\s+/);
  const targetWords = cleanTarget.split(/\s+/);

  return inputWords.every(word => targetWords.includes(word));
}

// Levenshtein (for typo correction only)
function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, () => []);
  for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/* ===============================
   TRANSLATION ENGINE
================================= */
inputField.addEventListener('input', () => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const raw = inputField.value;
    const text = normalize(raw);

    if (!text) {
      outputField.innerHTML =
        '<span class="text-gray-400">Result will appear here…</span>';
      return;
    }

    /* 1️⃣ EXACT MATCH */
    if (tagalogMap.has(text)) {
      outputField.innerHTML =
        `<b>${tagalogMap.get(text).chavacano}</b>`;
      return;
    }
    

/* 2️⃣ SENTENCE CONTAINMENT (MULTIPLE SUGGESTIONS) */
if (text.includes(" ")) {

const matches = sentences.filter(entry => {
  const tl = entry.tagalog.toLowerCase();

  return isContained(text, tl);
}).slice(0, 5);

  if (matches.length > 0) {

outputField.innerHTML = `
  <div class="text-orange-700 font-semibold mb-1">
    Did you mean:
  </div>
  ${matches.map((entry, index) => `
    <div data-index="${index}" 
         class="suggestion text-orange-600 cursor-pointer hover:underline">
      ${entry.tagalog} ⇄ ${entry.chavacano}
    </div>
  `).join("")}
`;

    // Add click behavior to each suggestion
const suggestionElements = outputField.querySelectorAll(".suggestion");

suggestionElements.forEach(element => {
  element.addEventListener("click", () => {
    const index = element.dataset.index;
    inputField.value = matches[index].tagalog;
    inputField.dispatchEvent(new Event("input"));
  });
});

    return;
  }

  /* 3️⃣ WORD BY WORD */
  const words = text.split(/\s+/);
  let result = [];

words.forEach(word => {
  if (tagalogMap.has(word)) {
    result.push(tagalogMap.get(word).chavacano);
  } else {
    result.push(`<span class="text-red-500">${word}</span>`);
  }
  });

  outputField.innerHTML = result.join(" ");
}

/* 4️⃣ SMART PARTIAL MATCH (Single Words Only) */

const partialMatches = singleWords.filter(entry => {
  const tl = entry.tagalog.toLowerCase();

  // Only allow contains if input is long enough
  if (text.length >= 3) {
    return tl.startsWith(text) || tl.includes(text) ;
  }
  // For short inputs (1-2 letters), only allow startsWith
  return tl.startsWith(text);
}).slice(0, 5);

if (partialMatches.length > 0) {
  outputField.innerHTML = partialMatches
    .map(entry => `
      <div class="text-gray-700">
        ${entry.tagalog} → <b>${entry.chavacano}</b>
      </div>
    `)
    .join("");
  return;
}

/* 5️⃣ TYPO SUGGESTION (SENTENCE LEVEL FIRST) */

let bestSentence = null;
let bestScore = 0;

const inputNorm = normalizeWord(text);

sentences.forEach(entry => {
  const tlNorm = normalizeWord(entry.tagalog);

  const inputWords = inputNorm.split(" ");
  let matchCount = 0;

  inputWords.forEach(word => {
    if (tlNorm.includes(word)) matchCount++;
  });

  const wordScore = matchCount / inputWords.length;

  // 🔥 ADD THIS (distance check)
  const distance = levenshtein(inputNorm, tlNorm);

  // dynamic limit (longer sentence = more allowance)
  const maxDistance = Math.max(3, inputNorm.length * 0.3);

  if (
    wordScore > bestScore &&
    wordScore > 0.6 &&
    distance <= maxDistance
  ) {
    bestScore = wordScore;
    bestSentence = entry;
  }
});

if (bestSentence) {
  outputField.innerHTML = `
    <div id="typoSuggestion" class="text-orange-600 cursor-pointer hover:underline">
      Did you mean: <b>${bestSentence.tagalog}</b> ?
    </div>
  `;

  const suggestion = document.getElementById("typoSuggestion");

  suggestion.addEventListener("click", () => {
    inputField.value = bestSentence.tagalog;
    inputField.dispatchEvent(new Event("input"));
  });

  return;
}

/* 5️⃣ TYPO SUGGESTION (FINAL WORKING VERSION) */

console.log("TYPO RUNNING");

const words = text.split(/\s+/);
let correctedWords = [];
let hasCorrection = false;

words.forEach(word => {
  let bestMatch = null;
  let bestDistance = Infinity;

  const inputNorm = normalizeWord(word);

  // 🔥 use allWords so it works with everything
  allWords.forEach(entry => {
    const tlNorm = normalizeWord(entry.tagalog);
    const tlDist = levenshtein(inputNorm, tlNorm);

    if (tlDist < bestDistance) {
      bestDistance = tlDist;
      bestMatch = entry;
    }
  });

  // ✅ relaxed condition (important)
  const maxWordDistance = Math.max(1, Math.floor(word.length * 0.3));

  const similarity = 1 - (bestDistance / word.length);

if (
  bestMatch &&
  bestDistance <= maxWordDistance &&
  similarity >= 0.6
) {
    const corrected = bestMatch.tagalog;

    correctedWords.push(corrected);

    if (corrected !== word) {
      hasCorrection = true;
    }
  } else {
    correctedWords.push(word);
  }
});

// ✅ only show suggestion if something changed
if (hasCorrection) {
  const suggestionSentence = correctedWords.join(" ");

  outputField.innerHTML = `
    <div id="typoSuggestion" class="text-orange-600 cursor-pointer hover:underline">
      Did you mean: <b>${suggestionSentence}</b> ?
    </div>
  `;

  const suggestion = document.getElementById("typoSuggestion");

  suggestion.addEventListener("click", () => {
    inputField.value = suggestionSentence;
    inputField.dispatchEvent(new Event("input"));
  });

  return;
}

    outputField.innerHTML =
      '<span class="text-gray-400">No translation found.</span>';

  }, 120);
});
