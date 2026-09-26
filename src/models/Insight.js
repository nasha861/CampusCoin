const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    kind: {
      type: String,
      enum: ['monthly-summary', 'spending-alert', 'saving-tip'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    month: { type: String, match: /^\d{4}-\d{2}$/ },
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

insightSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Insight', insightSchema);
