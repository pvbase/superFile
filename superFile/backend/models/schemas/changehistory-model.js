const mongoose = require("mongoose");
const changeHistorySchema = new mongoose.Schema(
  {
    collectionName: { type: String, required: true },
    userId: { type: String, required: true },
    referenceId: { type: Object, required: true },
    oldData: { type: JSON },
    newData: { type: JSON },
    version: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

module.exports = changeHistorySchema;
