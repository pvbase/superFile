const mongoose = require("mongoose");
const demandNoteSchema = mongoose.Schema(
    {
        displayName: { type: String, required: [true, "Display Name Required"], unique: true },
        transactionType: { type: String, required: [true, "Transaction Type Required"], },
        transactionSubType: { type: String, required: [true, "Transaction Subtype Required"], },
        emailCommunicationRefIds: { type: Array, required: true },
        smsCommunicationRefIds: { type: Array, required: false },
        relatedTransactions: {
            type: Array, required: false, default: [],
            transactionRefId: mongoose.Types.ObjectId, required: false
        },
        transactionDate: { type: Date, required: true },
        studentRegId: { type: String, required: true },
        studentName: { type: String },
        academicYear: { type: String },
        class: { type: String },
        programPlan: { type: String }, 
        amount: { type: Number, required: [true, "Total Fees Required"] },
        status: { type: String, required: true },
        studentId: { type: mongoose.Types.ObjectId, required: [true, "Student ID required"] },
        dueDate: { type: Date, required: [true, "Due Date Required"] },
        feesBreakup: {
            type: Array, required: [true, "Fees Breakup Required"],
            feeType: { type: String, required: [true, "Fee Type required"] },
            amount: { type: Number, required: [true, "Fee Breakup Amount required"] },
        },
        pendingAmount: { type: Number, required: [true, "Pending Fees is Required"] },
        htmlBody: {type:String},
        termsAndConditions: {type: String},
    },
    { timestamps: true }
);
//mongoose.set("useFindAndModify", false);
demandNoteSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = demandNoteSchema;