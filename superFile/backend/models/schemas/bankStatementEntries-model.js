const mongoose = require("mongoose");

const bankStmtEntriesSchema = new mongoose.Schema(
    {
        reconciliationListId: {type:String},
        bankName: {type: String}, 
        accountNumber: {type: String}, 
        transactionDate: {type: Date}, // txn date from POS Stmt is populated in this field 
        valueDate: {type: Date}, 
        debitAmount: {type: Number}, 
        creditAmount: {type: Number}, // txn amount from POS Stmt is populated in this field 
        // creditOrDebit: {type: String}, 
        balance: {type: Number}, 
        chequeNo: {type: String}, 
        txnRefNo: {type: String}, 
        description: {type: String}, 
        mode: {type: String}, 
        bankTxnId: {type: String}, 
        depositor: {type: String}, 
        beneficiary: {type: String}, 
        fromBank: {type: String}, 
        reconciled: {type: Boolean, default: false}, 
        reconciliationMethod: {type: String}, 
        reconciliationRemarks: {type: String}, 
        // softwareReconciled: {type: Boolean, default: false}, 
        // isPointOfSaleTxn: {type: Boolean, default: false}, 
        statementType: {type: String, default: 'BANK'}, // 'BANK', 'POS', etc 
        internationalAmount: {type: Number}, 
        cardType: {type: String}, 
        cardNumber: {type: String}, // // card number from POS Stmt is populated in this field 
        approvalCode: {type: String} // authCode from POS Stmt is populated in this field 
    },
    { timestamps: true }
);

module.exports = bankStmtEntriesSchema;
