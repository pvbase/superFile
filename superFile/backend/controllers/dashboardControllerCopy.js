const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const transactionCollectionName = "transactions";
const transactionsSchema = require("../models/transactionsModel");
const StudentSchema = require("../models/studentModel");
var _ = require("lodash");
var momentTimeZone = require("moment-timezone");
var moment = require("moment");
const timeZone = "Asia/Calcutta|Asia/Kolkata";
momentTimeZone.tz.link("Asia/Calcutta|Asia/Kolkata");
momentTimeZone.tz.setDefault("Asia/Calcutta|Asia/Kolkata");
const momentRange = require("moment-range");

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
  if (String(type).toLowerCase() == "ytd") {
    if (today.getMonth() < 5) {
      fromDate = new Date(`06-01-${Number(today.getFullYear()) - 1}`);
      toDate = new Date(`05-31-${today.getFullYear()}`);
    } else {
      fromDate = new Date(`06-01-${today.getFullYear()}`);
      toDate = new Date(`05-31-${Number(today.getFullYear()) + 1}`);
    }
  } else if (String(type).toLowerCase() == "mtd") {
    fromDate = moment()
      .subtract(1, "months")
      .endOf("month")
      .format("YYYY-MM-DD hh:mm");
    toDate = moment()
      .add(1, "months")
      .startOf("month")
      .format("YYYY-MM-DD hh:mm");
  } else if (String(type).toLowerCase() == "wtd") {
    fromDate = moment().startOf("isoweek");
    toDate = moment().endOf("isoweek");
  }

  fromDate = momentTimeZone(fromDate).tz(timeZone);
  toDate = momentTimeZone(toDate).tz(timeZone);
  const aggregatePipeline = [
    {
      $match: {
        transactionSubType: "demandNote",
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

  //console.log("firstDay : ", firstDay.format("dddd, MMMM Do YYYY, h:mm:ss a"));
  //console.log("endDay : ", endDay.format("dddd, MMMM Do YYYY, h:mm:ss a"));
  // // Create a range for the month we can iterate through
  monthRange = momentRangeVar.range(firstDay, endDay);
  //console.log("monthRange : ", monthRange);
  // // Get all the weeks during the current month
  weeks = [];
  for (let mday of monthRange.by("days")) {
    // console.log("mday", mday.week());
    if (weeks.indexOf(mday.week()) === -1) {
      weeks.push(mday.week());
    }
  }

  //console.log("weeks : ", weeks);

  // // Create a range for each week
  var monthReports = {
    weekLabels: [],
    dueAmount: [],
    paidAmount: [],
    pendingAmount: [],
  };
  for (let index = 0; index < weeks.length; index++) {
    var weeknumber = weeks[index];

    firstWeekDay = moment(firstDay).week(weeknumber).day(0);
    if (firstWeekDay.isBefore(firstDay)) {
      firstWeekDay = firstDay;
    }

    var nextWeekDay;
    if (weeks[index + 1] != undefined) {
      nextWeekDay = moment(firstDay)
        .week(weeks[index + 1])
        .day(0);
      if (nextWeekDay.isBefore(firstDay)) {
        nextWeekDay = firstDay;
      }
      nextWeekDay = new Date(nextWeekDay);
      // console.log('next week',new Date(nextWeekDay),index)
      // console.log('next year',nextWeekDay.getFullYear())
      // console.log('next date',nextWeekDay.getDate())
      // console.log('next month',nextWeekDay.getMonth())
    }

    lastWeekDay = moment(endDay).week(weeknumber).day(6);
    if (lastWeekDay.isAfter(endDay)) {
      lastWeekDay = endDay;
    }

    fromWeek = new Date(firstWeekDay.format("MM-DD-YYYY"));
    toWeek =
      index + 1 == weeks.length
        ? new Date(lastWeekDay.format("MM-DD-YYYY"))
        : moment(new Date(nextWeekDay))
            .subtract(1, "days")
            .format("DD-MM-YYYY");
    fromWeek = moment(fromWeek).tz(timeZone);
    var lastweekIssue = `${today.getFullYear()}-${
      today.getMonth() > 12 ? "01" : Number(today.getMonth()) + 2
    }-01`;
    toWeek =
      index == weeks.length - 1
        ? moment(lastweekIssue).tz(timeZone)
        : momentTimeZone(toWeek).tz(timeZone);
    // console.log('from week', fromWeek)
    // console.log('to week', toWeek)
    const aggregateMonth = [
      {
        $match: {
          transactionSubType: "demandNote",
          transactionDate: { $gte: new Date(fromWeek), $lte: new Date(toWeek) },
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
    monthReports["weekLabels"].push(`week ${Number(index) + 1}`);
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
  let studentModel = await dbConnection.model("students", StudentSchema);
  const studentFeeReport = await studentModel.aggregate(studentFeePipeline);
  const studentDetails = await studentModel.find({});
  let totalTuitionAmt = 0;
  let totalDueAmt = 0;
  let totalPaidAmt = 0;
  let totalPendingAmt = 0;
  let fbDetails = {};
  let ppDetails = {};
  let fbTotalDetails = {};
  // var weekReport = []
  // var monthReportsKey = Object.keys(monthReports)
  // for (let mrkindex = 0; mrkindex < monthReportsKey.length; mrkindex++) {
  //     const mrki = monthReports[monthReportsKey[mrkindex]];
  // }
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
      // studentFeeReport: studentFeeReport
      // thisMonth: { ...tmPpDetails }
    },
  });
}

module.exports = {
  getDashboardData: getDashboardData,
};
