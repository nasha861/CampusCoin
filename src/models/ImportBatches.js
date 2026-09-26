const mongoose = require('mongoose');

const importBatchSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String },
    totalRows: { type: Number, default: 0 },
    importedRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'previewed', 'imported', 'failed'],
      default: 'pending',
    },
    errors: [{ row: Number, message: String }],
    previewData: { type: Array }, // staged rows before confirm
  },
  { timestamps: true }
);

importBatchSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('ImportBatch', importBatchSchema);