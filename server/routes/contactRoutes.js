const express = require("express");
const { body, validationResult } = require("express-validator");
const ContactMessage = require("../models/ContactMessage");
const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

function sanitizeText(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim();
}

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters."),
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("message").trim().isLength({ min: 10, max: 5000 }).withMessage("Message must be between 10 and 5000 characters."),
    body("source").optional({ checkFalsy: true }).trim().isLength({ max: 80 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const list = errors.array();
        return res.status(400).json({
          message: list[0]?.msg || "Validation failed",
          errors: list
        });
      }

      const saved = await ContactMessage.create({
        name: sanitizeText(req.body.name),
        email: sanitizeText(req.body.email).toLowerCase(),
        message: sanitizeText(req.body.message),
        source: sanitizeText(req.body.source || "website")
      });

      res.status(201).json({
        message: "Thanks, your message has been received.",
        id: saved._id
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/admin", protect, admin, async (req, res) => {
  try {
    const query = {};
    const search = sanitizeText(req.query.q || "");
    const read = sanitizeText(req.query.read || "");

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }

    if (read === "true") query.read = true;
    if (read === "false") query.read = false;

    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/admin/:id/read", protect, admin, async (req, res) => {
  try {
    const read = Boolean(req.body?.read);
    const updated = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { read, readAt: read ? new Date() : null },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/admin/:id", protect, admin, async (req, res) => {
  try {
    const deleted = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.json({ message: "Message deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/export.csv", protect, admin, async (req, res) => {
  try {
    const query = {};
    const search = sanitizeText(req.query.q || "");
    const read = sanitizeText(req.query.read || "");

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } }
      ];
    }

    if (read === "true") query.read = true;
    if (read === "false") query.read = false;

    const messages = await ContactMessage.find(query).sort({ createdAt: -1 }).lean();

    const escapeCsv = (value = "") => `"${String(value).replace(/"/g, '""')}"`;
    const header = ["name", "email", "message", "source", "read", "createdAt", "readAt"];
    const rows = messages.map((item) =>
      [
        escapeCsv(item.name),
        escapeCsv(item.email),
        escapeCsv(item.message),
        escapeCsv(item.source || ""),
        escapeCsv(item.read ? "true" : "false"),
        escapeCsv(item.createdAt || ""),
        escapeCsv(item.readAt || "")
      ].join(",")
    );

    const csv = [header.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"contact-submissions.csv\"");
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;