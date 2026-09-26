const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['monthly', 'six-month', 'daily', 'weekly', 'category'], required: true },
    period: { type: String }, // e.g. "2026-04", "week-15", "2026-04-15"
    startDate: { type: Date },
    endDate: { type: Date },
    data: { type: Object }, // snapshot of computed results
  },
  { timestamps: true }
);

reportSchema.index({ user: 1, type: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);