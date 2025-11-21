const express = require('express');
const router = express.Router();
const League = require('../models/LeagueTable');
const { protect, admin } = require('../middleware/authMiddleware');

// Get league table sorted by points
router.get('/', async (req, res) => {
  const table = await League.find().sort({ pts: -1 });
  res.json(table);
});

// Add or update team (Admin only)
router.post('/', protect, admin, async (req, res) => {
  const data = req.body;
  let team = await League.findOne({ team: data.team });

  if (team) {
    await League.updateOne({ team: data.team }, data);
    return res.json({ message: "Updated existing team" });
  }

  const newTeam = await League.create(data);
  res.json(newTeam);
});

module.exports = router;
