
const router = require('express').Router();
const mongoose = require('mongoose');

const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

router.use(protect);

function formatBudget(budget, spentAmount = 0) {
  return {
    id: budget._id.toString(),
    userId: budget.userId.toString(),
    categoryId: budget.categoryId.toString(),
    month: budget.month.toISOString().slice(0, 7),
    limitAmount: budget.limitAmount,
    spentAmount,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

async function getSpentAmounts(userId, month, categoryIds) {
  const [year, mon] = month.split('-').map(Number);

  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const results = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        categoryId: {
          $in: categoryIds,
        },
        occurredAt: {
          $gte: start,
          $lt: end,
        },
      },
    },
    {
      $group: {
        _id: '$categoryId',
        total: {
          $sum: '$amount',
        },
      },
    },
  ]);

  const map = {};

  results.forEach((item) => {
    map[item._id.toString()] = item.total;
  });

  return map;
}

// GET /api/ccoin/budgets?month=YYYY-MM
router.get('/', async (req, res) => {
  try {
    const month =
      req.query.month ||
      new Date().toISOString().slice(0, 7);

    const budgetMonth = new Date(
      `${month}-01T00:00:00.000Z`
    );

    const budgets = await Budget.find({
      userId: req.user._id,
      month: budgetMonth,
    });

    const categoryIds = budgets.map(
      (budget) => budget.categoryId
    );

    const spentMap = await getSpentAmounts(
      req.user._id,
      month,
      categoryIds
    );

    const formatted = budgets.map((budget) =>
      formatBudget(
        budget,
        spentMap[budget.categoryId.toString()] || 0
      )
    );

    const totalBudgeted = formatted.reduce(
      (sum, budget) => sum + budget.limitAmount,
      0
    );

    const totalSpent = formatted.reduce(
      (sum, budget) => sum + budget.spentAmount,
      0
    );

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

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// POST /api/ccoin/budgets
router.post('/', async (req, res) => {
  try {
    const {
      categoryId,
      month,
      limitAmount,
    } = req.body;

    if (
      !categoryId ||
      !month ||
      limitAmount === undefined
    ) {
      return res.status(400).json({
        message:
          'categoryId, month and limitAmount are required',
      });
    }

 const monthMatch = /^(\d{4})-(\d{2})$/.exec(month);

    if (!monthMatch) {
      return res.status(400).json({
        message: 'month must be in YYYY-MM format',
      });
    }

    const monthNumber = Number(monthMatch[2]);

    if (monthNumber < 1 || monthNumber > 12) {
      return res.status(400).json({
        message: 'month must be between 01 and 12',
      });
    }

const numericLimit = Number(limitAmount);

   if (!Number.isFinite(numericLimit) || numericLimit < 0) {
  return res.status(400).json({
    message: 'limitAmount must be a valid number greater than or equal to 0',
  });
}

if (!mongoose.Types.ObjectId.isValid(categoryId)) {
  return res.status(400).json({
    message: 'Invalid category ID',
  });
}

const category = await Category.findOne({
  _id: categoryId,
  $or: [
    { userId: req.user._id },
    { userId: null },
  ],
});

if (!category) {
  return res.status(400).json({
    message: 'Invalid category',
  });
}

    const budgetMonth = new Date(
      `${month}-01T00:00:00.000Z`
    );

    const budget = await Budget.create({
      userId: req.user._id,
      categoryId,
      month: budgetMonth,
      limitAmount: numericLimit,
    });

    const spentMap = await getSpentAmounts(
      req.user._id,
      month,
      [budget.categoryId]
    );

    res.status(201).json({
      data: formatBudget(
        budget,
        spentMap[budget.categoryId.toString()] || 0
      ),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message:
          'A budget for this category and month already exists',
      });
    }

    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// PATCH /api/ccoin/budgets/:id
router.patch('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found',
      });
    }

    if (req.body.limitAmount !== undefined) {
      budget.limitAmount = Number(
        req.body.limitAmount
      );
    }

    await budget.save();

    const month = budget.month
      .toISOString()
      .slice(0, 7);

    const spentMap = await getSpentAmounts(
      req.user._id,
      month,
      [budget.categoryId]
    );

    res.json({
      data: formatBudget(
        budget,
        spentMap[budget.categoryId.toString()] || 0
      ),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// DELETE /api/ccoin/budgets/:id
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        message: 'Budget not found',
      });
    }

    await budget.deleteOne();

    res.json({
      data: null,
      message: 'Budget deleted',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;

