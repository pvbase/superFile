const mongoose = require("mongoose");

const reconciliationManagerSchema = new mongoose.Schema(
    {
        reconciliationId: {type: String, required: true}, 
        reconciliationOf: { type: String, default: "Bank" },
        attemptedTransactions: { type: Number }, 
        reconciledTransactions: { type: Number }, 
        reconciledTransactionsDetails: { type: JSON }, 
        reconciledBankStmtEntryDetails: { type: JSON },
        reconciledRefundTransactions: {type: JSON}, 
        nonreconciledRefundTransactions: {type: JSON},
        nonreconciledTransactionsDetails: { type: JSON }, 
        nonreconciledBankStmtEntryDetails: { type: JSON },
        reconciledRefundBankStmtEntryDetails: {type: JSON},  
        reconciledAmount: { type: Number }, 
        reconciledPercent: { type: Number },
        status: {
            type: String, 
            // enum: ["initial", "nonreconciled","softwarereconciled", "reconciled"]
        }
    },
    { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
reconciliationManagerSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = reconciliationManagerSchema;
