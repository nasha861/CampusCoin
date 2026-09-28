const router = require('express').Router();

const Insight = require('../models/Insight');
const MoneyMove = require('../models/MoneyMove');
const DismissedMoneyMove = require('../models/DismissedMoneyMove');
const Bookmark = require('../models/Bookmark');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

router.use(protect);

// ─────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────

function formatInsight(insight) {
  return {
    id: insight._id.toString(),
    userId: insight.userId.toString(),
    kind: insight.kind,
    title: insight.title,
    body: insight.body,
    month: insight.month,
    isAiGenerated: insight.isAiGenerated,
    createdAt: insight.createdAt,
  };
}

function formatTip(tip) {
  return {
    id: tip._id.toString(),
    title: tip.title,
    body: tip.body,
    category: tip.category,
    isAiGenerated: tip.isAiGenerated,
    createdAt: tip.createdAt,
  };
}

function formatBookmark(bookmark) {
  return {
    id: bookmark._id.toString(),
    userId: bookmark.userId.toString(),
    targetType: bookmark.targetType,
    targetId: bookmark.targetId.toString(),
    createdAt: bookmark.createdAt,
  };
}

// ─────────────────────────────────────────────────────
// INSIGHTS
// ─────────────────────────────────────────────────────

// GET /api/ccoin/insights?month=YYYY-MM
router.get('/insights', async (req, res) => {
  try {
    const filter = {
      userId: req.user._id,
    };

    if (req.query.month) {
      filter.month = req.query.month;
    }

    const insights = await Insight.find(filter).sort({
      createdAt: -1,
    });

    res.json({
      data: insights.map(formatInsight),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// POST /api/ccoin/insights/generate?month=YYYY-MM
router.post('/insights/generate', async (req, res) => {
  try {
    const month =
      req.query.month ||
      new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: 'Month must be in YYYY-MM format',
      });
    }

    const [year, monthNumber] = month.split('-').map(Number);

    const start = new Date(
      Date.UTC(year, monthNumber - 1, 1)
    );

    const end = new Date(
      Date.UTC(year, monthNumber, 1)
    );

    const transactions = await Transaction.find({
      userId: req.user._id,
      occurredAt: {
        $gte: start,
        $lt: end,
      },
    });

    if (transactions.length === 0) {
      return res.json({
        data: null,
        message: 'No transactions found for this month',
      });
    }

    const totalIncome = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

    const totalExpense = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

    const netSavings = totalIncome - totalExpense;

    // ── Expense totals by category ──────────────────
    const expenseTotals = {};

    transactions
      .filter((transaction) => transaction.type === 'expense')
      .forEach((transaction) => {
        const categoryId = transaction.categoryId.toString();

        expenseTotals[categoryId] =
          (expenseTotals[categoryId] || 0) +
          transaction.amount;
      });

    const categoryIds = Object.keys(expenseTotals);

    const categories = await Category.find({
      _id: {
        $in: categoryIds,
      },
    });

    const categoryMap = {};

    categories.forEach((category) => {
      categoryMap[category._id.toString()] = category.name;
    });

    let topCategoryId = null;
    let topCategoryAmount = 0;

    Object.entries(expenseTotals).forEach(
      ([categoryId, amount]) => {
        if (amount > topCategoryAmount) {
          topCategoryId = categoryId;
          topCategoryAmount = amount;
        }
      }
    );

    const topCategoryName = topCategoryId
      ? categoryMap[topCategoryId] || 'Unknown'
      : null;

    // ── Budget check ─────────────────────────────────
    const budgetMonth = new Date(
      Date.UTC(year, monthNumber - 1, 1)
    );

    const budgets = await Budget.find({
      userId: req.user._id,
      month: budgetMonth,
    });

    let exceededBudgets = 0;

    budgets.forEach((budget) => {
      const spent =
        expenseTotals[
          budget.categoryId.toString()
        ] || 0;

      if (spent > budget.limitAmount) {
        exceededBudgets += 1;
      }
    });

    // ── Build insight text ───────────────────────────
    let body = '';

    if (totalIncome > 0) {
      body += `You recorded ₦${totalIncome.toLocaleString()} in income and ₦${totalExpense.toLocaleString()} in expenses this month. `;
    } else {
      body += `You recorded ₦${totalExpense.toLocaleString()} in expenses this month with no recorded income. `;
    }

    body += `Your net savings were ₦${netSavings.toLocaleString()}. `;

    if (topCategoryName) {
      body += `Your highest expense category was ${topCategoryName}, with ₦${topCategoryAmount.toLocaleString()} spent. `;
    }

    if (exceededBudgets > 0) {
      body += `You exceeded ${exceededBudgets} budget ${
        exceededBudgets === 1
          ? 'category'
          : 'categories'
      } this month. Review those areas before next month.`;
    } else if (netSavings > 0) {
      body +=
        'Your recorded spending remained below your income this month. Keep tracking your expenses to maintain this progress.';
    } else {
      body +=
        'Reviewing your largest expense categories may help you reduce spending next month.';
    }

    const insight = await Insight.findOneAndUpdate(
      {
        userId: req.user._id,
        kind: 'monthly-summary',
        month,
      },
      {
        userId: req.user._id,
        kind: 'monthly-summary',
        title: `Monthly spending summary for ${month}`,
        body,
        month,
        isAiGenerated: false,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      data: formatInsight(insight),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// ─────────────────────────────────────────────────────
// SAVING TIPS
// ─────────────────────────────────────────────────────

// GET /api/ccoin/money-moves
router.get('/money-moves', async (req, res) => {
  try {
    // Seed general tips once
    const count = await MoneyMove.countDocuments();

    if (count === 0) {
      await MoneyMove.insertMany([
        {
          title: 'Cook at home',
          body: 'Making your own meals instead of eating out can reduce food spending.',
          category: 'Food & Drinks',
        },
        {
          title: 'Use student discounts',
          body: 'Carry your student ID and check for student discounts before paying.',
          category: 'Shopping',
        },
        {
          title: 'Track every naira',
          body: 'Recording small expenses helps you identify spending patterns.',
          category: 'General',
        },
        {
          title: 'Set weekly spending limits',
          body: 'Breaking your monthly budget into weekly targets can help you detect overspending early.',
          category: 'General',
        },
        {
          title: 'Buy used or digital textbooks',
          body: 'Second-hand books or digital textbooks can reduce education costs.',
          category: 'Education',
        },
        {
          title: 'Walk or cycle short distances',
          body: 'Reducing transport costs on short trips can add up to meaningful savings.',
          category: 'Transport',
        },
      ]);
    }



    const generalTips = await MoneyMove.find({
      isAiGenerated: false,
    }).sort({
      createdAt: -1,
    });

    const dismissedMoneyMoves = await DismissedMoneyMove.find({
      userId: req.user._id,
    }).select('moneyMoveId');

    const dismissedIds = new Set(
      dismissedMoneyMoves.map((item) => item.moneyMoveId)
    );

    // ── Current month ────────────────────────────────
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    const transactions = await Transaction.find({
      userId: req.user._id,
      type: 'expense',
      occurredAt: {
        $gte: startOfMonth,
        $lt: startOfNextMonth,
      },
    });

    // ── Spending by category ─────────────────────────
    const spendingMap = {};

    transactions.forEach((transaction) => {
      const categoryId = transaction.categoryId.toString();

      spendingMap[categoryId] =
        (spendingMap[categoryId] || 0) +
        transaction.amount;
    });

    const categoryIds = Object.keys(spendingMap);

    const categories = await Category.find({
      _id: {
        $in: categoryIds,
      },
    });

    const categoryMap = {};

    categories.forEach((category) => {
      categoryMap[category._id.toString()] = category;
    });

    // ── Current month budgets ────────────────────────
    const budgetMonth = new Date(
      Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );

    const budgets = await Budget.find({
      userId: req.user._id,
      month: budgetMonth,
      categoryId: {
        $in: categoryIds,
      },
    });

    const budgetMap = {};

    budgets.forEach((budget) => {
      budgetMap[budget.categoryId.toString()] =
        budget.limitAmount;
    });

    // ── Personalized tips ────────────────────────────
    const personalizedTips = [];

    for (const categoryId of categoryIds) {
      const category = categoryMap[categoryId];

      if (!category) {
        continue;
      }

      const spent = spendingMap[categoryId];
      const budget = budgetMap[categoryId];

      if (budget && spent > budget) {
        personalizedTips.push({
          id: `personalized-${categoryId}-budget`,
          title: `${category.name} is over budget`,
          body: `You have spent ₦${spent.toLocaleString()} on ${category.name}, which is above your ₦${budget.toLocaleString()} budget. Consider reducing spending in this category.`,
          category: category.name,
          isAiGenerated: false,
          priority: spent - budget,
        });

        continue;
      }

      if (budget && spent >= budget * 0.8) {
        personalizedTips.push({
          id: `personalized-${categoryId}-near`,
          title: `Watch your ${category.name} spending`,
          body: `You have used ${Math.round(
            (spent / budget) * 100
          )}% of your ${category.name} budget this month.`,
          category: category.name,
          isAiGenerated: false,
          priority: spent,
        });
      }
    }

    personalizedTips.sort(
      (a, b) => b.priority - a.priority
    );

   const visiblePersonalizedTips = personalizedTips.filter(
  (tip) => !dismissedIds.has(tip.id)
);

const visibleGeneralTips = generalTips
  .filter((tip) => !dismissedIds.has(tip._id.toString()))
  .map(formatTip);

    res.json({
      data: [
        ...visiblePersonalizedTips.map(
          ({ priority, ...tip }) => tip
        ),
        ...visibleGeneralTips,
      ],
    });
    
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// POST /api/ccoin/money-moves/:id/dismiss
router.post('/money-moves/:id/dismiss', async (req, res) => {
  try {
    const dismissed = await DismissedMoneyMove.findOneAndUpdate(
      {
        userId: req.user._id,
        moneyMoveId: req.params.id,
      },
      {
        userId: req.user._id,
        moneyMoveId: req.params.id,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      message: 'Money Move dismissed',
      data: {
        id: dismissed._id,
        moneyMoveId: dismissed.moneyMoveId,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// DELETE /api/ccoin/money-moves/:id/dismiss
router.delete('/money-moves/:id/dismiss', async (req, res) => {
  try {
    await DismissedMoneyMove.findOneAndDelete({
      userId: req.user._id,
      moneyMoveId: req.params.id,
    });

    res.json({
      message: 'Money Move restored',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// ─────────────────────────────────────────────────────
// BOOKMARKS
// ─────────────────────────────────────────────────────

// GET /api/ccoin/bookmarks
router.get('/bookmarks', async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    res.json({
      data: bookmarks.map(formatBookmark),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// POST /api/ccoin/bookmarks
router.post('/bookmarks', async (req, res) => {
  try {
    const {
      targetType,
      targetId,
    } = req.body;

    if (!targetType || !targetId) {
      return res.status(400).json({
        message:
          'targetType and targetId are required',
      });
    }

    if (!['insight', 'saving-tip'].includes(targetType)) {
      return res.status(400).json({
        message:
          'targetType must be insight or saving-tip',
      });
    }

    const bookmark = await Bookmark.create({
      userId: req.user._id,
      targetType,
      targetId,
    });

    res.status(201).json({
      data: formatBookmark(bookmark),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: 'Already bookmarked',
      });
    }

    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// DELETE /api/ccoin/bookmarks/:id
router.delete('/bookmarks/:id', async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bookmark) {
      return res.status(404).json({
        message: 'Bookmark not found',
      });
    }

    await bookmark.deleteOne();

    res.json({
      data: null,
      message: 'Bookmark removed',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;