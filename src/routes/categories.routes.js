const router = require('express').Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

router.use(protect);

function formatCategory(c) {
  return {
    id: c._id.toString(),
    name: c.name,
    type: c.type,
    icon: c.icon,
    color: c.color,
    isDefault: c.isDefault,
    userId: c.userId?.toString() ?? null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// GET /api/v1/categories  — returns user's own + system defaults
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({
      $or: [{ userId: req.user._id }, { userId: null, isDefault: true }],
    }).sort({ name: 1 });
    res.json({ data: categories.map(formatCategory) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/categories
router.post('/', async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name?.trim() || !type) return res.status(400).json({ message: 'Name and type are required' });

    const category = await Category.create({ name: name.trim(), type, icon, color, userId: req.user._id, isDefault: false });
    res.status(201).json({ data: formatCategory(category) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A category with this name and type already exists' });
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/categories/:id
router.patch('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const allowed = ['name', 'icon', 'color'];
    allowed.forEach((key) => { if (req.body[key] !== undefined) category[key] = req.body[key]; });
    await category.save();

    res.json({ data: formatCategory(category) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/v1/categories/:id
router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, userId: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.deleteOne();
    res.json({ data: null, message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
