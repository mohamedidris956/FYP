const express = require("express");
const { protect, admin } = require("../middleware/authMiddleware");
const FanMessage = require("../models/FanMessage");
const User = require("../models/User");
const ModerationLog = require("../models/ModerationLog");
const { sanitizeMessage, applyProfanityFilter } = require("../utils/chatModeration");

const router = express.Router();

function normalizeReason(value) {
  return sanitizeMessage(String(value || "")).slice(0, 300);
}

// GET latest messages (logged-in only)
router.get("/messages", protect, async (req, res) => {
  try {
    const messages = await FanMessage.find({})
      .sort({ createdAt: -1 })
      .limit(60)
      .populate("user", "name role")
      .lean();

    // reverse so UI shows oldest -> newest in sequence
    res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST new message (logged-in only)
router.post("/messages", protect, async (req, res) => {
  try {
    // optional mute check for REST fallback path
    if (req.user.mutedUntil && new Date(req.user.mutedUntil) > new Date()) {
      return res.status(403).json({
        message: `You are muted until ${new Date(req.user.mutedUntil).toLocaleString()}`
      });
    }

    const cleanText = sanitizeMessage(req.body?.text);

    if (!cleanText) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    if (cleanText.length > 300) {
      return res.status(400).json({ message: "Message is too long (max 300 chars)" });
    }

    const { text: filteredText } = applyProfanityFilter(cleanText);

    const msg = await FanMessage.create({
      user: req.user._id,
      text: filteredText
    });

    const hydrated = await FanMessage.findById(msg._id)
      .populate("user", "name role")
      .lean();

    res.status(201).json(hydrated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE own message (or admin can delete any)
router.delete("/messages/:messageId", protect, async (req, res) => {
  try {
    const msg = await FanMessage.findById(req.params.messageId).populate("user", "role");
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const isOwner = String(msg.user._id) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not allowed to delete this message" });
    }

    await FanMessage.deleteOne({ _id: req.params.messageId });
    res.json({ message: "Message deleted", messageId: req.params.messageId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: mute user for X minutes
router.post("/mute/:userId", protect, admin, async (req, res) => {
  try {
    const minutes = Number(req.body?.minutes || 10);

    if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 1440) {
      return res.status(400).json({ message: "Minutes must be between 1 and 1440" });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot mute another admin" });
    }

    user.mutedUntil = new Date(Date.now() + minutes * 60 * 1000);
    await user.save();

    await ModerationLog.create({
      action: "mute",
      actor: req.user._id,
      target: user._id,
      minutes,
      reason: normalizeReason(req.body?.reason)
    });
    res.json({
      message: `User muted for ${minutes} minute(s)`,
      userId: user._id,
      mutedUntil: user.mutedUntil
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: unmute user
router.post("/unmute/:userId", protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.mutedUntil = null;
    await user.save();

    await ModerationLog.create({
      action: "unmute",
      actor: req.user._id,
      target: user._id,
      reason: normalizeReason(req.body?.reason)
    });

    res.json({ message: "User unmuted", userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: list users for moderation
router.get("/users", protect, admin, async (req, res) => {
  try {
    const users = await User.find({}, "name email role mutedUntil createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: moderation audit log
router.get("/logs", protect, admin, async (req, res) => {
  try {
    const logs = await ModerationLog.find({})
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("actor", "name email")
      .populate("target", "name email")
      .lean();

    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Admin: export moderation logs as CSV
router.get("/logs/export", protect, admin, async (req, res) => {
  try {
    const logs = await ModerationLog.find({})
      .sort({ createdAt: -1 })
      .limit(5000)
      .populate("actor", "name email")
      .populate("target", "name email")
      .lean();

    const escapeCSV = (value) => {
      const str = String(value ?? "");
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const header = [
      "timestamp",
      "action",
      "moderator_name",
      "moderator_email",
      "target_name",
      "target_email",
      "minutes",
      "reason"
    ];

    const rows = logs.map((log) => [
      new Date(log.createdAt).toISOString(),
      log.action || "",
      log.actor?.name || "",
      log.actor?.email || "",
      log.target?.name || "",
      log.target?.email || "",
      log.minutes ?? "",
      log.reason || ""
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\n");

    const fileName = `moderation-log-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;