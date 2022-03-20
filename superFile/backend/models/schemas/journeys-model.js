const mongoose = require("mongoose");

const journeysSchema = new mongoose.Schema(
    {
        primaryCoaCode: { type: String, required: true },
        primaryTransaction: { type: String, required: true },
        transaction: { type: String, required: true },
        transactionDate: { type: Date, required: true },
        ledgerId: { type: mongoose.Types.ObjectId, required: true },
        creditAmount: { type: Number },
        debitAmount: { type: Number },
        pendingAmount: { type: Number },
    },
    { timestamps: true }
);

module.exports = journeysSchema;
