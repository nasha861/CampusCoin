const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    isDefault: { type: Boolean, default: false }, // system vs user-created
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for system defaults
    },
    icon: { type: String }, // optional emoji or icon name
  },
  { timestamps: true }
);

// Prevent duplicate names per user + type
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);