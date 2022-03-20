const { createDatabase } = require("../helper_jsons/db_creation");
const coaSchema = require("../models/coaModel");
const mongoose = require("mongoose");
let updated = new Date()
updated = updated.toISOString()

async function createCreditItemLedger(orgId, items, payload, tid) {
    let dbConnection = await createDatabase(
        "ken42",
        process.env.database
    );
    let coaDataModel = dbConnection.model(
        "chartofaccounts",
        coaSchema
    );
    return new Promise(function (resolve, reject) {
        coaDataModel.findOne({ accountCode: items.creditId }).then(coaData => {
            if (coaData == null) {
                reject({ message: "chart of account not found" })
            }
            else {
                if (coaData.children.length > 0) {
                    reject({ message: "chart of account is not leaf node" })
                } else {
                    let ledgerPayload = {
                        transactionId: tid,
                        transactionCreatedAt: updated,
                        transactionDisplayName: payload.displayName,
                        tallyDaybookId: null,
                        tallyLedgerName: null,
                        entityId: payload.entityId,
                        coaCode:  items.creditId,
                        coaName: coaData._doc.name,
                        openingBalance: 0.00,
                        creditAmount: items.credit,
                        debitAmount: items.debit,
                        balanceAmount: 0.00,
                        createdBy: payload.createdBy,
                        updatedBy: payload.updatedBy,
                        ledgerId: coaData._doc._id,
                        ledgerName: coaData._doc.name,
                        orgId: orgId
                    }
                    resolve(ledgerPayload)
                }
            }
        })
    })
}

async function createDebitItemLedger(orgId, items, payload, tid) {
    let dbConnection = await createDatabase(
        "ken42",
        process.env.database
    );
    let coaDataModel = dbConnection.model(
        "chartofaccounts",
        coaSchema
    );
    return new Promise(function (resolve, reject) {
        coaDataModel.findOne({ accountCode: items.debitId }).then(coaData => {
            if (coaData == null) {
                reject({
                    message:"chart of account not found"
                })
            }
            else {
                if (coaData._doc.children.length > 0) {
                    reject({
                        message:"chart of account is not a leaf node"
                    })
                } else {
                    let ledgerPayload = {
                        transactionId: tid,
                        transactionCreatedAt: updated,
                        transactionDisplayName: payload.displayName,
                        tallyDaybookId: null,
                        tallyLedgerName: null,
                        entityId: payload.entityId,
                        coaCode:  items.debitId,
                        coaName: coaData._doc.name,
                        openingBalance: 0.00,
                        creditAmount: items.credit,
                        debitAmount: items.debit,
                        balanceAmount: 0.00,
                        createdBy: payload.createdBy,
                        updatedBy: payload.updatedBy,
                        ledgerId: coaData._doc._id,
                        ledgerName: coaData._doc.name,
                        orgId: orgId
                    }
                    resolve(ledgerPayload)
                }
            }
        })
    })
}

module.exports = {
    createDebitItemLedger: createDebitItemLedger,
    createCreditItemLedger: createCreditItemLedger
}