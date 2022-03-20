const mongoose = require("mongoose");
const nonReconciledTransactionSchema = require("../../models/reconciliationTransactionsModel");
const nonReconciledTransactionCollectionName = "nonreconciledtransactions";
const { createDatabase } = require("../../utils/db_creation");
const orgListSchema = require("../../models/orglists-schema");
const axios = require("axios");
const receivePayment = async (req, res) => {
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
  const nonReconciledTransactionModel = dbConnection.model(
    nonReconciledTransactionCollectionName,
    nonReconciledTransactionSchema,
    nonReconciledTransactionCollectionName
  );
  let feesPaymentData = {
    transactionDate: inputData.transactionDate,
    relatedTransactions: inputData.relatedTransactions,
    transactionType: "eduFees",
    transactionSubType: "feePayment",
    amount: inputData.amount,
    data: inputData.data,
    paymentMode: inputData.data.mode,
    paymentReferenceNumber: inputData.paymentReferenceNumber,
    paymentDetails: {
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
    paymentTransactionId: inputData.data.modeDetails.transactionId,
    createdBy: inputData.data.orgId,
    status: inputData.status,
    isReconciled: false,
  };
  let nonReconciledTransactionData = new nonReconciledTransactionModel(
    feesPaymentData
  );
  nonReconciledTransactionData
    .save()
    .then(async (data) => {
      if (feesPaymentData.paymentMode == "cash") {
        let originalUrl = req.originalUrl.split("makePayment");
        const fullUrl =
          req.protocol +
          "://" +
          req.get("host") +
          `${originalUrl[0]}feepayment`;
        req.body.data.method = req.body.data.mode;
        req.body.emailCommunicationRefIds =
          req.body.data.emailCommunicationRefIds;
        req.body.studentFeeMap = req.body.data.studentFeeMap;
        const makeFeesEntry = await axios.post(fullUrl, req.body);
        console.log(makeFeesEntry.data);
        if (makeFeesEntry.data && makeFeesEntry.data.data)
          await nonReconciledTransactionModel.findByIdAndUpdate(
            { _id: data._id },
            {
              $set: {
                isReconciled: true,
                transactionReferenceId: makeFeesEntry.data.data._id,
              },
            },
            { new: true }
          );
        res.status(200).send({
          status: "success",
          message: "Payment details added",
          data,
        });
      } else {
        res.status(200).send({
          status: "success",
          message: "Payment details added",
          data,
        });
      }
      dbConnection.close();
    })
    .catch((err) => {
      console.log(err);
      dbConnection.close();
      res.status(500).send({
        status: "Failure",
        message: "Unable to add payment",
        data: err,
      });
    })
    .finally((data) => {
      centralDbConnection.close();
    });
};

module.exports = {
  receivePayment,
};
