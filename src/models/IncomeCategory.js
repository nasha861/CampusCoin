const mongoose = require('mongoose');

const incomeCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }, // system vs user-created
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null = system default
    },
    icon: { type: String },
  },
  { timestamps: true }
);

incomeCategorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('IncomeCategory', incomeCategorySchema);