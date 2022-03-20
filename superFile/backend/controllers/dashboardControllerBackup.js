const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const transactionCollectionName = "transactions";
const transactionsSchema = require("../models/transactionsModel");
const StudentSchema = require("../models/studentModel");
const ApplicationSchema = require("../models/ken42/applicationModel");
var _ = require("lodash");
var momentTimeZone = require("moment-timezone");
var moment = require("moment");
const timeZone = "Asia/Calcutta|Asia/Kolkata";
momentTimeZone.tz.link("Asia/Calcutta|Asia/Kolkata");
momentTimeZone.tz.setDefault("Asia/Calcutta|Asia/Kolkata");
const momentRange = require("moment-range");
const campusSchema = require("../models/campusModel");
const momentRangeVar = momentRange.extendMoment(moment);
async function getDashboardData(req, res) {
  var dbUrl = req.headers.resource;
  console.log("dburl", dbUrl);
  const { orgId, type } = req.query;
  let dbConnection = await createDatabase(orgId, dbUrl);
  const transactionModel = dbConnection.model(
    transactionCollectionName,
    transactionsSchema,
    transactionCollectionName
  );
  var today = new Date();
  var fromDate, toDate;
  var monthStart = moment().startOf("month").format("YYYY-MM-DD");
  var monthEnd = moment().endOf("month").format("YYYY-MM-DD");
  var d = new Date();
  var months = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var days = [];
  for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
    months.push({
      label: `${monthNames[
        Number(moment().subtract(monthIndex, "months").format("MM")) - 1
      ]
        } ${moment().subtract(monthIndex, "months").format("YYYY")}`,
      month: Number(moment().subtract(monthIndex, "months").format("MM")) - 1,
      year: moment().subtract(monthIndex, "months").format("YYYY"),
    });
  }
  for (let dayIndex = 0; dayIndex < dayNames.length; dayIndex++) {
    days.push({
      label: String(
        moment().subtract(dayIndex, "day").startOf("day").toString()
      ).substr(0, 3),
      day: dayIndex,
    });
  }
  if (String(type).toLowerCase() == "ytd") {
    fromDate = moment().subtract(1, "year").startOf("day").toString();
    toDate = moment().endOf("day").toString();
  } else if (String(type).toLowerCase() == "mtd") {
    fromDate = moment().subtract(1, "month").startOf("day").toString();
    toDate = moment().endOf("day").toString();
  } else if (String(type).toLowerCase() == "wtd") {
    fromDate = moment().subtract(1, "week").startOf("day").toString();
    toDate = moment().endOf("day").toString();
  }
  fromDate = momentTimeZone(fromDate).tz(timeZone);
  toDate = momentTimeZone(toDate).tz(timeZone);
  const aggregatePipeline = [
    {
      $match: {
        transactionSubType: "feePayment",
        transactionDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      },
    },
    {
      $lookup: {
        from: "feesledgers",
        localField: "displayName",
        foreignField: "primaryTransaction",
        as: "feesLedgers",
      },
    },
    {
      $lookup: {
        from: "programplans",
        localField: "programPlan",
        foreignField: "_id",
        as: "programPlanData",
      },
    },
    {
      $addFields: {
        pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
        programPlanId: "$programPlanData",
        feesBreakUp: {
          $map: {
            input: { $range: [0, { $size: "$data.feesBreakUp" }] },
            as: "ix",
            in: {
              $let: {
                vars: {
                  rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                  sen: { $arrayElemAt: ["$feesLedgers", -1] },
                },
                in: {
                  feeTypeId: "$$rec.feeTypeId",
                  description: "$$rec.feeType",
                  feeTypeCode: "$$rec.feeTypeCode",
                  amount: "$$rec.amount",
                  pendingAmount: "$$sen.pendingAmount",
                  paidAmount: {
                    $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                  },
                  status: "$$sen.status",
                },
              },
            },
          },
        },
      },
    },
    {
      $project: {
        amount: "$amount",
        paidAmount: {
          $subtract: ["$amount", { $arrayElemAt: ["$pendingAmount", 0] }],
        },
        pendingAmount: { $arrayElemAt: ["$pendingAmount", 0] },
        feesBreakUp: "$feesBreakUp",
        transactionDate: { $arrayElemAt: ["$feesLedgers.transactionDate", 0] },
        programPlan: { $arrayElemAt: ["$programPlanData.displayName", 0] },
        displayName: { $arrayElemAt: ["$feesLedgers.displayName", 0] },
      },
    },
  ];
  const aggregateRefund = [
    {
      $match: {
        transactionSubType: "refund",
        transactionDate: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      },
    },
    {
      $group: {
        _id: { displayName: "$displayName" },
        totalRefundAmount: { $sum: "$amount" },
      },
    },
  ];
  let year = today.getFullYear(); //Year
  month = today.getMonth(); // Month (0 indexed)
  startDate = moment([year, month]);

  // // Get the first and last day of the month
  firstDay = moment(startDate).startOf("month");
  endDay = moment(startDate).endOf("month");

  // // Create a range for the month we can iterate through
  monthRange = momentRangeVar.range(firstDay, endDay);
  // // Get all the weeks during the current month
  weeks = [];
  for (let mday of monthRange.by("days")) {
    if (weeks.indexOf(mday.week()) === -1) {
      weeks.push(mday.week());
    }
  }

  // // Create a range for each week
  var monthReports = {
    weekLabels: [],
    dueAmount: [],
    paidAmount: [],
    pendingAmount: [],
  };
  var iterateData =
    String(type).toLowerCase() == "ytd"
      ? months
      : String(type).toLowerCase() == "wtd"
        ? days
        : weeks;
  for (let index = 0; index < iterateData.length; index++) {
    var weeknumber = iterateData[index];
    var fromDateValue = "";
    var toDateValue = "";
    if (String(type).toLowerCase() == "ytd") {
      fromDateValue = moment([weeknumber["year"], weeknumber["month"]]);
      // Clone the value before .endOf()
      toDateValue = moment(fromDateValue).endOf("month");
    } else if (String(type).toLowerCase() == "wtd") {
      fromDateValue = moment().subtract(index, "day").startOf("day").toString();
      toDateValue = moment().subtract(index, "day").endOf("day").toString();
      fromDateValue = moment(fromDateValue).tz(timeZone);
      toDateValue = moment(toDateValue).tz(timeZone);
    } else {
      lastWeekDay = moment().subtract(
        (weeknumber - 1) * (6 + (weeknumber == 1 ? 0 : 1)),
        "day"
      );
      firstWeekDay = moment(lastWeekDay).subtract(6, "day");

      fromWeek = new Date(firstWeekDay.format("MM-DD-YYYY"));
      toWeek = new Date(lastWeekDay.format("MM-DD-YYYY"));
      fromWeek = moment(fromWeek).tz(timeZone);
      toWeek = moment(toWeek).tz(timeZone).endOf("day").toString();
      toWeek = moment(toWeek).tz(timeZone);
      fromDateValue = fromWeek;
      toDateValue = toWeek;
    }
    const aggregateMonth = [
      {
        $match: {
          transactionSubType: "feePayment",
          transactionDate: {
            $gte: new Date(fromDateValue),
            $lte: new Date(toDateValue),
          },
        },
      },
      {
        $lookup: {
          from: "feesledgers",
          localField: "displayName",
          foreignField: "primaryTransaction",
          as: "feesLedgers",
        },
      },
      {
        $lookup: {
          from: "programplans",
          localField: "programPlan",
          foreignField: "programCode",
          as: "programPlanData",
        },
      },
      {
        $addFields: {
          pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
          programPlanId: "$programPlanData",
          feesBreakUp: {
            $map: {
              input: { $range: [0, { $size: "$data.feesBreakUp" }] },
              as: "ix",
              in: {
                $let: {
                  vars: {
                    rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                    sen: { $arrayElemAt: ["$feesLedgers", -1] },
                  },
                  in: {
                    feeTypeId: "$$rec.feeTypeId",
                    description: "$$rec.feeType",
                    feeTypeCode: "$$rec.feeTypeCode",
                    amount: "$$rec.amount",
                    pendingAmount: "$$sen.pendingAmount",
                    paidAmount: {
                      $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                    },
                    status: "$$sen.status",
                  },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          amount: "$amount",
          paidAmount: {
            $subtract: ["$amount", { $arrayElemAt: ["$pendingAmount", 0] }],
          },
          pendingAmount: { $arrayElemAt: ["$pendingAmount", 0] },
          feesBreakUp: "$feesBreakUp",
          transactionDate: {
            $arrayElemAt: ["$feesLedgers.transactionDate", 0],
          },
          programPlan: { $arrayElemAt: ["$programPlanData.displayName", 0] },
          displayName: { $arrayElemAt: ["$feesLedgers.displayName", 0] },
        },
      },
    ];
    const aggregatedMonthReport = await transactionModel.aggregate(
      aggregateMonth
    );
    // console.log('aggregatedMonthReport', aggregatedMonthReport)
    let totalMonthDueAmt = 0;
    let totalMonthPaidAmt = 0;
    let totalMonthPendingAmt = 0;
    let labelName =
      String(type).toLowerCase() == "ytd"
        ? weeknumber["label"]
        : String(type).toLowerCase() == "wtd"
          ? weeknumber["label"]
          : `week ${Number(index) + 1}`;
    monthReports["weekLabels"].push(`${labelName}`);
    if (aggregatedMonthReport.length > 0) {
      for (let ai = 0; ai < aggregatedMonthReport.length; ai++) {
        const mrki = aggregatedMonthReport[ai];
        totalMonthDueAmt =
          Number(totalMonthDueAmt) +
          (mrki.amount != null ? Number(mrki.amount) : 0);
        totalMonthPaidAmt =
          Number(totalMonthPaidAmt) +
          (mrki.paidAmount != null ? Number(mrki.paidAmount) : 0);
        totalMonthPendingAmt =
          Number(totalMonthPendingAmt) +
          (mrki.pendingAmount != null
            ? Number(mrki.pendingAmount)
            : mrki.pendingAmount == null
              ? mrki.amount
              : 0);
      }
      monthReports["dueAmount"].push(totalMonthDueAmt);
      monthReports["paidAmount"].push(totalMonthPaidAmt);
      monthReports["pendingAmount"].push(totalMonthPendingAmt);
    } else {
      monthReports["dueAmount"].push(totalMonthDueAmt);
      monthReports["paidAmount"].push(totalMonthPaidAmt);
      monthReports["pendingAmount"].push(totalMonthPendingAmt);
    }
    // monthReports[`week ${Number(index) + 1}`].push(aiElts)
  }
  const aggregatedReport = await transactionModel.aggregate(aggregatePipeline);
  const refundReport = await transactionModel.aggregate(aggregateRefund);
  // console.log('refundReport', refundReport)
  const studentFeePipeline = [
    {
      $lookup: {
        from: "feestructures",
        localField: "feeStructureId",
        foreignField: "_id",
        as: "feeStructures",
      },
    },
    {
      $lookup: {
        from: "feetypes",
        localField: "feeStructures.feeTypeIds",
        foreignField: "_id",
        as: "feeType",
      },
    },
    {
      $lookup: {
        from: "feemanagers",
        let: {
          programPlanId: "$programPlanId",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$programPlanId", "$$programPlanId"] }],
              },
            },
          },
        ],
        as: "feeManagers",
      },
    },
    // {
    //     $lookup: {
    //         from: "feemanagers",
    //         localField: "feeType._id",
    //         foreignField: "feeTypeId",
    //         as: "feeManagers"
    //     },
    // }
  ];
  let studentModel =  dbConnection.model("students", StudentSchema);
  const studentFeeReport = await studentModel.aggregate(studentFeePipeline);
  const studentDetails = await studentModel.find({});
  let campusModel = dbConnection.model("campuses", campusSchema);
  const campusDetails = await campusModel.find({});
  // console.log('.....ccc',campusDetails)
  var stu=[]

  for (let i = 0; i < campusDetails.length; i++) {
    let studentdata = {}
    studentdata.campusId = campusDetails[i]._id
    studentdata.campusName = campusDetails[i].legalName
    const studentlen = await studentModel.find({ campusId:String(campusDetails[i]._id) });
    studentdata.totalStudent = studentlen.length
    stu.push(studentdata)
  }
  
  console.log(stu)

  let totalTuitionAmt = 0;
  let totalDueAmt = 0;
  let totalPaidAmt = 0;
  let totalPendingAmt = 0;
  let fbDetails = {};
  let ppDetails = {};
  let fbTotalDetails = {};
  for (let index = 0; index < aggregatedReport.length; index++) {
    const element = aggregatedReport[index];
    totalDueAmt =
      Number(totalDueAmt) +
      (element.amount != null ? Number(element.amount) : 0);
    totalPaidAmt =
      Number(totalPaidAmt) +
      (element.paidAmount != null ? Number(element.paidAmount) : 0);
    totalPendingAmt =
      Number(totalPendingAmt) +
      (element.pendingAmount != null
        ? Number(element.pendingAmount)
        : element.pendingAmount == null
          ? Number(element.amount)
          : 0);
    if (element["programPlan"] != undefined) {
      ppDetails[element["programPlan"]] =
        ppDetails[element["programPlan"]] != undefined
          ? ppDetails[element["programPlan"]]
          : {};
      ppDetails[element["programPlan"]]["due"] =
        ppDetails[element["programPlan"]]["due"] != undefined
          ? ppDetails[element["programPlan"]]["due"]
          : [];
      ppDetails[element["programPlan"]]["pending"] =
        ppDetails[element["programPlan"]]["pending"] != undefined
          ? ppDetails[element["programPlan"]]["pending"]
          : [];
      ppDetails[element["programPlan"]]["paid"] =
        ppDetails[element["programPlan"]]["paid"] != undefined
          ? ppDetails[element["programPlan"]]["paid"]
          : [];
      ppDetails[element["programPlan"]]["due"].push(
        element.amount != null ? Number(element.amount) : 0
      );
      ppDetails[element["programPlan"]]["paid"].push(
        element.paidAmount != null ? Number(element.paidAmount) : 0
      );
      ppDetails[element["programPlan"]]["pending"].push(
        element.pendingAmount != null
          ? Number(element.pendingAmount)
          : element.pendingAmount == null
            ? element.amount
            : 0
      );
    }
    for (let j = 0; j < element["feesBreakUp"].length; j++) {
      const fbElt = element["feesBreakUp"][j];
      fbDetails[fbElt["description"]] =
        fbDetails[fbElt["description"]] != undefined
          ? fbDetails[fbElt["description"]]
          : [];
      fbDetails[fbElt["description"]].push(fbElt);
      fbTotalDetails[fbElt["description"]] =
        fbTotalDetails[fbElt["description"]] != undefined
          ? Number(
            Number(fbTotalDetails[fbElt["description"]]) +
            Number(fbElt["amount"])
          )
          : Number(fbElt["amount"]);
    }
  }
  var feeBasedReport = {};
  for (let index = 0; index < studentFeeReport.length; index++) {
    const element = studentFeeReport[index];
    for (let eltI = 0; eltI < element["feeType"].length; eltI++) {
      const ftElt = element["feeType"][eltI];
      for (let fmI = 0; fmI < element["feeManagers"].length; fmI++) {
        const fmElt = element["feeManagers"][fmI];
        if (
          String(ftElt["_id"]) == String(fmElt["feeTypeId"]) &&
          String(element["programPlanId"]) == String(fmElt["programPlanId"])
        ) {
          feeBasedReport[element["feeType"][eltI]["title"]] =
            feeBasedReport[element["feeType"][eltI]["title"]] != undefined
              ? Number(feeBasedReport[element["feeType"][eltI]["title"]]) +
              Number(fmElt["feeDetails"]["totalAmount"])
              : Number(fmElt["feeDetails"]["totalAmount"]);
        }
      }
    }
  }
  var applicationModel = dbConnection.model("applications", ApplicationSchema);
  const aggregateAppINR = [
    {
      $match: {
        currencyCode: "INR",
        createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      },
    },
    {
      $group: {
        _id: { displayName: "$displayName" },
        total: { $sum: "$amount" },
        totalPaisa: { $sum: "$paisa" },
        appCount: { $sum: 1 },
      },
    },
    {
      $project: {
        total: { $sum: ["$total", "$paisa"] },
        appCount: "$appCount",
      },
    },
  ];
  const aggregateAppUSD = [
    {
      $match: {
        currencyCode: "USD",
        createdAt: { $gte: new Date(fromDate), $lte: new Date(toDate) },
      },
    },
    {
      $group: {
        _id: { displayName: "$displayName" },
        total: { $sum: "$amount" },
        appCount: { $sum: 1 },
      },
    },
    {
      $project: {
        total: { $sum: ["$total", "$paisa"] },
        appCount: "$appCount",
      },
    },
  ];
  const applicationINRDetails = await applicationModel.aggregate(
    aggregateAppINR
  );
  const applicationUSDDetails = await applicationModel.aggregate(
    aggregateAppUSD
  );
  let domesticApp = {
    appCount:
      applicationINRDetails["0"] != undefined
        ? applicationINRDetails["0"]["appCount"]
        : 0,
    total:
      applicationINRDetails["0"] != undefined
        ? applicationINRDetails["0"]["total"]
        : 0,
  };
  let internationalApp = {
    appCount:
      applicationUSDDetails["0"] != undefined
        ? applicationUSDDetails["0"]["appCount"]
        : 0,
    total:
      applicationUSDDetails["0"] != undefined
        ? applicationUSDDetails["0"]["total"]
        : 0,
  };
  dbConnection.close();
  res.status(200).send({
    status: "success",
    data: {
      totalStudents: studentDetails.length,
      feeDetails: fbDetails,
      totalDemandAmount: totalDueAmt,
      totalFeeCollected: totalPaidAmt,
      totalPendingAmount: Number(totalDueAmt) - Number(totalPaidAmt),
      totalRefundAmount:
        refundReport.length > 0 ? refundReport["0"]["totalRefundAmount"] : 0,
      feeAmount: {
        // ...fbTotalDetails
        ...feeBasedReport,
      },
      programPlanData: { ...ppDetails },
      monthReports: monthReports,
      totalApplication:
        Number(domesticApp["appCount"]) + Number(internationalApp["appCount"]),
      totalDomesticApplication: domesticApp["appCount"],
      totalInternationalApplication: internationalApp["appCount"],
      totalAppFeeINR: domesticApp["total"],
      totalAppFeeUSD: internationalApp["total"],
      // studentFeeReport: studentFeeReport
      // thisMonth: { ...tmPpDetails }
    },
  });
}

module.exports = {
  getDashboardData: getDashboardData,
};
