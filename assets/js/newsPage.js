(function () {
  const filtersWrap = document.getElementById("newsFilters");
  const newsGrid = document.getElementById("newsGrid");
  const loadingEl = document.getElementById("newsLoading");
  const modalEl = document.getElementById("newsModal");

  const titleEl = document.getElementById("newsModalTitle");
  const imageEl = document.getElementById("newsModalImage");
  const dateEl = document.getElementById("newsModalDate");
  const bodyEl = document.getElementById("newsModalBody");

  const featuredTitleEl = document.querySelector(".news-featured-card h2");
  const featuredTextEl = document.querySelector(".news-featured-card p");
  const featuredImgEl = document.querySelector(".news-featured-img");

  let allArticles = [];
  let currentFilter = "all";
  let modal = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeCategory(cat) {
    const v = String(cat || "").toLowerCase();
    return ["match", "club", "player", "interview"].includes(v) ? v : "club";
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IE", { year: "numeric", month: "long", day: "numeric" });
  }

  function excerpt(text, max = 120) {
    const clean = String(text || "").trim();
    return clean.length > max ? `${clean.slice(0, max)}...` : clean;
  }

  function categoryBadge(category) {
    switch (category) {
      case "match":
        return `<span class="badge bg-primary-subtle text-primary-emphasis mb-2">Match Report</span>`;
      case "player":
        return `<span class="badge bg-warning-subtle text-warning-emphasis mb-2">Player News</span>`;
      case "interview":
        return `<span class="badge bg-info-subtle text-info-emphasis mb-2">Interview</span>`;
      default:
        return `<span class="badge bg-success-subtle text-success-emphasis mb-2">Club Update</span>`;
    }
  }

  function applyFilter(items, filter) {
    if (filter === "all") return items;
    return items.filter((a) => normalizeCategory(a.category) === filter);
  }

  function renderFeatured() {
    if (!allArticles.length) return;

    // Prefer a club update for featured, fallback to newest article
    const featured = allArticles.find((a) => normalizeCategory(a.category) === "club") || allArticles[0];

    if (featuredTitleEl) featuredTitleEl.textContent = featured.title || "Latest Club Update";
    if (featuredTextEl) featuredTextEl.textContent = excerpt(featured.summary || featured.body, 180);
    if (featuredImgEl && featured.image) featuredImgEl.src = featured.image;
  }

  function renderGrid() {
    if (!newsGrid) return;

    const filtered = applyFilter(allArticles, currentFilter);

    if (filtered.length === 0) {
      newsGrid.innerHTML = `<div class="col-12 text-center text-muted">No articles found for this category.</div>`;
      return;
    }

    newsGrid.innerHTML = filtered.map((article, idx) => {
      const category = normalizeCategory(article.category);
      const summary = article.summary || excerpt(article.body, 130);
      const delay = (idx % 3) * 100;

      return `
        <div class="col-md-6 col-lg-4 news-item" data-category="${escapeHtml(category)}" data-aos="zoom-in" data-aos-delay="${delay}">
          <div class="card h-100 shadow-sm border-0 news-card">
            <img src="${escapeHtml(article.image || "assets/img/news/news1.jpg")}" class="news-img card-img-top" alt="${escapeHtml(article.title || "News image")}">
            <div class="card-body">
              ${categoryBadge(category)}
              <h5 class="card-title fw-bold">${escapeHtml(article.title || "News Update")}</h5>
              <p class="card-text text-muted">${escapeHtml(summary)}</p>
              <button class="btn btn-outline-success btn-sm w-100 open-news-modal" data-article-slug="${escapeHtml(article.slug)}">
                Read More
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function setupFilters() {
    if (!filtersWrap) return;

    filtersWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;

      currentFilter = btn.dataset.filter || "all";
      filtersWrap.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      renderGrid();
    });

    document.querySelectorAll(".news-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.dataset.filter || "all";
        const target = filtersWrap.querySelector(`button[data-filter="${filter}"]`);
        if (target) target.click();

        if (newsGrid) newsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function setupModal() {
    if (!modalEl || !window.bootstrap) return;
    modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".open-news-modal");
      if (!btn) return;

      const slug = btn.dataset.articleSlug;
      const article = allArticles.find((a) => a.slug === slug);
      if (!article) return;

      if (titleEl) titleEl.textContent = article.title || "News Update";
      if (dateEl) dateEl.textContent = formatDate(article.publishedAt || article.createdAt || article.date);
      if (bodyEl) bodyEl.textContent = article.body || article.summary || "";
      if (imageEl) {
        imageEl.src = article.image || "";
        imageEl.alt = article.title || "News image";
        imageEl.style.display = article.image ? "block" : "none";
      }

      modal.show();
    });
  }

  async function loadNews() {
    try {
      const res = await fetch("/api/news");
      if (!res.ok) throw new Error(`Failed to load news: ${res.status}`);

      const data = await res.json();
      allArticles = Array.isArray(data) ? data : [];

      allArticles.sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt || 0) -
          new Date(a.publishedAt || a.createdAt || 0)
      );

      if (loadingEl) loadingEl.remove();

      renderFeatured();
      renderGrid();
    } catch (err) {
      console.error("News load error:", err);
      if (newsGrid) {
        newsGrid.innerHTML = `<div class="col-12 text-center text-danger">Could not load news right now.</div>`;
      }
    }
  }

  setupFilters();
  setupModal();
  loadNews();
})();