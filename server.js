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
const dashboardRoutes = require('./src/routes/dashboard.routes');

const app = express();

// ── Middleware ────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an origin
      // such as Postman or server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ── Health check ──────────────────────────────────────────────────────
app.get('/', (_req, res) => res.json({ message: 'CampusCoin API is running' }));

// ── Routes ────────────────────────────────────────────────────────────
const API = '/api/v1';
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/profile`, profileRoutes);
app.use(`${API}/categories`, categoriesRoutes);
app.use(`${API}/transactions`, transactionsRoutes);
app.use(`${API}/budgets`, budgetsRoutes);
app.use(`${API}/reports`, reportsRoutes);
// insights.routes handles /insights, /saving-tips, /bookmarks
app.use(`${API}`, insightsRoutes);
app.use(`${API}/notifications`, notificationsRoutes);
app.use(`${API}/admin`, adminRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampusCoin server running on port ${PORT}`);
  });

  });
