/**
 * @author rahul.jain@zenqore.com
 */

const mongoDB = require("mongodb");
const mongoose = require("mongoose");
const dbName = process.env.dbName;
//const dbName = "zq-edu";
const txnCollectionName = "transactions";
const transactionsSchema = require("../../models/transactionsModel");
const journeysCollectionName = "journeys";
const journeysSchema = require("../../models/journeyModel");
const feesLedgerCollectionName = "feesledger";
const feesLedgerSchema = require("../../models/feesLedgerModel");
//const userId = "userid-need-to-change";
// const txnGenLedgerMappingJson = require("../config/txns_genLedger_mapping.json");

const {
  checkDatabaseExists,
  createDatabase,
  createConnection,
} = require("../../utils/db_creation");
const feeplanschema = require("../../models/feeplanModel");

async function processTransaction(req, dbConnection) {
  let dbName = req.body.orgId;
  console.log("zq-edu-backend: transactionsController: 1, dbName: " + dbName);
  let txnData = req.body;
  // First check the json payload for null or empty fields
  checkTransactionPayload(txnData);
  transactionSubType = txnData.transactionSubType;
  // console.log("txnSubType: " + transactionSubType);

  let TxnModel = dbConnection.model(txnCollectionName, transactionsSchema);
  let FeesLedgerModel = dbConnection.model(
    feesLedgerCollectionName,
    feesLedgerSchema
  );
  let journeyModel = dbConnection.model(journeysCollectionName, journeysSchema);
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
  var savedTxnData;
  var ledgerIds;
  var journeysData;
  try {
    switch (transactionSubType) {
      case "demandNote": {
        console.log("start of demandNote ..");
        // checkFeesBreakUpTotal(txnData);
        savedTxnData = await insertTransaction(txnData, TxnModel);
        ledgerIds = await insertFeesDueLedgerEntries(
          savedTxnData,
          FeesLedgerModel
        );
        journeysData = await journeyEntry(
          txnData,
          savedTxnData,
          ledgerIds,
          journeyModel
        );

        // feePlanData = await updateFeePlan(
        //   txnData,
        //   savedTxnData,
        //   ledgerIds,
        //   feePlanModel
        // );

        // feePlanInstallmentData = await updateFeePlanInstallment(
        //   txnData,
        //   savedTxnData,
        //   ledgerIds,
        //   journeyModel
        // );
        break;
      } // case "demandNote"
      case "cancellation": {
        savedTxnData = await insertTransaction(txnData, TxnModel);
        ledgerIds = await insertFeesDueLedgerEntries(
          savedTxnData,
          FeesLedgerModel
        );
        journeysData = await journeyEntry(
          txnData,
          savedTxnData,
          ledgerIds,
          journeyModel
        );
      }
      case "feePayment": {
        console.log("start of feePayment ..");
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
              ledgerCount: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              feeTypeCode: "$_id.feeTypeCode",
              pendingAmount: { $round: ["$pendingAmount", 2] },
              primaryTransaction: "$primaryTransaction",
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
        console.log("relatedFeeLedgers: ");
        console.log(relatedFeeLedgers);

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

        break;
      } // case "feePayment"
    } // switch
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds }
    );
    msg =
      "feesTransactionsController: Created " +
      ledgerIds.length +
      " ledger entries for transaction: " +
      txnData.displayName;
    console.log(msg);
    return { status: "success", message: msg, data: txnData };
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
    throw { status: "failure", message: msg, data: txnData };
  } finally {
    dbConnection.close();
  }
}
/**
 * @param {*} savedTxnData
 * @param {*} dbConnection
 * @param {*} ledgerIds
 */
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
      campusId: savedTxnData.campusId,
      status: "Cancelled",
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
  console.log("proportion: " + proportion);
  var status = "Paid";
  if (savedTxnData.amount != totalPendingAmount) {
    status = "Partial";
  }
  console.log("proportion: " + proportion);
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

    console.log("feesLedgerData: ");
    console.log(feesLedgerData);
    let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
    ledgerResponse = await feesLedgerModel.save();
    ledgerIds.push(ledgerResponse._id);
  } // for
  console.log("ledgerIds: " + ledgerIds);
  return ledgerIds;
} // insertFeesPaymentLedgerEntries

//Journey Entry
async function journeyEntry(inputData, txnData, ledgerData, journeyModel) {
  let journeyData = {
    primaryCoaCode: inputData.studentId,
    primaryTransaction: txnData.displayName,
    transaction: txnData.displayName,
    transactionDate: txnData.transactionDate,
    ledgerId: ledgerData,
    creditAmount: inputData.amount,
    debitAmount: 0,
    pendingAmount: inputData.amount,
    campusId: inputData.campusId,
  };
  let journeyLedgerData = new journeyModel(journeyData);
  journeyResponse = await journeyLedgerData.save();
  console.log("journeyRes", journeyResponse);
}
//Journey Entry

//FeePlan Entry
async function updateFeePlan(inputData, txnData, ledgerData, feePlanModel) {
  let studentFeesDetails = await feePlanModel.findOne({
    studentRegId: txnData.studentId,
  });

  const feeplanschema = {
    applicationId: txnData.displayName,
    studentRegId: txnData.studentRegId,
    programPlanHEDAId: txnData.programPlan,
    plannedAmount: studentFeesDetails.plannedAmountBreakup,
    plannedAmountBreakup: studentFeesDetails.plannedAmountBreakup,
    paidAmount: studentFeesDetails.paidAmount,
    paidAmountBreakup: studentFeesDetails.paidAmountBreakup,
    pendingAmount: studentFeesDetails.pendingAmount,
    pendingAmountBreakup: studentFeesDetails.pendingAmountBreakup,
    currency: txnData.currency,
    forex: txnData.exchangeRate,
    discountType: "",
    discountPercentage: 0,
    discountAmount: 0,
    discountAmountBreakup: [],
    productsAmount: 0,
    productsAmountBreakup: [],
    remarks: {},
  };

  let feePlanData = new feePlanModel(feeplanschema);
  feePlanResponse = await feePlanData.save();
  console.log("feePlan Data", feePlanResponse);
}

//installment update
async function updateFeePlanInstallment(
  inputData,
  txnData,
  ledgerData,
  journeyModel
) {
  let journeyData = {
    primaryCoaCode: inputData.studentId,
    primaryTransaction: txnData.displayName,
    transaction: txnData.displayName,
    transactionDate: txnData.transactionDate,
    ledgerId: ledgerData,
    creditAmount: inputData.amount,
    debitAmount: 0,
    pendingAmount: inputData.amount,
    campusId: inputData.campusId,
  };

  let journeyLedgerData = new journeyModel(journeyData);
  journeyResponse = await journeyLedgerData.save();
  console.log("journeyRes", journeyResponse);
}

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

module.exports = {
  processTransaction: processTransaction,
};
