const express = require("express");
const { body, validationResult } = require("express-validator");
const NewsArticle = require("../models/NewsArticle");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function sanitizeText(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim();
}

const articleValidators = [
  body("title").trim().isLength({ min: 3, max: 140 }),
  body("summary").trim().isLength({ min: 10, max: 220 }),
  body("body")
    .optional({ checkFalsy: true })
    .isLength({ min: 20, max: 12000 }),
  body("content")
    .optional({ checkFalsy: true })
    .isLength({ min: 20, max: 12000 }),
  body("category")
    .optional({ checkFalsy: true })
    .isIn(["match", "club", "player", "interview"]),
  body("image")
    .optional({ checkFalsy: true })
    .isLength({ min: 5, max: 500 }),
  body("imageUrl")
    .optional({ checkFalsy: true })
    .isLength({ min: 5, max: 500 })
];

function normalizeArticlePayload(payload = {}) {
  const title = sanitizeText(payload.title);
  const summary = sanitizeText(payload.summary);
  const content = sanitizeText(payload.body || payload.content);
  const image = sanitizeText(payload.image || payload.imageUrl);
  const slug = sanitizeText(payload.slug) || slugify(title);
  const category = ["match", "club", "player", "interview"].includes(payload.category)
    ? payload.category
    : "club";
  const published = typeof payload.published === "boolean" ? payload.published : true;

  let publishedAt = new Date();
  if (payload.publishedAt) {
    const parsed = new Date(payload.publishedAt);
    if (!Number.isNaN(parsed.getTime())) {
      publishedAt = parsed;
    }
  }

  return {
    title,
    slug,
    category,
    summary,
    body: content,
    image,
    published,
    publishedAt
  };
}

// Public: list published news
router.get("/", async (req, res) => {
  try {
    const items = await NewsArticle.find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: list all (including unpublished)
router.get("/admin/all", protect, admin, async (req, res) => {
  try {
    const items = await NewsArticle.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Public: single published article by slug
router.get("/:slug", async (req, res) => {
  try {
    const item = await NewsArticle.findOne({
      slug: req.params.slug,
      published: true
    }).lean();

    if (!item) return res.status(404).json({ message: "Article not found" });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: create article
router.post("/admin", protect, admin, articleValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const normalized = normalizeArticlePayload(req.body);
    const { slug } = normalized;

    if (!validateNormalizedContent(res, normalized)) return;

    const exists = await NewsArticle.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Slug already exists. Use a different title/slug." });
    }

    const article = await NewsArticle.create({
      ...normalized,
      author: req.user?._id || null
    });

    res.status(201).json(article);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: update article
router.put("/admin/:id", protect, admin, articleValidators, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const normalized = normalizeArticlePayload(req.body);
    const { slug } = normalized;

    if (!validateNormalizedContent(res, normalized)) return;

    const duplicate = await NewsArticle.findOne({ slug, _id: { $ne: req.params.id } });
    if (duplicate) {
      return res.status(400).json({ message: "Slug already exists. Use a different title/slug." });
    }

    const updated = await NewsArticle.findByIdAndUpdate(
      req.params.id,
      normalized,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Article not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: delete article
router.delete("/admin/:id", protect, admin, async (req, res) => {
  try {
    const deleted = await NewsArticle.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Article not found" });

    res.json({ message: "Article deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;