const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const campusSchema = require("../models/campusModel");
const ApplicationSchema = require("../models/ken42/applicationModel");
const transactionCollectionName = "transactions";
const transactionsSchema = require("../models/transactionsModel");
var momentTimeZone = require("moment-timezone");
var moment = require("moment");
const timeZone = "Asia/Calcutta|Asia/Kolkata";
momentTimeZone.tz.link("Asia/Calcutta|Asia/Kolkata");
momentTimeZone.tz.setDefault("Asia/Calcutta|Asia/Kolkata");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../models/orglists-schema");
const { convertToCurrency } = require("../controllers/reports-revamp/reports-support");

// (1) DASHBOARD NEW CONTROLLER
module.exports.getDashboardNewDetails = async (req, res) => {
  const { orgId, type, campus } = req.query;
  let dbConnection;
  let centralDbConnection;
  centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
  const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
  dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

  try {
    let campusModel = dbConnection.model("campuses", campusSchema);
    let studentFeePlans = dbConnection.model("studentfeeplans", allSchema);
    let transactionsModel = dbConnection.model("transactions", allSchema);
    const transactionModel = dbConnection.model(transactionCollectionName, transactionsSchema, transactionCollectionName);
    var programPlanModel = dbConnection.model("programplans", allSchema);
    var getCampusWisePaidPend = [];
    var totalStudentCount = 0;
    var totalPlannedAmnt = 0;
    var totalPaidAmnt = 0;
    var totalPendAmnt = 0;
    var getCampusWiseList = [];
    var totalFessPaidPend = {};
    var getCampusWiseAmount = [];
    var totalPendAggr = [
      {
        $lookup: {
          from: "students",
          localField: "studentRegId",
          foreignField: "regId",
          as: "students",
        },
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
    var monthwiseReports = {};
    var getTimelineDate = [];
    var calcNewPgmData = await calculateProgramPlan();
    var getModeWisePayment = await calcModeWiseData();
    var getInstAndTerms = await getInstWiseData();
    var getFeeTypeData = await getFeeTypeVal();
    var getRefundData = await getRefund();
    var getCategoryData = await categoryData();
    await campusModel.find({}, async (error, results) => {
      totalStudentCount = await studentFeePlans.countDocuments();
      await studentFeePlans.find({ paidAmount: 0 }, (error, feePlanRes) => {
        totalFessPaidPend.totalPaidStudents = totalStudentCount - feePlanRes.length;
        totalFessPaidPend.totalPendingStudents = feePlanRes.length;
      });
      for (let i = 0; i < results.length; i++) {
        let getLocalData = {};
        let studentsModelOne = await dbConnection.model("studentfeeplans", allSchema);
        getLocalData.campusName = `${results[i].displayName}`;
        getLocalData.studentCount = await studentsModelOne.countDocuments({ campusId: String(results[i]._id) });
        getCampusWiseList.push(getLocalData);
        let getListData = await paidPendStudList(String(results[i]._id), `${results[i].displayName}`, `${results[i]._doc.legalName}`);
        getCampusWisePaidPend.push(getListData);
        let getLocalCmpAmnt = {};
        getLocalCmpAmnt.campusName = `${results[i].displayName}`;
        const plannedAggValue = [
          {
            $match: {
              campusId: String(results[i]._id),
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentRegId",
              foreignField: "regId",
              as: "students",
            },
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
        const paidAggValue = [
          {
            $match: {
              campusId: String(results[i]._id),
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
        const pendingAggValue = [
          {
            $match: {
              campusId: String(results[i]._id),
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentRegId",
              foreignField: "regId",
              as: "students",
            },
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
        var getPlannedAmount = await studentFeePlans.aggregate(plannedAggValue);
        var getPaidAmount = await studentFeePlans.aggregate(paidAggValue);
        var getPendingAmount = await studentFeePlans.aggregate(pendingAggValue);
        if (getPlannedAmount.length > 0) {
          getLocalCmpAmnt.totalPlannedAmount = await convertToCurrency(getPlannedAmount[0].total);
        }
        if (getPaidAmount.length > 0) {
          getLocalCmpAmnt.totalPaidAmount = await convertToCurrency(getPaidAmount[0].total);
        }
        if (getPendingAmount.length > 0) {
          getLocalCmpAmnt.totalPendingAmount = await convertToCurrency(getPendingAmount[0].total);
        }
        getCampusWiseAmount.push(getLocalCmpAmnt);
      }
      var totalPlannedAggregation = [
        {
          $lookup: {
            from: "students",
            localField: "studentRegId",
            foreignField: "regId",
            as: "students",
          },
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
            _id: "",
            plannedAmount: { $sum: "$plannedAmount" },
          },
        },
        {
          $project: {
            _id: 0,
            total: "$plannedAmount",
          },
        }
      ];
      totalPlannedAmnt = await studentFeePlans.aggregate(totalPlannedAggregation);
      var totalPaidAggregation = [
        {
          $match: {
            transactionSubType: "feePayment",
            status: { $not: { $eq: String("Cancelled") } }
          }
        },
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
        }
      ];
      totalPaidAmnt = await transactionsModel.aggregate(totalPaidAggregation);
      var totalPendingAggregation = [
        {
          $lookup: {
            from: "students",
            localField: "studentRegId",
            foreignField: "regId",
            as: "students",
          },
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
            _id: "",
            pendingAmount: { $sum: "$pendingAmount" },
          },
        },
        {
          $project: {
            _id: 0,
            total: "$pendingAmount",
          },
        }
      ];
      totalPendAmnt = await studentFeePlans.aggregate(totalPendingAggregation);
      // Total Application section (Domestic, International)
      var today = new Date();
      var fromDate, toDate;
      var monthStart = moment().startOf("month").format("YYYY-MM-DD");
      var monthEnd = moment().endOf("month").format("YYYY-MM-DD");
      var d = new Date();
      var months = [];
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      var days = [];
      for (let monthIndex = 0; monthIndex < 6; monthIndex++) {
        months.push({
          label: `${monthNames[Number(moment().subtract(monthIndex, "months").format("MM")) - 1]} ${moment().subtract(monthIndex, "months").format("YYYY")}`,
          month: Number(moment().subtract(monthIndex, "months").format("MM")) - 1,
          year: moment().subtract(monthIndex, "months").format("YYYY"),
        });
      }
      for (let dayIndex = 0; dayIndex < dayNames.length; dayIndex++) {
        days.push({
          label: String(moment().subtract(dayIndex, "day").startOf("day").toString()).substr(0, 3),
          day: dayIndex,
        });
      }
      if (String(type).toLowerCase() == "ytd") {
        fromDate = moment().subtract(1, "year").startOf("day").toString();
        toDate = moment().endOf("day").toString();
      }
      else if (String(type).toLowerCase() == "mtd") {
        fromDate = moment().subtract(1, "month").startOf("day").toString();
        toDate = moment().add(1, "days").endOf("day").toString();
      }
      else if (String(type).toLowerCase() == "wtd") {
        fromDate = moment().subtract(1, "week").startOf("day").toString();
        toDate = moment().endOf("day").toString();
      }
      fromDate = momentTimeZone(fromDate).tz(timeZone);
      toDate = momentTimeZone(toDate).tz(timeZone);
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
      const applicationINRDetails = await applicationModel.aggregate(aggregateAppINR);
      const applicationUSDDetails = await applicationModel.aggregate(aggregateAppUSD);
      let domesticApp = {
        appCount: applicationINRDetails["0"] != undefined ? applicationINRDetails["0"]["appCount"] : 0,
        total: applicationINRDetails["0"] != undefined ? applicationINRDetails["0"]["total"] : 0,
      };
      let internationalApp = {
        appCount: applicationUSDDetails["0"] != undefined ? applicationUSDDetails["0"]["appCount"] : 0,
        total: applicationUSDDetails["0"] != undefined ? applicationUSDDetails["0"]["total"] : 0,
      };
      if (type == "WTD") {
        var calculateTotalPend = await studentFeePlans.aggregate(totalPendAggr);
        var referTotalPend = calculateTotalPend.length !== 0 ? calculateTotalPend[0].total : 0;
        var date = new Date();
        var nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 1);
        var dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var weekLables = [];
        var allDateList = [];
        var totalMonthPaid = [];
        var dummyDateRec = [];
        allDateList.push(await dbChangeDateFormat(new Date()));
        allDateList.push(await dbChangeDateFormat(nextDate));
        for (let i = 0; i < 6; i++) {
          allDateList.unshift(await dbChangeDateFormat(new Date(date.setDate(date.getDate() - 1))));
        }
        for (let y = 0; y < allDateList.length - 1; y++) {
          // weekLables.unshift(dayName[new Date(allDateList[y]).getDay()]);
          let getDateFormat = await weekLableFormat(new Date(allDateList[y]));
          weekLables.unshift(getDateFormat);
          dummyDateRec.push({
            from: new Date(allDateList[y]).toLocaleDateString(),
            day: dayName[new Date(allDateList[y]).getDay()],
          });
          var calcTotal = await getMonthPaidAmnt(new Date(allDateList[y]), new Date(allDateList[y + 1]));
          totalMonthPaid.unshift(calcTotal.length !== 0 ? calcTotal[0].total : 0);
        }
        var getProperResp = await arrangeTimeLineData(weekLables, totalMonthPaid, Number(referTotalPend), "WTD");
        monthwiseReports = getProperResp;
        getTimelineDate = dummyDateRec;
      }
      else if (type === "MTD") {
        var calculateTotalPend = await studentFeePlans.aggregate(totalPendAggr);
        var referTotalPend = calculateTotalPend.length !== 0 ? calculateTotalPend[0].total : 0;
        var weekLables = ["Week 5", "Week 4", "Week 3", "Week 2", "Week 1"];
        var date = new Date();
        var dummyDateRec = [];
        var firstDay = await changeDateFormat(new Date(date.getFullYear(), date.getMonth(), 1));
        var lastDay = await changeDateFormat(new Date(date.getFullYear(), date.getMonth() + 1, 0));
        var getAllDate = await generateDateList(firstDay, lastDay);
        var totalMonthPaid = [];
        for (let i = 0; i < 5; i++) {
          var lastDateCalc = new Date(lastDay);
          var addOneDate = lastDateCalc.setDate(lastDateCalc.getDate() + 1);
          if (i == 4) {
            var calcAmnt = await getMonthPaidAmnt(new Date(getAllDate[i]), new Date(addOneDate));
            dummyDateRec.push({
              from: new Date(getAllDate[i]).toLocaleDateString(),
              to: new Date(lastDay).toLocaleDateString(),
            });
          }
          else {
            var calcAmnt = await getMonthPaidAmnt(new Date(getAllDate[i]), new Date(getAllDate[i + 1]));
            var calcDate = new Date(new Date(getAllDate[i + 1]).toLocaleDateString());
            var newCalc = calcDate.setDate(calcDate.getDate() - 1);
            dummyDateRec.push({
              from: new Date(getAllDate[i]).toLocaleDateString(),
              to: new Date(newCalc).toLocaleDateString(),
            });
          }
          totalMonthPaid.unshift(calcAmnt.length !== 0 ? calcAmnt[0].total : 0);
        }
        var getProperResp = await arrangeTimeLineData(weekLables, totalMonthPaid, Number(referTotalPend), "MTD");
        monthwiseReports = getProperResp;
        getTimelineDate = dummyDateRec;
      }
      else if (type === "YTD") {
        var today = new Date();
        var d;
        var monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var yearLables = [];
        var totalMonthPaid = [];
        var calculateTotalPend = await studentFeePlans.aggregate(totalPendAggr);
        var referTotalPend = calculateTotalPend.length !== 0 ? calculateTotalPend[0].total : 0;
        var dummyDateRec = [];
        for (var i = 0; i < 6; i++) {
          d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          var firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
          var lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          var getNewLast = new Date(lastDay);
          var convertNewLast = getNewLast.setDate(getNewLast.getDate() + 1);
          var getTotalVal = await getMonthPaidAmnt(new Date(firstDay), new Date(convertNewLast));
          yearLables.push(`${monthName[lastDay.getMonth()]} ${lastDay.getFullYear()}`);

          dummyDateRec.unshift({
            from: new Date(firstDay).toLocaleDateString(),
            to: new Date(lastDay).toLocaleDateString(),
          });
          totalMonthPaid.push(getTotalVal.length !== 0 ? getTotalVal[0].total : 0);
        }
        var getProperResp = await arrangeTimeLineData(yearLables, totalMonthPaid, Number(referTotalPend), "YTD");
        monthwiseReports = getProperResp;
        getTimelineDate = dummyDateRec;
      }
      res.status(200).send({
        status: "success",
        data: {
          campusPaidPend: getCampusWisePaidPend,
          totalStudents: totalStudentCount,
          totalPlannedAmount: await convertToCurrency(totalPlannedAmnt.length > 0 ? totalPlannedAmnt[0].total : 0),
          totalPendingAmount: await convertToCurrency(totalPendAmnt.length != 0 ? totalPendAmnt[0].total : 0),
          totalPaidAmount: await convertToCurrency(totalPaidAmnt.length > 0 ? Number(totalPaidAmnt[0].total) : 0),
          totalApplication: Number(domesticApp["appCount"]) + Number(internationalApp["appCount"]),
          totalDomesticApplication: domesticApp["appCount"],
          totalInternationalApplication: internationalApp["appCount"],
          totalAppFeeINR: domesticApp["total"],
          totalAppFeeUSD: internationalApp["total"],
          campusStudentList: getCampusWiseList,
          campusWiseAmount: getCampusWiseAmount,
          studentPaidPendingCount: totalFessPaidPend,
          programPlanwiseData: calcNewPgmData,
          monthlyReports: monthwiseReports,
          modeOfPayment: getModeWisePayment,
          InstallmentTerms: getInstAndTerms,
          feeTypes: getFeeTypeData,
          categoryDetails: getCategoryData,
          refundDetails: getRefundData,
          timeLineDateSplit: getTimelineDate,
        },
      });
      centralDbConnection.close() // new
      dbConnection.close() // new
    });
    async function paidPendStudList(cmpsId, cmpName, dispName) {
      let dummyObj = {};
      var feePlanModel = await dbConnection.model("studentfeeplans", allSchema);
      var calculteCmpList = await feePlanModel.countDocuments({ campusId: String(cmpsId) });
      var PendListAggr = [
        {
          $match: {
            campusId: String(cmpsId),
            paidAmount: 0,
            // pendingAmount: { $not: { $eq: Number(0) } }
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "studentRegId",
            foreignField: "regId",
            as: "students",
          },
        },
        {
          $unwind: "$students",
        },
        {
          $match: {
            "students.status": 1
          }
        }
      ];
      var getPendingCount = await studentFeePlans.aggregate(PendListAggr);
      var paidAggrNew = [
        {
          $match: {
            campusId: String(cmpsId),
            paidAmount: { $gt: Number(0) },
          },
        },
      ];
      var getNewPaidAggr = await studentFeePlans.aggregate(paidAggrNew);
      dummyObj.campusName = cmpName == "undefined" ? dispName : cmpName;
      dummyObj.totalStudents = await calculteCmpList;
      dummyObj.paidStudents = await getNewPaidAggr.length;
      dummyObj.pendingStudents = await getPendingCount.length;
      return dummyObj;
    }
    async function getMonthPaidAmnt(day1, day2) {
      let transactionPaidAmnt = [
        {
          $match: {
            transactionSubType: "feePayment",
            createdAt: { $gte: day1, $lte: day2 },
            status: { $not: { $eq: String("Cancelled") } }
          },
        },
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
      var getTotalVal = await transactionModel.aggregate(transactionPaidAmnt);
      return getTotalVal;
    }
    async function generateDateList(from, to) {
      var getDate = function (date) {
        var m = date.getMonth(), d = date.getDate();
        return (date.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (d < 10 ? "0" + d : d));
      };
      var fs = from.split("-"), startDate = new Date(fs[0], fs[1], fs[2]), start = startDate.getTime(), ts, end, es = to.split("-"), endDate = new Date(es[0], es[1], es[2]);
      var result = [];
      result.push(new Date(getDate(startDate)));
      if (typeof to == "undefined") {
        end = new Date().getTime();
      }
      else {
        ts = to.split("-");
        end = new Date(ts[0], ts[1], ts[2]).getTime();
      }
      while (start < end) {
        start += 86400000;
        startDate.setTime(start);
        if (new Date(getDate(startDate)).getDay() == 1) {
          result.push(new Date(getDate(startDate)));
        }
      }
      result.push(new Date(getDate(endDate)));
      return result;
    }
    async function changeDateFormat(ev) {
      if (ev === undefined || ev === "") { }
      else {
        let getDate = `${String(ev.getDate()).length == 1 ? `0${ev.getDate()}` : ev.getDate()}`;
        let getMonth = `${ev.getMonth() + 1}`;
        let getYear = `${ev.getFullYear()}`;
        let today = `${getYear}-${getMonth}-${getDate}`;
        return today;
      }
    }
    async function dbChangeDateFormat(ev) {
      if (ev === undefined || ev === "") { }
      else {
        let getDate = `${String(ev.getDate()).length == 1 ? `0${ev.getDate()}` : ev.getDate()}`;
        let getMonth = `${String(ev.getMonth() + 1).length == 1 ? `0${ev.getMonth() + 1}` : ev.getMonth() + 1}`;
        let getYear = `${ev.getFullYear()}`;
        let today = `${getYear}-${getMonth}-${getDate}`;
        return today;
      }
    }
    async function weekLableFormat(ev) {
      let monthFormat = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (ev === undefined || ev === "") { }
      else {
        let getDate = `${String(ev.getDate()).length == 1 ? `0${ev.getDate()}` : ev.getDate()}`;
        let getMonth = Number(ev.getMonth());
        let getYear = `${ev.getFullYear()}`.slice(2);
        return `${getDate}-${monthFormat[getMonth]}-${getYear}`;
      }
    }
    async function arrangeTimeLineData(weekLabel, dummyArr, totalPend, fnType) {
      var dummyPendStore = 0;
      var dummyPlanStore = 0;
      var timeLineWiseData = {
        weekLabels: [],
        paidAmount: [],
        dueAmount: [],
        pendingAmount: [],
      };
      if (fnType.toLowerCase() == "mtd" || fnType.toLowerCase() == "ytd" || fnType.toLowerCase() == "wtd") {
        for (let i = 0; i < dummyArr.length; i++) {
          if (i == 0) {
            timeLineWiseData.weekLabels.unshift(weekLabel[i]);
            timeLineWiseData.paidAmount.unshift(await convertToCurrency(Number(dummyArr[i])));
            timeLineWiseData.dueAmount.unshift(await convertToCurrency(Number(dummyArr[i]) == 0 ? 0 : Number(totalPend) + Number(dummyArr[i])));
            timeLineWiseData.pendingAmount.unshift(await convertToCurrency(Number(dummyArr[i]) == 0 ? 0 : Number(totalPend)));
            dummyPendStore = Number(totalPend);
            dummyPlanStore = Number(totalPend) + Number(dummyArr[i]);
          }
          else {
            timeLineWiseData.weekLabels.unshift(weekLabel[i]);
            timeLineWiseData.paidAmount.unshift(await convertToCurrency(Number(dummyArr[i])));
            timeLineWiseData.dueAmount.unshift(await convertToCurrency(Number(dummyArr[i]) == 0 ? 0 : Number(dummyPlanStore) + Number(dummyArr[i])));
            timeLineWiseData.pendingAmount.unshift(await convertToCurrency(Number(dummyArr[i]) == 0 ? 0 : Number(dummyPlanStore)));
            dummyPendStore = Number(dummyPlanStore);
            dummyPlanStore = Number(dummyPendStore) + Number(dummyArr[i]);
          }
        }
        return timeLineWiseData;
      }
      else {
        for (let i = 0; i < dummyArr.length; i++) {
          if (i == 0) {
            timeLineWiseData.weekLabels.unshift(weekLabel[i]);
            timeLineWiseData.paidAmount.unshift(await convertToCurrency(Number(dummyArr[i])));
            timeLineWiseData.dueAmount.unshift(await convertToCurrency(Number(dummyArr[i]) == 0 ? 0 : Number(totalPend) + Number(dummyArr[i])));
            timeLineWiseData.pendingAmount.unshift(await convertToCurrency(Number(dummyArr[i]) == 0 ? 0 : Number(totalPend)));
            dummyPendStore = Number(totalPend);
            dummyPlanStore = Number(totalPend) + Number(dummyArr[i]);
          }
          else {
            timeLineWiseData.weekLabels.unshift(weekLabel[i]);
            timeLineWiseData.paidAmount.unshift(await convertToCurrency(Number(dummyArr[i])));
            timeLineWiseData.dueAmount.unshift(await convertToCurrency(Number(dummyArr[i]) == 0 ? 0 : Number(dummyArr[i]) == 0 ? Number(dummyPlanStore) : Number(dummyPendStore) + Number(dummyArr[i])));
            timeLineWiseData.pendingAmount.unshift(await convertToCurrency(Number(dummyArr[i]) == 0 ? 0 : Number(dummyPlanStore)));
            dummyPendStore = Number(dummyPlanStore);
            dummyPlanStore = Number(dummyPendStore) + Number(dummyArr[i]);
          }
        }
        return timeLineWiseData;
      }
    }
    async function calculateProgramPlan() {
      var transactNewAggr = {};
      let pgmNewAggr = {};
      if (campus !== undefined && campus !== null && campus !== "") {
        pgmNewAggr.campusId = campus;
      }
      pgmNewAggr.status = 1;
      let endYear = new Date().getFullYear() + 1;
      let startYear = new Date().getFullYear();
      academicYear = startYear + "-" + endYear.toString().substr(endYear.toString().length - 2, 2);
      let pgmAggr = [
        {
          $match: pgmNewAggr,
        },
        {
          $lookup: {
            from: "studentfeesmaps",
            localField: "_id",
            foreignField: "programPlanId",
            as: "feeMapData",
          },
        },
        {
          $group: {
            _id: 0,
            data: {
              $push: {
                _id: "$_id",
                programPlanName: "$title",
                academicYear: "$academicYear",
                plannedAmnt: { $sum: "$feeMapData.amount" },
                pendingAmt: { $sum: "$feeMapData.pending" },
                totalStudents: { $size: "$feeMapData" },
                campusId: "$campusId",
                dashboardName: "$dashboardName",
                paidAmt: 0,
              },
            },
          },
        },
        {
          $project: {
            data: "$data",
          },
        },
      ];
      var getPgmData = await programPlanModel.aggregate(pgmAggr);
      if (getPgmData.length !== 0) {
        transactNewAggr.transactionSubType = "feePayment";
        transactNewAggr.status = { $not: { $eq: String("Cancelled") } }
        var totalAmnt = 0;
        for (let i = 0; i < getPgmData[0].data.length; i++) {
          transactNewAggr.programPlan = getPgmData[0].data[i]._id;
          getPgmData[0].data[i].plannedAmnt = await convertToCurrency(getPgmData[0].data[i].plannedAmnt);
          getPgmData[0].data[i].pendingAmt = await convertToCurrency(getPgmData[0].data[i].pendingAmt);
          let txnCalcAggr = [
            {
              $match: transactNewAggr,
            },
            {
              $group: {
                _id: 0,
                data: { $sum: "$amount" },
              },
            },
            {
              $project: {
                data: "$data",
              },
            },
          ];
          var getTransactTotal = await transactionModel.aggregate(txnCalcAggr);
          getPgmData[0].data[i].paidAmt = await convertToCurrency(Number(getTransactTotal.length != 0 ? getTransactTotal[0].data : 0));
          totalAmnt = Number(totalAmnt) + Number(getTransactTotal.length != 0 ? getTransactTotal[0].data : 0);
        }
        let groupedData = getPgmData[0].data.reduce((acc, obj) => {
          var existItem = acc.find(item => String(item.dashboardName == "" ? item.programPlanName : item.dashboardName) === String(obj.dashboardName == "" ? obj.programPlanName : obj.dashboardName));
          if (existItem) {
            existItem.paidAmt += obj.paidAmt;
            return acc;
          }
          acc.push(obj);
          return acc;
        }, []);
        return groupedData;
      }
      else {
        return []
      }
    }
    async function calcModeWiseData() {
      var methodNames = ["cash", "cheque", "card", "netbanking", "wallet", "upi", "NEFT"];
      var methodColorCodes = ["#00AF50", "#CC6601", "#01B0F1", "#0071C1", "#4AACC5", "#CB3398", "#9933FF"];
      var modeAggr = {};
      var modeWiseData = [];
      for (let i = 0; i < methodNames.length; i++) {
        modeAggr["data.method"] = methodNames[i];
        modeAggr.transactionSubType = "feePayment";
        modeAggr.status = { $not: { $eq: String("Cancelled") } }
        let getModeAmount = await transactionModel.aggregate([
          {
            $match: modeAggr,
          },
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
        ]);
        modeWiseData.push({
          name: methodNames[i] == "NEFT" ? "Loans" : methodNames[i],
          total: await convertToCurrency(getModeAmount.length != 0 ? getModeAmount[0].total : 0),
          color: methodColorCodes[i],
        });
      }
      return modeWiseData;
    }
    async function getInstWiseData() {
      let studentFeesInstModel = dbConnection.model("studentfeeinstallmentplans", allSchema);
      let collectData = [];
      for (let i = 1; i < 6; i++) {
        let insGetAggr = [
          {
            $match: {
              label: `Installment00${i}`,
            },
          },
          {
            $group: {
              _id: 0,
              totalPlanned: { $sum: "$plannedAmount" },
              totalPaid: { $sum: "$paidAmount" },
              totalPending: { $sum: "$pendingAmount" },
              totalPercentage: { $first: "$percentage" },
            },
          },
          {
            $project: {
              _id: 0,
              title: `${i <= 2 ? "Term 1 -" : "Term 2 -"} Installment ${i}`,
              totalPlanned: "$totalPlanned",
              totalPaid: "$totalPaid",
              totalPending: "$totalPending",
              totalPercentage: "$totalPercentage",
            },
          },
        ];
        var connectInst = await studentFeesInstModel.aggregate(insGetAggr);
        if (connectInst.length != 0) {
          collectData.push({
            title: connectInst[0].title,
            totalPlanned: await convertToCurrency(connectInst[0].totalPlanned),
            totalPaid: await convertToCurrency(connectInst[0].totalPaid),
            totalPending: await convertToCurrency(connectInst[0].totalPending),
            totalPercentage: connectInst[0].totalPercentage,
          });
        }
        else { }
      }
      let totTerm1Aggr = [
        {
          $match: {
            paidAmountBreakup: { $elemMatch: { title: "Term 1 Fees" } },
          },
        },
        { $unwind: "$paidAmountBreakup" },
        { $unwind: "$pendingAmountBreakup" },
        { $unwind: "$plannedAmountBreakup" },
        {
          $group: {
            _id: 0,
            paid: { $sum: "$paidAmountBreakup.amount" },
            pending: { $sum: "$pendingAmountBreakup.amount" },
            plan: { $sum: "$plannedAmountBreakup.amount" },
          },
        },
        {
          $project: {
            totalPaid: "$paid",
            totalPlan: "$plan",
            totalPending: "$pending",
          },
        },
      ];
      var totTerm1Val = await studentFeesInstModel.aggregate(totTerm1Aggr);
      let totTerm2Aggr = [
        {
          $match: {
            paidAmountBreakup: { $elemMatch: { title: "Term 2 Fees" } },
          },
        },
        { $unwind: "$paidAmountBreakup" },
        { $unwind: "$pendingAmountBreakup" },
        { $unwind: "$plannedAmountBreakup" },
        {
          $group: {
            _id: 0,
            paid: { $sum: "$paidAmountBreakup.amount" },
            pending: { $sum: "$pendingAmountBreakup.amount" },
            plan: { $sum: "$plannedAmountBreakup.amount" },
          },
        },
        {
          $project: {
            totalPaid: "$paid",
            totalPlan: "$plan",
            totalPending: "$pending",
          },
        },
      ];
      var totTerm2Val = await studentFeesInstModel.aggregate(totTerm2Aggr);
      if (totTerm1Val.length != 0) {
        collectData.push({
          title: "Term 1 Total",
          totalPlanned: await convertToCurrency(totTerm1Val[0].totalPlan),
          totalPaid: await convertToCurrency(totTerm1Val[0].totalPaid),
          totalPending: await convertToCurrency(totTerm1Val[0].totalPending),
        });
      }
      if (totTerm2Val.length != 0) {
        collectData.push({
          title: "Term 2 Total",
          totalPlanned: await convertToCurrency(totTerm2Val[0].totalPlan),
          totalPaid: await convertToCurrency(totTerm2Val[0].totalPaid),
          totalPending: await convertToCurrency(totTerm2Val[0].totalPending),
        });
      }
      return collectData;
    }
    async function getFeeTypeVal() {
      let feeTypeModel = dbConnection.model("feetypes", allSchema);
      let getAllData = [];
      var feeTypeColorCodes = ["#00AF50", "#CC6601", "#01B0F1", "#0071C1", "#4AACC5", "#CB3398", "#9933FF"];
      await feeTypeModel.find({}, async (ftErr, ftResp) => {
        if (ftResp.length != 0) {
          for (let i = 0; i < ftResp.length; i++) {
            let txnAggr = [
              {
                $match: {
                  transactionSubType: "feePayment",
                  "data.feesBreakUp": {
                    $elemMatch: { feeTypeCode: ftResp[i]._doc.displayName },
                  },
                  status: { $not: { $eq: String("Cancelled") } }
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "data.feesBreakUp.feeTypeCode",
                  foreignField: "displayName",
                  as: "feeTypeData",
                },
              },
              {
                $group: {
                  _id: `${i + 1}`,
                  totalPlanned: { $sum: "$amount" },
                  title: { $first: "$data.feesBreakUp.title" },
                  name: { $first: "$feeTypeData.title" },
                },
              },
              {
                $project: {
                  totalPaid: "$totalPlanned",
                  title: { $first: "$name" },
                  color: feeTypeColorCodes[i],
                },
              },
            ];
            let calcResult = await transactionModel.aggregate(txnAggr);
            if (calcResult.length != 0) {
              getAllData.push({
                totalPaid: await convertToCurrency(calcResult[0].totalPaid),
                title: calcResult[0].title,
                color: calcResult[0].color,
              });
            }
            else { }
          }
        }
      });
      return getAllData;
    }
    async function getRefund() {
      let reAggr = [
        {
          $match: {
            transactionSubType: "refund",
            status: { $not: { $eq: String("Cancelled") } }
          },
        },
        {
          $group: {
            _id: 0,
            totalRefund: { $sum: "$amount" },
            totalRecords: { $sum: 1 },
          },
        },
        {
          $project: {
            totalRefund: "$totalRefund",
            totalStudents: "$totalRecords",
          },
        },
      ];
      let calcAllData = await transactionModel.aggregate(reAggr);
      let convertData = {
        totalRefund: await convertToCurrency(calcAllData.length != 0 ? calcAllData[0].totalRefund : 0),
        totalStudents: calcAllData.length != 0 ? calcAllData[0].totalStudents : 0
      }
      return convertData;
    }
    async function categoryData() {
      let getAllCategory = [];
      let categoryTypes = ["general", "teacher-child", "sibilings", "RTE"];
      var studentsModel = dbConnection.model("students", allSchema);
      for (let i = 0; i < categoryTypes.length; i++) {
        let newCatAggr = [
          {
            $match: {
              category: `${categoryTypes[i]}`,
            },
          },
          {
            $lookup: {
              from: "studentfeeplans",
              localField: "regId",
              foreignField: "studentRegId",
              as: "instaData",
            },
          },
          {
            $group: {
              _id: `${i + 1}`,
              data: { $sum: 1 },
              total: {
                $push: { $sum: "$instaData.paidAmount" },
              },
            },
          },
          {
            $project: {
              totalStudents: "$data",
              totalPaid: { $sum: "$total" },
              title: categoryTypes[i]
            },
          }
        ];
        var calcCateg = await studentsModel.aggregate(newCatAggr);
        if (calcCateg.length != 0) {
          getAllCategory.push({
            totalStudents: calcCateg[0].totalStudents,
            totalPaid: await convertToCurrency(calcCateg[0].totalPaid),
            title: calcCateg[0].title
          });
        }
        else { }
      }
      return getAllCategory;
    }
  }
  catch (err) {
    res.status(200).send({
      status: "failed",
      data: {},
    });
    centralDbConnection.close() // new
    dbConnection.close() // new
  }
  finally { }
};

// API DETAILS
// (1) DASHBOARD NEW CONTROLLER 
// URL: /edu/getDashboard?orgId=5fa8daece3eb1f18d4250e98&type=YTD
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId
//  -- 5fa8daece3eb1f18d4250e98

// 2) type
//  -- WTD|MTD|YTD
