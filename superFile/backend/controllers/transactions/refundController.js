const studentSchema = require("../../models/studentModel");
const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const { sendEmail } = require("../emailController");
const {
  refundTemplate,
} = require("../../utils/helper_functions/templates/refundTemplate");
const { processTransaction } = require("./refundTransactionController");
const transactionSchema = require("../../models/transactionsModel");
const orgListSchema = require("../../models/orglists-schema");

const feesLedgerSchema = require("../../models/feesLedgerModel");

module.exports.MultipleRefund = async (req, res) => {
  let transactionType = "eduFees";
  let transactionSubType = "refund";
  let inputData = req.body;
  var allRes = [];

  for (singleDemand of inputData) {
    singleDemand.transactionType = transactionType;
    singleDemand.transactionSubType = transactionSubType;
    var Response;
    if (!singleDemand.data.orgId) {
      Response = {
        status: "failure",
        message: "Organization not found",
      };
    } else {
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
        _id: singleDemand.data.orgId,
      });
      if (!orgData || orgData == null) {
        Response = {
          status: "failure",
          message: "Organization data not found",
        };
      } else {
        centralDbConnection.close();
        let dbConnection = await createDatabase(
          singleDemand.data.orgId,
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
        const studentModel = dbConnection.model(
          "students",
          studentSchema,
          "students"
        );

        let transactionData = await feesLedgersModel.findOne({
          studentId: singleDemand.studentId,
          programPlan: singleDemand.programPlan,
          primaryTransaction: singleDemand.relatedTransactions[0],
          status: "Pending",
        });
        // let transactionData;
        // if (demandNoteSentData) {
        //   transactionData = await transactionModel.findOne({
        //     displayName: demandNoteSentData.primaryTransaction,
        //   });
        // }

        const aggregateData = [
          { $match: { _id: mongoose.Types.ObjectId(singleDemand.studentId) } },
          {
            $lookup: {
              from: "guardians",
              localField: "guardianDetails",
              foreignField: "_id",
              as: "guardian",
            },
          },
        ];
        let studentAggregateData = await studentModel.aggregate(aggregateData);
        let studentAggregate = studentAggregateData[0].guardian
          ? studentAggregateData[0].guardian[0]
          : {};
        singleDemand.studentName = `${studentAggregateData[0].firstName} ${studentAggregateData[0].lastName}`;
        if (!singleDemand.emailCommunicationRefIds)
          singleDemand.emailCommunicationRefIds = studentAggregate.email;
        if (!singleDemand.smsCommunicationRefIds)
          singleDemand.smsCommunicationRefIds = studentAggregate.mobile;
        const findQuery = await transactionModel.find({
          transactionType,
          transactionSubType,
        });
        const nextId = await getNextId(findQuery);
        singleDemand.displayName = nextId;
        singleDemand.data.displayName = nextId;
        singleDemand.transactionDate = new Date().toISOString();
        singleDemand.data.issueDate = new Date().toISOString();
        singleDemand.data.parentId = studentAggregate._id;
        singleDemand.status = "Pending";
        const settingsSchema = mongoose.Schema({}, { strict: false });
        const settingsModel = dbConnection.model(
          "settings",
          settingsSchema,
          "settings"
        );
        const orgSettings = await settingsModel.find({});
        let orgDetails = orgSettings[0]._doc;
        const { emailCommunicationRefIds } = singleDemand;

        let emailTemplate = refundTemplate(orgDetails, singleDemand);
        // if (transactionData) {
        //   emailTemplate = refundTemplate(orgDetails, [transactionData]);
        // }
        if (!transactionData) {
          let demandNoteData = await processTransaction(
            { body: singleDemand },
            dbConnection
          );
          let sentMail = await sendEmail(
            orgDetails.emailServer[0].emailServer,
            emailCommunicationRefIds,
            orgDetails.emailServer[0].emailAddress,
            "ZQ EDU-Refund",
            emailTemplate,
            []
          );
          Response = { success: true, type: "ledger", demandNoteData };
        } else {
          let sentMail = await sendEmail(
            orgDetails.emailServer.emailServer,
            emailCommunicationRefIds,
            orgDetails.emailServer.emailAddress,
            "ZQ EDU-Refund",
            emailTemplate,
            []
          );
          Response = { success: true, message: "Refund Email Sent" };
        }
      }
    }
    allRes.push(Response);
  }

  if (allRes[0].type === "ledger") {
    res.status(200).json({
      status: "success",
      message: allRes.length + " ledger entries added",
    });
  } else if (allRes[0].success === true) {
    res.status(200).json({
      status: "success",
      message: allRes[0].message,
    });
  } else {
    res.status(400).json({
      status: "failed",
      Error: allRes,
    });
  }

  // if (successMsg[0]) {
  //   res.status(201).send(successMsg);
  // } else {
  //   res.status(400).send(failedMsg);
  // }
};

module.exports.createRefund = async (req, res) => {
  let transactionType = "eduFees";
  let transactionSubType = "refund";
  let singleDemand = req.body;
  singleDemand.transactionType = transactionType;
  singleDemand.transactionSubType = transactionSubType;

  if (!singleDemand.data.orgId) {
    res.status(404).json({
      status: "failure",
      message: "Organization not found",
    });
  } else {
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
      _id: singleDemand.data.orgId,
    });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(404).json({
        status: "failure",
        message: "Organization data not found",
      });
    } else {
      centralDbConnection.close();
      let dbConnection = await createDatabase(
        singleDemand.data.orgId,
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
      const studentModel = dbConnection.model(
        "students",
        studentSchema,
        "students"
      );

      let transactionData = await feesLedgersModel.findOne({
        studentId: singleDemand.studentId,
        programPlan: singleDemand.programPlan,
        primaryTransaction: singleDemand.relatedTransactions[0],
        status: "Pending",
      });

      // let transactionData;
      // if (demandNoteSentData) {
      //   transactionData = await transactionModel.findOne({
      //     displayName: demandNoteSentData.primaryTransaction,
      //   });
      // }

      const aggregateData = [
        { $match: { _id: mongoose.Types.ObjectId(singleDemand.studentId) } },
        {
          $lookup: {
            from: "guardians",
            localField: "guardianDetails",
            foreignField: "_id",
            as: "guardian",
          },
        },
      ];
      let studentAggregateData = await studentModel.aggregate(aggregateData);
      let studentAggregate = studentAggregateData[0].guardian
        ? studentAggregateData[0].guardian[0]
        : {};
      singleDemand.studentName = `${studentAggregateData[0].firstName} ${studentAggregateData[0].lastName}`;
      if (!singleDemand.emailCommunicationRefIds)
        singleDemand.emailCommunicationRefIds = studentAggregate.email;
      if (!singleDemand.smsCommunicationRefIds)
        singleDemand.smsCommunicationRefIds = studentAggregate.mobile;
      const findQuery = await transactionModel.find({
        transactionType,
        transactionSubType,
      });
      const nextId = await getNextId(findQuery);
      singleDemand.displayName = nextId;
      singleDemand.data.displayName = nextId;
      singleDemand.transactionDate = new Date().toISOString();
      singleDemand.data.issueDate = new Date().toISOString();
      singleDemand.data.parentId = studentAggregate._id;
      singleDemand.status = "Pending";
      const settingsSchema = mongoose.Schema({}, { strict: false });
      const settingsModel = dbConnection.model(
        "settings",
        settingsSchema,
        "settings"
      );
      const orgSettings = await settingsModel.find({});
      let orgDetails = orgSettings[0]._doc;
      const { emailCommunicationRefIds } = singleDemand;

      let emailTemplate = refundTemplate(orgDetails, singleDemand);
      // if (transactionData) {
      //   emailTemplate = refundTemplate(orgDetails, [transactionData]);
      // }
      if (!transactionData) {
        let refundData = await processTransaction(
          { body: singleDemand },
          dbConnection
        );
        if (refundData.status == "failure") {
          dbConnection.close();
          return res.status(400).send(refundData);
        } else {
          sendEmail(
            orgDetails.emailServer[0].emailServer,
            emailCommunicationRefIds,
            orgDetails.emailServer[0].emailAddress,
            "ZQ EDU-Refund",
            emailTemplate,
            []
          );
          dbConnection.close();
          res.status(200).json({ success: true, refundData });
        }
      } else {
        sendEmail(
          orgDetails.emailServer[0].emailServer,
          emailCommunicationRefIds,
          orgDetails.emailServer[0].emailAddress,
          "ZQ EDU-Refund",
          emailTemplate,
          []
        );
        dbConnection.close();
        res.status(200).json({ success: true, message: "Refund Email Sent" });
      }
    }
  }
};
module.exports.updateRefund = async (req, res) => {
  let refundId = req.params.id;
  let orgId = req.query.orgId;
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
    _id: orgId,
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(404).json({
      status: "failure",
      message: "Organization data not found",
    });
  } else {
    centralDbConnection.close();
    let dbConnection = await createDatabase(orgId, orgData.connUri);
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
    const studentModel = dbConnection.model(
      "students",
      studentSchema,
      "students"
    );

    let transactionData = await transactionModel.findOne({
      displayName: refundId,
      status: "Pending",
    });
    let updateData = {
      status: "Refunded",
      data: inputData.data,
    };
    transactionModel
      .updateOne({ displayName: refundId }, updateData)
      .then(function (data) {
        console.log("data", data);
        if (data.nModified) {
          let ledgerData = {
            status: "Refunded",
          };
          feesLedgersModel
            .updateOne({ transactionDisplayName: refundId }, ledgerData)
            .then(function (data1) {
              if (data1.nModified)
                return res.status(200).json({
                  success: true,
                  message: "Refund data has been updated successfully",
                });
              else
                return res.json({
                  success: false,
                  message: "Ledger not updated",
                });
            });
        } else {
          return res.json({
            success: false,
            message: "Transaction not updated",
          });
        }
      });
  }
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
module.exports.getRefund = async (req, res) => {
  let orgId = req.query.orgId;
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
    _id: orgId,
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(404).json({
      status: "failure",
      message: "Organization data not found",
    });
  } else {
    centralDbConnection.close();
    let dbConnection = await createDatabase(orgId, orgData.connUri);
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
    const studentModel = dbConnection.model(
      "students",
      studentSchema,
      "students"
    );

    let transactionData = await transactionModel.find({
      transactionSubType: "refund",
    });
    if (transactionData) {
      let paginated = await Paginator(
        transactionData,
        req.query.page,
        req.query.limit
      );
      res.status(200).json(paginated);
      // res.status(200).json({
      //   success: true,
      //   message: "Get all Refunds",
      //   data: paginated.data,
      // });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Failed to get refunds" });
    }
  }
};
module.exports.transactionsListForRefund = async (req, res) => {
  let orgId = req.query.orgId;
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
    _id: orgId,
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(404).json({
      status: "failure",
      message: "Organization data not found",
    });
  } else {
    try{
      let dbConnection = await createDatabase(orgId, orgData.connUri);
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
      const studentModel = dbConnection.model(
        "students",
        studentSchema,
        "students"
      );
  
      let transactionData = await transactionModel.find({
        studentRegId: req.query.studentId, transactionSubType: "feePayment",
      });
      // let stddata  = await studentModel.findOne({_id:transactionData[0]._doc.studentId});
      if (transactionData) {
        let paginated = await Paginator(
          transactionData,
          req.query.page,
          req.query.limit
        );
        res.status(200).json(paginated);
        // res.status(200).json({
        //   success: true,
        //   message: "Get all Refunds",
        //   data: paginated.data,
        // });
      } else {
        res
          .status(400)
          .json({ success: false, message: "Failed to get refunds" });
      }
    }catch (err) {
    console.log(err.stack);
  } finally {
    centralDbConnection.close();
    dbConnection.close();
  }
  }
}
async function getNextId(result) {
  let txnData = {
    transactionType: "eduFees",
    transactionSubType: "refund",
    transactionPattern: {
      txnCode: "RF",
      txnCodePeriodSeparator: "_",
      period: "YYYY-YY",
      periodDigitSeparator: "_",
      noOfDigits: 3,
    },
  };
  const {
    transactionType,
    transactionSubType,
    transactionPattern: {
      txnCode,
      txnCodePeriodSeparator,
      period,
      periodDigitSeparator,
      noOfDigits,
    },
  } = txnData;
  const type = txnCode;
  var date = new Date();
  let financialYear = getDates(period, date);
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
  let initial = `${type}${txnCodePeriodSeparator}${financialYear}${periodDigitSeparator}${padLeft(
    1,
    noOfDigits
  )}`;
  let dataArr = [];
  let check;
  let finalVal;
  const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
  let regexVariable =
    txnCodePeriodSeparator === periodDigitSeparator
      ? txnCodePeriodSeparator
      : `${txnCodePeriodSeparator}${periodDigitSeparator}`;
  let regex = new RegExp(regexVariable);
  if (!result || !result.length) {
    return initial;
  } else {
    result.forEach((el) => {
      if (el["displayName"]) {
        let filStr = el["displayName"].split(regex);
        let typeStr = filStr[0];
        let typeYear = filStr[1];
        if (typeStr === type && typeYear == financialYear) {
          check = true;
          dataArr.push(el["displayName"]);
        }
      }
    });
    if (!check) {
      const perviousPattern = await getPatternFromChangeHistory();
      return initial;
    }
    let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split(regex);
    let lastCountNo = Number(lastCount[2]) + 1;
    lastCountNo = padLeft(lastCountNo, noOfDigits);
    lastCount[2] = lastCountNo;
    finalVal = `${type}${txnCodePeriodSeparator}${financialYear}${periodDigitSeparator}${lastCount[2]}`;
    return finalVal;
  }
}
function getDates(dateFormat, date) {
  let parsedDate;
  const dateFormats = [
    "YYYY-YY",
    "YY-YY",
    "YYYY",
    "YY",
    "MM-YY",
    "Mmm-YY",
    "ddmmyyyy",
    "ddmmyy",
    "ddMmmyyyy",
  ];
  var mL = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  var mS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  switch (dateFormat) {
    case dateFormats[0]:
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
      parsedDate = finYear;
      break;
    case dateFormats[1]:
      var date = new Date();
      var month = date.getMonth();
      var finYear = "";
      if (month > 2) {
        var current = date.getFullYear();
        current = String(current).substr(String(current).length - 2);
        var prev = Number(date.getFullYear()) + 1;
        prev = String(prev).substr(String(prev).length - 2);
        finYear = `${current}-${prev}`;
      } else {
        var current = date.getFullYear();
        current = String(current).substr(String(current).length - 2);
        var prev = Number(date.getFullYear()) - 1;
        prev = String(prev).substr(String(prev).length - 2);
        finYear = `${prev}-${current}`;
      }
      parsedDate = finYear;
      break;
    case dateFormats[2]:
      var date = new Date();
      var current = date.getFullYear();
      parsedDate = current;
      break;
    case dateFormats[3]:
      var date = new Date();
      var current = date.getFullYear();
      current = String(current).substr(String(current).length - 2);
      parsedDate = current;
      break;
    case dateFormats[4]:
      var date = new Date();
      var current = date.getFullYear();
      current = String(current).substr(String(current).length - 2);
      var month = date.getMonth() + 1;
      month = month < 10 ? `0${month}` : month;
      parsedDate = `${month}-${current}`;
      break;
    case dateFormats[5]:
      var date = new Date();
      var current = date.getFullYear();
      current = String(current).substr(String(current).length - 2);
      var month = date.getMonth();
      month = mS[month];
      parsedDate = `${month}-${current}`;
      break;
    case dateFormats[6]:
      var date = new Date();
      var current = date.getFullYear();
      var month = date.getMonth() + 1;
      month = month < 10 ? `0${month}` : month;
      parsedDate = `${date.getDate()}${month}${current}`;
      break;
    case dateFormats[7]:
      var date = new Date();
      var current = date.getFullYear();
      current = String(current).substr(String(current).length - 2);
      var month = date.getMonth() + 1;
      month = month < 10 ? `0${month}` : month;
      parsedDate = `${date.getDate()}${month}${current}`;
      break;
    case dateFormats[8]:
      var date = new Date();
      var current = date.getFullYear();
      var month = date.getMonth();
      month = mS[month];
      parsedDate = `${date.getDate()}${month}${current}`;
      break;
  }
  return parsedDate;
}
function padLeft(nr, n, str) {
  return Array(n - String(nr).length + 1).join(str || "0") + nr;
}
