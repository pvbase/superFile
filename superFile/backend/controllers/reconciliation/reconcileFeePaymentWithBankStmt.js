/**
 * @author rahul.jain@zenqore.com 
 */

const mongoDB = require('mongodb');
const mongoose = require("mongoose");
const mapperJson = require('./bankStatementMapper.json');
// const mongoDbUrl = "mongodb://20.44.36.222:30000";
const mongoDbUrl = "mongodb://20.44.39.232:30000";
// const dbName = "5fe9700758c6b7bbb7014222";
const dbName = "5fa8daece3eb1f18d4250e99";
// const dbName = "5fa8daece3eb1f18d4250e98";
// const dbName = "5fd080be1e5c6245ccf50d5a";
const bseCollectionName = "bankstmtentries";
const bseSchema = require("../../models/schemas/bankStatementEntries-model");
const transactionsCollectionName = "transactions";
const transactionsSchema = require("../../models/transactionsModel");
var HashMap = require('hashmap');
const bankTxnsMappingCollectionName = "banktransactionsmappings";
const bankTxnsMappingSchema = require("../../models/schemas/bankTransactionMapper-Model");
const reconManagerCollectionName = "reconciliationmanager";
const reconManagerSchema = require("../../models/reconciliationManagerModel");
const longestSubstring = require("./patternSearch");
const lowPatternMatchRatio = 0.5;
const highPatternMatchRatio = 0.9;
const {
    checkDatabaseExists,
    createDatabase,
    createConnection,
} = require("../../models/db_creation");

/**
 * This function reconciles Account books with Bank statement 
 */
async function reconcileWithBankStmt() {
    let params =
    {
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        reconciliationStatus: { $in: ["initial", "nonreconciled", "", null] }
    };
    let transactionsEntries = await getTransactionsEntries(params);
    let attemptedTransactions = transactionsEntries.length;
    console.log("transactionsEntries: " + transactionsEntries.length);

    let bseParams =
    {
        reconciled: false,
        creditAmount: { $gt: 0 },
        statementType: "BANK"
    };
    let bsEntries = await getBankStatementEntries(bseParams);
    console.log("bsEntries: " + bsEntries.length);
    // console.log(bsEntries); 

    var transactionsToReconcile = [];
    var transactionsToReconcileDetails = [];
    var bseToReconcile = [];
    var bseToReconcileDetails = [];
    var totalReconciledAmount = 0;

    // 1st pass - reconcile using the mappings 
    let bankTxnMappings = await getBankTxnsMappings();
    console.log("bankTxnMappings: " + bankTxnMappings.length);
    var map = new HashMap();
    for (mapping of bankTxnMappings) {
        console.log(mapping.bankDescription.toLowerCase().trim() + "' has " + mapping.transactionsStudentRegId.length + " studentRegIds");
        if (mapping.transactionsStudentRegId.length == 1) {
            console.log("Mapping '" + mapping.bankDescription.toLowerCase().trim() + "' : " + mapping.transactionsStudentRegId[0].trim());
            map.set(mapping.bankDescription.toLowerCase().trim(), mapping.transactionsStudentRegId[0].trim());
        }
    }

    for (let j = 0; j < bsEntries.length; j++) {
        let bse = bsEntries[j];
        if (bse.creditAmount != null && bse.creditAmount != 0) {
            // console.log("Bank Stmt Entry: Amount " + bse.creditAmount
            //     + " | " + bse.description
            //     + " | chequeNo: " + bse.chequeNo
            //     + " | txnRefNo: " + bse.txnRefNo
            // );

            if (bse.description != null && bse.description.length > 0) {
                let mapMatchStudentRegId = map.get(bse.description.toLowerCase().trim());
                if (mapMatchStudentRegId) {
                    // console.log("Mapping match: " + bse.description.toLowerCase() + ": mapMatchStudentRegId: " + mapMatchStudentRegId);

                    var txnMatch = false;
                    var i = 0;
                    for (i = 0; i < transactionsEntries.length; i++) {
                        if (transactionsEntries[i]["amount"] == bse.creditAmount
                            && transactionsEntries[i]["studentRegId"] == mapMatchStudentRegId) {
                            txnMatch = true;
                            break;
                        }
                    } // inner for loop 

                    if (txnMatch) {
                        console.log("Match: " + bse.description 
                            + ", studentRegId: " + mapMatchStudentRegId
                            + ", amount: " + bse.creditAmount);
                        // console.log(bse);
                        // console.log(transactionsEntries[i]);
                        transactionsToReconcile.push(transactionsEntries[i]._id);
                        transactionsToReconcileDetails.push(transactionsEntries[i]);
                        bseToReconcile.push(bse._id);
                        bseToReconcileDetails.push(bse);
                        totalReconciledAmount += transactionsEntries[i].amount;
                        // splice is needed if there are more than one entries for a student with same amount 
                        // if splice not used, it results in double marking of bankstmtentries
                        // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length); 
                        transactionsEntries.splice(i, 1);
                        bsEntries.splice(j, 1);
                        console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
                    } else {
                        console.log("NO match: " + bse.description 
                            + ", studentRegId: " + mapMatchStudentRegId
                            + ", amount: " + bse.creditAmount);
                    }
                } // inner if 
            } // outer if 
        } // if 
    } // for 
    console.log("--------------------------"); 
    console.log("END PASS 1 - reconcile using mappings. Matches found: " + transactionsToReconcile.length);
    console.log("--------------------------"); 
    // END - 1st pass - reconcile using the mappings 

    // 2nd pass - reconcile using student name match 
    for (let j = 0; j < bsEntries.length; j++) {
        let bse = bsEntries[j];
        if (bse.creditAmount != null && bse.creditAmount != 0) {
            console.log("Bank Stmt Entry: Amount " + bse.creditAmount
                + " | " + bse.description
                + " | chequeNo: " + bse.chequeNo
                + " | txnRefNo: " + bse.txnRefNo
            );

            let amountMatches = 0;
            var studentMatch = false;
            var parentMatch = false; 
            var i = 0;
            for (i = 0; i < transactionsEntries.length; i++) {
                if (transactionsEntries[i]["amount"] == bse.creditAmount) {
                    amountMatches++;
                    var studentNamePatternMatch;
                    var parentNamePatternMatch; 
                    var patternMatchRatio;
                    if (bse.description != null && bse.description.length > 0) {
                        var description = bse.description;
                        if (bse.description.toUpperCase().startsWith("NEFT ")
                            || bse.description.toUpperCase().startsWith("NEFT-")) {
                            description = bse.description.substring(5).trim();
                        }
                        studentNamePatternMatch = longestSubstring(description, transactionsEntries[i].studentName);
                        // console.log("matching: " + description); 
                        if (studentNamePatternMatch != null) {
                            patternMatchRatio = studentNamePatternMatch.length / description.length;
                        }
                        parentNamePatternMatch = longestSubstring(description, transactionsEntries[i].parentName);
                        // console.log("matching parentName: " + transactionsEntries[i].parentName + ", desc: " + description); 
                        if (parentNamePatternMatch != null) {
                            parentPatternMatchRatio = parentNamePatternMatch.length / description.length;
                        }
                    }
                    if (patternMatchRatio > highPatternMatchRatio) {
                        studentMatch = true;
                        break;
                    } else if (parentPatternMatchRatio > highPatternMatchRatio) {
                        console.log("parentName match found"); 
                        parentMatch = true; 
                        break; 
                    } else if (patternMatchRatio > lowPatternMatchRatio) {
                        console.log("Low probability student match: ");
                        console.log(bse);
                        console.log(transactionsEntries[i].studentName 
                            + ", amount: " + transactionsEntries[i].amount);
                    }
                    // console.log("Amount: " + bse.creditAmount + " | Student: " + transactionsEntries[i].studentName
                    //     + " | studentNamePatternMatch: " + studentNamePatternMatch + " (" + patternMatchRatio * 100 + " %)");
                }
            } // inner for loop 
            if (studentMatch || parentMatch) { 
                if (studentMatch) {
                    console.log("HIGH probability Student match: ");
                } else {
                    console.log("HIGH probability Parent match: ");
                }
                // console.log(bse);
                // console.log(transactionsEntries[i]);
                transactionsToReconcile.push(transactionsEntries[i]._id);
                transactionsToReconcileDetails.push(transactionsEntries[i]);
                bseToReconcile.push(bse._id);
                bseToReconcileDetails.push(bse);
                totalReconciledAmount += transactionsEntries[i].amount;
                // splice is needed if there are more than one entries for a student with same amount 
                // if splice not used, it results in double marking of bankstmtentries
                // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
                transactionsEntries.splice(i, 1);
                // The following line is not needed.  It introduces a bug.  The only splice needed is for transactionsEntries
                // bsEntries.splice(j, 1); // pls leave this line commented.  Uncommented is a bug!! 
                console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
            } 
            console.log("Amount matches: " + amountMatches);
            console.log("--------------------------------------------------------------------");
        } // if 
    } // for 
    console.log("reconcileWithBankStmt: Attempting reconciliation for "
        + transactionsToReconcile.length + " entries in reconciliationtransactions"
        + ", and " + bseToReconcile.length + " entries in the bank statement.");

    var nonReconciledTransactionsIds = [];
    for (fle of transactionsEntries) {
        nonReconciledTransactionsIds.push(fle._id);
    }
    console.log("nonReconciledTransactionsIds: " + nonReconciledTransactionsIds.length);

    var nonReconciledBankStmtIds = [];
    for (bse of bsEntries) {
        nonReconciledBankStmtIds.push(bse._id);
    }
    console.log("nonReconciledBankStmtIds: " + nonReconciledBankStmtIds.length);

    const dbConnection = await createConnection(dbName, mongoDbUrl);
    try {
        let TransactionsModel = dbConnection.model(transactionsCollectionName, transactionsSchema);
        await TransactionsModel.updateMany(
            { _id: { $in: transactionsToReconcile } },
            { reconciliationStatus: "softwarereconciled" }
        );
        let BseModel = dbConnection.model(bseCollectionName, bseSchema);
        await BseModel.updateMany(
            { _id: { $in: bseToReconcile } },
            {
                reconciled: true,
                reconciliationMethod: "softwarereconciled",
            }
        );

        // now set the non-reconciled ones .. 
        await TransactionsModel.updateMany(
            { _id: { $in: nonReconciledTransactionsIds } },
            { reconciliationStatus: "nonreconciled", softwareReconciled: false }
        );

        let reconciledPercent = transactionsToReconcile.length / attemptedTransactions;
        var status = "Partial";
        if (reconciledPercent == 1) {
            status = "Full";
        }
        let reconData = {
            reconciliationId: "1",
            attemptedTransactions: attemptedTransactions,
            reconciledTransactions: transactionsToReconcile.length,
            reconciledTransactionsDetails: transactionsToReconcileDetails,
            reconciledBankStmtEntryDetails: bseToReconcileDetails,
            reconciledAmount: totalReconciledAmount,
            reconciledPercent: reconciledPercent,
            nonreconciledTransactionsDetails: transactionsEntries,
            nonreconciledBankStmtEntryDetails: bsEntries,
            status: status
        };
        let ReconciliationModel = dbConnection.model(reconManagerCollectionName, reconManagerSchema);
        let reconModel = new ReconciliationModel(reconData);
        await reconModel.save();

    } catch (err) {
        console.log(err);
    }
    finally {
        dbConnection.close();
    }
} // reconcileWithBankStmt 

async function getBankStatementEntries(params) {
    const dbConnection = await createConnection(dbName, mongoDbUrl);
    let model = dbConnection.model(bseCollectionName, bseSchema);

    try {
        return await model.find(params);
    } catch (err) {
        console.log(err);
    }
    finally {
        dbConnection.close();
    }
} // getBankStatementEntries

async function getTransactionsEntries(params) {
    const dbConnection = await createConnection(dbName, mongoDbUrl);
    let model = dbConnection.model(transactionsCollectionName, transactionsSchema);

    try {
        return await model.find(params);
    } catch (err) {
        console.log(err);
    }
    finally {
        dbConnection.close();
    }
}

async function getBankTxnsMappings() {
    const dbConnection = await createConnection(dbName, mongoDbUrl);
    let model = dbConnection.model(bankTxnsMappingCollectionName, bankTxnsMappingSchema);

    try {
        return await model.find();
    } catch (err) {
        console.log(err);
    }
    finally {
        dbConnection.close();
    }
}

reconcileWithBankStmt();
