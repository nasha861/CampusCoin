const router = require('express').Router();
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Announcement = require('../models/Announcement');
const { protect, requireAdmin } = require('../middleware/auth');

// All admin routes require auth + admin role
router.use(protect, requireAdmin);

/* ─────────────────────────────── USERS ─────────────────────────────── */

// GET /api/v1/admin/users
router.get('/users', async (req, res) => {
  try {
    const { search, role, page = 1, pageSize = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize)));
    const skip = (pageNum - 1) * pageSizeNum;

    const [users, totalItems] = await Promise.all([
      User.find(filter).select('-passwordHash -resetPasswordToken -resetPasswordExpires').sort({ createdAt: -1 }).skip(skip).limit(pageSizeNum),
      User.countDocuments(filter),
    ]);

    // Attach transaction counts
    const userIds = users.map((u) => u._id);
    const txCounts = await Transaction.aggregate([
      { $match: { userId: { $in: userIds } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]);
    const txMap = {};
    txCounts.forEach((t) => { txMap[t._id.toString()] = t.count; });

    const items = users.map((u) => ({
      ...u.toPublic(),
      transactionCount: txMap[u._id.toString()] || 0,
    }));

    res.json({ data: { items, page: pageNum, pageSize: pageSizeNum, totalItems, totalPages: Math.ceil(totalItems / pageSizeNum) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const txCount = await Transaction.countDocuments({ userId: user._id });
    res.json({ data: { ...user.toPublic(), transactionCount: txCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/admin/users/:id  — toggle isActive
router.patch('/users/:id', async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) return res.status(400).json({ message: 'isActive is required' });

    const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const txCount = await Transaction.countDocuments({ userId: user._id });
    res.json({ data: { ...user.toPublic(), transactionCount: txCount } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/v1/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ data: null, message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ──────────────────────────── CATEGORIES ───────────────────────────── */

function formatCat(c) {
  return { id: c._id.toString(), name: c.name, type: c.type, icon: c.icon, color: c.color, isDefault: c.isDefault, userId: c.userId?.toString() ?? null, createdAt: c.createdAt, updatedAt: c.updatedAt };
}

// GET /api/v1/admin/categories  — all system default templates (userId: null)
router.get('/categories', async (req, res) => {
  try {
    const cats = await Category.find({ userId: null }).sort({ name: 1 });
    res.json({ data: cats.map(formatCat) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/admin/categories
router.post('/categories', async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name?.trim() || !type) return res.status(400).json({ message: 'Name and type are required' });
    const cat = await Category.create({ name: name.trim(), type, icon, color, userId: null, isDefault: true });
    res.status(201).json({ data: formatCat(cat) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Category already exists' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/admin/categories/:id
router.patch('/categories/:id', async (req, res) => {
  try {
    const cat = await Category.findOne({ _id: req.params.id, userId: null });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    ['name', 'icon', 'color'].forEach((k) => { if (req.body[k] !== undefined) cat[k] = req.body[k]; });
    await cat.save();
    res.json({ data: formatCat(cat) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/v1/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    const cat = await Category.findOneAndDelete({ _id: req.params.id, userId: null });
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json({ data: null, message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ─────────────────────────── ANNOUNCEMENTS ─────────────────────────── */

function formatAnn(a) {
  return { id: a._id.toString(), title: a.title, body: a.body, audience: a.audience, publishedAt: a.publishedAt, createdAt: a.createdAt, updatedAt: a.updatedAt };
}

// GET /api/v1/admin/announcements
router.get('/announcements', async (req, res) => {
  try {
    const anns = await Announcement.find().sort({ createdAt: -1 });
    res.json({ data: anns.map(formatAnn) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/admin/announcements
router.post('/announcements', async (req, res) => {
  try {
    const { title, body, audience, publishNow } = req.body;
    if (!title?.trim() || !body?.trim() || !audience) return res.status(400).json({ message: 'title, body and audience are required' });
    const ann = await Announcement.create({ title, body, audience, publishedAt: publishNow ? new Date() : null, createdBy: req.user._id });
    res.status(201).json({ data: formatAnn(ann) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/admin/announcements/:id
router.patch('/announcements/:id', async (req, res) => {
  try {
    const ann = await Announcement.findById(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    ['title', 'body', 'audience'].forEach((k) => { if (req.body[k] !== undefined) ann[k] = req.body[k]; });
    if (req.body.publishNow) ann.publishedAt = new Date();
    await ann.save();
    res.json({ data: formatAnn(ann) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/v1/admin/announcements/:id
router.delete('/announcements/:id', async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ data: null, message: 'Announcement deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ──────────────────────────── STATISTICS ───────────────────────────── */

// GET /api/v1/admin/statistics
router.get('/statistics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalTransactions, totalCategories, activeUsersAgg, avgSpendAgg] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      Category.countDocuments({ userId: null }),
      Transaction.distinct('userId', { occurredAt: { $gte: thirtyDaysAgo } }),
      Transaction.aggregate([
        { $match: { type: 'expense' } },
        { $group: { _id: { userId: '$userId', month: { $substr: ['$occurredAt', 0, 7] } }, total: { $sum: '$amount' } } },
        { $group: { _id: null, avg: { $avg: '$total' } } },
      ]),
    ]);

    res.json({
      data: {
        totalUsers,
        activeUsersLast30Days: activeUsersAgg.length,
        totalTransactions,
        totalCategories,
        averageMonthlySpendPerUser: avgSpendAgg[0]?.avg ?? 0,
        generatedAt: new Date(),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
