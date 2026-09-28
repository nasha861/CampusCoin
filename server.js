const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db');

// Route modules
const authRoutes = require('./src/routes/auth.routes');
const profileRoutes = require('./src/routes/profile.routes');
const categoriesRoutes = require('./src/routes/categories.routes');
const transactionsRoutes = require('./src/routes/transactions.routes');
const budgetsRoutes = require('./src/routes/budgets.routes');
const reportsRoutes = require('./src/routes/reports.routes');
const insightsRoutes = require('./src/routes/insights.routes');
const notificationsRoutes = require('./src/routes/notifications.routes');
const adminRoutes = require('./src/routes/admin.routes');
const myMoneyRoutes = require('./src/routes/my-money.routes');
const recurringRoutes = require('./src/routes/recurring.routes');
const aiRoutes = require('./src/routes/ai.routes');

const app = express();

// ── Middleware ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = (
  process.env.CLIENT_URLS ||
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow Postman, mobile apps, server-to-server requests, etc.
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured frontend origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ── Health check ────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message: 'CampusCoin API is running',
  });
});

// ── API route prefixes ──────────────────────────────────────────────
// New CampusCoin API
const API = '/api/ccoin';

// Old API kept temporarily so existing frontend code does not break
const LEGACY_API = '/api/v1';

function registerRoutes(prefix) {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/profile`, profileRoutes);
  app.use(`${prefix}/categories`, categoriesRoutes);
  app.use(`${prefix}/transactions`, transactionsRoutes);
  app.use(`${prefix}/ai`, aiRoutes);
  app.use(`${prefix}/budgets`, budgetsRoutes);
  app.use(`${prefix}/reports`, reportsRoutes);
  
  app.use(`${prefix}/money-routines`, recurringRoutes.router);

  // insights.routes handles:
  // /insights
  // /money-moves
  // /bookmarks
  app.use(`${prefix}`, insightsRoutes);

  app.use(`${prefix}/notifications`, notificationsRoutes);
  app.use(`${prefix}/admin`, adminRoutes);
  app.use(`${prefix}/my-money`, myMoneyRoutes);
  
}

// New endpoints
registerRoutes(API);

// Temporary backward-compatible endpoints
registerRoutes(LEGACY_API);

// ── 404 fallback ────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

// ── Error handler ───────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.message);

  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({
      message: err.message,
    });
  }

  res.status(500).json({
    message: 'Internal server error',
  });
});

// ── Start ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CampusCoin server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });