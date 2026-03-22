async function loadNextFixture() {
  try {
    const response = await fetch("/api/fixtures");
    if (!response.ok) throw new Error(`Fixtures request failed: ${response.status}`);

    const fixtures = await response.json();
    if (!Array.isArray(fixtures) || fixtures.length === 0) return;

    fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));
    const nextGame = fixtures[0];

    const opponentEl = document.getElementById("next-opponent");
    const dateEl = document.getElementById("next-date");
    const venueEl = document.getElementById("next-venue");

    if (opponentEl) opponentEl.innerText = `IPY FC vs ${nextGame.opponent}`;
    if (dateEl) dateEl.innerText = new Date(nextGame.date).toLocaleDateString();
    if (venueEl) venueEl.innerText = nextGame.venue;
  } catch (error) {
    console.error("Error loading next fixture:", error);
  }
}

async function loadLeague() {
  try {
    const res = await fetch("/api/league");
    if (!res.ok) throw new Error(`League request failed: ${res.status}`);

    const table = await res.json();
    if (!Array.isArray(table)) return;

    const tbody = document.getElementById("leagueTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    table.sort((a, b) => b.pts - a.pts);

    table.forEach((team, index) => {
      tbody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${team.team}</td>
          <td>${team.mp}</td>
          <td>${team.w}</td>
          <td>${team.d}</td>
          <td>${team.l}</td>
          <td><strong>${team.pts}</strong></td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("Error loading league:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNextFixture();
  loadLeague();
});