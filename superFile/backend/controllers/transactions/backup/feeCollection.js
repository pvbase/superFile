const orgListSchema = require("../../models/orglists-schema");
let axios = require("axios");
const moment = require("moment");
const { processTransaction } = require("./paymentTransactionController");
const { createDatabase } = require("../../utils/db_creation");
const transactionsSchema = require("../../models/transactionsModel");
const {
  receiptTemplate,
  receiptPdf,
} = require("../../utils/helper_functions/templates/receipt-email-template");
const AWS = require("aws-sdk");
const feesLedgerSchema = require("../../models/feesLedgerModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const mongoose = require("mongoose");
const { sendEmail } = require("../emailController");

const {
  feePaymentTemplate,
} = require("../../utils/helper_functions/templates/feePaymentSuccess");
const StudentSchema = require("../../models/studentModel");
awsCredentials = {
  accessKeyId: "AKIAR6HU7QOXIVHWCXAL",
  secretAccessKey: "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",
  region: "us-east-1",
};
AWS.config.update(awsCredentials);
var s3 = new AWS.S3();
module.exports.createFeeCollection = async (req, res) => {
  let inputData = req.body;
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
  }

  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  var rcptId = await getDisplayId(dbConnection);
  let passData = {
    displayName: rcptId,
    transactionDate: inputData.transactionDate,
    relatedTransactions: inputData.relatedTransactions,
    transactionType: "eduFees",
    transactionSubType: "feePayment",
    amount: inputData.amount,
    data: {
      orgId: inputData.data.orgId,
      displayName: rcptId,
      transactionType: "eduFees",
      transactionSubType: "feePayment",
      mode: inputData.data.mode,
      method: inputData.method,
      modeDetails: {
        netBankingType: inputData.data.modeDetails.netBankingType,
        walletType: inputData.data.modeDetails.walletType,
        instrumentNo: inputData.data.modeDetails.instrumentNo,
        instrumentDate: inputData.data.modeDetails.instrumentDate,
        bankName: inputData.data.modeDetails.bankName,
        cardDetails: {
          cardType: inputData.data.modeDetails.cardType,
          nameOnCard: inputData.data.modeDetails.nameOnCard,
          cardNumber: inputData.data.modeDetails.cardNumber,
        },
        branchName: inputData.data.modeDetails.branch,
        transactionId: inputData.data.modeDetails.transactionId,
        remarks: inputData.data.modeDetails.remarks,
      },
      amount: inputData.data.amount,
    },
    paymentTransactionId: inputData.data.modeDetails.transactionId,
    createdBy: inputData.data.orgId,
  };
  processTransaction({ body: passData }, dbConnection)
    .then(async (paymentData) => {
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
      var quotedIds;
      if (inputData.relatedTransactions.length > 0) {
        quotedIds = inputData.relatedTransactions
          .map(function (id) {
            return id;
          })
          .join(", ");
      } else {
        quotedIds = inputData.relatedTransactions[0];
      }
      let transactionDetails = {
        demandNote: quotedIds,
        transactionId: inputData.data.modeDetails.instrumentNo,
        mode: inputData.data.method,
      };
      const emailTemplate = feePaymentTemplate(orgDetails, transactionDetails);
      let emailCommunicationRefIds = inputData.emailCommunicationRefIds;
      // res.status(200).send(paymentData);
      sendEmail(
        orgDetails.emailServer.emailServer,
        emailCommunicationRefIds,
        orgDetails.emailServer.emailAddress,
        "ZQ EDU-Payment Success",
        emailTemplate,
        []
      )
        .then(async (data) => {
          if (paymentData.status == "failure") {
            return res.status(400).send(paymentData);
          } else {
            let feeMapModel = dbConnection1.model(
              "studentfeesmaps",
              StudentFeeMapSchema
            );
            let feMapDe = await feeMapModel.findOne({
              displayName: inputData.studentFeeMap,
            });
            let paidA = Number(feMapDe.paid) + Number(inputData.amount);
            feeMapModel.updateOne(
              { displayName: inputData.studentFeeMap },
              {
                $set: {
                  paid: paidA,
                  pending: Number(feMapDe.amount) - Number(paidA),
                },
              },
              function (err, feeMapD) {
                if (feeMapD.nModified) {
                  dbConnection1.close();
                  return res.status(200).send(paymentData);
                } else {
                  dbConnection1.close();
                  return res.status(400).json({
                    status: "failure",
                    message: "Student Fees mapping not updated",
                    Error: err,
                  });
                }
              }
            );
            // return res.status(200).json(feeMapDetails);
            //return res.status(200).send(paymentData);
          }
        })
        .catch((err) => {
          res.status(500).send({
            status: "failure",
            message: "failed to send email",
            data: err,
          });
        });
    })
    .catch((err) => {
      centralDbConnection.close();
      dbConnection.close();
      res.status(500).send(err);
    });
};
module.exports.createFeeCollectionWithReceipt = async (req, res) => {
  var receiptN = ("" + Math.random()).substring(2, 7);
  var year1 = moment().format("YYYY");
  var year2 = moment().year();
  var receiptNo = `${year2}/${receiptN + 1}`;
  var transID = `Transaction/${year2}/${receiptN + 1}`;

  let inputData = req.body;
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
  }

  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  var rcptId = await getDisplayId(dbConnection);
  let passData = {
    displayName: rcptId,
    transactionDate: inputData.transactionDate,
    relatedTransactions: inputData.relatedTransactions,
    transactionType: "eduFees",
    transactionSubType: "feePayment",
    amount: inputData.amount,
    receiptNo: receiptNo,
    data: {
      orgId: inputData.data.orgId,
      displayName: rcptId,
      transactionType: "eduFees",
      transactionSubType: "feePayment",
      mode: inputData.data.mode,
      method: inputData.method,
      modeDetails: {
        netBankingType: inputData.data.modeDetails.netBankingType,
        walletType: inputData.data.modeDetails.walletType,
        instrumentNo: inputData.data.modeDetails.instrumentNo,
        instrumentDate: inputData.data.modeDetails.instrumentDate,
        bankName: inputData.data.modeDetails.bankName,
        cardDetails: {
          cardType: inputData.data.modeDetails.cardType,
          nameOnCard: inputData.data.modeDetails.nameOnCard,
          cardNumber: inputData.data.modeDetails.cardNumber,
        },
        branchName: inputData.data.modeDetails.branch,
        transactionId: inputData.data.modeDetails.transactionId,
        remarks: inputData.data.modeDetails.remarks,
      },
      amount: inputData.data.amount,
    },
    paymentTransactionId: inputData.data.modeDetails.transactionId,
    createdBy: inputData.data.orgId,
  };
  processTransaction({ body: passData }, dbConnection)
    .then(async (paymentData) => {
      if (paymentData.status == "failure") {
        dbConnection.close();
        return res.status(400).send(paymentData);
      }
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
      var quotedIds;
      if (inputData.relatedTransactions.length > 0) {
        quotedIds = inputData.relatedTransactions
          .map(function (id) {
            return id;
          })
          .join(", ");
      } else {
        quotedIds = inputData.relatedTransactions[0];
      }
      let transactionId;
      if (inputData.data.mode == "cash") {
        transactionId = transID;
      } else {
        transactionId = inputData.paymentTransactionId;
      }
      let transactionDetails = {
        demandNote: quotedIds,
        transactionId: transactionId,
        mode: inputData.data.mode,
        amount: inputData.amount,
      };
      const emailTemplate = feePaymentTemplate(orgDetails, transactionDetails);
      let emailCommunicationRefIds = inputData.emailCommunicationRefIds;
      // res.status(200).send(paymentData);
      sendEmail(
        orgDetails.emailServer.emailServer,
        emailCommunicationRefIds,
        orgDetails.emailServer.emailAddress,
        "ZQ EDU-Payment Success",
        emailTemplate,
        []
      )
        .then(async (data) => {
          if (paymentData.status == "failure") {
            dbConnection1.close();
            return res.status(400).send(paymentData);
          } else {
            let feeMapModel = dbConnection1.model(
              "studentfeesmaps",
              StudentFeeMapSchema
            );
            let feMapDe = await feeMapModel.findOne({
              displayName: inputData.studentFeeMap,
            });
            let paidA = Number(feMapDe.paid) + Number(inputData.amount);
            feeMapModel.updateOne(
              { displayName: inputData.studentFeeMap },
              {
                $set: {
                  paid: paidA,
                  pending: Number(feMapDe.amount) - Number(paidA),
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
                      name: "Previous Dues",
                      value: "previousDue",
                      type: "amount",
                    },
                    {
                      name: "Current Dues",
                      value: "currentDue",
                      type: "amount",
                    },
                    {
                      name: "Total Due Amount",
                      value: "totalDue",
                      type: "amount",
                    },
                    {
                      name: "Paid Amount",
                      value: "paidAmount",
                      type: "amount",
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

                  let FeesLedgerModel = dbConnection1.model(
                    "feesledgers",
                    feesLedgerSchema
                  );
                  let ledgerData = await FeesLedgerModel.findOne({
                    transactionDisplayName: rcptId,
                  });
                  let transactionData = await TxnModel.findOne({
                    displayName: rcptId,
                  });
                  let demandNoteData = await TxnModel.findOne({
                    displayName: inputData.relatedTransactions[0],
                  });
                  var feeTypesDetails = await feeTypeModel.findOne({
                    displayName: ledgerData.feeTypeCode,
                  });

                  var allMaildata = {
                    transactionId: transactionId,
                    studentName: demandNoteData.studentName,
                  };
                  console.log("allMail", allMaildata);
                  const emailTemplate1 = await receiptTemplate(
                    orgDetails,
                    allMaildata
                  );

                  let feesAll = [
                    {
                      feeTypeName: feeTypesDetails.title,
                      previousDue: 0.0,
                      currentDue: demandNoteData.amount,
                      totalDue: demandNoteData.amount,
                      paidAmount: ledgerData.paidAmount,
                      mode: inputData.data.mode,
                      academicYear: demandNoteData.academicYear,
                      demandNoteId: inputData.relatedTransactions[0],
                      studentName: demandNoteData.studentName,
                      class: demandNoteData.class,
                    },
                  ];
                  const emailTemplate = await receiptPdf(
                    orgDetails,
                    feesAll,
                    feeTableHeader,
                    receiptNo
                  );
                  let obje = {
                    html: emailTemplate,
                  };
                  let createPdf = await axios.post(
                    "http://18.214.67.236:8080/receipts",
                    obje
                  );
                  var filing = {
                    Bucket: "supportings",
                    Key: createPdf.data.data,
                  };
                  s3.getObject(filing, function (err, receiptRaw) {
                    if (err) {
                      dbConnection1.close();
                      res.status(400).json({ Error: err, status: "failed" });
                    } // an error occurred
                    else {
                      dbConnection1.close();
                      res.status(200).json({
                        status: "success",
                        data: paymentData,
                        receiptKey: createPdf.data.data,
                      });
                      // sendEmail(
                      //   orgDetails.emailServer.emailServer,
                      //   inputData.emailCommunicationRefIds,
                      //   orgDetails.emailServer.emailAddress,
                      //   "ZQ EDU-Receipt",
                      //   emailTemplate1,
                      //   [receiptRaw.Body]
                      // )
                      //   .then((data) => {
                      //     dbConnection1.close();
                      //     res.status(200).json({
                      //       status: "success",
                      //       message: "Receipt sent successfully",
                      //       data: paymentData,
                      //       receiptKey: createPdf.data.data,
                      //     });
                      //   })
                      //   .catch((err) => {
                      //     dbConnection1.close();
                      //     res.status(500).send({
                      //       status: "failure",
                      //       message: "failed to send receipt email",
                      //       data: err,
                      //     });
                      //   });
                    } // successful response
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
            // return res.status(200).json(feeMapDetails);
            //return res.status(200).send(paymentData);
          }
        })
        .catch((err) => {
          centralDbConnection.close();
          dbConnection.close();
          res.status(500).send({
            status: "failure",
            message: "failed to send email",
            data: err,
          });
        });
    })
    .catch((err) => {
      centralDbConnection.close();
      dbConnection.close();
      res.status(500).send(err);
    });
};

module.exports.getReceipt = async (req, res) => {
  let fileName = req.body.key;
  var params = {
    Bucket: "supportings",
    Key: fileName,
  };
  if (!fileName) {
    res.status(404).json({ status: "failed", message: "invalid input" });
  }

  s3.getSignedUrl("getObject", params, function (err, data) {
    // s3.getObject(params, function (err, data) {
    if (err) {
      return res.status(400).json({ message: err });
    }
    if (data) {
      res.status(200).json({ url: data });
    }
  });
  // s3.getObject(params, function (err, data) {
  //   if (err) {
  //     return res.status(400).json({ message: err });
  //   }
  //   if (data) {
  //     // res.status(200).json({ url: data });
  //     res.attachment("receipt.pdf");
  //     res.send(data.Body);
  //   }
  // });
  // let readStream = await s3.getObject(params).createReadStream();
  // // When the stream is done being read, end the response
  // readStream.on("close", () => {
  //   res.end();
  // });

  // readStream.pipe(res);
};
module.exports.getReceiptBlob = async (req, res) => {
  let fileName = req.body.key;
  var params = {
    Bucket: "supportings",
    Key: fileName,
  };
  if (!fileName) {
    res.status(404).json({ status: "failed", message: "invalid input" });
  }

  s3.getObject(params, function (err, data) {
    if (err) {
      return res.status(400).json({ message: err });
    }
    if (data) {
      // res.status(200).json({ url: data });
      res.attachment("receipt.pdf");
      res.send(data.Body);
    }
  });
  // let readStream = await s3.getObject(params).createReadStream();
  // // When the stream is done being read, end the response
  // readStream.on("close", () => {
  //   res.end();
  // });

  // readStream.pipe(res);
};
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
