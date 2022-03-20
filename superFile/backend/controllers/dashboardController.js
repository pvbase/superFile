const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const transactionCollectionName = "transactions";
const transactionsSchema = require("../models/transactionsModel");
const StudentSchema = require("../models/studentModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
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
  // console.log("dburl", dbUrl);
  const { orgId, type } = req.query;
  let dbConnection = await createDatabase(orgId, dbUrl);
  const transactionModel = dbConnection.model(
    transactionCollectionName,
    transactionsSchema,
    transactionCollectionName
  );

  // campus wise student count
  let studentsModel = dbConnection.model("students", StudentSchema);
  let campusModel = dbConnection.model("campuses", campusSchema);
  let studentFeesMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  var studwiseCmpData = [];
  var totalFessPaidPend = {};
  await studentFeesMapModel.find({ pending: 0 }, (error, results) => {
    totalFessPaidPend.totalPaidStudents = results.length
  })
  await studentFeesMapModel.find({}, (error, results) => {
    totalFessPaidPend.totalPendingStudents = results.length - totalFessPaidPend.totalPaidStudents
  })
  await studentFeesMapModel.find({}, (error, results) => {
    Array.prototype.sum = function (prop) {
      var total = 0
      for (var i = 0, _len = this.length; i < _len; i++) {
        total += Number(this[i][prop])
      }
      return total
    }
    totalFessPaidPend.paidAmnt = results.sum("paid");
    totalFessPaidPend.pendingAmnt = results.sum("pending")
  })
  campusModel.find({}, async (error, results) => {
    for (let i = 0; i < results.length; i++) {
      let localStoreData = {}
      await studentsModel.find({ campusId: String(results[i]._id) }, (errorOne, resultsOne) => {
        localStoreData.campusName = `${results[i].displayName}`;
        localStoreData.studentsCount = resultsOne.length;
        studwiseCmpData.push(localStoreData)
      })
    }
  })

  // campus wise fee collection info (Palnned , paid , pending)
  let studentFeeMapsModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  var feePendingCmpDetails = [];
  campusModel.find({}, async (error, results) => {
    for (let i = 0; i < results.length; i++) {
      let localStoreFee = {};
      await studentFeeMapsModel.find({ campusId: String(results[i]._id) }, async (errorOne, resultsOne) => {
        Array.prototype.sum = function (prop) {
          var total = 0
          for (var i = 0, _len = this.length; i < _len; i++) {
            total += Number(this[i][prop])
          }
          return total
        }
        localStoreFee.campusName = `${results[i].displayName}`;
        localStoreFee.totalPaidVal = resultsOne.sum("paid");
        localStoreFee.totalPendingVal = resultsOne.sum("pending");
        localStoreFee.totalPlannedVal = resultsOne.sum("amount");
        feePendingCmpDetails.push(localStoreFee);
      })
    }
  })

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
  // console.log('months', months)
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
    toDate = moment().add(1, 'days').endOf("day").toString();
  } else if (String(type).toLowerCase() == "wtd") {
    fromDate = moment().subtract(1, "week").startOf("day").toString();
    toDate = moment().endOf("day").toString();
  }
  fromDate = momentTimeZone(fromDate).tz(timeZone);
  toDate = momentTimeZone(toDate).tz(timeZone);
  // console.log('***From Date***', fromDate, new Date(fromDate))
  // console.log('***To Date***', toDate, new Date(toDate))

  //Calculate Total Fees and Total Student
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
        from: "programplans",
        localField: "programPlanId",
        foreignField: "_id",
        as: "programPlanData",
      },
    },
    {
      $lookup: {
        from: "feetypes",
        localField: "feeStructures.feeTypeIds",
        foreignField: "_id",
        as: "feeType",
      },
    }
  ];
  // console.log('aggregate start test')
  let studentModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let planingAmount = 0
  const studentFeeReport = await studentModel.aggregate(studentFeePipeline);
  var feeBasedReport = {};
  let programPlanPendingAmount = {}
  for (let index = 0; index < studentFeeReport.length; index++) {
    let element = studentFeeReport[index];
    programPlanPendingAmount[element['programPlanData']['0']['displayName']] = programPlanPendingAmount[element['programPlanData']['0']['displayName']] == undefined ? element['pending'] : (Number(programPlanPendingAmount[element['programPlanData']['0']['displayName']]) + Number(element['pending']))
    if (element['transactionPlan'] != undefined) {
      let transactionPlan = element['transactionPlan']
      if (transactionPlan["feesBreakUp"] != undefined) {
        for (let tpI = 0; tpI < transactionPlan["feesBreakUp"].length; tpI++) {
          feeBasedReport[transactionPlan["feesBreakUp"][tpI]["title"]] =
            feeBasedReport[transactionPlan["feesBreakUp"][tpI]["title"]] != undefined
              ? Number(feeBasedReport[transactionPlan["feesBreakUp"][tpI]["title"]]) +
              Number(transactionPlan["feesBreakUp"][tpI]['amount'])
              : Number(transactionPlan["feesBreakUp"][tpI]['amount']);
        }
      }

    }

  }
  // console.log('aggregate end')


  //Calculate Fee Transaction 
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
        foreignField: "transactionDisplayName",
        as: "feesLedgers",
      },
    },
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "studentDetails",
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
        paidAmount: { $slice: ["$feesLedgers.paidAmount", -1] },
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
                  // paidAmount: {
                  //   $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                  // },
                  paidAmount: "$$sen.paidAmount",
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
        studentRegId: "$studentRegId",
        amount: "$amount",
        paidAmount: { $arrayElemAt: ["$paidAmount", 0] },
        pendingAmount: { $arrayElemAt: ["$pendingAmount", 0] },
        feesBreakUp: "$feesBreakUp",
        transactionDate: { $arrayElemAt: ["$feesLedgers.transactionDate", 0] },
        programPlan: { $arrayElemAt: ["$programPlanData.displayName", 0] },
        displayName: { $arrayElemAt: ["$feesLedgers.displayName", 0] },
        titleName: { $arrayElemAt: ["$feesLedgers.title", 0] }
      },
    },
  ];
  const aggregatedReport = await transactionModel.aggregate(aggregatePipeline);
  let totalTuitionAmt = 0;
  let totalDueAmt = 0;
  let totalPaidAmt = 0;
  let totalPendingAmt = 0;
  let pendingAmountStudentDetails = {}
  let fbDetails = {};
  let ppDetails = {};
  let fbTotalDetails = {};
  for (let index = 0; index < aggregatedReport.length; index++) {
    let element = aggregatedReport[index];
    totalPaidAmt += Number(element.paidAmount)
    pendingAmountStudentDetails[element['studentRegId']] = Number(element.pendingAmount)
    if (element["programPlan"] != undefined) {
      let ppKey = element["titleName"] + element["studentRegId"]
      ppDetails[ppKey] =
        ppDetails[ppKey] != undefined
          ? ppDetails[ppKey]
          : {};
      ppDetails[ppKey]["due"] =
        ppDetails[ppKey]["due"] != undefined
          ? ppDetails[ppKey]["due"]
          : [];
      ppDetails[ppKey]["pending"] =
        ppDetails[ppKey]["pending"] != undefined
          ? ppDetails[ppKey]["pending"]
          : [];
      ppDetails[ppKey]["paid"] =
        ppDetails[ppKey]["paid"] != undefined
          ? ppDetails[ppKey]["paid"]
          : [];
      ppDetails[ppKey]["due"].push(0);
      ppDetails[ppKey]["paid"].push(
        {
          "amount": element.paidAmount != null ? Number(element.paidAmount) : 0,
          "programPlan": element["programPlan"]
        }
      );
      ppDetails[ppKey]["pending"].push(
        {
          "amount": element.pendingAmount != null ? Number(element.pendingAmount) : 0,
          "programPlan": element["programPlan"]
        }
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
  let programPlanDetails = {}
  for (let ppIndex = 0; ppIndex < Object.keys(ppDetails).length; ppIndex++) {
    let element = ppDetails[Object.keys(ppDetails)[ppIndex]]
    // console.log('element', element)
    let ppKey = element['paid']['0']["programPlan"]
    // console.log('ppKey', ppKey)
    programPlanDetails[ppKey] = programPlanDetails[ppKey] != undefined ? programPlanDetails[ppKey] : {}
    programPlanDetails[ppKey]["due"] = programPlanDetails[ppKey]["due"] != undefined ? programPlanDetails[ppKey]["due"] : [];
    programPlanDetails[ppKey]["pending"] = programPlanDetails[ppKey]["pending"] != undefined ? programPlanDetails[ppKey]["pending"] : [];
    programPlanDetails[ppKey]["paid"] = programPlanDetails[ppKey]["paid"] != undefined ? programPlanDetails[ppKey]["paid"] : [];
    // programPlanDetails[ppKey]["paid"] = element['paid']
    let paidAmount = 0
    for (let paIndex = 0; paIndex < element['paid'].length; paIndex++) {
      let ppElement = element['paid'][paIndex];
      // console.log('element', ppElement)
      programPlanDetails[ppKey]["paid"].push(ppElement['amount'])
      paidAmount += Number(ppElement['amount'])
    }
    for (let paIndex = 0; paIndex < element['pending'].length; paIndex++) {
      let ppElement = element['pending'][paIndex];
      if (element['pending'].length == (Number(paIndex) + 1)) {
        programPlanDetails[ppKey]["pending"].unshift(programPlanPendingAmount[ppKey])
        programPlanDetails[ppKey]["due"].unshift(Number(programPlanPendingAmount[ppKey]) + Number(paidAmount))
      } else {
        programPlanDetails[ppKey]["pending"].push(0)
        programPlanDetails[ppKey]["due"].push(0)
      }

    }
  }
  for (let pendingAmountindex = 0; pendingAmountindex < Object.keys(pendingAmountStudentDetails).length; pendingAmountindex++) {
    let pendingAmount = pendingAmountStudentDetails[Object.keys(pendingAmountStudentDetails)[pendingAmountindex]]
    totalPendingAmt += Number(pendingAmount)

  }
  //Total Refund Amount
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
  const refundReport = await transactionModel.aggregate(aggregateRefund);

  // Mothwise data
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
  // console.log('iterateData', iterateData)
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
      // console.log('weeknumber', weeknumber)
      // lastWeekDay = moment().subtract(
      //   (weeknumber - 1) * (6 + (weeknumber == 1 ? 0 : 1)),
      //   "day"
      // );
      lastWeekDay = moment().subtract(((index + 1) * 6), "day");
      firstWeekDay = moment(lastWeekDay).subtract(6, "day");

      fromWeek = new Date(firstWeekDay.format("MM-DD-YYYY"));
      toWeek = new Date(lastWeekDay.format("MM-DD-YYYY"));
      fromWeek = moment(fromWeek).tz(timeZone);
      toWeek = moment(toWeek).tz(timeZone).endOf("day").toString();
      toWeek = moment(toWeek).tz(timeZone);
      fromDateValue = fromWeek;
      toDateValue = toWeek;
    }
    fromDateValue = momentTimeZone(fromDateValue).tz(timeZone);
    toDateValue = momentTimeZone(toDateValue).tz(timeZone);
    // console.log('from and to date', new Date(fromDateValue), new Date(toDateValue))
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
          foreignField: "transactionDisplayName",
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
          paidAmount: { $slice: ["$feesLedgers.paidAmount", -1] },
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
                    paidAmount: "$$sen.paidAmount",
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
          paidAmount: { $arrayElemAt: ["$paidAmount", 0] },
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
    // console.log('aggregatedMonthReport', aggregatedMonthReport)
    if (aggregatedMonthReport.length > 0) {
      // for (let ai = 0; ai < aggregatedMonthReport.length; ai++) {
      //   const mrki = aggregatedMonthReport[ai];
      //   totalMonthDueAmt =
      //     Number(totalMonthDueAmt) +
      //     (mrki.amount != null ? Number(mrki.amount) : 0);
      //   totalMonthPaidAmt =
      //     Number(totalMonthPaidAmt) +
      //     (mrki.paidAmount != null ? Number(mrki.paidAmount) : 0);
      //   totalMonthPendingAmt =
      //     Number(totalMonthPendingAmt) +
      //     (mrki.pendingAmount != null
      //       ? Number(mrki.pendingAmount)
      //       : mrki.pendingAmount == null
      //         ? mrki.amount
      //         : 0);
      // }
      for (let ai = 0; ai < aggregatedMonthReport.length; ai++) {
        const mrki = aggregatedMonthReport[ai];
        totalMonthDueAmt =
          Number(totalMonthDueAmt) +
          (mrki.amount != null ? Number(mrki.pendingAmount) : 0);
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
  //Application Schema
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
  for (let monthReportsIndex = 0; monthReportsIndex < monthReports['paidAmount'].length; monthReportsIndex++) {
    if (monthReports['paidAmount'][monthReportsIndex] > 0) {
      monthReports['dueAmount'][monthReportsIndex] = 0
      monthReports['pendingAmount'][monthReportsIndex] = Number((Object.values(feeBasedReport)).reduce((a, b) => a + b, 0)) - Number(monthReports['paidAmount'][monthReportsIndex])
    } else {
      monthReports['pendingAmount'][monthReportsIndex] = 0
      monthReports['dueAmount'][monthReportsIndex] = 0
    }

  }
  dbConnection.close();
  res.status(200).send({
    status: "success",
    data: {
      totalStudents: studentFeeReport.length,
      // feeDetails: fbDetails,
      totalDemandAmount: Number((Object.values(feeBasedReport)).reduce((a, b) => a + b, 0)),
      totalFeeCollected: totalPaidAmt,
      totalPendingAmount: Number((Object.values(feeBasedReport)).reduce((a, b) => a + b, 0)) - Number(totalPendingAmt),
      totalRefundAmount: refundReport.length > 0 ? refundReport["0"]["totalRefundAmount"] : 0,
      feeAmount: {
        // ...fbTotalDetails
        ...feeBasedReport,
      },
      programPlanData: { ...programPlanDetails },
      monthReports: monthReports,
      totalApplication:
        Number(domesticApp["appCount"]) + Number(internationalApp["appCount"]),
      totalDomesticApplication: domesticApp["appCount"],
      totalInternationalApplication: internationalApp["appCount"],
      totalAppFeeINR: domesticApp["total"],
      totalAppFeeUSD: internationalApp["total"],
      campusStudentCount: studwiseCmpData,
      feePendingCmpDetails: feePendingCmpDetails,
      studentsTotalPaidPend: totalFessPaidPend
    },
  });
}

module.exports = {
  getDashboardData: getDashboardData,
};
