const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, unique: true },
    transactionType: { type: String, required: true },
    transactionSubType: { type: String },
    transactionDate: { type: String, required: true },
    studentId: { type: mongoose.Types.ObjectId },
    studentRegId: { type: String },
    studentName: { type: String },
    academicYear: { type: String },
    class: { type: String },
    programPlan: { type: mongoose.Types.ObjectId },
    paymentRefId: { type: String },
    receiptNo: { type: String },
    amount: { type: Number },
    dueDate: { type: Date },
    demandNoteUrl: { type: String },
    feesLedgerIds: [{ type: mongoose.Types.ObjectId }],
    emailCommunicationRefIds: [{ type: String }],
    smsCommunicationRefIds: [{ type: String }],
    status: { type: String },
    relatedTransactions: [{ type: String }],
    parentName: { type: String },
    paymentTransactionId: { type: String }, // RazorPay or other txn id to be populeted on payment
    reconciliationStatus: { type: String },
    receiptStatus: { type: String },
    currency: { type: String, default: "INR" },
    currencyAmount: { type: Number },
    exchangeRate: { type: Number, default: 1 },
    userName: { type: String },
    paymentDetails: { type: Object },
    createdBy: { type: String },
    updatedBy: { type: String },
    campusId: { type: String },
    type: { type: String },
    reasonForCancel: { type: String, required: [false] },
    receiptWithQr: { type: String },
    receiptWithoutQr: { type: String },
    previousPaid: { type: Number },
    pendingAmount: { type: Number },
  },
  { timestamps: true }
);

// //mongoose.set("useFindAndModify", false);
registrationSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = registrationSchema;
