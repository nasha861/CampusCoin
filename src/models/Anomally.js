const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transaction: { type: mongoose.Schema.Types.ObjectId, required: true }, // Income or Expense _id
    transactionModel: { type: String, enum: ['Income', 'Expense'], required: true },
    type: {
      type: String,
      enum: ['unusually-large', 'possible-duplicate'],
      required: true,
    },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    reason: { type: String }, // human-readable explanation
    meta: { type: Object },   // { amount, avgAmount, ratio, duplicateOf }
    isReviewed: { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

anomalySchema.index({ user: 1, transaction: 1, type: 1 }, { unique: true });
anomalySchema.index({ user: 1, isDismissed: 1, createdAt: -1 });

module.exports = mongoose.model('Anomaly', anomalySchema);