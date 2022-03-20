const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const feeplanInstallmentschema = require("../models/feeplanInstallment");
const feeplanschema = require("../models/feeplanModel");
const transactionsSchema = require("../models/transactionsModel");
const feesLedgerSchema = require("../models/feesLedgerModel");
const orgListSchema = require("../models/orglists-schema");
const allSchema = mongoose.Schema({}, { strict: false });
const {
  dailyReportTemplate,
} = require("../utils/helper_functions/templates/daily-report-template");
const { sendEmail } = require("./emailController");

//import
const StudentSchema = require("../models/studentModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const sgMail = require("@sendgrid/mail");
const GuardianSchema = require("../models/guardianModel");
var moment = require("moment");
const axios = require("axios");
const xlsx = require("xlsx");
var campusSchema = require("../models/campusModel");
const FeeTypeSchema = require("../models/feeTypeModel");
const FeeManagerSchema = require("../models/feesManagerModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
var _ = require("lodash");

async function calculateReports(req, res) {
  try {
    const { orgId } = req.query;
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
    }
    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );

    let studentFeePlans = dbConnection.model("studentfeeplans", feeplanschema);
    let feesLedgersModel = dbConnection.model("feesledgers", allSchema);
    let installmentModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let studentModel = dbConnection.model("students", StudentSchema);
    let feeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );

    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );

    const feePlanPending = [
      {
        $group: {
          _id: "",
          pendingAmount: { $sum: "$pendingAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$pendingAmount",
        },
      },
    ];
    const transactionPaid = [
      {
        $group: {
          _id: "",
          amount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$amount",
        },
      },
    ];
    const paidLedger = [
      {
        $match: {
          transactionSubType: "feePayment",
        },
      },
      {
        $group: {
          _id: "",
          paidAmount: { $sum: "$paidAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$paidAmount",
        },
      },
    ];
    const feePlanValue = [
      {
        $group: {
          _id: "",
          paidAmount: { $sum: "$paidAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$paidAmount",
        },
      },
    ];
    const installmentValue = [
      {
        $group: {
          _id: "_id",
          paidAmount: { $sum: "$paidAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$paidAmount",
        },
      },
    ];
    const installmentPendin = [
      {
        $group: {
          _id: "",
          pendingAmount: { $sum: "$pendingAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$pendingAmount",
        },
      },
    ];
    const installmentPayable = [
      {
        $group: {
          _id: "",
          plannedAmount: { $sum: "$plannedAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$plannedAmount",
        },
      },
    ];
    const feePlanPayable = [
      {
        $group: {
          _id: "",
          plannedAmount: { $sum: "$plannedAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          total: "$plannedAmount",
        },
      },
    ];

    var getTotalTrnsaction = await transactionModel.aggregate(transactionPaid);
    var studFeePlanAggr = await studentFeePlans.aggregate(feePlanValue);
    var installmentPaid = await installmentModel.aggregate(installmentValue);
    var ledgerPaid = await feesLedgersModel.aggregate(paidLedger);
    let installmentPending = await installmentModel.aggregate(
      installmentPendin
    );
    let installmentTotal = await installmentModel.aggregate(installmentPayable);

    let feePlanTotal = await studentFeePlans.aggregate(feePlanPayable);
    let feePlaPending = await studentFeePlans.aggregate(feePlanPending);
    // console.log("gotTotal", getTotalTrnsaction);

    let obj = {
      transactions: getTotalTrnsaction,
      feePlan: studFeePlanAggr,
      ledger: ledgerPaid,
      installment: installmentPaid,
      installmentPending: installmentPending,
      feePlanPending: feePlaPending,
      installmentPlanned: installmentTotal,
      feePlanTotal: feePlanTotal,
    };
    res.status(200).json(obj);
  } catch (err) {
    res.status(400).json({ success: false, Error: err });
  }
}

async function DRFC1(req, res) {
  let orgId = req.query.orgId;
  let usersDbCollection;
  // try {
  var inputData = "naveen.p@zenqore.com";
  let campusId = "All";
  let userId = "All";
  let page;
  let limit;
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
  }
  // console.log(orgData)
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  usersDbCollection = await createDatabase(
    `Zq-EduUser-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const campusModel = dbConnection.model("campuses", campusSchema, "campuses");
  let feePlanModel = dbConnection.model("studentfeeplans", feeplanschema);
  let feeInstallmentPlanModel = dbConnection.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );
  let feeTypeModel = await dbConnection.model("feeTypes", FeeTypeSchema);
  let studentModel = await dbConnection.model("students", StudentSchema);
  let programPlanSchema = await dbConnection.model(
    "programplans",
    ProgramPlanSchema
  );
  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let guardianModel = dbConnection.model("guardian", GuardianSchema);
  var transactionModel = await dbConnection.model(
    "transactions",
    transactionsSchema
  );
  const feePlanAggregate = [
    {
      $group: {
        _id: {
          campus: "$campusId",
        },
        noOfStudentsPaid: {
          $sum: { $cond: [{ $gt: ["$paidAmount", 0] }, 1, 0] },
        },
        planned: { $sum: "$plannedAmount" },
        received: { $sum: "$paidAmount" },
        pending: { $sum: "$pendingAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        // label: "$_id.label",
        campusId: "$_id.campus",
        planned: "$planned",
        received: { $round: ["$received", 2] },
        pending: { $round: ["$pending", 2] },
        noOfStudentsPaid: "$noOfStudentsPaid",
        // details: "$details"
      },
    },
  ];
  const aggregatePipeline = [
    {
      $group: {
        _id: {
          label: "$label",
          campus: "$campusId",
        },
        noOfStudentsPaid: {
          $sum: { $cond: [{ $gt: ["$paidAmount", 0] }, 1, 0] },
        },
        planned: { $sum: "$plannedAmount" },
        received: { $sum: "$paidAmount" },
        pending: { $sum: "$pendingAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        label: "$_id.label",
        campusId: "$_id.campus",
        planned: "$planned",
        received: { $round: ["$received", 2] },
        pending: { $round: ["$pending", 2] },
        noOfStudentsPaid: "$noOfStudentsPaid",
        // details: "$details"
      },
    },
  ];
  let feePlanArray = [];
  var feePlanAggregateData = await feePlanModel.aggregate(feePlanAggregate);

  for (let i = 0; i < feePlanAggregateData.length; i++) {
    const item = feePlanAggregateData[i];
    await campusModel.findOne({ _id: item.campusId }).then(async (data) => {
      let campusName = data.displayName;
      item["campus"] = campusName;
      await feePlanArray.push(item);
    });
  }

  var result = {};
  var aggregateData = await feeInstallmentPlanModel.aggregate(
    aggregatePipeline
  );

  let feePlanData = feePlanArray.sort((a, b) => (a.campus > b.campus ? 1 : -1));

  result.fromDate = moment().format("ll");
  result.toDate = moment().format("ll");
  result.time = moment().format("LT");
  result["Term 1"] = [];
  result["Term 2"] = [];
  result["Total"] = [];

  for (let i = 0; i < aggregateData.length; i++) {
    const item = aggregateData[i];
    await campusModel.findOne({ _id: item.campusId }).then(async (data) => {
      let campusName = data.displayName;
      if (item.label == "Installment001") {
        item["campus"] = campusName;
        await result["Term 1"].push(item);
      } else if (item.label == "Installment002") {
        item["campus"] = campusName;
        await result["Term 2"].push(item);
      }
    });
  }

  let term1TotalPlanned = result["Term 1"].reduce((a, b) => a + b.planned, 0);
  let term1TotalReceived = result["Term 1"].reduce((a, b) => a + b.received, 0);
  let term1TotalPending =
    Number(term1TotalPlanned) - Number(term1TotalReceived);
  let term1TotalStudents = result["Term 1"].reduce(
    (a, b) => a + b.noOfStudentsPaid,
    0
  );
  result["Term 1"].push({
    totalPlanned: term1TotalPlanned,
    totalReceived: term1TotalReceived,
    totalPending: term1TotalPending,
    campus: "Total",
    totalStudentsPaid: term1TotalStudents,
  });

  result["Term 1"].sort((a, b) => (a.campus > b.campus ? 1 : -1));
  let term2TotalPlanned = result["Term 2"].reduce((a, b) => a + b.planned, 0);
  let term2TotalPending = result["Term 2"].reduce((a, b) => a + b.pending, 0);
  let term2TotalReceived = result["Term 2"].reduce((a, b) => a + b.received, 0);
  let term2TotalStudents = result["Term 2"].reduce(
    (a, b) => a + b.noOfStudentsPaid,
    0
  );

  result["Term 2"].push({
    totalPlanned: term2TotalPlanned,
    totalReceived: term2TotalReceived,
    totalPending: term2TotalPending,
    campus: "Total",
    totalStudentsPaid: term2TotalStudents,
  });
  result["Term 2"].sort((a, b) => (a.campus > b.campus ? 1 : -1));

  let overallPlanned = feePlanData
    .filter((term) => term.planned)
    .reduce((a, b) => a + b.planned, 0);
  let overallPending = feePlanData
    .filter((term) => term.pending)
    .reduce((a, b) => a + b.pending, 0);
  let overallReceived = feePlanData
    .filter((term) => term.received)
    .reduce((a, b) => a + b.received, 0);
  let overallStudentsPaid = feePlanData
    .filter((term) => term.noOfStudentsPaid)
    .reduce((a, b) => a + b.noOfStudentsPaid, 0);

  let campus1 = {
    campus: feePlanData[0].campus,
    overallPlanned: feePlanData[0].planned,
    overallPending: feePlanData[0].pending,
    overallReceived: feePlanData[0].received,
    overallStudentsPaid: feePlanData[0].noOfStudentsPaid,
  };
  let campus2 = {
    campus: feePlanData[1].campus,
    overallPlanned: feePlanData[1].planned,
    overallPending: feePlanData[1].pending,
    overallReceived: feePlanData[1].received,
    overallStudentsPaid: feePlanData[1].noOfStudentsPaid,
  };
  let campus3 = {
    campus: feePlanData[2].campus,
    overallPlanned: feePlanData[2].planned,
    overallPending: feePlanData[2].pending,
    overallReceived: feePlanData[2].received,
    overallStudentsPaid: feePlanData[2].noOfStudentsPaid,
  };
  result["Total"].push(campus1, campus2, campus3, {
    totalPlanned: overallPlanned,
    totalReceived: overallReceived,
    totalPending: overallPending,
    campus: "Total",
    totalStudentsPaid: overallStudentsPaid,
  });
  await result["Total"].sort((a, b) => (a.campus > b.campus ? 1 : -1));

  let trparams2 = [
    {
      $match: {
        transactionSubType: "feePayment",
      },
    },
  ];
  if (
    campusId !== undefined &&
    campusId !== null &&
    campusId !== "" &&
    campusId.toLowerCase() !== "all"
  ) {
    trparams2[1].$match.campusId = campusId;
  }
  if (
    userId &&
    userId !== undefined &&
    userId !== null &&
    userId !== "" &&
    userId.toLowerCase() !== "all"
  ) {
    trparams2[1].$match.createdBy = userId;
  }
  // if (
  //   req.query.section &&
  //   req.query.section !== undefined &&
  //   req.query.section.toLowerCase() !== "all"
  // ) {
  //   trparams2[0].$lookup = {
  //     from: "students",
  //     localField: "studentId",
  //     foreignField: "_id",
  //     as: "students",
  //   };
  //   trparams2[1].$match["students.section"] = req.query.section;
  // }
  // if (!req.query.section || req.query.section.toLowerCase() == "all") {
  //   trparams2 = [{ $match: trparams2[1].$match }];
  // }

  let getDatasDetailsfp = await transactionModel
    .aggregate(trparams2)
    .sort({ _id: -1 });
  let totalAmount = 0;
  let totalPending = 0;
  let totalPaidAmount = 0;
  let totalCash = 0;
  let totalCheque = 0;
  let totalCard = 0;
  let totalNetbanking = 0;
  let totalWallet = 0;
  let totalUpi = 0;
  var searchData = [];
  var getDatasDetails2 = [];
  let createXlxsData = [];

  var getDatasDetails2 = searchData.length > 0 ? searchData : getDatasDetailsfp;
  var transactionDetails = getDatasDetails2;
  var fpData = [];
  let cvr = [];
  let jbn = [];
  let cvrpp = [];
  let dueAmt;
  let totAmt;
  let campusData = await campusModel.find({});

  // for (let i = 0; i < transactionDetails.length; i++) {
  //   const element = transactionDetails[i];
  //   var fbBreakUp = [];
  //   let fpElt = {};
  //   let stdData = await studentModel.findOne({
  //     regId: element["studentRegId"],
  //   });
  //   if (stdData) {
  //     let findcampus = await campusData.find(
  //       (item) => item._id.toString() == stdData._doc.campusId.toString()
  //     );

  //     let feePlandata = await feePlanModel.findOne({
  //       studentRegId: element.studentRegId,
  //     });
  //     let feeinstdata = await feeInstallmentPlanModel.find({
  //       feePlanId: feePlandata._doc._id,
  //     });
  //     var refundDet = (refundDet = await transactionModel.findOne({
  //       paymentRefId: element["displayName"],
  //       transactionSubType: "refund",
  //     }));
  //     var totalBalance = 0;
  //     fpElt["displayName"] = element["displayName"];
  //     fpElt["studentName"] = element["studentName"];
  //     fpElt["regId"] = element["studentRegId"];
  //     fpElt["academicYear"] = element["academicYear"];
  //     fpElt["classBatch"] = element["class"];
  //     fpElt["DemandId"] = element.relatedTransactions[0];
  //     fpElt["refundAmount"] = refundDet != null ? refundDet._doc["amount"] : 0;
  //     fpElt["description"] = [];
  //     fpElt["paymentDetails"] = element;
  //     for (let j = 0; j < feeinstdata.length; j++) {
  //       totAmt = feePlandata._doc.plannedAmount;
  //       dueAmt = feePlandata._doc.pendingAmount;
  //       totalBalance =
  //         feeinstdata[j + 1] &&
  //         Number(feeinstdata[j + 1]._doc["paidAmount"]) == 0
  //           ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
  //           : feeinstdata[j + 1] &&
  //             Number(feeinstdata[j + 1]._doc["paidAmount"]) > 0
  //           ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
  //           : Number(feeinstdata[j]._doc["pendingAmount"]);
  //       totalDue = parseFloat(feePlandata._doc["plannedAmount"]);
  //       totalPaid = parseFloat(element["amount"]);
  //     }
  //     if (findcampus._doc.displayName.toLowerCase().includes("cvr")) {
  //       cvr.push({
  //         "RECEIPT ID": element["displayName"],
  //         "REG ID": element["studentRegId"],
  //         "STUDENT NAME": element["studentName"],
  //         "ACADEMIC YEAR": element["academicYear"],
  //         "CLASS/BATCH": element["class"],
  //         "PARENT NAME": stdData ? stdData._doc.parentName : "",
  //         "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
  //         "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
  //         DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
  //         "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
  //         "PAID (INR)": feePlandata._doc["paidAmount"],
  //         "PAID ON": await onDateFormat(element["transactionDate"]),
  //         MODE: element.data.mode.toUpperCase(),
  //         "TRANSACTION ID": element["paymentTransactionId"],
  //         "PENDING (INR)": feePlandata._doc["pendingAmount"],
  //         // "REFUND": this.formatAmount(item.refundAmount),
  //         STATUS: "Paid",
  //       });
  //     } else if (findcampus._doc.displayName.toLowerCase().includes("pp")) {
  //       cvrpp.push({
  //         "RECEIPT ID": element["displayName"],
  //         "REG ID": element["studentRegId"],
  //         "STUDENT NAME": element["studentName"],
  //         "ACADEMIC YEAR": element["academicYear"],
  //         "CLASS/BATCH": element["class"],
  //         "PARENT NAME": stdData ? stdData._doc.parentName : "",
  //         "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
  //         "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
  //         DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
  //         "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
  //         "PAID (INR)": feePlandata._doc["paidAmount"],
  //         "PAID ON": await onDateFormat(element["transactionDate"]),
  //         MODE: element.data.mode.toUpperCase(),
  //         "TRANSACTION ID": element["paymentTransactionId"],
  //         "PENDING (INR)": feePlandata._doc["pendingAmount"],
  //         // "REFUND": this.formatAmount(item.refundAmount),
  //         STATUS: "Paid",
  //       });
  //     } else if (findcampus._doc.displayName.toLowerCase().includes("jbn")) {
  //       jbn.push({
  //         "RECEIPT ID": element["displayName"],
  //         "REG ID": element["studentRegId"],
  //         "STUDENT NAME": element["studentName"],
  //         "ACADEMIC YEAR": element["academicYear"],
  //         "CLASS/BATCH": element["class"],
  //         "PARENT NAME": stdData ? stdData._doc.parentName : "",
  //         "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
  //         "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
  //         DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
  //         "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
  //         "PAID (INR)": feePlandata._doc["paidAmount"],
  //         "PAID ON": await onDateFormat(element["transactionDate"]),
  //         MODE: element.data.mode.toUpperCase(),
  //         "TRANSACTION ID": element["paymentTransactionId"],
  //         "PENDING (INR)": feePlandata._doc["pendingAmount"],
  //         // "REFUND": this.formatAmount(item.refundAmount),
  //         STATUS: "Paid",
  //       });
  //     }
  //   }
  // }
  // for (let i = 0; i < transactionDetails.length; i++) {
  //   const element = transactionDetails[i];
  //   var fbBreakUp = [];
  //   let fpElt = {};
  //   let stdData = await studentModel.findOne({
  //     regId: element["studentRegId"],
  //   });
  //   if (stdData) {
  //     let findcampus = await campusData.find(
  //       (item) => item._id.toString() == stdData._doc.campusId.toString()
  //     );

  //     let feePlandata = await feePlanModel.findOne({
  //       studentRegId: element.studentRegId,
  //     });
  //     let feeinstdata = await feeInstallmentPlanModel.find({
  //       feePlanId: feePlandata._doc._id,
  //     });
  //     var refundDet = (refundDet = await transactionModel.findOne({
  //       paymentRefId: element["displayName"],
  //       transactionSubType: "refund",
  //     }));
  //     var totalBalance = 0;
  //     fpElt["displayName"] = element["displayName"];
  //     fpElt["studentName"] = element["studentName"];
  //     fpElt["regId"] = element["studentRegId"];
  //     fpElt["academicYear"] = element["academicYear"];
  //     fpElt["classBatch"] = element["class"];
  //     fpElt["DemandId"] = element.relatedTransactions[0];
  //     fpElt["refundAmount"] = refundDet != null ? refundDet._doc["amount"] : 0;
  //     fpElt["description"] = [];
  //     fpElt["paymentDetails"] = element;
  //     for (let j = 0; j < feeinstdata.length; j++) {
  //       totAmt = feePlandata._doc.plannedAmount;
  //       dueAmt = feePlandata._doc.pendingAmount;
  //       totalBalance =
  //         feeinstdata[j + 1] &&
  //         Number(feeinstdata[j + 1]._doc["paidAmount"]) == 0
  //           ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
  //           : feeinstdata[j + 1] &&
  //             Number(feeinstdata[j + 1]._doc["paidAmount"]) > 0
  //           ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
  //           : Number(feeinstdata[j]._doc["pendingAmount"]);
  //       totalDue = parseFloat(feePlandata._doc["plannedAmount"]);
  //       totalPaid = parseFloat(feePlandata._doc["paidAmount"]);
  //     }
  //     if (findcampus._doc.campusId == "CAMP_2021-22_002") {
  //       cvr.push({
  //         "RECEIPT ID": element["displayName"],
  //         "REG ID": element["studentRegId"],
  //         "STUDENT NAME": element["studentName"],
  //         "ACADEMIC YEAR": element["academicYear"],
  //         "CLASS/BATCH": element["class"],
  //         "PARENT NAME": stdData ? stdData._doc.parentName : "",
  //         "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
  //         "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
  //         DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
  //         "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
  //         "PAID (INR)": feePlandata._doc["paidAmount"],
  //         "PAID ON": await onDateFormat(element["transactionDate"]),
  //         MODE: element.data.mode.toUpperCase(),
  //         "TRANSACTION ID": element["paymentTransactionId"],
  //         "PENDING (INR)": feePlandata._doc["pendingAmount"],
  //         // "REFUND": this.formatAmount(item.refundAmount),
  //         STATUS: "Paid",
  //       });
  //     } else if (findcampus._doc.campusId == "CAMP_2021-22_001") {
  //       cvrpp.push({
  //         "RECEIPT ID": element["displayName"],
  //         "REG ID": element["studentRegId"],
  //         "STUDENT NAME": element["studentName"],
  //         "ACADEMIC YEAR": element["academicYear"],
  //         "CLASS/BATCH": element["class"],
  //         "PARENT NAME": stdData ? stdData._doc.parentName : "",
  //         "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
  //         "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
  //         DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
  //         "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
  //         "PAID (INR)": feePlandata._doc["paidAmount"],
  //         "PAID ON": await onDateFormat(element["transactionDate"]),
  //         MODE: element.data.mode.toUpperCase(),
  //         "TRANSACTION ID": element["paymentTransactionId"],
  //         "PENDING (INR)": feePlandata._doc["pendingAmount"],
  //         // "REFUND": this.formatAmount(item.refundAmount),
  //         STATUS: "Paid",
  //       });
  //     } else if (findcampus._doc.campusId == "CAMP_2021-22_003") {
  //       jbn.push({
  //         "RECEIPT ID": element["displayName"],
  //         "REG ID": element["studentRegId"],
  //         "STUDENT NAME": element["studentName"],
  //         "ACADEMIC YEAR": element["academicYear"],
  //         "CLASS/BATCH": element["class"],
  //         "PARENT NAME": stdData ? stdData._doc.parentName : "",
  //         "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
  //         "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
  //         DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
  //         "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
  //         "PAID (INR)": feePlandata._doc["paidAmount"],
  //         "PAID ON": await onDateFormat(element["transactionDate"]),
  //         MODE: element.data.mode.toUpperCase(),
  //         "TRANSACTION ID": element["paymentTransactionId"],
  //         "PENDING (INR)": feePlandata._doc["pendingAmount"],
  //         // "REFUND": this.formatAmount(item.refundAmount),
  //         STATUS: "Paid",
  //       });
  //     }
  //   }
  // }
  let totalCount = [];
  let fpElt = {};
  for (one of transactionDetails) {
    let stdData = await studentModel.findOne({
      regId: one.studentRegId,
    });
    if (stdData) {
      let campusData = await campusModel.findOne({ _id: one.campusId });
      let feePlandata = await feePlanModel.findOne({
        studentRegId: one.studentRegId,
      });
      let feeinstdata = await feeInstallmentPlanModel.find({
        feePlanId: feePlandata._doc._id,
      });
      var refundDet = (refundDet = await transactionModel.findOne({
        paymentRefId: one["displayName"],
        transactionSubType: "refund",
      }));
      fpElt["displayName"] = one["displayName"];
      fpElt["studentName"] = one["studentName"];
      fpElt["regId"] = one["studentRegId"];
      fpElt["academicYear"] = one["academicYear"];
      fpElt["classBatch"] = one["class"];
      fpElt["DemandId"] = one.relatedTransactions[0];
      fpElt["refundAmount"] = refundDet != null ? refundDet._doc["amount"] : 0;
      fpElt["description"] = [];
      fpElt["paymentDetails"] = one;
      for (let j = 0; j < feeinstdata.length; j++) {
        totAmt = feePlandata._doc.plannedAmount;
        dueAmt = feePlandata._doc.pendingAmount;
        totalBalance =
          feeinstdata[j + 1] &&
          Number(feeinstdata[j + 1]._doc["paidAmount"]) == 0
            ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
            : feeinstdata[j + 1] &&
              Number(feeinstdata[j + 1]._doc["paidAmount"]) > 0
            ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
            : Number(feeinstdata[j]._doc["pendingAmount"]);
        totalDue = parseFloat(feePlandata._doc["plannedAmount"]);
        totalPaid = parseFloat(feePlandata._doc["paidAmount"]);
      }
      if (campusData.campusId == "CAMP_2021-22_002") {
        cvr.push({
          "RECEIPT ID": one["displayName"],
          "REG ID": one["studentRegId"],
          "STUDENT NAME": one["studentName"],
          "ACADEMIC YEAR": one["academicYear"],
          "CLASS/BATCH": one["class"],
          "PARENT NAME": stdData ? stdData._doc.parentName : "",
          "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
          "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
          DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
          "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
          "PAID (INR)": feePlandata._doc["paidAmount"],
          "PAID ON": await onDateFormat(one["transactionDate"]),
          MODE: one.data.mode.toUpperCase(),
          "TRANSACTION ID": one["paymentTransactionId"],
          "PENDING (INR)": feePlandata._doc["pendingAmount"],
          // "REFUND": this.formatAmount(item.refundAmount),
          STATUS: "Paid",
        });
      } else if (campusData.campusId == "CAMP_2021-22_001") {
        cvrpp.push({
          "RECEIPT ID": one["displayName"],
          "REG ID": one["studentRegId"],
          "STUDENT NAME": one["studentName"],
          "ACADEMIC YEAR": one["academicYear"],
          "CLASS/BATCH": one["class"],
          "PARENT NAME": stdData ? stdData._doc.parentName : "",
          "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
          "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
          DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
          "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
          "PAID (INR)": feePlandata._doc["paidAmount"],
          "PAID ON": await onDateFormat(one["transactionDate"]),
          MODE: one.data.mode.toUpperCase(),
          "TRANSACTION ID": one["paymentTransactionId"],
          "PENDING (INR)": feePlandata._doc["pendingAmount"],
          // "REFUND": this.formatAmount(item.refundAmount),
          STATUS: "Paid",
        });
      } else if (campusData.campusId == "CAMP_2021-22_003") {
        jbn.push({
          "RECEIPT ID": one["displayName"],
          "REG ID": one["studentRegId"],
          "STUDENT NAME": one["studentName"],
          "ACADEMIC YEAR": one["academicYear"],
          "CLASS/BATCH": one["class"],
          "PARENT NAME": stdData ? stdData._doc.parentName : "",
          "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
          "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
          DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
          "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
          "PAID (INR)": feePlandata._doc["paidAmount"],
          "PAID ON": await onDateFormat(one["transactionDate"]),
          MODE: one.data.mode.toUpperCase(),
          "TRANSACTION ID": one["paymentTransactionId"],
          "PENDING (INR)": feePlandata._doc["pendingAmount"],
          // "REFUND": this.formatAmount(item.refundAmount),
          STATUS: "Paid",
        });
      }
    }
  }

  // return res.status(200).json({
  //   total: totalCount.length,
  //   cvr: cvr.length,
  //   jbn: jbn.length,
  //   pp: cvrpp.length,
  // });

  var wscols1 = [];
  var wscols2 = [];
  var wscols3 = [];
  var findCellWidth = {};
  var cellKeys1 =
    cvr.length > 0
      ? Object.keys(cvr["0"])
      : [
          "RECEIPT ID",
          "REG ID",
          "STUDENT NAME",
          "ACADEMIC YEAR",
          "CLASS/BATCH",
          "PARENT NAME",
          "PARENT PHONE NO.",
          "PARENT EMAIL",
          "DESCRIPTION",
          "TOTAL FEES (INR)",
          "PAID (INR)",
          "PAID ON",
          "MODE",
          "PENDING (INR)",
          "TRANSACTION ID",
          "STATUS",
        ];
  var cellKeys2 =
    jbn.length > 0
      ? Object.keys(jbn["0"])
      : [
          "RECEIPT ID",
          "REG ID",
          "STUDENT NAME",
          "ACADEMIC YEAR",
          "CLASS/BATCH",
          "PARENT NAME",
          "PARENT PHONE NO.",
          "PARENT EMAIL",
          "DESCRIPTION",
          "TOTAL FEES (INR)",
          "PAID (INR)",
          "PAID ON",
          "MODE",
          "PENDING (INR)",
          "TRANSACTION ID",
          "STATUS",
        ];
  var cellKeys3 =
    cvrpp.length > 0
      ? Object.keys(cvrpp["0"])
      : [
          "RECEIPT ID",
          "REG ID",
          "STUDENT NAME",
          "ACADEMIC YEAR",
          "CLASS/BATCH",
          "PARENT NAME",
          "PARENT PHONE NO.",
          "PARENT EMAIL",
          "DESCRIPTION",
          "TOTAL FEES (INR)",
          "PAID (INR)",
          "PAID ON",
          "MODE",
          "PENDING (INR)",
          "TRANSACTION ID",
          "STATUS",
        ];
  cvr.map((key, keyIndex) => {
    cellKeys1.map((cellKey) => {
      if (findCellWidth[cellKey] != undefined) {
        findCellWidth[cellKey] =
          Number(findCellWidth[cellKey]) > String(key[cellKey]).length
            ? findCellWidth[cellKey]
            : String(key[cellKey]).length;
      } else {
        // console.log(cellKeys1[cellKey], String(cellKeys1[cellKey]).length)
        findCellWidth[cellKey] = Number(String(cellKey).length);
      }
    });
  });
  cellKeys1.map((cellKey) => {
    if (cellKey == "PAID ON") {
    } else if (cellKey == "PENDING (INR)") {
      wscols1.push({
        wch: findCellWidth[cellKey],
        s: { font: { bold: true } },
        font: { bold: true },
      });
    } else {
      wscols1.push({
        wch: findCellWidth[cellKey] + 5,
        s: { font: { bold: true } },
        font: { bold: true },
      });
    }
  });
  jbn.map((key, keyIndex) => {
    cellKeys2.map((cellKey) => {
      if (findCellWidth[cellKey] != undefined) {
        findCellWidth[cellKey] =
          Number(findCellWidth[cellKey]) > String(key[cellKey]).length
            ? findCellWidth[cellKey]
            : String(key[cellKey]).length;
      } else {
        console.log(cellKeys2[cellKey], String(cellKeys2[cellKey]).length);
        findCellWidth[cellKey] = Number(String(cellKey).length);
      }
    });
  });
  // console.log(findCellWidth)
  cellKeys2.map((cellKey) => {
    if (cellKey == "PAID ON") {
    } else if (cellKey == "PENDING (INR)") {
      wscols2.push({
        wch: findCellWidth[cellKey],
        s: { font: { bold: true } },
        font: { bold: true },
      });
    } else {
      wscols2.push({
        wch: findCellWidth[cellKey] + 5,
        s: { font: { bold: true } },
        font: { bold: true },
      });
    }
  });
  cvrpp.map((key, keyIndex) => {
    cellKeys3.map((cellKey) => {
      if (findCellWidth[cellKey] != undefined) {
        findCellWidth[cellKey] =
          Number(findCellWidth[cellKey]) > String(key[cellKey]).length
            ? findCellWidth[cellKey]
            : String(key[cellKey]).length;
      } else {
        console.log(cellKeys3[cellKey], String(cellKeys3[cellKey]).length);
        findCellWidth[cellKey] = Number(String(cellKey).length);
      }
    });
  });
  // console.log(findCellWidth)
  cellKeys3.map((cellKey) => {
    if (cellKey == "PAID ON") {
    } else if (cellKey == "PENDING (INR)") {
      wscols3.push({
        wch: findCellWidth[cellKey],
        s: { font: { bold: true } },
        font: { bold: true },
      });
    } else {
      wscols3.push({
        wch: findCellWidth[cellKey] + 5,
        s: { font: { bold: true } },
        font: { bold: true },
      });
    }
  });
  var J = xlsx.utils.decode_col("J"); // 1
  var K = xlsx.utils.decode_col("K"); // 1
  var N = xlsx.utils.decode_col("O"); // 1
  var wb = xlsx.utils.book_new();
  var fmt = "#,##,##0.00"; // or '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)' or any Excel number format
  var wscvr = await xlsx.utils.json_to_sheet(cvr, {
    raw: false,
    numFmt: "$#,###.00",
    dateNF: "dd-MM-yy",
  });
  var range1 = xlsx.utils.decode_range(wscvr["!ref"]);
  for (var i = range1.s.r + 1; i <= range1.e.r; ++i) {
    var ref = xlsx.utils.encode_cell({ r: i, c: J });
    var ref1 = xlsx.utils.encode_cell({ r: i, c: K });
    var ref2 = xlsx.utils.encode_cell({ r: i, c: N });
    // G
    if (!wscvr[ref]) continue;
    if (wscvr[ref].t != "n") continue;
    wscvr[ref].z = fmt;
    // H
    if (!wscvr[ref1]) continue;
    if (wscvr[ref1].t != "n") continue;
    wscvr[ref1].z = fmt;
    // K
    if (!wscvr[ref2]) continue;
    if (wscvr[ref2].t != "n") continue;
    wscvr[ref2].z = fmt;
  }
  var wsjbn = await xlsx.utils.json_to_sheet(jbn, {
    raw: false,
    numFmt: "$#,###.00",
    dateNF: "dd-MM-yy",
  });
  var range2 = xlsx.utils.decode_range(wsjbn["!ref"]);
  for (var i = range2.s.r + 1; i <= range2.e.r; ++i) {
    var ref = xlsx.utils.encode_cell({ r: i, c: J });
    var ref1 = xlsx.utils.encode_cell({ r: i, c: K });
    var ref2 = xlsx.utils.encode_cell({ r: i, c: N });
    // G
    if (!wsjbn[ref]) continue;
    if (wsjbn[ref].t != "n") continue;
    wsjbn[ref].z = fmt;
    // H
    if (!wsjbn[ref1]) continue;
    if (wsjbn[ref1].t != "n") continue;
    wsjbn[ref1].z = fmt;
    // K
    if (!wsjbn[ref2]) continue;
    if (wsjbn[ref2].t != "n") continue;
    wsjbn[ref2].z = fmt;
  }
  var wspp = await xlsx.utils.json_to_sheet(cvrpp, {
    raw: false,
    numFmt: "$#,###.00",
    dateNF: "dd-MM-yy",
  });
  var range3 = xlsx.utils.decode_range(wspp["!ref"]);
  for (var i = range3.s.r + 1; i <= range3.e.r; ++i) {
    var ref = xlsx.utils.encode_cell({ r: i, c: J });
    var ref1 = xlsx.utils.encode_cell({ r: i, c: K });
    var ref2 = xlsx.utils.encode_cell({ r: i, c: N });
    // G
    if (!wspp[ref]) continue;
    if (wspp[ref].t != "n") continue;
    wspp[ref].z = fmt;
    // H
    if (!wspp[ref1]) continue;
    if (wspp[ref1].t != "n") continue;
    wspp[ref1].z = fmt;
    // K
    if (!wspp[ref2]) continue;
    if (wspp[ref2].t != "n") continue;
    wspp[ref2].z = fmt;
  }
  wscvr["!cols"] = wscols1;
  wspp["!cols"] = wscols2;
  wsjbn["!cols"] = wscols3;
  console.log(wscols1[0].s.font);
  xlsx.utils.book_append_sheet(wb, wscvr, "CV Raman Nagar");
  xlsx.utils.book_append_sheet(wb, wspp, "CV Raman Nagar PP");
  xlsx.utils.book_append_sheet(wb, wsjbn, "Jeevan Bima Nagar");
  // xlsx.writeFile(wb, "student_daily_fee_reports.xlsx")
  let attachmentsPaths = await xlsx.write(wb, {
    type: "buffer",
    bookType: "xlsx",
  });
  // res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  let sgKey = process.env.sendgridKey;
  sgMail.setApiKey(sgKey);
  let msg;
  const attachment = Buffer.from(attachmentsPaths).toString("base64");
  const dailyReport = await dailyReportTemplate(result);

  let payload = { html: dailyReport };
  let createPdf = await axios.post(`${process.env.externalServer}`, payload);
  const attachment2 = Buffer.from(createPdf.data.file).toString("base64");
  let filename = `Daily Report.xlsx`;

  const usersSchema = mongoose.Schema({}, { strict: false });
  const usersModel = usersDbCollection.model(
    `Users_${process.env.stage}`,
    usersSchema,
    `Users_${process.env.stage}`
  );
  // const usersDbCollection = await createConnection(`Zq-EduUser-dev`, process.env.central_mongoDbUrl);
  // const usersModel = usersDbCollection.model(`Users_dev`, usersSchema, `Users_dev`);

  let emails = [];
  await usersModel.find({ willRcvDFCR: true }).then(async (usersData) => {
    usersData.forEach((element) => {
      emails.push(element._doc.email);
    });
    console.log("user emails", emails);
    if (emails.length > 0) {
      msg = {
        // to: emails, // Change to your recipient
        to: "muniyaraj.neelamegam@zenqore.com",
        from: process.env.sendgridEmail, // Change to your verified sender
        subject: `NCFE - Daily Fee Collection Report of ${moment().format(
          "DD/MM/YYYY"
        )}`,
        html: `Dear NCFE Team, <br/> <br/> Please find the attached Daily Fee Collection Report of ${moment().format(
          "DD/MM/YYYY"
        )} for your reference.<br/><br/>Regards <br/>`,
        attachments: [
          {
            content: attachment,
            filename: filename,
            type: "text/html",
            disposition: "attachment",
          },
          {
            content: attachment2,
            filename: "Daily Report.pdf",
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      };
      let sendemail = await sendDailyReportTemplate(msg);
      console.log(sendemail);
    } else {
      msg = {
        // to: emails, // Change to your recipient
        to: "muniyaraj.neelamegam@zenqore.com",
        from: process.env.sendgridEmail, // Change to your verified sender
        subject: `NCFE - Daily Fee Collection Report of ${moment().format(
          "DD/MM/YYYY"
        )}`,
        html: `Dear NCFE Team, <br/> <br/> Please find the attached Daily Fee Collection Report of ${moment().format(
          "DD/MM/YYYY"
        )} for your reference.<br/><br/>Regards <br/>`,
        attachments: [
          {
            content: attachment,
            filename: filename,
            type: "text/html",
            disposition: "attachment",
          },
          {
            content: attachment2,
            filename: "Daily Report.pdf",
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      };
      let sendemail = await sendDailyReportTemplate(msg);
      res.status(200).send("email sent");
    }
  });
  // } catch (err) {
  //   console.log({ status: "failure", message: "daily report: " + err.message })
  // }
  // finally {
  //   console.log("Closing Database")
  //   dbConnection.close();
  //   centralDbConnection.close()
  //   usersDbCollection.close()
  // }
}

async function DRFC(req, res) {
  let orgId = req.query.orgId;
  let dbConnection;
  let centralDbConnection;
  let usersDbCollection;
  // try {
  var inputData = "naveen.p@zenqore.com";
  let campusId = "All";
  let userId = "All";
  let page;
  let limit;
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
    _id: mongoose.Types.ObjectId(orgId),
  });
  // console.log(orgData)
  dbConnection = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  usersDbCollection = await createDatabase(
    `Zq-EduUser-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  let type = "feePayment";
  const campusModel = dbConnection.model("campuses", campusSchema, "campuses");
  let feePlanModel = dbConnection.model("studentfeeplans", feeplanschema);
  let feeInstallmentPlanModel = dbConnection.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );
  let feeTypeModel = await dbConnection.model("feeTypes", FeeTypeSchema);
  let studentModel = await dbConnection.model("students", StudentSchema);
  let programPlanSchema = await dbConnection.model(
    "programplans",
    ProgramPlanSchema
  );
  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let guardianModel = dbConnection.model("guardian", GuardianSchema);
  var transactionModel = await dbConnection.model(
    "transactions",
    transactionsSchema
  );
  const feePlanAggregate = [
    {
      $group: {
        _id: {
          campus: "$campusId",
        },
        noOfStudentsPaid: {
          $sum: { $cond: [{ $gt: ["$paidAmount", 0] }, 1, 0] },
        },
        planned: { $sum: "$plannedAmount" },
        received: { $sum: "$paidAmount" },
        pending: { $sum: "$pendingAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        // label: "$_id.label",
        campusId: "$_id.campus",
        planned: "$planned",
        received: { $round: ["$received", 2] },
        pending: { $round: ["$pending", 2] },
        noOfStudentsPaid: "$noOfStudentsPaid",
        // details: "$details"
      },
    },
  ];
  const aggregatePipeline = [
    {
      $group: {
        _id: {
          label: "$label",
          campus: "$campusId",
        },
        noOfStudentsPaid: {
          $sum: { $cond: [{ $gt: ["$paidAmount", 0] }, 1, 0] },
        },
        planned: { $sum: "$plannedAmount" },
        received: { $sum: "$paidAmount" },
        pending: { $sum: "$pendingAmount" },
      },
    },
    {
      $project: {
        _id: 0,
        label: "$_id.label",
        campusId: "$_id.campus",
        planned: "$planned",
        received: { $round: ["$received", 2] },
        pending: { $round: ["$pending", 2] },
        noOfStudentsPaid: "$noOfStudentsPaid",
        // details: "$details"
      },
    },
  ];
  let feePlanArray = [];
  var feePlanAggregateData = await feePlanModel.aggregate(feePlanAggregate);
  for (let i = 0; i < feePlanAggregateData.length; i++) {
    const item = feePlanAggregateData[i];
    await campusModel.find({ _id: item.campusId }).then(async (data) => {
      let campusName = data[0].displayName;
      item["campus"] = campusName;
      await feePlanArray.push(item);
    });
  }
  var result = {};
  var aggregateData = await feeInstallmentPlanModel.aggregate(
    aggregatePipeline
  );
  let feePlanData = feePlanArray.sort((a, b) => (a.campus > b.campus ? 1 : -1));

  result.fromDate = moment().format("ll");
  result.toDate = moment().format("ll");
  result.time = moment().format("LT");
  result["Term 1"] = [];
  result["Term 2"] = [];
  result["Total"] = [];

  for (let i = 0; i < aggregateData.length; i++) {
    const item = aggregateData[i];
    await campusModel.find({ _id: item.campusId }).then(async (data) => {
      let campusName = data[0].displayName;
      if (item.label == "Installment001") {
        item["campus"] = campusName;
        await result["Term 1"].push(item);
      } else if (item.label == "Installment002") {
        item["campus"] = campusName;
        await result["Term 2"].push(item);
      }
    });
  }
  let term1TotalPlanned = result["Term 1"].reduce((a, b) => a + b.planned, 0);
  let term1TotalPending = result["Term 1"].reduce((a, b) => a + b.pending, 0);
  let term1TotalReceived = result["Term 1"].reduce((a, b) => a + b.received, 0);
  let term1TotalStudents = result["Term 1"].reduce(
    (a, b) => a + b.noOfStudentsPaid,
    0
  );
  result["Term 1"].push({
    totalPlanned: term1TotalPlanned,
    totalReceived: term1TotalReceived,
    totalPending: term1TotalPending,
    campus: "Total",
    totalStudentsPaid: term1TotalStudents,
  });
  result["Term 1"].sort((a, b) => (a.campus > b.campus ? 1 : -1));
  let term2TotalPlanned = result["Term 2"].reduce((a, b) => a + b.planned, 0);
  let term2TotalPending = result["Term 2"].reduce((a, b) => a + b.pending, 0);
  let term2TotalReceived = result["Term 2"].reduce((a, b) => a + b.received, 0);
  let term2TotalStudents = result["Term 2"].reduce(
    (a, b) => a + b.noOfStudentsPaid,
    0
  );

  result["Term 2"].push({
    totalPlanned: term2TotalPlanned,
    totalReceived: term2TotalReceived,
    totalPending: term2TotalPending,
    campus: "Total",
    totalStudentsPaid: term2TotalStudents,
  });
  result["Term 2"].sort((a, b) => (a.campus > b.campus ? 1 : -1));

  let overallPlanned = feePlanData
    .filter((term) => term.planned)
    .reduce((a, b) => a + b.planned, 0);
  let overallPending = feePlanData
    .filter((term) => term.pending)
    .reduce((a, b) => a + b.pending, 0);
  let overallReceived = feePlanData
    .filter((term) => term.received)
    .reduce((a, b) => a + b.received, 0);
  let overallStudentsPaid = feePlanData
    .filter((term) => term.noOfStudentsPaid)
    .reduce((a, b) => a + b.noOfStudentsPaid, 0);

  let campus1 = {
    campus: feePlanData[0].campus,
    overallPlanned: feePlanData[0].planned,
    overallPending: feePlanData[0].pending,
    overallReceived: feePlanData[0].received,
    overallStudentsPaid: feePlanData[0].noOfStudentsPaid,
  };
  let campus2 = {
    campus: feePlanData[1].campus,
    overallPlanned: feePlanData[1].planned,
    overallPending: feePlanData[1].pending,
    overallReceived: feePlanData[1].received,
    overallStudentsPaid: feePlanData[1].noOfStudentsPaid,
  };
  let campus3 = {
    campus: feePlanData[2].campus,
    overallPlanned: feePlanData[2].planned,
    overallPending: feePlanData[2].pending,
    overallReceived: feePlanData[2].received,
    overallStudentsPaid: feePlanData[2].noOfStudentsPaid,
  };
  result["Total"].push(campus1, campus2, campus3, {
    totalPlanned: overallPlanned,
    totalReceived: overallReceived,
    totalPending: overallPending,
    campus: "Total",
    totalStudentsPaid: overallStudentsPaid,
  });
  await result["Total"].sort((a, b) => (a.campus > b.campus ? 1 : -1));

  let trparams2 = [
    {
      $match: {
        transactionSubType: type,
      },
    },
  ];
  if (
    campusId !== undefined &&
    campusId !== null &&
    campusId !== "" &&
    campusId.toLowerCase() !== "all"
  ) {
    trparams2[1].$match.campusId = campusId;
  }
  if (
    userId &&
    userId !== undefined &&
    userId !== null &&
    userId !== "" &&
    userId.toLowerCase() !== "all"
  ) {
    trparams2[1].$match.createdBy = userId;
  }
  // if (
  //   req.query.section &&
  //   req.query.section !== undefined &&
  //   req.query.section.toLowerCase() !== "all"
  // ) {
  //   trparams2[0].$lookup = {
  //     from: "students",
  //     localField: "studentId",
  //     foreignField: "_id",
  //     as: "students",
  //   };
  //   trparams2[1].$match["students.section"] = req.query.section;
  // }
  // if (!req.query.section || req.query.section.toLowerCase() == "all") {
  //   trparams2 = [{ $match: trparams2[1].$match }];
  // }

  let getDatasDetailsfp = await transactionModel
    .aggregate(trparams2)
    .sort({ _id: -1 });

  return res.send(getDatasDetailsfp);
  let totalAmount = 0;
  let totalPending = 0;
  let totalPaidAmount = 0;
  let totalCash = 0;
  let totalCheque = 0;
  let totalCard = 0;
  let totalNetbanking = 0;
  let totalWallet = 0;
  let totalUpi = 0;
  var searchData = [];
  var getDatasDetails2 = [];
  let createXlxsData = [];
  var getDatasDetails2 = searchData.length > 0 ? searchData : getDatasDetailsfp;
  if (page && limit) {
    feepaymentData = await Paginator(
      getDatasDetails2,
      Number(page),
      Number(limit)
    );
  } else {
    feepaymentData = await Paginator(
      getDatasDetails2,
      1,
      getDatasDetails2.length
    );
  }

  console.log(
    "feepaymentdata",
    feepaymentData.totalRecord,
    feepaymentData.totalPages,
    feepaymentData.data.length
  );

  var transactionDetails = feepaymentData.data;
  var fpData = [];
  let cvr = [];
  let jbn = [];
  let cvrpp = [];
  let dueAmt;
  let totAmt;
  let campusData = await campusModel.find({});
  for (let i = 0; i < transactionDetails.length; i++) {
    const element = transactionDetails[i];
    var fbBreakUp = [];
    let fpElt = {};
    let stdData = await studentModel.findOne({
      regId: element["studentRegId"],
    });
    if (stdData) {
      let findcampus = await campusData.find(
        (item) => item._id.toString() == stdData._doc.campusId.toString()
      );

      let feePlandata = await feePlanModel.findOne({
        studentRegId: element.studentRegId,
      });
      let feeinstdata = await feeInstallmentPlanModel.find({
        feePlanId: feePlandata._doc._id,
      });
      var refundDet = (refundDet = await transactionModel.findOne({
        paymentRefId: element["displayName"],
        transactionSubType: "refund",
      }));
      var totalBalance = 0;
      fpElt["displayName"] = element["displayName"];
      fpElt["studentName"] = element["studentName"];
      fpElt["regId"] = element["studentRegId"];
      fpElt["academicYear"] = element["academicYear"];
      fpElt["classBatch"] = element["class"];
      fpElt["DemandId"] = element.relatedTransactions[0];
      fpElt["refundAmount"] = refundDet != null ? refundDet._doc["amount"] : 0;
      fpElt["description"] = [];
      fpElt["paymentDetails"] = element;
      for (let j = 0; j < feeinstdata.length; j++) {
        totAmt = feePlandata._doc.plannedAmount;
        dueAmt = feePlandata._doc.pendingAmount;
        totalBalance =
          feeinstdata[j + 1] &&
          Number(feeinstdata[j + 1]._doc["paidAmount"]) == 0
            ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
            : feeinstdata[j + 1] &&
              Number(feeinstdata[j + 1]._doc["paidAmount"]) > 0
            ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
            : Number(feeinstdata[j]._doc["pendingAmount"]);
        totalDue = parseFloat(feePlandata._doc["plannedAmount"]);
        totalPaid = parseFloat(element["amount"]);
      }
      if (findcampus._doc.displayName.toLowerCase().includes("cvr")) {
        cvr.push({
          "RECEIPT ID": element["displayName"],
          "REG ID": element["studentRegId"],
          "STUDENT NAME": element["studentName"],
          "ACADEMIC YEAR": element["academicYear"],
          "CLASS/BATCH": element["class"],
          "PARENT NAME": stdData ? stdData._doc.parentName : "",
          "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
          "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
          DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
          "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
          "PAID (INR)": feePlandata._doc["paidAmount"],
          "PAID ON": await onDateFormat(element["transactionDate"]),
          MODE: element.data.mode.toUpperCase(),
          "TRANSACTION ID": element["paymentTransactionId"],
          "PENDING (INR)": feePlandata._doc["pendingAmount"],
          // "REFUND": this.formatAmount(item.refundAmount),
          STATUS: "Paid",
        });
      } else if (findcampus._doc.displayName.toLowerCase().includes("pp")) {
        cvrpp.push({
          "RECEIPT ID": element["displayName"],
          "REG ID": element["studentRegId"],
          "STUDENT NAME": element["studentName"],
          "ACADEMIC YEAR": element["academicYear"],
          "CLASS/BATCH": element["class"],
          "PARENT NAME": stdData ? stdData._doc.parentName : "",
          "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
          "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
          DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
          "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
          "PAID (INR)": element["amount"],
          "PAID ON": await onDateFormat(element["transactionDate"]),
          MODE: element.data.mode.toUpperCase(),
          "TRANSACTION ID": element["paymentTransactionId"],
          "PENDING (INR)": feePlandata._doc["pendingAmount"],
          // "REFUND": this.formatAmount(item.refundAmount),
          STATUS: "Paid",
        });
      } else if (findcampus._doc.displayName.toLowerCase().includes("jbn")) {
        jbn.push({
          "RECEIPT ID": element["displayName"],
          "REG ID": element["studentRegId"],
          "STUDENT NAME": element["studentName"],
          "ACADEMIC YEAR": element["academicYear"],
          "CLASS/BATCH": element["class"],
          "PARENT NAME": stdData ? stdData._doc.parentName : "",
          "PARENT PHONE NO.": stdData ? stdData._doc.parentPhone : "",
          "PARENT EMAIL": stdData ? stdData._doc.parentEmail : "",
          DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
          "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
          "PAID (INR)": element["amount"],
          "PAID ON": await onDateFormat(element["transactionDate"]),
          MODE: element.data.mode.toUpperCase(),
          "TRANSACTION ID": element["paymentTransactionId"],
          "PENDING (INR)": feePlandata._doc["pendingAmount"],
          // "REFUND": this.formatAmount(item.refundAmount),
          STATUS: "Paid",
        });
      }
    }
  }

  var wscols1 = [];
  var wscols2 = [];
  var wscols3 = [];
  var findCellWidth = {};
  var cellKeys1 =
    cvr.length > 0
      ? Object.keys(cvr["0"])
      : [
          "RECEIPT ID",
          "REG ID",
          "STUDENT NAME",
          "ACADEMIC YEAR",
          "CLASS/BATCH",
          "PARENT NAME",
          "PARENT PHONE NO.",
          "PARENT EMAIL",
          "DESCRIPTION",
          "TOTAL FEES (INR)",
          "PAID (INR)",
          "PAID ON",
          "MODE",
          "PENDING (INR)",
          "TRANSACTION ID",
          "STATUS",
        ];
  var cellKeys2 =
    jbn.length > 0
      ? Object.keys(jbn["0"])
      : [
          "RECEIPT ID",
          "REG ID",
          "STUDENT NAME",
          "ACADEMIC YEAR",
          "CLASS/BATCH",
          "PARENT NAME",
          "PARENT PHONE NO.",
          "PARENT EMAIL",
          "DESCRIPTION",
          "TOTAL FEES (INR)",
          "PAID (INR)",
          "PAID ON",
          "MODE",
          "PENDING (INR)",
          "TRANSACTION ID",
          "STATUS",
        ];
  var cellKeys3 =
    cvrpp.length > 0
      ? Object.keys(cvrpp["0"])
      : [
          "RECEIPT ID",
          "REG ID",
          "STUDENT NAME",
          "ACADEMIC YEAR",
          "CLASS/BATCH",
          "PARENT NAME",
          "PARENT PHONE NO.",
          "PARENT EMAIL",
          "DESCRIPTION",
          "TOTAL FEES (INR)",
          "PAID (INR)",
          "PAID ON",
          "MODE",
          "PENDING (INR)",
          "TRANSACTION ID",
          "STATUS",
        ];
  cvr.map((key, keyIndex) => {
    cellKeys1.map((cellKey) => {
      if (findCellWidth[cellKey] != undefined) {
        findCellWidth[cellKey] =
          Number(findCellWidth[cellKey]) > String(key[cellKey]).length
            ? findCellWidth[cellKey]
            : String(key[cellKey]).length;
      } else {
        // console.log(cellKeys1[cellKey], String(cellKeys1[cellKey]).length)
        findCellWidth[cellKey] = Number(String(cellKey).length);
      }
    });
  });
  cellKeys1.map((cellKey) => {
    if (cellKey == "PAID ON") {
    } else if (cellKey == "PENDING (INR)") {
      wscols1.push({
        wch: findCellWidth[cellKey],
        s: { font: { bold: true } },
        font: { bold: true },
      });
    } else {
      wscols1.push({
        wch: findCellWidth[cellKey] + 5,
        s: { font: { bold: true } },
        font: { bold: true },
      });
    }
  });
  jbn.map((key, keyIndex) => {
    cellKeys2.map((cellKey) => {
      if (findCellWidth[cellKey] != undefined) {
        findCellWidth[cellKey] =
          Number(findCellWidth[cellKey]) > String(key[cellKey]).length
            ? findCellWidth[cellKey]
            : String(key[cellKey]).length;
      } else {
        console.log(cellKeys2[cellKey], String(cellKeys2[cellKey]).length);
        findCellWidth[cellKey] = Number(String(cellKey).length);
      }
    });
  });
  // console.log(findCellWidth)
  cellKeys2.map((cellKey) => {
    if (cellKey == "PAID ON") {
    } else if (cellKey == "PENDING (INR)") {
      wscols2.push({
        wch: findCellWidth[cellKey],
        s: { font: { bold: true } },
        font: { bold: true },
      });
    } else {
      wscols2.push({
        wch: findCellWidth[cellKey] + 5,
        s: { font: { bold: true } },
        font: { bold: true },
      });
    }
  });
  cvrpp.map((key, keyIndex) => {
    cellKeys3.map((cellKey) => {
      if (findCellWidth[cellKey] != undefined) {
        findCellWidth[cellKey] =
          Number(findCellWidth[cellKey]) > String(key[cellKey]).length
            ? findCellWidth[cellKey]
            : String(key[cellKey]).length;
      } else {
        console.log(cellKeys3[cellKey], String(cellKeys3[cellKey]).length);
        findCellWidth[cellKey] = Number(String(cellKey).length);
      }
    });
  });
  // console.log(findCellWidth)
  cellKeys3.map((cellKey) => {
    if (cellKey == "PAID ON") {
    } else if (cellKey == "PENDING (INR)") {
      wscols3.push({
        wch: findCellWidth[cellKey],
        s: { font: { bold: true } },
        font: { bold: true },
      });
    } else {
      wscols3.push({
        wch: findCellWidth[cellKey] + 5,
        s: { font: { bold: true } },
        font: { bold: true },
      });
    }
  });
  var J = xlsx.utils.decode_col("J"); // 1
  var K = xlsx.utils.decode_col("K"); // 1
  var N = xlsx.utils.decode_col("O"); // 1
  var wb = xlsx.utils.book_new();
  var fmt = "#,##,##0.00"; // or '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)' or any Excel number format
  var wscvr = await xlsx.utils.json_to_sheet(cvr, {
    raw: false,
    numFmt: "$#,###.00",
    dateNF: "dd-MM-yy",
  });
  var range1 = xlsx.utils.decode_range(wscvr["!ref"]);
  for (var i = range1.s.r + 1; i <= range1.e.r; ++i) {
    var ref = xlsx.utils.encode_cell({ r: i, c: J });
    var ref1 = xlsx.utils.encode_cell({ r: i, c: K });
    var ref2 = xlsx.utils.encode_cell({ r: i, c: N });
    // G
    if (!wscvr[ref]) continue;
    if (wscvr[ref].t != "n") continue;
    wscvr[ref].z = fmt;
    // H
    if (!wscvr[ref1]) continue;
    if (wscvr[ref1].t != "n") continue;
    wscvr[ref1].z = fmt;
    // K
    if (!wscvr[ref2]) continue;
    if (wscvr[ref2].t != "n") continue;
    wscvr[ref2].z = fmt;
  }
  var wsjbn = await xlsx.utils.json_to_sheet(jbn, {
    raw: false,
    numFmt: "$#,###.00",
    dateNF: "dd-MM-yy",
  });
  var range2 = xlsx.utils.decode_range(wsjbn["!ref"]);
  for (var i = range2.s.r + 1; i <= range2.e.r; ++i) {
    var ref = xlsx.utils.encode_cell({ r: i, c: J });
    var ref1 = xlsx.utils.encode_cell({ r: i, c: K });
    var ref2 = xlsx.utils.encode_cell({ r: i, c: N });
    // G
    if (!wsjbn[ref]) continue;
    if (wsjbn[ref].t != "n") continue;
    wsjbn[ref].z = fmt;
    // H
    if (!wsjbn[ref1]) continue;
    if (wsjbn[ref1].t != "n") continue;
    wsjbn[ref1].z = fmt;
    // K
    if (!wsjbn[ref2]) continue;
    if (wsjbn[ref2].t != "n") continue;
    wsjbn[ref2].z = fmt;
  }
  var wspp = await xlsx.utils.json_to_sheet(cvrpp, {
    raw: false,
    numFmt: "$#,###.00",
    dateNF: "dd-MM-yy",
  });
  var range3 = xlsx.utils.decode_range(wspp["!ref"]);
  for (var i = range3.s.r + 1; i <= range3.e.r; ++i) {
    var ref = xlsx.utils.encode_cell({ r: i, c: J });
    var ref1 = xlsx.utils.encode_cell({ r: i, c: K });
    var ref2 = xlsx.utils.encode_cell({ r: i, c: N });
    // G
    if (!wspp[ref]) continue;
    if (wspp[ref].t != "n") continue;
    wspp[ref].z = fmt;
    // H
    if (!wspp[ref1]) continue;
    if (wspp[ref1].t != "n") continue;
    wspp[ref1].z = fmt;
    // K
    if (!wspp[ref2]) continue;
    if (wspp[ref2].t != "n") continue;
    wspp[ref2].z = fmt;
  }
  wscvr["!cols"] = wscols1;
  wspp["!cols"] = wscols2;
  wsjbn["!cols"] = wscols3;
  console.log(wscols1[0].s.font);
  xlsx.utils.book_append_sheet(wb, wscvr, "CV Raman Nagar");
  xlsx.utils.book_append_sheet(wb, wspp, "CV Raman Nagar PP");
  xlsx.utils.book_append_sheet(wb, wsjbn, "Jeevan Bima Nagar");
  // xlsx.writeFile(wb, "student_daily_fee_reports.xlsx")
  let attachmentsPaths = await xlsx.write(wb, {
    type: "buffer",
    bookType: "xlsx",
  });
  // res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  let sgKey = process.env.sendgridKey;
  sgMail.setApiKey(sgKey);
  let msg;
  const attachment = Buffer.from(attachmentsPaths).toString("base64");
  const dailyReport = await dailyReportTemplate(result);

  let payload = { html: dailyReport };
  let createPdf = await axios.post(`${process.env.externalServer}`, payload);
  const attachment2 = Buffer.from(createPdf.data.file).toString("base64");
  let filename = `Daily Report.xlsx`;

  const usersSchema = mongoose.Schema({}, { strict: false });
  const usersModel = usersDbCollection.model(
    `Users_${process.env.stage}`,
    usersSchema,
    `Users_${process.env.stage}`
  );
  // const usersDbCollection = await createConnection(`Zq-EduUser-dev`, process.env.central_mongoDbUrl);
  // const usersModel = usersDbCollection.model(`Users_dev`, usersSchema, `Users_dev`);

  let emails = [];
  await usersModel.find({ willRcvDFCR: true }).then(async (usersData) => {
    usersData.forEach((element) => {
      emails.push(element._doc.email);
    });
    console.log("user emails", emails);
    if (emails.length > 0) {
      msg = {
        // to: emails, // Change to your recipient
        to: "muniyaraj.neelamegam@zenqore.com",
        from: process.env.sendgridEmail, // Change to your verified sender
        subject: `NCFE - Daily Fee Collection Report of ${moment().format(
          "DD/MM/YYYY"
        )}`,
        html: `Dear NCFE Team, <br/> <br/> Please find the attached Daily Fee Collection Report of ${moment().format(
          "DD/MM/YYYY"
        )} for your reference.<br/><br/>Regards <br/>`,
        attachments: [
          {
            content: attachment,
            filename: filename,
            type: "text/html",
            disposition: "attachment",
          },
          {
            content: attachment2,
            filename: "Daily Report.pdf",
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      };
      let sendemail = await sendDailyReportTemplate(msg);
      console.log(sendemail);
    } else {
      msg = {
        // to: emails, // Change to your recipient
        to: "muniyaraj.neelamegam@zenqore.com",
        from: process.env.sendgridEmail, // Change to your verified sender
        subject: `NCFE - Daily Fee Collection Report of ${moment().format(
          "DD/MM/YYYY"
        )}`,
        html: `Dear NCFE Team, <br/> <br/> Please find the attached Daily Fee Collection Report of ${moment().format(
          "DD/MM/YYYY"
        )} for your reference.<br/><br/>Regards <br/>`,
        attachments: [
          {
            content: attachment,
            filename: filename,
            type: "text/html",
            disposition: "attachment",
          },
          {
            content: attachment2,
            filename: "Daily Report.pdf",
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      };
      let sendemail = await sendDailyReportTemplate(msg);
      res.status(200).send("email sent");
    }
  });
  // } catch (err) {
  //   console.log({ status: "failure", message: "daily report: " + err.message })
  // }
  // finally {
  //   console.log("Closing Database")
  //   dbConnection.close();
  //   centralDbConnection.close()
  //   usersDbCollection.close()
  // }
}

async function onDateFormat(d) {
  let dateField = new Date(String(d));
  let month = dateField.getMonth() + 1;
  month = String(month).length == 1 ? `0${String(month)}` : String(month);
  let date = dateField.getDate();
  date = String(date).length == 1 ? `0${String(date)}` : String(date);
  let year = dateField.getFullYear();
  return `${date}/${month}/${year}`;
}

async function sendDailyReportTemplate(message) {
  sgMail
    .send(message)
    .then(() => {
      console.log("Sent Email");
      var obj = {
        success: true,
      };
      console.log("Daily Report sent through cron job");
      message.to = "muniyaraj.neelamegam@zenqore.com";
      sgMail
        .send(message)
        .then(() => {
          console.log("Sent Email send to Mehul Patel");
          var obj = {
            success: true,
          };
          console.log("Daily Report sent to Mehul through cron job");
          return {
            status: "success",
            message: "Daily Report sent to Mehul through cron job",
          };
        })
        .catch((error) => {
          console.log("error", error);
          var obj = {
            success: false,
          };
          return obj;
        });
      // res.send({ status: "success", message: "Daily Report Mail Sent", data: result })
    })
    .catch((error) => {
      console.log("error", error);
      var obj = {
        success: false,
      };
      // return obj;
    });
}

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

module.exports = {
  calculateReports: calculateReports,
  DRFC: DRFC,
};
