const DEFAULT_COMPETITION = "UCFL Division 3C";
const IPY_TEAM_NAME = "IPY FC";
const IPY_CREST = "assets/img/IPYlogo.jpg";
const DEFAULT_CREST = "assets/img/crest/zimbabwe.jpg";

const TEAM_CRESTS = {
  "AFC Belgrave": "assets/img/crest/belgrave.jpg",
  "Clondalkin Celtic": "assets/img/crest/clondalkinceltic.jpg",
  "Dunshaughlin Youths FC 2nds": "assets/img/crest/dunshauglin.jpg",
  "Firhouse Utd": "assets/img/crest/firhouseunited.jpg",
  "Glasnaion FC 2nds": "assets/img/crest/glasnion.jpg",
  "Larkview FC 3rds": "assets/img/crest/larkview.jpg",
  "Lourdes Pearse FC": "assets/img/crest/lourdesceltic.jpg",
  "Phibsboro Club de Futbol 2nds": "assets/img/crest/phibsboro.jpg",
  "Ronanstown FC 2nds": "assets/img/crest/ronanstown.jpg",
  "St Maelruans FC": "assets/img/crest/maulerins.jpg",
  "Stedfast United 2nds": "assets/img/crest/stedfastunited.jpg",
  "Team Zimbabwe": "assets/img/crest/zimbabwe.jpg",
  "IPY FC": IPY_CREST
};
const TEAM_NAME_ALIASES = {
  "Phibsboro Club de Futbol 2nds": "Phibsboro Club de Futbol 2nds",
  "Phibsboro Club de Futbol 2nd": "Phibsboro Club de Futbol 2nds",
  "Phibsboro Club De Futbol 2nds": "Phibsboro Club de Futbol 2nds",
  "Lourdes Peare FC": "Lourdes Pearse FC",
  "Lourdes Pearse": "Lourdes Pearse FC",
  "Lourdes Pearse Fc": "Lourdes Pearse FC"
};

function normalizeTeamName(name) {
  const cleaned = String(name || "").trim().replace(/\s+/g, " ");
  return TEAM_NAME_ALIASES[cleaned] || cleaned;
}

function getTodayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getCrestForTeam(team) {
  const normalized = normalizeTeamName(team);
  return TEAM_CRESTS[normalized] || DEFAULT_CREST;
}

function normalizeFixture(raw) {
  const opponent = String(raw?.opponent || "TBA").trim() || "TBA";
  const date = raw?.date ? new Date(raw.date) : null;
  const hasValidDate = date instanceof Date && !Number.isNaN(date.getTime());
  const result = String(raw?.result || "").trim();

  return {
    ...raw,
    opponent,
    venue: String(raw?.venue || "TBA"),
    result,
    date: hasValidDate ? date : null,
    hasResult: Boolean(result)
  };
}

function formatFixtureDate(date, fallback = "TBA") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("en-IE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function parseScore(resultText) {
  const match = String(resultText || "").match(/(\d+)\s*[-:]\s*(\d+)/);
  if (!match) return "-";
  return `${match[1]} - ${match[2]}`;
}

function sortByDateAsc(a, b) {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1; // TBA last
  if (!b.date) return -1;
  return a.date - b.date;
}

function sortByDateDesc(a, b) {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1; // TBA last
  if (!b.date) return -1;
  return b.date - a.date;
}

function renderNextFixture(fixtures) {
  const todayStart = getTodayStart();

const upcoming = fixtures
  .filter((f) => {
    if (f.hasResult) return false;
    if (!f.date) return true; // TBA still upcoming
    return f.date >= todayStart; // only future/today dated fixtures
  })
  .sort(sortByDateAsc);

  const next = upcoming[0] || { opponent: "TBA", venue: "To Be Confirmed", date: null };

  const opponentEl = document.getElementById("next-opponent");
  const dateEl = document.getElementById("next-date");
  const venueEl = document.getElementById("next-venue");
  const homeCrestEl = document.getElementById("next-home-crest");
  const awayCrestEl = document.getElementById("next-away-crest");

  if (opponentEl) opponentEl.textContent = `${IPY_TEAM_NAME} vs ${next.opponent}`;
  if (dateEl) dateEl.textContent = formatFixtureDate(next.date, "TBA");
  if (venueEl) venueEl.textContent = next.venue || "To Be Confirmed";
  if (homeCrestEl) homeCrestEl.src = IPY_CREST;
  if (awayCrestEl) awayCrestEl.src = getCrestForTeam(next.opponent);
}

function renderLatestResult(fixtures) {
  const results = fixtures.filter((f) => f.hasResult).sort(sortByDateDesc);
  const latest = results[0] || { opponent: "TBA", result: "", date: null };

  const opponentEl = document.getElementById("latest-result-opponent");
  const scoreEl = document.getElementById("latest-result-score");
  const dateEl = document.getElementById("latest-result-date");
  const homeCrestEl = document.getElementById("result-home-crest");
  const awayCrestEl = document.getElementById("result-away-crest");

  if (opponentEl) opponentEl.textContent = `${IPY_TEAM_NAME} vs ${latest.opponent}`;
  if (scoreEl) scoreEl.textContent = parseScore(latest.result);
  if (dateEl) dateEl.textContent = formatFixtureDate(latest.date, "TBA");
  if (homeCrestEl) homeCrestEl.src = IPY_CREST;
  if (awayCrestEl) awayCrestEl.src = getCrestForTeam(latest.opponent);
}

function renderFullFixtures(fixtures) {
  const tbody = document.getElementById("fullFixturesBody");
  if (!tbody) return;

  const todayStart = getTodayStart();

  const upcoming = fixtures
    .filter((f) => {
      if (f.hasResult) return false;
      if (!f.date) return true; // TBA entries
      return f.date >= todayStart;
    })
    .sort(sortByDateAsc);

  tbody.innerHTML = upcoming.map((f) => {
    const displayName = normalizeTeamName(f.opponent);

    return `
      <tr>
        <td>${escapeHtml(formatFixtureDate(f.date, "TBA"))}</td>
        <td>
          <div class="team-with-crest">
            <img src="${IPY_CREST}" alt="${IPY_TEAM_NAME} crest" class="table-crest">
            <span>${IPY_TEAM_NAME}</span>
          </div>
        </td>
        <td>
          <div class="team-with-crest">
            <img src="${escapeHtml(getCrestForTeam(displayName))}" alt="${escapeHtml(displayName)} crest" class="table-crest">
            <span>${escapeHtml(displayName)}</span>
          </div>
        </td>
        <td>${escapeHtml(f.venue)}</td>
      </tr>
    `;
  }).join("");
}

function renderFullResults(fixtures) {
  const tbody = document.getElementById("fullResultsBody");
  if (!tbody) return;

  const todayStart = getTodayStart();

const results = fixtures
  .filter((f) => {
    if (!f.hasResult) return false;
    if (!f.date) return true;
    return f.date <= todayStart;
  })
  .sort(sortByDateDesc);

  tbody.innerHTML = results.map((f) => `
    <tr>
      <td>${escapeHtml(formatFixtureDate(f.date, "TBA"))}</td>
      <td>
        <div class="team-with-crest">
          <img src="${IPY_CREST}" alt="${IPY_TEAM_NAME} crest" class="table-crest">
          <span>${IPY_TEAM_NAME}</span>
        </div>
      </td>
      <td class="fw-bold">${escapeHtml(parseScore(f.result))}</td>
      <td>
        <div class="team-with-crest">
          <img src="${escapeHtml(getCrestForTeam(f.opponent))}" alt="${escapeHtml(f.opponent)} crest" class="table-crest">
          <span>${escapeHtml(f.opponent)}</span>
        </div>
      </td>
      <td>${escapeHtml(f.venue)}</td>
    </tr>
  `).join("");
}

async function loadFixturesAndResults() {
  try {
    const response = await fetch("/api/fixtures");
    if (!response.ok) throw new Error(`Fixtures request failed: ${response.status}`);

    const fixtures = await response.json();
    if (!Array.isArray(fixtures)) return;

    const normalized = fixtures.map(normalizeFixture);

    renderNextFixture(normalized);
    renderLatestResult(normalized);
    renderFullFixtures(normalized);
    renderFullResults(normalized);
  } catch (error) {
    console.error("Error loading fixtures/results:", error);
  }
}

function renderLeague(table) {
  const tbody = document.getElementById("leagueTableBody");
  if (!tbody) return;

  tbody.innerHTML = table.map((team, index) => `
    <tr>
      <td>${index + 1}</td>
      <td class="text-start">
        <div class="team-with-crest">
          <img src="${escapeHtml(getCrestForTeam(team.team))}" alt="${escapeHtml(team.team)} crest" class="table-crest">
          <span>${escapeHtml(team.team)}</span>
        </div>
      </td>
      <td>${Number(team.mp ?? 0)}</td>
      <td>${Number(team.w ?? 0)}</td>
      <td>${Number(team.d ?? 0)}</td>
      <td>${Number(team.l ?? 0)}</td>
      <td><strong>${Number(team.pts ?? 0)}</strong></td>
    </tr>
  `).join("");
}

function dedupeLeagueRows(rows) {
  const byTeam = new Map();

  rows.forEach((row) => {
    const canonicalName = normalizeTeamName(row.team);
    const current = byTeam.get(canonicalName);

    // Keep the row with higher points (or latest if tied)
    if (!current || Number(row.pts ?? 0) >= Number(current.pts ?? 0)) {
      byTeam.set(canonicalName, { ...row, team: canonicalName });
    }
  });

  return Array.from(byTeam.values());
}

async function loadLeague() {
  try {
    const res = await fetch("/api/league");
    if (!res.ok) throw new Error(`League request failed: ${res.status}`);

    const table = await res.json();
    if (!Array.isArray(table)) return;

    const uniqueTable = dedupeLeagueRows(table);
    uniqueTable.sort((a, b) => Number(b.pts ?? 0) - Number(a.pts ?? 0));
    renderLeague(uniqueTable);

    const competitionEl = document.getElementById("leagueCompetitionName");
    if (competitionEl) competitionEl.textContent = DEFAULT_COMPETITION;
  } catch (err) {
    console.error("Error loading league:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Existing page loads
  loadFixturesAndResults();
  loadLeague();

  // Collapse toggle button text handling
  const fixturesCollapse = document.getElementById("full-fixtures-collapse");
  const resultsCollapse = document.getElementById("full-results-collapse");
  const fixturesBtn = document.getElementById("toggleFixturesBtn");
  const resultsBtn = document.getElementById("toggleResultsBtn");

  if (fixturesCollapse && fixturesBtn) {
    fixturesCollapse.addEventListener("shown.bs.collapse", () => {
      fixturesBtn.textContent = "Hide Full Fixtures";
    });
    fixturesCollapse.addEventListener("hidden.bs.collapse", () => {
      fixturesBtn.textContent = "View Full Fixtures";
    });
  }

  if (resultsCollapse && resultsBtn) {
    resultsCollapse.addEventListener("shown.bs.collapse", () => {
      resultsBtn.textContent = "Hide Full Results";
    });
    resultsCollapse.addEventListener("hidden.bs.collapse", () => {
      resultsBtn.textContent = "View Full Results";
    });
  }
});