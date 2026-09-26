const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

async function checkBudgetAfterTransaction(userId, categoryId, occurredAt) {
  try {
    const date = new Date(occurredAt);

    const month = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}`;

    const budgetMonth = new Date(`${month}-01T00:00:00.000Z`);

        

        const budget = await Budget.findOne({
        user: userId,
        category: categoryId,
        month: budgetMonth,
        });
    // No budget exists for this category/month.
    if (!budget) return null;

    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    const result = await Transaction.aggregate([
      {
        $match: {
          userId,
          categoryId,
          type: 'expense',
          occurredAt: {
            $gte: start,
            $lt: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const totalSpent = result[0]?.totalSpent || 0;

    const percentage =
      budget.limitAmount > 0
        ? (totalSpent / budget.limitAmount) * 100
        : 0;

    // Budget exceeded
    if (percentage >= 100) {
      return Notification.create({
        user: userId,
        type: 'budget-exceeded',
        title: 'Budget exceeded',
        message: `You have exceeded your budget for this category.`,
        severity: 'high',
        meta: {
          budgetId: budget._id,
          categoryId,
          month,
          limitAmount: budget.limitAmount,
          totalSpent,
          percentage: Math.round(percentage),
        },
      });
    }

    // Budget approaching limit
    if (percentage >= 80) {
      return Notification.create({
        user: userId,
        type: 'budget-near',
        title: 'Budget warning',
        message: `You have used ${Math.round(
          percentage
        )}% of your budget for this category.`,
        severity: 'medium',
        meta: {
          budgetId: budget._id,
          categoryId,
          month,
          limitAmount: budget.limitAmount,
          totalSpent,
          percentage: Math.round(percentage),
        },
      });
    }

    return null;
  } catch (err) {
    // Notification failure should not prevent the transaction itself
    // from succeeding.
    console.error('Budget alert error:', err);
    return null;
  }
}

module.exports = {
  checkBudgetAfterTransaction,
};