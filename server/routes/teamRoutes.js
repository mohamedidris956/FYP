const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const StartingXI = require("../models/StartingXI");

const router = express.Router();

// Save Starting XI
router.post("/starting11", protect, async (req, res) => {
  try {
    const { formation, players } = req.body;

    if (!formation || !players || players.length !== 11) {
      return res.status(400).json({ message: "Invalid squad data" });
    }

    const newXI = new StartingXI({
      user: req.user._id,
      formation,
      players
    });

    await newXI.save();

    res.status(201).json({ message: "Starting XI saved successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
