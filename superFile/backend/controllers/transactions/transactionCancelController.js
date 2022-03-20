const { createDatabase } = require("../../utils/db_creation");
const feesLedgerSchema = require("../../models/feesLedgerModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const orgListSchema = require("../../models/orglists-schema");
const reconciliationTransactionsSchema = require("../../models/reconciliationTransactionsModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const mongoose = require("mongoose");
const transactionSchema = require("../../models/transactionsModel");
const StudentSchema = require("../../models/studentModel");
const {
  transactionCancelTemplate,
} = require("../../utils/helper_functions/templates/transactionCancelTemplate");
const { sendEmail } = require("../emailController");

module.exports.getCancelTransaction = async (req, res) => {
  try {
    let page = Number(req.query.page);
    let per_page = Number(req.query.perPage);
    dbConnection = await createDatabase(
      req.headers.orgId,
      req.headers.resource
    );
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );
    let feeLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
    let studentModel = dbConnection.model("students", StudentSchema);
    let params = { status: "Cancelled" };
    let transactions2 = await transactionModel.find(params);
    let resultPaginated = await Paginator(transactions2, page, per_page);
    let transactions = resultPaginated.data;
    if (transactions.length == 0) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.send(resultPaginated);
    } else if (transactions.length > 0) {
      let count = 0;
      for (i = 0; i < transactions.length; i++) {
        count++;
        // let reltrans = await transactionModel.findOne({ displayName: transactions[i].relatedTransactions[0] })
        let student = await studentModel.findOne({
          _id: mongoose.Types.ObjectId(transactions[i].studentId),
        });

        let fbups = [];
        let relledger;
        if (transactions[i].data.feesBreakUp) {
          for (j = 0; j < transactions[i].data.feesBreakUp.length; j++) {
            let relledgers = await feeLedgerModel.find({
              transactionId: transactions[i]._id,
              feeTypeCode: transactions[i].data.feesBreakUp[j].feeTypeCode,
            });
            // console.log(relledgers, transactions[i]._doc.amount)
            relledger = await relledgers.find(
              (item) =>
                Number(item._doc.paidAmount) ==
                Number(transactions[i]._doc.amount)
            );
            let feesbup = {
              feeTypeCode: transactions[i].data.feesBreakUp[j].feeTypeCode,
              feeType: transactions[i].data.feesBreakUp[j].feeType,
              paidAmount:
                relledgers[0] !== undefined ? relledgers[0].paidAmount : 0,
              pendingAmount:
                relledgers[0] !== undefined ? relledgers[0].pendingAmount : 0,
              status:
                relledgers[0] !== undefined ? relledgers[0].status : "Partial",
            };
            fbups.push(feesbup);
          }
        } else {
          let feesbup = {
            feeTypeCode: null,
            feeType: null,
            paidAmount: 0,
            pendingAmount: 0,
            status: "Partial",
          };
          fbups.push(feesbup);
        }
        transactions[i]._doc.feesBreakup = fbups;
        transactions[i]._doc.regId = student._doc.regId;
        if (count == transactions.length) {
          resultPaginated.data = transactions;
          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Access-Control-Allow-Methods",
            "GET,HEAD,OPTIONS,POST,PUT"
          );
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
          );
          res.send(resultPaginated);
        }
      }
    }

    // if(transactions==null)
  } catch (err) {
    dbConnection.close();
    res.json({
      status: "failure",
      message: "get cancel transaction: " + err.message,
    });
  } finally {
    dbConnection.close();
  }
};
module.exports.getActiveTransaction = async (req, res) => {
  try {
    let page = Number(req.query.page);
    let per_page = Number(req.query.perPage);
    dbConnectionp = await createDatabase(
      req.headers.orgId,
      req.headers.resource
    );
    let transactionModel = dbConnectionp.model(
      "transactions",
      transactionsSchema
    );
    let feeLedgerModel = dbConnectionp.model("feesledgers", feesLedgerSchema);
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let params = {
      status: { $in: ["Paid", "Partial"] },
      transactionSubType: "feePayment",
      displayName: { $regex: "RCPT_2020-21", $options: "i" },
    };
    let transactions2 = await transactionModel.find(params);
    let resultPaginated = await Paginator(transactions2, page, per_page);
    let transactions = resultPaginated.data;
    if (transactions.length == 0) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.send(resultPaginated);
    } else if (transactions.length > 0) {
      let count = 0;
      for (i = 0; i < transactions.length; i++) {
        count++;
        // let reltrans = await transactionModel.findOne({ displayName: transactions[i].relatedTransactions[0] })
        let student = await studentModel.findOne({
          _id: mongoose.Types.ObjectId(transactions[i].studentId),
        });

        let fbups = [];
        let relledger;
        if (transactions[i].data.feesBreakUp) {
          for (j = 0; j < transactions[i].data.feesBreakUp.length; j++) {
            let relledgers = await feeLedgerModel.find({
              transactionId: transactions[i]._id,
              feeTypeCode: transactions[i].data.feesBreakUp[j].feeTypeCode,
            });
            // console.log(relledgers, transactions[i]._doc.amount)
            relledger = await relledgers.find(
              (item) =>
                Number(item._doc.paidAmount) ==
                Number(transactions[i]._doc.amount)
            );
            let feesbup = {
              feeTypeCode: transactions[i].data.feesBreakUp[j].feeTypeCode,
              feeType: transactions[i].data.feesBreakUp[j].feeType,
              paidAmount:
                relledgers[0] !== undefined ? relledgers[0].paidAmount : 0,
              pendingAmount:
                relledgers[0] !== undefined ? relledgers[0].pendingAmount : 0,
              status:
                relledgers[0] !== undefined ? relledgers[0].status : "Partial",
            };
            fbups.push(feesbup);
          }
        } else {
          let feesbup = {
            feeTypeCode: null,
            feeType: null,
            paidAmount: 0,
            pendingAmount: 0,
            status: "Partial",
          };
          fbups.push(feesbup);
        }
        transactions[i]._doc.feesBreakup = fbups;
        transactions[i]._doc.regId = student._doc.regId;
        if (count == transactions.length) {
          resultPaginated.data = transactions;
          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Access-Control-Allow-Methods",
            "GET,HEAD,OPTIONS,POST,PUT"
          );
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
          );
          res.send(resultPaginated);
        }
      }
    }

    // if(transactions==null)
  } catch (err) {
    dbConnectionp.close();
    res.json({
      status: "failure",
      message: "get active transaction: " + err.message,
    });
  } finally {
    dbConnectionp.close();
  }
};

module.exports.cancelTransactionOld = async (req, res) => {
  try {
    let input = req.body[0];
    dbConnection = await createDatabase(
      req.headers.orgId,
      req.headers.resource
    );
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );
    let feesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
    let studentFeeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let studentModel = dbConnection.model("students", StudentSchema);
    let transactionstatus = req.query.status;
    let canceldata = await transactionModel.find({ status: "Cancelled" });
    const settingsSchema = mongoose.Schema({}, { strict: false });
    const settingsModel = dbConnection.model(
      "settings",
      settingsSchema,
      "settings"
    );
    const orgSettings = await settingsModel.find({});
    // let fbmap = input.data.feesBreakUp.map(function (el) {
    //     var o = Object.assign({}, el);
    //     o.amount = ~Number(o.amount) + 1
    //     return o;
    // })
    let tdate = new Date();
    let transdta = await transactionModel.find({
      displayName: { $regex: "RCPT_2020-21", $options: "i" },
    });
    let stuData = await studentModel.findOne({
      _id: mongoose.Types.ObjectId(input.studentId),
    });
    let transactionPayload = {
      feesLedgerIds: input.feesLedgerIds,
      emailCommunicationRefIds: input.emailCommunicationRefIds,
      smsCommunicationRefIds: input.smsCommunicationRefIds,
      relatedTransactions: input.relatedTransactions,
      displayName: `RCPT_2020-21_${
        transdta.length < 9 ? "00" : transdta.length < 99 ? "0" : ""
      }${Number(transdta.length) + 1}`,
      cancellationId: `CNCL_2020-21_${
        canceldata.length < 9 ? "00" : canceldata.length < 99 ? "0" : ""
      }${Number(canceldata.length) + 1}`,
      transactionType: input.transactionType,
      transactionSubType: "cancellation",
      transactionDate: tdate,
      studentId: input.studentId,
      studentRegId: input.regId,
      studentName: input.studentName,
      class: input.class,
      academicYear: input.academicYear,
      programPlan: input.programPlan,
      amount: ~Number(input.amount) + 1,
      dueDate: input.dueDate,
      status: "Partial",
      data: {
        orgId: input.data.orgId,
        displayName: `RCPT_2020-21_${
          transdta.length < 9 ? "00" : transdta.length < 99 ? "0" : ""
        }${Number(transdta.length) + 1}`,
        transactionType: "eduFees",
        transactionSubType: "cancellation",
        mode: "cancel",
        method: "otc",
        modeDetails: {
          netBankingType: null,
          walletType: null,
          instrumentNo: null,
          instrumentDate: tdate,
          bankName: null,
          cardDetails: {
            cardType: null,
            nameOnCard: null,
            cardNumber: null,
          },
          transactionId: null,
          remarks: "",
        },
      },
      createdBy: req.headers.orgId,
      reasonForCancel: input.reasonForCancel, // Cancelled time add reason
    };
    let newtransaction = new transactionModel(transactionPayload);
    let feesLedgerIds = [];
    let feeledgers = [];
    for (let i = 0; i < input.feesLedgerIds.length; i++) {
      let ledgerdata = await feesLedgerModel.findOne({
        _id: mongoose.Types.ObjectId(input.feesLedgerIds[i]),
      });
      let leddata = ledgerdata._doc;
      let feeLedgerPayload = {
        transactionId: newtransaction._id,
        transactionDate: leddata.transactionDate,
        transactionDisplayName: transactionPayload.displayName,
        primaryTransaction: leddata.primaryTransaction,
        feeTypeCode: leddata.feeTypeCode,
        dueAmount: ~Number(leddata.dueAmount) + 1,
        pendingAmount: ~Number(leddata.pendingAmount) + 1,
        transactionType: leddata.transactionType,
        transactionSubType: leddata.transactionSubType,
        studentId: leddata.studentId,
        studentRegId: leddata.studentRegId,
        studentName: leddata.studentName,
        academicYear: leddata.academicYear,
        class: leddata.class,
        programPlan: leddata.programPlan,
        status: "Pending",
        reasonForCancel: input.reasonForCancel, // Cancelled time add reason
      };
      let newFeeledger = new feesLedgerModel(feeLedgerPayload);
      feeledgers.push(newFeeledger);
      feesLedgerIds.push(newFeeledger._id);
      await newFeeledger.save();
    }

    newtransaction.feesLedgerIds = feesLedgerIds;
    await newtransaction.save();
    let studentFeemapdata = await studentFeeMapModel.findOne({
      studentId: mongoose.Types.ObjectId(input.studentId),
    });
    let stddata = studentFeemapdata._doc;
    let params = {
      $set: {
        paid: Number(stddata.paid) - Number(input.amount),
        pending: Number(stddata.pending) + Number(input.amount),
      },
    };
    let updatedstd = await studentFeeMapModel.updateOne(
      { _id: stddata._id },
      params
    );
    let updateTransaction = await transactionModel.updateOne(
      { _id: mongoose.Types.ObjectId(input._id) },
      {
        $set: {
          status: "Cancelled",
          cancellationId: `CNCL_2020-21_${
            canceldata.length < 9 ? "00" : canceldata.length < 99 ? "0" : ""
          }${Number(canceldata.length) + 1}`,
          reasonForCancel: input.reasonForCancel, // Cancelled time add reason
        },
      }
    );
    let updateFeeLedger = await feesLedgerModel.updateOne(
      { _id: mongoose.Types.ObjectId(input.feesLedgerIds[0]) },
      {
        $set: {
          status: "Cancelled",
          cancellationId: `CNCL_2020-21_${
            canceldata.length < 9 ? "00" : canceldata.length < 99 ? "0" : ""
          }${Number(canceldata.length) + 1}`,
          reasonForCancel: input.reasonForCancel, // Cancelled time add reason
        },
      }
    );
    let orgDetails = orgSettings[0]._doc;
    var allMaildata = {
      transactionId: input.data.modeDetails.transactionId,
      studentName: input.studentName,
    };
    const emailTemplate1 = await transactionCancelTemplate(
      orgDetails,
      allMaildata
    );
    // console.log(emailTemplate1, stuData._doc.email)
    let title = "ZQ Transactoin-Cancellation";
    sendEmail(
      orgDetails.emailServer[0].emailServer,
      stuData._doc.email,
      orgDetails.emailServer[0].emailAddress,
      title,
      emailTemplate1,
      []
    )
      .then((data) => {
        dbConnection.close();
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res.status(200).json({
          status: "success",
          message: `Transaction Cancellation Done for Student ${input.regId}`,
          data: {
            "updated Transaction": updateTransaction,
            updateFeeLedger: updateFeeLedger,
            "updated student fees": updatedstd,
            "new transaction": newtransaction,
            "new ledger": feeledgers,
          },
        });
      })
      .catch((err) => {
        dbConnection.close();
        res.status(500).send({
          status: "failure",
          message: "failed to send receipt email",
          data: err,
        });
      });
  } catch (err) {
    res.json({
      status: "failure",
      message: "get cancel transaction: " + err.message,
    });
  }
  // finally {
  //     dbConnection.close();
  // }
};

module.exports.cancelTransaction = async (req, res) => {
  let inputData = req.body;
  var allRes = [];
  for (singleInput of inputData) {
    if (singleInput.orgId) {
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
        _id: singleInput.orgId,
      });
      if (!orgData || orgData == null) {
        let obj = {
          success: false,
          message: "Organization data not found",
        };
        allRes.push(obj);
      } else {
        let dbConnection = await createDatabase(
          singleInput.orgId,
          orgData.connUri
        );
        const transactionModel = dbConnection.model(
          "transactions",
          transactionSchema,
          "transactions"
        );
        const feesLedgersModel = dbConnection.model(
          "feesledgers",
          feesLedgerSchema,
          "feesledgers"
        );
        var transactionDetails = await transactionModel.findOne({
          $or: [{ status: "Paid" }, { status: "Partial" }],
          studentRegId: singleInput.studentRegId,
          transactionSubType: "feePayment",
          displayName: singleInput.receiptId,
        });
        var cancelId = await getDisplayId(dbConnection);
        let tData = new Date().toISOString();
        let transactionPayload = {
          feesLedgerIds: transactionDetails.feesLedgerIds,
          emailCommunicationRefIds: transactionDetails.emailCommunicationRefIds,
          smsCommunicationRefIds: transactionDetails.smsCommunicationRefIds,
          relatedTransactions: [transactionDetails.displayName],
          displayName: cancelId,
          transactionType: transactionDetails.transactionType,
          transactionSubType: "cancellation",
          transactionDate: tData,
          studentId: transactionDetails.studentId,
          studentRegId: transactionDetails.regId,
          studentName: transactionDetails.studentName,
          class: transactionDetails.class,
          academicYear: transactionDetails.academicYear,
          programPlan: transactionDetails.programPlan,
          amount: transactionDetails.amount,
          dueDate: transactionDetails.dueDate,
          status: "cancelled",
          data: {
            orgId: transactionDetails.data.orgId,
            displayName: cancelId,
            transactionType: "eduFees",
            transactionSubType: "cancellation",
            mode: "cancel",
            method: "otc",
            modeDetails: transactionDetails.data.modeDetails,
          },
          createdBy: singleInput.userId, // Cancelled time add reason
        };
        // let createCancelTransaction = await ledgerEntry(
        //   { body: transactionPayload },
        //   dbConnection
        // );
        let obj = {
          success: true,
          data: transactionPayload,
        };
        allRes.push(obj);
      }
    } else {
      let obj = {
        success: false,
        message: "Invalid Org ID",
      };
      allRes.push(obj);
    }
  }
  res.status(200).send(allRes);
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

async function getDisplayId(dbConnection) {
  var getDatas = [];
  var transType = "";
  const rcptSchema = dbConnection.model(
    "transactions",
    transactionSchema,
    "transactions"
  );
  //   let rcptSchema = await dbConnection.model(
  //     "transactions",
  //     rcptModel,
  //     "transactions"
  //   );
  getDatas = await rcptSchema.find({ transactionSubType: "cancellation" });
  transType = "CANCEL";
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
