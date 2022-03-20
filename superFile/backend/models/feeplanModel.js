const mongoose = require("mongoose");
const feeplanschema = new mongoose.Schema(
  {
    applicationId: { type: String },
    studentRegId: { type: String },
    programPlanHEDAId: { type: String },
    totalAmount: { type: Number },
    plannedAmount: { type: Number },
    plannedAmountBreakup: { type: Array },
    paidAmount: { type: Number },
    paidAmountBreakup: { type: Array },
    pendingAmount: { type: Number },
    pendingAmountBreakup: { type: Object },
    currency: { type: String },
    forex: { type: String },
    discountType: { type: String },
    discountPercentage: { type: Number },
    discountAmount: { type: Number },
    discountAmountBreakup: { type: Array },
    installmentPlan: { type: Object },
    campusId: { type: String },
    remarks: { type: Object },
    isUpdated: { type: Boolean },
    concessionFees: { type: Number },
  },
  { timestamps: true },
  { _id: false }
);

module.exports = feeplanschema;
