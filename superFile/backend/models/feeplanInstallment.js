const mongoose = require("mongoose");
const feeplanInstallmentschema = new mongoose.Schema(
  {
    feePlanId: { type: mongoose.Types.ObjectId },
    studentRegId: { type: String },
    label: { type: String },
    title: { type: String },
    description: { type: String },
    dueDate: { type: String },
    lateFeeStartDate: { type: String },
    percentage: { type: Number },
    totalAmount: { type: Number },
    plannedAmount: { type: Number },
    plannedAmountBreakup: { type: Array },
    paidAmount: { type: Number },
    paidAmountBreakup:{ type: Array },
    pendingAmount: { type: Number },
    pendingAmountBreakup:{ type: Array },
    discountType: { type: String },
    discountPercentage: { type: Number },
    discountAmount: { type: Number },
    discountAmountBreakup: { type: Array },
    status: { type: String },
    transactionId: { type: String },
    remarks: { type: Object },
    campusId: { type: String },
    lateFees: { type: Number },
    concessionFees: { type: Number },
    term: {type: Number}

  },
  { timestamps: true },
  { _id: false }
);

module.exports = feeplanInstallmentschema;
