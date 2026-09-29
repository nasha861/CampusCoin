const router = require('express').Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

router.use(protect);

/*
  Build a date range from YYYY-MM.
*/
function getMonthRange(month) {
  const [year, mon] = month.split('-').map(Number);

  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  return { start, end };
}

/*
  Apply common transaction filters.
*/
function buildTransactionFilter(userId, query = {}) {
  const filter = {
    userId,
  };

  if (query.categoryId) {
    filter.categoryId = query.categoryId;
  }

  if (query.type && ['income', 'expense'].includes(query.type)) {
    filter.type = query.type;
  }

  if (query.source) {
    filter.source = query.source;
  }

  if (query.startDate || query.endDate) {
    filter.occurredAt = {};

    if (query.startDate) {
      filter.occurredAt.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
    }

    if (query.endDate) {
      const end = new Date(`${query.endDate}T00:00:00.000Z`);
      end.setUTCDate(end.getUTCDate() + 1);
      filter.occurredAt.$lt = end;
    }
  }

  return filter;
}

/*
  Build the category breakdown for expense transactions.
*/
async function buildCategoryBreakdown(expenseTransactions, totalExpense) {
  const categoryTotals = {};

  expenseTransactions.forEach((transaction) => {
    const categoryId = transaction.categoryId.toString();

    categoryTotals[categoryId] =
      (categoryTotals[categoryId] || 0) + transaction.amount;
  });

  const categoryIds = Object.keys(categoryTotals);

  const categories = await Category.find({
    _id: { $in: categoryIds },
  });

  const categoryMap = {};

  categories.forEach((category) => {
    categoryMap[category._id.toString()] = category.name;
  });

  return categoryIds
    .map((categoryId) => ({
      categoryId,
      categoryName: categoryMap[categoryId] || 'Unknown',
      amount: categoryTotals[categoryId],
      percentage:
        totalExpense > 0
          ? Math.round(
              (categoryTotals[categoryId] / totalExpense) * 100
            )
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/*
  Build daily spending.
*/
function buildDailySpend(expenseTransactions) {
  const dailyMap = {};

  expenseTransactions.forEach((transaction) => {
    const date = transaction.occurredAt
      .toISOString()
      .slice(0, 10);

    dailyMap[date] =
      (dailyMap[date] || 0) + transaction.amount;
  });

  return Object.entries(dailyMap)
    .map(([date, amount]) => ({
      date,
      amount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/*
  Build weekly spending.

  Weeks start on Monday.
*/
function buildWeeklySpend(expenseTransactions) {
  const weeklyMap = {};

  expenseTransactions.forEach((transaction) => {
    const date = new Date(transaction.occurredAt);

    const day = date.getUTCDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;

    const weekStart = new Date(date);
    weekStart.setUTCDate(
      date.getUTCDate() - daysFromMonday
    );
    weekStart.setUTCHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

    const key = weekStart.toISOString().slice(0, 10);

    if (!weeklyMap[key]) {
      weeklyMap[key] = {
        weekStart: key,
        weekEnd: weekEnd.toISOString().slice(0, 10),
        amount: 0,
      };
    }

    weeklyMap[key].amount += transaction.amount;
  });

  return Object.values(weeklyMap).sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart)
  );
}

/*
  GET /api/ccoin/reports/monthly?month=YYYY-MM

  Optional filters:
  ?categoryId=...
  ?type=income|expense
  ?source=manual|csv-import|recurring
  ?startDate=YYYY-MM-DD
  ?endDate=YYYY-MM-DD
*/
router.get('/monthly', async (req, res) => {
  try {
    const month =
      req.query.month ||
      new Date().toISOString().slice(0, 7);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: 'Month must be in YYYY-MM format',
      });
    }

    const monthNumber = Number(month.slice(5, 7));

    if (monthNumber < 1 || monthNumber > 12) {
      return res.status(400).json({
        message: 'Month must be between 01 and 12',
      });
    }

    if (
      req.query.categoryId &&
      !mongoose.Types.ObjectId.isValid(req.query.categoryId)
    ) {
      return res.status(400).json({
        message: 'Invalid category ID',
      });
    }

    if (req.query.startDate && Number.isNaN(Date.parse(req.query.startDate))) {
  return res.status(400).json({
    message: 'Invalid start date',
  });
}

if (req.query.endDate && Number.isNaN(Date.parse(req.query.endDate))) {
  return res.status(400).json({
    message: 'Invalid end date',
  });
}

    const { start, end } = getMonthRange(month);

    const filter = buildTransactionFilter(req.user._id, {
      ...req.query,
      startDate: undefined,
      endDate: undefined,
    });

    // Keep the monthly report restricted to the requested month.
    filter.occurredAt = {
      $gte: start,
      $lt: end,
    };

    // Optional date filters can narrow the month.
    if (req.query.startDate) {
      filter.occurredAt.$gte = new Date(
        `${req.query.startDate}T00:00:00.000Z`
      );
    }

    if (req.query.endDate) {
      const endDate = new Date(
        `${req.query.endDate}T00:00:00.000Z`
      );

      endDate.setUTCDate(endDate.getUTCDate() + 1);

      filter.occurredAt.$lt = endDate;
    }

    const transactions = await Transaction.find(filter).sort({
      occurredAt: 1,
    });

    const totalIncome = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpense = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const expenseTransactions = transactions.filter(
      (transaction) => transaction.type === 'expense'
    );

    const categoryBreakdown = await buildCategoryBreakdown(
      expenseTransactions,
      totalExpense
    );

    const dailySpend = buildDailySpend(
      expenseTransactions
    );

    const weeklySpend = buildWeeklySpend(
      expenseTransactions
    );

    res.json({
      data: {
        month,
        filters: {
          categoryId: req.query.categoryId || null,
          type: req.query.type || null,
          source: req.query.source || null,
          startDate: req.query.startDate || null,
          endDate: req.query.endDate || null,
        },
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        categoryBreakdown,
        dailySpend,
        weeklySpend,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

/*
  GET /api/ccoin/reports/monthly/pdf?month=YYYY-MM
*/
router.get('/monthly/pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');

    const month =
      req.query.month ||
      new Date().toISOString().slice(0, 7);

    // Validate YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({
        message: 'Month must be in YYYY-MM format',
      });
    }

    const { start, end } = getMonthRange(month);

    const transactions = await Transaction.find({
      userId: req.user._id,
      occurredAt: {
        $gte: start,
        $lt: end,
      },
    }).sort({
      occurredAt: 1,
    });

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

    const expenseTransactions = transactions.filter(
      (transaction) => transaction.type === 'expense'
    );

    const categoryBreakdown = await buildCategoryBreakdown(
      expenseTransactions,
      totalExpense
    );

    const dailySpend = buildDailySpend(
      expenseTransactions
    );

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
    });

    const filename = `CampusCoin-Monthly-Report-${month}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    doc.pipe(res);

    // ─────────────────────────────────────────────
    // Header
    // ─────────────────────────────────────────────

    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('CampusCoin');

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Monthly Financial Report');

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Report Month: ${month}`);

    doc.moveDown();

    // ─────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Monthly Summary');

    doc.moveDown(0.5);

    doc
      .fontSize(11)
      .font('Helvetica')
      .text(`Total Income: ${totalIncome.toLocaleString()} NGN`)
      .text(`Total Expense: ${totalExpense.toLocaleString()} NGN`)
      .text(
        `Net Savings: ${(totalIncome - totalExpense).toLocaleString()} NGN`
      );

    doc.moveDown();

    // ─────────────────────────────────────────────
    // Category Breakdown
    // ─────────────────────────────────────────────

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Expense by Category');

    doc.moveDown(0.5);

    if (categoryBreakdown.length === 0) {
      doc
        .fontSize(11)
        .font('Helvetica')
        .text('No expense transactions for this month.');
    } else {
      categoryBreakdown.forEach((category) => {
        doc
          .fontSize(11)
          .font('Helvetica')
          .text(
            `${category.categoryName}: ${category.amount.toLocaleString()} NGN (${category.percentage}%)`
          );
      });
    }

    doc.moveDown();

    // ─────────────────────────────────────────────
    // Daily Spending
    // ─────────────────────────────────────────────

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Daily Spending');

    doc.moveDown(0.5);

    if (dailySpend.length === 0) {
      doc
        .fontSize(11)
        .font('Helvetica')
        .text('No expense transactions for this month.');
    } else {
      dailySpend.forEach((day) => {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(
            `${day.date} - ${day.amount.toLocaleString()} NGN`
          );
      });
    }

    doc.moveDown();

    // ─────────────────────────────────────────────
    // Footer
    // ─────────────────────────────────────────────

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(
        'Generated by CampusCoin',
        {
          align: 'center',
        }
      );

    doc.end();
  } catch (err) {
    console.error(err);

    if (!res.headersSent) {
      return res.status(500).json({
        message: 'Unable to generate report',
      });
    }

    res.end();
  }
});

/*
  GET /api/ccoin/reports/six-months
*/
router.get('/six-months', async (req, res) => {
  try {
    const now = new Date();

    // First day of the current month
    const end = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    // First day of the month five months ago
    const start = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    const transactions = await Transaction.find({
      userId: req.user._id,
      occurredAt: {
        $gte: start,
        $lt: end,
      },
    }).sort({
      occurredAt: 1,
    });

    const monthMap = {};

    // Create six months even when there are no transactions.
    for (let i = 0; i < 6; i += 1) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - i),
        1
      );

      const monthKey = date.toISOString().slice(0, 7);

      monthMap[monthKey] = {
        month: monthKey,
        income: 0,
        expense: 0,
        netSavings: 0,
      };
    }

    transactions.forEach((transaction) => {
      const monthKey = transaction.occurredAt
        .toISOString()
        .slice(0, 7);

      if (!monthMap[monthKey]) {
        return;
      }

      if (transaction.type === 'income') {
        monthMap[monthKey].income += transaction.amount;
      }

      if (transaction.type === 'expense') {
        monthMap[monthKey].expense += transaction.amount;
      }
    });

    const data = Object.values(monthMap).map((item) => ({
      ...item,
      netSavings: item.income - item.expense,
    }));

    res.json({
      data,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;