const mongoose = require("mongoose");

const feesLedgerSchema = new mongoose.Schema(
  {
    transactionId: { type: mongoose.Types.ObjectId },
    transactionDate: { type: Date },
    transactionDisplayName: { type: String, required: true },
    primaryTransaction: { type: String },
    transactionType: { type: String, required: true },
    transactionSubType: { type: String },
    feeTypeCode: { type: String, required: true },
    dueAmount: { type: Number },
    paidAmount: { type: Number },
    refundAmount: { type: Number },
    pendingAmount: { type: Number }, // may remain unused?
    paymentTransactionId: { type: String }, // RazorPay or other txn id to be populeted on payment
    status: { type: String },
    studentId: { type: mongoose.Types.ObjectId },
    studentRegId: { type: String },
    studentName: { type: String },
    academicYear: { type: String },
    class: { type: String },
    programPlan: { type: mongoose.Types.ObjectId },
    reconciliationStatus: { type: String },
    receiptStatus: { type: String },
    createdBy: { type: String },
    updatedBy: { type: String },
    campusId: { type: String },
    reasonForCancel: { type: String, required: [false] }
  },
  { timestamps: true }
);

module.exports = feesLedgerSchema;
