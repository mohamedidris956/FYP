const express = require('express');
const router = express.Router();
const Fixture = require('../models/Fixture');
const { protect, admin } = require('../middleware/authMiddleware');

function normalizeFixturePayload(payload = {}) {
  const opponent = String(payload.opponent || '').trim();
  const venue = String(payload.venue || '').trim();
  const kickOff = String(payload.kickOff || '').trim();
  const result = String(payload.result || '').trim();

  let date = null;
  if (payload.date) {
    const parsedDate = new Date(payload.date);
    if (Number.isNaN(parsedDate.getTime())) {
      return { error: 'Invalid date value. Use a valid ISO date or leave it empty for TBA.' };
    }
    date = parsedDate;
  }

  if (!opponent || !venue) {
    return { error: 'Opponent and venue are required.' };
  }

  return {
    data: {
      opponent,
      venue,
      kickOff,
      result,
      date
    }
  };
}

// Get all fixtures
router.get('/', async (req, res) => {
  try {
    const fixtures = await Fixture.find({})
      .sort({ date: 1, createdAt: 1 })
      .lean();
    return res.json(fixtures);
  } catch (error) {
    console.error('Failed to load fixtures from database:', error.message);
    return res.status(500).json({
      message: 'Unable to load fixtures data.'
    });
  }
});

// Add a fixture (Admin only)
router.post('/', protect, admin, async (req, res) => {
 try {
    const normalized = normalizeFixturePayload(req.body);
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const fixture = await Fixture.create(normalized.data);
    res.status(201).json(fixture);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update fixture (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const normalized = normalizeFixturePayload(req.body);
    if (normalized.error) {
      return res.status(400).json({ message: normalized.error });
    }

    const updated = await Fixture.findByIdAndUpdate(
      req.params.id,
      normalized.data,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Fixture not found' });
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete fixture (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const deleted = await Fixture.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Fixture not found' });
    }

    res.json({ message: 'Fixture removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;