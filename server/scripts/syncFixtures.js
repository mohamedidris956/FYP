/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Fixture = require("../models/Fixture");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

function normalizeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeDate(value) {
  if (!value) return null; // supports TBA
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function run() {
  const dataPath =
    process.argv[2] || path.join(__dirname, "..", "data", "fixturesAndResults.json");

  const raw = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw);

  const rows = Array.isArray(parsed) ? parsed : parsed.fixtures;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("No fixtures found in JSON file.");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  for (const row of rows) {
    const opponent = normalizeText(row.opponent);
    const venue = normalizeText(row.venue);
    const kickOff = normalizeText(row.kickOff);
    const result = normalizeText(row.result);
    const date = normalizeDate(row.date);

    if (!opponent) {
      console.log("Skipped row (missing opponent).");
      continue;
    }

    // Upsert key: opponent + venue + date (or null date for TBA fixture)
    const query = {
      opponent,
      venue,
      date: date || null
    };

    const payload = {
      opponent,
      venue,
      date: date || null,
      kickOff,
      result
    };

    await Fixture.updateOne(query, payload, { upsert: true });
    console.log(`Upserted fixture: ${opponent} @ ${venue} (${date ? date.toISOString() : "TBA"})`);
  }

  await mongoose.disconnect();
  console.log("Fixture sync complete.");
}

run().catch(async (err) => {
  console.error("Failed to sync fixtures:", err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});