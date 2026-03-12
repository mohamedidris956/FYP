const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Connect DB
connectDB();

// =======================
// Middleware
// =======================

app.use(cors());

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
