const token = localStorage.getItem("token");
const role = localStorage.getItem("userRole");

const bodyEl = document.getElementById("modUsersBody");
const errorEl = document.getElementById("modError");
const logsEl = document.getElementById("modLogsBody");
const exportBtn = document.getElementById("exportLogsBtn");

if (!token) window.location.href = "login.html";
if (role !== "admin") window.location.href = "index.html";

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

async function fetchUsers() {
  errorEl.textContent = "";

  const res = await fetch("/api/fanhub/users", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load users");
  return data;
}

function renderUsers(users) {
  bodyEl.innerHTML = users.map((u) => {
    const muteBtn = u.role === "admin"
      ? `<button class="btn btn-sm btn-secondary" disabled>Admin</button>`
      : `<button class="btn btn-sm btn-outline-warning me-2 mute-btn" data-id="${u._id}">Mute 10m</button>
         <button class="btn btn-sm btn-outline-success unmute-btn" data-id="${u._id}">Unmute</button>`;

    return `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${fmtDate(u.mutedUntil)}</td>
        <td>${muteBtn}</td>
      </tr>
    `;
  }).join("");
}

async function muteUser(userId, minutes = 10, reason = "") {
  const res = await fetch(`/api/fanhub/mute/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ minutes, reason })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Mute failed");
}

async function unmuteUser(userId, reason = "") {
  const res = await fetch(`/api/fanhub/unmute/${userId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Unmute failed");
}

async function refresh() {
  try {
    const [users, logs] = await Promise.all([fetchUsers(), fetchLogs()]);
    renderUsers(users);
    renderLogs(logs);
  } catch (err) {
    errorEl.textContent = err.message;
  }
}

async function fetchLogs() {
  const res = await fetch("/api/fanhub/logs", {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load logs");
  return data;
}

function renderLogs(logs) {
  if (!logsEl) return;

  logsEl.innerHTML = logs.map((log) => {
    const when = new Date(log.createdAt).toLocaleString();
    const actor = log.actor?.name || "Unknown";
    const target = log.target?.name || "Unknown";
    const mins = log.minutes ?? "-";
    const reason = log.reason ? log.reason : "-";

    return `
      <tr>
        <td>${when}</td>
        <td>${log.action}</td>
        <td>${actor}</td>
        <td>${target}</td>
        <td>${mins}</td>
        <td>${reason}</td>
      </tr>
    `;
  }).join("");
}

function exportLogsCSV() {
  const url = "/api/fanhub/logs/export";
  // include token auth by fetching blob manually
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to export CSV");
      }
      return res.blob();
    })
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `moderation-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    })
    .catch((err) => {
      errorEl.textContent = err.message;
    });
}

if (exportBtn) {
  exportBtn.addEventListener("click", exportLogsCSV);
}

bodyEl.addEventListener("click", async (e) => {
  const muteBtn = e.target.closest(".mute-btn");
  const unmuteBtn = e.target.closest(".unmute-btn");

  try {
   if (muteBtn) {
  const reason = prompt("Reason for mute (optional):", "") || "";
  await muteUser(muteBtn.dataset.id, 10, reason);
  await refresh();
  return;
}
    if (unmuteBtn) {
  const reason = prompt("Reason for unmute (optional):", "") || "";
  await unmuteUser(unmuteBtn.dataset.id, reason);
  await refresh();
  return;
}
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

refresh();