const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },

    icon: {
      type: String,
    },

    color: {
      type: String,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
        },
        { timestamps: true }
 );

        // Prevent duplicate category names of the same type
        // for the same user/system.
        categorySchema.index(
        { userId: 1, name: 1, type: 1 },
        { unique: true }
        );

module.exports = mongoose.model('Category', categorySchema);