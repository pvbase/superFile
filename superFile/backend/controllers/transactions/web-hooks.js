const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const axios = require("axios");
const userSettings = require("../../utils/helper_jsons/settings.json");
const { sendEmail } = require("../emailController");
const { receiveFeesAmount } = require("./fees-collection");
const { makePayment } = require("../paymentGatewayController");
const feeLedgerModel = require("../../models/feesLedgerModel");
const generalLedgerSchema = require("../../models/generalLedgerModel");
const demandNoteSchema = require("../../models/demandNoteModel");
const orgListSchema = require("../../models/orglists-schema");
const transactionsSchema = require("../../models/transactionsModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const AWS = require("aws-sdk");
const centralMongodb = `usermanagement-${process.env.stage}`;
const instituteList = "orglists";
const settingsModelName = "settings";
const {
  receiptTemplate,
  receiptPdf,
} = require("../../utils/helper_functions/templates/receipt-email-template");

awsCredentials = {
  accessKeyId: "AKIAR6HU7QOXIVHWCXAL",
  secretAccessKey: "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",
  region: "us-east-1",
};
AWS.config.update(awsCredentials);
var s3 = new AWS.S3();

module.exports.webhookHandler = async (req, res) => {
  let reqBody = req.body;
  if (
    reqBody.payload &&
    reqBody.payload.payment_link &&
    reqBody.payload.payment_link.entity
  ) {
    const queryParams = params({
      url: reqBody.payload.payment_link.entity.callback_url,
    });
    const centralDbConnection = await createDatabase(
      centralMongodb,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      instituteList,
      orgListSchema,
      instituteList
    );
    const orgListData = await orgListModel.findOne({ _id: queryParams.orgId });
    const dbConnection = await createDatabase(
      queryParams.orgId,
      orgListData.connUri
    );
    let credentialSchema = mongoose.Schema({}, { strict: false });
    const settingsModel = dbConnection.model(
      settingsModelName,
      credentialSchema,
      settingsModelName
    );
    const settingsData = await settingsModel.find({});
    const { provider, smsNotification, enableReminder, emailNotification } =
      settingsData[0]._doc.paymentService;
    switch (provider) {
      case "razorpay":
        try {
          const { status, reference_id, amount_paid } =
            reqBody.payload.payment_link.entity;
          const transactionSchema = dbConnection.model(
            "transactions",
            transactionsModel,
            "transactions"
          );
          const transactionData = await transactionSchema.findOne({
            displayName: reference_id,
          });
          const primaryTransactionData = await transactionSchema.findOne({
            displayName: transactionData.primaryTransaction,
          });
          let amountPaid = amount_paid / 100;
          if (status == "paid") {
            const { pendingAmount, amount } = primaryTransactionData;
            let primaryTransactionStatus =
              pendingAmount != 0 ? "partial" : "paid";
            await transactionSchema.findOneAndUpdate(
              { displayName: transactionData.primaryTransaction },
              { $set: { status: primaryTransactionStatus } },
              { new: true }
            );
            await transactionSchema.findOneAndUpdate(
              { displayName: reference_id },
              { $set: { status } },
              { new: true }
            );
          } else if (status == "failed") {
            let primaryTransactionStatus =
              pendingAmount === amount ? "failed" : "partial";
            await transactionSchema.findOneAndUpdate(
              { displayName: transactionData.primaryTransaction },
              { $set: { status: primaryTransactionStatus } },
              { new: true }
            );
            await transactionSchema.findOneAndUpdate(
              { displayName: reference_id },
              { $set: { status } },
              { new: true }
            );
          }
          res.send({
            status: "success",
            message: "payment status changes",
            data: transactionData,
          });
          centralDbConnection.close() // new
          dbConnection.close() // new
        } catch (e) {
          res.send({
            status: "success",
            message: "payment status change failed",
            data: e,
          });
          centralDbConnection.close() // new
          dbConnection.close() // new
        }
    }
  }
};

module.exports.receiptSend = async (req, res) => {
  console.log("webhookresponse", req.body);
  let reqBody = req.body;
  if (
    reqBody.payload &&
    reqBody.payload.payment_link &&
    reqBody.payload.payment_link.entity
  ) {
    const queryParams = params({
      url: reqBody.payload.payment_link.entity.callback_url,
    });
    const centralDbConnection = await createDatabase(
      centralMongodb,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      instituteList,
      orgListSchema,
      instituteList
    );
    const orgListData = await orgListModel.findOne({ _id: queryParams.orgId });
    const dbConnection = await createDatabase(
      queryParams.orgId,
      orgListData.connUri
    );
    let credentialSchema = mongoose.Schema({}, { strict: false });
    const settingsModel = dbConnection.model(
      settingsModelName,
      credentialSchema,
      settingsModelName
    );
    const settingsData = await settingsModel.find({});
    const {
      paymentGateway,
      smsNotification,
      enableReminder,
      emailNotification,
    } = settingsData[0]._doc.paymentGateway;
    switch (paymentGateway) {
      case "razorpay":
        try {
          const { status, reference_id, amount_paid } =
            reqBody.payload.payment_link.entity;
          const feeLedgerSchema = dbConnection.model(
            "feesledgers",
            feeLedgerModel,
            "feesledgers"
          );
          const demandNoteData = reference_id.split("#")[1];
          const transactionData = await feeLedgerSchema.findOne({
            transactionDisplayName: demandNoteData,
          });
          const primaryTransactionData = await feeLedgerSchema.find({
            primaryTransaction: transactionData.primaryTransaction,
            transactionSubType: "feePayment",
          });
          console.log("receipt data", primaryTransactionData);
          if (status == "paid") {
            console.log("status paid entered");
            // const { pendingAmount } = primaryTransactionData;

            // let primaryTransactionStatus =
            //   pendingAmount != 0 ? "partial" : "paid";

            const settingsSchema = mongoose.Schema({}, { strict: false });
            const settingsModel = dbConnection.model(
              "settings",
              settingsSchema,
              "settings"
            );
            const orgSettings = await settingsModel.find({});
            let orgDetails = orgSettings[0]._doc;
            let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
            var feesAll = [];
            const feeTableHeader = [
              { name: "Particulars", value: "feeTypeName", type: "string" },
              { name: "Previous Dues", value: "previousDue", type: "amount" },
              { name: "Current Dues", value: "currentDue", type: "amount" },
              { name: "Total Due Amount", value: "totalDue", type: "amount" },
              { name: "Paid Amount", value: "paidAmount", type: "amount" },
            ];
            for (let ft of primaryTransactionData) {
              var feeTypesDetails = await feeTypeModel.findOne({
                displayName: ft.feeTypeCode,
              });
              let feName = {
                feeTypeName: feeTypesDetails.title,
                previousDue: 0.0,
                currentDue: transactionData.dueAmount,
                totalDue: transactionData.dueAmount,
                paidAmount: ft.paidAmount,
                mode: reqBody.payload.payment.entity.method,
                academicYear: transactionData.academicYear,
                demandNoteId: ft.primaryTransaction,
                studentName: transactionData.studentName,
                class: transactionData.class,
              };
              feesAll.push(feName);
            }

            var allMaildata = {
              transactionId:
                reqBody.payload.payment.entity.acquirer_data
                  .bank_transaction_id,
              studentName: transactionData.studentName,
            };
            const emailTemplate1 = await receiptTemplate(
              orgDetails,
              allMaildata
            );
            const emailTemplate = await receiptPdf(
              orgDetails,
              feesAll,
              feeTableHeader
            );
            // return res.send(JSON.stringify(emailTemplate));
            let obje = {
              html: emailTemplate,
            };
            let createPdf = await axios.post(
              "http://3.87.49.91:8080/receipts",
              obje
            );
            var filing = {
              Bucket: "supportings",
              Key: createPdf.data.data.key,
            };

            s3.getObject(filing, function (err, receiptRaw) {
              if (err) {
                res.status(400).json({ Error: err, status: "failed" });
              } // an error occurred
              else {
                sendEmail(
                  orgDetails.emailServer.emailServer,
                  reqBody.payload.payment.entity.email,
                  orgDetails.emailServer.emailAddress,
                  "ZQ EDU-Receipt",
                  emailTemplate1,
                  [receiptRaw.Body]
                )
                  .then((data) => {
                    console.log("mail receipt sent");
                    res.status(200).json({
                      status: "success",
                      message: "Receipt sent successfully",
                    });
                    centralDbConnection.close() // new
                    dbConnection.close() // new
                  })
                  .catch((err) => {
                    res.status(500).send({
                      status: "failure",
                      message: "failed to send receipt email",
                      data: err,
                    });
                    centralDbConnection.close() // new
                    dbConnection.close() // new
                  });
              } // successful response
            });
          } else {
            res.status(400).json({
              status: "failed",
              message: "receipt sending failed",
            });
            centralDbConnection.close() // new
            dbConnection.close() // new
          }
        } catch (e) {
          console.log(e);
          res.status(400).send({
            status: "success",
            message: "payment status change failed",
            data: e,
          });
        }
    }
  } else {
    res
      .status(404)
      .json({ status: "failed", message: "Paid status not yet comfirmed" });
  }
};
module.exports.receipt = async (req, res) => {
  let reqBody = req.body;

  const orgListData = await orgListModel.findOne({ _id: reqBody.orgId });
  const dbConnection = await createDatabase(reqBody.orgId, orgListData.connUri);
  let credentialSchema = mongoose.Schema({}, { strict: false });
  const settingsModel = dbConnection.model(
    settingsModelName,
    credentialSchema,
    settingsModelName
  );
  const settingsData = await settingsModel.find({});
  const { paymentGateway, smsNotification, enableReminder, emailNotification } =
    settingsData[0]._doc.paymentGateway;
  switch (paymentGateway) {
    case "razorpay":
      try {
        const { status, reference_id, amount_paid } = reqBody;
        const feeLedgerSchema = dbConnection.model(
          "feesledgers",
          feeLedgerModel,
          "feesledgers"
        );
        const demandNoteData = reference_id.split("#")[1];
        const transactionData = await feeLedgerSchema.findOne({
          transactionDisplayName: demandNoteData,
        });
        const primaryTransactionData = await feeLedgerSchema.find({
          primaryTransaction: transactionData.primaryTransaction,
          transactionSubType: "feePayment",
        });
        console.log("receipt data", primaryTransactionData);
        if (status == "paid") {
          console.log("status paid entered");
          // const { pendingAmount } = primaryTransactionData;

          // let primaryTransactionStatus =
          //   pendingAmount != 0 ? "partial" : "paid";

          const settingsSchema = mongoose.Schema({}, { strict: false });
          const settingsModel = dbConnection.model(
            "settings",
            settingsSchema,
            "settings"
          );
          const orgSettings = await settingsModel.find({});
          let orgDetails = orgSettings[0]._doc;
          let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
          var feesAll = [];
          const feeTableHeader = [
            { name: "Particulars", value: "feeTypeName", type: "string" },
            { name: "Previous Dues", value: "previousDue", type: "amount" },
            { name: "Current Dues", value: "currentDue", type: "amount" },
            { name: "Total Due Amount", value: "totalDue", type: "amount" },
            { name: "Paid Amount", value: "paidAmount", type: "amount" },
          ];
          for (let ft of primaryTransactionData) {
            var feeTypesDetails = await feeTypeModel.findOne({
              displayName: ft.feeTypeCode,
            });
            let feName = {
              feeTypeName: feeTypesDetails.title,
              previousDue: 0.0,
              currentDue: transactionData.dueAmount,
              totalDue: transactionData.dueAmount,
              paidAmount: ft.paidAmount,
              mode: reqBody.method,
              academicYear: transactionData.academicYear,
              demandNoteId: ft.primaryTransaction,
              studentName: transactionData.studentName,
              class: transactionData.class,
            };
            feesAll.push(feName);
          }

          var allMaildata = {
            transactionId: reqBody.transactionId,
            studentName: transactionData.studentName,
          };
          const emailTemplate1 = await receiptTemplate(orgDetails, allMaildata);
          const emailTemplate = await receiptPdf(
            orgDetails,
            feesAll,
            feeTableHeader
          );
          // return res.send(JSON.stringify(emailTemplate));
          let obje = {
            html: emailTemplate,
          };
          let createPdf = await axios.post(
            "http://3.87.49.91:8080/receipts",
            obje
          );
          var filing = {
            Bucket: "supportings",
            Key: createPdf.data.data.key,
          };

          s3.getObject(filing, function (err, receiptRaw) {
            if (err) {
              res.status(400).json({ Error: err, status: "failed" });
            } // an error occurred
            else {
              sendEmail(
                orgDetails.emailServer.emailServer,
                reqBody.email,
                orgDetails.emailServer.emailAddress,
                "ZQ EDU-Receipt",
                emailTemplate1,
                [receiptRaw.Body]
              )
                .then((data) => {
                  console.log("mail receipt sent");
                  res.status(200).json({
                    status: "success",
                    message: "Receipt sent successfully",
                  });
                  centralDbConnection.close() // new
                  dbConnection.close() // new
                })
                .catch((err) => {
                  res.status(500).send({
                    status: "failure",
                    message: "failed to send receipt email",
                    data: err,
                  });
                  centralDbConnection.close() // new
                  dbConnection.close() // new
                });
            } // successful response
          });
        } else {
          res.status(400).json({
            status: "failed",
            message: "receipt sending failed",
          });
          centralDbConnection.close() // new
          dbConnection.close() // new
        }
      } catch (e) {
        console.log(e);
        res.status(400).send({
          status: "success",
          message: "payment status change failed",
          data: e,
        });
        centralDbConnection.close() // new
        dbConnection.close() // new
      }
  }
};
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
