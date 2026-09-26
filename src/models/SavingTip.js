const mongoose = require('mongoose');

const savingTipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    category: { type: String, trim: true },
    isAiGenerated: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SavingTip', savingTipSchema);
