const orgListSchema = require("../../models/orglists-schema");
const { createDatabase, createConnection } = require("../../utils/db_creation");
const feeplanschema = require("../../models/feeplanModel");
const StudentSchema = require("../../models/studentModel");
const sgMail = require("@sendgrid/mail");
const mongoose = require("mongoose");

const HummusRecipe = require("hummus-recipe");
const Promise = require("bluebird");
const XlsxPopulate = require("xlsx-populate");
XlsxPopulate.Promise = Promise;
const fs = require("fs");

// const GuardianSchema = require("../../models/guardianModel");
// const ReminderSchema = require("../../models/reminderModel");
const transactionCollectionName = "transactions";
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
var moment = require("moment");
const axios = require("axios");
const xlsx = require("xlsx");
var campusSchema = require("../../models/campusModel");
const transactionsSchema = require("../../models/transactionsModel");
const ProgramPlanSchema = require("../../models/programPlanModel");
const settingsSchema = require("../../models/settings/settings");
const {
  dailyReportTemplate,
} = require("../../utils/helper_functions/templates/daily-report-template");

const PubNub = require("pubnub");
var pubnub = new PubNub({
  subscribeKey: "sub-c-40815e58-bc97-11eb-9c3c-fe487e55b6a4",
  publishKey: "pub-c-2d5b6cbe-9af0-4733-be3e-90aad2cd9485",
  secretKey: "sec-c-ZDQ2OTI0MzAtMDllMS00NTQ2LTg5NmQtMDM4YzU3OTAxZDhj",
  ssl: false,
});

async function processDFCR(orgId) {
  let dbConnection;
  let centralDbConnection;
  let campusId = "All";
  let userId = "All";

  centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  console.log("stage", process.env.stage);
  console.log("mongoUri", process.env.central_mongoDbUrl);

  const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");

  const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
  console.log("orgId:", orgData._id, ",connUri:", orgData.connUri);
  dbConnection = await createDatabase(String(orgData._id), orgData.connUri);

  let settingsModel = await dbConnection.model("settings", settingsSchema);
  let settingsData = await settingsModel.find({});

  let instituteDetails = settingsData[0]._doc;
  let logo = instituteDetails.logo.logo;
  let orgName = orgData.nameSpace;

  console.log("DFCR is running for", orgId, orgName);
  let pubnubConfig = {
    channel: `zenqore-${orgName}`,
    message: {
      description: {
        message: "DFCR is creating",
        "Creation Time": moment().utcOffset("GMT+0530").format("h:mm a"),
        status: "Started",
      },
    },
  };
  await pubnub.publish(pubnubConfig);

  let type = "feePayment";
  const campusModel = dbConnection.model("campuses", campusSchema, "campuses");
  let feePlanModel = dbConnection.model("studentfeeplans", feeplanschema);
  let feeInstallmentPlanModel = dbConnection.model("studentfeeinstallmentplans", feeplanInstallmentschema);
  // let feeTypeModel = await dbConnection.model("feeTypes", FeeTypeSchema);
  // let studentModel = await dbConnection.model("students", StudentSchema);
  let programPlanSchema = await dbConnection.model("programplans", ProgramPlanSchema);
  // let feeManagerSchema = await dbConnection.model("feemanagers", FeeManagerSchema);
  // let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  // let guardianModel = dbConnection.model("guardian", GuardianSchema);
  var transactionModel = await dbConnection.model(transactionCollectionName, transactionsSchema, transactionCollectionName);

  const feePlanAggregate = [
    {
      $lookup: {
        from: "students",
        localField: "studentRegId",
        foreignField: "regId",
        as: "students",
      },
    },
    { "$addFields": { "campusId": { "$toObjectId": "$campusId" } } },
    {
      "$lookup": {
        "from": "campuses",
        "localField": "campusId",
        "foreignField": "_id",
        "as": "campuses"
      }
    },
    {
      $unwind: "$students",
    },
    {
      $match: {
        "students.status": 1
      }
    },
    {
      $group: {
        _id: { campusId: "$campusId" },
        planned: { $sum: "$plannedAmount" },
        received: { $sum: "$paidAmount" },
        pending: { $sum: "$pendingAmount" },
        campusName: { $first: "$campuses.displayName" }
      },
    },
    {
      $project: {
        _id: 0,
        campusId: "$_id.campusId",
        campus: { $arrayElemAt: ["$campusName", 0] },
        planned: { $round: ["$planned", 2] },
        received: { $round: ["$received", 2] },
        pending: { $round: ["$pending", 2] }
      },
    },
  ];
  var feePlanAggregateData = await feePlanModel.aggregate(feePlanAggregate);
  const aggregatePipeline = [
    {
      $lookup: {
        from: "studentfeeplans",
        localField: "feePlanId",
        foreignField: "_id",
        as: "studentFeeplans",
      },
    },
    {
      $lookup: {
        from: "students",
        localField: "studentFeeplans.studentRegId",
        foreignField: "regId",
        as: "students",
      },
    },
    { "$addFields": { "campusId": { "$toObjectId": "$campusId" } } },
    {
      "$lookup": {
        "from": "campuses",
        "localField": "campusId",
        "foreignField": "_id",
        "as": "campuses"
      }
    },
    {
      $unwind: "$students",
    },
    {
      $match: {
        "students.status": 1
      }
    },
    {
      $group: {
        _id: { label: "$label", campus: "$campusId" },
        planned: { $sum: "$plannedAmount" },
        received: { $sum: "$paidAmount" },
        pending: { $sum: "$pendingAmount" },
        campusName: { $first: "$campuses.displayName" },
        // plannedAmountBreakup: { $first: "$plannedAmountBreakup" },
        term: { $first : "$term" }
      },
    },
    {
      $project: {
        _id: 0,
        campusId: "$_id.campus",
        campus: { $arrayElemAt: ["$campusName", 0] },
        term: "$term",
        planned: { $round: ["$planned", 2] },
        received: { $round: ["$received", 2] },
        pending: { $round: ["$pending", 2] },
        // plannedAmountBreakup: "$plannedAmountBreakup",
      },
    },
  ];
  let feePlanArray = [];
  var feePlanAggregateData = await feePlanModel.aggregate(feePlanAggregate);
  var aggregateData = await feeInstallmentPlanModel.aggregate(aggregatePipeline);
  let feePlanData = feePlanAggregateData.sort((a, b) => (a.campus > b.campus ? 1 : -1));
  var result = {};
  result.fromDate = moment().format("ll");
  result.toDate = moment().format("ll");
  result.time = moment().utcOffset("GMT+0530").format("LT");

  result["Term 1"] = [];
  result["Term 2"] = [];
  result["Total"] = [];

  for (let i = 0; i < aggregateData.length; i++) {
    const item = aggregateData[i];
    if (Number(item.term) == 1) {
      item.plannedAmountBreakup = undefined;
      await result["Term 1"].push(item);
    } else if (Number(item.term) == 2) {
      item.plannedAmountBreakup = undefined;
      await result["Term 2"].push(item);
    }
  }

  async function arrangeCampusData(data) {
    var result = [];
    data.forEach(function (item) {
      var id = item.campusId;
      if (!this[id]) {
        result.push((this[id] = item));
      } else {
        this[id].planned += Number(Number(item.planned).toFixed(2));
        this[id].received += Number(Number(item.received).toFixed(2));
        this[id].pending += Number(Number(item.pending).toFixed(2));
      }
    }, Object.create(null));
    return result;
  }
  result["Term 1"] = await arrangeCampusData(result["Term 1"]);
  result["Term 2"] = await arrangeCampusData(result["Term 2"]);

  let term1TotalPlanned = result["Term 1"].reduce((a, b) => a + b.planned, 0);
  let term1TotalPending = result["Term 1"].reduce((a, b) => a + b.pending, 0);
  let term1TotalReceived = result["Term 1"].reduce((a, b) => a + b.received, 0);

  result["Term 1"].push({
    totalPlanned: Number(Number(term1TotalPlanned).toFixed(2)),
    totalReceived: Number(Number(term1TotalReceived).toFixed(2)),
    totalPending: Number(Number(term1TotalPending).toFixed(2)),
    campus: "Total",
  });
  result["Term 1"].sort((a, b) => (a.campus > b.campus ? 1 : -1));

  let term2TotalPlanned = result["Term 2"].reduce((a, b) => a + b.planned, 0);
  let term2TotalPending = result["Term 2"].reduce((a, b) => a + b.pending, 0);
  let term2TotalReceived = result["Term 2"].reduce((a, b) => a + b.received, 0);

  result["Term 2"].push({
    totalPlanned: Number(Number(term2TotalPlanned).toFixed(2)),
    totalReceived: Number(Number(term2TotalReceived).toFixed(2)),
    totalPending: Number(Number(term2TotalPending).toFixed(2)),
    campus: "Total",
  });
  result["Term 2"].sort((a, b) => (a.campus > b.campus ? 1 : -1));

  let overallPlanned = feePlanData.filter((term) => term.planned).reduce((a, b) => a + b.planned, 0);
  let overallPending = feePlanData.filter((term) => term.pending).reduce((a, b) => a + b.pending, 0);
  let overallReceived = feePlanData.filter((term) => term.received).reduce((a, b) => a + b.received, 0);

  feePlanData.map((item, index) => {
    result["Total"].push({
      campus: item.campus,
      overallPlanned: item.planned,
      overallPending: item.pending,
      overallReceived: item.received
    });
  });
  result["Total"].push({
    totalPlanned: Number(Number(overallPlanned).toFixed(2)),
    totalReceived: Number(Number(overallReceived).toFixed(2)),
    totalPending: Number(Number(overallPending).toFixed(2)),
    campus: "Total",
  });
  await result["Total"].sort((a, b) => (a.campus > b.campus ? 1 : -1));

  // ----------------------------------------

  let fromDate1 = new Date(new Date().setHours(0, 0, 0, 0));
  let toDate1 = new Date(new Date().setHours(23, 59, 59, 999));
  console.log("from date", fromDate1.toISOString());
  console.log("to date ", toDate1.toISOString());

  //Today Fee collection report
  const todayFeeCollection = [
    {
      $match: {
        transactionSubType: "feePayment",
        status: { $not: { $eq: String("Cancelled") } },
        createdAt: { $gt: fromDate1, $lt: toDate1 }
      }
    },
    {
      $group: {
        _id: { campus: "$campusId" },
        uniqueIds: { $addToSet: "$studentRegId" },
        received: { $sum: "$amount" },
        title: { $first: "$data.feesBreakUp" },
      },
    },
    {
      $project: {
        _id: 0,
        campusId: "$_id.campus",
        title: { $arrayElemAt: ["$title.title", 0] },
        received: { $round: ["$received", 2] },
        noOfStudentsPaid: { $size: "$uniqueIds" },
      },
    },
  ];
  var todayTxnData = await transactionModel.aggregate(todayFeeCollection);

  let todayResult = [];
  const allCampus = await campusModel.find({});

  allCampus.map((item) => {
    todayResult.push({
      campus: item.displayName,
      campusId: item._id,
      term1TotalReceived: 0,
      term2TotalReceived: 0,
      term1TotalStudents: 0,
      term2TotalStudents: 0,
    });
  });

  let term1TotalReceivedToday = todayTxnData.filter((item) => item.title == "Term 1 Fees").reduce((a, b) => a + b.received, 0);
  let term1TotalStudentsToday = todayTxnData.filter((item) => item.title == "Term 1 Fees").reduce((a, b) => a + b.noOfStudentsPaid, 0);

  let term2TotalReceivedToday = todayTxnData.filter((item) => item.title == "Term 2 Fees").reduce((a, b) => a + b.received, 0);
  let term2TotalStudentsToday = todayTxnData.filter((item) => item.title == "Term 2 Fees").reduce((a, b) => a + b.noOfStudentsPaid, 0);

  todayResult.map((item) => {
    todayTxnData.map((txnItem) => {
      if (txnItem.title == "Term 1 Fees") {
        if (txnItem.campusId == item.campusId) {
          item["term1TotalReceived"] += txnItem.received;
          item["term1TotalStudents"] += txnItem.noOfStudentsPaid;
        }
      } else if (txnItem.title == "Term 2 Fees") {
        if (txnItem.campusId == item.campusId) {
          item["term2TotalReceived"] += txnItem.received;
          item["term2TotalStudents"] += txnItem.noOfStudentsPaid;
        }
      }
    });
  });
  todayResult.push({
    campus: "Total",
    term1TotalReceived: term1TotalReceivedToday,
    term2TotalReceived: term2TotalReceivedToday,
    term1TotalStudents: term1TotalStudentsToday,
    term2TotalStudents: term2TotalStudentsToday,
  });

  await todayResult.sort((a, b) => (a.campus > b.campus ? 1 : -1));
  console.log("TodayResult", todayResult);
  console.log("Daily Report Excel file is creating..!! Please Wait for Sometime...");

  async function getAllDetails() {
    const allProgramPlan = await programPlanSchema.find({ status: 1 });
    const allCampus = await campusModel.find({});
    const studentAggregator = [
      {
        $lookup: {
          from: "students",
          localField: "studentRegId",
          foreignField: "regId",
          as: "students",
        },
      },
      {
        $lookup: {
          from: "studentfeeinstallmentplans",
          localField: "_id",
          foreignField: "feePlanId",
          as: "installmentData",
        },
      },
      {
        $lookup: {
          from: "studentfeeinstallmentplans",
          localField: "_id",
          foreignField: "feePlanId",
          as: "installmentData",
        },
      },
      {
        $unwind: "$installmentData",
      },
      {
        $unwind: "$students",
      },
      {
        $match: {
          "students.status": 1
        }
      },
      {
        $group: {
          _id: {
            studentRegId: "$students.regId",
            studentId: "$students._id",
            studentName: {
              $concat: ["$students.firstName", " ", "$students.lastName"],
            },
            campusId: "$students.campusId",
            section: "$students.section",
            displayName: "$students.displayName",
            studentPhone: "$students.phoneNo",
            studentEmail: "$students.email",
            parentName: "$students.parentName",
            parentPhone: "$students.parentPhone",
            parentEmail: "$students.parentEmail",
            category: "$students.category",
            programPlanId: "$students.programPlanId",
            totalPlannedAmount: "$plannedAmount",
            studentTotalAmount: "$totalAmount",
            totalPaidAmount: "$paidAmount",
            totalPendingAmount: "$pendingAmount",
            totalDiscount: "$discountAmount",
            remarks: "$remarks.feeRemarks"
          },
          installmentData: {
            $push: {
              title: "$installmentData.label",
              term: "$installmentData.term",
              percentage: "$installmentData.percentage",
              overallAmount: "$installmentData.totalAmount",
              totalAmount: "$installmentData.plannedAmount",
              paidAmount: "$installmentData.paidAmount",
              pendingAmount: "$installmentData.pendingAmount",
              discountAmount: "$installmentData.discountAmount",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          regId: "$_id.studentRegId",
          studentId: "$_id.studentId",
          studentName: "$_id.studentName",
          campusId: "$_id.campusId",
          section: "$_id.section",
          displayName: "$_id.displayName",
          studentPhone: "$_id.studentPhone",
          studentEmail: "$_id.studentEmail",
          parentName: "$_id.parentName",
          parentPhone: "$_id.parentPhone",
          parentEmail: "$_id.parentEmail",
          category: "$_id.category",
          programPlanId: "$_id.programPlanId",
          studentTotalAmount: "$_id.studentTotalAmount",
          totalPlannedAmount: "$_id.totalPlannedAmount",
          totalPaidAmount: "$_id.totalPaidAmount",
          totalPendingAmount: "$_id.totalPendingAmount",
          totalDiscount: "$_id.totalDiscount",
          installmentData: "$installmentData",
          remarks: "$_id.remarks"
        },
      },
    ];
    const totalData = await feePlanModel.aggregate(studentAggregator);
    for (let i = 0; i < totalData.length; i++) {
      let campusDetail = [];
      const item = totalData[i];
      campusDetail = allCampus.filter((CampusItem) => {
        if (item.campusId == CampusItem._id) {
          return CampusItem;
        }
      });
      if (campusDetail.length != 0) {
        item["campusName"] = campusDetail[0].displayName;
      } else {
        item["campusName"] = "";
      }
    }
    for (let i = 0; i < totalData.length; i++) {
      let campusDetail = [];
      const item = totalData[i];
      campusDetail = allProgramPlan.filter((CampusItem) => {
        if (String(item.programPlanId) == String(CampusItem._id)) {
          return CampusItem;
        }
      });
      if (campusDetail.length != 0) {
        item["classBatch"] = campusDetail[0].title;
      } else {
        item["classBatch"] = "";
      }
    }
    for (let i = 0; i < totalData.length; i++) {
      let campusDetail = [];
      campusDetail = totalData.sort(function (a, b) {
        return a.regId - b.regId;
      });
      return campusDetail;
    }
    return totalData;
  }
  let allexcelData = await getAllDetails();

  // -------------------------------Campuswise Report---------------------
  //Creating Campuswise Report
  const cvrData = { "overall": [], "term1Defaulters": [], "term1Paid": [], "term2Defaulters": [], "term2Paid": [] }
  const jbnData = { "overall": [], "term1Defaulters": [], "term1Paid": [], "term2Defaulters": [], "term2Paid": [] }
  const ppData = { "overall": [], "term1Defaulters": [], "term1Paid": [], "term2Defaulters": [], "term2Paid": [] }

  let cvrterm1pending = 0
  let cvrterm2pending = 0
  let jbnterm1pending = 0
  let jbnterm2pending = 0
  let ppterm1pending = 0
  let ppterm2pending = 0

  let cvrterm1paid = 0
  let cvrterm2paid = 0
  let jbnterm1paid = 0
  let jbnterm2paid = 0
  let ppterm1paid = 0
  let ppterm2paid = 0

  for (let i = 0; i < allexcelData.length; i++) {
    const element = allexcelData[i];
    if (element.campusName.includes('CVR')) {
      let instData = element.installmentData.sort((a, b) => (a.title > b.title ? 1 : -1));
      // let totalDiscount = instData.reduce((a, b) => a + b.discountAmount, 0)
      let totalDiscount = element.totalDiscount
      let inst1Total = 0
      let inst1Discount = 0
      let inst1Paid = 0
      let inst1Pending = 0
      let inst2Total = 0
      let inst2Discount = 0
      let inst2Paid = 0
      let inst2Pending = 0
      let inst3Total = 0
      let inst3Discount = 0
      let inst3Paid = 0
      let inst3Pending = 0
      let inst4Total = 0
      let inst4Discount = 0
      let inst4Paid = 0
      let inst4Pending = 0

      let term1 = instData.filter(item => { if (Number(item.term) == 1) { return item } });
      let term2 = instData.filter(item => { if (Number(item.term) == 2) { return item } });
      if (term1.length == 1) {
        inst1Total = Number(Number(term1[0].totalAmount * 0.6).toFixed(2))
        inst1Discount = Number(Number(term1[0].discountAmount * 0.6).toFixed(2))
        inst1Paid = Number(Number(term1[0].paidAmount * 0.6).toFixed(2))
        inst1Pending = Number(Number(term1[0].pendingAmount * 0.6).toFixed(2))

        inst2Total = Number(Number(term1[0].totalAmount * 0.4).toFixed(2))
        inst2Discount = Number(Number(term1[0].discountAmount * 0.4).toFixed(2))
        inst2Paid = Number(Number(term1[0].paidAmount * 0.4).toFixed(2))
        inst2Pending = Number(Number(term1[0].pendingAmount * 0.4).toFixed(2))

        // inst1Total = term1[0].totalAmount
        // inst1Discount = term1[0].discountAmount
        // inst1Paid = term1[0].paidAmount
        // inst1Pending = term1[0].pendingAmount

        // inst2Total = 0
        // inst2Discount = 0
        // inst2Paid = 0
        // inst2Pending = 0
      } else if (term1.length == 2) {
        inst1Total = term1[0].totalAmount
        inst1Discount = term1[0].discountAmount
        inst1Paid = term1[0].paidAmount
        inst1Pending = term1[0].pendingAmount
        inst2Total = term1[1].totalAmount
        inst2Discount = term1[1].discountAmount
        inst2Paid = term1[1].paidAmount
        inst2Pending = term1[1].pendingAmount
      }
      if (term2.length == 1) {
        inst3Total = Number(Number(term2[0].totalAmount * 0.6).toFixed(2))
        inst3Discount = Number(Number(term2[0].discountAmount * 0.6).toFixed(2))
        inst3Paid = Number(Number(term2[0].paidAmount * 0.6).toFixed(2))
        inst3Pending = Number(Number(term2[0].pendingAmount * 0.6).toFixed(2))
        inst4Total = Number(Number(term2[0].totalAmount * 0.4).toFixed(2))
        inst4Discount = Number(Number(term2[0].discountAmount * 0.4).toFixed(2))
        inst4Paid = Number(Number(term2[0].paidAmount * 0.4).toFixed(2))
        inst4Pending = Number(Number(term2[0].pendingAmount * 0.4).toFixed(2))
      }
      else if (term2.length == 2) {
        inst3Total = term2[0].totalAmount
        inst3Discount = term2[0].discountAmount
        inst3Paid = term2[0].paidAmount
        inst3Pending = term2[0].pendingAmount
        inst4Total = term2[1].totalAmount
        inst4Discount = term2[1].discountAmount
        inst4Paid = term2[1].paidAmount
        inst4Pending = term2[1].pendingAmount
      }
      cvrterm1pending = cvrterm1pending + inst1Pending + inst2Pending
      cvrterm2pending = cvrterm2pending + inst3Pending + inst4Pending

      cvrterm1paid = cvrterm1paid + inst1Paid + inst2Paid
      cvrterm2paid = cvrterm2paid + inst3Paid + inst4Paid


      // let jbnterm1pending = 0
      // let jbnterm2pending = 0
      // let ppterm1pending = 0
      // let ppterm2pending = 0
      // console.log('index', i + 1, 'CVR', 'regId', element.regId, 'instData length', instData.length)

      // if (Number(instData.length) == 3) { //60 20 20 ---> 40 20 20 20
      //   let updatedInstData = []
      //   for (let j = 0; j < instData.length; j++) {
      //     const instElement = instData[j];

      //     if (Number(instElement.percentage) == Number(60) && instElement.title == "Installment001") {
      //       let inst1 = { ...instElement }
      //       let inst2 = { ...instElement }

      //       inst1['percentage'] = 40
      //       inst1['title'] = "Installment001"
      //       inst1['totalAmount'] = Number(Number(element['totalPlannedAmount'] * 0.4).toFixed(2))
      //       inst1['paidAmount'] = Number(Number(element['totalPlannedAmount'] * 0.4).toFixed(2))
      //       inst1['pendingAmount'] = 0
      //       inst1['discountAmount'] = Number(Number(instElement['discountAmount'] * 0.4).toFixed(2))

      //       inst2['percentage'] = 20
      //       inst2['title'] = "Installment002"
      //       inst2['totalAmount'] = Number(Number(element['totalPlannedAmount'] * 0.2).toFixed(2))
      //       inst2['paidAmount'] = Number(Number(element['totalPlannedAmount'] * 0.2).toFixed(2))
      //       inst2['pendingAmount'] = 0
      //       inst2['discountAmount'] = Number(Number(instElement['discountAmount'] * 0.2).toFixed(2))

      //       updatedInstData.push(inst1, inst2)
      //     }
      //     else {
      //       updatedInstData.push(instElement)
      //     }
      //     // console.log(updatedInstData)
      //     inst1Total = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
      //     inst1Discount = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
      //     inst1Paid = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
      //     inst1Pending = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst2Total = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
      //     inst2Discount = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
      //     inst2Paid = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
      //     inst2Pending = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst3Total = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
      //     // inst3Discount = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
      //     inst3Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //     inst3Paid = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
      //     inst3Pending = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst4Total = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
      //     // inst4Discount = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
      //     inst4Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //     inst4Paid = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
      //     inst4Pending = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)
      //   }
      // }
      // else {
      //   inst1Total = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
      //   inst1Discount = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
      //   inst1Paid = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
      //   inst1Pending = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst2Total = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
      //   inst2Discount = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
      //   inst2Paid = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
      //   inst2Pending = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst3Total = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
      //   // inst3Discount = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
      //   inst3Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //   inst3Paid = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
      //   inst3Pending = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst4Total = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
      //   // inst4Discount = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
      //   inst4Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //   inst4Paid = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
      //   inst4Pending = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)
      // }

      let overallFeeDetails = {
        "SL.NO": i + 1,
        "REG. NO.": element.regId,
        "STUDENT NAME": element.studentName,
        "CLASS/BATCH": element.classBatch,
        "CAMPUS": element.campusName,
        "TOTAL FEES": element.studentTotalAmount,
        "TOTAL DISCOUNTS": totalDiscount,
        "TOTAL RECEIVABLE": element.totalPlannedAmount,
        "TOTAL RECEIVED": element.totalPaidAmount,
        "TOTAL PENDING": element.totalPendingAmount,

        "INS1TOTAL": inst1Total,
        // "INS1DISCOUNT": inst1Discount,
        "INS1PAID": inst1Paid,
        "INS1PENDING": inst1Pending,

        "INS2TOTAL": inst2Total,
        // "INS2DISCOUNT": inst2Discount,
        "INS2PAID": inst2Paid,
        "INS2PENDING": inst2Pending,

        "INS3TOTAL": inst3Total,
        // "INS3DISCOUNT": inst3Discount,
        "INS3PAID": inst3Paid,
        "INS3PENDING": inst3Pending,

        "INS4TOTAL": inst4Total,
        // "INS4DISCOUNT": inst4Discount,
        "INS4PAID": inst4Paid,
        "INS4PENDING": inst4Pending,

        "PARENT NAME": element.parentName,
        "PARENT EMAIL ID": element.parentEmail,
        "PARENT MOBILE": element.parentPhone,
        "STUDENT MOBILE": element.studentPhone,
        "REMARKS": element.remarks ? element.remarks : ""
      }

      cvrData.overall.push(overallFeeDetails)
      let totalTerm1Paid = Number(inst1Paid) + Number(inst2Paid)
      let totalTerm2Paid = Number(inst3Paid) + Number(inst4Paid)

      let totalTerm1Planned = Number(inst1Total) + Number(inst2Total)
      let totalTerm2Planned = Number(inst3Total) + Number(inst4Total)
      let totalTerm1Pending = Number(inst1Pending) + Number(inst2Pending)
      let totalTerm2Pending = Number(inst3Pending) + Number(inst4Pending)
      // If Total paid (inst1+inst2)<total planned term 1-pending
      if (Number(totalTerm1Paid) < Number(totalTerm1Planned)) {
        let term1Defaulters = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,
          "INST1 TOTAL": inst1Total,
          // "INST1 DISCOUNT": inst1Discount,
          "INST1 PAID": inst1Paid,
          "INST1 PENDING": inst1Pending,
          "INST2 TOTAL": inst2Total,
          // "INST2 DISCOUNT": inst2Discount,
          "INST2 PAID": inst2Paid,
          "INST2 PENDING": inst2Pending,

          "TERM1 TOTAL": inst1Total + inst2Total,
          "TERM1 PAID": inst1Paid + inst2Paid,
          "TERM1 PENDING": inst1Pending + inst2Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""

        }
        cvrData.term1Defaulters.push(term1Defaulters) //INSTALLMENT 1 INSTALLMENT 2 (PENDING)
      }
      if (Number(totalTerm1Pending) == 0) {
        let term1Paid = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,
          "INST1 TOTAL": inst1Total,
          // "INST1 DISCOUNT": inst1Discount,
          "INST1 PAID": inst1Paid,
          "INST1 PENDING": inst1Pending,
          "INST2 TOTAL": inst2Total,
          // "INST2 DISCOUNT": inst2Discount,
          "INST2 PAID": inst2Paid,
          "INST2 PENDING": inst2Pending,

          "TERM1 TOTAL": inst1Total + inst2Total,
          "TERM1 PAID": inst1Paid + inst2Paid,
          "TERM1 PENDING": inst1Pending + inst2Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        cvrData.term1Paid.push(term1Paid)

      }
      // if (inst3Pending !== 0 && inst4Pending !== 0) {
      if (Number(totalTerm2Paid) < Number(totalTerm2Planned)) {
        let term2Defaulters = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,
          // "TOTAL": inst2Total,
          // "DISCOUNT": inst2Discount,
          // "PAID": inst2Paid,
          // "PENDING": inst2Pending,
          "INST3 TOTAL": inst3Total,
          // "INST3 DISCOUNT": inst3Discount,
          "INST3 PAID": inst3Paid,
          "INST3 PENDING": inst3Pending,
          "INST4 TOTAL": inst4Total,
          // "INST4 DISCOUNT": inst4Discount,
          "INST4 PAID": inst4Paid,
          "INST4 PENDING": inst4Pending,

          "TERM2 TOTAL": inst3Total + inst4Total,
          "TERM2 PAID": inst3Paid + inst4Paid,
          "TERM2 PENDING": inst3Pending + inst4Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        cvrData.term2Defaulters.push(term2Defaulters)
      }
      // if (inst3Pending == 0 && inst4Pending == 0) {
      if (Number(totalTerm2Pending) == 0) {

        let term2Paid = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST3 TOTAL": inst3Total,
          // "INST3 DISCOUNT": inst3Discount,
          "INST3 PAID": inst3Paid,
          "INST3 PENDING": inst3Pending,
          "INST4 TOTAL": inst4Total,
          // "INST4 DISCOUNT": inst4Discount,
          "INST4 PAID": inst4Paid,
          "INST4 PENDING": inst4Pending,

          "TERM2 TOTAL": inst3Total + inst4Total,
          "TERM2 PAID": inst3Paid + inst4Paid,
          "TERM2 PENDING": inst3Pending + inst4Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        cvrData.term2Paid.push(term2Paid)

      }
    }
    else if (element.campusName.includes('JBN')) {
      let instData = element.installmentData.sort((a, b) => (a.title > b.title ? 1 : -1));
      // let totalDiscount = instData.reduce((a, b) => a + b.discountAmount, 0)
      let totalDiscount = element.totalDiscount

      let inst1Total = 0
      let inst1Discount = 0
      let inst1Paid = 0
      let inst1Pending = 0
      let inst2Total = 0
      let inst2Discount = 0
      let inst2Paid = 0
      let inst2Pending = 0
      let inst3Total = 0
      let inst3Discount = 0
      let inst3Paid = 0
      let inst3Pending = 0
      let inst4Total = 0
      let inst4Discount = 0
      let inst4Paid = 0
      let inst4Pending = 0
      // console.log('index', i + 1, 'JBN', 'regId', element.regId, 'instData length', instData.length)
      let term1 = instData.filter(item => { if (Number(item.term) == 1) { return item } });
      let term2 = instData.filter(item => { if (Number(item.term) == 2) { return item } });

      if (term1.length == 1) {
        inst1Total = Number(Number(term1[0].totalAmount * 0.6).toFixed(2))
        inst1Discount = Number(Number(term1[0].discountAmount * 0.6).toFixed(2))
        inst1Paid = Number(Number(term1[0].paidAmount * 0.6).toFixed(2))
        inst1Pending = Number(Number(term1[0].pendingAmount * 0.6).toFixed(2))

        inst2Total = Number(Number(term1[0].totalAmount * 0.4).toFixed(2))
        inst2Discount = Number(Number(term1[0].discountAmount * 0.4).toFixed(2))
        inst2Paid = Number(Number(term1[0].paidAmount * 0.4).toFixed(2))
        inst2Pending = Number(Number(term1[0].pendingAmount * 0.4).toFixed(2))

        // inst1Total = term1[0].totalAmount
        // inst1Discount = term1[0].discountAmount
        // inst1Paid = term1[0].paidAmount
        // inst1Pending = term1[0].pendingAmount

        // inst2Total = 0
        // inst2Discount = 0
        // inst2Paid = 0
        // inst2Pending = 0
      } else if (term1.length == 2) {
        inst1Total = term1[0].totalAmount
        inst1Discount = term1[0].discountAmount
        inst1Paid = term1[0].paidAmount
        inst1Pending = term1[0].pendingAmount
        inst2Total = term1[1].totalAmount
        inst2Discount = term1[1].discountAmount
        inst2Paid = term1[1].paidAmount
        inst2Pending = term1[1].pendingAmount
      }
      if (term2.length == 1) {
        inst3Total = Number(Number(term2[0].totalAmount * 0.6).toFixed(2))
        inst3Discount = Number(Number(term2[0].discountAmount * 0.6).toFixed(2))
        inst3Paid = Number(Number(term2[0].paidAmount * 0.6).toFixed(2))
        inst3Pending = Number(Number(term2[0].pendingAmount * 0.6).toFixed(2))
        inst4Total = Number(Number(term2[0].totalAmount * 0.4).toFixed(2))
        inst4Discount = Number(Number(term2[0].discountAmount * 0.4).toFixed(2))
        inst4Paid = Number(Number(term2[0].paidAmount * 0.4).toFixed(2))
        inst4Pending = Number(Number(term2[0].pendingAmount * 0.4).toFixed(2))
      }
      else if (term2.length == 2) {
        inst3Total = term2[0].totalAmount
        inst3Discount = term2[0].discountAmount
        inst3Paid = term2[0].paidAmount
        inst3Pending = term2[0].pendingAmount
        inst4Total = term2[1].totalAmount
        inst4Discount = term2[1].discountAmount
        inst4Paid = term2[1].paidAmount
        inst4Pending = term2[1].pendingAmount
      }

      jbnterm1pending = jbnterm1pending + inst1Pending + inst2Pending
      jbnterm2pending = jbnterm2pending + inst3Pending + inst4Pending

      jbnterm1paid = jbnterm1paid + inst1Paid + inst2Paid
      jbnterm2paid = jbnterm2paid + inst3Paid + inst4Paid

      // let ppterm1pending = 0
      // let ppterm2pending = 0
      // let totalDiscount = element.totalDiscount

      // if (Number(instData.length) == 3) { //60 20 20 ---> 40 20 20 20
      //   let updatedInstData = []
      //   for (let k = 0; k < instData.length; k++) {
      //     const instElement = instData[k];

      //     if (Number(instElement.percentage) == Number(60) && instElement.title == "Installment001") {
      //       let inst1 = { ...instElement }
      //       let inst2 = { ...instElement }

      //       inst1['percentage'] = 40
      //       inst1['title'] = "Installment001"
      //       inst1['totalAmount'] = Number(Number(instElement['overallAmount'] * 0.4).toFixed(2))
      //       inst1['paidAmount'] = Number(Number(instElement['overallAmount'] * 0.4).toFixed(2))
      //       inst1['pendingAmount'] = 0
      //       inst1['discountAmount'] = Number(Number(instElement['discountAmount'] * 0.4).toFixed(2))

      //       inst2['percentage'] = 20
      //       inst2['title'] = "Installment002"
      //       inst2['totalAmount'] = Number(Number(instElement['overallAmount'] * 0.2).toFixed(2))
      //       inst2['paidAmount'] = Number(Number(instElement['overallAmount'] * 0.2).toFixed(2))
      //       inst2['pendingAmount'] = 0
      //       inst2['discountAmount'] = Number(Number(instElement['discountAmount'] * 0.2).toFixed(2))

      //       updatedInstData.push(inst1, inst2)
      //     }
      //     else {
      //       updatedInstData.push(instElement)
      //     }
      //     inst1Total = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
      //     inst1Discount = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
      //     inst1Paid = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
      //     inst1Pending = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst2Total = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
      //     inst2Discount = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
      //     inst2Paid = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
      //     inst2Pending = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst3Total = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
      //     // inst3Discount = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
      //     inst3Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //     inst3Paid = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
      //     inst3Pending = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst4Total = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
      //     // inst4Discount = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
      //     inst4Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //     inst4Paid = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
      //     inst4Pending = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)
      //   }
      // }
      // else {
      //   inst1Total = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
      //   inst1Discount = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
      //   inst1Paid = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
      //   inst1Pending = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst2Total = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
      //   inst2Discount = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
      //   inst2Paid = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
      //   inst2Pending = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst3Total = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
      //   inst3Discount = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
      //   inst3Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //   inst3Paid = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
      //   inst3Pending = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst4Total = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
      //   // inst4Discount = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
      //   inst4Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //   inst4Paid = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
      //   inst4Pending = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)
      // }
      let overallFeeDetails = {
        "SL.NO": i + 1,
        "REG. NO.": element.regId,
        "STUDENT NAME": element.studentName,
        "CLASS/BATCH": element.classBatch,
        "CAMPUS": element.campusName,
        "TOTAL FEES": element.studentTotalAmount,
        "TOTAL DISCOUNTS": totalDiscount,
        "TOTAL RECEIVABLE": element.totalPlannedAmount,
        "TOTAL RECEIVED": element.totalPaidAmount,
        "TOTAL PENDING": element.totalPendingAmount,

        "INS1TOTAL": inst1Total,
        // "INS1DISCOUNT": inst1Discount,
        "INS1PAID": inst1Paid,
        "INS1PENDING": inst1Pending,

        "INS2TOTAL": inst2Total,
        // "INS2DISCOUNT": inst2Discount,
        "INS2PAID": inst2Paid,
        "INS2PENDING": inst2Pending,

        "INS3TOTAL": inst3Total,
        // "INS3DISCOUNT": inst3Discount,
        "INS3PAID": inst3Paid,
        "INS3PENDING": inst3Pending,

        "INS4TOTAL": inst4Total,
        // "INS4DISCOUNT": inst4Discount,
        "INS4PAID": inst4Paid,
        "INS4PENDING": inst4Pending,

        "PARENT NAME": element.parentName,
        "PARENT EMAIL ID": element.parentEmail,
        "PARENT MOBILE": element.parentPhone,
        "STUDENT MOBILE": element.studentPhone,
        "REMARKS": element.remarks ? element.remarks : ""
      }
      jbnData.overall.push(overallFeeDetails)

      let totalTerm1Paid = Number(inst1Paid) + Number(inst2Paid)
      let totalTerm2Paid = Number(inst3Paid) + Number(inst4Paid)

      let totalTerm1Planned = Number(inst1Total) + Number(inst2Total)
      let totalTerm2Planned = Number(inst3Total) + Number(inst4Total)
      let totalTerm1Pending = Number(inst1Pending) + Number(inst2Pending)
      let totalTerm2Pending = Number(inst3Pending) + Number(inst4Pending)
      // If Total paid (inst1+inst2)<total planned term 1-pending
      if (Number(totalTerm1Paid) < Number(totalTerm1Planned)) {
        let term1Defaulters = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST1 TOTAL": inst1Total,
          // "INST1 DISCOUNT": inst1Discount,
          "INST1 PAID": inst1Paid,
          "INST1 PENDING": inst1Pending,
          "INST2 TOTAL": inst2Total,
          // "INST2 DISCOUNT": inst2Discount,
          "INST2 PAID": inst2Paid,
          "INST2 PENDING": inst2Pending,

          "TERM1 TOTAL": inst1Total + inst2Total,
          "TERM1 PAID": inst1Paid + inst2Paid,
          "TERM1 PENDING": inst1Pending + inst2Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        jbnData.term1Defaulters.push(term1Defaulters)
      }
      if (Number(totalTerm1Pending) == 0) {
        let term1Paid = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST1 TOTAL": inst1Total,
          // "INST1 DISCOUNT": inst1Discount,
          "INST1 PAID": inst1Paid,
          "INST1 PENDING": inst1Pending,
          "INST2 TOTAL": inst2Total,
          // "INST2 DISCOUNT": inst2Discount,
          "INST2 PAID": inst2Paid,
          "INST2 PENDING": inst2Pending,

          "TERM1 TOTAL": inst1Total + inst2Total,
          "TERM1 PAID": inst1Paid + inst2Paid,
          "TERM1 PENDING": inst1Pending + inst2Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        jbnData.term1Paid.push(term1Paid)

      }
      // if (inst3Pending !== 0 && inst4Pending !== 0) {   
      if (Number(totalTerm2Paid) < Number(totalTerm2Planned)) {
        let term2Defaulters = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST3 TOTAL": inst3Total,
          // "INST3 DISCOUNT": inst3Discount,
          "INST3 PAID": inst3Paid,
          "INST3 PENDING": inst3Pending,
          "INST4 TOTAL": inst4Total,
          // "INST4 DISCOUNT": inst4Discount,
          "INST4 PAID": inst4Paid,
          "INST4 PENDING": inst4Pending,

          "TERM2 TOTAL": inst3Total + inst4Total,
          "TERM2 PAID": inst3Paid + inst4Paid,
          "TERM2 PENDING": inst3Pending + inst4Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        jbnData.term2Defaulters.push(term2Defaulters)
      }
      if (Number(totalTerm2Pending) == 0) {
        // if (inst2Pending == 0) {
        let term2Paid = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST3 TOTAL": inst3Total,
          // "INST3 DISCOUNT": inst3Discount,
          "INST3 PAID": inst3Paid,
          "INST3 PENDING": inst3Pending,
          "INST4 TOTAL": inst4Total,
          // "INST4 DISCOUNT": inst4Discount,
          "INST4 PAID": inst4Paid,
          "INST4 PENDING": inst4Pending,

          "TERM2 TOTAL": inst3Total + inst4Total,
          "TERM2 PAID": inst3Paid + inst4Paid,
          "TERM2 PENDING": inst3Pending + inst4Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        jbnData.term2Paid.push(term2Paid)

      }
    }
    else if (element.campusName.includes('PP')) {
      let instData = element.installmentData.sort((a, b) => (a.title > b.title ? 1 : -1));
      // let totalDiscount = instData.reduce((a, b) => a + b.discountAmount, 0)
      let totalDiscount = element.totalDiscount

      let inst1Total = 0
      let inst1Discount = 0
      let inst1Paid = 0
      let inst1Pending = 0
      let inst2Total = 0
      let inst2Discount = 0
      let inst2Paid = 0
      let inst2Pending = 0
      let inst3Total = 0
      let inst3Discount = 0
      let inst3Paid = 0
      let inst3Pending = 0
      let inst4Total = 0
      let inst4Discount = 0
      let inst4Paid = 0
      let inst4Pending = 0
      // console.log('index', i + 1, 'PP', 'regId', element.regId, 'instData length', instData.length)

      let term1 = instData.filter(item => { if (Number(item.term) == 1) { return item } });
      let term2 = instData.filter(item => { if (Number(item.term) == 2) { return item } });
      if (term1.length == 1) {
        inst1Total = Number(Number(term1[0].totalAmount * 0.6).toFixed(2))
        inst1Discount = Number(Number(term1[0].discountAmount * 0.6).toFixed(2))
        inst1Paid = Number(Number(term1[0].paidAmount * 0.6).toFixed(2))
        inst1Pending = Number(Number(term1[0].pendingAmount * 0.6).toFixed(2))

        inst2Total = Number(Number(term1[0].totalAmount * 0.4).toFixed(2))
        inst2Discount = Number(Number(term1[0].discountAmount * 0.4).toFixed(2))
        inst2Paid = Number(Number(term1[0].paidAmount * 0.4).toFixed(2))
        inst2Pending = Number(Number(term1[0].pendingAmount * 0.4).toFixed(2))

        // inst1Total = term1[0].totalAmount
        // inst1Discount = term1[0].discountAmount
        // inst1Paid = term1[0].paidAmount
        // inst1Pending = term1[0].pendingAmount

        // inst2Total = 0
        // inst2Discount = 0
        // inst2Paid = 0
        // inst2Pending = 0
      } else if (term1.length == 2) {
        inst1Total = term1[0].totalAmount
        inst1Discount = term1[0].discountAmount
        inst1Paid = term1[0].paidAmount
        inst1Pending = term1[0].pendingAmount
        inst2Total = term1[1].totalAmount
        inst2Discount = term1[1].discountAmount
        inst2Paid = term1[1].paidAmount
        inst2Pending = term1[1].pendingAmount
      }
      if (term2.length == 1) {
        inst3Total = Number(Number(term2[0].totalAmount * 0.6).toFixed(2))
        inst3Discount = Number(Number(term2[0].discountAmount * 0.6).toFixed(2))
        inst3Paid = Number(Number(term2[0].paidAmount * 0.6).toFixed(2))
        inst3Pending = Number(Number(term2[0].pendingAmount * 0.6).toFixed(2))
        inst4Total = Number(Number(term2[0].totalAmount * 0.4).toFixed(2))
        inst4Discount = Number(Number(term2[0].discountAmount * 0.4).toFixed(2))
        inst4Paid = Number(Number(term2[0].paidAmount * 0.4).toFixed(2))
        inst4Pending = Number(Number(term2[0].pendingAmount * 0.4).toFixed(2))
      }
      else if (term2.length == 2) {
        inst3Total = term2[0].totalAmount
        inst3Discount = term2[0].discountAmount
        inst3Paid = term2[0].paidAmount
        inst3Pending = term2[0].pendingAmount
        inst4Total = term2[1].totalAmount
        inst4Discount = term2[1].discountAmount
        inst4Paid = term2[1].paidAmount
        inst4Pending = term2[1].pendingAmount
      }
      // let totalDiscount = element.totalDiscount
      ppterm1pending = ppterm1pending + inst1Pending + inst2Pending
      ppterm2pending = ppterm2pending + inst3Pending + inst4Pending

      ppterm1paid = ppterm1paid + inst1Paid + inst2Paid
      ppterm2paid = ppterm2paid + inst3Paid + inst4Paid

      // if (Number(instData.length) == 3) { //60 20 20 ---> 40 20 20 20
      //   let updatedInstData = []
      //   for (let l = 0; l < instData.length; l++) {
      //     const instElement = instData[l];

      //     if (Number(instElement.percentage) == Number(60) && instElement.title == "Installment001") {
      //       let inst1 = { ...instElement }
      //       let inst2 = { ...instElement }

      //       inst1['percentage'] = 40
      //       inst1['title'] = "Installment001"
      //       inst1['totalAmount'] = Number(Number(instElement['overallAmount'] * 0.4).toFixed(2))
      //       inst1['paidAmount'] = Number(Number(instElement['overallAmount'] * 0.4).toFixed(2))
      //       inst1['pendingAmount'] = 0
      //       inst1['discountAmount'] = Number(Number(instElement['discountAmount'] * 0.4).toFixed(2))

      //       inst2['percentage'] = 20
      //       inst2['title'] = "Installment002"
      //       inst2['totalAmount'] = Number(Number(instElement['overallAmount'] * 0.2).toFixed(2))
      //       inst2['paidAmount'] = Number(Number(instElement['overallAmount'] * 0.2).toFixed(2))
      //       inst2['pendingAmount'] = 0
      //       inst2['discountAmount'] = Number(Number(instElement['discountAmount'] * 0.2).toFixed(2))

      //       updatedInstData.push(inst1, inst2)
      //     }
      //     else {
      //       updatedInstData.push(instElement)
      //     }
      //     inst1Total = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
      //     inst1Discount = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
      //     inst1Paid = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
      //     inst1Pending = updatedInstData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst2Total = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
      //     inst2Discount = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
      //     inst2Paid = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
      //     inst2Pending = updatedInstData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst3Total = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
      //     // inst3Discount = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
      //     inst3Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //     inst3Paid = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
      //     inst3Pending = updatedInstData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

      //     inst4Total = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
      //     // inst4Discount = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
      //     inst4Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //     inst4Paid = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
      //     inst4Pending = updatedInstData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)
      //   }
      // }
      // else {
      //   inst1Total = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
      //   inst1Discount = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
      //   inst1Paid = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
      //   inst1Pending = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst2Total = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
      //   inst2Discount = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
      //   inst2Paid = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
      //   inst2Pending = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst3Total = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
      //   // inst3Discount = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
      //   inst3Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //   inst3Paid = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
      //   inst3Pending = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

      //   inst4Total = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
      //   // inst4Discount = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
      //   inst4Discount = Number(Number(totalDiscount / 2).toFixed(2))
      //   inst4Paid = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
      //   inst4Pending = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)
      // }


      let overallFeeDetails = {
        "SL.NO": i + 1,
        "REG. NO.": element.regId,
        "STUDENT NAME": element.studentName,
        "CLASS/BATCH": element.classBatch,
        "CAMPUS": element.campusName,
        "TOTAL FEES": element.studentTotalAmount,
        "TOTAL DISCOUNTS": totalDiscount,
        "TOTAL RECEIVABLE": element.totalPlannedAmount,
        "TOTAL RECEIVED": element.totalPaidAmount,
        "TOTAL PENDING": element.totalPendingAmount,

        "INS1TOTAL": inst1Total,
        // "INS1DISCOUNT": inst1Discount,
        "INS1PAID": inst1Paid,
        "INS1PENDING": inst1Pending,

        "INS2TOTAL": inst2Total,
        // "INS2DISCOUNT": inst2Discount,
        "INS2PAID": inst2Paid,
        "INS2PENDING": inst2Pending,

        "INS3TOTAL": inst3Total,
        // "INS3DISCOUNT": inst3Discount,
        "INS3PAID": inst3Paid,
        "INS3PENDING": inst3Pending,

        "INS4TOTAL": inst4Total,
        // "INS4DISCOUNT": inst4Discount,
        "INS4PAID": inst4Paid,
        "INS4PENDING": inst4Pending,

        "PARENT NAME": element.parentName,
        "PARENT EMAIL ID": element.parentEmail,
        "PARENT MOBILE": element.parentPhone,
        "STUDENT MOBILE": element.studentPhone,
        "REMARKS": element.remarks ? element.remarks : ""
      }
      ppData.overall.push(overallFeeDetails)

      let totalTerm1Paid = Number(inst1Paid) + Number(inst2Paid)
      let totalTerm2Paid = Number(inst3Paid) + Number(inst4Paid)

      let totalTerm1Planned = Number(inst1Total) + Number(inst2Total)
      let totalTerm2Planned = Number(inst3Total) + Number(inst4Total)
      let totalTerm1Pending = Number(inst1Pending) + Number(inst2Pending)
      let totalTerm2Pending = Number(inst3Pending) + Number(inst4Pending)

      // if (inst1Pending !== 0 && inst2Pending !== 0) {
      if (Number(totalTerm1Paid) < Number(totalTerm1Planned)) {
        let term1Defaulters = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST1 TOTAL": inst1Total,
          // "INST1 DISCOUNT": inst1Discount,
          "INST1 PAID": inst1Paid,
          "INST1 PENDING": inst1Pending,
          "INST2 TOTAL": inst2Total,
          // "INST2 DISCOUNT": inst2Discount,
          "INST2 PAID": inst2Paid,
          "INST2 PENDING": inst2Pending,

          "TERM1 TOTAL": inst1Total + inst2Total,
          "TERM1 PAID": inst1Paid + inst2Paid,
          "TERM1 PENDING": inst1Pending + inst2Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        ppData.term1Defaulters.push(term1Defaulters)
      }
      if (Number(totalTerm1Pending) == 0) {
        let term1Paid = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST1 TOTAL": inst1Total,
          // "INST1 DISCOUNT": inst1Discount,
          "INST1 PAID": inst1Paid,
          "INST1 PENDING": inst1Pending,
          "INST2 TOTAL": inst2Total,
          // "INST2 DISCOUNT": inst2Discount,
          "INST2 PAID": inst2Paid,
          "INST2 PENDING": inst2Pending,

          "TERM1 TOTAL": inst1Total + inst2Total,
          "TERM1 PAID": inst1Paid + inst2Paid,
          "TERM1 PENDING": inst1Pending + inst2Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        ppData.term1Paid.push(term1Paid)

      }
      // if (inst3Pending !== 0 && inst4Pending !== 0) {
      if (Number(totalTerm2Paid) < Number(totalTerm2Planned)) {
        // if (inst2Pending !== 0) {
        let term2Defaulters = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST3 TOTAL": inst3Total,
          // "INST3 DISCOUNT": inst3Discount,
          "INST3 PAID": inst3Paid,
          "INST3 PENDING": inst3Pending,
          "INST4 TOTAL": inst4Total,
          // "INST4 DISCOUNT": inst4Discount,
          "INST4 PAID": inst4Paid,
          "INST4 PENDING": inst4Pending,

          "TERM2 TOTAL": inst3Total + inst4Total,
          "TERM2 PAID": inst3Paid + inst4Paid,
          "TERM2 PENDING": inst3Pending + inst4Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        ppData.term2Defaulters.push(term2Defaulters)
      }
      // if (inst3Pending == 0 && inst4Pending == 0) {
      if (Number(totalTerm2Pending) == 0) {
        // if (inst2Pending == 0) {
        let term2Paid = {
          "SL.NO": i + 1,
          "REG. NO.": element.regId,
          "STUDENT NAME": element.studentName,
          "CLASS/BATCH": element.classBatch,
          "CAMPUS": element.campusName,
          "TOTAL FEES": element.studentTotalAmount,
          "TOTAL DISCOUNTS": totalDiscount,
          "TOTAL RECEIVABLE": element.totalPlannedAmount,
          "TOTAL RECEIVED": element.totalPaidAmount,
          "TOTAL PENDING": element.totalPendingAmount,

          "INST3 TOTAL": inst3Total,
          // "INST3 DISCOUNT": inst3Discount,
          "INST3 PAID": inst3Paid,
          "INST3 PENDING": inst3Pending,
          "INST4 TOTAL": inst4Total,
          // "INST4 DISCOUNT": inst4Discount,
          "INST4 PAID": inst4Paid,
          "INST4 PENDING": inst4Pending,

          "TERM2 TOTAL": inst3Total + inst4Total,
          "TERM2 PAID": inst3Paid + inst4Paid,
          "TERM2 PENDING": inst3Pending + inst4Pending,

          "PARENT NAME": element.parentName,
          "PARENT EMAIL ID": element.parentEmail,
          "PARENT MOBILE": element.parentPhone,
          "STUDENT MOBILE": element.studentPhone,
          "REMARKS": element.remarks ? element.remarks : ""
        }
        ppData.term2Paid.push(term2Paid)
      }
    }
  }
  result["Term 1"][0].pending = cvrterm1pending
  result["Term 2"][0].pending = cvrterm2pending
  result["Term 1"][1].pending = jbnterm1pending
  result["Term 2"][1].pending = jbnterm2pending
  result["Term 1"][2].pending = ppterm1pending
  result["Term 2"][2].pending = ppterm2pending

  result["Term 1"][0].received = cvrterm1paid
  result["Term 2"][0].received = cvrterm2paid
  result["Term 1"][1].received = jbnterm1paid
  result["Term 2"][1].received = jbnterm2paid
  result["Term 1"][2].received = ppterm1paid
  result["Term 2"][2].received = ppterm2paid
  let cvrTerm1PendingCount = cvrData.term1Defaulters.length
  let cvrTerm1PaidCount = cvrData.term1Paid.length
  let cvrTerm2PendingCount = cvrData.term2Defaulters.length
  let cvrTerm2PaidCount = cvrData.term2Paid.length

  let jbnTerm1PendingCount = jbnData.term1Defaulters.length
  let jbnTerm1PaidCount = jbnData.term1Paid.length
  let jbnTerm2PendingCount = jbnData.term2Defaulters.length
  let jbnTerm2PaidCount = jbnData.term2Paid.length

  let ppTerm1PendingCount = ppData.term1Defaulters.length
  let ppTerm1PaidCount = ppData.term1Paid.length
  let ppTerm2PendingCount = ppData.term2Defaulters.length
  let ppTerm2PaidCount = ppData.term2Paid.length

  let term1TotalPendingCount = cvrTerm1PendingCount + jbnTerm1PendingCount + ppTerm1PendingCount
  let term1TotalPaidCount = cvrTerm1PaidCount + jbnTerm1PaidCount + ppTerm1PaidCount
  let term2TotalPendingCount = cvrTerm2PendingCount + jbnTerm2PendingCount + ppTerm2PendingCount
  let term2TotalPaidCount = cvrTerm2PaidCount + jbnTerm2PaidCount + ppTerm2PaidCount;
  
  const feeTotalAggregator = [
    {
      $lookup: {
        from: "students",
        localField: "studentRegId",
        foreignField: "regId",
        as: "students",
      },
    },
    { "$addFields": { "campusId": { "$toObjectId": "$campusId" } } },
    {
      "$lookup": {
        "from": "campuses",
        "localField": "campusId",
        "foreignField": "_id",
        "as": "campuses"
      }
    },
    {
      $unwind: "$students",
    },
    {
      $match: {
        "students.status": 1
      }
    },
    {
      $group: {
        _id: { campus: "$campusId" },
        campusName: { $first: "$campuses.displayName" },
        noOfStudentsPaid: {
          $addToSet: {
            $cond: {
              if: { $eq: ["$pendingAmount", 0] },
              then: "$students.regId",
              else: null,
            },
          },
        },
        noOfStudentsPending: {
          $addToSet: {
            $cond: {
              if: { $gt: ["$pendingAmount", 0] },
              then: "$students.regId",
              else: null,
            },
          },
        },
      },
    },
    {
      $addFields: {
        noOfStudentsPaid: {
          $filter: {
            input: "$noOfStudentsPaid",
            as: "d",
            cond: {
              $ne: ["$$d", null],
            },
          },
        },
        noOfStudentsPending: {
          $filter: {
            input: "$noOfStudentsPending",
            as: "d",
            cond: {
              $ne: ["$$d", null],
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        campusId: "$_id.campus",
        campusName: { $arrayElemAt: ["$campusName", 0] },
        noOfStudentsPaid: { $size: "$noOfStudentsPaid" },
        noOfStudentsPending: { $size: "$noOfStudentsPending" },
      },
    },
  ];
  var feeTotalAggregateData = await feePlanModel.aggregate(feeTotalAggregator);
  let cvroverallTotalPendingCount = 0
  let cvroverallTotalPaidCount = 0
  let jbnoverallTotalPendingCount = 0 
  let jbnoverallTotalPaidCount = 0
  let ppoverallTotalPendingCount = 0
  let ppoverallTotalPaidCount = 0

  let overallTotalPendingCount = 0
  let overallTotalPaidCount = 0
 for(let pp = 0 ; pp<feeTotalAggregateData.length ; pp++){
   if(feeTotalAggregateData[pp].campusName.includes("CVR")){
    cvroverallTotalPendingCount = feeTotalAggregateData[pp].noOfStudentsPending
    cvroverallTotalPaidCount = feeTotalAggregateData[pp].noOfStudentsPaid
    overallTotalPendingCount = overallTotalPendingCount + feeTotalAggregateData[pp].noOfStudentsPending
    overallTotalPaidCount = overallTotalPaidCount + feeTotalAggregateData[pp].noOfStudentsPaid
   }
   else if(feeTotalAggregateData[pp].campusName.includes("JBN")){
    jbnoverallTotalPendingCount = feeTotalAggregateData[pp].noOfStudentsPending
    jbnoverallTotalPaidCount = feeTotalAggregateData[pp].noOfStudentsPaid
    overallTotalPendingCount = overallTotalPendingCount + feeTotalAggregateData[pp].noOfStudentsPending
    overallTotalPaidCount = overallTotalPaidCount + feeTotalAggregateData[pp].noOfStudentsPaid
   } else if(feeTotalAggregateData[pp].campusName.includes("PP")){
    ppoverallTotalPendingCount = feeTotalAggregateData[pp].noOfStudentsPending
    ppoverallTotalPaidCount = feeTotalAggregateData[pp].noOfStudentsPaid
    overallTotalPendingCount = overallTotalPendingCount + feeTotalAggregateData[pp].noOfStudentsPending
    overallTotalPaidCount = overallTotalPaidCount + feeTotalAggregateData[pp].noOfStudentsPaid
   }
 }
  await result["Term 1"].map(async item => {
    if (item.campus.includes('CVR')) {
      item['noOfStudentsPaid'] = cvrTerm1PaidCount
      item['noOfStudentsPending'] = cvrTerm1PendingCount
    }
    if (item.campus.includes('JBN')) {
      item['noOfStudentsPaid'] = jbnTerm1PaidCount
      item['noOfStudentsPending'] = jbnTerm1PendingCount
    }
    if (item.campus.includes('PP')) {
      item['noOfStudentsPaid'] = ppTerm1PaidCount
      item['noOfStudentsPending'] = ppTerm1PendingCount
    }
    if (item.campus.includes('Total')) {
      item['totalStudentsPaid'] = term1TotalPaidCount
      item['totalStudentsPending'] = term1TotalPendingCount
    }
  })
  await result["Term 2"].map(async item => {
    if (item.campus.includes('CVR')) {
      item['noOfStudentsPaid'] = cvrTerm2PaidCount
      item['noOfStudentsPending'] = cvrTerm2PendingCount
    }
    if (item.campus.includes('JBN')) {
      item['noOfStudentsPaid'] = jbnTerm2PaidCount
      item['noOfStudentsPending'] = jbnTerm2PendingCount
    }
    if (item.campus.includes('PP')) {
      item['noOfStudentsPaid'] = ppTerm2PaidCount
      item['noOfStudentsPending'] = ppTerm2PendingCount
    }
    if (item.campus.includes('Total')) {
      item['totalStudentsPaid'] = term2TotalPaidCount
      item['totalStudentsPending'] = term2TotalPendingCount
    }
  })
  await result["Total"].map(async item => {
    if (item.campus.includes('CVR')) {
      item['overallStudentsPaid'] = cvroverallTotalPaidCount
      item['overallStudentsPending'] = cvroverallTotalPendingCount
    }
    if (item.campus.includes('JBN')) {
      item['overallStudentsPaid'] = jbnoverallTotalPaidCount
      item['overallStudentsPending'] = jbnoverallTotalPendingCount
    }
    if (item.campus.includes('PP')) {
      item['overallStudentsPaid'] = ppoverallTotalPaidCount
      item['overallStudentsPending'] = ppoverallTotalPendingCount
    }
    if (item.campus.includes('Total')) {
      item['totalStudentsPaid'] = overallTotalPaidCount
      item['totalStudentsPending'] = overallTotalPendingCount
    }
  })

  console.log({
    status: true,
    message: "DFCR Report email will be sent Shortly...",
  });

  const dailyReport = await dailyReportTemplate(result, todayResult, logo, orgName);
  let payload = { html: dailyReport };
  let createPdf = await axios.post(`${process.env.externalServer}`, payload);
  fs.writeFileSync("temp.pdf", Buffer.from(createPdf.data.file), "base64");

  let todayDate = moment().format("DD/MM/YYYY").split("/");
  let dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";

  // const pdfDoc = new HummusRecipe("temp.pdf", "encrypted.pdf");
  // pdfDoc.encrypt({
  //   userPassword: dfcrPassword,
  //   ownerPassword: dfcrPassword,
  //   userProtectionFlag: 4,
  // }).endPDF();

  let campus1Attach = await XlsxPopulate.fromFileAsync('controllers/vkgi-template-files/input-template.xlsx').then(workbook => {
    // Modify the workbook.
    const sheet1 = workbook.sheet(0).name('NCFE CVR Overall');
    let sheet1Details = cvrData.overall.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet2 = workbook.sheet(1)
    let sheet2Details = cvrData.term1Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet3 = workbook.sheet(2)
    let sheet3Details = cvrData.term1Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet4 = workbook.sheet(3)
    let sheet4Details = cvrData.term2Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet5 = workbook.sheet(4)
    let sheet5Details = cvrData.term2Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    //Sheet 1
    function createSheet1() {
      sheet1Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet1.cell(`A${index + 5}`).value([
          Object.values(item)
        ])
      })
    }
    createSheet1()
    //Sheet 2
    function createSheet2() {
      sheet2Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet2.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet2()
    //sheet3
    function createSheet3() {

      sheet3Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet3.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet3()
    //sheet4
    function createSheet4() {
      sheet4Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet4.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet4()
    //Sheet 5
    function createSheet5() {
      sheet5Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet5.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet5()
    let todayDate = moment().format("DD/MM/YYYY").split("/");
    let dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";
    workbook.toFileAsync("encrypted-excel1.xlsx", { password: dfcrPassword });
    return workbook.outputAsync({ password: dfcrPassword });
    // return workbook.toFileAsync("out1.xlsx");
  }).then(data => {
    return Buffer.from(data).toString("base64");
  })

  let campus2Attach = await XlsxPopulate.fromFileAsync('controllers/vkgi-template-files/input-template.xlsx').then(workbook => {
    // Modify the workbook.
    const sheet1 = workbook.sheet(0).name('NCFE - JBN Overall');
    let sheet1Details = jbnData.overall.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet2 = workbook.sheet(1)
    let sheet2Details = jbnData.term1Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet3 = workbook.sheet(2)
    let sheet3Details = jbnData.term1Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet4 = workbook.sheet(3)
    let sheet4Details = jbnData.term2Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet5 = workbook.sheet(4)
    let sheet5Details = jbnData.term2Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    // Sheet 1
    function createSheet1() {
      sheet1Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet1.cell(`A${index + 5}`).value([
          Object.values(item)
        ])
      })
    }
    createSheet1()
    //sheet 2
    function createSheet2() {

      sheet2Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet2.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet2()
    //sheet3
    function createSheet3() {

      sheet3Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet3.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet3()
    //sheet4
    function createSheet4() {
      sheet4Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet4.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet4()
    //Sheet 5
    function createSheet5() {
      sheet5Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet5.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet5()
    let todayDate = moment().format("DD/MM/YYYY").split("/");
    let dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";
    workbook.toFileAsync("encrypted-excel2.xlsx", { password: dfcrPassword });
    return workbook.outputAsync({ password: dfcrPassword });
    // return workbook.toFileAsync("out2.xlsx");
  }).then(data => {
    return Buffer.from(data).toString("base64");
  })

  let campus3Attach = await XlsxPopulate.fromFileAsync('controllers/vkgi-template-files/input-template.xlsx').then(workbook => {
    // Modify the workbook.
    const sheet1 = workbook.sheet(0).name('NCFE - PP Overall');
    let sheet1Details = ppData.overall.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet2 = workbook.sheet(1)
    let sheet2Details = ppData.term1Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet3 = workbook.sheet(2)
    let sheet3Details = ppData.term1Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet4 = workbook.sheet(3)
    let sheet4Details = ppData.term2Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    const sheet5 = workbook.sheet(4)
    let sheet5Details = ppData.term2Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

    //sheet 1
    function createSheet1() {
      sheet1Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet1.cell(`A${index + 5}`).value([
          Object.values(item)
        ])
      })
    }
    createSheet1()

    //sheet 2
    function createSheet2() {

      sheet2Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet2.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet2()
    //sheet3
    function createSheet3() {
      sheet3Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet3.cell(`A${index + 3}`).value([Object.values(item)])
      })

    }
    createSheet3()
    //sheet4
    function createSheet4() {
      sheet4Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet4.cell(`A${index + 3}`).value([Object.values(item)])
      })
    }
    createSheet4()
    //Sheet 5
    function createSheet5() {
      sheet5Details.map((item, index) => {
        item['SL.NO'] = index + 1
        sheet5.cell(`A${index + 3}`).value([Object.values(item)])
      })
    }
    createSheet5()

    let todayDate = moment().format("DD/MM/YYYY").split("/");
    let dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";
    workbook.toFileAsync("encrypted-excel3.xlsx", { password: dfcrPassword });
    return workbook.outputAsync({ password: dfcrPassword });
  }).then(data => {
    return Buffer.from(data).toString("base64");
  })
  //------------------------Close of Campuswise reports-----------------

  // ---------------------------------------------------------------------
  // Excel Code
  {
    let allcampdata = {};
    let campusData = await campusModel.find({}).sort({ displayName: 1 });
    for (l = 0; l < campusData.length; l++) {
      Object.assign(allcampdata, { [campusData[l]._doc.displayName]: [] });
    }
    console.log(allcampdata);
    allexcelData.sort(function (a, b) {
      if (a.regId) {
        return a.regId.localeCompare(b.regId, undefined, {
          numeric: true,
          sensitivity: 'base'
        });
      }
    });
    for (let i = 0; i < allexcelData.length; i++) {
      const item = allexcelData[i]
      let instData = item.installmentData.sort((a, b) => (a.title > b.title ? 1 : -1));

      let installment1 = []
      let installment2 = []
      let installment3 = []
      let installment4 = []
      let term1 = instData.filter(item => { if (Number(item.term) == 1) { return item } });
      let term2 = instData.filter(item => { if (Number(item.term) == 2) { return item } });
      // if (Number(instData.length) == 3) { //60 20 20 ---> 40 20 20 20
      //   let updatedInstData = []
      //   for (let m = 0; m < instData.length; m++) {
      //     const instElement = instData[m];
      //     if (Number(instElement.percentage) == Number(60) && instElement.title == "Installment001") {
      //       let inst1 = { ...instElement }
      //       let inst2 = { ...instElement }

      //       inst1['percentage'] = 40
      //       inst1['title'] = "Installment001"
      //       inst1['totalAmount'] = Number(Number(instElement['overallAmount'] * 0.4).toFixed(2))
      //       inst1['paidAmount'] = Number(Number(instElement['overallAmount'] * 0.4).toFixed(2))
      //       inst1['pendingAmount'] = 0
      //       inst1['discountAmount'] = Number(Number(instElement['discountAmount'] * 0.4).toFixed(2))

      //       inst2['percentage'] = 20
      //       inst2['title'] = "Installment002"
      //       inst2['totalAmount'] = Number(Number(instElement['overallAmount'] * 0.2).toFixed(2))
      //       inst2['paidAmount'] = Number(Number(instElement['overallAmount'] * 0.2).toFixed(2))
      //       inst2['pendingAmount'] = 0
      //       inst2['discountAmount'] = Number(Number(instElement['discountAmount'] * 0.2).toFixed(2))
      //       updatedInstData.push(inst1, inst2)
      //     }
      //     else {
      //       updatedInstData.push(instElement)
      //     }
      //   }
      //   installment1 = updatedInstData.filter(item => { if (item.title == "Installment001") { return item } });
      //   installment2 = updatedInstData.filter(item => { if (item.title == "Installment002") { return item } });
      //   installment3 = updatedInstData.filter(item => { if (item.title == "Installment003") { return item } });
      //   installment4 = updatedInstData.filter(item => { if (item.title == "Installment004") { return item } });
      // }
      // else {
      //   installment1 = instData.filter(item => { if (item.title == "Installment001") { return item } });
      //   installment2 = instData.filter(item => { if (item.title == "Installment002") { return item } });
      //   installment3 = instData.filter(item => { if (item.title == "Installment003") { return item } });
      //   installment4 = instData.filter(item => { if (item.title == "Installment004") { return item } });
      // }

      // for (let i = 0; i < 40; i++) {
      // let installment1 = instData.filter(item => { if (item.title == "Installment001") { return item } });
      // let installment2 = instData.filter(item => { if (item.title == "Installment002") { return item } });
      // let installment3 = instData.filter(item => { if (item.title == "Installment003") { return item } });
      // let installment4 = instData.filter(item => { if (item.title == "Installment004") { return item } });
      //Total
      // let term1Total = Number(installment1.length > 0 ? installment1[0].totalAmount : 0) + Number(installment2.length > 0 ? installment2[0].totalAmount : 0)
      let term1Total = 0
      let term2Total = 0
      let term1Paid = 0
      let term2Paid = 0
      let term1Pending = 0
      let term2Pending = 0
      for (let trm = 0; trm < term1.length; trm++) {
        term1Total = term1Total + term1[trm].totalAmount
        term1Paid = term1Paid + term1[trm].paidAmount
        term1Pending = term1Pending + term1[trm].pendingAmount
      }
      for (let trm = 0; trm < term2.length; trm++) {
        term2Total = term2Total + term2[trm].totalAmount
        term2Paid = term2Paid + term2[trm].paidAmount
        term2Pending = term2Pending + term2[trm].pendingAmount
      }
      // let term2Total = Number(installment3.length > 0 ? installment3[0].totalAmount : 0) + Number(installment4.length > 0 ? installment4[0].totalAmount : 0)
      //Discount
      // let term1Discount = Number(installment1.length > 0 ? installment1[0].discountAmount : 0) + Number(installment2.length > 0 ? installment2[0].discountAmount : 0)
      // let term2Discount = Number(installment3.length > 0 ? installment3[0].discountAmount : 0) + Number(installment4.length > 0 ? installment4[0].discountAmount : 0)
      // let term2Discount = Number(Number(item.totalDiscount).toFixed(2))
      //Paid
      // let term1Paid = Number(installment1.length > 0 ? installment1[0].paidAmount : 0) + Number(installment2.length > 0 ? installment2[0].paidAmount : 0)
      // let term2Paid = Number(installment3.length > 0 ? installment3[0].paidAmount : 0) + Number(installment4.length > 0 ? installment4[0].paidAmount : 0)
      //Pending
      // let term1Pending = Number(installment1.length > 0 ? installment1[0].pendingAmount : 0) + Number(installment2.length > 0 ? installment2[0].pendingAmount : 0)
      // let term2Pending = Number(installment3.length > 0 ? installment3[0].pendingAmount : 0) + Number(installment4.length > 0 ? installment4[0].pendingAmount : 0)

      // let totalAmount = term1Total + term2Total
      // let totalDiscount = term1Discount + term2Discount
      // let totalPaid = term1Paid + term2Paid
      // let totalPending = term1Pending + term2Pending
      // if(item.regId == "1252"){
      //   console.log(item)
      // }
      await allcampdata[item.campusName].push({
        "REG. NO.": item.regId,
        "STUDENT NAME": item.studentName,
        "CLASS/BATCH": item.classBatch,
        "CAMPUS": item.campusName,
        "TOTAL FEES": item.studentTotalAmount,
        "TOTAL DISCOUNTS": item.totalDiscount,
        "TOTAL RECEIVABLES": item.totalPlannedAmount,
        "TOTAL RECEIVED": item.totalPaidAmount,
        "TOTAL PENDING": item.totalPendingAmount,
        // "TOTAL PENDING": item.totalPlannedAmount - item.totalPaidAmount,
        "TERM1 TOTAL": term1Total,
        // "TERM1 DISCOUNT": term1Discount,
        "TERM1 PAID": term1Paid,
        "TERM1 PENDING": term1Pending,
        "TERM2 TOTAL": term2Total,
        // "TERM2 DISCOUNT": term2Discount,
        "TERM2 PAID": term2Paid,
        "TERM2 PENDING": term2Pending,
        // "TOTAL PAID": totalPaid,
        "TOTAL PAID": item.totalPaidAmount,
        "TOTAL PENDING": item.totalPendingAmount,
        // "TOTAL PENDING": totalPending,
        "REMARKS": item.remarks ? item.remarks : ""
      })
    }
    var wb = xlsx.utils.book_new();
    for (let k in allcampdata) {
      var wscols = [];
      var findCellWidth = {};
      var cellKeys =
        allcampdata[k].length > 0
          ? Object.keys(allcampdata[k]["0"])
          : [
            "REG ID",
            "STUDENT NAME",
            "CLASS/BATCH",
            "CAMPUS",
            "TOTAL FEES (INR)",
            "TOTAL DISCOUNTS",
            "TOTAL RECEIVABLES",
            "TOTAL RECEIVED",
            "TOTAL PENDING",
            "TERM1 TOTAL",
            // "TERM1 DISCOUNT",
            "TERM1 PAID",
            "TERM1 PENDING",
            "TERM2 TOTAL",
            // "TERM2 DISCOUNT",
            "TERM2 PAID",
            "TERM2 PENDING",
            "TOTAL PAID",
            "TOTAL PENDING",
            "REMARKS"
          ];
      allcampdata[k].map((key, keyIndex) => {
        cellKeys.map((cellKey) => {
          if (findCellWidth[cellKey] != undefined) {
            findCellWidth[cellKey] =
              Number(findCellWidth[cellKey]) > String(key[cellKey]).length
                ? findCellWidth[cellKey]
                : String(key[cellKey]).length;
          } else {
            findCellWidth[cellKey] = Number(String(cellKey).length);
          }
        });
      });
      cellKeys.map((cellKey) => {
        if (cellKey == 'DATE OF RECEIPT') { }
        else if (cellKey == 'TOTAL FEES (INR)') {
          wscols.push({ wch: findCellWidth[cellKey], s: { font: { bold: true } } })
        }
        else if (cellKey == 'AMOUNT SANCTIONED') {
          wscols.push({ wch: findCellWidth[cellKey], s: { font: { bold: true } } })
        }
        else {
          wscols.push({ wch: findCellWidth[cellKey] + 5, s: { font: { bold: true } } })
        }
      });

      var E = xlsx.utils.decode_col("E"); // 1
      var F = xlsx.utils.decode_col("F"); // 1
      var G = xlsx.utils.decode_col("G"); // 1
      var H = xlsx.utils.decode_col("H"); // 1
      var I = xlsx.utils.decode_col("I"); // 1
      var J = xlsx.utils.decode_col("J"); // 1
      var K = xlsx.utils.decode_col("K"); // 1
      var L = xlsx.utils.decode_col("L"); // 1
      var M = xlsx.utils.decode_col("M"); // 1
      var N = xlsx.utils.decode_col("N"); // 1
      var O = xlsx.utils.decode_col("O"); // 1
      var P = xlsx.utils.decode_col("P"); // 1
      var Q = xlsx.utils.decode_col("Q"); // 1
      var fmt = "#,##,##0.00"; // or '"$"#,##0.00_);[Red]\\("$"#,##0.00\\)' or any Excel number format
      var ws = await xlsx.utils.json_to_sheet(allcampdata[k], {
        raw: false,
        numFmt: "$#,###.00",
        dateNF: "dd-MM-yy",
      });
      var range1 = xlsx.utils.decode_range(ws["!ref"]);
      for (var i = range1.s.r + 1; i <= range1.e.r; ++i) {
        var ref = xlsx.utils.encode_cell({ r: i, c: E });
        var ref1 = xlsx.utils.encode_cell({ r: i, c: F });
        var ref2 = xlsx.utils.encode_cell({ r: i, c: G });
        var ref3 = xlsx.utils.encode_cell({ r: i, c: H });
        var ref4 = xlsx.utils.encode_cell({ r: i, c: I });
        var ref5 = xlsx.utils.encode_cell({ r: i, c: J });
        var ref6 = xlsx.utils.encode_cell({ r: i, c: K });
        var ref7 = xlsx.utils.encode_cell({ r: i, c: L });
        var ref8 = xlsx.utils.encode_cell({ r: i, c: M });
        var ref9 = xlsx.utils.encode_cell({ r: i, c: N });
        var ref10 = xlsx.utils.encode_cell({ r: i, c: O });
        var ref11 = xlsx.utils.encode_cell({ r: i, c: P });
        var ref12 = xlsx.utils.encode_cell({ r: i, c: Q });

        // E
        if (!ws[ref]) continue;
        if (ws[ref].t != "n") continue;
        ws[ref].z = fmt;
        // F
        if (!ws[ref1]) continue;
        if (ws[ref1].t != "n") continue;
        ws[ref1].z = fmt;
        //G
        if (!ws[ref2]) continue;
        if (ws[ref2].t != "n") continue;
        ws[ref2].z = fmt;
        // H
        if (!ws[ref3]) continue;
        if (ws[ref3].t != "n") continue;
        ws[ref3].z = fmt;
        // I
        if (!ws[ref4]) continue;
        if (ws[ref4].t != "n") continue;
        ws[ref4].z = fmt;
        // J
        if (!ws[ref5]) continue;
        if (ws[ref5].t != "n") continue;
        ws[ref5].z = fmt;
        // K
        if (!ws[ref6]) continue;
        if (ws[ref6].t != "n") continue;
        ws[ref6].z = fmt;
        // L
        if (!ws[ref7]) continue;
        if (ws[ref7].t != "n") continue;
        ws[ref7].z = fmt;
        // M
        if (!ws[ref8]) continue;
        if (ws[ref8].t != "n") continue;
        ws[ref8].z = fmt;
        // N
        if (!ws[ref9]) continue;
        if (ws[ref9].t != "n") continue;
        ws[ref9].z = fmt;
        // O
        if (!ws[ref10]) continue;
        if (ws[ref10].t != "n") continue;
        ws[ref10].z = fmt;
        //P
        if (!ws[ref11]) continue;
        if (ws[ref11].t != "n") continue;
        ws[ref11].z = fmt;
        //Q
        if (!ws[ref12]) continue;
        if (ws[ref12].t != "n") continue;
        ws[ref12].z = fmt;

      }
      ws["!cols"] = wscols;
      xlsx.utils.book_append_sheet(wb, ws, k);
    }
    console.log("Excel file Creation is at final stage .!!");
  }
  let attachmentsPaths = await xlsx.write(wb, { type: "buffer", bookType: "xlsx", });
  console.log("Excel file created..!!");
  let filename = `Daily Report.xlsx`;

  //Creating Daily Report PDF
  // const dailyReport = await dailyReportTemplate(result, todayResult, logo, orgName);
  // let payload = { html: dailyReport };
  // let createPdf = await axios.post(`${process.env.externalServer}`, payload);
  // ----------------------------
  pubnubConfig.message.description = {
    status: "DFCR Report and PDF",
    dfcrResponse: await createPdf.data.data,
    excelResponse: "Excel created",
  };
  await pubnub.publish(pubnubConfig);
  // ----------------------------

  // fs.writeFileSync("temp.pdf", Buffer.from(createPdf.data.file), "base64");

  let msg;
  todayDate = moment().format("DD/MM/YYYY").split("/");
  dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";

  const pdfDoc = new HummusRecipe("temp.pdf", "encrypted.pdf");
  pdfDoc.encrypt({
    userPassword: dfcrPassword,
    ownerPassword: dfcrPassword,
    userProtectionFlag: 4,
  }).endPDF();
  fs.writeFileSync("temp-excel.xlsx", Buffer.from(attachmentsPaths), "base64");

  XlsxPopulate.fromFileAsync("temp-excel.xlsx")
    .then((workbook) => {
      for (let i = 0; i < workbook.sheets().length; i++) {
        const element = workbook.sheets()[i];
        let cell = element.range("A1:P1");
        // // Set multiple styles
        cell.style({ bold: true });
        cell.style("fill", "dddddd");
      }
      workbook.toFileAsync("encrypted-excel.xlsx", { password: dfcrPassword });
      return workbook.outputAsync();
    })
    .then((excelRes) => {
      let attachment = "";
      let attachment2 = "";
      fs.readFile("encrypted.pdf", async (err, pdfData) => {
        if (excelRes) {
          fs.readFile("encrypted-excel.xlsx", async (err, exceldata) => {
            await getBufferString(pdfData, exceldata);
          });
        }
      });
      async function getBufferString(pdfData, excelData) {
        attachment = Buffer.from(excelData).toString("base64");
        attachment2 = Buffer.from(pdfData).toString("base64");

        let sgKey = instituteDetails.emailServer[0].apiKey;
        sgMail.setApiKey(sgKey);
        let addressTo = instituteDetails.dfcr.addressTo;

        const usersSchema = mongoose.Schema({}, { strict: false });
        const usersModel = centralDbConnection.model("users", usersSchema, "users");
        // --------------------------
        pubnubConfig.message.description = {
          status: "Report created and sending mail",
        };
        await pubnub.publish(pubnubConfig);
        // --------------------------

        let emails = [];
        let userEmails = [];
        await usersModel.find({ willRcvDFCR: true, organiZation: String(orgName).toUpperCase() }).then(async (usersData) => {
          usersData.forEach((element) => { userEmails.push(element._doc.email); });
          console.log("user emails", userEmails);
          console.log(process.env.stage)
          if (process.env.stage == "local") {
            emails = ["naveenacharbp@gmail.com","naveen.p@zenqore.com","fajo@ken42.com","fajo.joy@zenqore.com","jayanthinathan.eee@gmail.com"];
            console.log(emails)
          }
          if (userEmails.length > 0) {
            userEmails.push("accounts@vijaykiran.co.in")
            msg = {
              to: process.env.stage == "prod" ? userEmails : process.env.stage == "local" ? emails : emails,
              // to: "jayanthinathan.eee@gmail.com",
              // Change to your recipient
              from: instituteDetails.emailServer[0].emailAddress, // Change to your verified sender
              subject: `${addressTo} - Daily Fee Collection Report of ${moment().format("DD/MM/YYYY")}`,
              html: `Dear ${addressTo} Team, <br/> <br/> Please find the attached Daily Fee Collection Report of ${moment().format("DD/MM/YYYY")} for your reference.<br/>
                     <p>These are password protected files.</p>
                     <br/>Regards <br/>`,
              attachments: [
                {
                  content: attachment,
                  filename: `Daily Report ${moment().format("DD-MM-YYYY")}.xlsx`,
                  type: "text/html",
                  disposition: "attachment",
                },
                {
                  content: attachment2,
                  filename: `Daily Report ${moment().format("DD-MM-YYYY")}.pdf`,
                  type: "application/pdf",
                  disposition: "attachment",
                },
                {
                  content: campus1Attach,
                  filename: `Fee-Collection-report-CVR-${moment().format("DD-MM-YYYY")}.xlsx`,
                  type: "text/html",
                  disposition: "attachment",
                },
                {
                  content: campus2Attach,
                  filename: `Fee-Collection-report-JBN-${moment().format("DD-MM-YYYY")}.xlsx`,
                  type: "text/html",
                  disposition: "attachment",
                }, {
                  content: campus3Attach,
                  filename: `Fee-Collection-report-PP-${moment().format("DD-MM-YYYY")}.xlsx`,
                  type: "text/html",
                  disposition: "attachment",
                }
              ],
            };
            let sendemail = await sendDailyReportTemplate(msg, addressTo, orgName);
          }
        });
      }
    });
}

async function sendDailyReportTemplate(message, addressTo, orgName) {
  sgMail
    .send(message)
    .then(() => {
      console.log("Sent Email");
      var obj = {
        success: true,
      };
      message.subject = `${addressTo} - Daily Fee Collection Report of ${moment().format("DD/MM/YYYY")} - ` + String(process.env.stage).toUpperCase() + " - " + String(orgName).toUpperCase();
      if (process.env.stage == "prod") {
        message.to = ["fajo@ken42.com","naveenacharbp@gmail.com","naveen.p@zenqore.com","jayanthinathan.c@zenqore.com", "mehul.patel@zenqore.com", "fajo.joy@zenqore.com"];
      } else if (process.env.stage == "local") {
        message.to = ["naveenacharbp@gmail.com","naveen.p@zeqore.com","jayanthinathan.c@zenqore.com"];
      }
      sgMail
        .send(message)
        .then(() => {
          console.log("Sent Email send to Mehul Patel");
          fs.unlink("temp.pdf", (err) => { console.log("Temp PDF file is deleted "); });
          fs.unlink("encrypted.pdf", (err) => { console.log("Encrypted PDF file is deleted "); });
          fs.unlink("temp-excel.xlsx", (err) => { console.log("Temp XLSX file is deleted "); });
          fs.unlink("encrypted-excel.xlsx", (err) => { console.log("Encrypted XLSX file is deleted "); });
          fs.unlink("encrypted-excel1.xlsx", (err) => { console.log("Temp1 excel file is deleted "); });
          fs.unlink("encrypted-excel2.xlsx", (err) => { console.log("Temp2 excel file is deleted "); });
          fs.unlink("encrypted-excel3.xlsx", (err) => { console.log("Temp3 excel file is deleted "); });

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
        });
    })
    .catch((error) => {
      console.log("error", error);
      var obj = {
        success: false,
      };
    });
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

module.exports = {
  processDFCR: processDFCR,
};
