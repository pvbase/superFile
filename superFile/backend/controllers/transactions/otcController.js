const axios = require("axios");
const moment = require("moment");
var _ = require("lodash");
const {
  receiptTemplate,
  receiptPdf,
} = require("../../utils/helper_functions/templates/receipt-email-template");
const {
  receiptVkgiPdf,
  receiptVkgiTemplate,
} = require("../../utils/helper_functions/templates/vkgiReceiptTemplate");
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
const campusSchema = require("../../models/campusModel");
const settingsSchema = require("../../models/settings/feesetting");
const reconciliationTransactionsSchema = require("../../models/reconciliationTransactionsModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const { createDatabase } = require("../../utils/db_creation");
const transactionsSchema = require("../../models/transactionsModel");
const journeysSchema = require("../../models/journeyModel");
const {
  commonPostNotification,
} = require("../notifications/notification-common");
const feeplanschema = require("../../models/feeplanModel");
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
const { recordChallanTransaction } = require("../cheque-dd/cheque-dd");
const { updateReportCollection } = require("../flatten-reports/report-update");

async function createOtcPayment(req, res) {
  let inputData = req.body;
  var receiptN = ("" + Math.random()).substring(2, 7);
  var year2 = moment().year();
  var transactionDate = moment
    .utc(inputData.transactionDate)
    .tz("Asia/Kolkata");

  var transID = `TXN/${year2}/${receiptN + 1}`;
  let imode = inputData.data.method;
  let mode = imode.toLowerCase();
  let transactId;
  if (mode == "cash") {
    transactId = transID;
  } else {
    transactId = inputData.paymentTransactionId;
  }
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
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );

    let guardianModel = dbConnection.model("guardians", GuardianSchema);

    let programPlanModel = dbConnection.model(
      "programplans",
      programPlanSchema
    );
    let feeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let settingsModel = dbConnection.model("settings", settingsSchema);
    let studentModel = dbConnection.model("students", StudentSchema);
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
    let installFeePlanModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );

    let studentDetails = await studentModel.findOne({
      regId: inputData.studentRegId,
    });
    const orgSettings = await settingsModel.findOne({});
    if (studentDetails) {
      let studentFeeMapDetails = await feeMapModel.findOne({
        studentId: studentDetails._id,
      });
      let programPlanDetails = await programPlanModel.findOne({
        _id: studentDetails.programPlanId,
      });
      let feePlanData = await feePlanModel.findOne({
        studentRegId: studentDetails.regId,
      });
      let feeDetails = {
        totalFees: feePlanData.plannedAmount,
        totalConcession: feePlanData.concessionFees,
        totalPayable: feePlanData.pendingAmount,
      };

      if (
        Number(feePlanData.pendingAmount) == 0 ||
        Number(feePlanData.pendingAmount) < 0
      ) {
        res.status(400).json({
          success: false,
          Message: `Already Paid Full Payment for the student registration ID : ${studentDetails.regId}`,
        });
      } else {
        var transactionDetails = await transactionModel.find({
          $or: [{ status: "Pending" }, { status: "Partial" }],
          studentRegId: studentDetails.regId,
          transactionSubType: "demandNote",
        });
        let demandNoteId;
        if (transactionDetails.length == 0) {
          demandNoteId = [];
        } else {
          demandNoteId = transactionDetails.displayName;
        }
        let installmentPlanData = await installFeePlanModel.find({
          feePlanId: feePlanData._id,
        });
        let feesBreak = [];
        var totalLoan = Number(inputData.amount);
        if (orgData.nameSpace == "vkgi") {
          for (oneInsta of installmentPlanData) {
            if (oneInsta.status.toLowerCase() !== "paid") {
              let payAmnt;
              if (Number(oneInsta.plannedAmount) <= Number(totalLoan)) {
                payAmnt = oneInsta.plannedAmount;
              } else {
                payAmnt = Number(totalLoan);
              }
              totalLoan = Number(totalLoan) - Number(payAmnt);
              let paid = Number(oneInsta.paidAmount) + Number(payAmnt);
              let pending = Number(oneInsta.pendingAmount) - Number(payAmnt);
              let allPending;
              if (Number(pending) < 0) {
                allPending = 0;
              } else {
                allPending = pending;
              }
              if (Number(payAmnt) !== 0 || Number(payAmnt) > 0) {
                let feesBreakup = {
                  amount: payAmnt,
                  paid: paid,
                  pending: allPending,
                  feeTypeCode: oneInsta.plannedAmountBreakup[0].feeTypeCode,
                  title: oneInsta.plannedAmountBreakup[0].title,
                  installment: oneInsta.label,
                  dueDate: oneInsta.dueDate,
                };
                feesBreak.push(feesBreakup);
              }
            }
          }
        } else {
          for (oneFee of inputData.data.feesBreakUp) {
            let obj = {
              amount: oneFee.amount,
              paid: oneFee.amount,
              pending: oneFee.amount,
              feeTypeCode: oneFee.feeTypeCode,
              installment: "Installment001",
              title: oneFee.feeType,
              dueDate:
                "Thu Apr 01 2021 00:00:00 GMT+0530 (India Standard Time)",
            };
            feesBreak.push(obj);
          }

          //feePlan update
          var totalPlann = Number(feePlanData.plannedAmount);
          var totalPendd = Number(feePlanData.pendingAmount);

          if (inputData.data.feesBreakUp.length > 1) {
            for (oneFee of inputData.data.feesBreakUp) {
              var index = _.findIndex(feePlanData.plannedAmountBreakup, {
                feeTypeCode: oneFee.feeTypeCode,
              });

              let indexData = feePlanData.plannedAmountBreakup[index];
              if (Number(indexData.amount) < Number(oneFee.amount)) {
                // Replace item at index using native splice
                feePlanData.plannedAmountBreakup.splice(index, 1, {
                  amount: Number(indexData.amount) + Number(oneFee.amount),
                  feeTypeCode: indexData.feeTypeCode,
                  title: indexData.title,
                });
                totalPlann = Number(totalPlann) + Number(oneFee.amount);
              }
            }
            for (oneFee of inputData.data.feesBreakUp) {
              var index = _.findIndex(feePlanData.pendingAmountBreakup, {
                feeTypeCode: oneFee.feeTypeCode,
              });

              let indexData = feePlanData.pendingAmountBreakup[index];
              if (Number(indexData.amount) < Number(oneFee.amount)) {
                // Replace item at index using native splice
                feePlanData.pendingAmountBreakup.splice(index, 1, {
                  amount: Number(indexData.amount) + Number(oneFee.amount),
                  feeTypeCode: indexData.feeTypeCode,
                  title: indexData.title,
                });
                totalPendd = Number(totalPendd) + Number(oneFee.amount);
              }
            }
          }

          let datum = await feePlanModel.updateOne(
            { studentRegId: studentDetails.regId },
            {
              $set: {
                plannedAmount: totalPlann,
                pendingAmount: totalPendd,
                plannedAmountBreakup: feePlanData.plannedAmountBreakup,
                pendingAmountBreakup: feePlanData.pendingAmountBreakup,
              },
            }
          );
          //Installment plan update
          for (oneInsta of installmentPlanData) {
            let datum = await installFeePlanModel.updateOne(
              { feePlanId: feePlanData._id, label: oneInsta.label },
              {
                $set: {
                  plannedAmount: totalPlann,
                  pendingAmount: totalPendd,
                  totalAmount: totalPlann,
                  plannedAmountBreakup: feePlanData.plannedAmountBreakup,
                  pendingAmountBreakup: feePlanData.pendingAmountBreakup,
                },
              }
            );
            console.log("installmentupdate", datum);
          }
        }

        var rcptId = await getDisplayId(dbConnection);
        let pedingAMount =
          Number(feePlanData.pendingAmount) - Number(inputData.amount);
        let PendingAmount;
        if (Number(pedingAMount) == 0 || Number(pedingAMount) < 0) {
          PendingAmount = 0;
        } else {
          PendingAmount = pedingAMount;
        }
        let passData = {
          displayName: rcptId,
          transactionDate: transactionDate,
          relatedTransactions: demandNoteId,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          studentId: studentDetails._id,
          emailCommunicationRefIds: studentDetails.email,
          studentName: studentDetails.firstName + " " + studentDetails.lastName,
          class: inputData.class,
          academicYear: inputData.academicYear,
          amount: inputData.amount,
          studentRegId: studentDetails.regId,
          receiptNo: rcptId,
          programPlan: studentDetails.programPlanId,
          data: {
            orgId: inputData.data.orgId,
            displayName: rcptId,
            transactionType: "eduFees",
            transactionSubType: "feePayment",
            mode: inputData.data.mode,
            method: inputData.data.method,
            modeDetails: inputData.data.modeDetails,
            feesBreakUp: feesBreak,
          },
          paymentTransactionId: transactId,
          receiptStatus: "",
          currency: "INR",
          currencyAmount: inputData.amount,
          exchangeRate: inputData.amount,
          userName: studentDetails.firstName + " " + studentDetails.lastName,
          createdBy: inputData.createdBy,
          updatedBy: inputData.createdBy,
          campusId: studentDetails.campusId,
          status: "",
          type: orgSettings._doc.receipts.send,
          previousPaid: feePlanData.paidAmount,
          pendingAmount: PendingAmount,
        };

        let createDemand = await ledgerEntry({ body: passData }, dbConnection);
        if (createDemand.status == "success") {
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
          let TxnModel = dbConnection1.model(
            "transactions",
            transactionsSchema
          );
          let feePlanModel = dbConnection1.model(
            "studentfeeplan",
            feeplanschema
          );
          let feeMapModel = dbConnection1.model(
            "studentfeesmaps",
            StudentFeeMapSchema
          );
          let installFeePlanModel = dbConnection1.model(
            "studentfeeinstallmentplans",
            feeplanInstallmentschema
          );

          let campusModel = dbConnection1.model("campuses", campusSchema);

          let feMapDe = await feeMapModel.findOne({
            studentId: studentDetails._id,
          });

          let feePlanData = await feePlanModel.findOne({
            studentRegId: studentDetails.regId,
          });
          var transactionDetails = await TxnModel.findOne({
            $or: [{ status: "Pending" }, { status: "Partial" }],
            studentRegId: studentDetails.regId,
            transactionSubType: "demandNote",
          });
          if (transactionDetails) {
            if (
              Number(feePlanData.pendingAmount) < 0 ||
              Number(feePlanData.pendingAmount) == 0
            ) {
              let updateTransaction = await TxnModel.updateOne(
                {
                  $or: [{ status: "Pending" }, { status: "Partial" }],
                  studentRegId: studentDetails.regId,
                  transactionSubType: "demandNote",
                },
                {
                  $set: {
                    status: "Paid",
                  },
                }
              );
              if (updateTransaction.nModified) {
                console.log("demand note status updated");
              } else {
                console.log("demand note status not updated");
              }
            }
          }
          let updateFeeMap = await feeMapModel.updateOne(
            { displayName: feMapDe.displayName },
            {
              $set: {
                paid: Number(feePlanData.paidAmount),
                pending: Number(feePlanData.pendingAmount),
              },
            }
          );
          if (updateFeeMap.nModified) {
            let feeTableHeader = [
              {
                name: "Particulars",
                value: "feeTypeName",
                type: "string",
              },
              {
                name: "Paid Amount",
                value: "paidAmount",
                type: "amount",
              },
            ];
            let statementTableHeader = [
              {
                name: "TITLE",
                value: "term",
                type: "string",
              },
              {
                name: "DUE DATE",
                value: "dueDate",
                type: "string",
              },
              {
                name: "PAID DATE",
                value: "paidDate",
                type: "string",
              },
              {
                name: "AMOUNT",
                value: "paidTotal",
                type: "amount",
              },
              {
                name: "STATUS",
                value: "status",
                type: "string",
              },
            ];
            let campusStatus;
            if (
              passData.campusId.toLowerCase() == "all" ||
              passData.campusId.toLowerCase() == "undefined" ||
              passData.campusId.toLowerCase() == "null" ||
              passData.campusId == undefined ||
              passData.campusId == null
            ) {
              campusStatus = false;
            } else {
              campusStatus = true;
            }

            let allCampus;
            if (campusStatus == true) {
              let allC = await campusModel.findOne({
                _id: studentDetails.campusId,
              });
              allCampus = {
                logo: allC.logo,
                name: allC.legalName,
                address1: allC.legalAddress.address1,
                address2: allC.legalAddress.address2,
                address3: allC.legalAddress.address3,
                city: allC.legalAddress.city,
                state: allC.legalAddress.state,
                pincode: allC.legalAddress.pincode,
                contact: allC.instituteContact[0].mobileNumber,
              };
            } else {
              allCampus = {
                logo: orgDetails.logo.logo,
                name: orgDetails.instituteDetails.instituteName,
                address1: orgDetails.instituteDetails.address1,
                address2: orgDetails.instituteDetails.address2,
                address3: orgDetails.instituteDetails.address3,
                city: orgDetails.instituteDetails.cityTown,
                state: orgDetails.instituteDetails.stateName,
                pincode: orgDetails.instituteDetails.pinCode,
                contact: orgDetails.instituteDetails.phoneNumber1,
              };
            }
            let transactionData = await TxnModel.find({
              studentRegId: studentDetails.regId,
              transactionSubType: "feePayment",
            });
            let statement = [];
            for (oneTransactions of transactionData) {
              let title;
              if (
                oneTransactions.data.feesBreakUp[0].title == undefined ||
                oneTransactions.data.feesBreakUp[0].title == "undefined" ||
                oneTransactions.data.feesBreakUp[0].title == null
              ) {
                title = oneTransactions.data.feesBreakUp[0].feeType;
              } else {
                title = oneTransactions.data.feesBreakUp[0].title;
              }
              let totalBalanceStatus;
              if (feePlanData.pendingAmount > 0) {
                totalBalanceStatus = "Planned";
              } else {
                totalBalanceStatus = "Paid";
              }
              let obj = {
                dueDate: moment(
                  oneTransactions.data.feesBreakUp[0].dueDate
                ).format("DD/MM/YYYY"),
                paidDate: moment(oneTransactions.transactionDate).format(
                  "DD/MM/YYYY"
                ),
                amount: oneTransactions.amount,
                paidTotal: oneTransactions.amount,
                allPaid: oneTransactions.amount,
                term: title,
                status: oneTransactions.status,
                totalBalance: feePlanData.pendingAmount,
                totalAmount: feePlanData.paidAmount,
                totalBalanceStatus: totalBalanceStatus,
              };
              statement.push(obj);
            }
            let demandNoteData = await TxnModel.findOne({
              displayName: rcptId,
            });
            var feesAll = [];
            for (singleFee of passData.data.feesBreakUp) {
              var obj;
              if (Number(singleFee.amount) !== 0) {
                obj = {
                  feeTypeName: `${singleFee.title} (${singleFee.installment})`,
                  previousDue: 0.0,
                  currentDue: Number(singleFee.amount),
                  totalDue: Number(singleFee.amount),
                  paidAmount: Number(singleFee.amount),
                  mode: passData.data.method,
                  academicYear: demandNoteData.academicYear,
                  studentName: demandNoteData.studentName,
                  regId: demandNoteData.studentRegId,
                  class: demandNoteData.class,
                  studentFeesDetails: studentFeeMapDetails,
                  campus: allCampus,
                  transactionDate: transactionDate,
                };
                feesAll.push(obj);
              }
            }
            var allMaildata = {
              transactionId: demandNoteData.paymentTransactionId,
              studentName: demandNoteData.studentName,
              campus: allCampus,
            };
            let transactionId = demandNoteData.paymentTransactionId;
            let nameSpace;
            if (orgData.nameSpace.toLowerCase() == "vkgi") {
              nameSpace = "NCFE";
            } else {
              nameSpace = orgData.nameSpace;
            }
            let title;
            if (passData.type.toLowerCase() == "immediately") {
              title = `${nameSpace.toUpperCase()}-Receipt`;
            } else {
              title = `${nameSpace.toUpperCase()}-Acknowledgement`;
            }
            let titlereceipt;
            if (passData.type.toLowerCase() == "immediately") {
              titlereceipt = `Receipt`;
            } else {
              titlereceipt = `Acknowledgement`;
            }
            //Send receipt or Acknowledgement
            const emailTemplate1 = await receiptVkgiTemplate(
              orgDetails,
              allMaildata,
              orgData.nameSpace.toUpperCase()
            );
            let qrCo = null;

            const successReceipt = await receiptVkgiPdf(
              orgDetails,
              feesAll,
              feeTableHeader,
              rcptId,
              passData.type,
              qrCo,
              "",
              statementTableHeader,
              statement,
              titlereceipt,
              transactionId,
              feeDetails
            );
            let obje = {
              html: successReceipt,
            };
            let createPdf = await axios.post(process.env.externalServer, obje);
            let accountname = process.env.blobAccountName;
            const containerName = process.env.containerName;
            let key = process.env.blobKey;

            let blobName = createPdf.data.data;
            const blobServiceClient = BlobServiceClient.fromConnectionString(
              process.env.AZURE_STORAGE_CONNECTION_STRING
            );
            const containerClient =
              blobServiceClient.getContainerClient(containerName);
            const blobClient = await containerClient.getBlobClient(blobName);
            var repla = blobClient.url.replace(
              "https://supportings.blob.core.windows.net",
              "https://fcreceipt.zenqore.com"
            );
            let minUrl = repla;
            let qrCod = await generateQrCode(minUrl);
            const successReceipt1 = await receiptVkgiPdf(
              orgDetails,
              feesAll,
              feeTableHeader,
              rcptId,
              passData.type,
              qrCod,
              minUrl,
              statementTableHeader,
              statement,
              titlereceipt,
              transactionId,
              feeDetails
            );

            let obje1 = {
              html: successReceipt1,
            };
            let createPdf1 = await axios.post(
              process.env.externalServer,
              obje1
            );
            let blobName1 = createPdf1.data.data;

            const blobClient1 = await containerClient.getBlobClient(blobName1);
            var repla1 = blobClient1.url.replace(
              "https://supportings.blob.core.windows.net",
              "https://fcreceipt.zenqore.com"
            );
            let minUrl1 = repla1;
            const transactionUpdate = await TxnModel.updateOne(
              { displayName: rcptId },
              { receiptWithoutQr: minUrl, receiptWithQr: minUrl1 }
            );

            sendEmail(
              orgDetails.emailServer[0].emailServer,
              inputData.emailCommunicationRefIds,
              orgDetails.emailServer[0].emailAddress,
              title,
              emailTemplate1,
              createPdf1.data.file
            )
              .then(async (data) => {
                dbConnection1.close();
                res.status(200).json({
                  status: "success",
                  message: "Receipt sent successfully",
                  data: createDemand,
                  receiptKey: createPdf1.data.data,
                  receiptId: rcptId,
                });
                const updateData = await updateReportCollection(inputData.data.orgId, studentDetails.regId);
              })
              .catch((err) => {
                console.log("errror", err);
                dbConnection1.close();
                res.status(500).send({
                  status: "failure",
                  message: "failed to send receipt email",
                  data: err,
                });
              });
          } else {
            res.status(400).json({
              success: false,
              message: "Unable to update the student fees mapping",
            });
          }
        } else {
          dbConnection.close();
          res.status(400).json({
            success: false,
            Message: `Unable to make the payment for the student registration ID ${studentDetails.regId}`,
            Error: createDemand,
          });
        }
      }
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid Registration ID" });
    }
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
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
  let installFeePlan = dbConnection.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );
  let studentData = await studentModel.findOne({ _id: txnData.studentId });
  var savedTxnData;
  var ledgerIds;
  var status = "Pending";
  var journeysData;
  var feePlanData;
  var installmentFeePlan;
  try {
    let studentFeesDetails = await feePlanModel.findOne({
      studentRegId: txnData.studentRegId,
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
      studentFeesDetails.pendingAmount
    );

    feePlanData = await updateFeePlan(
      txnData,
      savedTxnData,
      ledgerIds,
      feePlanModel
    );

    installmentFeePlan = await updateInstallmentFeePlan(
      savedTxnData,
      installFeePlan,
      feePlanData
    );
    let studentFeesDetails1 = await feePlanModel.findOne({
      studentRegId: txnData.studentRegId,
    });
    if (Number(studentFeesDetails1.pendingAmount) == 0) {
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
  transType = "RCPT";
  var date = new Date();
  var month = date.getMonth();
  var finYear = "";
  // if (month >= 2) {

  // } else {
  //   var current = date.getFullYear();
  //   current = String(current).substr(String(current).length - 2);
  //   var prev = Number(date.getFullYear()) - 1;
  //   finYear = `${prev}-${current}`;
  // }
  var current = date.getFullYear();
  var prev = Number(date.getFullYear()) + 1;
  prev = String(prev).substr(String(prev).length - 2);
  finYear = `${current}-${prev}`;

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
  let totalPendingAmount = studentFeeDetails.pendingAmount;

  var ledgerIds = [];
  var pending = Number(totalPendingAmount);
  for (feeItem of savedTxnData.data.feesBreakUp) {
    pending = Number(pending) - Number(feeItem.amount);
    let ans;
    var status;
    if (Number(pending) < 0 || Number(pending) == 0) {
      ans = 0;
      status = "Paid";
    } else {
      ans = pending;
      status = "Partial";
    }
    if (Number(feeItem.amount) !== 0) {
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
        feeTypeCode: feeItem.feeTypeCode,
        paidAmount: Number(feeItem.amount),
        pendingAmount: ans,
        transactionType: savedTxnData.transactionType,
        transactionSubType: savedTxnData.transactionSubType,
        studentId: savedTxnData.studentId,
        studentRegId: savedTxnData.studentRegId,
        studentName: savedTxnData.studentName,
        academicYear: savedTxnData.academicYear,
        class: savedTxnData.class,
        programPlan: savedTxnData.programPlan,
        campusId: savedTxnData.campusId,
        status: status,
      };
      let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
      ledgerResponse = await feesLedgerModel.save();
      ledgerIds.push(ledgerResponse._id);
    }
  } // for
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
    campusId: inputData.campusId,
    pendingAmount: totalPendingAmount,
  };
  let journeyLedgerData = new journeyModel(journeyData);
  journeyResponse = await journeyLedgerData.save();
  return journeyResponse;
}

//updateFeeplan
async function updateFeePlan(inputData, txnData, ledgerData, feePlanModel) {
  let studentFeesDetails = await feePlanModel.findOne({
    studentRegId: txnData.studentRegId,
  });
  if (studentFeesDetails == null || studentFeesDetails == undefined) {
    console.log("no student fee plan");
    return;
  }

  let pendingAmount =
    Number(studentFeesDetails.pendingAmount) - Number(txnData.amount);
  let totalPaid =
    Number(studentFeesDetails.paidAmount) + Number(txnData.amount);

  for (oneFees of txnData.data.feesBreakUp) {
    // Find item index using _.findIndex (thanks @Muniyaraj for comment)
    var index = _.findIndex(studentFeesDetails.paidAmountBreakup, {
      feeTypeCode: oneFees.feeTypeCode,
    });

    let indexData = studentFeesDetails.paidAmountBreakup[index];

    // Replace item at index using native splice
    studentFeesDetails.paidAmountBreakup.splice(index, 1, {
      amount: Number(indexData.amount) + Number(oneFees.amount),
      feeTypeCode: indexData.feeTypeCode,
      title: indexData.title,
    });
  }

  for (onePending of txnData.data.feesBreakUp) {
    // Find item index using _.findIndex (thanks @Muniyaraj for comment)
    var index = _.findIndex(studentFeesDetails.pendingAmountBreakup, {
      feeTypeCode: onePending.feeTypeCode,
    });

    let indexData = studentFeesDetails.pendingAmountBreakup[index];

    let pendingAm = Number(indexData.amount) - Number(onePending.amount);

    let tot;
    if (Number(pendingAm) < 0) {
      tot = 0;
    } else {
      tot = Number(pendingAm);
    }
    // Replace item at index using native splice
    studentFeesDetails.pendingAmountBreakup.splice(index, 1, {
      amount: tot,
      feeTypeCode: indexData.feeTypeCode,
      title: indexData.title,
    });
  }

  let totalPending;
  if (Number(pendingAmount) < 0) {
    totalPending = 0;
  } else {
    totalPending = pendingAmount;
  }

  let feePlanId = await feePlanModel.findOne({
    studentRegId: txnData.studentRegId,
  });

  let datum = await feePlanModel.updateOne(
    { studentRegId: txnData.studentRegId },
    {
      $set: {
        paidAmount: totalPaid,
        paidAmountBreakup: studentFeesDetails.paidAmountBreakup,
        pendingAmount: totalPending,
        pendingAmountBreakup: studentFeesDetails.pendingAmountBreakup,
      },
    },
    async function (err, resultData) {
      if (resultData.nModified) {
        console.log("updated successfully", feePlanId._id);
        return feePlanId._id;
      } else {
        return err;
      }
    }
  );

  return feePlanId._id;
}

async function updateInstallmentFeePlan(
  txnData,
  installmentFeePlanModel,
  feePlanId
) {
  //transaction loop
  for (oneBreakUp of txnData.data.feesBreakUp) {
    let oneInstallment = await installmentFeePlanModel.findOne({
      label: String(oneBreakUp.installment),
      feePlanId: feePlanId,
    });
    let oneInstallmentPaid = Number(oneInstallment.paidAmount);
    let oneInstallmentPending = Number(oneInstallment.pendingAmount);
    if (
      Number(oneInstallmentPending) < 0 ||
      Number(oneInstallmentPending) == 0
    ) {
      return { status: "Fee Installment Already Paid" };
    } else {
      let newPaid = Number(oneInstallmentPaid) + Number(oneBreakUp.amount);
      let newPending =
        Number(oneInstallmentPending) - Number(oneBreakUp.amount);
      let status;
      if (Number(newPending) == 0 || Number(newPending) < 0) {
        status = "Paid";
      } else {
        status = "Planned";
      }

      // Find item index using _.findIndex (thanks @Muniyaraj for comment)
      var index = _.findIndex(oneInstallment.paidAmountBreakup, {
        feeTypeCode: oneBreakUp.feeTypeCode,
      });

      let indexData = oneInstallment.paidAmountBreakup[index];

      // Replace item at index using native splice
      oneInstallment.paidAmountBreakup.splice(index, 1, {
        amount: Number(indexData.amount) + Number(oneBreakUp.amount),
        feeTypeCode: indexData.feeTypeCode,
        title: indexData.title,
      });

      // Find item index using _.findIndex (thanks @Muniyaraj for comment)
      var index1 = _.findIndex(oneInstallment.pendingAmountBreakup, {
        feeTypeCode: oneBreakUp.feeTypeCode,
      });

      let indexData1 = oneInstallment.pendingAmountBreakup[index1];

      // Replace item at index using native splice
      oneInstallment.pendingAmountBreakup.splice(index, 1, {
        amount: Number(indexData1.amount) - Number(oneBreakUp.amount),
        feeTypeCode: indexData1.feeTypeCode,
        title: indexData1.title,
      });

      installmentFeePlanModel.updateOne(
        { _id: oneInstallment._id },
        {
          $set: {
            paidAmount: newPaid,
            pendingAmount: newPending,
            status: status,
            paidAmountBreakup: oneInstallment.paidAmountBreakup,
            pendingAmountBreakup: oneInstallment.pendingAmountBreakup,
          },
        },
        async function (err, resultData) {
          if (resultData.nModified) {
            console.log("updated installment successfully", resultData);
          } else {
            console.log("nothing updated", err);
          }
        }
      );
    }
  }
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
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);

    let installFeePlanModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
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
        _id: studentDetails.programPlanId,
      });
      let settingsDetails = await settingsModel.find({});
      let feePlanData = await feePlanModel.findOne({
        studentRegId: id,
      });
      let feePlanId = mongoose.Types.ObjectId(feePlanData._doc._id);
      let installmentPlanData = await installFeePlanModel.findOne({
        feePlanId: feePlanId,
      });

      // if (feePlanData == null) {
      let obj = {
        studentDetails: studentDetails,
        guardianDetails: guardianDetails,
        totalAmount: feePlanData.plannedAmount,
        paid: feePlanData.paidAmount,
        pending: feePlanData.pendingAmount,
        dueDate: installmentPlanData.dueDate,
        feesBreakUp: feePlanData.pendingAmountBreakup,
        studentFeeMapId: studentFeeMapDetails.displayName,
        receiptStatus: settingsDetails[0].receipts.send,
        demandNoteDetails: demandNoteId,
        programPlanDetails: programPlanDetails,
        partial: settingsDetails[0].receipts.partialAmount,
      };
      res.status(200).json(obj);
      // } else {
      //   let feePlanData = await feePlanModel.findOne({
      //     studentRegId: id,
      //   });
      //   let feePlanId = mongoose.Types.ObjectId(feePlanData._doc._id);
      //   console.log("feePlanId", feePlanId);
      //   let installmentPlanData = await installFeePlanModel.find({
      //     feePlanId: feePlanId,
      //   });
      //   let studentFeesDetails;
      //   if (installmentPlanData[0].status == "Planned") {
      //     studentFeesDetails = installmentPlanData[0];
      //   } else {
      //     studentFeesDetails = installmentPlanData[1];
      //   }

      //   let feesBreakUp = [];
      //   for (onePlan of feePlanData._doc.plannedAmountBreakup) {
      //     var indexPaid = _.findIndex(studentFeesDetails.paidAmountBreakup, {
      //       feeTypeCode: onePlan.feeTypeCode,
      //     });
      //     var indexPending = _.findIndex(
      //       studentFeesDetails.pendingAmountBreakup,
      //       {
      //         feeTypeCode: onePlan.feeTypeCode,
      //       }
      //     );
      //     let paidAmount = studentFeesDetails.paidAmountBreakup[indexPaid];
      //     let pendingAmount =
      //       studentFeesDetails.pendingAmountBreakup[indexPending];
      //     let obj = {
      //       amount: onePlan.amount,
      //       feeTypeCode: paidAmount.feeTypeCode,
      //       paid: paidAmount.amount,
      //       pending: pendingAmount.amount,
      //       title: onePlan.title,
      //     };
      //     feesBreakUp.push(obj);
      //   }
      //   let obj = {
      //     studentDetails: studentDetails,
      //     guardianDetails: guardianDetails,
      //     totalAmount: studentFeeMapDetails.amount,
      //     paid: studentFeeMapDetails.paid,
      //     pending: studentFeeMapDetails.pending,
      //     dueDate: studentFeeMapDetails.dueDate,
      //     feesBreakUp: feesBreakUp,
      //     studentFeeMapId: studentFeeMapDetails.displayName,
      //     receiptStatus: settingsDetails[0].receipts.send,
      //     demandNoteDetails: demandNoteId,
      //     programPlanDetails: programPlanDetails,
      //     partial: settingsDetails[0].receipts.partialAmount,
      //   };
      //   res.status(200).json(obj);
      // }
    }
  }
}
//remove data
async function removeStudentsOrinigal(req, res) {
  let dbConnection = await createDatabase(
    "5fa8daece3eb1f18d4250e98",
    process.env.central_mongoDbUrl
  );
  let studentModel = dbConnection.model("students", StudentSchema);
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
  let installFeePlanModel = dbConnection.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );

  let transactionModel = dbConnection.model("transactions", transactionsSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let inputData = req.body;
  let result = [];
  for (oneId of inputData) {
    let studentId = oneId.studentId;

    var transactionDetails = await transactionModel.find({
      studentRegId: studentId,
    });
    if (transactionDetails.length > 0) {
      let obj = {
        success: false,
        Message: `Transaction recorded for the student ID ${studentId}. So we cant delete this record `,
      };
      result.push(obj);
    } else {
      let studentDetails = await studentModel.findOne({
        regId: studentId,
      });
      if (studentDetails) {
        let studentFeeMapDetails = await feeMapModel.deleteOne({
          studentId: studentDetails._id,
        });
        let feePlanData = await feePlanModel.findOne({
          studentRegId: studentDetails.regId,
        });
        let installmentPlanData = await installFeePlanModel.deleteMany({
          feePlanId: feePlanData._id,
        });
        let feePlanDataRemove = await feePlanModel.deleteOne({
          studentRegId: studentDetails.regId,
        });
        let studentDetailsRemove = await studentModel.deleteOne({
          regId: studentId,
        });

        let obj = {
          success: true,
          message: `Removed successfully studentID ${studentId}`,
        };
        result.push(obj);
      } else {
        let obj = {
          success: false,
          message: `There is no record for the studentID ${studentId}`,
        };
        result.push(obj);
      }
    }
  }
  res.status(200).json(result);
}
async function removeStudents(req, res) {
  let inputData = req.body;
  let dbConnection = await createDatabase(
    "5fa8daece3eb1f18d4250e98",
    process.env.central_mongoDbUrl
  );
  let studentModel = dbConnection.model("students", StudentSchema);
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
  let installFeePlanModel = dbConnection.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );

  let transactionModel = dbConnection.model("transactions", transactionsSchema);
  let result = [];
  for (oneData of inputData) {
    var transactionDetails = await transactionModel.findOne({
      studentRegId: oneData,
    });
    if (!transactionDetails) {
      let obj = {
        success: false,
        message: `No transaction for ${oneData}`,
      };
      result.push(obj);
    }
    let feePlanData = await feePlanModel.findOne({
      studentRegId: oneData,
    });
    let installmentPlanData = await installFeePlanModel.find({
      feePlanId: feePlanData._id,
    });
    if (
      Number(feePlanData.plannedAmount) == Number(transactionDetails.amount)
    ) {
      console.log("entered");
      let finish = await feePlanModel.updateOne(
        { studentRegId: oneData },
        {
          $set: {
            paidAmount: feePlanData.plannedAmount,
            pendingAmount: 0,
            paidAmountBreakup: feePlanData.plannedAmountBreakup,
            pendingAmountBreakup: feePlanData.paidAmountBreakup,
          },
        },
        async function (err, resultData) {
          //installment
          if (resultData.nModified) {
            let obj = {
              success: true,
              message: "update fee plan",
            };
            result.push(obj);
          } else {
            console.log("nothing updated", err);
          }
        }
      );
    }
  }
  res.status(200).json(result);
}

module.exports = {
  createOtcPayment: createOtcPayment,
  getStudentFeesDetails,
  removeStudents: removeStudents,
};
