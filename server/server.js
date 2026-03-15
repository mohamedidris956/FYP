const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Connect DB
connectDB();

// Basic hardening headers
app.use(helmet());

// Hide express signature
app.disable('x-powered-by');

// Global API rate limiter (gentle)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,                 // max requests/IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' }
});

// Apply limiters
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// =======================
// Middleware
// =======================

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow non-browser tools like curl/postman (no origin header)
    if (!origin) return callback(null, true);

    // if no env configured yet, allow all (dev fallback)
    if (allowedOrigins.length === 0) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS not allowed for this origin"));
  },
  credentials: true
}));

// IMPORTANT: Stripe webhook must use raw body BEFORE express.json()
app.use('/api/checkout/webhook', express.raw({ type: 'application/json' }));

// Normal JSON parsing for all other routes
app.use(express.json());


// =======================
// API Routes
// =======================

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/fixtures', require('./routes/fixtureRoutes'));
app.use('/api/league', require('./routes/leagueRoutes'));
app.use('/api/checkout', require('./routes/checkoutRoutes'));
app.use("/api/team", require("./routes/teamRoutes"));
app.use('/api/products', require('./routes/productRoutes'));



// =======================
// Serve Frontend Files
// =======================

app.use(express.static(path.join(__dirname, '..')));


// =======================
// Start Server
// =======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
