const mongoose = require('mongoose');

const dismissedMoneyMoveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moneyMoveId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

dismissedMoneyMoveSchema.index(
  { userId: 1, moneyMoveId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  'DismissedMoneyMove',
  dismissedMoneyMoveSchema
);