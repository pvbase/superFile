const mongoose = require("mongoose");
const generalLedgerSchema = new mongoose.Schema(
    {
        transactionId: {type: mongoose.Types.ObjectId}, 
        transactionCreatedAt: {type: Date}, 
        transactionDisplayName: {type: String}, 
        tallyDaybookId: {type: String}, 
        tallyLedgerName: {type: String}, 
        entityId: {type: mongoose.Types.ObjectId}, 
        coaCode: {type: String}, 
        coaName: {type:String, default: null},
        openingBalance: {type: Number, default: 0.0}, 
        creditAmount: {type: Number, default: 0.0}, 
        debitAmount: {type: Number, default: 0.0}, 
        balanceAmount: {type: Number, default: 0.0}, 
        createdBy: {type: mongoose.Types.ObjectId}, 
        updatedBy: {type: mongoose.Types.ObjectId}
    },
    { timestamps: true }
);
module.exports = generalLedgerSchema;