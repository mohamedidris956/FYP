(() => {
  const API_BASE =
    localStorage.getItem("apiBaseUrl") ||
    window.__API_BASE_URL ||
    "";
  const buildApiUrl = (path) => `${API_BASE}${path}`;
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  const errorEl = document.getElementById("contactAdminError");
  const successEl = document.getElementById("contactAdminSuccess");
  const tbody = document.querySelector("#contactAdminTable tbody");
  const searchEl = document.getElementById("contactSearchInput");
  const readFilterEl = document.getElementById("contactReadFilter");
  const applyFiltersBtn = document.getElementById("contactApplyFiltersBtn");
  const exportCsvBtn = document.getElementById("contactExportCsvBtn");

  const state = {
    q: "",
    read: ""
  };

  const showError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("d-none");
  };

  const showSuccess = (message) => {
    if (!successEl) return;
    successEl.textContent = message;
    successEl.classList.remove("d-none");
  };

  const clearMessages = () => {
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("d-none");
    }
    if (successEl) {
      successEl.textContent = "";
      successEl.classList.add("d-none");
    }
  };

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`
  });

  const formatDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString();
  };

  const escapeHtml = (value = "") =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.read) params.set("read", state.read);
    const query = params.toString();
    return query ? `?${query}` : "";
  };
const exportCsv = async () => {
  clearMessages();

  const res = await fetch(buildApiUrl(`/api/contact/admin/export.csv${buildQuery()}`), {
    headers: authHeaders()
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to export CSV.");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "contact-submissions.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

if (exportCsvBtn) {
  exportCsvBtn.addEventListener("click", async () => {
    try {
      await exportCsv();
    } catch (err) {
      showError(err.message || "Unable to export CSV.");
    }
  });
}

  const updateExportLink = () => {
    if (!exportCsvBtn) return;
    exportCsvBtn.href = buildApiUrl(`/api/contact/admin/export.csv${buildQuery()}`);
  };

  const loadMessages = async () => {
    clearMessages();

    const res = await fetch(buildApiUrl(`/api/contact/admin${buildQuery()}`), {
      headers: authHeaders()
    });
    const data = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error(data.message || "Failed to load contact messages.");
    }

    if (!tbody) return;

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No contact messages found.</td></tr>`;
      return;
    }

    tbody.innerHTML = data
      .map(
        (item) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.email)}</td>
        <td style="max-width: 420px;">${escapeHtml(item.message)}</td>
        <td>
          ${item.read
            ? '<span class="badge text-bg-success">Read</span>'
            : '<span class="badge text-bg-warning">Unread</span>'}
        </td>
        <td>${escapeHtml(formatDate(item.createdAt))}</td>
        <td class="d-flex gap-1 flex-wrap">
          <button class="btn btn-sm btn-outline-secondary" data-id="${item._id}" data-action="toggle-read" data-read="${item.read ? "true" : "false"}">
            ${item.read ? "Mark Unread" : "Mark Read"}
          </button>
          <button class="btn btn-sm btn-outline-danger" data-id="${item._id}" data-action="delete">Delete</button>
        </td>
      </tr>
    `
      )
      .join("");

    tbody.querySelectorAll('button[data-action="toggle-read"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        clearMessages();
        const currentlyRead = btn.dataset.read === "true";

        const resToggle = await fetch(buildApiUrl(`/api/contact/admin/${btn.dataset.id}/read`), {
          method: "PATCH",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ read: !currentlyRead })
        });

        const err = await resToggle.json().catch(() => ({}));
        if (!resToggle.ok) {
          showError(err.message || "Failed to update read status.");
          return;
        }

        showSuccess(currentlyRead ? "Message marked as unread." : "Message marked as read.");
        await loadMessages();
      });
    });

    tbody.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!confirm("Delete this message?")) return;
        clearMessages();

        const resDelete = await fetch(buildApiUrl(`/api/contact/admin/${btn.dataset.id}`), {
          method: "DELETE",
          headers: authHeaders()
        });
        const err = await resDelete.json().catch(() => ({}));

        if (!resDelete.ok) {
          showError(err.message || "Failed to delete message.");
          return;
        }

        showSuccess("Message deleted.");
        await loadMessages();
      });
    });
  };

  const init = async () => {
    if (!token || role !== "admin") {
      showError("Admin access only. Please sign in with an admin account.");
      return;
    }

    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", async () => {
        state.q = searchEl?.value?.trim() || "";
        state.read = readFilterEl?.value || "";
        updateExportLink();
        try {
          await loadMessages();
        } catch (err) {
          showError(err.message || "Unable to load messages.");
        }
      });
    }

    if (searchEl) {
      searchEl.addEventListener("keydown", async (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        if (applyFiltersBtn) {
          applyFiltersBtn.click();
        }
      });
    }

    updateExportLink();

    try {
      await loadMessages();
    } catch (err) {
      showError(err.message || "Unable to load messages.");
    }
  };

  init();
})();