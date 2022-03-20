const mongoose = require("mongoose");

const generalLedgerSchema = new mongoose.Schema(
    {
        transactionId: {type: mongoose.Types.ObjectId}, 
        transactionDate: {type: Date}, 
        transactionDisplayName: {type: String}, 
        tallyDaybookId: {type: String}, 
        tallyLedgerName: {type: String}, 
        entityId: {type: mongoose.Types.ObjectId}, 
        coaCode: {type: String}, 
        openingBalance: {type: Number, default: 0.0}, 
        creditAmount: {type: Number, default: 0.0}, 
        debitAmount: {type: Number, default: 0.0}, 
        balanceAmount: {type: Number, default: 0.0}, 
        pendingAmount: {type: Number, default: 0.0}, 
        reconciled: {type: Boolean, default: false}, 
        reconciliationMethod: {type: String}, 
        reconciliationRemarks: {type: String}, 
        createdBy: {type: mongoose.Types.ObjectId}, 
        updatedBy: {type: mongoose.Types.ObjectId}
    },
    { timestamps: true }
);

module.exports = generalLedgerSchema;
