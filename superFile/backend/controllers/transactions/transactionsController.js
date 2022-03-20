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
async function processTransaction(req, res) {
  // console.log("zq-edu-backend: transactionsController: 1, dbName: " + dbName);
  let txnData = req.body;
  // First check the json payload for null or empty fields
  checkTransactionPayload(txnData);
  transactionSubType = txnData.transactionSubType;
  // console.log("txnSubType: " + transactionSubType);

  const dbConnection = await createConnection(
    dbName,
    process.env.central_mongoDbUrl
  );
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
      case "demandNote": {
        // console.log("start of demandNote ..");
        checkFeesBreakUpTotal(txnData);
        savedTxnData = await insertTransaction(txnData, TxnModel);
        ledgerIds = await insertFeesDueLedgerEntries(
          savedTxnData,
          FeesLedgerModel
        );
        status = "Pending";
        break;
      } // case "demandNote"

      case "feePayment": {
        // console.log("start of feePayment ..");
        const aggregatePipeline = [
          {
            $match: {
              primaryTransaction: { $in: txnData.relatedTransactions },
            },
          },
          { $sort: { updatedAt: -1 } },
          {
            $group: {
              _id: {
                primaryTransaction: "$primaryTransaction",
                feeTypeCode: "$feeTypeCode",
              },
              pendingAmount: { $first: "$pendingAmount" },
              primaryTransaction: { $first: "$primaryTransaction" },
              studentId: { $first: "$studentId" },
              studentRegId: { $first: "$studentRegId" },
              studentName: { $first: "$studentName" },
              academicYear: { $first: "$academicYear" },
              class: { $first: "$class" },
              programPlan: { $first: "$programPlan" },
              ledgerCount: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              feeTypeCode: "$_id.feeTypeCode",
              pendingAmount: { $round: ["$pendingAmount", 2] },
              primaryTransaction: "$primaryTransaction",
              studentId: "$studentId",
              studentRegId: "$studentRegId",
              studentName: "$studentName",
              academicYear: "$academicYear",
              class: "$class",
              programPlan: "$programPlan",
              ledgerCount: "$ledgerCount",
            },
          },
        ]; // aggregatePipeline

        relatedFeeLedgers = JSON.parse(
          JSON.stringify(
            // await FeesLedgerModel.find({ primaryTransaction: { $in: txnData.relatedTransactions } })
            await FeesLedgerModel.aggregate(aggregatePipeline)
          )
        );
        // console.log("relatedFeeLedgers: ");
        // console.log(relatedFeeLedgers);

        var totalPendingAmount = 0.0;
        for (feeLedgerItem of relatedFeeLedgers) {
          totalPendingAmount += feeLedgerItem.pendingAmount;
        }
        totalPendingAmount =
          Math.round((totalPendingAmount + Number.EPSILON) * 100) / 100;
        console.log(
          "totalPendingAmount: " +
            totalPendingAmount +
            ", payment: " +
            txnData.amount
        );
        if (txnData.amount > totalPendingAmount) {
          throw new Error(
            "Attempting to pay " +
              txnData.amount +
              ", which is more than the total pending amount " +
              totalPendingAmount
          );
        }
        savedTxnData = await insertTransaction(txnData, TxnModel);
        ledgerIds = await insertFeesPaymentLedgerEntries(
          savedTxnData,
          FeesLedgerModel,
          relatedFeeLedgers,
          totalPendingAmount
        );
        if (savedTxnData.amount == totalPendingAmount) {
          status = "Paid";
        } else {
          status = "Partial";
        }

        break;
      } // case "feePayment"
    } // switch
    console.log("status: " + status + ", _id: " + savedTxnData._id);
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: status }
    );
    // now update the status in original demandNote transaction
    await TxnModel.updateMany(
      { displayName: { $in: txnData.relatedTransactions } },
      { status: status }
    );
    msg =
      "feesTransactionsController: Created " +
      ledgerIds.length +
      " ledger entries for transaction: " +
      txnData.displayName;
    console.log(msg);
    res
      .status(200)
      .send({ status: "success", message: msg, data: savedTxnData });
  } catch (err) {
    msg = "feesTransactionsController: Error: " + err.message;
    console.log(msg);
    // need to do cleanup in case transaction (and some ledger entries) were inserted
    if (savedTxnData) {
      msg =
        "feesTransactionsController: Error: " +
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
    res.status(400).send({ status: "failure", message: msg, data: txnData });
  } finally {
    dbConnection.close();
  }
} // processTransaction

async function insertTransaction(txnData, TxnModel) {
  try {
    let txnModel = new TxnModel(txnData);
    var savedTxnData = await txnModel.save();
    msg =
      "feesTransactionsController: Created: " +
      "_id: " +
      savedTxnData._id +
      ", '" +
      savedTxnData.displayName +
      "', type: " +
      savedTxnData.transactionType +
      "/" +
      savedTxnData.transactionSubType;
    console.log(msg);
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
async function insertFeesDueLedgerEntries(savedTxnData, FeesLedgerModel) {
  var ledgerIds = [];
  for (feeItem of savedTxnData.data.feesBreakUp) {
    let feesLedgerData = {
      transactionId: savedTxnData._id,
      transactionDate: savedTxnData.transactionDate,
      transactionDisplayName: savedTxnData.displayName,
      primaryTransaction: savedTxnData.displayName,
      feeTypeCode: feeItem.feeTypeCode,
      dueAmount: feeItem.amount,
      pendingAmount: feeItem.amount,
      transactionType: savedTxnData.transactionType,
      transactionSubType: savedTxnData.transactionSubType,
      studentId: savedTxnData.studentId,
      studentRegId: savedTxnData.studentRegId,
      studentName: savedTxnData.studentName,
      academicYear: savedTxnData.academicYear,
      class: savedTxnData.class,
      programPlan: savedTxnData.programPlan,
      status: "Pending",
    };

    let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
    ledgerResponse = await feesLedgerModel.save();
    ledgerIds.push(ledgerResponse._id);
  } // for
  return ledgerIds;
} // insertFeesDueLedgerEntries

async function insertFeesPaymentLedgerEntries(
  savedTxnData,
  FeesLedgerModel,
  relatedFeeLedgers,
  totalPendingAmount
) {
  proportion = savedTxnData.amount / totalPendingAmount;
  var status = "Paid";
  if (savedTxnData.amount != totalPendingAmount) {
    status = "Partial";
  }
  // console.log("proportion: " + proportion);
  var ledgerIds = [];
  for (feeItem of relatedFeeLedgers) {
    let feesLedgerData = {
      transactionId: savedTxnData._id,
      transactionDate: savedTxnData.transactionDate,
      transactionDisplayName: savedTxnData.displayName,
      primaryTransaction: feeItem.primaryTransaction,
      feeTypeCode: feeItem.feeTypeCode,
      paidAmount:
        Math.round(
          (feeItem.pendingAmount * proportion + Number.EPSILON) * 100
        ) / 100,
      pendingAmount:
        Math.round(
          (feeItem.pendingAmount * (1 - proportion) + Number.EPSILON) * 100
        ) / 100,
      transactionType: savedTxnData.transactionType,
      transactionSubType: savedTxnData.transactionSubType,
      studentId: feeItem.studentId,
      studentRegId: feeItem.studentRegId,
      studentName: feeItem.studentName,
      academicYear: feeItem.academicYear,
      class: feeItem.class,
      programPlan: feeItem.programPlan,
      status: status,
    };

    // console.log("feesLedgerData: " );
    // console.log(feesLedgerData);
    let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
    ledgerResponse = await feesLedgerModel.save();
    ledgerIds.push(ledgerResponse._id);
  } // for
  // console.log("ledgerIds: " + ledgerIds);
  return ledgerIds;
} // insertFeesPaymentLedgerEntries

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
  if (txnData.amount != total) {
    errMsg =
      "feeTransactionController: total of feesBreakUp " +
      total +
      " does not match with transaction amount " +
      txnData.amount;
    throw new Error(errMsg);
  }
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
  console.log("in transactionsController > listOne");
  var id = req.url.toString().substring(14);
  console.log("id: " + id);
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
