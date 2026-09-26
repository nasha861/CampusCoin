const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: {
      type: String,
      enum: ['tip', 'insight', 'report'],
      required: true,
    },
    itemId: { type: String }, // tip id, insight id, or report id
    title: { type: String },
    content: { type: String }, // snapshot of the tip/insight text
    meta: { type: Object },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, itemType: 1, itemId: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);