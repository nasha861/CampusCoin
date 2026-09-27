const router = require('express').Router();

const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/v1/dashboard
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;

    // Current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    // Get current-month transactions
    const transactions = await Transaction.find({
      userId,
      occurredAt: {
        $gte: startOfMonth,
        $lt: startOfNextMonth,
      },
    }).sort({ occurredAt: -1 });

    // Calculate income and expenses
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    // Expense category breakdown
    const categoryTotals = {};

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const categoryId = t.categoryId.toString();

        categoryTotals[categoryId] =
          (categoryTotals[categoryId] || 0) + t.amount;
      });

    const categoryIds = Object.keys(categoryTotals);

    const categories = await Category.find({
      _id: { $in: categoryIds },
    });

    const categoryMap = {};

    categories.forEach((category) => {
      categoryMap[category._id.toString()] = category.name;
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([categoryId, amount]) => ({
        categoryId,
        categoryName: categoryMap[categoryId] || 'Unknown',
        amount,
        percentage:
          totalExpense > 0
            ? Math.round((amount / totalExpense) * 100)
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Current month's budgets
    const month = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}`;

    const budgetMonth = new Date(`${month}-01T00:00:00.000Z`);

const budgets = await Budget.find({
    user: userId,
    month: budgetMonth,
    });

    const totalBudgeted = budgets.reduce(
      (sum, budget) => sum + budget.limitAmount,
      0
    );

    // Response
    res.json({
      data: {
        month,
        balance,
        totalIncome,
        totalExpense,

        budget: {
          totalBudgeted,
          remaining: totalBudgeted - totalExpense,
        },

        categoryBreakdown,

        topCategory:
          categoryBreakdown.length > 0
            ? categoryBreakdown[0]
            : null,

        transactionCount: transactions.length,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;