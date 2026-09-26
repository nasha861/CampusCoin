const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const settingsSchema = new mongoose.Schema(
  {
    currency: { type: String, default: 'NGN' },
    monthlyIncomeGoal: { type: Number, default: null },
    budgetAlertThreshold: { type: Number, default: 80 },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    aiCategorizationEnabled: { type: Boolean, default: false },
    aiInsightsEnabled: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    school: { type: String, trim: true },
    academicYear: { type: String, trim: true },
    monthlyAllowanceBaseline: { type: Number },
    savingsGoalAmount: { type: Number },
    avatarUrl: { type: String },
    isActive: { type: Boolean, default: true },
    settings: { type: settingsSchema, default: () => ({}) },
    // Used for password reset flow
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true },
);

// Compare plain password against stored hash
userSchema.methods.matchPassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Convert to public-facing shape (strip sensitive fields)
userSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    role: this.role,
    school: this.school,
    academicYear: this.academicYear,
    monthlyAllowanceBaseline: this.monthlyAllowanceBaseline,
    savingsGoalAmount: this.savingsGoalAmount,
    avatarUrl: this.avatarUrl,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
