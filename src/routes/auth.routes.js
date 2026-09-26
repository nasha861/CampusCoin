const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Category = require('../models/Category');
const { protect } = require('../middleware/auth');

const DEFAULT_CATEGORIES = [
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#22c55e' },
  { name: 'Allowance', type: 'income', icon: 'wallet', color: '#10b981' },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#06b6d4' },
  { name: 'Gift', type: 'income', icon: 'gift', color: '#8b5cf6' },
  { name: 'Food & Drinks', type: 'expense', icon: 'utensils', color: '#f97316' },
  { name: 'Transport', type: 'expense', icon: 'car', color: '#3b82f6' },
  { name: 'Housing', type: 'expense', icon: 'home', color: '#6366f1' },
  { name: 'Utilities', type: 'expense', icon: 'zap', color: '#eab308' },
  { name: 'Healthcare', type: 'expense', icon: 'heart', color: '#ef4444' },
  { name: 'Education', type: 'expense', icon: 'book', color: '#0ea5e9' },
  { name: 'Entertainment', type: 'expense', icon: 'music', color: '#d946ef' },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#f43f5e' },
  { name: 'Savings', type: 'expense', icon: 'piggy-bank', color: '#14b8a6' },
  { name: 'Other', type: 'expense', icon: 'more-horizontal', color: '#94a3b8' },
];

function signTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, school, academicYear, monthlyAllowanceBaseline, savingsGoalAmount } = req.body;

    if (!fullName?.trim()) return res.status(400).json({ message: 'Full name is required', fieldErrors: { fullName: 'Required' } });
    if (!email?.trim()) return res.status(400).json({ message: 'Email is required', fieldErrors: { email: 'Required' } });
    if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters', fieldErrors: { password: 'At least 8 characters' } });

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists. Log in instead.', code: 'EMAIL_TAKEN' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'student',
      school,
      academicYear,
      monthlyAllowanceBaseline,
      savingsGoalAmount,
    });

    // Seed default categories for the new user
    await Category.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, userId: user._id, isDefault: true })),
    );

    const { accessToken, refreshToken } = signTokens(user._id);
    res.status(201).json({ data: { user: user.toPublic(), accessToken, refreshToken } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'No account found with this email. Create one instead.', code: 'ACCOUNT_NOT_FOUND' });

    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ message: 'Incorrect password. Please try again.', code: 'INVALID_PASSWORD' });

    if (!user.isActive) return res.status(403).json({ message: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });

    const { accessToken, refreshToken } = signTokens(user._id);
    res.json({ data: { user: user.toPublic(), accessToken, refreshToken } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/auth/logout  (client-side token drop; server-side is a no-op for stateless JWT)
router.post('/logout', protect, (_req, res) => {
  res.json({ data: null, message: 'Logged out' });
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ message: 'Invalid token type' });

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found or suspended' });

    const tokens = signTokens(user._id);
    res.json({ data: { user: user.toPublic(), ...tokens } });
  } catch {
    res.status(401).json({ message: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' });
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    // Always return 200 to prevent email enumeration
    if (!user) return res.json({ data: null, message: 'If that email exists, a reset link was sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // TODO: send email via nodemailer using EMAIL_USER / EMAIL_PASS
    console.log(`[DEV] Password reset token for ${email}: ${token}`);

    res.json({ data: null, message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Token and a new password (min 8 chars) are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Token is invalid or has expired', code: 'INVALID_TOKEN' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ data: null, message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
