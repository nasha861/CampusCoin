const router = require('express').Router();
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');
const { checkBudgetAfterTransaction } = require('../services/budgetAlert.service');

router.use(protect);

function formatTx(t) {
  return {
    id: t._id.toString(),
    userId: t.userId.toString(),
    categoryId: t.categoryId.toString(),
    type: t.type,
    amount: t.amount,
    description: t.description,
    merchant: t.merchant,
    occurredAt: t.occurredAt,
    source: t.source,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

// GET /api/v1/transactions
router.get('/', async (req, res) => {
  try {
    const { categoryId, type, startDate, endDate, search, page = 1, pageSize = 20 } = req.query;

    const filter = { userId: req.user._id };
    if (categoryId) filter.categoryId = categoryId;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.occurredAt = {};
      if (startDate) filter.occurredAt.$gte = new Date(startDate);
      if (endDate) filter.occurredAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize)));
    const skip = (pageNum - 1) * pageSizeNum;

    const [items, totalItems] = await Promise.all([
      Transaction.find(filter).sort({ occurredAt: -1 }).skip(skip).limit(pageSizeNum),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      data: {
        items: items.map(formatTx),
        page: pageNum,
        pageSize: pageSizeNum,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSizeNum),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ data: formatTx(tx) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/transactions
router.post('/', async (req, res) => {
  try {
    const { categoryId, type, amount, description, merchant, occurredAt } = req.body;
    if (!categoryId || !type || amount === undefined || !occurredAt) {
      return res.status(400).json({ message: 'categoryId, type, amount and occurredAt are required' });
    }

    // Verify the category belongs to this user or is a default
    const cat = await Category.findOne({ _id: categoryId, $or: [{ userId: req.user._id }, { userId: null }] });
    if (!cat) return res.status(400).json({ message: 'Invalid category' });

    const tx = await Transaction.create({
  userId: req.user._id,
  categoryId,
  type,
  amount: Number(amount),
  description,
  merchant,
  occurredAt: new Date(occurredAt),
  source: 'manual',
});

if (tx.type === 'expense') {
  await checkBudgetAfterTransaction(
    req.user._id,
    tx.categoryId,
    tx.occurredAt
  );
}

    res.status(201).json({ data: formatTx(tx) });

   
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/transactions/:id
router.patch('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });

    const allowed = ['categoryId', 'type', 'amount', 'description', 'merchant', 'occurredAt'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        if (key === 'amount') tx.amount = Number(req.body[key]);
        else if (key === 'occurredAt') tx.occurredAt = new Date(req.body[key]);
        else tx[key] = req.body[key];
      }
    });
    await tx.save();

    res.json({ data: formatTx(tx) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/v1/transactions/:id
router.delete('/:id', async (req, res) => {
  try {
    const tx = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    await tx.deleteOne();
    res.json({ data: null, message: 'Transaction deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/transactions/import/preview
// Expects multipart/form-data with a CSV file field named "file"
router.post('/import/preview', async (req, res) => {
  try {
    // Minimal CSV parsing — reads raw text body sent as application/json { csv: "..." }
    // or plain text. For a full multipart solution add multer; keeping it simple for now.
    const raw = req.body.csv || '';
    if (!raw) return res.status(400).json({ message: 'No CSV data provided. Send { csv: "<csv string>" }' });

    const lines = raw.trim().split('\n').filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().includes('date') ? lines.slice(1) : lines;

    const rows = [];
    let invalidRows = 0;

    for (const line of dataLines) {
      const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
      const [occurredAt, description, amountStr] = parts;
      const amount = parseFloat(amountStr);
      if (!occurredAt || isNaN(amount)) { invalidRows++; continue; }
      rows.push({ occurredAt, description: description || '', amount });
    }

    res.json({ data: { rows, totalRows: rows.length + invalidRows, invalidRows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/transactions/import/confirm
router.post('/import/confirm', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'rows array is required' });
    }

    // Find a fallback "Other" category for this user
    const fallback = await Category.findOne({
      $or: [{ userId: req.user._id }, { userId: null }],
      name: { $regex: /^other$/i },
    });

    const docs = rows
      .filter((r) => r.occurredAt && r.amount != null)
      .map((r) => ({
        userId: req.user._id,
        categoryId: r.suggestedCategoryId || fallback?._id,
        type: r.amount >= 0 ? 'income' : 'expense',
        amount: Math.abs(r.amount),
        description: r.description,
        occurredAt: new Date(r.occurredAt),
        source: 'csv-import',
      }))
      .filter((d) => d.categoryId);

    const created = await Transaction.insertMany(docs);
    res.status(201).json({ data: created.map(formatTx) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
