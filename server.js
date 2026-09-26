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

const app = express();

// ── Middleware ────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

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

// ── 404 fallback ──────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

// ── Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`CampusCoin server running on port ${PORT}`));
});
