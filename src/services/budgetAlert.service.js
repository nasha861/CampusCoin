const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

async function checkBudgetAfterTransaction(
  userId,
  categoryId,
  occurredAt
) {
  try {
    const date = new Date(occurredAt);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const year = date.getUTCFullYear();
    const monthNumber = date.getUTCMonth();

    const month = `${year}-${String(monthNumber + 1).padStart(2, '0')}`;

    const budgetMonth = new Date(
      Date.UTC(year, monthNumber, 1)
    );

    // Find the budget for this user/category/month
    const budget = await Budget.findOne({
      userId,
      categoryId,
      month: budgetMonth,
    });

    // No budget exists for this category/month.
    if (!budget) {
      return null;
    }

    const start = new Date(
      Date.UTC(year, monthNumber, 1)
    );

    const end = new Date(
      Date.UTC(year, monthNumber + 1, 1)
    );

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
          totalSpent: {
            $sum: '$amount',
          },
        },
      },
    ]);

    const totalSpent = result[0]?.totalSpent || 0;

    const percentage =
      budget.limitAmount > 0
        ? (totalSpent / budget.limitAmount) * 100
        : 0;

    let notificationType = null;
    let title = null;
    let message = null;
    let severity = null;

    // Budget exceeded
    if (percentage >= 100) {
      notificationType = 'budget-exceeded';
      title = 'Budget exceeded';
      message =
        'You have exceeded your budget for this category.';
      severity = 'high';
    }
    // Budget approaching limit
    else if (percentage >= 80) {
      notificationType = 'budget-near';
      title = 'Budget warning';
      message = `You have used ${Math.round(
        percentage
      )}% of your budget for this category.`;
      severity = 'medium';
    }
    // Still below warning threshold
    else {
      return null;
    }

    // Prevent repeated notifications for the same
    // budget threshold during the same month.
    const existingNotification =
      await Notification.findOne({
        userId,
        type: notificationType,
        'meta.budgetId': budget._id,
        'meta.month': month,
      });

    if (existingNotification) {
      return existingNotification;
    }

    return Notification.create({
      userId,
      type: notificationType,
      title,
      message,
      severity,
      meta: {
        budgetId: budget._id,
        categoryId,
        month,
        limitAmount: budget.limitAmount,
        totalSpent,
        percentage: Math.round(percentage),
      },
    });
  } catch (err) {
    // Notification failure should never prevent
    // the transaction itself from succeeding.
    console.error('Budget alert error:', err);
    return null;
  }
}

module.exports = {
  checkBudgetAfterTransaction,
};