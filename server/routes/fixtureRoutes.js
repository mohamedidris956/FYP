const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Fixture = require('../models/Fixture');
const { protect, admin } = require('../middleware/authMiddleware');

function readFixturesFromJson() {
  const dataPath = path.join(__dirname, '..', 'data', 'fixturesAndResults.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const parsed = JSON.parse(raw);

  const fixtures = Array.isArray(parsed) ? parsed : parsed.fixtures;
  return Array.isArray(fixtures) ? fixtures : [];
}

// Get all fixtures
router.get('/', async (req, res) => {
  try {
    const fixtures = readFixturesFromJson();
    return res.json(fixtures);
  } catch (jsonError) {
    console.error('Failed to read fixtures from JSON:', jsonError.message);
    return res.status(500).json({
      message: 'Unable to load fixtures from JSON data file.'
    });
  }
});

// Add a fixture (Admin only)
router.post('/', protect, admin, async (req, res) => {
  const fixture = await Fixture.create(req.body);
  res.json(fixture);
});

// Update fixture (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  const updated = await Fixture.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Delete fixture (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  await Fixture.findByIdAndDelete(req.params.id);
  res.json({ message: 'Fixture removed' });
});

module.exports = router;