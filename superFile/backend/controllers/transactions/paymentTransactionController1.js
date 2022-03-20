/**
 * @author muniyaraj.neelamegam@zenqore.com
 */

const mongoDB = require("mongodb");
const mongoose = require("mongoose");
const dbName = process.env.dbName;
const journeysCollectionName = "journeys";
const journeysSchema = require("../../models/journeyModel");
const txnCollectionName = "transactions";
const transactionsSchema = require("../../models/transactionsModel");
const feesLedgerCollectionName = "feesledger";
const feesLedgerSchema = require("../../models/feesLedgerModel");
const StudentSchema = require("../../models/studentModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const reconciliationTransactionsSchema = require("../../models/reconciliationTransactionsModel");

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
  let journeyModel = dbConnection.model(journeysCollectionName, journeysSchema);
  let reconciliationTransactionsModel = dbConnection.model(
    "reconciliationTransactions",
    reconciliationTransactionsSchema
  );
  let studentModel = dbConnection.model("students", StudentSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let studentData = await studentModel.findOne({ _id: txnData.studentId });
  var savedTxnData;
  var ledgerIds;
  var status = "Pending";
  var journeysData;
  try {
    switch (transactionSubType) {
      case "feePayment": {
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
        var totalPendingAmount = 0.0;
        for (feeLedgerItem of relatedFeeLedgers) {
          totalPendingAmount += feeLedgerItem.pendingAmount;
        }
        totalPendingAmount =
          Math.round((totalPendingAmount + Number.EPSILON) * 100) / 100;

        // if (txnData.amount > totalPendingAmount) {
        //   throw new Error(
        //     "Attempting to pay " +
        //       txnData.amount +
        //       ", which is more than the total pending amount " +
        //       totalPendingAmount
        //   );
        // }
        savedTxnData = await insertTransaction(txnData, TxnModel);
        ledgerIds = await insertFeesPaymentLedgerEntries(
          savedTxnData,
          FeesLedgerModel,
          relatedFeeLedgers
        );
        // journeysData = await journeyEntry(
        //   txnData,
        //   savedTxnData,
        //   ledgerIds,
        //   journeyModel,
        //   totalPendingAmount
        // );
        // console.log("journey Response", journeyData);
        // recondata = await insertReconciliationTransactionEntry(
        //   txnData,
        //   reconciliationTransactionsModel,
        //   savedTxnData,
        //   relatedFeeLedgers[0],
        //   studentData._doc
        // );

        if (savedTxnData.amount == totalPendingAmount) {
          status = "Paid";
        } else {
          status = "Partial";
        }

        break;
      } // case "feePayment"
    } // switch
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: status }
    );
    //now update the status in original demandNote transaction
    await TxnModel.updateMany(
      { displayName: { $in: txnData.relatedTransactions } },
      { status: status }
    );
    msg =
      "feesTransactionsController: Created " +
      ledgerIds.length +
      " ledger entries for transaction: " +
      txnData.displayName;
    return { status: "success", message: msg, data: savedTxnData };
  } catch (err) {
    msg = "feesTransactionsController: Error: " + err.message;
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
      "feesTransactionsController: Created: " +
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

//Journey Entry
async function journeyEntry(
  inputData,
  txnData,
  ledgerData,
  journeyModel,
  totalPendingAmount
) {
  let journeyData = {
    primaryCoaCode: inputData.studentId,
    primaryTransaction: inputData.relatedTransactions[0],
    transaction: txnData.displayName,
    transactionDate: txnData.transactionDate,
    ledgerId: ledgerData,
    creditAmount: 0,
    debitAmount: inputData.amount,
    pendingAmount: totalPendingAmount,
  };
  console.log("journet Data", journeyData);
  let journeyLedgerData = new journeyModel(journeyData);
  journeyResponse = await journeyLedgerData.save();
  console.log("journyData", journeyResponse);
  return journeyResponse;
}

/**
 * @param {*} savedTxnData
 * @param {*} dbConnection
 * @param {*} ledgerIds
 */

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

  var ledgerIds = [];
  for (feeItem of savedTxnData.data.feesBreakUp) {
    let feesLedgerData;
    if (feeItem.amount !== 0) {
      feesLedgerData = {
        transactionId: savedTxnData._id,
        transactionDate: savedTxnData.transactionDate,
        transactionDisplayName: savedTxnData.displayName,
        primaryTransaction: savedTxnData.relatedTransactions[0],
        feeTypeCode: feeItem.feeTypeCode,
        paidAmount: feeItem.amount,
        pendingAmount: feeItem.amount,
        transactionType: savedTxnData.transactionType,
        transactionSubType: savedTxnData.transactionSubType,
        studentId: savedTxnData.studentId,
        studentRegId: savedTxnData.studentRegId,
        studentName: savedTxnData.studentName,
        academicYear: savedTxnData.academicYear,
        class: savedTxnData.class,
        programPlan: savedTxnData.programPlan,
        status: status,
      };
      let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
      ledgerResponse = await feesLedgerModel.save();
      ledgerIds.push(ledgerResponse._id);
    }
  } // for
  // console.log("ledgerIds: " + ledgerIds);
  return ledgerIds;
} // insertFeesPaymentLedgerEntries

//Reconciliation Transaction Entry
async function insertReconciliationTransactionEntry(
  txnData,
  reconmodel,
  savedTxnData,
  relatdTransactions,
  stdData
) {
  let rcdata = new reconmodel({
    transactionType: txnData.transactionType,
    transactionSubType: txnData.transactionSubType,
    transactionDate: txnData.transactionDate,
    studentId: txnData.studentId,
    studentName: relatdTransactions.studentName,
    parentName: stdData.parentName,
    amount: txnData.amount,
    relatedTransactions: txnData.relatedTransactions,
    data: txnData.data,
    createdBy: txnData.data.orgId,
    updatedBy: txnData.data.orgId,
    paymentMode: txnData.data.mode,
    paymentDetails: txnData.data.modeDetails,
    paymentReferenceNumber: txnData.paymentTransactionId,
    transactionReferenceId: savedTxnData._id,
    statementReferenceId: savedTxnData._id,
    status: "initial",
  });
  let savedd = await rcdata.save();
  console.log(savedd);
}
/**
 * This function is used before the MongoDB inserts,
 * @param {*} txnData - this is just req.body - contains the transaction detail
 */

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
