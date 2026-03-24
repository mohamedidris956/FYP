/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const LeagueTable = require("../models/LeagueTable");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const TEAM_NAME_ALIASES = {
  "Lourdes Peare FC": "Lourdes Pearse FC",
  "Lourdes Pearse": "Lourdes Pearse FC",
  "Phibsboro Club De Futbol 2nds": "Phibsboro Club de Futbol 2nds",
  "Phibsboro Club de Futbol 2nd": "Phibsboro Club de Futbol 2nds"
};

function normalizeTeamName(name) {
  const cleaned = String(name || "").trim().replace(/\s+/g, " ");
  return TEAM_NAME_ALIASES[cleaned] || cleaned;
}

async function run() {
  const dataPath = process.argv[2] || path.join(__dirname, "..", "data", "leagueTable.json");
  const raw = fs.readFileSync(dataPath, "utf8");
  const parsed = JSON.parse(raw);

  const teams = Array.isArray(parsed) ? parsed : parsed.teams;
  if (!Array.isArray(teams) || teams.length === 0) {
    throw new Error("No teams found in league data file.");
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  for (const entry of teams) {
    const team = normalizeTeamName(String(entry.team || "").trim());
    if (!team) continue;

    const payload = {
      team,
      mp: Number(entry.mp || 0),
      w: Number(entry.w || 0),
      d: Number(entry.d || 0),
      l: Number(entry.l || 0),
      gf: Number(entry.gf || 0),
      ga: Number(entry.ga || 0),
      gd: Number(entry.gd || 0),
      pts: Number(entry.pts || 0)
    };

    await LeagueTable.updateOne({ team }, payload, { upsert: true });
    console.log(`Upserted: ${team}`);
  }

  await mongoose.disconnect();
  console.log("League table sync complete.");
}

run().catch(async (err) => {
  console.error("Failed to sync league table:", err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect errors
  }
  process.exit(1);
});