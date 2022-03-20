/**
 * @author rahul.jain@zenqore.com 
 */

const mongoDB = require('mongodb');
const mongoose = require("mongoose");
const mongoDbUrl = "mongodb://20.44.39.232:30000";
const dbName = "605b4c6332b533cb3e876d82";
// const dbName = "5fa8daece3eb1f18d4250e99";
// const dbName = "5fa8daece3eb1f18d4250e98";
// const dbName = "5fd080be1e5c6245ccf50d5a";
const bseCollectionName = "bankstmtentries";
const bseSchema = require("../../models/schemas/bankStatementEntries-model");
const reconManagerSchema = require("../../models/reconciliationManagerModel");
const reconciliationManagerSchema = require("../../models/reconciliationManagerModel");
const bankTxnsMappingSchema = require("../../models/schemas/bankTransactionMapper-Model");
const reconManagerCollectionName = "reconciliationmanager";
const bankTxnsMappingCollectionName = "banktransactionsmappings";

// const feeLedgerCollectionName = "feesledgers";
// const feeLedgerSchema = require("../../models/feesLedgerModel");
const transactionsCollectionName = "transactions";
const transactionsSchema = require("../../models/transactionsModel");

const {
    checkDatabaseExists,
    createDatabase,
    createConnection,
} = require("../../models/db_creation");

async function reset() {
    const dbConnection = await createConnection(dbName, mongoDbUrl);
    try {
        let TransactionsModel = dbConnection.model(transactionsCollectionName, transactionsSchema);
        let reconciliationListModel = dbConnection.model("reconciliationmanagers", reconciliationManagerSchema); 
        let banktxnsMappingModel = dbConnection.model(bankTxnsMappingCollectionName, bankTxnsMappingSchema);
        await reconciliationListModel.deleteMany({});
        await banktxnsMappingModel.deleteMany({});
        await TransactionsModel.updateMany(
                {},
                // { reconciliationStatus: "initial" , softwareReconciled: false} 
                { reconciliationStatus: "initial" } 
            );
        console.log("Reset reconciled entries in transactions.");

        let BseModel = dbConnection.model(bseCollectionName, bseSchema);
        await BseModel.updateMany(
            {},
            { reconciled: false, reconciliationMethod: "" }
        );
        console.log("Reset reconciled entries in bankstatemententries.");
    } catch (err) {
        console.log(err);
    }
    finally {
        dbConnection.close();
    }
} // reset 

reset(); 
