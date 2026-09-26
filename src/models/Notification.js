const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['budget-near', 'budget-exceeded', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'medium', 'high'], default: 'info' },
    meta: { type: Object }, // e.g. { budgetId, categoryId, percentage }
    isRead: { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isDismissed: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);