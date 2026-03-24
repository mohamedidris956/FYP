/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const KNOWN_TEAMS = new Set([
  "IPY FC",
  "AFC Belgrave",
  "Clondalkin Celtic",
  "Dunshaughlin Youths FC 2nds",
  "Firhouse Utd",
  "Glasnaion FC 2nds",
  "Larkview FC 3rds",
  "Lourdes Pearse FC",
  "Phibsboro Club de Futbol 2nds",
  "Ronanstown FC 2nds",
  "St Maelruans FC",
  "Stedfast United 2nds",
  "Team Zimbabwe"
]);

function normalize(v) {
  return String(v ?? "").trim();
}

function isValidDateInput(v) {
  if (v === null || v === "") return true; // TBA allowed
  const d = new Date(v);
  return !Number.isNaN(d.getTime());
}

function makeKey(row) {
  // duplicate key for same fixture slot
  return [
    normalize(row.opponent).toLowerCase(),
    normalize(row.venue).toLowerCase(),
    row.date ? new Date(row.date).toISOString() : "tba"
  ].join("|");
}

function validateFile(filePath) {
  const abs = path.resolve(filePath);
  const raw = fs.readFileSync(abs, "utf8");
  const parsed = JSON.parse(raw);

  const fixtures = Array.isArray(parsed) ? parsed : parsed.fixtures;
  if (!Array.isArray(fixtures)) {
    throw new Error("Expected array or object with `fixtures` array.");
  }

  const errors = [];
  const warnings = [];
  const seen = new Map();

  fixtures.forEach((row, idx) => {
    const rowNum = idx + 1;
    const opponent = normalize(row.opponent);
    const venue = normalize(row.venue);
    const kickOff = normalize(row.kickOff);
    const result = normalize(row.result);

    if (!opponent) errors.push(`Row ${rowNum}: missing opponent`);
    if (!venue) errors.push(`Row ${rowNum}: missing venue`);
    if (!isValidDateInput(row.date)) errors.push(`Row ${rowNum}: invalid date "${row.date}"`);

    if (opponent && !KNOWN_TEAMS.has(opponent)) {
      warnings.push(`Row ${rowNum}: unknown team "${opponent}" (crest may not map)`);
    }

    if (kickOff && kickOff !== "TBA" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(kickOff)) {
      warnings.push(`Row ${rowNum}: unusual kickOff "${kickOff}" (expected HH:mm or TBA)`);
    }

    if (result && !/^(\d+)\s*[-:]\s*(\d+)$/.test(result)) {
      warnings.push(`Row ${rowNum}: result "${result}" not in score format like 2-1`);
    }

    const key = makeKey(row);
    if (seen.has(key)) {
      errors.push(`Row ${rowNum}: duplicate fixture (same opponent+venue+date as row ${seen.get(key)})`);
    } else {
      seen.set(key, rowNum);
    }
  });

  return { file: abs, total: fixtures.length, errors, warnings };
}

function run() {
  const filePath =
    process.argv[2] || path.join(__dirname, "..", "data", "fixturesAndResults.json");

  const { file, total, errors, warnings } = validateFile(filePath);

  console.log(`\nValidating: ${file}`);
  console.log(`Total fixtures: ${total}\n`);

  if (warnings.length) {
    console.log("Warnings:");
    warnings.forEach((w) => console.log(`- ${w}`));
    console.log("");
  }

  if (errors.length) {
    console.log("Errors:");
    errors.forEach((e) => console.log(`- ${e}`));
    console.log("\nValidation FAILED");
    process.exit(1);
  }

  console.log("Validation PASSED");
}

try {
  run();
} catch (err) {
  console.error("Validator failed:", err.message);
  process.exit(1);
}