const router = require('express').Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/v1/reports/monthly?month=YYYY-MM
router.get('/monthly', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const transactions = await Transaction.find({
      userId: req.user._id,
      occurredAt: { $gte: start, $lt: end },
    });

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Category breakdown (expenses only)
    const expenseTxs = transactions.filter((t) => t.type === 'expense');
    const categoryTotals = {};
    expenseTxs.forEach((t) => {
      const cid = t.categoryId.toString();
      categoryTotals[cid] = (categoryTotals[cid] || 0) + t.amount;
    });

    const categoryIds = Object.keys(categoryTotals);
    const categories = await Category.find({ _id: { $in: categoryIds } });
    const catMap = {};
    categories.forEach((c) => { catMap[c._id.toString()] = c.name; });

    const categoryBreakdown = categoryIds.map((cid) => ({
      categoryId: cid,
      categoryName: catMap[cid] || 'Unknown',
      amount: categoryTotals[cid],
      percentage: totalExpense > 0 ? Math.round((categoryTotals[cid] / totalExpense) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Daily spend
    const dailyMap = {};
    expenseTxs.forEach((t) => {
      const date = t.occurredAt.toISOString().slice(0, 10);
      dailyMap[date] = (dailyMap[date] || 0) + t.amount;
    });
    const dailySpend = Object.entries(dailyMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      data: {
        month,
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        categoryBreakdown,
        dailySpend,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
