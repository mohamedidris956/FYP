(() => {
  const API_BASE =
    localStorage.getItem("apiBaseUrl") ||
    window.__API_BASE_URL ||
    "";
  const buildApiUrl = (path) => `${API_BASE}${path}`;

  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("contactSubmitBtn");
  const successEl = document.getElementById("contactSuccess");
  const errorEl = document.getElementById("contactError");

  if (!form) return;

  const clearMessages = () => {
    if (successEl) {
      successEl.textContent = "";
      successEl.classList.add("d-none");
    }
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("d-none");
    }
  };

  const showSuccess = (message) => {
    if (!successEl) return;
    successEl.textContent = message;
    successEl.classList.remove("d-none");
  };

  const showError = (message) => {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.classList.remove("d-none");
};

const getValidationMessage = (data = {}) => {
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    const first = data.errors[0];

    if (first.path === "message") {
      return "Your message is too short. Please write at least 10 characters.";
    }

    if (first.path === "name") {
      return "Your name is too short. Please enter at least 2 characters.";
    }

    if (first.path === "email") {
      return "Please enter a valid email address.";
    }

    if (first.msg) return first.msg;
  }

  return data.message || "Could not send your message. Please try again.";
};

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();

    const name = document.getElementById("contactName")?.value?.trim() || "";
    const email = document.getElementById("contactEmail")?.value?.trim() || "";
    const message = document.getElementById("contactMessage")?.value?.trim() || "";

    if (!name || !email || !message) {
      showError("Please fill out all fields.");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch(buildApiUrl("/api/contact"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          source: "contact-page"
        })
      });

      const data = await res.json().catch(() => ({}));
if (!res.ok) {
  showError(getValidationMessage(data));
  return;
}

      form.reset();
      showSuccess(data.message || "Message sent successfully.");
    } catch (err) {
      console.error("Contact form submit error:", err);
      showError("Server error. Please try again in a moment.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();