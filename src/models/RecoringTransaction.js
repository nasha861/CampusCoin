const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['income', 'expense'], required: true },
    description: { type: String, trim: true },

    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    interval: { type: Number, default: 1, min: 1 }, // every N days/weeks/months/years

    startDate: { type: Date, required: true },
    endDate: { type: Date, default: null }, // null = runs forever
    nextRunAt: { type: Date, required: true }, // when to generate next
    lastRunAt: { type: Date, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

recurringSchema.index({ user: 1, isActive: 1, nextRunAt: 1 });

module.exports = mongoose.model('RecurringTransaction', recurringSchema);