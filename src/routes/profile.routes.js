const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// All profile routes require auth
router.use(protect);

// GET /api/v1/profile
router.get('/', async (req, res) => {
  try {
    res.json({ data: req.user.toPublic() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/profile
router.patch('/', async (req, res) => {
  try {
    const allowed = ['fullName', 'school', 'academicYear', 'monthlyAllowanceBaseline', 'savingsGoalAmount', 'avatarUrl'];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ data: user.toPublic() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/v1/profile/settings
router.get('/settings', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ data: user.settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/v1/profile/settings
router.patch('/settings', async (req, res) => {
  try {
    const allowed = [
      'currency', 'monthlyIncomeGoal', 'budgetAlertThreshold',
      'emailNotifications', 'pushNotifications',
      'aiCategorizationEnabled', 'aiInsightsEnabled',
    ];
    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[`settings.${key}`] = req.body[key];
    });

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true });
    res.json({ data: user.settings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
