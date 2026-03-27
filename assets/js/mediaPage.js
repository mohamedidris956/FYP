(function () {
  const filtersWrap = document.getElementById("mediaFilters");
  const mediaItems = Array.from(document.querySelectorAll(".media-item"));
  const lightboxEl = document.getElementById("mediaLightbox");
  const lightboxBody = document.getElementById("mediaLightboxBody");

  if (!filtersWrap || !lightboxEl || !lightboxBody) return;

  // Filter logic
  filtersWrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-filter]");
    if (!btn) return;

    const filter = btn.dataset.filter;
    filtersWrap.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    mediaItems.forEach((item) => {
      const type = item.dataset.type;
      const tags = (item.dataset.tags || "").split(" ");

    let show = false;

if (filter === "all") {
  show = true;
} else if (filter === "video") {
  // videos tab excludes highlights + goals
  show = type === "video";
} else if (filter === "highlights") {
  show = type === "highlight" || tags.includes("highlights");
} else if (filter === "goals") {
  show = type === "goal" || tags.includes("goals");
} else {
  show = type === filter || tags.includes(filter);
}

      item.style.display = show ? "" : "none";
    });
  });

  // Lightbox logic
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".media-card");
    if (!card) return;

    const src = card.dataset.src;
    const mediaType = card.dataset.media;
    if (!src) return;

    if (mediaType === "video") {
      lightboxBody.innerHTML = `
        <video controls autoplay class="w-100" style="max-height:80vh;background:#000;">
          <source src="${src}" type="video/mp4">
        </video>
      `;
    } else {
      lightboxBody.innerHTML = `
        <img src="${src}" alt="Media Preview" class="w-100" style="max-height:80vh;object-fit:contain;background:#000;">
      `;
    }

    const modal = bootstrap.Modal.getOrCreateInstance(lightboxEl);
    modal.show();
  });

  // Stop video when modal closes
  lightboxEl.addEventListener("hidden.bs.modal", () => {
    lightboxBody.innerHTML = "";
  });
})();