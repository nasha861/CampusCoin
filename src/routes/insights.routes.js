const router = require('express').Router();
const Insight = require('../models/Insight');
const SavingTip = require('../models/SavingTip');
const Bookmark = require('../models/Bookmark');
const { protect } = require('../middleware/auth');

router.use(protect);

function formatInsight(i) {
  return {
    id: i._id.toString(),
    userId: i.userId.toString(),
    kind: i.kind,
    title: i.title,
    body: i.body,
    month: i.month,
    isAiGenerated: i.isAiGenerated,
    createdAt: i.createdAt,
  };
}

function formatTip(t) {
  return {
    id: t._id.toString(),
    title: t.title,
    body: t.body,
    category: t.category,
    isAiGenerated: t.isAiGenerated,
    createdAt: t.createdAt,
  };
}

function formatBookmark(b) {
  return {
    id: b._id.toString(),
    userId: b.userId.toString(),
    targetType: b.targetType,
    targetId: b.targetId.toString(),
    createdAt: b.createdAt,
  };
}

// GET /api/v1/insights?month=YYYY-MM
router.get('/insights', async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.month) filter.month = req.query.month;
    const insights = await Insight.find(filter).sort({ createdAt: -1 });
    res.json({ data: insights.map(formatInsight) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/saving-tips
router.get('/saving-tips', async (req, res) => {
  try {
    // Seed a handful of tips if none exist yet
    const count = await SavingTip.countDocuments();
    if (count === 0) {
      await SavingTip.insertMany([
        { title: 'Cook at home', body: 'Preparing your own meals can save you up to 60% compared to eating out regularly.', category: 'Food & Drinks' },
        { title: 'Use student discounts', body: 'Always carry your student ID — many stores, cinemas, and transport services offer significant discounts.', category: 'Shopping' },
        { title: 'Track every naira', body: 'Logging even small expenses keeps you aware of where your money is going and helps spot patterns.', category: 'General' },
        { title: 'Set a weekly spending limit', body: 'Break your monthly budget into weekly chunks so overspending is caught early.', category: 'General' },
        { title: 'Buy second-hand textbooks', body: 'Second-hand or digital textbooks can cost a fraction of new copies.', category: 'Education' },
        { title: 'Walk or cycle short distances', body: 'Skipping transport fares for short trips adds up to meaningful savings over a month.', category: 'Transport' },
      ]);
    }
    const tips = await SavingTip.find().sort({ createdAt: -1 });
    res.json({ data: tips.map(formatTip) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/bookmarks
router.get('/bookmarks', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ data: bookmarks.map(formatBookmark) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/bookmarks
router.post('/bookmarks', async (req, res) => {
  try {
    const { targetType, targetId } = req.body;
    if (!targetType || !targetId) return res.status(400).json({ message: 'targetType and targetId are required' });

    const bookmark = await Bookmark.create({ userId: req.user._id, targetType, targetId });
    res.status(201).json({ data: formatBookmark(bookmark) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already bookmarked' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/v1/bookmarks/:id
router.delete('/bookmarks/:id', async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({ _id: req.params.id, userId: req.user._id });
    if (!bookmark) return res.status(404).json({ message: 'Bookmark not found' });
    await bookmark.deleteOne();
    res.json({ data: null, message: 'Bookmark removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
