const { createConnection } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const userSettings = require("../../utils/helper_jsons/settings.json");
const { sendEmail } = require("../emailController");
const { receiveFeesAmount } = require("./fees-collection");
const { makePayment } = require("../paymentGatewayController");
module.exports.createTransaction = async (req, res) => {
  const { resource } = req.headers;
  const { transactionType, transactionSubType, entityId } = req.body;
  const dbConnection = await createConnection(entityId, resource);
  const { provider, sender } = userSettings.emailService;
  switch (true) {
    case transactionType == "eduFees" && transactionSubType == "feePayment":
      try {
        await receiveFeesAmount(req.body, dbConnection)
          .then(async (feesReceiptData) => {
            const emailData = await sendEmail(
              provider,
              req.body.studentId,
              sender
            );
            res.status(200).send({
              status: "success",
              message: "Fees received",
              data: feesReceiptData,
            });
          })
          .catch((err) => {
            throw err;
          });
      } catch (e) {
        console.log(e);
        res.status(500).send({
          status: "failure",
          message: "failed to receive fees",
          data: e,
        });
      } finally {
        dbConnection && dbConnection.close();
      }
  }
};

module.exports.createPayment = async (req, res) => {
  const { resource, orgId } = req.headers;
  const dbConnection = await createConnection(orgId, resource);
  makePayment(req.body, dbConnection)
    .then((paymentData) => {
      dbConnection.close();
      res.send({
        status: "success",
        message: "payment done",
        data: paymentData,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({
        status: "failure",
        message: "payment failure",
        data: err,
      });
    });
};
