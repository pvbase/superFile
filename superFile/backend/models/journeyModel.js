const mongoose = require("mongoose");

const journeysSchema = new mongoose.Schema(
  {
    primaryCoaCode: { type: String, required: true },
    primaryTransaction: { type: String },
    transaction: { type: String, required: true },
    transactionDate: { type: Date, required: true },
    ledgerId: { type: Array, required: true },
    creditAmount: { type: Number },
    debitAmount: { type: Number },
    pendingAmount: { type: Number },
    campusId: { type: String },
  },
  { timestamps: true }
);

module.exports = journeysSchema;
