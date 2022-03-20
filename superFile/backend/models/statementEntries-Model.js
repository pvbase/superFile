const mongoose = require("mongoose");
const statementEntriesSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true
        },
        subType: {
            type: String,
            enum: ["creditCard", "debitCard", "imps", "neft", "rtgs", "phonePay", "googlePay", "paytm", null]
        },
        date: {
            type: Date,
            required: true
        },
        remarks: {
            type: String
        },
        referenceNumber: {
            type: String,
            required:true,
            unique:true
        },
        amount: {
            type: Number
        },
        transactionType: {
            type: String,
            enum: ["credit", "debit"]
        },
        bankName: {
            type: String
        },
        branchName: {
            type: String
        },
        IFSC: {
            type: String
        },
        cardSubType: {
            type: String,
            enum: ["visa", "master", "rupay", null]
        },
        accountName: {
            type: String // Name on card or Name of the account holder
        },
        data: {
            type: JSON
        },
        status: {
            type: String,
            enum: ["reconciled", "notReconciled", "void"]
        },
        transactionReferenceId: {
            type: mongoose.Types.ObjectId
        }

    },
    { timestamps: true }
);
//mongoose.set("useFindAndModify", false);

module.exports = statementEntriesSchema
