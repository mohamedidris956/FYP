(() => {
  const IPY_TEAM = "IPY FC";
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

  const TEAM_ALIASES = {
    "Phibsboro Club de Futbol 2nd": "Phibsboro Club de Futbol 2nds",
    "Phibsboro Club De Futbol 2nds": "Phibsboro Club de Futbol 2nds",
    "Lourdes Peare FC": "Lourdes Pearse FC",
    "Lourdes Pearse": "Lourdes Pearse FC",
    "Lourdes Pearse Fc": "Lourdes Pearse FC"
  };

  function normalizeTeamName(name) {
    const cleaned = String(name || "").trim().replace(/\s+/g, " ");
    return TEAM_ALIASES[cleaned] || cleaned;
  }

  function crestFor(team) {
    const normalized = normalizeTeamName(team);
    return TEAM_CRESTS[normalized] || DEFAULT_CREST;
  }

  function getTodayStart() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }

  function formatDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "TBA";
    return date.toLocaleDateString("en-IE", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function normalizeFixture(raw) {
    const date = raw?.date ? new Date(raw.date) : null;
    const hasValidDate = date instanceof Date && !Number.isNaN(date.getTime());

    return {
      opponent: String(raw?.opponent || "TBA").trim() || "TBA",
      venue: String(raw?.venue || "To Be Confirmed").trim() || "To Be Confirmed",
      date: hasValidDate ? date : null,
      hasResult: Boolean(String(raw?.result || "").trim())
    };
  }

  function pickNextFixture(fixtures) {
    const todayStart = getTodayStart();

    const upcoming = fixtures
      .filter((f) => {
        if (f.hasResult) return false;
        if (!f.date) return true;
        return f.date >= todayStart;
      })
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date - b.date;
      });

    return upcoming[0] || {
      opponent: "TBA",
      venue: "To Be Confirmed",
      date: null
    };
  }

  function renderHeroFixture(next) {
    const heroDate = document.getElementById("hero-next-date");
    const heroVenue = document.getElementById("hero-next-venue");
    const heroOpponent = document.getElementById("hero-next-opponent");

    if (heroDate) heroDate.textContent = formatDate(next.date);
    if (heroVenue) heroVenue.textContent = next.venue;
    if (heroOpponent) heroOpponent.textContent = `${IPY_TEAM} vs ${next.opponent}`;
  }

  function renderHomeFixtureCard(next) {
    const awayNameEl = document.getElementById("home-next-away-name");
    const dateEl = document.getElementById("home-next-date");
    const venueEl = document.getElementById("home-next-venue");
    const homeCrestEl = document.getElementById("home-next-home-crest");
    const awayCrestEl = document.getElementById("home-next-away-crest");

    if (awayNameEl) awayNameEl.textContent = next.opponent;
    if (dateEl) dateEl.textContent = formatDate(next.date);
    if (venueEl) venueEl.textContent = next.venue;
    if (homeCrestEl) homeCrestEl.src = IPY_CREST;
    if (awayCrestEl) awayCrestEl.src = crestFor(next.opponent);
  }

  function renderStats(tableRows) {
    const playedEl = document.getElementById("hero-stat-played");
    const winsEl = document.getElementById("hero-stat-wins");
    const pointsEl = document.getElementById("hero-stat-points");

    const ipy = (Array.isArray(tableRows) ? tableRows : []).find(
      (row) => normalizeTeamName(row.team) === IPY_TEAM
    );

    if (!ipy) return;

    if (playedEl) playedEl.textContent = Number(ipy.mp ?? 0);
    if (winsEl) winsEl.textContent = Number(ipy.w ?? 0);
    if (pointsEl) pointsEl.textContent = Number(ipy.pts ?? 0);
  }

  async function loadHomeData() {
    try {
      const [fixturesRes, leagueRes] = await Promise.all([
        fetch("/api/fixtures"),
        fetch("/api/league")
      ]);

      const fixturesData = fixturesRes.ok ? await fixturesRes.json() : [];
      const leagueData = leagueRes.ok ? await leagueRes.json() : [];

      const fixtures = Array.isArray(fixturesData)
        ? fixturesData.map(normalizeFixture)
        : [];

      const next = pickNextFixture(fixtures);
      renderHeroFixture(next);
      renderHomeFixtureCard(next);

      if (Array.isArray(leagueData)) {
        renderStats(leagueData);
      }
    } catch (err) {
      console.error("Failed to load homepage dynamic data:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", loadHomeData);
})();