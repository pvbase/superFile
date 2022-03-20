const axios = require("axios");
const moment = require("moment");
const {
  depositReceiptTemplate,
  depositReceiptPdf,
} = require("../../utils/helper_functions/templates/depositTemplates");
const mongoose = require("mongoose");
const { sendEmail } = require("../emailController");
const { getBlobData } = require("../azureController");
const { generateQrCode } = require("../qrCodeController");
const {
  feePaymentTemplate,
} = require("../../utils/helper_functions/templates/feePaymentSuccess");
const { BlobServiceClient } = require("@azure/storage-blob");
var storage = require("@azure/storage-blob");
const orgListSchema = require("../../models/orglists-schema");
const StudentSchema = require("../../models/studentModel");
const feesLedgerSchema = require("../../models/feesLedgerModel");
const GuardianSchema = require("../../models/guardianModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const programPlanSchema = require("../../models/programPlanModel");
const FeeStructureSchema = require("../../models/feeStructureModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const settingsSchema = require("../../models/settings/feesetting");
const reconciliationTransactionsSchema = require("../../models/reconciliationTransactionsModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const { createDatabase } = require("../../utils/db_creation");
const transactionsSchema = require("../../models/transactionsModel");
const journeysSchema = require("../../models/journeyModel");

async function createDeposit(req, res) {
  let inputData = req.body;
  var receiptN = ("" + Math.random()).substring(2, 7);
  var year2 = moment().year();

  var transID = `TXN/${year2}/${receiptN + 1}`;
  let imode = inputData.data.mode;
  let mode = imode.toLowerCase();
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: inputData.data.orgId,
  });

  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    let feeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );

    let feMapDe = await feeMapModel.findOne({
      displayName: inputData.studentFeeMap,
    });
    let paidAA = Number(feMapDe.paid) + Number(inputData.amount);

    var rcptId = await getDisplayId(dbConnection);
    let transactionId;
    if (mode == "cash") {
      transactionId = transID;
    } else {
      transactionId = inputData.paymentTransactionId;
    }
    // let receiptNo;
    // if (inputData.type == "receipt") {
    //   receiptNo = `${year2}/${receiptN + 1}`;
    // } else {
    //   receiptNo = transactionId;
    // }
    let passData = {
      displayName: rcptId,
      transactionDate: inputData.transactionDate,
      relatedTransactions: inputData.relatedTransactions,
      transactionType: "eduFees",
      transactionSubType: "deposit",
      studentId: inputData.studentId,
      studentName: inputData.studentName,
      class: inputData.class,
      academicYear: inputData.academicYear,
      amount: inputData.amount,
      studentRegId: inputData.studentRegId,
      receiptNo: rcptId,
      programPlan: inputData.programPlanId,
      data: inputData.data,
      paymentTransactionId: transactionId,
      receiptStatus: inputData.receiptStatus,
      currency: inputData.currency,
      currencyAmount: inputData.currencyAmount,
      exchangeRate: inputData.exchangeRate,
      userName: inputData.userName,
      createdBy: inputData.createdBy,
      updatedBy: inputData.createdBy,
    };
    ledgerEntry({ body: passData }, dbConnection)
      .then(async (paymentData) => {
        if (paymentData.status == "failure") {
          dbConnection.close();
          return res.status(400).send(paymentData);
        } else {
          let dbConnection1 = await createDatabase(
            String(orgData._id),
            orgData.connUri
          );
          const settingsSchema = mongoose.Schema({}, { strict: false });
          const settingsModel = dbConnection1.model(
            "settings",
            settingsSchema,
            "settings"
          );
          const orgSettings = await settingsModel.find({});
          let orgDetails = orgSettings[0]._doc;
          let emailCommunicationRefIds = inputData.emailCommunicationRefIds;
          let feeMapModel = dbConnection1.model(
            "studentfeesmaps",
            StudentFeeMapSchema
          );
          let feeStructureModel = dbConnection1.model(
            "feestructures",
            FeeStructureSchema
          );
          let feeManagerModel = dbConnection1.model(
            "feemanagers",
            FeeManagerSchema
          );
          let feeTypeModel = dbConnection1.model("feetypes", FeeTypeSchema);

          let feMapDe = await feeMapModel.findOne({
            displayName: inputData.studentFeeMap,
          });
          let feeStructureDetails = await feeStructureModel.findOne({
            _id: feMapDe.feeStructureId,
          });
          let feeBre = [];
          if (feMapDe.transactionPlan.feesBreakUp.length !== 0) {
            for (singleData of feMapDe.transactionPlan.feesBreakUp) {
              console.log("singleData", singleData);
              let fees = singleData.amount;
              for (oneFee of inputData.data.feesBreakUp) {
                if (
                  String(singleData.feeTypeCode) == String(oneFee.feeTypeCode)
                ) {
                  let fullPaid =
                    Number(singleData.paid) + Number(oneFee.amount);
                  let fullPending = Number(fees) - fullPaid;
                  let obje = {
                    amount: fees,
                    paid: fullPaid,
                    pending: fullPending,
                    feeTypeCode: oneFee.feeTypeCode,
                    title: oneFee.feeType,
                  };
                  feeBre.push(obje);
                }
              }
            }
          } else {
            let fees = singleData.amount;
            for (oneFee of inputData.data.feesBreakUp) {
              if (
                String(singleData.feeTypeCode) == String(oneFee.feeTypeCode)
              ) {
                let fullPaid = Number(oneFee.amount);
                let fullPending = Number(fees) - fullPaid;
                let obje = {
                  amount: fees,
                  paid: fullPaid,
                  pending: fullPending,
                  feeTypeCode: oneFee.feeTypeCode,
                  title: oneFee.feeType,
                };
                feeBre.push(obje);
              }
            }
          }
          var tota = 0;
          var pai = 0;
          var pend = 0;
          for (oneFees of feeBre) {
            tota += oneFees.amount;
            pai += oneFees.paid;
            pend += oneFees.pending;
          }
          let feeTypesPaid = {
            feesBreakUp: feeBre,
            totalAmount: tota,
            totalPaid: pai,
            totalPending: pend,
          };
          let paidA = Number(feMapDe.paid) + Number(inputData.amount);
          feeMapModel.updateOne(
            { displayName: inputData.studentFeeMap },
            {
              $set: {
                totalDeposit: inputData.amount,
              },
            },
            async function (err, feeMapD) {
              if (feeMapD.nModified) {
                res.status(200).send({
                  success: true,
                  message: "Deposited successfully",
                  data: paymentData,
                });
                centralDbConnection.close() // new
                dbConnection.close() // new
              } else {
                centralDbConnection.close() // new
                dbConnection.close() // new
                return res.status(400).json({
                  status: "failure",
                  message: "Student Fees mapping not updated",
                  Error: err,
                });
              }
            }
          );
        }
      })
      .catch((err) => {
        console.log(err);
        centralDbConnection.close();
        dbConnection.close();
        res.status(500).send(err);
      });
  }
}

async function ledgerEntry(req, dbConnection) {
  let txnData = req.body;
  checkTransactionPayload(txnData);
  transactionSubType = txnData.transactionSubType;
  let TxnModel = dbConnection.model("transactions", transactionsSchema);
  let FeesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
  let journeyModel = dbConnection.model("journeys", journeysSchema);
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
    let studentFeesDetails = await feeMapModel.findOne({
      studentId: txnData.studentId,
    });
    savedTxnData = await insertTransaction(txnData, TxnModel);
    ledgerIds = await insertFeesPaymentLedgerEntries(
      savedTxnData,
      FeesLedgerModel,
      studentFeesDetails
    );
    journeysData = await journeyEntry(
      txnData,
      savedTxnData,
      ledgerIds,
      journeyModel,
      studentFeesDetails.pending
    );
    console.log("journey status", journeysData);

    if (savedTxnData.amount == studentFeesDetails.pending) {
      status = "Paid";
    } else {
      status = "Partial";
    }
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: status }
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
}

async function getDisplayId(dbConnection) {
  var getDatas = [];
  var transType = "";
  const rcptSchema = dbConnection.model(
    "transactions",
    transactionsSchema,
    "transactions"
  );
  //   let rcptSchema = await dbConnection.model(
  //     "transactions",
  //     rcptModel,
  //     "transactions"
  //   );
  getDatas = await rcptSchema.find({});
  transType = "DPST";
  var date = new Date();
  var month = date.getMonth();
  var finYear = "";
  if (month > 2) {
    var current = date.getFullYear();
    var prev = Number(date.getFullYear()) + 1;
    prev = String(prev).substr(String(prev).length - 2);
    finYear = `${current}-${prev}`;
  } else {
    var current = date.getFullYear();
    current = String(current).substr(String(current).length - 2);
    var prev = Number(date.getFullYear()) - 1;
    finYear = `${prev}-${current}`;
  }
  let initial = `${transType}_${finYear}_001`;
  let dataArr = [];
  let check;
  let finalVal;
  const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
  getDatas.forEach((el) => {
    if (el["displayName"]) {
      let filStr = el["displayName"].split("_");
      let typeStr = filStr[0];
      let typeYear = filStr[1];
      if (typeStr == transType && typeYear == finYear) {
        check = true;
        dataArr.push(el["displayName"]);
      }
    }
  });
  if (!check) {
    finalVal = initial;
  } else {
    let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split("_");
    let lastCountNo = Number(lastCount[2]) + 1;
    if (lastCountNo.toString().length == 1) lastCountNo = "00" + lastCountNo;
    if (lastCountNo.toString().length == 2) lastCountNo = "0" + lastCountNo;
    lastCount[2] = lastCountNo;
    finalVal = lastCount.join("_");
  }
  return finalVal;
}

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

async function insertFeesPaymentLedgerEntries(
  savedTxnData,
  FeesLedgerModel,
  studentFeeDetails
) {
  let totalPendingAmount = studentFeeDetails.pending;
  var status = "Paid";

  var ledgerIds = [];
  var pending = totalPendingAmount;
  let primary;
  if (savedTxnData.relatedTransactions.length == 0) {
    primary = "";
  } else {
    primary = savedTxnData.relatedTransactions[0];
  }
  feesLedgerData = {
    transactionId: savedTxnData._id,
    transactionDate: savedTxnData.transactionDate,
    transactionDisplayName: savedTxnData.displayName,
    primaryTransaction: primary,
    feeTypeCode: "FT-001",
    paidAmount: savedTxnData.amount,
    pendingAmount: pending,
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
  console.log("payload", feesLedgerData);
  let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
  ledgerResponse = await feesLedgerModel.save();
  console.log("response", ledgerResponse);
  ledgerIds.push(ledgerResponse._id);
  return ledgerIds;
} // insertFeesPaymentLedgerEntries

//jounrey entry
async function journeyEntry(
  inputData,
  txnData,
  ledgerData,
  journeyModel,
  totalPendingAmount
) {
  let primary;
  if (txnData.relatedTransactions.length == 0) {
    primary = "";
  } else {
    primary = txnData.relatedTransactions[0];
  }
  let journeyData = {
    primaryCoaCode: inputData.studentId,
    primaryTransaction: primary,
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
//getStudentFeeDetails
async function getStudentFeesDetails(req, res) {
  var dbUrl = req.headers.resource;
  let id = req.params.id;
  if (!id || !req.query.orgId) {
    res.status(400).json({
      status: "failed",
      message: "Please provide all required parameters.",
      type: "error",
    });
  } else {
    let dbName = req.query.orgId;
    let dbConnection = await createDatabase(dbName, dbUrl);
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );
    let studentModel = dbConnection.model("students", StudentSchema);
    let feeStructureModel = dbConnection.model(
      "feestructures",
      FeeStructureSchema
    );
    let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);
    let feeManagerModel = dbConnection.model("feemanagers", FeeManagerSchema);
    let guardianModel = dbConnection.model("guardians", GuardianSchema);
    let feeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let programPlanModel = dbConnection.model(
      "programplans",
      programPlanSchema
    );

    let settingsModel = dbConnection.model("settings", settingsSchema);

    let studentDetails = await studentModel.findOne({
      regId: { $regex: new RegExp(id, "i") },
    });

    var transactionDetails = await transactionModel.find({
      $or: [{ status: "Pending" }, { status: "Partial" }],
      studentRegId: { $regex: new RegExp(id, "i") },
      transactionSubType: "demandNote",
    });
    let demandNoteId;
    if (transactionDetails.length == 0) {
      demandNoteId = [];
    } else {
      demandNoteId = transactionDetails;
    }
    if (studentDetails == null) {
      return res
        .status(404)
        .json({ status: "failed", message: "Invalid Student ID" });
    } else {
      let studentFeeMapDetails = await feeMapModel.findOne({
        studentId: studentDetails._id,
      });
      let feeStructureDetails = await feeStructureModel.findOne({
        _id: studentFeeMapDetails.feeStructureId,
      });
      let guardianDetails = await guardianModel.findOne({
        _id: studentDetails.guardianDetails[0],
      });
      let programPlanDetails = await programPlanModel.findOne({
        _id: studentFeeMapDetails.programPlanId,
      });
      let settingsDetails = await settingsModel.find({});
      let feesBreakUp = [];
      for (feeTypesI of feeStructureDetails.feeTypeIds) {
        let feeTypesDetails = await feeTypeModel.findOne({
          _id: feeTypesI,
        });
        let feeManagerDetails = await feeManagerModel.findOne({
          feeTypeId: feeTypesI,
        });
        let fees;
        if (feeManagerDetails !== null) {
          fees = feeManagerDetails.feeDetails.totalAmount;
        } else {
          fees = 0;
        }
        let obj = {
          feeTypeId: feeTypesDetails._id,
          feeType: feeTypesDetails.title,
          amount: fees,
          feeTypeCode: feeTypesDetails.displayName,
        };
        feesBreakUp.push(obj);
      }
      let obj = {
        studentDetails: studentDetails,
        guardianDetails: guardianDetails,
        totalAmount: studentFeeMapDetails.amount,
        paid: studentFeeMapDetails.paid,
        pending: studentFeeMapDetails.pending,
        dueDate: studentFeeMapDetails.dueDate,
        feesBreakUp: studentFeeMapDetails.transactionPlan.feesBreakUp,
        studentFeeMapId: studentFeeMapDetails.displayName,
        receiptStatus: settingsDetails[0].receipts.send,
        demandNoteDetails: demandNoteId,
        programPlanDetails: programPlanDetails,
        partial: settingsDetails[0].receipts.partialAmount,
      };
      res.status(200).json(obj);
    }
  }
}
module.exports = { createDeposit: createDeposit, getStudentFeesDetails };
