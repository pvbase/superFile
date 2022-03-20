let axios = require("axios");
const rq = require("request-promise");
const moment = require("moment");
const { createDatabase } = require("../../utils/db_creation");
const AWS = require("aws-sdk");
const reconciliationManagerSchema = require("../../models/reconciliationManagerModel");
const mongoose = require("mongoose");
const mapperJson = require("./bankStatementMapper.json");
const POSmapperJson = require("./posStatementMapper.json");
// const mongoDbUrl = "mongodb://20.44.36.222:30000";
const bseCollectionName = "bankstmtentries";
const bseSchema = require("../../models/schemas/bankStatementEntries-model");
const feeLedgerCollectionName = "feesledgers";
const transactionsCollectionName = "transactions";
const feeLedgerSchema = require("../../models/feesLedgerModel");
const reconManagerCollectionName = "reconciliationmanager";
const reconManagerSchema = require("../../models/reconciliationManagerModel");
const longestSubstring = require("./patternSearch");
const transactionSchema = require("../../models/transactionsModel");
const transactionsSchema = require("../../models/transactionsModel");
const ProgramPlanSchema = require("../../models/programPlanModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const bankTransactionMapperSchema = require("../../models/schemas/bankTransactionMapper-Model");
const StudentSchema = require("../../models/studentModel");
var HashMap = require("hashmap");
const bankTxnsMappingCollectionName = "banktransactionsmappings";
const bankTxnsMappingSchema = require("../../models/schemas/bankTransactionMapper-Model");
const lowPatternMatchRatio = 0.4;
const highPatternMatchRatio = 0.5;
var multer = require("multer");
const upload = multer().single("file");

const {
  feePaymentTemplate,
} = require("../../utils/helper_functions/templates/feePaymentSuccess");
const {
  receiptTemplate,
  receiptPdf,
} = require("../../utils/helper_functions/templates/receipt-email-template");
const { sendEmail } = require("../emailController");
const { BlobServiceClient } = require("@azure/storage-blob");
const { generateQrCode } = require("../qrCodeController");
const { editChequeDetails } = require("../cheque-dd/cheque-dd");
const orgListSchema = require("../../models/orglists-schema");

awsCredentials = {
  accessKeyId: "AKIAR6HU7QOXBS76HGOC",
  secretAccessKey: "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",
  region: "us-east-1",
};
AWS.config.update(awsCredentials);
var s3 = new AWS.S3();
module.exports.getReconciliationListold = async (req, res) => {
  let dbConnection;
  // try {
  let page = Number(req.query.page);
  let per_page = Number(req.query.perPage);
  dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
  let reconciliationListModel = dbConnection.model(
    "reconciliationmanagers",
    reconciliationManagerSchema
  );
  let transactionModel = dbConnection.model("transactions", transactionSchema);
  let recondata = await reconciliationListModel.find({});
  let result = [];
  for (let i = 0; i < recondata.length; i++) {
    var rbankstmts = recondata[i].reconciledBankStmtEntryDetails.map(function (
      el
    ) {
      var o = Object.assign({}, el);
      o.status = "Done";
      return o;
    });
    // rbankstmtsPaginated = await Paginator(rbankstmts, page, per_page)
    var nrbankstmts = recondata[i].nonreconciledBankStmtEntryDetails.map(
      function (el) {
        var o = Object.assign({}, el);
        o.status = "Non-Reconciled";
        return o;
      }
    );
    let myPromise = new Promise(function (resolve, reject) {
      let nrfldataa = recondata[i].nonreconciledFeeLedgerDetails.map(
        async function (el) {
          let nrfeeTras = await transactionModel.findOne({
            _id: el.transactionId,
          });
          var o = Object.assign({}, el);
          o.mode = nrfeeTras.data.mode;
          if (nrfeeTras.data.mode.toLowerCase() == "cash") {
            o.modeData = {
              date: nrfeeTras.transactionDate,
              amount: nrfeeTras.amount.toFixed(2),
              remarks: nrfeeTras.data.modeDetails.remarks,
            };
          } else if (nrfeeTras.data.mode.toLowerCase() === "cheque") {
            o.modeData = {
              date: nrfeeTras.transactionDate,
              amount: nrfeeTras.amount.toFixed(2),
              ChequeNumber: nrfeeTras.data.modeDetails.transactionId,
              bankname: nrfeeTras.data.modeDetails.bankName,
              ["Branch Name"]: nrfeeTras.data.modeDetails.branchName,
              remarks: nrfeeTras.data.modeDetails.remarks,
            };
          } else if (nrfeeTras.data.mode.toLowerCase() === "card") {
            o.modeData = {
              date: nrfeeTras.transactionDate,
              amount: nrfeeTras.amount.toFixed(2),
              cardNumber: nrfeeTras.data.modeDetails.cardDetails.cardNumber,
              creditDebit: nrfeeTras.data.modeDetails.cardDetails.creditDebit,
              cardType: nrfeeTras.data.modeDetails.cardDetails.cardType,
              nameOnCard: nrfeeTras.data.modeDetails.cardDetails.nameOnCard,
              transactionNumber: nrfeeTras.data.modeDetails.transactionId,
              remarks: nrfeeTras.data.modeDetails.remarks,
            };
          } else if (nrfeeTras.data.mode.toLowerCase() === "netbanking") {
            o.modeData = {
              date: nrfeeTras.transactionDate,
              amount: nrfeeTras.amount.toFixed(2),
              bankname: nrfeeTras.data.modeDetails.bankName,
              netBankingType: nrfeeTras.data.modeDetails.netBankingType,
              UTRNumber: nrfeeTras.data.modeDetails.transactionId,
              remarks: nrfeeTras.data.modeDetails.remarks,
            };
          } else if (nrfeeTras.data.mode.toLowerCase() === "wallet") {
            o.modeData = {
              date: nrfeeTras.transactionDate,
              amount: nrfeeTras.amount.toFixed(2),
              walletType: rfeeTras.data.modeDetails.walletType,
              transactionNumber: nrfeeTras.data.modeDetails.transactionId,
              remarks: nrfeeTras.data.modeDetails.remarks,
            };
          }
          o.modeData.data = nrfeeTras.data;
          resolve(o);
        }
      );
    });

    // rfeeledgersPaginated = await Paginator(recondata[i].reconciledFeeLedgerDetails, page, per_page)
    // nrfeeledgersPaginated = await Paginator(recondata[i].nonreconciledFeeLedgerDetails, page, per_page)
    // nrbankstmtsPaginated = await Paginator(nrbankstmts, page, per_page)
    // console.log(myPromise)
    if (myPromise) {
      await result.push({
        id: recondata[i].reconciliationId,
        date: recondata[i].updatedAt,
        feesAmount: recondata[i].reconciledAmount,
        attemptedFeeLedgers: recondata[i].attemptedFeeLedgers,
        reconciledFeeLedgers: recondata[i].reconciledFeeLedgers,
        reconciledRefundFeeLedgers: 0,
        refundAmount: 0,
        percentage: (parseFloat(recondata[i].reconciledPercent) * 100).toFixed(
          2
        ),
        Items: {
          reconciledFeeLedgerDetails: recondata[i].reconciledFeeLedgerDetails,
          reconciledBankStmtEntryDetails: rbankstmts,
          nonreconciledFeeLedgerDetails: myPromise,
          nonreconciledBankStmtEntryDetails: nrbankstmts,
        },
        status: recondata[i].status,
      });
    }
  }
  resultPaginated = await Paginator(result, page, per_page);
  fresult = resultPaginated.data;
  // console.log("pp",resultPaginated.page)
  // fresult.page = resultPaginated.page
  // fresult.perPage = resultPaginated.perPage
  // fresult.nextPage = resultPaginated.nextPage
  // fresult.totalRecord = resultPaginated.totalRecord
  // fresult.totalPages = resultPaginated.totalPages
  // fresult.status = "success"
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.send(resultPaginated);
  // }
  // catch (err) {
  //     res.json({ status: "failure", message: "reconciliation: " + err.message });
  // }
  // finally {
  //     dbConnection.close();
  // }
};
module.exports.getReconciliationListol = async (req, res) => {
  let dbConnection;
  // try {
  // let mapdata = [
  // { bankDescription: "NEFT Shashank C	", transactionsStudentRegId: "1HK17IS070" }
  // ]
  let page = Number(req.query.page);
  let per_page = Number(req.query.perPage);
  dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
  let reconciliationListModel = dbConnection.model(
    "reconciliationmanagers",
    reconciliationManagerSchema
  );
  let transactionModel = dbConnection.model("transactions", transactionSchema);
  let bankstmtModel = dbConnection.model("bankstmtentries", bseSchema);

  // let mapperModel = dbConnection.model("banktransactionsmapping", bankTransactionMapperSchema);
  // await mapperModel.insertMany(mapdata)
  // console.log(gfgh)
  // await transactionModel.updateMany({ reconciliationStatus: { $in: ["nonreconciled", "softwarereconciled"] } }, { $set: { reconciliationStatus: null } })
  // await bankstmtModel.updateMany({ reconciled: true }, { $set: { reconciled: false } })

  // console.log('transactions updated', updated)
  let recondata = await reconciliationListModel.find({});
  let result = [];
  for (let i = 0; i < recondata.length; i++) {
    var rbankstmts = recondata[i].reconciledBankStmtEntryDetails.map(function (
      el
    ) {
      var o = Object.assign({}, el);
      o.creditAmount =
        typeof el.creditAmount == Number
          ? el.creditAmount.toFixed(2)
          : el.creditAmount;
      o.debitAmount =
        typeof el.debitAmount == Number
          ? el.debitAmount.toFixed(2)
          : el.debitAmount;
      o.balance =
        typeof el.balance == Number ? el.balance.toFixed(2) : el.balance;
      o.status = "Done";
      return o;
    });
    // rbankstmtsPaginated = await Paginator(rbankstmts, page, per_page)
    var nrbankstmts = recondata[i].nonreconciledBankStmtEntryDetails.map(
      function (el) {
        var o = Object.assign({}, el);
        o.creditAmount =
          typeof el.creditAmount == Number
            ? el.creditAmount.toFixed(2)
            : el.creditAmount;
        o.debitAmount =
          typeof el.debitAmount == Number
            ? el.debitAmount.toFixed(2)
            : el.debitAmount;
        o.balance =
          typeof el.balance == Number ? el.balance.toFixed(2) : el.balance;
        o.status = "Non-Reconciled";
        return o;
      }
    );
    let rfldataa = [];
    let nrfldataa = [];
    for (
      let j = 0;
      j < recondata[i].nonreconciledTransactionsDetails.length;
      j++
    ) {
      let el = recondata[i].nonreconciledTransactionsDetails[j];
      var o = Object.assign({}, el);
      o.mode = el.data.mode;
      o.amount = el.amount.toFixed(2);
      o.reconciliationId = recondata[i].reconciliationId;
      delete o.data;
      o.modeData = {
        date: el.transactionDate,
        amount: el.amount.toFixed(2),
        remarks: el.data.modeDetails.remarks,
        ChequeNumber:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.transactionId
            : undefined,
        bankname: el.data.modeDetails.bankName,
        ["Branch Name"]:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.branchName
            : undefined,
        cardNumber:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardNumber
            : undefined,
        creditDebit:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.creditDebit
            : undefined,
        cardType:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardType
            : undefined,
        nameOnCard:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.nameOnCard
            : undefined,
        transactionNumber:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.transactionId
            : el.data.mode.toLowerCase() == "card"
              ? el.data.modeDetails.transactionId
              : undefined,
        netBankingType:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.netBankingType
            : undefined,
        UTRNumber:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.transactionId
            : undefined,
        walletType:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.walletType
            : undefined,
      };
      o.modeData.data = el.data;
      nrfldataa.push(o);
    }
    for (
      let j = 0;
      j < recondata[i].reconciledTransactionsDetails.length;
      j++
    ) {
      let el = recondata[i].reconciledTransactionsDetails[j];
      var o = Object.assign({}, el);
      o.mode = el.data.mode;
      o.amount = el.amount.toFixed(2);
      o.reconciliationId = recondata[i].reconciliationId;
      delete o.data;
      o.modeData = {
        date: el.transactionDate,
        amount: el.amount.toFixed(2),
        remarks: el.data.modeDetails.remarks,
        ChequeNumber:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.transactionId
            : undefined,
        bankname: el.data.modeDetails.bankName,
        ["Branch Name"]:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.branchName
            : undefined,
        cardNumber:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardNumber
            : undefined,
        creditDebit:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.creditDebit
            : undefined,
        cardType:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardType
            : undefined,
        nameOnCard:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.nameOnCard
            : undefined,
        transactionNumber:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.transactionId
            : el.data.mode.toLowerCase() == "card"
              ? el.data.modeDetails.transactionId
              : undefined,
        netBankingType:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.netBankingType
            : undefined,
        UTRNumber:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.transactionId
            : undefined,
        walletType:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.walletType
            : undefined,
      };
      o.modeData.data = el.data;
      rfldataa.push(o);
    }
    // rfeeledgersPaginated = await Paginator(recondata[i].reconciledFeeLedgerDetails, page, per_page)
    // nrfeeledgersPaginated = await Paginator(recondata[i].nonreconciledFeeLedgerDetails, page, per_page)
    // nrbankstmtsPaginated = await Paginator(nrbankstmts, page, per_page)
    result.push({
      id: recondata[i].reconciliationId,
      date: recondata[i].updatedAt,
      feesAmount: recondata[i].reconciledAmount,
      attemptedTransactions: recondata[i].attemptedFeeLedgers,
      reconciledTransactions: recondata[i].reconciledFeeLedgers,
      reconciledRefundTransactions: 0,
      refundAmount: 0,
      percentage: (parseFloat(recondata[i].reconciledPercent) * 100).toFixed(2),
      Item: {
        reconciledTransactionsDetails: rfldataa,
        reconciledBankStmtEntryDetails: rbankstmts,
        nonreconciledTransactionsDetails: nrfldataa,
        nonreconciledBankStmtEntryDetails: nrbankstmts,
      },
      status: recondata[i].status,
    });
  }
  resultPaginated = await Paginator(result, page, per_page);
  fresult = resultPaginated.data;
  // console.log("pp",resultPaginated.page)
  // fresult.page = resultPaginated.page
  // fresult.perPage = resultPaginated.perPage
  // fresult.nextPage = resultPaginated.nextPage
  // fresult.totalRecord = resultPaginated.totalRecord
  // fresult.totalPages = resultPaginated.totalPages
  // fresult.status = "success"
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.send(resultPaginated);
  // }
  // catch (err) {
  //     res.json({ status: "failure", message: "reconciliation: " + err.message });
  // }
  // finally {
  //     dbConnection.close();
  // }
};
module.exports.getReconciliationList = async (req, res) => {
  let dbConnection
  try {
      // let page = Number(req.query.page);
      let reconBankPage = Number(req.query.reconBankPage)
      let reconTxnPage = Number(req.query.reconTxnPage)
      let nonReconBankPage = Number(req.query.nonReconBankPage)
      let nonReconTxnPage = Number(req.query.nonReconTxnPage)
      let reconRefundPage = Number(req.query.reconRefundPage)
      let reconRefundBankPage = Number(req.query.reconRefundBankPage)
      let per_page = Number(req.query.limit);
      centralDbConnection = await createDatabase(
          `usermanagement-${process.env.stage}`,
          process.env.central_mongoDbUrl
      );
      const orgListModel = centralDbConnection.model(
          "orglists",
          orgListSchema,
          "orglists"
      );
      const orgData = await orgListModel.findOne({
          _id: mongoose.Types.ObjectId(req.query.orgId),
      });
      if (orgData) {
          dbConnection = await createDatabase(
              String(orgData._id),
              orgData.connUri
          );
          // dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
          let reconciliationListModel = dbConnection.model("reconciliationmanagers", reconciliationManagerSchema);
          let transactionModel = dbConnection.model("transactions", transactionSchema);
          let bankstmtModel = dbConnection.model("bankstmtentries", bseSchema);
          let studentModel = dbConnection.model("students", StudentSchema);
          let recondata = await reconciliationListModel.findOne({ reconciliationId: req.query.id })
          if (recondata) {
              recondata = recondata._doc
              var rbankstmts = recondata.reconciledBankStmtEntryDetails.map(function (el) {
                  var o = Object.assign({}, el);
                  o.creditAmount = typeof el.creditAmount == Number ? el.creditAmount.toFixed(2) : el.creditAmount
                  o.debitAmount = typeof el.debitAmount == Number ? el.debitAmount.toFixed(2) : el.debitAmount
                  o.balance = typeof el.balance == Number ? el.balance.toFixed(2) : el.balance
                  o.status = "Done";
                  return o;
              })
              // rbankstmtsPaginated = await Paginator(rbankstmts, page, per_page)
              var nrbankstmts = recondata.nonreconciledBankStmtEntryDetails.map(function (el) {
                  var o = Object.assign({}, el);
                  o.checked = false
                  if(req.query.receiptNo == el.txnRefNo && Number(req.query.amount) == Number(el.creditAmount)){
                      o.checked = true
                  }
                  if(req.query.receiptNo == el.txnRefNo && Number(req.query.amount) == Number(el.debitAmount)){
                      o.checked = true
                  } 
                  // o.checked = req.query.receiptNo == el.txnRefNo ? true : false
                  o.creditAmount = typeof el.creditAmount == Number ? el.creditAmount.toFixed(2) : el.creditAmount
                  o.debitAmount = typeof el.debitAmount == Number ? el.debitAmount.toFixed(2) : el.debitAmount
                  o.balance = typeof el.balance == Number ? el.balance.toFixed(2) : el.balance
                  o.status = "Non-Reconciled";
                  return o;
              })
              let rrefundbankst = recondata.reconciledRefundBankStmtEntryDetails.map(function (el) {
                  var o = Object.assign({}, el);
                  o.creditAmount = typeof el.creditAmount == Number ? el.creditAmount.toFixed(2) : el.creditAmount
                  o.debitAmount = typeof el.debitAmount == Number ? el.debitAmount.toFixed(2) : el.debitAmount
                  o.balance = typeof el.balance == Number ? el.balance.toFixed(2) : el.balance
                  o.status = "Done";
                  return o;
              })
              let rfldataa = []
              let nrfldataa = []
              let rrefundtxns = []
              let rrefundfeeledgersPaginated
              let rfeeledgersPaginated
              let nrfeeledgersPaginated
              if (req.query.amount.toLowerCase() !== "all") {
                  // nrbankstmts = await nrbankstmts.filter(item => Number(item.creditAmount) == Number(req.query.amount))
                  let nrecontxns = await recondata.nonreconciledTransactionsDetails.filter(item => Number(item.amount) == Number(req.query.amount))
                  await nrecontxns.sort(function(a,b){
                      return new Date(b.transactionDate) - new Date(a.transactionDate);
                    });
                //   await recondata.reconciledTransactionsDetails.sort(function(a,b){
                //       return new Date(b.transactionDate) - new Date(a.transactionDate);
                //     });
                  rfeeledgersPaginated = await Paginator(recondata.reconciledTransactionsDetails, reconTxnPage, per_page)
                  nrfeeledgersPaginated = await Paginator(nrecontxns, nonReconTxnPage, per_page)
                  rrefundfeeledgersPaginated = await Paginator(recondata.reconciledRefundBankStmtEntryDetails, reconRefundPage, per_page)
              } else {
                  await recondata.nonreconciledTransactionsDetails.sort(function(a,b){
                      return new Date(b.transactionDate) - new Date(a.transactionDate);
                    });
                //   await recondata.reconciledTransactionsDetails.sort(function(a,b){
                //       return new Date(b.transactionDate) - new Date(a.transactionDate);
                //     });
                  rfeeledgersPaginated = await Paginator(recondata.reconciledTransactionsDetails, reconTxnPage, per_page)
                  nrfeeledgersPaginated = await Paginator(recondata.nonreconciledTransactionsDetails, nonReconTxnPage, per_page)
                  rrefundfeeledgersPaginated = await Paginator(recondata.reconciledRefundBankStmtEntryDetails, reconRefundPage, per_page)
              }
              for (let j = 0; j < nrfeeledgersPaginated.data.length; j++) {
                  let el = nrfeeledgersPaginated.data[j]
                  let stddata = await studentModel.findOne({ _id: mongoose.Types.ObjectId(el.studentId) })
                  var o = Object.assign({}, el);
                  o.mode = el.data.mode
                  // console.log(req.query.receiptNo.toString() == el.receiptNo.toString(), req.query.receiptNo, el.receiptNo)
                  // o.checked = req.query.receiptNo == el.receiptNo ? true : false
                  o.amount = el.amount.toFixed(2)
                  o.reconciliationId = recondata.reconciliationId
                  delete o.data
                  console.log(el)
                  o.modeData = {
                      date: el.transactionDate,
                      amount: el.amount.toFixed(2),
                      remarks: el.data.modeDetails.remarks,
                      parentName: stddata._doc.parentName == "NA" ? "" : stddata._doc.parentName,
                      feeType: el.data.feesBreakUp[0].title,
                      ChequeNumber: el.data.mode.toLowerCase() == 'cheque' ? el.data.modeDetails.transactionId : undefined,
                      bankname: el.data.modeDetails.bankName,
                      ['Branch Name']: el.data.mode.toLowerCase() == 'cheque' ? el.data.modeDetails.branchName : undefined,
                      cardNumber: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.cardNumber : undefined,
                      creditDebit: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.creditDebit : undefined,
                      cardType: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.cardType : undefined,
                      nameOnCard: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.nameOnCard : undefined,
                      transactionNumber: el.data.mode.toLowerCase() == 'wallet' ? el.data.modeDetails.transactionId : el.data.mode.toLowerCase() == 'card' ? el.data.modeDetails.transactionId : undefined,
                      netBankingType: el.data.mode.toLowerCase() == 'netbanking' ? el.data.modeDetails.netBankingType : undefined,
                      UTRNumber: el.data.mode.toLowerCase() == 'netbanking' ? el.data.modeDetails.transactionId : undefined,
                      walletType: el.data.mode.toLowerCase() == 'wallet' ? el.data.modeDetails.walletType : undefined,
                  }
                  o.modeData.data = el.data
                  nrfldataa.push(o)
              }
              for (let j = 0; j < rfeeledgersPaginated.data.length; j++) {
                  let el = rfeeledgersPaginated.data[j]
                  var o = Object.assign({}, el);
                  o.mode = el.data.mode
                  o.amount = el.amount.toFixed(2)
                  o.reconciliationId = recondata.reconciliationId
                  delete o.data
                  o.modeData = {
                      date: el.transactionDate,
                      amount: el.amount.toFixed(2),
                      remarks: el.data.modeDetails.remarks,
                      ChequeNumber: el.data.mode.toLowerCase() == 'cheque' ? el.data.modeDetails.transactionId : undefined,
                      bankname: el.data.modeDetails.bankName,
                      ['Branch Name']: el.data.mode.toLowerCase() == 'cheque' ? el.data.modeDetails.branchName : undefined,
                      cardNumber: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.cardNumber : undefined,
                      creditDebit: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.creditDebit : undefined,
                      cardType: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.cardType : undefined,
                      nameOnCard: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.nameOnCard : undefined,
                      transactionNumber: el.data.mode.toLowerCase() == 'wallet' ? el.data.modeDetails.transactionId : el.data.mode.toLowerCase() == 'card' ? el.data.modeDetails.transactionId : undefined,
                      netBankingType: el.data.mode.toLowerCase() == 'netbanking' ? el.data.modeDetails.netBankingType : undefined,
                      UTRNumber: el.data.mode.toLowerCase() == 'netbanking' ? el.data.modeDetails.transactionId : undefined,
                      walletType: el.data.mode.toLowerCase() == 'wallet' ? el.data.modeDetails.walletType : undefined,
                  }
                  o.modeData.data = el.data
                  rfldataa.push(o)
              }
              for (let j = 0; j < rrefundfeeledgersPaginated.data.length; j++) {
                  let el = rfeeledgersPaginated.data[j]
                  var o = Object.assign({}, el);
                  o.mode = el.data.mode
                  o.amount = el.amount.toFixed(2)
                  o.reconciliationId = recondata.reconciliationId
                  delete o.data
                  o.modeData = {
                      date: el.transactionDate,
                      amount: el.amount.toFixed(2),
                      remarks: el.data.modeDetails.remarks,
                      ChequeNumber: el.data.mode.toLowerCase() == 'cheque' ? el.data.modeDetails.transactionId : undefined,
                      bankname: el.data.modeDetails.bankName,
                      ['Branch Name']: el.data.mode.toLowerCase() == 'cheque' ? el.data.modeDetails.branchName : undefined,
                      cardNumber: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.cardNumber : undefined,
                      creditDebit: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.creditDebit : undefined,
                      cardType: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.cardType : undefined,
                      nameOnCard: el.data.modeDetails.cardDetails !== undefined ? el.data.modeDetails.cardDetails.nameOnCard : undefined,
                      transactionNumber: el.data.mode.toLowerCase() == 'wallet' ? el.data.modeDetails.transactionId : el.data.mode.toLowerCase() == 'card' ? el.data.modeDetails.transactionId : undefined,
                      netBankingType: el.data.mode.toLowerCase() == 'netbanking' ? el.data.modeDetails.netBankingType : undefined,
                      UTRNumber: el.data.mode.toLowerCase() == 'netbanking' ? el.data.modeDetails.transactionId : undefined,
                      walletType: el.data.mode.toLowerCase() == 'wallet' ? el.data.modeDetails.walletType : undefined,
                  }
                  o.modeData.data = el.data
                  rrefundtxns.push(o)
              }
            //   await rbankstmts.sort(function(a,b){
            //       return new Date(b.transactionDate) - new Date(a.transactionDate);
            //     });
              await nrbankstmts.sort(function(a,b){
                  return new Date(b.transactionDate) - new Date(a.transactionDate);
                });
              let rbankstmtsPaginated = await Paginator(rbankstmts, reconBankPage, per_page)
              let nrbankstmtsPaginated = await Paginator(nrbankstmts, nonReconBankPage, per_page)
              let reconrefundbankstmts = await Paginator(rrefundbankst, reconRefundBankPage, per_page)
              let result = {
                  "status": "success",
                  data: {
                      id: recondata.reconciliationId,
                      date: recondata.updatedAt,
                      feesAmount: recondata.reconciledAmount,
                      attemptedTransactions: recondata.attemptedFeeLedgers,
                      reconciledTransactions: recondata.reconciledFeeLedgers,
                      reconciledRefundTransactions: 0,
                      refundAmount: 0,
                      percentage: (parseFloat(recondata.reconciledPercent) * 100).toFixed(2),
                      Item: {
                          reconciledTransactionsDetails: { page: rfeeledgersPaginated.page, perPage: rfeeledgersPaginated.perPage, nextPage: rfeeledgersPaginated.nextPage, totalRecord: rfeeledgersPaginated.totalRecord, totalPages: rfeeledgersPaginated.totalPages, data: rfldataa },
                          reconciledBankStmtEntryDetails: rbankstmtsPaginated,
                          nonreconciledTransactionsDetails: { page: nrfeeledgersPaginated.page, perPage: nrfeeledgersPaginated.perPage, nextPage: nrfeeledgersPaginated.nextPage, totalRecord: nrfeeledgersPaginated.totalRecord, totalPages: nrfeeledgersPaginated.totalPages, data: nrfldataa },
                          nonreconciledBankStmtEntryDetails: nrbankstmtsPaginated,
                          reconciledRefundTransactionsDetails: { page: rrefundfeeledgersPaginated.page, perPage: rrefundfeeledgersPaginated.perPage, nextPage: rrefundfeeledgersPaginated.nextPage, totalRecord: rrefundfeeledgersPaginated.totalRecord, totalPages: rrefundfeeledgersPaginated.totalPages, data: rrefundtxns },
                          reconciledRefundBankStmtEntryDetails: reconrefundbankstmts
                      },
                      status: recondata.status
                  }
              }

              res.header("Access-Control-Allow-Origin", "*");
              res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
              res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
              res.send(result)
          }
          else {
              let result = {
                  "status": "success",
                  data: {
                      id: null,
                      date: null,
                      feesAmount: 0.00,
                      attemptedTransactions: 0,
                      reconciledTransactions: 0,
                      reconciledRefundTransactions: 0,
                      refundAmount: 0,
                      percentage: 0,
                      Item: {
                          reconciledTransactionsDetails: { data: [] },
                          reconciledBankStmtEntryDetails: { data: [] },
                          nonreconciledTransactionsDetails: { data: [] },
                          nonreconciledBankStmtEntryDetails: { data: [] },
                          reconciledRefundTransactionsDetails: { data: [] },
                          reconciledRefundBankStmtEntryDetails: { data: [] }
                      },
                      status: null
                  }
              }
              res.header("Access-Control-Allow-Origin", "*");
              res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
              res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
              res.send(result)
          }
      }
      else {
          res.status(500).send({
              status: "failure",
              message: "Organization not found",
          });
      }
  }
  catch (err) {
      res.json({ status: "failure", message: "reconciliation: " + err.message });
  }
  finally {
      dbConnection.close();
  }
};
module.exports.getReconciliationListPreview = async (req, res) => {
  let dbConnection;
  // try {
  // let mapdata = [
  // { bankDescription: "NEFT Shashank C	", transactionsStudentRegId: "1HK17IS070" }
  // ]
  let page = Number(req.query.page);
  let per_page = Number(req.query.limit);
  centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: mongoose.Types.ObjectId(req.query.orgId),
  });
  console.log(orgData);
  if (orgData) {
    dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
    // dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
    let reconciliationListModel = dbConnection.model(
      "reconciliationmanagers",
      reconciliationManagerSchema
    );
    let recondata = await reconciliationListModel.find({});
    let result = [];
    for (let i = 0; i < recondata.length; i++) {
      // rbankstmtsPaginated = await Paginator(rbankstmts, page, per_page)
      result.push({
        id: recondata[i]._doc.reconciliationId,
        date: recondata[i]._doc.updatedAt,
        feesAmount: recondata[i]._doc.reconciledAmount,
        attemptedTransactions: recondata[i]._doc.attemptedTransactions,
        reconciledTransactions: recondata[i]._doc.reconciledTransactions,
        reconciledRefundTransactions:
          recondata[i]._doc.reconciledRefundTransactions.length,
        refundAmount: 0,
        percentage: (parseFloat(recondata[i].reconciledPercent) * 100).toFixed(
          2
        ),
        status: recondata[i].status,
      });
    }
    resultPaginated = await Paginator(result, page, per_page);
    resultPaginated.message = "update";
    fresult = resultPaginated.data;
    // console.log("pp",resultPaginated.page)
    // fresult.page = resultPaginated.page
    // fresult.perPage = resultPaginated.perPage
    // fresult.nextPage = resultPaginated.nextPage
    // fresult.totalRecord = resultPaginated.totalRecord
    // fresult.totalPages = resultPaginated.totalPages
    // fresult.status = "success"
    if (req.query.delete == "yes") {
      await reset(String(orgData._id), orgData.connUri);
    }
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.send(resultPaginated);
    // }
    // catch (err) {
    //     res.json({ status: "failure", message: "reconciliation: " + err.message });
    // }
    // finally {
    //     dbConnection.close();
    // }
  } else {
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  }
};
module.exports.getReconciliationByID = async (req, res) => {
  let dbConnection;
  try {
    dbConnection = await createDatabase(
      req.headers.orgId,
      req.headers.resource
    );
    let reconciliationListModel = dbConnection.model(
      "reconciliationmanagers",
      reconciliationManagerSchema
    );
    let recondata = await reconciliationListModel.findOne({
      reconciliationId: req.query.id,
    });
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.send(recondata);
  } catch (err) {
    res.json({ status: "failure", message: "reconciliation: " + err.message });
  } finally {
    dbConnection.close();
  }
};
module.exports.systemreconciliationOld = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      res.status(400).send({
        status: "failed",
        message: err,
      });
    } else if (err) {
      res.status(400).send({
        status: "failed",
        message: err,
      });
    }
    if (!req.file) {
      res.status(400).send({
        status: "failed",
        message: "Please upload a file ",
      });
    }
    let dbConnection;
    try {
      let input = JSON.parse(req.file.buffer.toString());
      dbConnection = await createDatabase(
        req.headers.orgId,
        req.headers.resource
      );
      let BseModel = dbConnection.model(bseCollectionName, bseSchema);
      let ReconciliationModel = dbConnection.model(
        reconManagerCollectionName,
        reconManagerSchema
      );
      let TransactionsModel = dbConnection.model(
        transactionsCollectionName,
        transactionsSchema
      );
      let banktxnsMappingModel = dbConnection.model(
        bankTxnsMappingCollectionName,
        bankTxnsMappingSchema
      );

      let studentModel = dbConnection.model("students", StudentSchema);
      let reconD = await ReconciliationModel.find({});
      let reconciliationListId = `RCL/2020-21/${
        reconD.length < 9 ? "00" : reconD.length < 99 ? "0" : ""
        }${Number(reconD.length) + 1}`;
      // console.log(reconciliationListId)
      // await BseModel.deleteMany({reconciliationListId:"RCL/2020-21/008"});
      // console.log(sjd)
      let bankstments = await addBankStatements(
        input,
        reconciliationListId,
        dbConnection,
        res
      );
      // console.log(bankstm)
      let params = {
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        reconciliationStatus: { $in: ["initial", "", null, undefined] },
      };
      let transactionsEntries = await TransactionsModel.find(params);
      let attemptedTransactions = transactionsEntries.length;
      // console.log("transactionsEntries: " + transactionsEntries.length);

      let bseParams = {
        reconciled: false,
        creditAmount: { $gt: 0 },
        statementType: "BANK",
      };
      let bsEntries = await getBankStatementEntries(bseParams, dbConnection);
      // console.log("bsEntries: " + bsEntries.length);
      // console.log(bsEntries);

      var transactionsToReconcile = [];
      var transactionsToReconcileDetails = [];
      var bseToReconcile = [];
      var bseToReconcileDetails = [];
      var totalReconciledAmount = 0;

      // 1st pass - reconcile using the mappings
      let bankTxnMappings = await banktxnsMappingModel.find({});
      // console.log("bankTxnMappings: " + bankTxnMappings.length);
      var map = new HashMap();
      for (mapping of bankTxnMappings) {
        // console.log(mapping.bankDescription.toLowerCase().trim() + "' has " + mapping.transactionsStudentRegId.length + " studentRegIds");
        if (mapping.transactionsStudentRegId.length == 1) {
          // console.log("Mapping '" + mapping.bankDescription.toLowerCase().trim() + "' : " + mapping.transactionsStudentRegId[0].trim());
          map.set(
            mapping.bankDescription.toLowerCase().trim(),
            mapping.transactionsStudentRegId[0].trim()
          );
        }
      }

      for (let j = 0; j < bsEntries.length; j++) {
        let bse = bsEntries[j];
        if (bse.creditAmount != null && bse.creditAmount != 0) {
          // console.log("Bank Stmt Entry: Amount " + bse.creditAmount
          //     + " | " + bse.description
          //     + " | chequeNo: " + bse.chequeNo
          //     + " | txnRefNo: " + bse.txnRefNo
          // );

          if (bse.description != null && bse.description.length > 0) {
            let mapMatchStudentRegId = map.get(
              bse.description.toLowerCase().trim()
            );
            if (mapMatchStudentRegId) {
              // console.log("Mapping match: " + bse.description.toLowerCase() + ": mapMatchStudentRegId: " + mapMatchStudentRegId);

              var txnMatch = false;
              var i = 0;
              for (i = 0; i < transactionsEntries.length; i++) {
                if (
                  transactionsEntries[i]["amount"] == bse.creditAmount &&
                  transactionsEntries[i]["studentRegId"] == mapMatchStudentRegId
                ) {
                  txnMatch = true;
                  break;
                }
              } // inner for loop

              if (txnMatch) {
                // console.log("Match: " + bse.description
                //     + ", studentRegId: " + mapMatchStudentRegId
                //     + ", amount: " + bse.creditAmount);
                // console.log(bse);
                // console.log(transactionsEntries[i]);
                transactionsToReconcile.push(transactionsEntries[i]._id);
                transactionsToReconcileDetails.push(transactionsEntries[i]);
                bseToReconcile.push(bse._id);
                bseToReconcileDetails.push(bse);
                totalReconciledAmount += transactionsEntries[i].amount;
                // splice is needed if there are more than one entries for a student with same amount
                // if splice not used, it results in double marking of bankstmtentries
                // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
                transactionsEntries.splice(i, 1);
                bsEntries.splice(j, 1);
                // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
              } else {
                // console.log("NO match: " + bse.description
                //     + ", studentRegId: " + mapMatchStudentRegId
                //     + ", amount: " + bse.creditAmount);
              }
            } // inner if
          } // outer if
        } // if
      } // for
      console.log("--------------------------");
      console.log(
        "END PASS 1 - reconcile using mappings. Matches found: " +
        transactionsToReconcile.length
      );
      console.log("--------------------------");
      // END - 1st pass - reconcile using the mappings

      // return;

      // 2nd pass - reconcile using student name match
      // for (bse of bsEntries)
      for (let j = 0; j < bsEntries.length; j++) {
        let bse = bsEntries[j];
        if (bse.creditAmount != null && bse.creditAmount != 0) {
          // console.log("Bank Stmt Entry: Amount " + bse.creditAmount
          //     + " | " + bse.description
          //     + " | chequeNo: " + bse.chequeNo
          //     + " | txnRefNo: " + bse.txnRefNo
          // );

          let amountMatches = 0;
          let studentMatch = false;
          var i = 0;
          for (i = 0; i < transactionsEntries.length; i++) {
            if (transactionsEntries[i]["amount"] == bse.creditAmount) {
              amountMatches++;
              var studentNamePatternMatch;
              var patternMatchRatio;
              if (bse.description != null && bse.description.length > 0) {
                var description = bse.description;
                if (
                  bse.description.toUpperCase().startsWith("NEFT ") ||
                  bse.description.toUpperCase().startsWith("NEFT-")
                ) {
                  description = bse.description.substring(5).trim();
                }
                studentNamePatternMatch = longestSubstring(
                  description,
                  transactionsEntries[i].studentName
                );
                // console.log("matching: " + description);
                if (studentNamePatternMatch != null) {
                  patternMatchRatio =
                    studentNamePatternMatch.length / description.length;
                }
              }
              if (patternMatchRatio > highPatternMatchRatio) {
                studentMatch = true;
                break;
              } else if (patternMatchRatio > lowPatternMatchRatio) {
                // console.log("Low probability student match: ");
                // console.log(bse);
                // console.log(transactionsEntries[i]);
              }
              // console.log("Amount: " + bse.creditAmount + " | Student: " + transactionsEntries[i].studentName
              //     + " | studentNamePatternMatch: " + studentNamePatternMatch + " (" + patternMatchRatio * 100 + " %)");
            }
          } // inner for loop
          if (studentMatch) {
            // console.log("HIGH probability student match: ");
            // console.log(bse);
            // console.log(transactionsEntries[i]);
            transactionsToReconcile.push(transactionsEntries[i]._id);
            transactionsToReconcileDetails.push(transactionsEntries[i]);
            bseToReconcile.push(bse._id);
            bseToReconcileDetails.push(bse);
            totalReconciledAmount += transactionsEntries[i].amount;
            // splice is needed if there are more than one entries for a student with same amount
            // if splice not used, it results in double marking of bankstmtentries
            // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
            transactionsEntries.splice(i, 1);
            bsEntries.splice(j, 1);
            // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
          }
          console.log("Amount matches: " + amountMatches);
          console.log(
            "--------------------------------------------------------------------"
          );
        } // if
      } // for
      console.log(
        "reconcileWithBankStmt: Attempting reconciliation for " +
        transactionsToReconcile.length +
        " entries in reconciliationtransactions" +
        ", and " +
        bseToReconcile.length +
        " entries in the bank statement."
      );

      var nonReconciledTransactionsIds = [];
      for (fle of transactionsEntries) {
        nonReconciledTransactionsIds.push(fle._id);
      }
      console.log(
        "nonReconciledTransactionsIds: " + nonReconciledTransactionsIds.length
      );

      var nonReconciledBankStmtIds = [];
      for (bse of bsEntries) {
        nonReconciledBankStmtIds.push(bse._id);
      }
      console.log(
        "nonReconciledBankStmtIds: " + nonReconciledBankStmtIds.length
      );
      await TransactionsModel.updateMany(
        { _id: { $in: transactionsToReconcile } },
        { reconciliationStatus: "softwarereconciled", softwareReconciled: true }
      );
      await BseModel.updateMany(
        { _id: { $in: bseToReconcile } },
        {
          reconciled: true,
          reconciliationMethod: "softwarereconciled",
          softwareReconciled: true,
        }
      );

      // now set the non-reconciled ones ..
      await TransactionsModel.updateMany(
        { _id: { $in: nonReconciledTransactionsIds } },
        { reconciliationStatus: "nonreconciled", softwareReconciled: false }
      );
      console.log("refund reconciliation start");
      let refundRecon = await refundTransaction(dbConnection, res);
      // console.log("refund reconciliation done", refundRecon)
      // let reconciledPercent = transactionsToReconcile.length / attemptedTransactions;
      let reconciledPercent;
      let reconciledTrans =
        transactionsToReconcile.length +
        Number(refundRecon.numberOfRenconciledTransactions);
      if (Number(reconciledTrans) == 0 && Number(attemptedTransactions) == 0) {
        reconciledPercent = 0;
      } else {
        reconciledPercent =
          Number(reconciledTrans) / Number(attemptedTransactions);
      }
      var status = "Partial";
      if (reconciledPercent == 1) {
        status = "Full";
      } else if (isNaN(reconciledPercent)) {
        reconciledPercent = 0;
      }
      if (isNaN(reconciledTrans)) {
        reconciledTrans = 0;
      }
      await transactionsEntries.concat(
        refundRecon.nonreconciledRefundTransactionDetails
      );
      await bsEntries.concat(
        refundRecon.nonreconciledRefundBankStatementEntries
      );
      let reconData = {
        reconciliationId: reconciliationListId,
        attemptedTransactions: attemptedTransactions,
        reconciledTransactions: reconciledTrans,
        reconciledTransactionsDetails: transactionsToReconcileDetails,
        reconciledBankStmtEntryDetails: bseToReconcileDetails,
        reconciledAmount: totalReconciledAmount,
        reconciledPercent: reconciledPercent,
        nonreconciledTransactionsDetails: transactionsEntries,
        nonreconciledBankStmtEntryDetails: bsEntries,
        reconciledRefundTransactions: refundRecon.reconciledRefundTransactions,
        reconciledRefundBankStmtEntryDetails:
          refundRecon.reconciledRefundBankStmtEntryDetails,
        status: status,
      };
      let reconModel = new ReconciliationModel(reconData);
      await reconModel.save();

      let reconddata = await postReconciliationList(
        dbConnection,
        reconciliationListId
      );
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.send({
        status: "success",
        message: "System Reconciliation Done",
        data: reconddata,
      });
    } catch (err) {
      res.json({
        status: "failure",
        message: "reconciliation: " + err.message,
      });
    } finally {
      dbConnection.close();
    }
  });
};
module.exports.systemreconciliation = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      res.status(400).send({
        status: "failed",
        message: err
      })
    } else if (err) {
      res.status(400).send({
        status: "failed",
        message: err
      })
    }
    if (!req.file) {
      res.status(400).send({
        status: "failed",
        message: "Please upload a file "
      })
    }
    let dbConnection
    let centralDbConnection
    try {
      centralDbConnection = await createDatabase(
        `usermanagement-${process.env.stage}`,
        process.env.central_mongoDbUrl
      );
      const orgListModel = centralDbConnection.model(
        "orglists",
        orgListSchema,
        "orglists"
      );
      // let orgdata = new orgListModel({
      //     _id: mongoose.Types.ObjectId(req.query.orgId),
      //     "loginClient": "zenqore",
      //     "name": "HKBK",
      //     "user": "fc.admin.hkbk@zenqore.com",
      //     "connUri": "mongodb+srv://admin:R6BbEn8UUJjoeDQq@mongo-cluster.orkv6.mongodb.net",
      //     "nameSpace": "hkbk"
      // })
      // await orgdata.save();
      const orgData = await orgListModel.findOne({
        _id: mongoose.Types.ObjectId(req.query.orgId),
      });
      if (orgData) {
        dbConnection = await createDatabase(
          String(orgData._id),
          orgData.connUri
        );
        let input = JSON.parse(req.file.buffer.toString());
        // dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
        let BseModel = dbConnection.model(bseCollectionName, bseSchema);
        let ReconciliationModel = dbConnection.model(reconManagerCollectionName, reconManagerSchema);
        let TransactionsModel = dbConnection.model(transactionsCollectionName, transactionsSchema);
        let banktxnsMappingModel = dbConnection.model(bankTxnsMappingCollectionName, bankTxnsMappingSchema);
        let studentModel = dbConnection.model("students", StudentSchema);
        let reconD = await ReconciliationModel.find({})
        const credentials = mongoose.Schema({}, { strict: false });
        // const msettingModel = dbConnectionp.model("settings", credentials, "settings")
        const credentialsModel = dbConnection.model(
          "credentials",
          credentials,
          "credentials"
        );
        const credentialData = await credentialsModel.findOne({
          type: "payment",
        });
        var username = credentialData._doc.userName;
        var password = credentialData._doc.password;
        var auth =
          "Basic " +
          Buffer.from(username + ":" + password).toString("base64");
        let reconciliationListId = `RCL/2020-21/${reconD.length < 9 ? "00" : reconD.length < 99 ? "0" : ""
          }${Number(reconD.length) + 1}`
        console.log(reconciliationListId)
        // await BseModel.deleteMany({reconciliationListId:"RCL/2020-21/008"});
        // console.log(sjd)
        let bankstments = await addBankStatements(input, reconciliationListId, dbConnection, res)
        // console.log(bankstm)
        let params
        if (input.bank.toLowerCase() == "razorpay") {
          params =
            {
              transactionType: "eduFees",
              transactionSubType: "feePayment",
              "data.mode": "razorpay",
              reconciliationStatus: { $in: ["initial", "nonreconciled","Non-Reconciled", "", null, undefined] }
            };
        } else {
          params =
            {
              transactionType: "eduFees",
              transactionSubType: "feePayment",
              "data.mode": { "$ne": "razorpay" },
              reconciliationStatus: { $in: ["initial", "nonreconciled","Non-Reconciled", "", null, undefined] }
            };
        }

        let transactionsEntries = await TransactionsModel.find(params);
        let attemptedTransactions = transactionsEntries.length;
        // console.log("transactionsEntries: " + transactionsEntries.length);

        let bseParams =
        {
          reconciled: false,
          creditAmount: { $gt: 0 },
          statementType: "BANK",
          reconciliationListId: reconciliationListId
        };
        let bsEntries = await getBankStatementEntries(bseParams, dbConnection);
        // console.log("bsEntries: " + bsEntries.length);
        // console.log(bsEntries); 

        var transactionsToReconcile = [];
        var transactionsToReconcileDetails = [];
        var bseToReconcile = [];
        var bseToReconcileDetails = [];
        var totalReconciledAmount = 0;

        // 1st pass - reconcile using the mappings 
        let bankTxnMappings = await banktxnsMappingModel.find({});
        // console.log("bankTxnMappings: " + bankTxnMappings.length);
        var map = new HashMap();
        for (mapping of bankTxnMappings) {
          // console.log(mapping.bankDescription.toLowerCase().trim() + "' has " + mapping.transactionsStudentRegId.length + " studentRegIds");
          if (mapping.transactionsStudentRegId.length == 1) {
            // console.log("Mapping '" + mapping.bankDescription.toLowerCase().trim() + "' : " + mapping.transactionsStudentRegId[0].trim());
            map.set(mapping.bankDescription.toLowerCase().trim(), mapping.transactionsStudentRegId[0].trim());
          }
        }

        for (let j = 0; j < bsEntries.length; j++) {
          let bse = bsEntries[j];
          if (bse.creditAmount != null && bse.creditAmount != 0) {
            // console.log("Bank Stmt Entry: Amount " + bse.creditAmount
            //     + " | " + bse.description
            //     + " | chequeNo: " + bse.chequeNo
            //     + " | txnRefNo: " + bse.txnRefNo
            // );

            if (bse.description != null && bse.description.length > 0) {
              let mapMatchStudentRegId = map.get(bse.description.toLowerCase().trim());
              if (mapMatchStudentRegId) {
                // console.log("Mapping match: " + bse.description.toLowerCase() + ": mapMatchStudentRegId: " + mapMatchStudentRegId);

                var txnMatch = false;
                var i = 0;
                for (i = 0; i < transactionsEntries.length; i++) {
                  if (transactionsEntries[i]["amount"] == bse.creditAmount
                    && transactionsEntries[i]["studentRegId"] == mapMatchStudentRegId) {
                    txnMatch = true;
                    break;
                  }
                } // inner for loop 

                if (txnMatch) {
                  // console.log("Match: " + bse.description
                  //     + ", studentRegId: " + mapMatchStudentRegId
                  //     + ", amount: " + bse.creditAmount);
                  // console.log(bse);
                  // console.log(transactionsEntries[i]);
                  transactionsToReconcile.push(transactionsEntries[i]._id);
                  transactionsToReconcileDetails.push(transactionsEntries[i]);
                  bseToReconcile.push(bse._id);
                  bseToReconcileDetails.push(bse);
                  totalReconciledAmount += transactionsEntries[i].amount;
                  // splice is needed if there are more than one entries for a student with same amount 
                  // if splice not used, it results in double marking of bankstmtentries
                  // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length); 
                  transactionsEntries.splice(i, 1);
                  bsEntries.splice(j, 1);
                  // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
                } else {
                  // console.log("NO match: " + bse.description
                  //     + ", studentRegId: " + mapMatchStudentRegId
                  //     + ", amount: " + bse.creditAmount);
                }
              } // inner if 
            } // outer if 
          } // if 
        } // for 
        console.log("--------------------------");
        console.log("END PASS 1 - reconcile using mappings. Matches found: " + transactionsToReconcile.length);
        console.log("--------------------------");
        // END - 1st pass - reconcile using the mappings 

        // return; 

        // 2nd pass - reconcile using student name match 
        // for (bse of bsEntries) 
        let trids = [];
        for (let j = 0; j < bsEntries.length; j++) {
          let bse = bsEntries[j];
          if (bse.creditAmount != null && bse.creditAmount != 0) {
            // console.log("Bank Stmt Entry: Amount " + bse.creditAmount
            //     + " | " + bse.description
            //     + " | chequeNo: " + bse.chequeNo
            //     + " | txnRefNo: " + bse.txnRefNo
            // );

            let amountMatches = 0;
            var studentMatch = false;
            var parentMatch = false;
            var studentNamePatternMatch;
            var parentNamePatternMatch;
            var patternMatchRatio;
            let usnmatch
            let trReferenceMatch;
            let razorpaymatch;
            let parentPatternMatchRatio
            var i = 0;
            for (i = 0; i < transactionsEntries.length; i++) {
              transactionsEntries[i].reconciliationStatus = "Non-Reconciled";
              if (transactionsEntries[i]["amount"] == bse.creditAmount) {
                amountMatches++;
                if (bse.description != null && bse.description.length > 0) {
                  if (input.bank.toLowerCase() == "razorpay" && transactionsEntries[i]._doc.paymentTransactionId !== bse.txnRefNo) {
                    var options = {
                      method: "GET",
                      uri: "https://api.razorpay.com/v1/payments/" + bse.txnRefNo,
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: auth,
                      },
                    };
                    if(bse.txnRefNo.includes("pay_")){
                        let success = await rq(options);
                        let rs = JSON.parse(success);
                        let rrn = rs.acquirer_data.rrn? rs.acquirer_data.rrn: rs.acquirer_data.auth_code
                        if (transactionsEntries[i]._doc.paymentTransactionId == rrn) {
                          razorpaymatch = true
                        }
                    }
                  }
                  if (input.bank.toLowerCase() == "razorpay" && transactionsEntries[i]._doc.paymentTransactionId == bse.txnRefNo) {
                    parentPatternMatchRatio = -1
                    razorpaymatch = true
                  }
                  if (input.bank.toLowerCase() !== "razorpay") {
                    var description = bse.description;
                    var trreference = bse.txnRefNo ? bse.txnRefNo : "-";
                    if (bse.description.toUpperCase().startsWith("NEFT ")
                      || bse.description.toUpperCase().startsWith("NEFT-")) {
                      description = bse.description.substring(5).trim();
                    }
                    usnmatch = description.toLowerCase().includes(transactionsEntries[i]._doc.studentRegId.toLowerCase())
                    trReferenceMatch = trreference.includes(transactionsEntries[i]._doc.paymentTransactionId)
                    studentNamePatternMatch = longestSubstring(description, transactionsEntries[i].studentName);
                    if (studentNamePatternMatch != null) {
                      patternMatchRatio = studentNamePatternMatch.length / description.length;
                    }
                    parentNamePatternMatch = await longestSubstring(description, transactionsEntries[i].parentName);

                    // console.log("matching parentName: " + transactionsEntries[i].parentName + ", desc: " + description); 
                    if (parentNamePatternMatch != null) {
                      console.log("matching: ", description, "match", parentNamePatternMatch, parentNamePatternMatch.length / description.length);
                      parentPatternMatchRatio = parentNamePatternMatch.length / description.length;
                    }
                  }
                }
                if (patternMatchRatio > highPatternMatchRatio) {
                  studentMatch = true;
                  break;
                } else if (parentPatternMatchRatio > highPatternMatchRatio) {
                  // console.log("parentName match found"); 
                  parentMatch = true;
                  break;
                }
                else if (usnmatch) {
                  parentMatch = true;
                  break;
                }
                else if (trReferenceMatch) {
                  parentMatch = true;
                  break;
                }
                else if (razorpaymatch) {
                  parentMatch = true;
                  break;
                }
                else if (patternMatchRatio > lowPatternMatchRatio) {
                  // console.log("Low probability student match: ");
                  // console.log(bse);
                  // console.log(transactionsEntries[i].studentName 
                  //     + ", amount: " + transactionsEntries[i].amount);
                }
                console.log(studentMatch, parentMatch)
                // console.log("Amount: " + bse.creditAmount + " | Student: " + transactionsEntries[i].studentName
                //     + " | studentNamePatternMatch: " + studentNamePatternMatch + " (" + patternMatchRatio * 100 + " %)");
              }
            } // inner for loop 
            if (studentMatch || parentMatch) {
              transactionsEntries[i].reconciliationStatus = "Reconciled"
              if (studentMatch) {
                console.log("HIGH probability Student match: ");
              } else {
                console.log("HIGH probability Parent match: ");
              }
              if (transactionsEntries[i].data.mode.toLowerCase() == "cheque") {
                await editChequeDetails(req.headers.orgId, transactionsEntries[i].data.modeDetails.transactionId, "Reconciled")
              }
              // console.log(bse);
              // console.log(transactionsEntries[i]);
              transactionsToReconcile.push(transactionsEntries[i]._id);
              transactionsToReconcileDetails.push(transactionsEntries[i]);
              bseToReconcile.push(bse._id);
              bseToReconcileDetails.push(bse);
              totalReconciledAmount += transactionsEntries[i].amount;
              // splice is needed if there are more than one entries for a student with same amount 
              // if splice not used, it results in double marking of bankstmtentries
              // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
              transactionsEntries.splice(i, 1);
              bsEntries.splice(j, 1);
              // The following line is not needed.  It introduces a bug.  The only splice needed is for transactionsEntries
              // bsEntries.splice(j, 1); // pls leave this line commented.  Uncommented is a bug!! 
              // console.log("transactionsEntries: " + transactionsEntries.length + ", bsEntries: " + bsEntries.length);
            }
            // console.log("Amount matches: " + amountMatches);
            // console.log("--------------------------------------------------------------------");
          } // if 
        } // for 
        // console.log("reconcileWithBankStmt: Attempting reconciliation for "
        //     + transactionsToReconcile.length + " entries in reconciliationtransactions"
        //     + ", and " + bseToReconcile.length + " entries in the bank statement.");

        var nonReconciledTransactionsIds = [];
        for (fle of transactionsEntries) {
          nonReconciledTransactionsIds.push(fle._id);
        }
        // console.log("nonReconciledTransactionsIds: " + nonReconciledTransactionsIds.length);
        var nonReconciledBankStmtIds = [];

        for (bse of bsEntries) {
          nonReconciledBankStmtIds.push(bse._id);
        }
        // console.log("nonReconciledBankStmtIds: " + nonReconciledBankStmtIds.length);
        await TransactionsModel.updateMany(
          { _id: { $in: transactionsToReconcile } },
          { reconciliationStatus: "softwarereconciled", softwareReconciled: true }
        );
        await BseModel.updateMany(
          { _id: { $in: bseToReconcile } },
          {
            reconciled: true,
            reconciliationMethod: "softwarereconciled",
            softwareReconciled: true
          }
        );

        // now set the non-reconciled ones .. 
        await TransactionsModel.updateMany(
          { _id: { $in: nonReconciledTransactionsIds } },
          { reconciliationStatus: "nonreconciled", softwareReconciled: false }
        );
        // console.log("refund reconciliation start")
        let refundRecon = await refundTransaction(dbConnection, res);
        console.log("refund done")
        // console.log("refund reconciliation done", refundRecon)
        // let reconciledPercent = transactionsToReconcile.length / attemptedTransactions;
        let reconciledPercent
        let reconciledTrans = transactionsToReconcile.length + Number(refundRecon.numberOfRenconciledTransactions)
        if (Number(reconciledTrans) == 0 && Number(attemptedTransactions) == 0) {
          reconciledPercent = 0
        } else {
          reconciledPercent = Number(reconciledTrans) / Number(attemptedTransactions);
        }
        var status = "Partial";
        if (reconciledPercent == 1) {
          status = "Full";
        }
        else if (isNaN(reconciledPercent)) {
          reconciledPercent = 0
        }
        if (isNaN(reconciledTrans)) {
          reconciledTrans = 0
        }
        await transactionsEntries.concat(refundRecon.nonreconciledRefundTransactionDetails)
        await bsEntries.concat(refundRecon.nonreconciledRefundBankStatementEntries)
        console.log("entries updated")
        let reconData = {
          reconciliationId: reconciliationListId,
          attemptedTransactions: attemptedTransactions,
          reconciledTransactions: reconciledTrans,
          reconciledTransactionsDetails: transactionsToReconcileDetails,
          reconciledBankStmtEntryDetails: bseToReconcileDetails,
          reconciledAmount: totalReconciledAmount,
          reconciledPercent: reconciledPercent,
          nonreconciledTransactionsDetails: transactionsEntries,
          nonreconciledBankStmtEntryDetails: bsEntries,
          reconciledRefundTransactions: refundRecon.reconciledRefundTransactions,
          reconciledRefundBankStmtEntryDetails: refundRecon.reconciledRefundBankStmtEntryDetails,
          status: status
        };
        let reconModel = new ReconciliationModel(reconData);
        await reconModel.save();
        console.log("recon saved")
        let reconddata = await postReconciliationList(dbConnection, reconciliationListId)
        reconddata.trids = trids
        reconddata.bankentries= bsEntries, 
        reconddata.trentr = transactionsEntries
        console.log("setting response")
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        res.send(reconddata)
      }
      else {
        res.status(500).send({
          status: "failure",
          message: "Organization not found",
        });
      }
    }
    catch (err) {
      res.status(500).send(err.stack);
    }
    finally {
      dbConnection.close();
      centralDbConnection.close()
    }
  })
};
module.exports.systemreconciliationPOS = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      res.status(400).send({
        status: "failed",
        message: err,
      });
    } else if (err) {
      res.status(400).send({
        status: "failed",
        message: err,
      });
    }
    if (!req.file) {
      res.status(400).send({
        status: "failed",
        message: "Please upload a file ",
      });
    }
    let dbConnection;
    // try {
    let input = JSON.parse(req.file.buffer.toString());
    dbConnection = await createDatabase(
      req.headers.orgId,
      req.headers.resource
    );
    let BseModel = dbConnection.model(bseCollectionName, bseSchema);
    let ReconciliationModel = dbConnection.model(
      reconManagerCollectionName,
      reconManagerSchema
    );
    let TransactionsModel = dbConnection.model(
      transactionsCollectionName,
      transactionsSchema
    );
    let studentModel = dbConnection.model("students", StudentSchema);
    let reconD = await ReconciliationModel.find({});
    let reconciliationListId = `RCL/2020-21/${
      reconD.length < 9 ? "00" : reconD.length < 99 ? "0" : ""
      }${Number(reconD.length) + 1}`;
    // console.log(reconciliationListId)
    // await BseModel.deleteMany({reconciliationListId:"RCL/2020-21/008"});
    // console.log(sjd)
    let bankstments = await addPOSStatements(
      input,
      reconciliationListId,
      dbConnection,
      res
    );
    // console.log("bank statements added")
    // console.log(dsdsd)
    let params = {
      transactionType: "eduFees",
      transactionSubType: "feePayment",
      reconciliationStatus: { $in: ["initial", "", null, undefined] },
    };
    let transactionsEntries = await TransactionsModel.find(params);
    let attemptedTransactions = transactionsEntries.length;
    // console.log(transactionsEntries);

    // console.log("transactionsEntries: " + transactionsEntries.length);

    let bseParams = {
      reconciled: false,
      creditAmount: {
        $gt: 0,
      },
      statementType: "POS",
    };
    let bsEntries = await getBankStatementEntries(bseParams, dbConnection);
    // console.log("bsEntries: " + bsEntries.length);
    // console.log(bsEntries);

    var transactionsToReconcile = [];
    var transactionsToReconcileDetails = [];
    var bseToReconcile = [];
    var bseToReconcileDetails = [];
    var totalReconciledAmount = 0;
    // for (bse of bsEntries)
    for (let j = 0; j < bsEntries.length; j++) {
      let bse = bsEntries[j];
      if (bse.creditAmount != null && bse.creditAmount != 0) {
        // console.log("Bank Stmt Entry: Amount " + bse.creditAmount
        //     + " | " + bse.description
        //     + " | chequeNo: " + bse.chequeNo
        //     + " | txnRefNo: " + bse.txnRefNo
        // );

        let amountMatches = 0;
        let studentMatch = false;
        for (let i = 0; i < transactionsEntries.length; i++) {
          if (transactionsEntries[i]["amount"] == bse.creditAmount) {
            let stdata = await studentModel.findOne({
              _id: transactionsEntries[i].studentId,
            });
            let parentName = stdata._doc.parentName;
            amountMatches++;
            var studentNamePatternMatch;
            var patternMatchRatio;
            // transactionsEntries[i]["paymentRefId"].toString()==bse.approvalCode.toString()
            if (
              transactionsEntries[i]["paymentRefId"].toString() ===
              bse.approvalCode.toString()
            ) {
              studentMatch = true;
              // console.log("HIGH probability student match: ");
              // console.log(bse);
              // console.log(transactionsEntries[i]);
              transactionsToReconcile.push(transactionsEntries[i]._id);
              transactionsToReconcileDetails.push(transactionsEntries[i]);
              bseToReconcile.push(bse._id);
              bseToReconcileDetails.push(bse);
              totalReconciledAmount += transactionsEntries[i].amount;
              // splice is needed if there are more than one entries for a student with same amount
              // if splice not used, it results in double marking of bankstmtentries
              transactionsEntries.splice(i, 1);
              bsEntries.splice(j, 1);
            } else if (
              transactionsEntries[i]["paymentRefId"].toString() !==
              bse.approvalCode.toString()
            ) {
              // console.log("Low probability student match: ");
              // console.log(bse);
              // console.log(transactionsEntries[i]);
            }
            // console.log("Amount: " + bse.creditAmount + " | Student: " + transactionsEntries[i].studentName
            //     + " | studentNamePatternMatch: " + studentNamePatternMatch + " (" + patternMatchRatio * 100 + " %)");
          }
        }
        // console.log("Amount matches: " + amountMatches);
        // console.log("--------------------------------------------------------------------");
      } // if
    } // for
    // console.log("reconcileWithBankStmt: Attempting reconciliation for "
    //     + transactionsToReconcile.length + " entries in reconciliationtransactions"
    //     + ", and " + bseToReconcile.length + " entries in the bank statement.");

    var nonReconciledTransactionsIds = [];
    for (fle of transactionsEntries) {
      nonReconciledTransactionsIds.push(fle._id);
    }
    // console.log("nonReconciledTransactionsIds: " + nonReconciledTransactionsIds.length);

    var nonReconciledBankStmtIds = [];
    for (bse of bsEntries) {
      nonReconciledBankStmtIds.push(bse._id);
    }
    // console.log("nonReconciledBankStmtIds: " + nonReconciledBankStmtIds.length);
    await TransactionsModel.updateMany(
      { _id: { $in: transactionsToReconcile } },
      { reconciliationStatus: "softwarereconciled", softwareReconciled: true }
    );
    await BseModel.updateMany(
      { _id: { $in: bseToReconcile } },
      {
        reconciled: true,
        reconciliationMethod: "softwarereconciled",
        softwareReconciled: true,
      }
    );

    // now set the non-reconciled ones ..
    await TransactionsModel.updateMany(
      { _id: { $in: nonReconciledTransactionsIds } },
      { reconciliationStatus: "nonreconciled", softwareReconciled: false }
    );
    // console.log("refund reconciliation start")
    let refundRecon = await refundTransaction(dbConnection, res);
    // console.log("refund reconciliation done", refundRecon)
    // let reconciledPercent = transactionsToReconcile.length / attemptedTransactions;
    let reconciledPercent;
    let reconciledTrans =
      transactionsToReconcile.length +
      Number(refundRecon.numberOfRenconciledTransactions);
    if (Number(reconciledTrans) == 0 && Number(attemptedTransactions) == 0) {
      reconciledPercent = 0;
    } else {
      reconciledPercent =
        Number(reconciledTrans) / Number(attemptedTransactions);
    }
    var status = "Partial";
    if (reconciledPercent == 1) {
      status = "Full";
    } else if (isNaN(reconciledPercent)) {
      reconciledPercent = 0;
    }
    if (isNaN(reconciledTrans)) {
      reconciledTrans = 0;
    }
    await transactionsEntries.concat(
      refundRecon.nonreconciledRefundTransactionDetails
    );
    await bsEntries.concat(refundRecon.nonreconciledRefundBankStatementEntries);
    let reconData = {
      reconciliationId: reconciliationListId,
      attemptedTransactions: attemptedTransactions,
      reconciledTransactions: reconciledTrans,
      reconciledTransactionsDetails: transactionsToReconcileDetails,
      reconciledBankStmtEntryDetails: bseToReconcileDetails,
      reconciledAmount: totalReconciledAmount,
      reconciledPercent: reconciledPercent,
      nonreconciledTransactionsDetails: transactionsEntries,
      nonreconciledBankStmtEntryDetails: bsEntries,
      reconciledRefundTransactions: refundRecon.reconciledRefundTransactions,
      reconciledRefundBankStmtEntryDetails:
        refundRecon.reconciledRefundBankStmtEntryDetails,
      status: status,
    };
    let reconModel = new ReconciliationModel(reconData);
    await reconModel.save();

    let reconddata = await postReconciliationList(
      dbConnection,
      reconciliationListId
    );
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.send({
      status: "success",
      message: "System Reconciliation Done",
      data: reconddata,
    });
    // }
    // catch (err) {
    //     res.json({ status: "failure", message: "reconciliation: " + err.message });
    // }
    // finally {
    //     dbConnection.close();
    // }
  });
};
module.exports.manualreconciliation = async (req, res) => {
  let dbConnection;
  let centralDbConnection;
  try {
    centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({
      _id: mongoose.Types.ObjectId(req.query.orgId),
    });
    if (orgData) {
      dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
      let FeeLedgerModel = dbConnection.model(
        feeLedgerCollectionName,
        feeLedgerSchema
      );
      let transactionModel = dbConnection.model(
        "transactions",
        transactionSchema
      );
      let ReconciliationModel = dbConnection.model(
        reconManagerCollectionName,
        reconManagerSchema
      );
      let BseModel = dbConnection.model(bseCollectionName, bseSchema);
      let reconD = await ReconciliationModel.findOne({
        reconciliationId: req.body.transaction[0].reconciliationId,
      });
      let rbnkstmtfind = await reconD.reconciledBankStmtEntryDetails.find(
        (item) =>
          item._id.toString() == req.body.bankStatement[0]._id.toString()
      );
      let rtrxnfind = await reconD.reconciledTransactionsDetails.find(
        (item) => item._id.toString() == req.body.transaction[0]._id.toString()
      );
      let nrtrxnfind = await reconD.nonreconciledTransactionsDetails.find(
        (item) => item._id.toString() == req.body.transaction[0]._id.toString()
      );
      nrtrxnfind.reconciliationStatus = "Reconciled"
      let banktxnsMappingModel = dbConnection.model(
        bankTxnsMappingCollectionName,
        bankTxnsMappingSchema
      );
      if (
        Number(req.body.transaction[0].amount) ===
        Number(req.body.bankStatement[0].creditAmount) &&
        req.body.transaction[0].transactionSubType == "feePayment"
      ) {
        if (!rbnkstmtfind && !rtrxnfind) {
          console.log("dsfds");
          let bankstmtmappings = await banktxnsMappingModel.find({});
          let existbankdescr = await bankstmtmappings.find(
            (item) =>
              item._doc.bankDescription.toLowerCase() ==
              req.body.bankStatement[0].description.toLowerCase()
          );
          console.log("existbankdescr", existbankdescr);
          if (existbankdescr) {
            await banktxnsMappingModel.updateOne(
              { _id: existbankdescr._id },
              {
                $push: {
                  transactionsStudentRegId:
                    req.body.transaction[0].studentRegId,
                },
              }
            );
          } else {
            let mapData = {
              bankDescription:
                req.body.bankStatement[0].description.toLowerCase(),
              transactionsStudentRegId: [req.body.transaction[0].studentRegId],
            };
            let newMap = new banktxnsMappingModel(mapData);
            await newMap.save();
          }
          await transactionModel.updateOne(
            { _id: mongoose.Types.ObjectId(req.body.transaction[0]._id) },
            { $set: { reconciliationStatus: "reconciled" } }
          );
          if (req.body.transaction[0].mode.toLowerCase() == "cheque") {
            await editChequeDetails(
              req.headers.orgId,
              req.body.transaction[0].modeData.ChequeNumber,
              "Reconciled"
            );
          }
          await BseModel.updateOne(
            { _id: mongoose.Types.ObjectId(req.body.bankStatement[0]._id) },
            { reconciled: true, reconciliationMethod: "reconciled" }
          );
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            {
              $pull: {
                nonreconciledTransactionsDetails: {
                  _id: mongoose.Types.ObjectId(req.body.transaction[0]._id),
                },
              },
            }
          );
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            {
              $pull: {
                nonreconciledBankStmtEntryDetails: {
                  _id: mongoose.Types.ObjectId(req.body.bankStatement[0]._id),
                },
              },
            }
          );
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            { $push: { reconciledTransactionsDetails: nrtrxnfind } }
          );
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            {
              $push: {
                reconciledBankStmtEntryDetails: req.body.bankStatement[0],
              },
            }
          );
          let reconpercent = (Number(reconD._doc.reconciledTransactions)+ 1) / Number(reconD._doc.attemptedTransactions)
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            {
              $set: {
                reconciledTransactions:
                  Number(reconD.reconciledTransactions) + 1,
                reconciledPercent: reconpercent,
                reconciledAmount:
                  Number(reconD._doc.reconciledAmount) +
                  Number(req.body.transaction[0].amount),
              },
            }
          );
          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Access-Control-Allow-Methods",
            "GET,HEAD,OPTIONS,POST,PUT"
          );
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
          );
          res.send({
            status: "success",
            message: "Manual Reconciliation Done",
            data: "reconcileData",
          });
        } else {
          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Access-Control-Allow-Methods",
            "GET,HEAD,OPTIONS,POST,PUT"
          );
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
          );
          res.send({
            status: "success",
            message: "Already Reconciliation Done",
            data: "reconcileData",
          });
        }
      } else if (
        Number(req.body.transaction[0].amount) ===
        Number(req.body.bankStatement[0].debitAmount) &&
        req.body.transaction[0].transactionSubType == "refund"
      ) {
        if (!rbnkstmtfind && !rtrxnfind) {
          let bankstmtmappings = await banktxnsMappingModel.find({});
          let existbankdescr = await bankstmtmappings.find(
            (item) =>
              item._doc.bankDescription.toLowerCase() ==
              req.body.bankStatement[0].description.toLowerCase()
          );
          if (existbankdescr) {
            await banktxnsMappingModel.updateOne(
              { _id: existbankdescr._id },
              {
                $push: {
                  transactionsStudentRegId:
                    req.body.transaction[0].studentRegId,
                },
              }
            );
          } else {
            let mapData = {
              bankDescription:
                req.body.bankStatement[0].description.toLowerCase(),
              transactionsStudentRegId: [req.body.transaction[0].studentRegId],
            };
            let newMap = new banktxnsMappingModel(mapData);
            await newMap.save();
          }
          await transactionModel.updateOne(
            { _id: mongoose.Types.ObjectId(req.body.transaction[0]._id) },
            { $set: { reconciliationStatus: "reconciled" } }
          );
          await BseModel.updateOne(
            { _id: mongoose.Types.ObjectId(req.body.bankStatement[0]._id) },
            { reconciled: true, reconciliationMethod: "reconciled" }
          );
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            {
              $pull: {
                nonreconciledTransactionsDetails: {
                  _id: mongoose.Types.ObjectId(req.body.transaction[0]._id),
                },
              },
            }
          );
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            {
              $pull: {
                nonreconciledBankStmtEntryDetails: {
                  _id: mongoose.Types.ObjectId(req.body.bankStatement[0]._id),
                },
              },
            }
          );
          // await ReconciliationModel.updateOne({ reconciliationId: req.body.transaction[0].reconciliationId }, { $push: { reconciledTransactionsDetails: nrtrxnfind } })
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            {
              $push: {
                reconciledBankStmtEntryDetails: req.body.bankStatement[0],
              },
            }
          );
          let reconpercent = (Number(reconD._doc.reconciledTransactions)+ 1) / Number(reconD._doc.attemptedTransactions)
          await ReconciliationModel.updateOne(
            { reconciliationId: req.body.transaction[0].reconciliationId },
            {
              $set: {
                reconciledTransactions:
                  Number(reconD.reconciledTransactions) + 1,
                reconciledPercent: reconpercent,
                reconciledAmount:
                  Number(reconD._doc.reconciledAmount) +
                  Number(req.body.transaction[0].amount),
              },
            }
          ),
            await ReconciliationModel.updateOne(
              { reconciliationId: req.body.transaction[0].reconciliationId },
              { $push: { nonreconciledRefundTransactions: nrtrxnfind } }
            );

          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Access-Control-Allow-Methods",
            "GET,HEAD,OPTIONS,POST,PUT"
          );
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
          );
          res.send({
            status: "success",
            message: "Manual Refund Reconciliation Done",
            data: "reconcileData",
          });
        } else {
          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Access-Control-Allow-Methods",
            "GET,HEAD,OPTIONS,POST,PUT"
          );
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
          );
          res.send({
            status: "success",
            message: "Already Reconciliation Done",
            data: "reconcileData",
          });
        }
      } else {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res.status(400).send({
          status: "failure",
          message: "amount is not matched",
          data: `transaction amount ${req.body.transaction[0].amount} is not matching with bank statement amount ${req.body.bankStatement.creditAmount}`,
        });
      }
    } else {
      res.status(500).send({
        status: "failure",
        message: "Organization not found",
      });
    }
  } catch (err) {
    res.json({ status: "failure", message: "reconciliation: " + err.message });
  } finally {
    dbConnection.close();
    centralDbConnection.close();
  }
};
module.exports.confirmSoftwareReconciliation = async (req, res) => {
  let dbConnection;
  let centralDbConnection;
  try {
    // try {

    centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({
      _id: mongoose.Types.ObjectId(req.query.orgId),
    });
    if (orgData) {
      dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
      let FeeLedgerModel = dbConnection.model(
        feeLedgerCollectionName,
        feeLedgerSchema
      );
      let BseModel = dbConnection.model(bseCollectionName, bseSchema);
      let transactionModel = dbConnection.model(
        "transactions",
        transactionSchema
      );
      let banktxnsMappingModel = dbConnection.model(
        bankTxnsMappingCollectionName,
        bankTxnsMappingSchema
      );
      let bankstmtmappings = await banktxnsMappingModel.find({});
      let count = 0;
      if (req.body.transactions.length > 0) {
        for (let i = 0; i < req.body.transactions.length; i++) {
          count++;
          let existbankdescr = await bankstmtmappings.find(
            (item) =>
              item._doc.bankDescription.toLowerCase() ==
              req.body.bankStatements[i].description.toLowerCase()
          );
          let updated = await transactionModel.updateOne(
            { _id: mongoose.Types.ObjectId(req.body.transactions[i]._id) },
            { $set: { reconciliationStatus: "reconciled" } }
          );
          await BseModel.updateOne(
            { _id: mongoose.Types.ObjectId(req.body.bankStatements[i]._id) },
            { reconciled: true, reconciliationMethod: "reconciled" }
          );
          if (existbankdescr) {
            await banktxnsMappingModel.updateOne(
              { _id: existbankdescr._id },
              {
                $push: {
                  transactionsStudentRegId:
                    req.body.transactions[i].studentRegId,
                },
              }
            );
          } else {
            let mapData = {
              bankDescription:
                req.body.bankStatements[i].description.toLowerCase(),
              transactionsStudentRegId: [req.body.transactions[i].studentRegId],
            };
            let newMap = new banktxnsMappingModel(mapData);
            await newMap.save();
          }
          if (count == req.body.transactions.length) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header(
              "Access-Control-Allow-Methods",
              "GET,HEAD,OPTIONS,POST,PUT"
            );
            res.header(
              "Access-Control-Allow-Headers",
              "Origin, X-Requested-With, Content-Type, Accept, Authorization"
            );
            res.send({
              status: "success",
              message: "Software Reconciliation Confirmation Done",
              data: updated,
            });
          }
        }
      } else {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res.send({
          status: "success",
          message: "Software Reconciliation Confirmation Done",
          data: "no transactions to reconcile",
        });
      }
    } else {
      res.status(500).send({
        status: "failure",
        message: "Organization not found",
      });
    }
  } catch (err) {
    res.json({ status: "failure", message: "reconciliation: " + err.message });
  } finally {
    dbConnection.close();
    centralDbConnection.close();
  }
};

async function getBankStatementEntries(params, dbConnection) {
  let model = dbConnection.model(bseCollectionName, bseSchema);

  try {
    return await model.find(params);
  } catch (err) {
    console.log(err);
  }
} // getBankStatementEntries

async function getTransactionsEntries(params, dbConnection) {
  let model = dbConnection.model(
    transactionsCollectionName,
    transactionsSchema
  );

  try {
    return await model.find(params);
  } catch (err) {
    console.log(err);
  }
}

async function refundTransaction(dbConnection, res) {
  try {
    let BseModel = dbConnection.model(bseCollectionName, bseSchema);
    let TransactionsModel = dbConnection.model(
      transactionsCollectionName,
      transactionsSchema
    );
    let params = {
      transactionType: "eduFees",
      transactionSubType: "refund",
      reconciliationStatus: { $in: ["initial", "", null, undefined] },
    };
    let transactionsEntries = await TransactionsModel.find(params);
    let attemptedTransactions = transactionsEntries.length;
    console.log("transactionsEntries: " + transactionsEntries.length);

    let bseParams = {
      reconciled: false,
      debitAmount: { $gt: 0 },
      statementType: "BANK",
    };
    let bsEntries = await getBankStatementEntries(bseParams, dbConnection);
    console.log("bsEntries: " + bsEntries.length);
    // console.log(bsEntries);
    let refundTransactions = [];
    var transactionsToReconcile = [];
    var transactionsToReconcileDetails = [];
    var bseToReconcile = [];
    var bseToReconcileDetails = [];
    var totalReconciledAmount = 0;
    // for (bse of bsEntries)
    for (let j = 0; j < bsEntries.length; j++) {
      let bse = bsEntries[j];
      if (bse.debitAmount != null && bse.debitAmount != 0) {
        // console.log("Bank Stmt Entry: Amount " + bse.debitAmount
        //     + " | " + bse.description
        //     + " | chequeNo: " + bse.chequeNo
        //     + " | txnRefNo: " + bse.txnRefNo
        // );

        let amountMatches = 0;
        let studentMatch = false;
        for (let i = 0; i < transactionsEntries.length; i++) {
          if (transactionsEntries[i]["amount"] == bse.debitAmount) {
            amountMatches++;
            var studentNamePatternMatch;
            var patternMatchRatio;
            if (bse.description != null && bse.description.length > 0) {
              var description = bse.description;
              if (
                bse.description.toUpperCase().startsWith("NEFT ") ||
                bse.description.toUpperCase().startsWith("NEFT-")
              ) {
                description = bse.description.substring(5).trim();
              }
              studentNamePatternMatch = longestSubstring(
                description,
                transactionsEntries[i].studentName
              );
              // console.log("matching: " + description);
              if (studentNamePatternMatch != null) {
                patternMatchRatio =
                  studentNamePatternMatch.length / description.length;
              }
            }
            if (patternMatchRatio > highPatternMatchRatio) {
              studentMatch = true;
              console.log("HIGH probability student match: ");
              console.log(bse);
              console.log(transactionsEntries[i]);
              transactionsToReconcile.push(transactionsEntries[i]._id);
              transactionsToReconcileDetails.push(transactionsEntries[i]);
              bseToReconcile.push(bse._id);
              bseToReconcileDetails.push(bse);
              totalReconciledAmount += transactionsEntries[i].amount;
              // splice is needed if there are more than one entries for a student with same amount
              // if splice not used, it results in double marking of bankstmtentries
              transactionsEntries.splice(i, 1);
              bsEntries.splice(j, 1);
            } else if (patternMatchRatio > lowPatternMatchRatio) {
              console.log("Low probability student match: ");
              console.log(bse);
              console.log(transactionsEntries[i]);
            }
            // console.log("Amount: " + bse.creditAmount + " | Student: " + transactionsEntries[i].studentName
            //     + " | studentNamePatternMatch: " + studentNamePatternMatch + " (" + patternMatchRatio * 100 + " %)");
          }
        }
        console.log("Amount matches: " + amountMatches);
        console.log(
          "--------------------------------------------------------------------"
        );
      } // if
    } // for
    console.log(
      "reconcileWithBankStmt: Attempting reconciliation for " +
      transactionsToReconcile.length +
      " entries in reconciliationtransactions" +
      ", and " +
      bseToReconcile.length +
      " entries in the bank statement."
    );

    var nonReconciledTransactionsIds = [];
    for (fle of transactionsEntries) {
      nonReconciledTransactionsIds.push(fle._id);
    }
    console.log(
      "nonReconciledTransactionsIds: " + nonReconciledTransactionsIds.length
    );

    var nonReconciledBankStmtIds = [];
    for (bse of bsEntries) {
      nonReconciledBankStmtIds.push(bse._id);
    }
    console.log("nonReconciledBankStmtIds: " + nonReconciledBankStmtIds.length);
    await TransactionsModel.updateMany(
      { _id: { $in: transactionsToReconcile } },
      { reconciliationStatus: "softwarereconciled", softwareReconciled: true }
    );
    await BseModel.updateMany(
      { _id: { $in: bseToReconcile } },
      {
        reconciled: true,
        reconciliationMethod: "softwarereconciled",
        softwareReconciled: true,
      }
    );

    // now set the non-reconciled ones ..
    await TransactionsModel.updateMany(
      { _id: { $in: nonReconciledTransactionsIds } },
      { reconciliationStatus: "nonreconciled", softwareReconciled: false }
    );

    // let reconciledPercent = transactionsToReconcile.length / attemptedTransactions;
    let reconciledPercent;
    if (
      Number(transactionsToReconcile.length) == 0 &&
      Number(attemptedTransactions) == 0
    ) {
      reconciledPercent = 0;
    } else {
      reconciledPercent =
        Number(transactionsToReconcile.length) / Number(attemptedTransactions);
    }
    var status = "Partial";
    if (reconciledPercent == 1) {
      status = "Full";
    }
    let reconData = {
      reconciledRefundTransactions: transactionsToReconcileDetails,
      reconciledRefundBankStmtEntryDetails: bseToReconcileDetails,
      nonreconciledRefundTransactionDetails: transactionsEntries,
      nonreconciledRefundBankStatementEntries: bsEntries,
      numberOfRenconciledTransactions: transactionsToReconcile.length,
      totalReconciledAmount: totalReconciledAmount,
    };
    return reconData;
  } catch (err) {
    res.json({ status: "failure", message: "reconciliation: " + err.message });
  }
}

module.exports.getRecieptList = async (req, res) => {
  let dbConnection;
  try {
    let page = Number(req.query.page);
    let per_page = Number(req.query.perPage);
    let status = req.query.status;
    dbConnection = await createDatabase(
      req.headers.orgId,
      req.headers.resource
    );
    let transactionModel = dbConnection.model(
      "transactions",
      transactionSchema
    );
    if (status == "pending") {
      recieptSentList = await transactionModel.find({
        reconciliationStatus: "reconciled",
      });
      let mappedData = recieptSentList.map(function (el) {
        var o = Object.assign({}, el._doc);
        o.amount = el._doc.amount.toFixed(2);
        return o;
      });
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      recieptsPaginated = await Paginator(mappedData, page, per_page);
      res.send(recieptsPaginated);
    } else if (status == "sent") {
      recieptSentList = await transactionModel.find({
        reconciliationStatus: "done",
      });
      let mappedData = recieptSentList.map(function (el) {
        var o = Object.assign({}, el._doc);
        o.amount = el._doc.amount.toFixed(2);
        return o;
      });
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      recieptsPaginated = await Paginator(mappedData, page, per_page);
      res.send(recieptsPaginated);
    }
  } catch (err) {
    res.json({ status: "failure", message: "reconciliation: " + err.message });
  } finally {
    dbConnection.close();
  }
};

module.exports.sendFeesReceipt = async (req, res) => {
    let dbConnection
    let centralDbConnection
    // try {
    centralDbConnection = await createDatabase(
        `usermanagement-${process.env.stage}`,
        process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
        "orglists",
        orgListSchema,
        "orglists"
    );
    const orgData = await orgListModel.findOne({
        _id: mongoose.Types.ObjectId(req.query.orgId),
    });

    let inputData = req.body
    if (orgData) {
        dbConnection = await createDatabase(
            String(orgData._id),
            orgData.connUri
        );
        let transactionModel = dbConnection.model("transactions", transactionSchema);
        let studentModel = dbConnection.model("students", StudentSchema);
        const settingsSchema = mongoose.Schema({}, { strict: false });
        let campusModel = dbConnection.model("campuses", settingsSchema, "campuses");
        let count = 0
        const settingsModel = dbConnection.model(
            "settings",
            settingsSchema,
            "settings"
        );
        const orgSettings = await settingsModel.find({});
        let orgDetails = orgSettings[0]._doc;
        for (let i = 0; i < inputData.length; i++) {
            count++
            let campusData = await campusModel.findOne({ _id: mongoose.Types.ObjectId(inputData[i].campusId) })
            let stdData = await studentModel.findOne({ _id: mongoose.Types.ObjectId(inputData[i].studentId) })
            let comEmail = stdData._doc.parentEmail !== "-" ? stdData._doc.parentEmail : stdData._doc.parentEmail == "" ? stdData._doc.email : stdData._doc.email;
            let transactionDetails = {
                demandNote: inputData[i].relatedTransactions[0],
                transactionId: inputData[i].data.modeDetails.instrumentNo,
                mode: inputData[i].data.mode,
                status: "",
                type: "",
                amount: inputData[i].amount,
                campus: {
                    name: campusData._doc.name,
                    address1: campusData._doc.legalAddress.address1,
                    address2: campusData._doc.legalAddress.address2 ? campusData._doc.legalAddress.address2 : "",
                    address3: campusData._doc.legalAddress.address3 ? campusData._doc.legalAddress.address3 : "",
                    contact: campusData._doc.instituteContact[0].mobileNumber,
                    city: campusData._doc.legalAddress.city,
                    state: campusData._doc.legalAddress.state,
                    country: campusData._doc.legalAddress.country,
                    pincode: campusData._doc.legalAddress.pincode,
                }
            };
            let transactionId = inputData[i].paymentTransactionId;
            var allMaildata = {
                transactionId: transactionId,
                studentName: inputData[i].studentName,
                mode: inputData[i].data.mode,
                status: "",
                type: "",
                amount: inputData[i].amount,
                campus: {
                    name: campusData._doc.name,
                    address1: campusData._doc.legalAddress.address1,
                    address2: campusData._doc.legalAddress.address2 ? campusData._doc.legalAddress.address2 : "",
                    address3: campusData._doc.legalAddress.address3 ? campusData._doc.legalAddress.address3 : "",
                    contact: campusData._doc.instituteContact[0].mobileNumber,
                    city: campusData._doc.legalAddress.city,
                    state: campusData._doc.legalAddress.state,
                    country: campusData._doc.legalAddress.country,
                    pincode: campusData._doc.legalAddress.pincode,
                }

            };
            console.log("transactionDetails", transactionDetails)
            var feesAll = [];
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
            for (singleFee of inputData[i].data.feesBreakUp) {
                var obj;
                if (Number(singleFee.amount) !== 0) {
                    obj = {
                        feeTypeName: singleFee.title,
                        previousDue: 0.0,
                        currentDue: Number(singleFee.amount),
                        totalDue: Number(singleFee.amount),
                        paidAmount: Number(singleFee.amount),
                        mode: inputData[i].data.mode,
                        academicYear: inputData[i].academicYear,
                        studentName: inputData[i].studentName,
                        regId: inputData[i].studentRegId,
                        class: inputData[i].class,
                        campus: {
                            name: campusData._doc.name,
                            address1: campusData._doc.legalAddress.address1,
                            address2: campusData._doc.legalAddress.address2 ? campusData._doc.legalAddress.address2 : "",
                            address3: campusData._doc.legalAddress.address3 ? campusData._doc.legalAddress.address3 : "",
                            contact: campusData._doc.instituteContact[0].mobileNumber,
                            city: campusData._doc.legalAddress.city,
                            state: campusData._doc.legalAddress.state,
                            country: campusData._doc.legalAddress.country,
                            pincode: campusData._doc.legalAddress.pincode,
                        }
                    };
                    feesAll.push(obj);
                }
            }
            let rcptId = inputData[i].receiptNo
            // const emailTemplate = receiptTemplate(orgDetails, transactionDetails);
            // const pdfAttachment = receiptPdf(orgDetails, demandNoteDetails, feeTableHeader, receiptNo);

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
                "receipt",
                qrCo
            );

            let obje = {
                html: successReceipt,
            };
            let createPdf = await axios.post(
                "http://13.71.115.192:8080/receipts",
                obje
            );
            let accountname = process.env.blobAccountName;
            const containerName = process.env.containerName;
            let key = process.env.blobKey;

            let blobName = createPdf.data.data;

            const blobServiceClient =
                BlobServiceClient.fromConnectionString(
                    process.env.AZURE_STORAGE_CONNECTION_STRING
                );
            const containerClient =
                blobServiceClient.getContainerClient(containerName);
            const blobClient =
                await containerClient.getBlobClient(blobName);
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
                "receipt",
                qrCod,
                minUrl
            );

            let obje1 = {
                html: successReceipt1,
            };
            let createPdf1 = await axios.post(
                "http://13.71.115.192:8080/receipts",
                obje1
            );
            let title = "ZQ EDU-Receipt";
            sendEmail(
                orgDetails.emailServer[0].emailServer,
                comEmail,
                orgDetails.emailServer[0].emailAddress,
                title,
                emailTemplate1,
                createPdf1.data.file
            )
                .then(async data => {
                    //   dbConnection1.close();
                    await transactionModel.updateOne(
                        { _id: mongoose.Types.ObjectId(inputData[i]._id) },
                        { $set: { reconciliationStatus: "done" } }
                    );
                    if (count == inputData.length) {
                    await transactionModel.updateMany(
                            { _id: mongoose.Types.ObjectId(inputData[i]._id) },
                            { $set: { reconciliationStatus: "done" } }
                        );

                        res.header("Access-Control-Allow-Origin", "*");
                        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
                        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
                        setTimeout(() => { res.send({ status: "success", message: "receipt sent to demand notes", data: "data" }); }, 2000)
                    }
                })
                .catch((err) => {
                    //   dbConnection1.close();
                    res.status(500).send({
                        status: "failure",
                        message: "failed to send receipt email",
                        data: err.stack,
                    });
                });

            // let emailCommunicationRefIds = inputData[i].emailCommunicationRefIds;
            // sendEmail(
            //     orgDetails.emailServer[0].emailServer,
            //     emailCommunicationRefIds,
            //     orgDetails.emailServer[0].emailAddress,
            //     "ZQ EDU-Payment Success",
            //     emailTemplate,
            //     []
            // )
            //     .then(async (data) => {
            //         await transactionModel.updateOne(
            //             { _id: mongoose.Types.ObjectId(inputData[i]._id) },
            //             { $set: { reconciliationStatus: "done" } }
            //         );
            //         if (count == inputData.length) {
            //             res.header("Access-Control-Allow-Origin", "*");
            //             res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
            //             res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
            //             res.send({ status: "success", message: "receipt sent to demand notes", data: "data" });
            //         }
            //     })
            //     .catch((err) => {
            //         console.log(err, "came to email error");
            //         res.status(500).send({
            //             status: "failure",
            //             message: "failed to send email",
            //             data: err,
            //         });
            //     });
        }
    }
    else {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        res.status(500).send({
            status: "failure",
            message: "Organization not found",
        });
    }
    // }
    // catch (err) {
    //     res.json({ status: "failure", message: "reconciliation: " + err.toString() });
    // }
    // finally {
    //     dbConnection.close();
    // }
};

function Paginator(items, page, per_page) {
  let current_page = page;
  let perPage = per_page;
  (offset = (current_page - 1) * perPage),
    (paginatedItems = items.slice(offset).slice(0, perPage)),
    (total_pages = Math.ceil(items.length / perPage));
  return {
    page: Number(current_page),
    perPage: Number(perPage),
    nextPage:
      total_pages > Number(current_page) ? Number(current_page) + 1 : null,
    totalRecord: items.length,
    totalPages: total_pages,
    data: paginatedItems,
    status: "success",
  };
}

function stringToDate(_date, _format, _delimiter) {
  try {
    // console.log(_date + " " + _format + " " + _delimiter);
    var dateStr = "";
    var formatLowerCase = _format.toLowerCase();
    if (formatLowerCase == "ddmonyy") {
      var date = _date.substring(0, 2);
      var month = _date.substring(2, 5);
      var year = _date.substring(5, 7);
      dateStr = month + " " + date + " " + year + " 00:00:00 UTC";
    } else if (
      formatLowerCase == "dd mon yyyy" ||
      formatLowerCase == "dd-mon-yyyy"
    ) {
      var date = _date.substring(0, 2);
      var month = _date.substring(3, 6);
      var year = _date.substring(7, 11);
      dateStr = month + " " + date + " " + year + " 00:00:00 UTC";
    } else if (formatLowerCase == "dd-mm-yy" || formatLowerCase == "dd/mm/yy") {
      var date = _date.substring(0, 2);
      var month = _date.substring(3, 5);
      var year = _date.substring(6, 8);
      dateStr = "20" + year + "-" + month + "-" + date + " 00:00:00 UTC";
    } else if (
      formatLowerCase == "dd-mm-yyyy" ||
      formatLowerCase == "dd/mm/yyyy"
    ) {
      var date = _date.substring(0, 2);
      var month = _date.substring(3, 5);
      var year = _date.substring(6, 10);
      dateStr = year + "-" + month + "-" + date + " 00:00:00 UTC";
    } else if (formatLowerCase == "dd/mm/ yyyy") {
      var date = _date.substring(0, 2);
      var month = _date.substring(3, 5);
      var year = _date.substring(7, 11);
      dateStr = year + "-" + month + "-" + date + " 00:00:00 UTC";
    } else if (formatLowerCase == "mm/dd/ yy") {
      var date = _date.substring(0, 2);
      var month = _date.substring(3, 5);
      var year = _date.substring(7, 9);
      dateStr = "20" + year + "-" + month + "-" + date + " 00:00:00 UTC";
    } else {
      var formatItems = formatLowerCase.split(_delimiter);
      var dateItems = _date.split(_delimiter);
      // console.log("_date", _date)
      if (dateItems.length < 2 && _date.includes("-")) {
        dateItems = _date.split("-");
        var monthIndex = 1;
        var dayIndex = 0;
        var yearIndex = 2;
        var month = parseInt(dateItems[monthIndex]);
        // month -= 1;
        if (dateItems[2].length == 2) {
          dateItems[yearIndex] = "20" + dateItems[2];
        }
      } else {
        var monthIndex = formatItems.indexOf("mm");
        var dayIndex = formatItems.indexOf("dd");
        var yearIndex = formatItems.indexOf("yyyy");
        var month = parseInt(dateItems[monthIndex]);
        // month -= 1;
        if (dateItems[2].length == 2) {
          dateItems[yearIndex] = "20" + dateItems[2];
        }
      }
      // if (dateItems[yearIndex].length == 2) {
      //     dateItems[yearIndex] = "20" + dateItems[yearIndex];
      // }
      // var formatedDate = new Date(dateItems[yearIndex], month, dateItems[dayIndex]);
      dateStr =
        dateItems[yearIndex] +
        "-" +
        month +
        "-" +
        dateItems[dayIndex] +
        " 00:00:00 UTC";
    }
    var formatedDate = new Date(dateStr);
    return formatedDate;
  } catch (err) {
    console.log(err);
    return null;
  }
} // stringToDate

async function addBankStatements(input, reconciliationListId, dbConnection, res) {
  let bankStmt = input;
  console.log(bankStmt.bank)
  if (bankStmt.bank.toLowerCase() == "razorpay") {
    const map = mapperJson[bankStmt.bank];
    let dateCol = map.txnDateColPosition;
    let dateFormat = map.dateFormat;
    let dateDelimiter = map.dateDelimiter;
    let debitCol = map.debitColPosition;
    let creditCol = map.creditColPosition;
    let balanceCol = map.balanceColPosition;
    let descriptionCol = map.descriptionPosition;
    let blankEntry = map.blankEntry;
    let chequeCol = map.chequeColPosition;
    let txnRefCol = map.txnRefColPosition;
    let tokenChar = map.primaryTokenizer;
    let descFormat = map.descriptionFormat;
    let isAscending = map.ascendingOrder;

    let txnCount = 0;
    let creditCount = 0;
    let debitCount = 0;
    var totalCredit = 0.0;
    var totalDebit = 0.0;
    // var balanceInInput = 0.0; 
    var computedBalance = 0.0;
    // console.log("bank: " + bankStmt.bank);
    // console.log("account_number: " + bankStmt.account_number);
    // console.log("tokenChar: " + tokenChar);
    var BseModel = dbConnection.model(bseCollectionName, bseSchema);

    var entries;
    if (isAscending) {
      // console.log("ascending .. ")
      entries = bankStmt.entries
    }
    else {
      // console.log("descending ............................ ")
      entries = bankStmt.entries.reverse();
    }
    for (entry of entries) {
      let notes = JSON.parse(entry.notes);
      // entries.forEach(async function (entry) {
      let bseData = {
        bankName: bankStmt.bank.trim(),
        accountNumber: bankStmt.account_number
      }
      let datesplit = entry.created_at.split(" ")
      datesplit = datesplit[0].split("/")
      bseData.transactionDate = new Date(`${datesplit[2]}/${datesplit[1]}/${datesplit[0]}`)
      bseData.chequeNo = " ";
      bseData.txnRefNo = entry.id;
      bseData.description = `razorpay-${entry.method}-${notes.policy_name}-${entry.email}-${entry.contact}`
      bseData.mode = "razorpay"
      bseData.method = entry.method
      bseData.reconciliationListId = reconciliationListId
      let debitVal = 0.0;
      let creditVal = 0.0;
      if (entry.amount != null && entry.amount != blankEntry) {
        creditVal = removeCommas(entry.amount);
        if (creditVal != 0) {
          totalCredit += creditVal;
          creditCount++;
          if (txnCount != 0) {
            computedBalance = Math.round((computedBalance + creditVal + Number.EPSILON) * 100) / 100;
          } else {
            computedBalance = 0;
          }
          bseData.creditAmount = creditVal;
          bseData.debitAmount = 0.0;
          bseData.balance = computedBalance;
          // console.log(entry[dateCol] + " | CR " + creditVal
          //     + " | balance " + computedBalance
          //     + " | cheque " + entry[chequeCol]
          //     + " | txnRef " + entry[txnRefCol]
          //     + " | " + entry[descriptionCol]);

          let descriptionTokens = bseData.description;
          if (descFormat != null && descFormat != "") {
            tokenizer = "long unwated never used string xxx yyy";
            if (bseData.description.toUpperCase().startsWith("NEFT")) {
              tokenizer = descFormat.credit.NEFT.tokenizer;
              descriptionTokens = bseData.description.split(tokenizer);
              bseData.fromBank = descriptionTokens[1].trim();
              bseData.mode = descriptionTokens[0].trim();
              bseData.bankTxnId = descriptionTokens[4].trim();
              bseData.depositor = descriptionTokens[2].trim();
              bseData.beneficiary = descriptionTokens[3].trim();
            } else if (bseData.description.toUpperCase().startsWith("IMPS")) {
              tokenizer = descFormat.credit.IMPS.tokenizer;
              descriptionTokens = bseData.description.split(tokenizer);
              bseData.fromBank = descriptionTokens[5].trim();
              bseData.mode = descriptionTokens[0].trim();
              bseData.depositor = descriptionTokens[2].trim();
            }
          }
          // console.log("description tokens: " + descriptionTokens);
        }
      }

      if (debitVal != 0 || creditVal != 0) {
        txnCount++;
        let bseModel = new BseModel(bseData);
        var savedData = await bseModel.save();
      }


    } // for 
    // }); // foreach 

    totalCredit = Math.round((totalCredit + Number.EPSILON) * 100) / 100;
    totalDebit = Math.round((totalDebit + Number.EPSILON) * 100) / 100;

    // console.log("txn count: " + txnCount);
    // console.log("no of credits: " + creditCount + " | total credit: " + totalCredit);
    // console.log("no of debits : " + debitCount + " | total debit: " + totalDebit);
    // console.log("----------------------------------------------")
    return {
      status: "success",
      message: "Bank statement uploaded successfully",
      data: {
        txnCount, creditCount, debitCount
      }
    }

  }
  else {
    const map = mapperJson[bankStmt.bank];
    let dateCol = map.txnDateColPosition;
    let dateFormat = map.dateFormat;
    let dateDelimiter = map.dateDelimiter;
    let debitCol = map.debitColPosition;
    let creditCol = map.creditColPosition;
    let balanceCol = map.balanceColPosition;
    let descriptionCol = map.descriptionPosition;
    let blankEntry = map.blankEntry;
    let chequeCol = map.chequeColPosition;
    let txnRefCol = map.txnRefColPosition;
    let tokenChar = map.primaryTokenizer;
    let descFormat = map.descriptionFormat;
    let isAscending = map.ascendingOrder;

    let txnCount = 0;
    let creditCount = 0;
    let debitCount = 0;
    var totalCredit = 0.0;
    var totalDebit = 0.0;
    // var balanceInInput = 0.0; 
    var computedBalance = 0.0;
    // console.log("bank: " + bankStmt.bank);
    // console.log("account_number: " + bankStmt.account_number);
    // console.log("tokenChar: " + tokenChar);
    var BseModel = dbConnection.model(bseCollectionName, bseSchema);

    var entries;
    if (isAscending) {
      // console.log("ascending .. ")
      entries = bankStmt.entries
    }
    else {
      // console.log("descending ............................ ")
      entries = bankStmt.entries.reverse();
    }
    for (entry of entries) {
      if (entry[2] !== "-" && entry[3] !== "-" && !entry[3].includes("*") && !entry[2].includes("*")) {

        // entries.forEach(async function (entry) {
        let bseData = {
          bankName: bankStmt.bank.trim(),
          accountNumber: bankStmt.account_number
        }
        bseData.transactionDate = stringToDate(entry[dateCol], dateFormat, dateDelimiter);
        bseData.chequeNo = entry[chequeCol];
        bseData.txnRefNo = entry[txnRefCol];
        bseData.description = entry[descriptionCol];
        bseData.reconciliationListId = reconciliationListId
        let debitVal = 0.0;
        let creditVal = 0.0;
        if (entry[debitCol] != null && entry[debitCol] != blankEntry) {
          debitVal = removeCommas(entry[debitCol]);
          if (debitVal != 0) {
            totalDebit += debitVal;
            debitCount++;
            if (txnCount != 0) {
              computedBalance = Math.round((computedBalance - debitVal + Number.EPSILON) * 100) / 100;
            } else {
              computedBalance = removeCommas(entry[balanceCol]);
            }
            bseData.debitAmount = debitVal;
            bseData.creditAmount = 0.0;
            bseData.balance = computedBalance;
            // console.log(entry[dateCol] + " | db " + debitVal
            //     + " | balance " + computedBalance
            //     + " | cheque " + entry[chequeCol]
            //     + " | txnRef " + entry[txnRefCol]
            //     + " | " + entry[descriptionCol]);

            let descriptionTokens = bseData.description;
            if (descFormat != null && descFormat != "") {
              tokenizer = "long unwated never used string xxx yyy";
              if (bseData.description.toUpperCase().startsWith("NEFT")) {
                tokenizer = descFormat.debit.NEFT.tokenizer;
                descriptionTokens = bseData.description.split(tokenizer);
                bseData.mode = descriptionTokens[0].trim();
                bseData.bankTxnId = descriptionTokens[1].trim();
                bseData.beneficiary = descriptionTokens[3].trim();
              }
            }
            // console.log("description tokens: " + descriptionTokens);
          }
        }
        if (entry[creditCol] != null && entry[creditCol] != blankEntry) {
          creditVal = removeCommas(entry[creditCol]);
          if (creditVal != 0) {
            totalCredit += creditVal;
            creditCount++;
            if (txnCount != 0) {
              computedBalance = Math.round((computedBalance + creditVal + Number.EPSILON) * 100) / 100;
            } else {
              computedBalance = removeCommas(entry[balanceCol]);
            }
            bseData.creditAmount = creditVal;
            bseData.debitAmount = 0.0;
            bseData.balance = computedBalance;
            // console.log(entry[dateCol] + " | CR " + creditVal
            //     + " | balance " + computedBalance
            //     + " | cheque " + entry[chequeCol]
            //     + " | txnRef " + entry[txnRefCol]
            //     + " | " + entry[descriptionCol]);

            let descriptionTokens = bseData.description;
            if (descFormat != null && descFormat != "") {
              tokenizer = "long unwated never used string xxx yyy";
              if (bseData.description.toUpperCase().startsWith("NEFT")) {
                tokenizer = descFormat.credit.NEFT.tokenizer;
                descriptionTokens = bseData.description.split(tokenizer);
                bseData.fromBank = descriptionTokens[1].trim();
                bseData.mode = descriptionTokens[0].trim();
                bseData.bankTxnId = descriptionTokens[4].trim();
                bseData.depositor = descriptionTokens[2].trim();
                bseData.beneficiary = descriptionTokens[3].trim();
              } else if (bseData.description.toUpperCase().startsWith("IMPS")) {
                tokenizer = descFormat.credit.IMPS.tokenizer;
                descriptionTokens = bseData.description.split(tokenizer);
                bseData.fromBank = descriptionTokens[5].trim();
                bseData.mode = descriptionTokens[0].trim();
                bseData.depositor = descriptionTokens[2].trim();
              }
            }
            // console.log("description tokens: " + descriptionTokens);
          }
        }

        if (debitVal != 0 || creditVal != 0) {
          txnCount++;
          let bseModel = new BseModel(bseData);
          var savedData = await bseModel.save();
        }

      }
    } // for 
    // }); // foreach 

    totalCredit = Math.round((totalCredit + Number.EPSILON) * 100) / 100;
    totalDebit = Math.round((totalDebit + Number.EPSILON) * 100) / 100;

    // console.log("txn count: " + txnCount);
    // console.log("no of credits: " + creditCount + " | total credit: " + totalCredit);
    // console.log("no of debits : " + debitCount + " | total debit: " + totalDebit);
    // console.log("----------------------------------------------")
    return {
      status: "success",
      message: "Bank statement uploaded successfully",
      data: {
        txnCount, creditCount, debitCount
      }
    }

  }

}

async function addPOSStatements(
  input,
  reconciliationListId,
  dbConnection,
  res
) {
  let posStmt = input;
  const map = POSmapperJson[posStmt.bank];
  console.log(map);
  let dateCol = map.txnDateColPosition;
  let dateFormat = map.dateFormat;
  let dateDelimiter = map.dateDelimiter;
  let txnAmountCol = map.txnAmountColPosition;
  let cardNumCol = map.cardNumColPosition;
  let authCodeCol = map.authCodeColPosition;

  let count = 0;
  var totalAmount = 0.0;
  // console.log("bank: " + posStmt.bank);
  // console.log("account_number: " + posStmt.account_number);
  var BseModel = dbConnection.model(bseCollectionName, bseSchema);

  var entries = posStmt.entries;
  for (entry of entries) {
    // entries.forEach(async function (entry) {
    let pseData = {
      bankName: posStmt.bank.trim(),
      accountNumber: posStmt.account_number,
      statementType: "POS",
    };
    pseData.transactionDate = stringToDate(
      entry[dateCol],
      dateFormat,
      dateDelimiter
    );
    pseData.cardNumber = entry[cardNumCol];
    pseData.approvalCode = entry[authCodeCol];
    pseData.creditAmount = removeCommas(entry[txnAmountCol]);

    count++;
    let bseModel = new BseModel(pseData);
    var savedData = await bseModel.save();
  } // for
  // }); // foreach

  totalAmount = Math.round((totalAmount + Number.EPSILON) * 100) / 100;

  // console.log("txn count: " + count);
  // console.log("----------------------------------------------")
}
function removeCommas(stringAmount) {
  if (stringAmount == null || stringAmount == "" || stringAmount == "-")
    return 0.0;
  else return parseFloat(stringAmount.replace(/[,]/g, ""));
}

module.exports.createMockTransactionsPOS = async (req, res) => {
  try {
    dbConnection = await createDatabase(req.body.orgId, req.headers.resource);
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );
    let feesLedgerModel = dbConnection.model("feesledgers", feeLedgerSchema);
    let studentFeeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    // let stdmapdata = await studentFeeMapModel.find({paid:{$gt:0}})
    // for (let i = 0; i < stdmapdata.length; i++) {
    //     await studentFeeMapModel.updateOne({_id:stdmapdata[i]._doc._id},{$set:{paid:0,"pending":stdmapdata[i]._doc.amount}})

    // }
    // await studentFeeMapModel.updateMany({paid:{$gt:0}},{$set:{paid:0}})
    // console.log(sds)
    let studentModel = dbConnection.model("students", StudentSchema);
    let students = await studentModel.find({
      regId: { $in: req.body.students },
    });
    let ProgramPlanModel = dbConnection.model(
      "programplans",
      ProgramPlanSchema
    );
    let transdta = await transactionModel.find({
      displayName: { $regex: "RCPT_2020-21", $options: "i" },
    });
    let count = 0;
    for (let i = 0; i < students.length; i++) {
      count++;
      let id = transdta.length + i + 1;
      let std = students[i]._doc;
      let std1 = req.body.data.find((item) => item.regId == std.regId);
      let pplan1 = await ProgramPlanModel.findOne({ _id: std.programPlanId });
      let stdmapdata = await studentFeeMapModel.findOne({ studentId: std._id });
      let paidamount =
        parseFloat(stdmapdata._doc.paid) + parseFloat(std1.amount);
      let dueAmount =
        parseFloat(stdmapdata._doc.pending) - parseFloat(std1.amount);
      let pplan = pplan1._doc;
      // let stdmaps = studentFeeMapModel.find({})
      let datesplit = std1.date.split("-");
      let tdate = new Date(
        `${datesplit[2]}-${Number(datesplit[1])}-${Number(datesplit[0])}`
      );
      let transPayload = {
        feesLedgerIds: [],
        emailCommunicationRefIds: [std.email],
        smsCommunicationRefIds: [std.phone],
        relatedTransactions: [],
        softwareReconciled: false,
        currency: "INR",
        exchangeRate: 1,
        displayName: `RCPT_2020-21_${id < 9 ? "00" : id < 99 ? "0" : ""}${
          Number(id) + 1
          }`,
        transactionDate: tdate,
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        studentId: std._id,
        studentName: `${std.firstName} ${std.lastName}`,
        class: pplan.title,
        academicYear: pplan.academicYear,
        amount: std1.amount,
        studentRegId: std.regId,
        receiptNo: `RCPT_2020-21_${id < 9 ? "00" : id < 99 ? "0" : ""}${
          Number(id) + 1
          }`,
        programPlan: pplan._id,
        paymentRefId: std1.refNo,
        data: {
          orgId: req.body.orgId,
          displayName: `RCPT_2020-21_${id < 9 ? "00" : id < 99 ? "0" : ""}${
            Number(id) + 1
            }`,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          mode: "card",
          method: "otc",
          modeDetails: {
            netBankingType: null,
            walletType: null,
            instrumentNo: null,
            instrumentDate: tdate,
            bankName: null,
            cardDetails: {
              cardType: std1.cartType,
              nameOnCard: `${std.firstName} ${std.lastName}`,
              cardNumber: std1.cardNumber,
            },
            transactionId: std1.refNo,
            remarks: "test",
          },
          feesBreakUp: [
            {
              feeTypeId: req.body.ftypeId,
              feeType: "Tuition Fee ",
              amount: std1.amount,
              feeTypeCode: "FT001",
            },
          ],
        },
        paymentTransactionId: std1.refNo,
        status: "Paid",
      };
      let newtransaction = new transactionModel(transPayload);

      let feeLedgerPayload = {
        transactionId: newtransaction._id,
        transactionDate: tdate,
        transactionDisplayName: newtransaction.displayName,
        primaryTransaction: "",
        feeTypeCode: "FT001",
        dueAmount: dueAmount,
        pendingAmount: dueAmount,
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        studentId: std._id,
        studentRegId: std.regId,
        studentName: `${std.firstName} ${std.lastName}`,
        academicYear: pplan.academicYear,
        class: pplan.title,
        programPlan: pplan._id,
        status: "Pending",
      };
      let newFeeledger = new feesLedgerModel(feeLedgerPayload);
      await newFeeledger.save();
      newtransaction.feesLedgerIds = [newFeeledger._id];
      await newtransaction.save();
      // console.log(newFeeledger,newtransaction)
      // console.log(dsd)
      let updatestdmap = await studentFeeMapModel.updateOne(
        { _id: stdmapdata._doc._id },
        { $set: { paid: paidamount, pending: dueAmount } }
      );
      if (count == students.length) {
        dbConnection.close();
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res.status(200).json({
          status: "success",
          message: `${students.length} Transactions created`,
        });
      }
    }
  } catch (err) {
    res.json({
      status: "failure",
      message: "get cancel transaction: " + err.message,
    });
  }
};
module.exports.createMockTransactions = async (req, res) => {
  try {
    dbConnection = await createDatabase(
      req.headers.orgId,
      req.headers.resource
    );
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );
    let feesLedgerModel = dbConnection.model("feesledgers", feeLedgerSchema);
    let studentFeeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    // let newentries = []
    // let names = []
    // for(j=0;j<req.body.entries.length;j++){
    //     let camt = req.body.entries[j][5].replace(",","")
    //     if(parseFloat(camt)>0){
    //         newentries.push(req.body.entries[j])
    //     }

    // }
    // let stdmapdata = await studentFeeMapModel.find({paid:{$gt:0}})
    // for (let i = 0; i < stdmapdata.length; i++) {
    //     await studentFeeMapModel.updateOne({_id:stdmapdata[i]._doc._id},{$set:{paid:0,"pending":stdmapdata[i]._doc.amount}})

    // }
    // await studentFeeMapModel.updateMany({paid:{$gt:0}},{$set:{paid:0}})
    // console.log(sds)
    let studentModel = dbConnection.model("students", StudentSchema);
    let students = await studentModel.find({
      firstName: { $in: req.body.names },
    });
    console.log(students.length);
    let ProgramPlanModel = dbConnection.model(
      "programplans",
      ProgramPlanSchema
    );
    let transdta = await transactionModel.find({
      displayName: { $regex: "RCPT_2020-21", $options: "i" },
    });
    let count = 0;
    for (let i = 0; i < students.length; i++) {
      count++;
      let id = transdta.length + i + 1;
      let std = students[i]._doc;
      let newentries;
      for (k = 0; k < req.body.entries.length; k++) {
        let descri = req.body.entries[k][3].toLowerCase();
        if (descri.includes(std.firstName.toLowerCase().trim())) {
          newentries = req.body.entries[k];
        }
      }
      console.log(newentries, "std.lastName", std.lastName);
      let ccamt = newentries[5].replace(",", "");
      let pplan1 = await ProgramPlanModel.findOne({ _id: std.programPlanId });
      let stdmapdata = await studentFeeMapModel.findOne({ studentId: std._id });
      let paidamount = parseFloat(stdmapdata._doc.paid) + parseFloat(ccamt);
      let dueAmount = parseFloat(stdmapdata._doc.pending) - parseFloat(ccamt);
      let pplan = pplan1._doc;
      // let stdmaps = studentFeeMapModel.find({})
      let datesplit = newentries[1].split("/");
      let tdate = new Date(
        `${datesplit[2]}-${Number(datesplit[1])}-${Number(datesplit[0])}`
      );
      let moded = newentries[3].includes("NEFT")
        ? "netbanking"
        : newentries[3].includes("RTGS")
          ? "netbanking"
          : "cash";
      let method = newentries[3].includes("NEFT")
        ? "NEFT"
        : newentries[3].includes("RTGS")
          ? "RTGS"
          : null;
      let refid = Math.floor(Math.random() * 100930000);
      let transPayload = {
        feesLedgerIds: [],
        emailCommunicationRefIds: [std.email],
        smsCommunicationRefIds: [std.phone],
        relatedTransactions: [],
        softwareReconciled: false,
        currency: "INR",
        exchangeRate: 1,
        displayName: `RCPT_2020-21_${id < 9 ? "00" : id < 99 ? "0" : ""}${
          Number(id) + 1
          }`,
        transactionDate: tdate,
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        studentId: std._id,
        studentName: `${std.firstName} ${std.lastName}`,
        class: pplan.title,
        academicYear: pplan.academicYear,
        amount: parseFloat(ccamt),
        studentRegId: std.regId,
        receiptNo: `RCPT_2020-21_${id < 9 ? "00" : id < 99 ? "0" : ""}${
          Number(id) + 1
          }`,
        programPlan: pplan._id,
        paymentRefId: refid,
        data: {
          orgId: req.body.orgId,
          displayName: `RCPT_2020-21_${id < 9 ? "00" : id < 99 ? "0" : ""}${
            Number(id) + 1
            }`,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          mode: moded,
          method: "otc",
          modeDetails: {
            netBankingType: method,
            walletType: null,
            instrumentNo: refid,
            instrumentDate: tdate,
            bankName: null,
            cardDetails: {
              cardType: "",
              nameOnCard: "",
              cardNumber: "",
            },
            transactionId: refid,
            remarks: "test",
          },
          feesBreakUp: [
            {
              feeTypeId: req.body.ftypeId,
              feeType: "Tuition Fee ",
              amount: parseFloat(ccamt),
              feeTypeCode: "FT001",
            },
          ],
        },
        paymentTransactionId: newentries[7],
        status: "Paid",
      };
      let newtransaction = new transactionModel(transPayload);

      let feeLedgerPayload = {
        transactionId: newtransaction._id,
        transactionDate: tdate,
        transactionDisplayName: newtransaction.displayName,
        primaryTransaction: "",
        feeTypeCode: "FT001",
        dueAmount: dueAmount,
        pendingAmount: dueAmount,
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        studentId: std._id,
        studentRegId: std.regId,
        studentName: `${std.firstName} ${std.lastName}`,
        academicYear: pplan.academicYear,
        class: pplan.title,
        programPlan: pplan._id,
        status: "Pending",
      };
      let newFeeledger = new feesLedgerModel(feeLedgerPayload);
      await newFeeledger.save();
      newtransaction.feesLedgerIds = [newFeeledger._id];
      await newtransaction.save();
      // console.log(newFeeledger,newtransaction)
      // console.log(dsd)
      let updatestdmap = await studentFeeMapModel.updateOne(
        { _id: stdmapdata._doc._id },
        { $set: { paid: paidamount, pending: dueAmount } }
      );
      if (count == students.length) {
        dbConnection.close();
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res.status(200).json({
          status: "success",
          message: `${students.length} Transactions created`,
        });
      }
    }
  } catch (err) {
    res.json({
      status: "failure",
      message: "get cancel transaction: " + err.message,
    });
  }
};
async function postReconciliationList(dbConnection, reconciliationId) {
  try {
    let page = 1;
    let per_page = 10;
    let reconciliationListModel = dbConnection.model(
      "reconciliationmanagers",
      reconciliationManagerSchema
    );
    let transactionModel = dbConnection.model(
      "transactions",
      transactionSchema
    );
    let bankstmtModel = dbConnection.model("bankstmtentries", bseSchema);

    // let mapperModel = dbConnection.model("banktransactionsmapping", bankTransactionMapperSchema);
    // await mapperModel.insertMany(mapdata)
    // console.log(req)
    // await transactionModel.updateMany({ reconciliationStatus: { $in: ["nonreconciled", "softwarereconciled"] } }, { $set: { reconciliationStatus: null } })
    // await bankstmtModel.updateMany({ reconciled: true }, { $set: { reconciled: false } })

    // console.log('transactions updated', updated)
    let recondata = await reconciliationListModel.findOne({
      reconciliationId: reconciliationId,
    });
    recondata = recondata._doc;
    var rbankstmts = recondata.reconciledBankStmtEntryDetails.map(function (
      el
    ) {
      var o = Object.assign({}, el);
      o.creditAmount =
        typeof el.creditAmount == Number
          ? el.creditAmount.toFixed(2)
          : el.creditAmount;
      o.debitAmount =
        typeof el.debitAmount == Number
          ? el.debitAmount.toFixed(2)
          : el.debitAmount;
      o.balance =
        typeof el.balance == Number ? el.balance.toFixed(2) : el.balance;
      o.status = "Done";
      return o;
    });
    // rbankstmtsPaginated = await Paginator(rbankstmts, page, per_page)
    var nrbankstmts = recondata.nonreconciledBankStmtEntryDetails.map(function (
      el
    ) {
      var o = Object.assign({}, el);
      o.creditAmount =
        typeof el.creditAmount == Number
          ? el.creditAmount.toFixed(2)
          : el.creditAmount;
      o.debitAmount =
        typeof el.debitAmount == Number
          ? el.debitAmount.toFixed(2)
          : el.debitAmount;
      o.balance =
        typeof el.balance == Number ? el.balance.toFixed(2) : el.balance;
      o.status = "Non-Reconciled";
      return o;
    });
    let rrefundbankst = recondata.reconciledRefundBankStmtEntryDetails.map(
      function (el) {
        var o = Object.assign({}, el);
        o.creditAmount =
          typeof el.creditAmount == Number
            ? el.creditAmount.toFixed(2)
            : el.creditAmount;
        o.debitAmount =
          typeof el.debitAmount == Number
            ? el.debitAmount.toFixed(2)
            : el.debitAmount;
        o.balance =
          typeof el.balance == Number ? el.balance.toFixed(2) : el.balance;
        o.status = "Done";
        return o;
      }
    );
    let rfldataa = [];
    let nrfldataa = [];
    let rrefundtxns = [];
    let rrefundfeeledgersPaginated;
    let rfeeledgersPaginated;
    let nrfeeledgersPaginated;

    rfeeledgersPaginated = await Paginator(
      recondata.reconciledTransactionsDetails,
      page,
      per_page
    );
    nrfeeledgersPaginated = await Paginator(
      recondata.nonreconciledTransactionsDetails,
      page,
      per_page
    );
    rrefundfeeledgersPaginated = await Paginator(
      recondata.reconciledRefundBankStmtEntryDetails,
      page,
      per_page
    );

    for (let j = 0; j < nrfeeledgersPaginated.data.length; j++) {
      let el = nrfeeledgersPaginated.data[j];
      var o = Object.assign({}, el);
      o.mode = el.data.mode;
      o.amount = el.amount.toFixed(2);
      o.reconciliationId = recondata.reconciliationId;
      delete o.data;
      o.modeData = {
        date: el.transactionDate,
        amount: el.amount.toFixed(2),
        remarks: el.data.modeDetails.remarks,
        ChequeNumber:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.transactionId
            : undefined,
        bankname: el.data.modeDetails.bankName,
        ["Branch Name"]:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.branchName
            : undefined,
        cardNumber:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardNumber
            : undefined,
        creditDebit:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.creditDebit
            : undefined,
        cardType:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardType
            : undefined,
        nameOnCard:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.nameOnCard
            : undefined,
        transactionNumber:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.transactionId
            : el.data.mode.toLowerCase() == "card"
              ? el.data.modeDetails.transactionId
              : undefined,
        netBankingType:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.netBankingType
            : undefined,
        UTRNumber:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.transactionId
            : undefined,
        walletType:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.walletType
            : undefined,
      };
      o.modeData.data = el.data;
      nrfldataa.push(o);
    }
    for (let j = 0; j < rfeeledgersPaginated.data.length; j++) {
      let el = rfeeledgersPaginated.data[j];
      var o = Object.assign({}, el);
      o.mode = el.data.mode;
      o.amount = el.amount.toFixed(2);
      o.reconciliationId = recondata.reconciliationId;
      delete o.data;
      o.modeData = {
        date: el.transactionDate,
        amount: el.amount.toFixed(2),
        remarks: el.data.modeDetails.remarks,
        ChequeNumber:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.transactionId
            : undefined,
        bankname: el.data.modeDetails.bankName,
        ["Branch Name"]:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.branchName
            : undefined,
        cardNumber:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardNumber
            : undefined,
        creditDebit:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.creditDebit
            : undefined,
        cardType:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardType
            : undefined,
        nameOnCard:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.nameOnCard
            : undefined,
        transactionNumber:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.transactionId
            : el.data.mode.toLowerCase() == "card"
              ? el.data.modeDetails.transactionId
              : undefined,
        netBankingType:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.netBankingType
            : undefined,
        UTRNumber:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.transactionId
            : undefined,
        walletType:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.walletType
            : undefined,
      };
      o.modeData.data = el.data;
      rfldataa.push(o);
    }
    for (let j = 0; j < rrefundfeeledgersPaginated.data.length; j++) {
      let el = rfeeledgersPaginated.data[j];
      var o = Object.assign({}, el);
      o.mode = el.data.mode;
      o.amount = el.amount.toFixed(2);
      o.reconciliationId = recondata.reconciliationId;
      delete o.data;
      o.modeData = {
        date: el.transactionDate,
        amount: el.amount.toFixed(2),
        remarks: el.data.modeDetails.remarks,
        ChequeNumber:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.transactionId
            : undefined,
        bankname: el.data.modeDetails.bankName,
        ["Branch Name"]:
          el.data.mode.toLowerCase() == "cheque"
            ? el.data.modeDetails.branchName
            : undefined,
        cardNumber:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardNumber
            : undefined,
        creditDebit:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.creditDebit
            : undefined,
        cardType:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.cardType
            : undefined,
        nameOnCard:
          el.data.modeDetails.cardDetails !== undefined
            ? el.data.modeDetails.cardDetails.nameOnCard
            : undefined,
        transactionNumber:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.transactionId
            : el.data.mode.toLowerCase() == "card"
              ? el.data.modeDetails.transactionId
              : undefined,
        netBankingType:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.netBankingType
            : undefined,
        UTRNumber:
          el.data.mode.toLowerCase() == "netbanking"
            ? el.data.modeDetails.transactionId
            : undefined,
        walletType:
          el.data.mode.toLowerCase() == "wallet"
            ? el.data.modeDetails.walletType
            : undefined,
      };
      o.modeData.data = el.data;
      rrefundtxns.push(o);
    }
    let rbankstmtsPaginated = await Paginator(rbankstmts, page, per_page);
    let nrbankstmtsPaginated = await Paginator(nrbankstmts, page, per_page);
    let reconrefundbankstmts = await Paginator(rrefundbankst, page, per_page);
    let result = {
      status: "success",
      data: {
        id: recondata.reconciliationId,
        date: recondata.updatedAt,
        feesAmount: recondata.reconciledAmount,
        attemptedTransactions: recondata.attemptedFeeLedgers,
        reconciledTransactions: recondata.reconciledFeeLedgers,
        reconciledRefundTransactions: 0,
        refundAmount: 0,
        percentage: (parseFloat(recondata.reconciledPercent) * 100).toFixed(2),
        Item: {
          reconciledTransactionsDetails: {
            page: rfeeledgersPaginated.page,
            perPage: rfeeledgersPaginated.perPage,
            nextPage: rfeeledgersPaginated.nextPage,
            totalRecord: rfeeledgersPaginated.totalRecord,
            totalPages: rfeeledgersPaginated.totalPages,
            data: rfldataa,
          },
          reconciledBankStmtEntryDetails: rbankstmtsPaginated,
          nonreconciledTransactionsDetails: {
            page: nrfeeledgersPaginated.page,
            perPage: nrfeeledgersPaginated.perPage,
            nextPage: nrfeeledgersPaginated.nextPage,
            totalRecord: nrfeeledgersPaginated.totalRecord,
            totalPages: nrfeeledgersPaginated.totalPages,
            data: nrfldataa,
          },
          nonreconciledBankStmtEntryDetails: nrbankstmtsPaginated,
          reconciledRefundTransactionsDetails: {
            page: rrefundfeeledgersPaginated.page,
            perPage: rrefundfeeledgersPaginated.perPage,
            nextPage: rrefundfeeledgersPaginated.nextPage,
            totalRecord: rrefundfeeledgersPaginated.totalRecord,
            totalPages: rrefundfeeledgersPaginated.totalPages,
            data: rrefundtxns,
          },
          reconciledRefundBankStmtEntryDetails: reconrefundbankstmts,
        },
        status: recondata.status,
      },
    };

    return result;
  } catch (err) {
    console.log("error", err);
    return { status: "failure", message: "reconciliation: " + err.message };
  }
}

async function reset(dbName, mongoDbUrl) {
  const dbConnection = await createDatabase(dbName, mongoDbUrl);
  try {
    let TransactionsModel = dbConnection.model(
      transactionsCollectionName,
      transactionsSchema
    );
    let reconciliationListModel = dbConnection.model(
      "reconciliationmanagers",
      reconciliationManagerSchema
    );
    let banktxnsMappingModel = dbConnection.model(
      bankTxnsMappingCollectionName,
      bankTxnsMappingSchema
    );

    await reconciliationListModel.deleteMany({});
    await banktxnsMappingModel.deleteMany({});
    await TransactionsModel.updateMany(
      {},
      // { reconciliationStatus: "initial" , softwareReconciled: false}
      {
        reconciliationStatus: "initial",
      }
    );
    console.log("Reset reconciled entries in transactions.");

    let BseModel = dbConnection.model(bseCollectionName, bseSchema);
    await BseModel.deleteMany({});
    console.log("Reset reconciled entries in bankstatemententries.");
  } catch (err) {
    console.log(err);
  } finally {
    dbConnection.close();
  }
} // reset
