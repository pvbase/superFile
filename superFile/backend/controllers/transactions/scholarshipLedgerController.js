const { processTransaction } = require("./transactionTestController");
const {
  processTransactionScholarship,
} = require("./scholarshipTransactionController");
const { createDatabase } = require("../../utils/db_creation");
const orgListSchema = require("../../models/orglists-schema");
const StudentSchema = require("../../models/studentModel");
const transactionsSchema = require("../../models/transactionsModel");
const FeeStructureSchema = require("../../models/feeStructureModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const GuardianSchema = require("../../models/guardianModel");
const programPlanSchema = require("../../models/programPlanModel");
const AWS = require("aws-sdk");
const feesLedgerSchema = require("../../models/feesLedgerModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const mongoose = require("mongoose");
const { sendEmail } = require("../emailController");

const {
  feePaymentTemplate,
} = require("../../utils/helper_functions/templates/feePaymentSuccess");

module.exports.createScholarshipLedger = async (req, res) => {
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
    _id: inputData.orgId,
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
    var scholarshipId = await getDisplayId(dbConnection);
    let ledgerData = {
      displayName: scholarshipId,
      transactionDate: inputData.transactionDate,
      relatedTransactions: inputData.relatedTransactions,
      transactionType: "eduFees",
      transactionSubType: "scholarship",
      amount: inputData.amount,
      pendingAmount: inputData.pendingAmount,
      paymentTransactionId: inputData.transactionId,
      studentId: inputData.studentId,
      studentRegId: inputData.studentRegId,
      studentName: inputData.studentName,
      academicYear: inputData.academicYear,
      class: inputData.class,
      status: "Santioned",
      programPlan: inputData.programPlan,
      data: {
        feeTypeCode: inputData.feeTypeCode,
        orgId: inputData.orgId,
        displayName: scholarshipId,
        transactionType: "eduFees",
        transactionSubType: "scholarship",
        scholarshipType: inputData.scholarshipType,
        dateOfReceipt: inputData.dateOfReceipt,
        scholarshipProvider: inputData.scholarshipProvider,
        amountReceived: inputData.amountReceived,
        modeofPayment: inputData.modeofPayment,
        receivedBank: inputData.receivedBank,
        accNumber: inputData.accNumber,
        utrNumber: inputData.utrNumber,
        amountSanctioned: inputData.amountSanctioned,
      },
      createdBy: inputData.orgId,
    };
    processTransactionScholarship({ body: ledgerData }, dbConnection)
      .then(async (paymentData) => {
        if (paymentData.status == "failure") {
          return res.status(400).send(paymentData);
        } else {
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

          let dbConnection2 = await createDatabase(
            String(orgData._id),
            orgData.connUri
          );
          const settingsSchema = mongoose.Schema({}, { strict: false });
          const settingsModel = dbConnection2.model(
            "settings",
            settingsSchema,
            "settings"
          );
          const orgSettings = await settingsModel.find({});
          let orgDetails = orgSettings[0]._doc;
          let feeMapModel = dbConnection2.model(
            "studentfeesmaps",
            StudentFeeMapSchema
          );
          let feMapDe = await feeMapModel.findOne({
            displayName: inputData.studentFeeMap,
          });
          let paidA = Number(feMapDe.paid) + Number(inputData.amount);
          let pend = Number(feMapDe.amount) - Number(paidA);
          let transactionDetails;
          let emailTemplate;
          if (pend < inputData.amount) {
            transactionDetails = {
              demandNote: quotedIds,
              transactionId: inputData.utrNumber,
              mode: "",
              amount: inputData.amount,
              type: "scholarships",
              name: inputData.studentName,
              id: inputData.transactionId,
            };
            emailTemplate = feePaymentTemplate(orgDetails, transactionDetails);
          } else {
            transactionDetails = {
              demandNote: quotedIds,
              transactionId: inputData.utrNumber,
              mode: inputData.modeofPayment,
              amount: inputData.amount,
              type: "",
            };
            emailTemplate = feePaymentTemplate(orgDetails, transactionDetails);
          }

          let emailCommunicationRefIds = inputData.emailCommunicationRefIds;
          sendEmail(
            orgDetails.emailServer[0].emailServer,
            emailCommunicationRefIds,
            orgDetails.emailServer[0].emailAddress,
            "ZQ EDU-Payment Success",
            emailTemplate,
            []
          )
            .then(async (data) => {
              res.status(200).send(paymentData);
            })
            .catch((err) => {
              res.status(500).send({
                status: "failure",
                message: "failed to send email",
                data: err,
              });
              centralDbConnection.close() // new
              dbConnection.close() // new
            });
        }
      })
      .catch((err) => {
        centralDbConnection.close();
        dbConnection.close();
        res.status(500).send(err);
      });
  }
};

async function getDisplayId(dbConnection) {
  var getDatas = [];
  var transType = "";
  const rcptSchema = dbConnection.model(
    "transactions",
    transactionsSchema,
    "transactions"
  );
  getDatas = await rcptSchema.find({});
  transType = "SCH";
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

exports.getAllDemandNoteDetails = async function (req, res) {
  var dbUrl = req.headers.resource;
  let id = req.params.id;
  let transactionType = "eduFees";
  let transactionSubType = "demandNote";
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

    let studentDetails = await studentModel.findOne({
      regId: { $regex: new RegExp(id, "i") },
    });
    if (studentDetails == null) {
      return res
        .status(404)
        .json({ status: "failed", message: "Invalid Student ID" });
    }
    let guardianDetails = await guardianModel.findOne({
      _id: studentDetails.guardianDetails[0],
    });
    var studentFeeMapDetails = await feeMapModel.findOne({
      studentId: studentDetails._id,
    });
    let feeStructureDetails = await feeStructureModel.findOne({
      _id: studentFeeMapDetails.feeStructureId,
    });

    var programPlanDetails = await programPlanModel.findOne({
      _id: studentFeeMapDetails.programPlanId,
    });
    var transactionDetails = await transactionModel.find({
      studentRegId: id,
      transactionSubType: "demandNote",
    });

    let feeTypesAll = [];
    for (feeTypesI of feeStructureDetails.feeTypeIds) {
      let feeTypesDetails = await feeTypeModel.findOne({
        _id: feeTypesI,
      });
      let feeManagerDetails = await feeManagerModel.findOne({
        feeTypeId: feeTypesI,
      });
      let obj1 = {
        feeTypeId: feeTypesDetails._id,
        feeTypeCode: feeTypesDetails.displayName,
        amount: feeManagerDetails.feeDetails.totalAmount,
        feeType: feeTypesDetails.title,
      };
      feeTypesAll.push(obj1);
    }
    if (transactionDetails.length == 0) {
      const findQuery = await transactionModel.find({
        transactionType,
        transactionSubType,
      });
      const nextId = await getNextId(findQuery);
      let now = new Date().toISOString();
      let payL = {
        displayName: nextId,
        transactionType: transactionType,
        transactionSubType: transactionSubType,
        transactionDate: now,
        studentId: studentFeeMapDetails.studentId,
        studentRegId: studentDetails.regId,
        studentName: studentDetails.firstName + studentDetails.lastName,
        class: programPlanDetails.title,
        academicYear: programPlanDetails.academicYear,
        programPlan: studentFeeMapDetails.programPlanId,
        amount: studentFeeMapDetails.amount,
        dueDate: studentFeeMapDetails.dueDate,
        emailCommunicationRefIds: "",
        smsCommunicationRefIds: "",
        status: "Pending",
        relatedTransactions: [],
        orgId: dbName,
        data: {
          orgId: dbName,
          displayName: nextId,
          studentId: studentFeeMapDetails.studentId,
          studentRegId: studentDetails.regId,
          class: programPlanDetails.title,
          academicYear: programPlanDetails.academicYear,
          programPlan: studentFeeMapDetails.programPlanId,
          issueDate: dbName,
          dueDate: studentFeeMapDetails.dueDate,
          feesBreakUp: feeTypesAll,
        },
        createdBy: dbName,
        studentFeeMapId: studentFeeMapDetails.displayName,
      };

      let createDemand = await processTransaction({ body: payL }, dbConnection);

      if (createDemand.status == "success") {
        let dbConnection1 = await createDatabase(dbName, dbUrl);
        let transactionsModel = dbConnection1.model(
          "transactions",
          transactionsSchema
        );
        var transactionAll = await transactionsModel.find({
          status: "Pending",
          studentRegId: id,
          transactionSubType: "demandNote",
        });
        let feeLedgerData = [];
        for (oneLedger of transactionAll) {
          let obj = {
            demandNote: oneLedger,
            guardianDetails: guardianDetails,
            studentDetails: studentDetails,
            studentFeeMapDetails: studentFeeMapDetails,
            pending: studentFeeMapDetails.pending,
            paid: studentFeeMapDetails.paid,
            feeDetails: feeTypesAll,
          };
          feeLedgerData.push(obj);
        }
        res.status(200).json(feeLedgerData);
      } else {
        return res.status(400).json({
          success: false,
          message: "unable to create demand note",
          Error: createDemand.Error,
        });
      }
    } else {
      if (studentFeeMapDetails == null) {
        return res
          .status(404)
          .json({ status: "failed", message: "Invalid Student ID" });
      }

      let feeLedgerData = [];
      for (oneLedger of transactionDetails) {
        let obj = {
          demandNote: oneLedger,
          guardianDetails: guardianDetails,
          studentDetails: studentDetails,
          studentFeeMapDetails: studentFeeMapDetails,
          pending: studentFeeMapDetails.pending,
          paid: studentFeeMapDetails.paid,
          feeDetails: feeTypesAll,
        };
        feeLedgerData.push(obj);
      }
      res.status(200).json(feeLedgerData);
    }
  }
};

async function getNextId(result) {
  let txnData = {
    transactionType: "eduFees",
    transactionSubType: "demandNote",
    transactionPattern: {
      txnCode: "DN",
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

exports.getAllScholarshipTransactions = async function (req, res) {
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
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    let TxnModel = dbConnection.model("transactions", transactionsSchema);
    const txnData = await TxnModel.find({ transactionSubType: "scholarship" });
    if (txnData) {
      let paginated = await Paginator(txnData, req.query.page, req.query.limit);
      res.status(200).json(paginated);
    } else {
      res.status(400).json({ success: false });
    }
  }
};

exports.createBulkScholarships = async function (req, res) {
  let inputData = req.body;
  let orgId = req.query.orgId;
  let userId = req.query.userId;
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
    _id: req.query.orgId,
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    let nameSpace = orgData.nameSpace;
    let transactionType = "eduFees";
    let transactionSubType = "demandNote";
    let status = [];
    for (one of inputData) {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
      let id = one["student registration id"];

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

      let studentDetails = await studentModel.findOne({
        regId: id,
      });
      let finalYearStatus = studentDetails.isFinalYear;
      if (!studentDetails) {
        dbConnection.close();
        var obj = { success: false, message: "Invalid Student Information" };
        status.push(obj);
      } else {
        let guardianDetails = await guardianModel.findOne({
          _id: studentDetails.guardianDetails[0],
        });
        var studentFeeMapDetails = await feeMapModel.findOne({
          studentId: studentDetails._id,
        });
        let feeStructureDetails = await feeStructureModel.findOne({
          _id: studentFeeMapDetails.feeStructureId,
        });
        var programPlanDetails = await programPlanModel.findOne({
          _id: studentFeeMapDetails.programPlanId,
        });
        var transactionDetails = await transactionModel.find({
          studentRegId: id,
          transactionSubType: "demandNote",
        });
        var scholarshipData = await transactionModel.find({
          studentRegId: id,
          transactionSubType: "scholarship",
        });
        let feeTypesAll = [];

        for (feeTypesI of feeStructureDetails.feeTypeIds) {
          let feeTypesDetails = await feeTypeModel.findOne({
            _id: feeTypesI,
          });
          let feeManagerDetails = await feeManagerModel.findOne({
            feeTypeId: feeTypesI,
          });
          let obj1 = {
            feeTypeId: feeTypesDetails._id,
            feeTypeCode: feeTypesDetails.displayName,
            amount: feeManagerDetails.feeDetails.totalAmount,
            feeType: feeTypesDetails.title,
          };
          feeTypesAll.push(obj1);
        }
        const findQuery = await transactionModel.find({
          transactionType,
          transactionSubType,
        });
        const nextId = await getNextId(findQuery);
        if (transactionDetails.length == 0 && scholarshipData.length == 0) {
          let now = new Date().toISOString();
          let payL = {
            displayName: nextId,
            transactionType: transactionType,
            transactionSubType: transactionSubType,
            transactionDate: now,
            studentId: studentFeeMapDetails.studentId,
            studentRegId: studentDetails.regId,
            studentName: studentDetails.firstName + studentDetails.lastName,
            class: programPlanDetails.title,
            academicYear: programPlanDetails.academicYear,
            programPlan: studentFeeMapDetails.programPlanId,
            amount: studentFeeMapDetails.amount,
            dueDate: studentFeeMapDetails.dueDate,
            emailCommunicationRefIds: "",
            smsCommunicationRefIds: "",
            status: "Pending",
            relatedTransactions: [],
            orgId: orgId,
            data: {
              orgId: orgId,
              displayName: nextId,
              studentId: studentFeeMapDetails.studentId,
              studentRegId: studentDetails.regId,
              class: programPlanDetails.title,
              academicYear: programPlanDetails.academicYear,
              programPlan: studentFeeMapDetails.programPlanId,
              issueDate: orgId,
              dueDate: studentFeeMapDetails.dueDate,
              feesBreakUp: feeTypesAll,
            },
            createdBy: orgId,
            studentFeeMapId: studentFeeMapDetails.displayName,
            campusId: studentFeeMapDetails.campusId,
          };

          let createDemand = await processTransaction(
            { body: payL },
            dbConnection
          );

          if (createDemand.status == "success") {
            let dbConnection1 = await createDatabase(
              String(orgData._id),
              orgData.connUri
            );
            let transactionModels = dbConnection1.model(
              "transactions",
              transactionsSchema
            );
            let feeMapModel1 = dbConnection1.model(
              "studentfeesmaps",
              StudentFeeMapSchema
            );
            var scholarshipId = await getDisplayId(dbConnection1);

            let demandNoteData = await transactionModels.findOne({
              transactionType: "eduFees",
              transactionSubType: "demandNote",
              displayName: nextId,
            });
            var studentFeeMapDetails = await feeMapModel1.findOne({
              studentId: demandNoteData.studentId,
            });
            let ledgerData = {
              displayName: scholarshipId,
              transactionDate: one["date of receipt"],
              relatedTransactions: [demandNoteData.displayName],
              transactionType: "eduFees",
              transactionSubType: "scholarship",
              amount: Number(one["scholarship amount received"]),
              pendingAmount: studentFeeMapDetails.pending,
              paymentTransactionId: one["transaction id"],
              studentId: demandNoteData.studentId,
              studentRegId: demandNoteData.studentRegId,
              studentName: demandNoteData.studentName,
              campusId: demandNoteData.campusId,
              academicYear: demandNoteData.academicYear,
              class: demandNoteData.class,
              status: "Sanctioned",
              programPlan: demandNoteData.programPlan,
              data: {
                feeTypeCode: "FT001",
                orgId: orgId,
                displayName: scholarshipId,
                transactionType: "eduFees",
                transactionSubType: "scholarship",
                scholarshipType: one["scholarship type"],
                dateOfReceipt: one["date of receipt"],
                scholarshipProvider: one["scholarship provider"],
                amountReceived: Number(one["scholarship amount received"]),
                modeofPayment: one["mode of payment"],
                issuedBank: one["cheque/dd issued bank"],
                branch: one["branch"],
                receivedBank: one["institute bank name"],
                accNumber: one["institute bank account number"],
                utrNumber: one["utr number"],
                amountSanctioned: one["scholarship amount received"],
              },
              createdBy: orgId,
            };

            var createScholarship = await processTransactionScholarship(
              { body: ledgerData },
              dbConnection1
            );
            if (createScholarship.status == "failure") {
              dbConnection1.close();
              var objee = {
                status: false,
                message: "Unable to create scholarship payment ",
              };
              status.push(objee);
            } else {
              dbConnection1.close();
              //demandNote and Scholarship created

              var quotedIds = demandNoteData.displayName;
              let dbConnection2 = await createDatabase(
                String(orgData._id),
                orgData.connUri
              );
              const settingsSchema = mongoose.Schema({}, { strict: false });
              const settingsModel = dbConnection2.model(
                "settings",
                settingsSchema,
                "settings"
              );
              const orgSettings = await settingsModel.find({});
              let orgDetails = orgSettings[0]._doc;
              let feeMapModel = dbConnection2.model(
                "studentfeesmaps",
                StudentFeeMapSchema
              );
              let paidA =
                Number(studentFeeMapDetails.paid) +
                Number(one["scholarship amount received"]);
              let pend = Number(studentFeeMapDetails.amount) - Number(paidA);
              var emailData;
              //new logic
              //new logic
              if (finalYearStatus == true) {
                let scholarshipAmount = Number(
                  one["scholarship amount received"]
                );
                let pendingDue =
                  Number(studentFeeMapDetails.amount) -
                  Number(studentFeeMapDetails.paid) -
                  Number(scholarshipAmount);
                if (
                  pendingDue > 0 &&
                  Number(studentFeeMapDetails.amount) >
                    Number(studentFeeMapDetails.paid)
                ) {
                  emailData = {
                    demandNote: quotedIds,
                    transactionId: one["transaction id"],
                    mode: one["mode of payment"],
                    amount: Number(one["scholarship amount received"]),
                    type: "scholarships",
                    userId: userId,
                    nameSpace: nameSpace,
                    name:
                      studentDetails.firstName + " " + studentDetails.lastName,
                    id: one["transaction id"],
                    scholarshipId: scholarshipId,
                    status: "adjust",
                    orgId: orgId,
                    regId: studentDetails.regId,
                    details: {
                      status: "Adjust Only",
                      adjust: Math.abs(scholarshipAmount),
                      refund: 0,
                      adjustWith: "Current Year",
                    },
                  };
                } else if (
                  Number(studentFeeMapDetails.amount) <=
                  Number(studentFeeMapDetails.paid)
                ) {
                  emailData = {
                    demandNote: quotedIds,
                    transactionId: one["transaction id"],
                    mode: one["mode of payment"],
                    amount: Number(one["scholarship amount received"]),
                    type: "scholarships",
                    userId: userId,
                    nameSpace: nameSpace,
                    name:
                      studentDetails.firstName + " " + studentDetails.lastName,
                    id: one["transaction id"],
                    scholarshipId: scholarshipId,
                    status: "refund",
                    orgId: orgId,
                    regId: studentDetails.regId,
                    details: {
                      status: "Refund Only",
                      adjust: 0,
                      refund: Math.abs(pendingDue),
                      adjustWith: "",
                    },
                  };
                } else if (
                  pendingDue < 0 &&
                  Number(studentFeeMapDetails.amount) >
                    Number(studentFeeMapDetails.paid)
                ) {
                  emailData = {
                    demandNote: quotedIds,
                    transactionId: one["transaction id"],
                    mode: one["mode of payment"],
                    amount: Number(one["scholarship amount received"]),
                    type: "scholarships",
                    userId: userId,
                    nameSpace: nameSpace,
                    name:
                      studentDetails.firstName + " " + studentDetails.lastName,
                    id: one["transaction id"],

                    scholarshipId: scholarshipId,
                    status: "refund",
                    orgId: orgId,
                    regId: studentDetails.regId,
                    details: {
                      status: "Refund Only",
                      adjust: 0,
                      refund: Math.abs(pendingDue),
                      adjustWith: "",
                    },
                  };
                }
              } else {
                let scholarshipAmount = Number(
                  one["scholarship amount received"]
                );
                let pendingDue =
                  Number(studentFeeMapDetails.amount) -
                  Number(studentFeeMapDetails.paid) -
                  Number(scholarshipAmount);
                if (
                  pendingDue < 0 &&
                  Number(studentFeeMapDetails.amount) >
                    Number(studentFeeMapDetails.paid)
                ) {
                  emailData = {
                    demandNote: quotedIds,
                    transactionId: one["transaction id"],
                    mode: one["mode of payment"],
                    amount: Number(one["scholarship amount received"]),
                    type: "scholarships",
                    userId: userId,
                    nameSpace: nameSpace,
                    name:
                      studentDetails.firstName + " " + studentDetails.lastName,
                    id: one["transaction id"],
                    scholarshipId: scholarshipId,
                    status: "refundAdjust",
                    orgId: orgId,
                    regId: studentDetails.regId,
                    details: {
                      status: "adjustRefund",
                      adjust: Math.abs(pendingDue),
                      refund: Math.abs(pendingDue),
                      adjustWith: "Next Year",
                    },
                  };
                } else if (
                  Number(studentFeeMapDetails.amount) <=
                  Number(studentFeeMapDetails.paid)
                ) {
                  let refundable =
                    Number(studentFeeMapDetails.paid) -
                    Number(studentFeeMapDetails.amount);
                  emailData = {
                    demandNote: quotedIds,
                    transactionId: one["transaction id"],
                    mode: one["mode of payment"],
                    amount: Number(one["scholarship amount received"]),
                    type: "scholarships",
                    userId: userId,
                    nameSpace: nameSpace,
                    name:
                      studentDetails.firstName + " " + studentDetails.lastName,
                    id: one["transaction id"],
                    scholarshipId: scholarshipId,
                    status: "refundAdjust",
                    orgId: orgId,
                    regId: studentDetails.regId,
                    details: {
                      status: "adjustRefund",
                      adjust: {
                        refund: refundable,
                        adjust:
                          Math.abs(Number(pendingDue)) - Number(refundable),
                      },
                      refund: Math.abs(pendingDue),
                    },
                  };
                } else if (Number(pendingDue) > 0) {
                  emailData = {
                    demandNote: quotedIds,
                    transactionId: one["transaction id"],
                    mode: one["mode of payment"],
                    amount: Number(one["scholarship amount received"]),
                    type: "scholarships",
                    userId: userId,
                    nameSpace: nameSpace,
                    name:
                      studentDetails.firstName + " " + studentDetails.lastName,
                    id: one["transaction id"],
                    scholarshipId: scholarshipId,
                    status: "adjust",
                    orgId: orgId,
                    regId: studentDetails.regId,
                    details: {
                      status: "Adjust",
                      adjust: 0,
                      refund: 0,
                      adjustWith: "Current Year",
                    },
                  };
                }
              }
              //oldLogic
              // if (finalYearStatus == true) {
              //   let scholarshipAmount = Number(
              //     one["scholarship amount received"]
              //   );
              //   let pendingDue =
              //     studentFeeMapDetails.amount -
              //     studentFeeMapDetails.paid -
              //     scholarshipAmount;
              //   if (pendingDue > 0) {
              //     emailData = {
              //       demandNote: quotedIds,
              //       transactionId: one["transaction id"],
              //       mode: one["mode of payment"],
              //       amount: Number(one["scholarship amount received"]),
              //       type: "scholarships",
              //       name:
              //         studentDetails.firstName + " " + studentDetails.lastName,
              //       id: one["transaction id"],
              //       scholarshipId: scholarshipId,
              //       status: "adjust",
              //       orgId: orgId,
              //     };
              //   } else if (
              //     studentFeeMapDetails.amount < studentFeeMapDetails.paid
              //   ) {
              //     emailData = {
              //       demandNote: quotedIds,
              //       transactionId: one["transaction id"],
              //       mode: one["mode of payment"],
              //       amount: Number(one["scholarship amount received"]),
              //       type: "scholarships",
              //       name:
              //         studentDetails.firstName + " " + studentDetails.lastName,
              //       id: one["transaction id"],
              //       scholarshipId: scholarshipId,
              //       status: "refund",
              //       orgId: orgId,
              //     };
              //   } else {
              //     emailData = {
              //       demandNote: quotedIds,
              //       transactionId: one["transaction id"],
              //       mode: one["mode of payment"],
              //       amount: Number(one["scholarship amount received"]),
              //       type: "scholarships",
              //       name:
              //         studentDetails.firstName + " " + studentDetails.lastName,
              //       id: one["transaction id"],
              //       scholarshipId: scholarshipId,
              //       status: "refund",
              //       orgId: orgId,
              //     };
              //   }
              // } else {
              //   let scholarshipAmount = Number(
              //     one["scholarship amount received"]
              //   );
              //   let pendingDue =
              //     studentFeeMapDetails.amount -
              //     studentFeeMapDetails.paid -
              //     scholarshipAmount;
              //   console.log("pendingDue", pendingDue);
              //   if (pendingDue < 0) {
              //     console.log("no pending");
              //     emailData = {
              //       demandNote: quotedIds,
              //       transactionId: one["transaction id"],
              //       mode: one["mode of payment"],
              //       amount: Number(one["scholarship amount received"]),
              //       type: "scholarships",
              //       name:
              //         studentDetails.firstName + " " + studentDetails.lastName,
              //       id: one["transaction id"],
              //       scholarshipId: scholarshipId,
              //       status: "refundAdjust",
              //       orgId: orgId,
              //     };
              //   } else if (
              //     studentFeeMapDetails.amount > studentFeeMapDetails.paid
              //   ) {
              //     console.log(
              //       "actual",
              //       studentFeeMapDetails.amount > studentFeeMapDetails.paid
              //     );
              //     console.log("no more than actual amount");
              //     emailData = {
              //       demandNote: quotedIds,
              //       transactionId: one["transaction id"],
              //       mode: one["mode of payment"],
              //       amount: Number(one["scholarship amount received"]),
              //       type: "scholarships",
              //       name:
              //         studentDetails.firstName + " " + studentDetails.lastName,
              //       id: one["transaction id"],
              //       scholarshipId: scholarshipId,
              //       status: "refundAdjust",
              //       orgId: orgId,
              //     };
              //   } else if (pendingDue > 0) {
              //     console.log("pending");
              //     emailData = {
              //       demandNote: quotedIds,
              //       transactionId: one["transaction id"],
              //       mode: one["mode of payment"],
              //       amount: Number(one["scholarship amount received"]),
              //       type: "scholarships",
              //       name:
              //         studentDetails.firstName + " " + studentDetails.lastName,
              //       id: one["transaction id"],
              //       scholarshipId: scholarshipId,
              //       status: "adjust",
              //       orgId: orgId,
              //     };
              //   }
              // }
              let emailTemplate = await feePaymentTemplate(
                orgDetails,
                emailData
              );
              let emailCommunicationRefIds = studentDetails.email;
              let successEmail = await sendEmail(
                orgDetails.emailServer[0].emailServer,
                emailCommunicationRefIds,
                orgDetails.emailServer[0].emailAddress,
                "ZQ EDU-Scholarship Post Processing Report",
                emailTemplate,
                []
              );

              var resObj = {
                success: true,
                message: `Scholarship sanctioned for ${one["student registration id"]}`,
              };
              status.push(resObj);
            }
          } else {
            dbConnection.close();
            var obj = {
              success: false,
              Message: `Unable to create Demand Note for ${one["student registration id"]}`,
            };
            status.push(obj);
          }
        } else {
          let transactionModels = dbConnection.model(
            "transactions",
            transactionsSchema
          );
          let feeMapModel1 = dbConnection.model(
            "studentfeesmaps",
            StudentFeeMapSchema
          );
          var scholarshipId = await getDisplayId(dbConnection);
          var studentFeeMapDetails = await feeMapModel1.findOne({
            studentId: transactionDetails[0].studentId,
          });
          let ledgerData = {
            displayName: scholarshipId,
            transactionDate: one["date of receipt"],
            relatedTransactions: [transactionDetails[0].displayName],
            transactionType: "eduFees",
            transactionSubType: "scholarship",
            amount: Number(one["scholarship amount received"]),
            pendingAmount: studentFeeMapDetails.pending,
            paymentTransactionId: one["transaction id"],
            studentId: transactionDetails[0].studentId,
            studentRegId: transactionDetails[0].studentRegId,
            studentName: transactionDetails[0].studentName,
            academicYear: transactionDetails[0].academicYear,
            campusId: transactionDetails[0].campusId,
            class: transactionDetails[0].class,
            status: "Sanctioned",
            programPlan: transactionDetails[0].programPlan,
            data: {
              feeTypeCode: "FT001",
              orgId: orgId,
              displayName: scholarshipId,
              transactionType: "eduFees",
              transactionSubType: "scholarship",
              scholarshipType: one["scholarship type"],
              dateOfReceipt: one["date of receipt"],
              scholarshipProvider: one["scholarship provider"],
              amountReceived: Number(one["scholarship amount received"]),
              modeofPayment: one["mode of payment"],
              issuedBank: one["cheque/dd issued bank"],
              branch: one["branch"],
              receivedBank: one["institute bank name"],
              accNumber: one["institute bank account number"],
              utrNumber: one["utr number"],
              amountSanctioned: one["scholarship amount received"],
            },
            createdBy: orgId,
          };
          var createScholarship = await processTransactionScholarship(
            { body: ledgerData },
            dbConnection
          );
          if (createScholarship.status == "failure") {
            dbConnection.close();
            var objee = {
              status: false,
              message: "Unable to create scholarship payment ",
            };
            status.push(objee);
          } else {
            dbConnection.close();
            //demandNote and Scholarship created
            let demandNoteData = transactionDetails[0];
            var quotedIds = demandNoteData.displayName;
            let dbConnection2 = await createDatabase(
              String(orgData._id),
              orgData.connUri
            );
            const settingsSchema = mongoose.Schema({}, { strict: false });
            const settingsModel = dbConnection2.model(
              "settings",
              settingsSchema,
              "settings"
            );
            const orgSettings = await settingsModel.find({});
            let orgDetails = orgSettings[0]._doc;
            let feeMapModel = dbConnection2.model(
              "studentfeesmaps",
              StudentFeeMapSchema
            );
            let paidA =
              Number(studentFeeMapDetails.paid) +
              Number(one["scholarship amount received"]);
            let pend = Number(studentFeeMapDetails.amount) - Number(paidA);
            var emailData;
            //new logic

            if (finalYearStatus == true) {
              let scholarshipAmount = Number(
                one["scholarship amount received"]
              );
              let pendingDue =
                Number(studentFeeMapDetails.amount) -
                Number(studentFeeMapDetails.paid) -
                Number(scholarshipAmount);
              if (
                pendingDue > 0 &&
                Number(studentFeeMapDetails.amount) >
                  Number(studentFeeMapDetails.paid)
              ) {
                emailData = {
                  demandNote: quotedIds,
                  transactionId: one["transaction id"],
                  mode: one["mode of payment"],
                  amount: Number(one["scholarship amount received"]),
                  type: "scholarships",
                  userId: userId,
                  nameSpace: nameSpace,
                  name:
                    studentDetails.firstName + " " + studentDetails.lastName,
                  id: one["transaction id"],
                  scholarshipId: scholarshipId,
                  status: "adjust",
                  orgId: orgId,
                  regId: studentDetails.regId,
                  details: {
                    status: "Adjust Only",
                    adjust: Math.abs(scholarshipAmount),
                    refund: 0,
                    adjustWith: "Current Year",
                  },
                };
              } else if (
                Number(studentFeeMapDetails.amount) <=
                Number(studentFeeMapDetails.paid)
              ) {
                emailData = {
                  demandNote: quotedIds,
                  transactionId: one["transaction id"],
                  mode: one["mode of payment"],
                  amount: Number(one["scholarship amount received"]),
                  type: "scholarships",
                  userId: userId,
                  nameSpace: nameSpace,
                  name:
                    studentDetails.firstName + " " + studentDetails.lastName,
                  id: one["transaction id"],
                  scholarshipId: scholarshipId,
                  status: "refund",
                  orgId: orgId,
                  regId: studentDetails.regId,
                  details: {
                    status: "Refund Only",
                    adjust: 0,
                    refund: Math.abs(pendingDue),
                    adjustWith: "",
                  },
                };
              } else if (
                pendingDue < 0 &&
                Number(studentFeeMapDetails.amount) >
                  Number(studentFeeMapDetails.paid)
              ) {
                emailData = {
                  demandNote: quotedIds,
                  transactionId: one["transaction id"],
                  mode: one["mode of payment"],
                  amount: Number(one["scholarship amount received"]),
                  type: "scholarships",
                  userId: userId,
                  nameSpace: nameSpace,
                  name:
                    studentDetails.firstName + " " + studentDetails.lastName,
                  id: one["transaction id"],
                  scholarshipId: scholarshipId,
                  status: "refund",
                  orgId: orgId,
                  regId: studentDetails.regId,
                  details: {
                    status: "Refund Only",
                    adjust: 0,
                    refund: Math.abs(pendingDue),
                    adjustWith: "",
                  },
                };
              }
            } else {
              let scholarshipAmount = Number(
                one["scholarship amount received"]
              );
              let pendingDue =
                Number(studentFeeMapDetails.amount) -
                Number(studentFeeMapDetails.paid) -
                Number(scholarshipAmount);
              if (
                pendingDue < 0 &&
                Number(studentFeeMapDetails.amount) >
                  Number(studentFeeMapDetails.paid)
              ) {
                emailData = {
                  demandNote: quotedIds,
                  transactionId: one["transaction id"],
                  mode: one["mode of payment"],
                  amount: Number(one["scholarship amount received"]),
                  type: "scholarships",
                  userId: userId,
                  nameSpace: nameSpace,
                  name:
                    studentDetails.firstName + " " + studentDetails.lastName,
                  id: one["transaction id"],
                  scholarshipId: scholarshipId,
                  status: "refundAdjust",
                  orgId: orgId,
                  regId: studentDetails.regId,
                  details: {
                    status: "adjustRefund",
                    adjust: Math.abs(pendingDue),
                    refund: Math.abs(pendingDue),
                    adjustWith: "Next Year",
                  },
                };
              } else if (
                Number(studentFeeMapDetails.amount) <=
                Number(studentFeeMapDetails.paid)
              ) {
                let refundable =
                  Number(studentFeeMapDetails.paid) -
                  Number(studentFeeMapDetails.amount);
                emailData = {
                  demandNote: quotedIds,
                  transactionId: one["transaction id"],
                  mode: one["mode of payment"],
                  amount: Number(one["scholarship amount received"]),
                  type: "scholarships",
                  userId: userId,
                  nameSpace: nameSpace,
                  name:
                    studentDetails.firstName + " " + studentDetails.lastName,
                  id: one["transaction id"],
                  scholarshipId: scholarshipId,
                  status: "refundAdjust",
                  orgId: orgId,
                  regId: studentDetails.regId,
                  details: {
                    status: "adjustRefund",
                    adjust: {
                      refund: refundable,
                      adjust: Math.abs(Number(pendingDue)) - Number(refundable),
                    },
                    refund: Math.abs(pendingDue),
                  },
                };
              } else if (Number(pendingDue) > 0) {
                emailData = {
                  demandNote: quotedIds,
                  transactionId: one["transaction id"],
                  mode: one["mode of payment"],
                  amount: Number(one["scholarship amount received"]),
                  type: "scholarships",
                  userId: userId,
                  nameSpace: nameSpace,
                  name:
                    studentDetails.firstName + " " + studentDetails.lastName,
                  id: one["transaction id"],
                  scholarshipId: scholarshipId,
                  status: "adjust",
                  orgId: orgId,
                  regId: studentDetails.regId,
                  details: {
                    status: "Adjust",
                    adjust: 0,
                    refund: 0,
                    adjustWith: "Current Year",
                  },
                };
              }
            }
            let emailTemplate = await feePaymentTemplate(orgDetails, emailData);
            let emailCommunicationRefIds = studentDetails.email;
            var successEmail = await sendEmail(
              orgDetails.emailServer[0].emailServer,
              emailCommunicationRefIds,
              orgDetails.emailServer[0].emailAddress,
              "ZQ EDU-Scholarship Post Processing Report",
              emailTemplate,
              []
            );
            var resObj = {
              success: true,
              message: `Scholarship sanctioned for ${one["student registration id"]}`,
            };
            status.push(resObj);
          }
        }
      }
    }
    var respo = {
      totalCount: status.length,
      data: status,
    };
    res.send(respo);

    // if (status[0].success == true) {
    //   res.status(200).json({
    //     success: true,
    //     Message: "Scholarship Added into the ledger",
    //   });
    // } else {
    //   res.status(400).json({
    //     success: false,
    //     status,
    //   });
    // }
  }
};

exports.getStudentStatus = async function (req, res) {
  let inputData = req.body;
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
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    centralDbConnection.close();
    var allResponse = [];
    for (oneData of inputData) {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
      let studentModel = dbConnection.model("students", StudentSchema);
      let feeMapModel = dbConnection.model(
        "studentfeesmaps",
        StudentFeeMapSchema
      );
      let studentDetails = await studentModel.findOne({
        regId: { $regex: new RegExp(oneData.regId, "i") },
      });
      if (!studentDetails) {
        dbConnection.close();
        var obj = { success: false, message: "Invalid Student Information" };
        allResponse.push(obj);
      } else {
        var studentFeeMapDetails = await feeMapModel.findOne({
          studentId: studentDetails._id,
        });
        let finalYearStatus = studentDetails.isFinalYear;
        let emailData = [];
        if (finalYearStatus == true) {
          let scholarshipAmount = oneData.sanctionedAmount;
          let pendingDue =
            Number(studentFeeMapDetails.amount) -
            Number(studentFeeMapDetails.paid) -
            Number(scholarshipAmount);
          if (
            pendingDue > 0 &&
            Number(studentFeeMapDetails.amount) >
              Number(studentFeeMapDetails.paid)
          ) {
            var pay = {
              status: "Adjust Only",
              adjust: Math.abs(scholarshipAmount),
              refund: 0,
              adjustWith: "Current Year",
            };
            emailData.push(pay);
          } else if (
            Number(studentFeeMapDetails.amount) <=
            Number(studentFeeMapDetails.paid)
          ) {
            var pay = {
              status: "Refund Only",
              adjust: 0,
              refund: Math.abs(pendingDue),
              adjustWith: "",
            };
            emailData.push(pay);
          } else if (
            pendingDue < 0 &&
            Number(studentFeeMapDetails.amount) >
              Number(studentFeeMapDetails.paid)
          ) {
            var pay = {
              status: "Refund Only",
              adjust: 0,
              refund: Math.abs(pendingDue),
              adjustWith: "",
            };
            emailData.push(pay);
          }
        } else {
          let scholarshipAmount = oneData.sanctionedAmount;
          let pendingDue =
            Number(studentFeeMapDetails.amount) -
            Number(studentFeeMapDetails.paid) -
            Number(scholarshipAmount);
          if (
            pendingDue < 0 &&
            Number(studentFeeMapDetails.amount) >
              Number(studentFeeMapDetails.paid)
          ) {
            var pay = {
              status: "adjustRefund",
              adjust: {
                refund: 0,
                adjust: Math.abs(pendingDue),
              },
              refund: {
                refund: Math.abs(pendingDue),
                adjust: 0,
              },
              adjustWith: "Next Year",
            };
            emailData.push(pay);
          } else if (
            Number(studentFeeMapDetails.amount) <=
            Number(studentFeeMapDetails.paid)
          ) {
            let refundable =
              Number(studentFeeMapDetails.paid) -
              Number(studentFeeMapDetails.amount);
            var pay = {
              status: "adjustRefund",
              adjust: {
                refund: refundable,
                adjust: Math.abs(Number(pendingDue)) - Number(refundable),
              },
              refund: {
                refund: Math.abs(pendingDue),
                adjust: 0,
              },
              adjustWith: "Next Year",
            };
            emailData.push(pay);
          } else if (Number(pendingDue) > 0) {
            var pay = {
              status: "Adjust",
              adjust: 0,
              refund: 0,
              adjustWith: "Current Year",
            };
            emailData.push(pay);
          }
        }
        dbConnection.close();
        var obj = {
          totalFees: studentFeeMapDetails.amount,
          dueDate: studentFeeMapDetails.dueDate,
          paid: studentFeeMapDetails.paid,
          sanctionedAmount: oneData.sanctionedAmount,
          isFinalYear: studentDetails.isFinalYear,
          regId: oneData.regId,
          status: emailData,
        };
        allResponse.push(obj);
      }
    }
    res.status(200).json(allResponse);
  }
};
exports.adjustScholarship = async function (req, res) {};

exports.getOneScholarship = async function (req, res) {
  let orgId = req.query.orgId;
  let schId = req.params.id;
  console.log("schId", schId);
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
    var transactionDetails = await transactionModel.findOne({
      displayName: schId,
      transactionSubType: "scholarship",
    });
    if (!transactionDetails) {
      res.status(404).json({ success: false, message: "No Scholarships Data" });
    }
    console.log("studentId", transactionDetails.studentId);
    var studentFeeMapDetails = await feeMapModel.findOne({
      studentId: transactionDetails.studentId,
    });

    res.status(200).json({
      scholarshipDetails: transactionDetails,
      studentFeesDetails: studentFeeMapDetails,
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
