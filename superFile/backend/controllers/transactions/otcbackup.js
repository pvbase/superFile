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

async function createOtcPayment(req, res) {
  let inputData = req.body;
  var receiptN = ("" + Math.random()).substring(2, 7);
  var year2 = moment().year();
  var transactionDate = moment
    .utc(inputData.transactionDate)
    .tz("Asia/Kolkata");

  // let transactionDate = moment(inputData.transactionDate).format();

  var transID = `TXN/${year2}/${receiptN + 1}`;
  let imode = inputData.data.method;
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
    if (orgData.nameSpace == "vkgi") {
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
      let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
      let feePlanData = await feePlanModel.findOne({
        studentRegId: inputData.studentRegId,
      });

      let totalAmount = feePlanData.plannedAmount;
      let previousPaid =
        Number(feePlanData.paidAmount) + Number(inputData.amount);
      //Extra Amount Condition
      if (
        Number(totalAmount) < Number(previousPaid) ||
        Number(totalAmount) == Number(previousPaid)
      ) {
        return res.status(400).json({
          success: false,
          message: "Already Paid Full Payment",
        });
      } else {
        var rcptId = await getDisplayId(dbConnection);
        let transactionId;
        if (mode == "cash") {
          transactionId = transID;
        } else {
          transactionId = inputData.paymentTransactionId;
        }
        let passData = {
          displayName: rcptId,
          transactionDate: transactionDate,
          relatedTransactions: inputData.relatedTransactions,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          studentId: inputData.studentId,
          studentName: inputData.studentName,
          parentName: inputData.parentName,
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
          campusId: feMapDe.campusId,
        };
        if (
          inputData.data.mode !== "" ||
          inputData.data.mode !== undefined ||
          inputData.data.mode !== null
        ) {
          if (inputData.data.mode.toLowerCase().trim() == "cheque") {
            recordChallanTransaction(passData, inputData.data.orgId);
          }
        }
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
                      String(singleData.feeTypeCode) ==
                      String(oneFee.feeTypeCode)
                    ) {
                      let fullPaid =
                        Number(singleData.paid) + Number(oneFee.amount);
                      let fullPending = Number(fees) - fullPaid;
                      let obje;
                      if (Number(fullPending) < 0) {
                        obje = {
                          amount: fees,
                          paid: fullPaid,
                          pending: 0,
                          feeTypeCode: oneFee.feeTypeCode,
                          title: oneFee.feeType,
                        };
                      } else {
                        obje = {
                          amount: fees,
                          paid: fullPaid,
                          pending: fullPending,
                          feeTypeCode: oneFee.feeTypeCode,
                          title: oneFee.feeType,
                        };
                      }
                      feeBre.push(obje);
                    }
                  }
                }
              } else {
                return res
                  .status(404)
                  .json({ success: true, message: "Invalid Transation plan" });
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

              let pendingAmountTotal = Number(feMapDe.amount) - Number(paidA);
              feeMapModel.updateOne(
                { displayName: inputData.studentFeeMap },
                {
                  $set: {
                    paid: paidA,
                    pending: pendingAmountTotal,
                    transactionPlan: feeTypesPaid,
                  },
                },
                async function (err, feeMapD) {
                  if (feeMapD.nModified) {
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
                        value: "amount",
                        type: "amount",
                      },
                      {
                        name: "STATUS",
                        value: "status",
                        type: "string",
                      },
                    ];
                    let TxnModel = dbConnection1.model(
                      "transactions",
                      transactionsSchema
                    );
                    let feeTypeModel = dbConnection1.model(
                      "feetypes",
                      FeeTypeSchema
                    );
                    let feePlanModel = dbConnection1.model(
                      "studentfeeplan",
                      feeplanschema
                    );

                    let installFeePlanModel = dbConnection1.model(
                      "studentfeeinstallmentplans",
                      feeplanInstallmentschema
                    );
                    let FeesLedgerModel = dbConnection1.model(
                      "feesledgers",
                      feesLedgerSchema
                    );
                    let reconciliationTransactionsModel = dbConnection1.model(
                      "reconciliationTransactions",
                      reconciliationTransactionsSchema
                    );
                    let campusModel = dbConnection1.model(
                      "campuses",
                      campusSchema
                    );
                    let campusStatus;
                    if (
                      inputData.campusId.toLowerCase() == "all" ||
                      inputData.campusId.toLowerCase() == "undefined" ||
                      inputData.campusId.toLowerCase() == "null" ||
                      inputData.campusId == undefined ||
                      inputData.campusId == null
                    ) {
                      campusStatus = false;
                    } else {
                      campusStatus = true;
                    }
                    let allCampus;
                    if (campusStatus == true) {
                      let allC = await campusModel.findOne({
                        _id: inputData.campusId,
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
                        contact: allC.instituteContact[0].phoneNumber,
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

                    let feePlanData = await feePlanModel.findOne({
                      studentRegId: inputData.studentRegId,
                    });
                    console.log("feePlan data", feePlanData);

                    let feePlanId = mongoose.Types.ObjectId(
                      feePlanData._doc._id
                    );
                    console.log("feePlanId", feePlanId);
                    let installmentPlanData = await installFeePlanModel.find({
                      feePlanId: feePlanId,
                    });

                    let ledgerData = await FeesLedgerModel.findOne({
                      transactionDisplayName: rcptId,
                    });
                    let demandNoteData = await TxnModel.findOne({
                      displayName: rcptId,
                    });
                    // let demandNoteData = await TxnModel.findOne({
                    //   displayName: inputData.relatedTransactions[0],
                    // });
                    var feesAll = [];
                    for (singleFee of inputData.data.feesBreakUp) {
                      var obj;
                      if (Number(singleFee.amount) !== 0) {
                        obj = {
                          feeTypeName: singleFee.feeType,
                          previousDue: 0.0,
                          currentDue: Number(singleFee.amount),
                          totalDue: Number(singleFee.amount),
                          paidAmount: Number(singleFee.amount),
                          mode: mode,
                          academicYear: demandNoteData.academicYear,
                          studentName: demandNoteData.studentName,
                          regId: demandNoteData.studentRegId,
                          class: demandNoteData.class,
                          studentFeesDetails: feMapDe,
                          campus: allCampus,
                        };
                        feesAll.push(obj);
                      }
                    }

                    let statement = [];
                    for (oneInsta of installmentPlanData) {
                      let stat;
                      if (oneInsta.status == "Paid") {
                        stat = moment().format("DD/MM/YYYY");
                      } else {
                        stat = "-";
                      }

                      let datNo = moment(oneInsta.dueDate)
                        .add(1, "days")
                        .format("DD/MM/YYYY");

                      // var new_date = moment(oneInsta.dueDate)
                      //   .add(1, "days")
                      //   .format("DD/MM/YYYY");
                      let obj = {
                        dueDate: datNo,
                        paidDate: stat,
                        amount: oneInsta.plannedAmount,
                        status: oneInsta.status,
                        paidTotal: oneInsta.o,
                        payable: oneInsta.plannedAmount,
                      };
                      statement.push(obj);
                    }
                    let totalPaid = _.sumBy(statement, function (o) {
                      return o.paidTotal;
                    });
                    let totalPayable = _.sumBy(statement, function (o) {
                      return o.payable;
                    });

                    let totBal = Number(totalPayable) - Number(totalPaid);

                    let allBalance;
                    let totalBalanceStatus;
                    if (Number(totBal) == 0 || Number(totBal) < 0) {
                      allBalance = 0;
                      totalBalanceStatus = "-";
                    } else {
                      allBalance = Number(totBal);
                      totalBalanceStatus = "Planned";
                    }

                    statement[0].totalAmount = totalPaid;
                    statement[0].totalBalance = allBalance;
                    statement[0].totalBalanceStatus = totalBalanceStatus;

                    // let feesAll = [
                    //   {
                    //     feeTypeName: feeTypesDetails.title,
                    //     previousDue: 0.0,
                    //     currentDue: demandNoteData.amount,
                    //     totalDue: demandNoteData.amount,
                    //     paidAmount: ledgerData.paidAmount,
                    //     mode: mode,
                    //     academicYear: demandNoteData.academicYear,
                    //     studentName: demandNoteData.studentName,
                    //     class: demandNoteData.class,
                    //   },
                    // ];

                    var allMaildata = {
                      transactionId: transactionId,
                      studentName: demandNoteData.studentName,
                      campus: allCampus,
                    };
                    //Send receipt or Acknowledgement
                    const emailTemplate1 = await receiptVkgiTemplate(
                      orgDetails,
                      allMaildata
                    );
                    let qrCo = null;
                    const successReceipt = await receiptVkgiPdf(
                      orgDetails,
                      feesAll,
                      feeTableHeader,
                      rcptId,
                      inputData.type,
                      qrCo,
                      "",
                      statementTableHeader,
                      statement
                    );

                    let obje = {
                      html: successReceipt,
                    };
                    let createPdf = await axios.post(
                      process.env.externalServer,
                      obje
                    );
                    let accountname = process.env.blobAccountName;
                    const containerName = process.env.containerName;
                    let key = process.env.blobKey;
                    const cerds = new storage.StorageSharedKeyCredential(
                      accountname,
                      key
                    );
                    let blobName = createPdf.data.data;

                    const blobServiceClient =
                      BlobServiceClient.fromConnectionString(
                        process.env.AZURE_STORAGE_CONNECTION_STRING
                      );
                    const containerClient =
                      blobServiceClient.getContainerClient(containerName);
                    const blobClient = await containerClient.getBlobClient(
                      blobName
                    );
                    var repla = blobClient.url.replace(
                      "https://supportings.blob.core.windows.net",
                      "https://fcreceipt.zenqore.com"
                    );
                    let minUrl = repla;
                    // let getData = await getBlobData(
                    //   containerName,
                    //   createPdf.data.data
                    // );
                    let qrCod = await generateQrCode(minUrl);
                    const successReceipt1 = await receiptVkgiPdf(
                      orgDetails,
                      feesAll,
                      feeTableHeader,
                      rcptId,
                      inputData.type,
                      qrCod,
                      minUrl,
                      statementTableHeader,
                      statement
                    );
                    let obje1 = {
                      html: successReceipt1,
                    };
                    let createPdf1 = await axios.post(
                      process.env.externalServer,
                      obje1
                    );

                    let blobName1 = createPdf1.data.data;
                    const blobClient1 = await containerClient.getBlobClient(
                      blobName1
                    );
                    var repla1 = blobClient1.url.replace(
                      "https://supportings.blob.core.windows.net",
                      "https://fcreceipt.zenqore.com"
                    );
                    let minUrl1 = repla1;
                    const transactionUpdate = await TxnModel.updateOne(
                      { displayName: rcptId },
                      { receiptWithoutQr: minUrl, receiptWithQr: minUrl1 }
                    );
                    dbConnection1.close();
                    let title;
                    if (inputData.type == "receipt") {
                      title = "NCFE-Receipt";
                    } else {
                      title = "NCFE -Acknowledgement";
                    }

                    sendEmail(
                      orgDetails.emailServer[0].emailServer,
                      inputData.emailCommunicationRefIds,
                      orgDetails.emailServer[0].emailAddress,
                      title,
                      emailTemplate1,
                      createPdf1.data.file,
                      "vkgi"
                    )
                      .then((data) => {
                        dbConnection1.close();
                        commonPostNotification(
                          `${inputData.data.orgId}`,
                          "success",
                          "transaction_collectPayment",
                          `Payment done successfully for the student ${
                            inputData.studentName
                          } of ${Number(inputData.amount).toLocaleString(
                            "en-IN",
                            {
                              style: "currency",
                              currency: "INR",
                            }
                          )}`
                        );
                        res.status(200).json({
                          status: "success",
                          message: "Receipt sent successfully",
                          data: paymentData,
                          receiptKey: createPdf.data.data,
                          receiptId: rcptId,
                        });
                      })
                      .catch((err) => {
                        dbConnection1.close();
                        res.status(500).send({
                          status: "failure",
                          message: "failed to send receipt email",
                          data: err,
                        });
                      });
                  } else {
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
    } else {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
      let feeMapModel = dbConnection.model(
        "studentfeesmaps",
        StudentFeeMapSchema
      );
      let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
      let feePlanData = await feePlanModel.findOne({
        studentRegId: inputData.studentRegId,
      });

      let totalAmount = feePlanData.plannedAmount;
      let previousPaid =
        Number(feePlanData.paidAmount) + Number(inputData.amount);
      // if (
      //   Number(totalAmount) < Number(previousPaid) ||
      //   Number(totalAmount) == Number(previousPaid)
      // ) {
      //   return res.status(400).json({
      //     success: false,
      //     message: "Already Paid Full Payment",
      //   });
      // }
      //Extra Amount Condition

      console.log("total", totalAmount);
      console.log("paidnow", previousPaid);
      if (Number(totalAmount) < Number(previousPaid)) {
        return res.status(400).json({
          success: false,
          message: "Already Paid Full Payment",
        });
      } else {
        var rcptId = await getDisplayId(dbConnection);

        let transactionId;
        if (mode == "cash") {
          transactionId = transID;
        } else {
          transactionId = inputData.paymentTransactionId;
        }
        let passData = {
          displayName: rcptId,
          transactionDate: transactionDate,
          relatedTransactions: inputData.relatedTransactions,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          studentId: inputData.studentId,
          studentName: inputData.studentName,
          parentName: inputData.parentName,
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
          campusId: feePlanData.campusId,
        };
        if (
          inputData.data.mode !== "" ||
          inputData.data.mode !== undefined ||
          inputData.data.mode !== null
        ) {
          if (inputData.data.mode.toLowerCase().trim() == "cheque") {
            recordChallanTransaction(passData, inputData.data.orgId);
          }
        }
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
                      String(singleData.feeTypeCode) ==
                      String(oneFee.feeTypeCode)
                    ) {
                      let fullPaid =
                        Number(singleData.paid) + Number(oneFee.amount);
                      let fullPending = Number(fees) - fullPaid;
                      let obje;
                      if (Number(fullPending) < 0) {
                        obje = {
                          amount: fees,
                          paid: fullPaid,
                          pending: 0,
                          feeTypeCode: oneFee.feeTypeCode,
                          title: oneFee.feeType,
                        };
                      } else {
                        obje = {
                          amount: fees,
                          paid: fullPaid,
                          pending: fullPending,
                          feeTypeCode: oneFee.feeTypeCode,
                          title: oneFee.feeType,
                        };
                      }
                      feeBre.push(obje);
                    }
                  }
                }
              } else {
                return res
                  .status(404)
                  .json({ success: true, message: "Invalid Transation plan" });
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

              let pendingAmountTotal = Number(feMapDe.amount) - Number(paidA);
              feeMapModel.updateOne(
                { displayName: inputData.studentFeeMap },
                {
                  $set: {
                    paid: paidA,
                    pending: pendingAmountTotal,
                    transactionPlan: feeTypesPaid,
                  },
                },
                async function (err, feeMapD) {
                  if (feeMapD.nModified) {
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
                        value: "amount",
                        type: "amount",
                      },
                      {
                        name: "STATUS",
                        value: "status",
                        type: "string",
                      },
                    ];
                    let TxnModel = dbConnection1.model(
                      "transactions",
                      transactionsSchema
                    );
                    let feeTypeModel = dbConnection1.model(
                      "feetypes",
                      FeeTypeSchema
                    );
                    let feePlanModel = dbConnection1.model(
                      "studentfeeplan",
                      feeplanschema
                    );

                    let installFeePlanModel = dbConnection1.model(
                      "studentfeeinstallmentplans",
                      feeplanInstallmentschema
                    );
                    let FeesLedgerModel = dbConnection1.model(
                      "feesledgers",
                      feesLedgerSchema
                    );
                    let reconciliationTransactionsModel = dbConnection1.model(
                      "reconciliationTransactions",
                      reconciliationTransactionsSchema
                    );
                    let campusModel = dbConnection1.model(
                      "campuses",
                      campusSchema
                    );
                    let studentModel = dbConnection1.model(
                      "students",
                      StudentSchema
                    );
                    let studentData = await studentModel.findOne({
                      regId: inputData.studentRegId,
                    });
                    let campusStatus;
                    if (
                      studentData.campusId.toLowerCase() == "all" ||
                      studentData.campusId.toLowerCase() == "undefined" ||
                      studentData.campusId.toLowerCase() == "null" ||
                      studentData.campusId == undefined ||
                      studentData.campusId == null
                    ) {
                      campusStatus = false;
                    } else {
                      campusStatus = true;
                    }
                    let allCampus;
                    if (campusStatus == true) {
                      let allC = await campusModel.findOne({
                        _id: studentData.campusId,
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
                        contact: allC.instituteContact[0].phoneNumber,
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

                    let feePlanData = await feePlanModel.findOne({
                      studentRegId: inputData.studentRegId,
                    });
                    console.log("feePlan data", feePlanData);

                    let feePlanId = mongoose.Types.ObjectId(
                      feePlanData._doc._id
                    );
                    console.log("feePlanId", feePlanId);
                    let installmentPlanData = await installFeePlanModel.find({
                      feePlanId: feePlanId,
                    });

                    let ledgerData = await FeesLedgerModel.findOne({
                      transactionDisplayName: rcptId,
                    });
                    let demandNoteData = await TxnModel.findOne({
                      displayName: rcptId,
                    });
                    // let demandNoteData = await TxnModel.findOne({
                    //   displayName: inputData.relatedTransactions[0],
                    // });
                    var feesAll = [];
                    for (singleFee of inputData.data.feesBreakUp) {
                      var obj;
                      if (Number(singleFee.amount) !== 0) {
                        obj = {
                          feeTypeName: singleFee.feeType,
                          previousDue: 0.0,
                          currentDue: Number(singleFee.amount),
                          totalDue: Number(singleFee.amount),
                          paidAmount: Number(singleFee.amount),
                          mode: mode,
                          academicYear: demandNoteData.academicYear,
                          studentName: demandNoteData.studentName,
                          regId: demandNoteData.studentRegId,
                          class: demandNoteData.class,
                          studentFeesDetails: feMapDe,
                          campus: allCampus,
                          transactionDate: transactionDate,
                        };
                        feesAll.push(obj);
                      }
                    }

                    let statement = [];
                    for (oneInsta of installmentPlanData) {
                      let stat;
                      if (oneInsta.status == "Paid") {
                        stat = moment().format("DD/MM/YYYY");
                      } else {
                        stat = "-";
                      }

                      dateFilter = (ev) => {
                        var ts = new Date(ev);
                        let getDate = `${
                          String(ts.getDate()).length == 1
                            ? `0${ts.getDate()}`
                            : ts.getDate()
                        }`;
                        let getMonth = `${
                          String(ts.getMonth() + 1).length == 1
                            ? `0${ts.getMonth() + 1}`
                            : ts.getMonth() + 1
                        }`;
                        let getYear = `${ts.getFullYear()}`;
                        let today = `${getDate}/${getMonth}/${getYear}`;
                        return today;
                      };

                      let datNo = moment(oneInsta.dueDate)
                        .add(1, "days")
                        .format("DD/MM/YYYY");

                      // var new_date = moment(oneInsta.dueDate)
                      //   .add(1, "days")
                      //   .format("DD/MM/YYYY");
                      let obj = {
                        dueDate: datNo,
                        paidDate: stat,
                        amount: oneInsta.plannedAmount,
                        status: oneInsta.status,
                        paidTotal: oneInsta.paidAmount,
                        payable: oneInsta.plannedAmount,
                      };
                      statement.push(obj);
                    }
                    let totalPaid = _.sumBy(statement, function (o) {
                      return o.paidTotal;
                    });
                    let totalPayable = _.sumBy(statement, function (o) {
                      return o.payable;
                    });

                    let totBal = Number(totalPayable) - Number(totalPaid);

                    let allBalance;
                    let totalBalanceStatus;
                    if (Number(totBal) == 0 || Number(totBal) < 0) {
                      allBalance = 0;
                      totalBalanceStatus = "-";
                    } else {
                      allBalance = Number(totBal);
                      totalBalanceStatus = "Planned";
                    }

                    statement[0].totalAmount = totalPaid;
                    statement[0].totalBalance = allBalance;
                    statement[0].totalBalanceStatus = totalBalanceStatus;

                    // let feesAll = [
                    //   {
                    //     feeTypeName: feeTypesDetails.title,
                    //     previousDue: 0.0,
                    //     currentDue: demandNoteData.amount,
                    //     totalDue: demandNoteData.amount,
                    //     paidAmount: ledgerData.paidAmount,
                    //     mode: mode,
                    //     academicYear: demandNoteData.academicYear,
                    //     studentName: demandNoteData.studentName,
                    //     class: demandNoteData.class,
                    //   },
                    // ];

                    var allMaildata = {
                      transactionId: transactionId,
                      studentName: demandNoteData.studentName,
                      campus: allCampus,
                    };
                    //Send receipt or Acknowledgement
                    const emailTemplate1 = await receiptTemplate(
                      orgDetails,
                      allMaildata
                    );
                    let qrCo = null;
                    const successReceipt = await receiptPdf(
                      orgDetails,
                      feesAll,
                      feeTableHeader,
                      rcptId,
                      inputData.type,
                      qrCo,
                      "",
                      statementTableHeader,
                      statement
                    );

                    let obje = {
                      html: successReceipt,
                    };
                    let createPdf = await axios.post(
                      process.env.externalServer,
                      obje
                    );
                    let accountname = process.env.blobAccountName;
                    const containerName = process.env.containerName;
                    let key = process.env.blobKey;
                    const cerds = new storage.StorageSharedKeyCredential(
                      accountname,
                      key
                    );
                    let blobName = createPdf.data.data;

                    const blobServiceClient =
                      BlobServiceClient.fromConnectionString(
                        process.env.AZURE_STORAGE_CONNECTION_STRING
                      );
                    const containerClient =
                      blobServiceClient.getContainerClient(containerName);
                    const blobClient = await containerClient.getBlobClient(
                      blobName
                    );
                    var repla = blobClient.url.replace(
                      "https://supportings.blob.core.windows.net",
                      "https://fcreceipt.zenqore.com"
                    );
                    let minUrl = repla;
                    // let getData = await getBlobData(
                    //   containerName,
                    //   createPdf.data.data
                    // );
                    let qrCod = await generateQrCode(minUrl);
                    const successReceipt1 = await receiptPdf(
                      orgDetails,
                      feesAll,
                      feeTableHeader,
                      rcptId,
                      inputData.type,
                      qrCod,
                      minUrl,
                      statementTableHeader,
                      statement
                    );
                    let obje1 = {
                      html: successReceipt1,
                    };
                    let createPdf1 = await axios.post(
                      process.env.externalServer,
                      obje1
                    );

                    let blobName1 = createPdf1.data.data;
                    const blobClient1 = await containerClient.getBlobClient(
                      blobName1
                    );
                    var repla1 = blobClient1.url.replace(
                      "https://supportings.blob.core.windows.net",
                      "https://fcreceipt.zenqore.com"
                    );
                    let minUrl1 = repla1;
                    const transactionUpdate = await TxnModel.updateOne(
                      { displayName: rcptId },
                      { receiptWithoutQr: minUrl, receiptWithQr: minUrl1 }
                    );
                    dbConnection1.close();
                    let title;
                    if (inputData.type == "receipt") {
                      title = `${orgData.nameSpace.toUpperCase()} - Receipt`;
                    } else {
                      title = `${orgData.nameSpace.toUpperCase()} -Acknowledgement`;
                    }

                    sendEmail(
                      orgDetails.emailServer[0].emailServer,
                      inputData.emailCommunicationRefIds,
                      orgDetails.emailServer[0].emailAddress,
                      title,
                      emailTemplate1,
                      createPdf1.data.file,
                      `${orgData.nameSpace.toLowerCase()}`
                    )
                      .then((data) => {
                        dbConnection1.close();
                        commonPostNotification(
                          `${inputData.data.orgId}`,
                          "success",
                          "transaction_collectPayment",
                          `Payment done successfully for the student ${
                            inputData.studentName
                          } of ${Number(inputData.amount).toLocaleString(
                            "en-IN",
                            {
                              style: "currency",
                              currency: "INR",
                            }
                          )}`
                        );
                        res.status(200).json({
                          status: "success",
                          message: "Receipt sent successfully",
                          data: paymentData,
                          receiptKey: createPdf.data.data,
                          receiptId: rcptId,
                        });
                      })
                      .catch((err) => {
                        dbConnection1.close();
                        res.status(500).send({
                          status: "failure",
                          message: "failed to send receipt email",
                          data: err,
                        });
                      });
                  } else {
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
            centralDbConnection.close();
            dbConnection.close();
            res.status(500).send(err);
          });
      }
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

async function advanceLedgerEntry(req, dbConnection) {
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
    if (Number(studentFeesDetails.amount) == Number(studentFeesDetails.paid)) {
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

async function getDisplayAdvanceId(dbConnection) {
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
  transType = "ADV";
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
  let pada = Number(studentFeeDetails.paid) + Number(savedTxnData.amount);
  if (pada < totalPendingAmount) {
    status = "Partial";
  }

  var ledgerIds = [];
  var pending = totalPendingAmount;
  for (feeItem of savedTxnData.data.feesBreakUp) {
    let ans = Number(pending) - Number(feeItem.amount);
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
    Number(studentFeesDetails.plannedAmount) - Number(txnData.amount);
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
        return feePlanId._id;
      } else {
        return err;
      }
    }
  );

  return feePlanId._id;
}

//update installment plan
async function updateInstallmentFeePlan1(
  txnData,
  installmentFeePlanModel,
  feePlanId
) {
  let nextInstallment = await installmentFeePlanModel.find({
    feePlanId: feePlanId,
  });
  if (nextInstallment.length == 0) {
    console.log("no installmentplan");
    return;
  }
  // let studentFeesDetails;
  // if (nextInstallment[0].status == "Planned") {
  //   studentFeesDetails = nextInstallment[0];
  // } else {
  //   studentFeesDetails = nextInstallment[1];
  // }
  // if (studentFeesDetails == null || studentFeesDetails == undefined) {
  //   console.log("no student fee plan");
  //   return;
  // }
  for (studentFeesDetails of nextInstallment) {
    for (oneFees of txnData.data.feesBreakUp) {
      let title = oneFees.feeType.replace(/ /g, "").toLowerCase();
      // Find item index using _.findIndex (thanks @Muniyaraj for comment)
      var index = _.findIndex(studentFeesDetails.paidAmountBreakup, {
        feeTypeCode: oneFees.feeTypeCode,
      });
      let indexData = studentFeesDetails.paidAmountBreakup[index];
      let feeTypeTitle = indexData.title.replace(/ /g, "").toLowerCase();
      if (
        indexData.feeTypeCode === oneFees.feeTypeCode &&
        String(title) === String(feeTypeTitle)
      ) {
        // Replace item at index using native splice
        studentFeesDetails.paidAmountBreakup.splice(0, 1, {
          amount: Number(indexData.amount) + Number(oneFees.amount),
          feeTypeCode: indexData.feeTypeCode,
          title: indexData.title,
        });
        studentFeesDetails.pendingAmount =
          Number(studentFeesDetails.plannedAmount) - Number(oneFees.amount);
        studentFeesDetails.paidAmount =
          Number(studentFeesDetails.paidAmount) + Number(oneFees.amount);
      }
      // var index = _.findIndex(studentFeesDetails.paidAmountBreakup, {
      //   feeTypeCode: oneFees.feeTypeCode,
      // });

      // let indexData = studentFeesDetails.paidAmountBreakup[index];
      // console.log("data", indexData);
    }
    for (onePending of txnData.data.feesBreakUp) {
      let title = onePending.feeType.replace(/ /g, "").toLowerCase();
      var index = _.findIndex(studentFeesDetails.pendingAmountBreakup, {
        feeTypeCode: oneFees.feeTypeCode,
      });
      let indexData = studentFeesDetails.pendingAmountBreakup[index];
      let feeTypeTitle = indexData.title.replace(/ /g, "").toLowerCase();
      if (
        indexData.feeTypeCode === onePending.feeTypeCode &&
        String(title) === String(feeTypeTitle)
      ) {
        let pendingAm = Number(indexData.amount) - Number(onePending.amount);

        let tot;
        if (Number(pendingAm) < 0) {
          tot = 0;
        } else {
          tot = Number(pendingAm);
        }
        // Replace item at index using native splice
        studentFeesDetails.pendingAmountBreakup.splice(0, 1, {
          amount: tot,
          feeTypeCode: indexData.feeTypeCode,
          title: indexData.title,
        });
      }
    }

    let totalPending;
    if (Number(studentFeesDetails.pendingAmount) < 0) {
      totalPending = 0;
    } else {
      totalPending = studentFeesDetails.pendingAmount;
    }
    let status;
    if (
      Number(studentFeesDetails.pendingAmount) == 0 ||
      Number(studentFeesDetails.pendingAmount) < 0
    ) {
      status = "Paid";
    } else {
      status = "Planned";
    }
    installmentFeePlanModel.updateOne(
      { _id: studentFeesDetails._id },
      {
        $set: {
          paidAmount: studentFeesDetails.paidAmount,
          paidAmountBreakup: studentFeesDetails.paidAmountBreakup,
          pendingAmount: totalPending,
          pendingAmountBreakup: studentFeesDetails.pendingAmountBreakup,
          status: status,
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
    //else end
  }
}

async function updateInstallmentFeePlan(
  txnData,
  installmentFeePlanModel,
  feePlanId
) {
  let nextInstallment = await installmentFeePlanModel.find({
    feePlanId: feePlanId,
  });
  if (nextInstallment.length == 0) {
    console.log("no installmentplan");
    return;
  } else {
    for (studentFeesDetails of nextInstallment) {
      let oldPaid = studentFeesDetails.paidAmount;
      let newPaid = txnData.amount;
      let totalPaid = Number(oldPaid) + Number(newPaid);
      let totalPending =
        Number(studentFeesDetails.plannedAmount) - Number(totalPaid);
      let statusMain;
      if (Number(totalPending) == 0 || Number(totalPending) < 0) {
        statusMain = "Paid";
      } else {
        statusMain = "Planned";
      }
      for (feesBreak of txnData.data.feesBreakUp) {
        let title = feesBreak.feeType.replace(/ /g, "").toLowerCase();
        var index = _.findIndex(studentFeesDetails.paidAmountBreakup, {
          feeTypeCode: feesBreak.feeTypeCode,
        });
        let indexData = studentFeesDetails.paidAmountBreakup[index];
        let feeTypeTitle = indexData.title.replace(/ /g, "").toLowerCase();
        if (
          indexData.feeTypeCode === feesBreak.feeTypeCode &&
          String(title) === String(feeTypeTitle)
        ) {
          let totalPay = Number(indexData.amount) + Number(feesBreak.amount);

          installmentFeePlanModel.update(
            { "paidAmountBreakup.feeTypeCode": indexData.feeTypeCode },
            {
              $set: {
                "paidAmountBreakup.$.amount": totalPay,
              },
            },
            async function (err, resultData) {
              if (resultData.nModified) {
                console.log(
                  "updated paid installment successfully",
                  resultData
                );
              } else {
                console.log("nothing updated", err);
              }
            }
          );
        }
        var indexPending = _.findIndex(
          studentFeesDetails.pendingAmountBreakup,
          {
            feeTypeCode: feesBreak.feeTypeCode,
          }
        );
        let indexDataPending =
          studentFeesDetails.pendingAmountBreakup[indexPending];
        let feeTypeTitlePending = indexDataPending.title
          .replace(/ /g, "")
          .toLowerCase();
        if (
          indexDataPending.feeTypeCode === feesBreak.feeTypeCode &&
          String(title) === String(feeTypeTitlePending)
        ) {
          let feeBreakPending =
            Number(indexDataPending.amount) - Number(feesBreak.amount);
          let PendingAmt;
          if (Number(feeBreakPending) < 0 || Number(feeBreakPending) == 0) {
            PendingAmt = 0;
          } else {
            PendingAmt = feeBreakPending;
          }

          installmentFeePlanModel.update(
            {
              "pendingAmountBreakup.feeTypeCode": indexDataPending.feeTypeCode,
            },
            {
              $set: {
                "pendingAmountBreakup.$.amount": PendingAmt,
              },
            },
            async function (err, resultData) {
              if (resultData.nModified) {
                console.log(
                  "updated pending installment successfully",
                  resultData
                );
              } else {
                console.log("nothing updated", err);
              }
            }
          );
        }
      }

      installmentFeePlanModel.updateOne(
        { _id: studentFeesDetails._id },
        {
          $set: {
            paidAmount: totalPaid,
            pendingAmount: totalPending,
            status: statusMain,
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
        _id: studentFeeMapDetails.programPlanId,
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
module.exports = { createOtcPayment: createOtcPayment, getStudentFeesDetails };
