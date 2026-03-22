const badWords = [
  "fuck", "shit", "bitch", "bastard", "cunt", "asshole", "dick"
];

function normalize(text) {
  return String(text || "").toLowerCase();
}

function maskWord(word) {
  if (word.length <= 2) return "*".repeat(word.length);
  return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
}

function applyProfanityFilter(text) {
  let output = String(text || "");
  let wasFiltered = false;

  for (const w of badWords) {
    const re = new RegExp(`\\b${w}\\b`, "gi");
    if (re.test(output)) {
      wasFiltered = true;
      output = output.replace(re, () => maskWord(w));
    }
  }

  return { text: output, wasFiltered };
}

function sanitizeMessage(input) {
  return String(input || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isMuted(user) {
  return !!(user?.mutedUntil && new Date(user.mutedUntil) > new Date());
}

module.exports = {
  normalize,
  applyProfanityFilter,
  sanitizeMessage,
  isMuted
};