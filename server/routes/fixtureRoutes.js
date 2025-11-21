const express = require('express');
const router = express.Router();
const Fixture = require('../models/Fixture');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all fixtures
router.get('/', async (req, res) => {
  const fixtures = await Fixture.find();
  res.json(fixtures);
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
