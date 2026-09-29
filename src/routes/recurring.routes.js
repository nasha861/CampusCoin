const router = require('express').Router();
const mongoose = require('mongoose');
const MoneyRoutine = require('../models/MoneyRoutine');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

router.use(protect);

function formatRecurring(item) {
  return {
    id: item._id.toString(),
    userId: item.user.toString(),
    categoryId: item.category.toString(),
    amount: item.amount,
    type: item.type,
    description: item.description,
    frequency: item.frequency,
    interval: item.interval,
    startDate: item.startDate,
    endDate: item.endDate,
    nextRunAt: item.nextRunAt,
    lastRunAt: item.lastRunAt,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function getNextRunDate(date, frequency, interval) {
  const next = new Date(date);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;

    case 'weekly':
      next.setDate(next.getDate() + interval * 7);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;

    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;

    default:
      throw new Error('Invalid recurrence frequency');
  }

  return next;
}

// GET /api/ccoin/money-routines
router.get('/', async (req, res) => {
  try {
    const items = await MoneyRoutine.find({
      user: req.user._id,
    }).sort({ nextRunAt: 1 });

    res.json({
      data: items.map(formatRecurring),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// POST /api/ccoin/money-routines
router.post('/', async (req, res) => {
  try {
    const {
      categoryId,
      amount,
      type,
      description,
      frequency,
      interval = 1,
      startDate,
      endDate = null,
    } = req.body;

    if (
      !categoryId ||
      amount === undefined ||
      !type ||
      !frequency ||
      !startDate
    ) {
      return res.status(400).json({
        message:
          'categoryId, amount, type, frequency and startDate are required',
      });
    }

    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({
        message: 'type must be income or expense',
      });
    }

    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(frequency)) {
      return res.status(400).json({
        message: 'Invalid frequency',
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({
        message: 'Amount cannot be negative',
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
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    const firstRun = new Date(startDate);

    const recurring = await MoneyRoutine.create({
      user: req.user._id,
      category: categoryId,
      amount: Number(amount),
      type,
      description: description?.trim(),
      frequency,
      interval: Number(interval) || 1,
      startDate: firstRun,
      endDate: endDate ? new Date(endDate) : null,
      nextRunAt: firstRun,
      isActive: true,
    });

    res.status(201).json({
      data: formatRecurring(recurring),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// PATCH /api/ccoin/money-routines/:id
router.patch('/:id', async (req, res) => {
  try {
    const recurring = await MoneyRoutine.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!recurring) {
      return res.status(404).json({
        message: 'Recurring transaction not found',
      });
    }

    const allowedFields = [
      'amount',
      'type',
      'description',
      'frequency',
      'interval',
      'startDate',
      'endDate',
      'isActive',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        recurring[field] = req.body[field];
      }
    });

    if (req.body.amount !== undefined) {
      recurring.amount = Number(req.body.amount);
    }

    if (req.body.interval !== undefined) {
      recurring.interval = Number(req.body.interval);
    }

    if (req.body.startDate !== undefined) {
      recurring.startDate = new Date(req.body.startDate);
    }

    if (req.body.endDate !== undefined) {
      recurring.endDate = req.body.endDate
        ? new Date(req.body.endDate)
        : null;
    }

    await recurring.save();

    res.json({
      data: formatRecurring(recurring),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// DELETE /api/ccoin/money-routines/:id
router.delete('/:id', async (req, res) => {
  try {
    const recurring = await MoneyRoutine.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!recurring) {
      return res.status(404).json({
        message: 'Recurring transaction not found',
      });
    }

    await recurring.deleteOne();

    res.json({
      data: null,
      message: 'Recurring transaction deleted',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

/*
  Process money-routines that are due.

  This creates a normal Transaction and moves nextRunAt forward.
*/
async function processDueRecurringTransactions() {
  const now = new Date();

  const dueItems = await MoneyRoutine.find({
    isActive: true,
    nextRunAt: { $lte: now },
    $or: [
      { endDate: null },
      { endDate: { $gte: now } },
    ],
  });

  for (const recurring of dueItems) {
    const transaction = await Transaction.create({
      userId: recurring.user,
      categoryId: recurring.category,
      amount: recurring.amount,
      type: recurring.type,
      description: recurring.description,
      source: 'recurring',
      occurredAt: recurring.nextRunAt,
    });

    recurring.lastRunAt = transaction.occurredAt;

    const nextRun = getNextRunDate(
      recurring.nextRunAt,
      recurring.frequency,
      recurring.interval
    );

    recurring.nextRunAt = nextRun;

    if (recurring.endDate && nextRun > recurring.endDate) {
      recurring.isActive = false;
    }

    await recurring.save();
  }

  return dueItems.length;
}

// POST /api/ccoin/money-routines/process
router.post('/process', async (req, res) => {
  try {
    const processed = await processDueRecurringTransactionsForUser(
      req.user._id
    );

    res.json({
      data: {
        processed,
      },
      message: 'Recurring transactions processed',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

async function processDueRecurringTransactionsForUser(userId) {
  const now = new Date();

  const dueItems = await MoneyRoutine.find({
    user: userId,
    isActive: true,
    nextRunAt: { $lte: now },
    $or: [
      { endDate: null },
      { endDate: { $gte: now } },
    ],
  });

  let processed = 0;

  for (const recurring of dueItems) {
    await Transaction.create({
      userId: recurring.user,
      categoryId: recurring.category,
      amount: recurring.amount,
      type: recurring.type,
      description: recurring.description,
      source: 'recurring',
      occurredAt: recurring.nextRunAt,
    });

    recurring.lastRunAt = recurring.nextRunAt;

    const nextRun = getNextRunDate(
      recurring.nextRunAt,
      recurring.frequency,
      recurring.interval
    );

    recurring.nextRunAt = nextRun;

    if (recurring.endDate && nextRun > recurring.endDate) {
      recurring.isActive = false;
    }

    await recurring.save();

    processed += 1;
  }

  return processed;
}

module.exports = {
  router,
  processDueRecurringTransactions,
};