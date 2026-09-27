
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    month: {
      type: Date,
      required: true,
    },

    limitAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One budget per user, category, and month
budgetSchema.index(
  {
    userId: 1,
    categoryId: 1,
    month: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model('Budget', budgetSchema);
