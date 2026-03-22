const token = localStorage.getItem("token");
const messagesEl = document.getElementById("chatMessages");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("chatInput");
const errorEl = document.getElementById("chatError");
const typingEl = document.getElementById("typingIndicator");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const pinnedBannerEl = document.getElementById("pinnedAnnouncement");

if (!token) window.location.href = "login.html";

// Safety guard (prevents null errors if script loads on wrong page)
if (!messagesEl || !formEl || !inputEl || !errorEl) {
  console.error("FanHub elements not found on page.");
} else {
  let currentMessages = [];
  let currentUser = { id: null, role: "user" };
  let typingTimeout = null;
  let isTypingSent = false;

  function syncHeaderHeightVar() {
  const header = document.getElementById("header");
  const h = header ? header.offsetHeight : 120;
  document.documentElement.style.setProperty("--site-header-h", `${h}px`);
}

syncHeaderHeightVar();
window.addEventListener("resize", syncHeaderHeightVar);

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function applyTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("theme-dark", dark);
    if (themeToggleBtn) {
      themeToggleBtn.textContent = dark ? "☀️ Light" : "🌙 Dark";
    }
  }

  const savedTheme = localStorage.getItem("fanhubTheme") || "light";
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
      localStorage.setItem("fanhubTheme", next);
      applyTheme(next);
    });
  }

  function canDeleteMessage(m) {
    if (!currentUser.id) return false;
    const ownerId = m?.user?._id || m?.user?.id;
    return currentUser.role === "admin" || String(ownerId) === String(currentUser.id);
  }

  function updatePinnedBanner(messages) {
  if (!pinnedBannerEl) return;

  const pinned = messages
    .filter((m) => m.pinned)
    .sort((a, b) => new Date(b.pinnedAt || b.createdAt) - new Date(a.pinnedAt || a.createdAt));

  if (pinned.length === 0) {
    pinnedBannerEl.classList.add("d-none");
    pinnedBannerEl.textContent = "";
    return;
  }

  pinnedBannerEl.classList.remove("d-none");
  pinnedBannerEl.textContent = `📌 Announcement: ${pinned[0].text}`;
}

function sortMessages(list) {
  return [...list].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
}

function renderMessages(messages) {
  const ordered = sortMessages(messages);

  messagesEl.innerHTML = ordered.map((m) => {
    const name = escapeHtml(m?.user?.name || "Fan");
    const text = escapeHtml(m?.text || "");
    const ownerId = m?.user?._id || m?.user?.id;
    const isOwn = currentUser.id && String(ownerId) === String(currentUser.id);
    const time = m?.createdAt
      ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    const deleteBtn = canDeleteMessage(m)
      ? `<button class="btn btn-sm btn-outline-danger ms-2 delete-msg-btn" data-id="${m._id}">Delete</button>`
      : "";

    const muteBtn =
      currentUser.role === "admin" && !isOwn
        ? `<button class="btn btn-sm btn-outline-warning ms-2 mute-user-btn" data-user-id="${ownerId}">Mute 10m</button>`
        : "";

    const pinBtn =
      currentUser.role === "admin"
        ? `<button class="btn btn-sm btn-outline-primary ms-2 pin-msg-btn" data-id="${m._id}" data-pin="${m.pinned ? "0" : "1"}">
            ${m.pinned ? "Unpin" : "Pin"}
          </button>`
        : "";

    const pinBadge = m.pinned
      ? `<span class="badge bg-warning text-dark ms-2">📌 Pinned</span>`
      : "";

    const r1 = Number(m?.reactions?.["👍"] || 0);
    const r2 = Number(m?.reactions?.["❤️"] || 0);
    const r3 = Number(m?.reactions?.["😂"] || 0);

    return `
      <div class="fanhub-msg ${isOwn ? "own" : ""}">
        <div class="fanhub-msg-top">
          <span class="fanhub-name">${name}</span>
          <span class="fanhub-time">${time}</span>
          ${pinBadge}
          ${deleteBtn}
          ${muteBtn}
          ${pinBtn}
        </div>
        <div class="fanhub-text">${text}</div>

        <div class="mt-2 d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-light react-btn" data-id="${m._id}" data-emoji="👍">👍 ${r1}</button>
          <button class="btn btn-sm btn-light react-btn" data-id="${m._id}" data-emoji="❤️">❤️ ${r2}</button>
          <button class="btn btn-sm btn-light react-btn" data-id="${m._id}" data-emoji="😂">😂 ${r3}</button>
        </div>
      </div>
    `;
  }).join("");

    messagesEl.scrollTop = messagesEl.scrollHeight;
  updatePinnedBanner(ordered); // <- add this line
}

  // ✅ Initialize socket BEFORE using it
  const socket = io({ auth: { token } });

  socket.on("fanhub:self", (me) => {
    currentUser = me || currentUser;
  });

  socket.on("connect_error", (err) => {
    errorEl.textContent = err.message || "Realtime connection failed";
  });

  socket.on("fanhub:error", (payload) => {
    errorEl.textContent = payload?.message || "Chat error";
  });

  socket.on("fanhub:history", (history) => {
    currentMessages = Array.isArray(history) ? history : [];
    renderMessages(currentMessages);
  });

  socket.on("fanhub:new-message", (msg) => {
    currentMessages.push(msg);
    if (currentMessages.length > 200) currentMessages = currentMessages.slice(-200);
    renderMessages(currentMessages);
  });

  socket.on("fanhub:deleted", ({ messageId }) => {
    currentMessages = currentMessages.filter((m) => String(m._id) !== String(messageId));
    renderMessages(currentMessages);
  });

  socket.on("fanhub:typing", (payload) => {
    const name = payload?.name || "Someone";
    if (typingEl) typingEl.textContent = `${name} is typing...`;
  });

  socket.on("fanhub:stop-typing", () => {
    if (typingEl) typingEl.textContent = "";
  });

  inputEl.addEventListener("input", () => {
    if (!socket.connected) return;

    if (!isTypingSent) {
      socket.emit("fanhub:typing");
      isTypingSent = true;
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("fanhub:stop-typing");
      isTypingSent = false;
    }, 1200);
  });

  socket.on("fanhub:updated", (updatedMsg) => {
  const idx = currentMessages.findIndex((m) => String(m._id) === String(updatedMsg._id));
  if (idx >= 0) currentMessages[idx] = updatedMsg;
  else currentMessages.push(updatedMsg);

  renderMessages(currentMessages);
});

  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const text = inputEl.value.trim();
    if (!text) return;

    socket.emit("fanhub:send", { text });

    if (isTypingSent) {
      socket.emit("fanhub:stop-typing");
      isTypingSent = false;
    }
    if (typingEl) typingEl.textContent = "";

    inputEl.value = "";
  });

  messagesEl.addEventListener("click", async (e) => {
    const delBtn = e.target.closest(".delete-msg-btn");
    if (delBtn) {
      socket.emit("fanhub:delete", { messageId: delBtn.dataset.id });
      return;
    }

    const reactBtn = e.target.closest(".react-btn");
if (reactBtn) {
  socket.emit("fanhub:react", {
    messageId: reactBtn.dataset.id,
    emoji: reactBtn.dataset.emoji
  });
  return;
}
const pinBtn = e.target.closest(".pin-msg-btn");
if (pinBtn) {
  socket.emit("fanhub:pin", {
    messageId: pinBtn.dataset.id,
    pin: pinBtn.dataset.pin === "1"
  });
  return;
}
    const muteBtn = e.target.closest(".mute-user-btn");
    if (muteBtn) {
      try {
        const res = await fetch(`/api/fanhub/mute/${muteBtn.dataset.userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ minutes: 10 })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Mute failed");
        errorEl.textContent = "User muted for 10 minutes.";
      } catch (err) {
        errorEl.textContent = err.message;
      }
    }
  });
}