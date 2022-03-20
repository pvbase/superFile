const orgListSchema = require("../../models/orglists-schema");
let axios = require("axios");
const moment = require("moment");
const { BlobServiceClient } = require("@azure/storage-blob");
var storage = require("@azure/storage-blob");
const { processTransaction } = require("./paymentTransaction");
const { createDatabase } = require("../../utils/db_creation");
const transactionsSchema = require("../../models/transactionsModel");
const {
  receiptTemplate,
  receiptPdf,
} = require("../../utils/helper_functions/templates/receipt-email-template");
const AWS = require("aws-sdk");
const feesLedgerSchema = require("../../models/feesLedgerModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const reconciliationTransactionsSchema = require("../../models/reconciliationTransactionsModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const mongoose = require("mongoose");
const { sendEmail } = require("../emailController");

const {
  feePaymentTemplate,
} = require("../../utils/helper_functions/templates/feePaymentSuccess");
const StudentSchema = require("../../models/studentModel");
awsCredentials = {
  accessKeyId: "AKIAR6HU7QOXBS76HGOC",
  secretAccessKey: "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",
  region: "us-east-1",
};
AWS.config.update(awsCredentials);
var s3 = new AWS.S3();
module.exports.createFeeCollectionWithReceipt = async (req, res) => {
  let inputData = req.body;
  var receiptN = ("" + Math.random()).substring(2, 7);
  var year1 = moment().format("YYYY");
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
  }

  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  var rcptId = await getDisplayId(dbConnection);
  let transactionId;
  if (mode == "cash") {
    transactionId = transID;
  } else {
    transactionId = inputData.paymentTransactionId;
  }
  let receiptNo;
  if (inputData.type == "receipt") {
    receiptNo = `${year2}/${receiptN + 1}`;
  } else {
    receiptNo = transactionId;
  }

  let passData = {
    displayName: rcptId,
    transactionDate: inputData.transactionDate,
    relatedTransactions: inputData.relatedTransactions,
    transactionType: "eduFees",
    transactionSubType: "feePayment",
    studentId: inputData.studentId,
    studentName: inputData.studentName,
    class: inputData.class,
    academicYear: inputData.academicYear,
    amount: inputData.amount,
    studentRegId: inputData.studentRegId,
    receiptNo: rcptId,
    programPlan: inputData.programPlanId,
    data: {
      orgId: inputData.data.orgId,
      displayName: rcptId,
      transactionType: "eduFees",
      transactionSubType: "feePayment",
      mode: mode,
      method: inputData.data.method,
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
        transactionId: transactionId,
        remarks: inputData.data.modeDetails.remarks,
      },
      feesBreakUp: inputData.data.feesBreakUp,
    },
    paymentTransactionId: transactionId,
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

      let transactionDetails = {
        demandNote: inputData.relatedTransactions[0],
        transactionId: transactionId,
        mode: mode,
        amount: inputData.amount,
        type: "",
        status: "",
      };

      const emailTemplate = feePaymentTemplate(orgDetails, transactionDetails);
      let emailCommunicationRefIds = inputData.emailCommunicationRefIds;
      // res.status(200).send(paymentData);
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
            let feeTypeModel = dbConnection1.model("feetypes", FeeTypeSchema);

            let FeesLedgerModel = dbConnection1.model(
              "feesledgers",
              feesLedgerSchema
            );
            let reconciliationTransactionsModel = dbConnection1.model(
              "reconciliationTransactions",
              reconciliationTransactionsSchema
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

            console.log("allMail", allMaildata);

            let feesAll = [
              {
                feeTypeName: feeTypesDetails.title,
                previousDue: 0.0,
                currentDue: demandNoteData.amount,
                totalDue: demandNoteData.amount,
                paidAmount: ledgerData.paidAmount,
                mode: mode,
                academicYear: demandNoteData.academicYear,
                demandNoteId: inputData.relatedTransactions[0],
                studentName: demandNoteData.studentName,
                class: demandNoteData.class,
              },
            ];

            var allMaildata = {
              transactionId: transactionId,
              studentName: demandNoteData.studentName,
            };
            //Send receipt or Acknowledgement
            const emailTemplate1 = await receiptTemplate(
              orgDetails,
              allMaildata
            );
            const successReceipt = await receiptPdf(
              orgDetails,
              feesAll,
              feeTableHeader,
              rcptId,
              "receipt"
            );
            let obje = {
              html: successReceipt,
            };

            let createPdf = await axios.post(
              "http://18.214.67.236:8080/receipts",
              obje
            );
            dbConnection1.close();
            let title = "ZQ EDU-Receipt";
            // if (inputData.type == "receipt") {
            //   title = "ZQ EDU-Receipt";
            // } else {
            //   title = "ZQ EDU-Acknowledgement";
            // }
            sendEmail(
              orgDetails.emailServer[0].emailServer,
              inputData.emailCommunicationRefIds,
              orgDetails.emailServer[0].emailAddress,
              title,
              emailTemplate1,
              createPdf.data.file
            )
              .then((data) => {
                dbConnection1.close();
                res.status(200).json({
                  status: "success",
                  message: "Receipt sent successfully",
                  data: paymentData,
                  receiptKey: createPdf.data.data,
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
            // successful response
            // res.status(200).json({
            //   status: "success",
            //   data: paymentData,
            //   receiptKey: createPdf.data.data,
            // });
            // s3.getObject(filing, function (err, receiptRaw) {
            //   if (err) {
            //     dbConnection1.close();
            //     res.status(400).json({ Error: err, status: "failed" });
            //   } // an error occurred
            //   else {
            //     dbConnection1.close();
            //     res.status(200).json({
            //       status: "success",
            //       data: paymentData,
            //       receiptKey: createPdf.data.data,
            //     });
            //     // sendEmail(
            //     //   orgDetails.emailServer.emailServer,
            //     //   inputData.emailCommunicationRefIds,
            //     //   orgDetails.emailServer.emailAddress,
            //     //   "ZQ EDU-Receipt",
            //     //   emailTemplate1,
            //     //   [receiptRaw.Body]
            //     // )
            //     //   .then((data) => {
            //     //     dbConnection1.close();
            //     //     res.status(200).json({
            //     //       status: "success",
            //     //       message: "Receipt sent successfully",
            //     //       data: paymentData,
            //     //       receiptKey: createPdf.data.data,
            //     //     });
            //     //   })
            //     //   .catch((err) => {
            //     //     dbConnection1.close();
            //     //     res.status(500).send({
            //     //       status: "failure",
            //     //       message: "failed to send receipt email",
            //     //       data: err,
            //     //     });
            //     //   });
            //   } // successful response
            // });
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
    })
    .catch((err) => {
      console.log(err);
      centralDbConnection.close();
      dbConnection.close();
      res.status(500).send(err);
    });
};
module.exports.createFeeCollection = async (req, res) => {
  let inputData = req.body;
  var receiptN = ("" + Math.random()).substring(2, 7);
  var year1 = moment().format("YYYY");
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
  }

  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  var rcptId = await getDisplayId(dbConnection);
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
  if (mode == "cash") {
    transactionId = transID;
  } else {
    transactionId = inputData.paymentTransactionId;
  }
  let passData = {
    displayName: rcptId,
    transactionDate: inputData.transactionDate,
    relatedTransactions: inputData.relatedTransactions,
    transactionType: "eduFees",
    transactionSubType: "feePayment",
    studentId: inputData.studentId,
    studentName: inputData.studentName,
    class: inputData.class,
    academicYear: inputData.academicYear,
    amount: inputData.amount,
    receiptNo: rcptId,
    data: {
      orgId: inputData.data.orgId,
      displayName: rcptId,
      transactionType: "eduFees",
      transactionSubType: "feePayment",
      mode: mode,
      method: inputData.data.method,
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
        transactionId: transactionId,
        remarks: inputData.data.modeDetails.remarks,
      },
      amount: inputData.data.amount,
    },
    paymentTransactionId: transactionId,
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

      let transactionDetails = {
        demandNote: inputData.relatedTransactions[0],
        transactionId: transactionId,
        mode: mode,
        amount: inputData.amount,
        type: "",
        status: "",
      };

      const emailTemplate = feePaymentTemplate(orgDetails, transactionDetails);
      let emailCommunicationRefIds = inputData.emailCommunicationRefIds;
      // res.status(200).send(paymentData);
      sendEmail(
        orgDetails.emailServer[0].emailServer,
        emailCommunicationRefIds,
        orgDetails.emailServer[0].emailAddress,
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
                  let reconciliationTransactionsModel = dbConnection1.model(
                    "reconciliationTransactions",
                    reconciliationTransactionsSchema
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

                  // const emailTemplate1 = await receiptTemplate(
                  //   orgDetails,
                  //   allMaildata
                  // );
                  console.log("allMail", allMaildata);

                  let feesAll = [
                    {
                      feeTypeName: feeTypesDetails.title,
                      previousDue: 0.0,
                      currentDue: demandNoteData.amount,
                      totalDue: demandNoteData.amount,
                      paidAmount: ledgerData.paidAmount,
                      mode: mode,
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
                  // var filing = {
                  //   Bucket: "supportings",
                  //   Key: createPdf.data.data,
                  // };
                  dbConnection1.close();
                  res.status(200).json({
                    status: "success",
                    data: paymentData,
                    receiptKey: createPdf.data.data,
                  });
                  // s3.getObject(filing, function (err, receiptRaw) {
                  //   if (err) {
                  //     dbConnection1.close();
                  //     res.status(400).json({ Error: err, status: "failed" });
                  //   } // an error occurred
                  //   else {
                  //     dbConnection1.close();
                  //     res.status(200).json({
                  //       status: "success",
                  //       data: paymentData,
                  //       receiptKey: createPdf.data.data,
                  //     });
                  //     // sendEmail(
                  //     //   orgDetails.emailServer.emailServer,
                  //     //   inputData.emailCommunicationRefIds,
                  //     //   orgDetails.emailServer.emailAddress,
                  //     //   "ZQ EDU-Receipt",
                  //     //   emailTemplate1,
                  //     //   [receiptRaw.Body]
                  //     // )
                  //     //   .then((data) => {
                  //     //     dbConnection1.close();
                  //     //     res.status(200).json({
                  //     //       status: "success",
                  //     //       message: "Receipt sent successfully",
                  //     //       data: paymentData,
                  //     //       receiptKey: createPdf.data.data,
                  //     //     });
                  //     //   })
                  //     //   .catch((err) => {
                  //     //     dbConnection1.close();
                  //     //     res.status(500).send({
                  //     //       status: "failure",
                  //     //       message: "failed to send receipt email",
                  //     //       data: err,
                  //     //     });
                  //     //   });
                  //   } // successful response
                  // });
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
      console.log(err);
      centralDbConnection.close();
      dbConnection.close();
      res.status(500).send(err);
    });
};

module.exports.getReceipt = async (req, res) => {
  let fileName = req.body.key;
  if (!fileName) {
    res.status(404).json({ status: "failed", message: "invalid input" });
  }
  let accountname = "supportings";
  const containerName = "zenqore-supportings";
  let key =
    "l0OS+bMOq4Ak99YmohhikO/lTo1glFf8N1spp+AmAm7dM3mUNK6sL2ec97SjgRqdn1oTzhfgzcuMGeHcMd4YFg==";
  const cerds = new storage.StorageSharedKeyCredential(accountname, key);
  let blobName = fileName;
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = await containerClient.getBlobClient(blobName);
  const blobSAS = await storage
    .generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: storage.BlobSASPermissions.parse("racwd"),
        startsOn: new Date(),
        expiresOn: new Date(new Date().valueOf() + 86400),
      },
      cerds
    )
    .toString();
  // const sasUrl = blobClient.url + "?" + blobSAS;
  let minUrl = blobClient.url;

  if (minUrl) {
    res.status(200).json({ url: minUrl });
  }
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
