const mongoose = require("mongoose");
const feeCollectionSchema = mongoose.Schema(
    {
        displayName: { type: String, required: [true, "Display Name required"], unique: true },
        transactionDate: { type: String, required: [true, "Transaction Date required"], },
        relatedTransactions: { type: Array, required: false, default: [] },
        transactionType: { type: String, required: [true, "Transaction Type required"], },
        transactionSubType: { type: String, required: [true, "Transaction Subtype required"], },
        amount: { type: Number, required: [true, "Total Amount required"], },
        status: { type: String, required: [true, "Status required"] },
        data: {
            displayName: { type: String, required: [true, "Data Display Name required"] },
            type: { type: String, required: [true, "Transaction Type required"] },
            mode: { type: String, required: [true, "Payment Mode required"] },
            modeDetails: {
                netBankingType: { type: String, required: [false, "Net Banking Type required"] },
                walletType: { type: String, required: [false, "Wallet Type required"] },
                instrumentNo: { type: String, required: [true, "Instrument Number required"] },
                instrumentDate: { type: Date, required: [true, "Instrument Date required"] },
                bankName: { type: String, required: [true, "Bank Name required"] },
                branchName: { type: String, required: [true, "Branch Name required"] },
                transactionId: { type: String, required: [true, "Transaction ID required"] },
                remarks: { type: String, required: false, default: null },
            },
            amount: { type: Number, required: [true, "Amount required"] },
            paymentReferenceId: { type: String, required: true }
        },
        demandNoteId: { type: String, required: true }
    },
    { timestamps: true }
);
//mongoose.set("useFindAndModify", false);
feeCollectionSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = feeCollectionSchema;