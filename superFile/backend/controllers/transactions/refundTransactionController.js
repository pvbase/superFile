/**
 * @author rahul.jain@zenqore.com
 */

const mongoDB = require("mongodb");
const mongoose = require("mongoose");
const dbName = process.env.dbName;
const txnCollectionName = "transactions";
const transactionsSchema = require("../../models/transactionsModel");
const feesLedgerCollectionName = "feesledger";
const feesLedgerSchema = require("../../models/feesLedgerModel");

const {
  checkDatabaseExists,
  createDatabase,
  createConnection,
} = require("../../utils/db_creation");

/**
 *
 * @param {*} req
 * @param {*} res
 */
async function processTransaction(req, dbConnection) {
  let txnData = req.body;
  checkTransactionPayload(txnData);
  transactionSubType = txnData.transactionSubType;
  let TxnModel = dbConnection.model(txnCollectionName, transactionsSchema);
  let FeesLedgerModel = dbConnection.model(
    feesLedgerCollectionName,
    feesLedgerSchema
  );
  var savedTxnData;
  var ledgerIds;
  var status = "Pending";
  try {
    switch (transactionSubType) {
      case "refund": {
        checkFeesBreakUpTotal(txnData);
        savedTxnData = await insertTransaction(txnData, TxnModel);
        ledgerIds = await insertFeesDueLedgerEntries(
          txnData,
          savedTxnData,
          FeesLedgerModel
        );
        status = "Pending";
        break;
      } // case "demandNote"
    } // switch
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds }
    );
    msg =
      "refundTransactionController: Created " +
      ledgerIds.length +
      " ledger entries for transaction: " +
      txnData.displayName;
    return { status: "success", message: msg, data: savedTxnData };
  } catch (err) {
    msg = "refundTransactionController: Error: " + err.message;
    // need to do cleanup in case transaction (and some ledger entries) were inserted
    if (savedTxnData) {
      msg =
        "refundTransactionController: Error: " +
        err.message +
        " Rolling back transaction " +
        savedTxnData._id +
        " and ledgerIds: " +
        ledgerIds;

      if (TxnModel) {
        await TxnModel.deleteOne({ _id: savedTxnData._id });
      }
      if (FeesLedgerModel && ledgerIds) {
        await FeesLedgerModel.deleteMany({ _id: { $in: ledgerIds } });
      }
    }
    return { status: "failure", message: msg, data: txnData };
  } finally {
    dbConnection.close();
  }
} // processTransaction

async function insertTransaction(txnData, TxnModel) {
  try {
    let txnModel = new TxnModel(txnData);
    var savedTxnData = await txnModel.save();
    msg =
      "refundTransactionController: Created: " +
      "_id: " +
      savedTxnData._id +
      ", '" +
      savedTxnData.displayName +
      "', type: " +
      savedTxnData.transactionType +
      "/" +
      savedTxnData.transactionSubType;
    return savedTxnData;
  } catch (err) {
    throw err;
  }
} // insertTransaction

/**
 * @param {*} savedTxnData
 * @param {*} dbConnection
 * @param {*} ledgerIds
 */
async function insertFeesDueLedgerEntries(
  txnData,
  savedTxnData,
  FeesLedgerModel
) {
  var ledgerIds = [];
  for (feeItem of savedTxnData.data.feesBreakUp) {
    let feesLedgerData = {
      transactionId: savedTxnData._id,
      transactionDate: savedTxnData.transactionDate,
      transactionDisplayName: savedTxnData.displayName,
      primaryTransaction: savedTxnData.relatedTransactions[0],
      feeTypeCode: feeItem.feeTypeCode,
      paidAmount: txnData.paid,
      refundAmount: savedTxnData.amount,
      transactionType: savedTxnData.transactionType,
      transactionSubType: savedTxnData.transactionSubType,
      studentId: savedTxnData.studentId,
      studentRegId: savedTxnData.studentRegId,
      studentName: savedTxnData.studentName,
      academicYear: savedTxnData.academicYear,
      class: savedTxnData.class,
      programPlan: savedTxnData.programPlan,
      campusId: savedTxnData.campusId,
      status: "Pending",
    };

    let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
    ledgerResponse = await feesLedgerModel.save();
    ledgerIds.push(ledgerResponse._id);
  } // for
  return ledgerIds;
} // insertFeesDueLedgerEntries

/**
 * This function is used before the MongoDB inserts,
 * @param {*} txnData - this is just req.body - contains the transaction detail
 */
function checkFeesBreakUpTotal(txnData) {
  total = 0;
  // checking in singleLedgerEntry
  for (feeItem of txnData.data.feesBreakUp) {
    let amount = feeItem.amount;
    if (!amount || amount == null) {
      errMsg = "feeTransactionController: amount not found in feesBreakUp";
      throw new Error(errMsg);
    }
    total += amount;
  }
  // if (txnData.amount != total) {
  //   errMsg =
  //     "feeTransactionController: total of feesBreakUp " +
  //     total +
  //     " does not match with transaction amount " +
  //     txnData.amount;
  //   throw new Error(errMsg);
  // }
} // function checkFeesBreakUpTotal

/**
 * This function performs all sanity checks on input payload
 * req.body should have payload for transaction and corresponding ledger entries
 * @param {*} txnData - from httpRequest object - txnData = req.body
 */
function checkTransactionPayload(txnData) {
  let displayName = txnData.displayName;
  let txnType = txnData.transactionType;
  let txnSubType = txnData.transactionSubType;
  // check for null or empty fields in the httprequest payload
  if (!displayName || displayName == "") {
    errMsg =
      "transactionController: displayName is null in the Transaction payload";
    throw new Error(errMsg);
  }
  if (!txnType || txnType == "") {
    errMsg =
      "transactionController: transactionType is null in the Transaction payload";
    throw new Error(errMsg);
  }
  if (!txnSubType || txnSubType == "") {
    errMsg =
      "transactionController: transactionSubType is null in the Transaction payload";
    throw new Error(errMsg);
  }
} // checkTransactionPayload

async function count(req, res) {
  const dbConnection = await createConnection(
    dbName,
    process.env.central_mongoDbUrl
  );
  let txnModel = dbConnection.model(txnCollectionName, transactionsSchema);
  txnModel
    .countDocuments(params(req))
    .then(function (data) {
      if (data) return res.json(data);
      else return res.json(0);
    })
    .finally(() => {
      dbConnection.close();
    });
} // count

// Needed for query params in httpRequest
var params = function (req) {
  let q = req.url.split("?"),
    result = {};
  if (q.length >= 2) {
    q[1].split("&").forEach((item) => {
      try {
        result[item.split("=")[0]] = item.split("=")[1];
      } catch (e) {
        result[item.split("=")[0]] = "";
      }
    });
  }
  return result;
}; // params

async function listAll(req, res) {
  const dbConnection = await createConnection(
    dbName,
    process.env.central_mongoDbUrl
  );
  let txnModel = dbConnection.model(txnCollectionName, transactionsSchema);
  txnModel
    .find(params(req), { __v: 0 })
    .then(function (data) {
      if (data) return res.json(data);
      else return res.json({ message: "Nothing found" });
    })
    .finally(() => {
      dbConnection.close();
    });
} // listAll

async function listOne(req, res) {
  var id = req.url.toString().substring(14);
  const dbConnection = await createConnection(
    dbName,
    process.env.central_mongoDbUrl
  );
  let txnModel = dbConnection.model(txnCollectionName, transactionsSchema);
  var o_id = new mongoDB.ObjectID(id);
  var params = {
    _id: o_id,
  };
  txnModel
    .findOne(params)
    .then(function (data) {
      if (data) return res.json(data);
      else return res.json({ message: "Transaction by o_id not found: " + id });
    })
    .finally(() => {
      dbConnection.close();
    });
} // listOne

module.exports = {
  processTransaction: processTransaction,
  listAllTransactions: listAll,
  listOneTransaction: listOne,
  countTransactions: count,
};
