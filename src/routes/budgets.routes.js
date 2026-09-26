const router = require('express').Router();
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

function formatBudget(b, spentAmount = 0) {
  return {
    id: b._id.toString(),
    userId: b.user.toString(),
    categoryId: b.category.toString(),
    month: b.month.toISOString().slice(0, 7),
    limitAmount: b.limitAmount,
    spentAmount,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

async function getSpentAmounts(userId, month, categoryIds) {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const agg = await Transaction.aggregate([
    { $match: { userId, type: 'expense', categoryId: { $in: categoryIds }, occurredAt: { $gte: start, $lt: end } } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
  ]);

  const map = {};
  agg.forEach((a) => { map[a._id.toString()] = a.total; });
  return map;
}

// GET /api/v1/budgets?month=YYYY-MM
router.get('/', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
   const budgetMonth = new Date(`${month}-01T00:00:00.000Z`);

    const budgets = await Budget.find({
  user: req.user._id,
  month: budgetMonth,
    });

    const categoryIds = budgets.map((b) => b.category);
    const spentMap = await getSpentAmounts(req.user._id, month, categoryIds);

    const formatted = budgets.map( (b) => formatBudget(b, spentMap[b.category.toString()] || 0));
    const totalBudgeted = formatted.reduce((s, b) => s + b.limitAmount, 0);
    const totalSpent = formatted.reduce((s, b) => s + b.spentAmount, 0);

    res.json({
      data: {
        month,
        totalBudgeted,
        totalSpent,
        remaining: totalBudgeted - totalSpent,
        budgets: formatted,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/budgets
router.post('/', async (req, res) => {
  try {
    const { categoryId, month, limitAmount } = req.body;
    if (!categoryId || !month || limitAmount === undefined) {
      return res.status(400).json({ message: 'categoryId, month and limitAmount are required' });
    }

    
    const budgetMonth = new Date(`${month}-01T00:00:00.000Z`);

const budget = await Budget.create({
  user: req.user._id,
  category: categoryId,
  month: budgetMonth,
  limitAmount: Number(limitAmount),
});

const spentMap = await getSpentAmounts(
  req.user._id,
  month,
  [budget.category]
);

res.status(201).json({
  data: formatBudget(
    budget,
    spentMap[budget.category.toString()] || 0
  ),
});
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A budget for this category and month already exists' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/budgets/:id
router.patch('/:id', async (req, res) => {
  try {
        const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    if (req.body.limitAmount !== undefined) budget.limitAmount = Number(req.body.limitAmount);
    await budget.save();

    const month = budget.month.toISOString().slice(0, 7);

      const spentMap = await getSpentAmounts(req.user._id, month, [budget.category]
 );
    res.json({ data: formatBudget( budget, spentMap[budget.category.toString()] || 0 )
  });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/v1/budgets/:id
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });
    await budget.deleteOne();
    res.json({ data: null, message: 'Budget deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
