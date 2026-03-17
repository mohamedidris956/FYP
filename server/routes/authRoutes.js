const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const handleValidation = (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg);

    return res.status(400).json({
      message: messages[0] || 'Validation failed', // first specific message
      errors: messages // keep full list if you need it
    });
  }

  return false;
};

// Register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
    body('email').trim().isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
  ],
  async (req, res) => {
    try {
      if (handleValidation(req, res)) return;

      const { name, email, password } = req.body;

      // 1) required fields
      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password are required' });
      }

      // 2) email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }

      // 3) username uniqueness
      const userExists = await User.findOne({ name });
      if (userExists) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // 4) email uniqueness
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // 5) force safe default role
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'user'
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });

      console.log(`🟢 NEW USER REGISTERED: ${user.name}`);
    } catch (err) {
      // 6) duplicate key fallback (extra safety)
      if (err.code === 11000) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }

      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Login (by username)
router.post(
  '/login',
  [
    body('name').trim().notEmpty().withMessage('Username required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req, res) => {
    try {
      if (handleValidation(req, res)) return;

      const { name, password } = req.body;

      const user = await User.findOne({ name });
      if (!user) return res.status(400).json({ message: 'Invalid username or password' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ message: 'Invalid username or password' });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      });

      console.log(`🔐 LOGIN SUCCESS: ${user.name}`);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get logged-in user profile
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;