const mongoose = require("mongoose");

const transactionsSchema = new mongoose.Schema(
    {
        displayName: { type: String, required: true, unique: true },
        entityId: {type: mongoose.Types.ObjectId}, 
        transactionType: { type: String, required: true}, 
        transactionSubType: {type: String}, 
        transactionDate: {type: Date, required: true}, 
        tallyVchNum: {type: String}, 
        tallyVchType: {type: String}, 
        tallyNarration: { type: String }, 
        tallyId: { type: String }, 
        tallyIsCancelled: { type: String }, 
        tallyIsInvoice: {type: String }, 
        tallyPartyLedgerName: { type: String}, 
        tallyDetails: {type: JSON}, 
        primaryCoaCode: {type: String}, 
        amount: {type: Number}, 
        relatedTransactions: [{type: String}], 
        primaryTransaction: {type: String}, 
        ledgerIds: [{type: mongoose.Types.ObjectId}], 
        numberOfLedgerEntries: {type: Number}, 
        supportings: [{type: mongoose.Types.ObjectId}], 
        data: {type: JSON}, 
        status: {type: String}, 
        pendingAmount: {type: Number, default: 0.0}, 
        createdBy: {type: mongoose.Types.ObjectId}, 
        updatedBy: {type: mongoose.Types.ObjectId}, 
        additionalField1: {type: JSON}, 
        additionalField2: {type: JSON} 
    },
    { timestamps: true }
);

module.exports = transactionsSchema;
