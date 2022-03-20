const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const { dataPagination } = require("./reports-support");
const orgListSchema = require("../../models/orglists-schema");

// (1) FEE PENDING CHART
module.exports.getFeePendingCharts = async (req, res) => {
  const { orgId, campus, fromDate, toDate, programPlan } = req.query;
  let dbConnection;
  let centralDbConnection;
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
  dbConnection = await createDatabase(
    String(orgData._doc._id),
    orgData._doc.connUri
  );
  var transactionModel = dbConnection.model("transactions", allSchema);
  var studentFeePlanModel = dbConnection.model("studentfeeplans", allSchema);
  var studentFeeMapsModel = dbConnection.model("studentfeesmaps", allSchema);
  var campusesModel = dbConnection.model("campuses", allSchema);
  var programPlanModel = dbConnection.model("programplans", allSchema);
  var searchAggr = {};
  var pendAggr = {};
  var colorCodes = ["#FF7655", "#1FBFDE", "#C2AC4D", "#CC0098", "#000000"];
  const diffTime = Math.abs(new Date(fromDate) - new Date(toDate));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  var getTotalRecords = 0;
  var getTotalStudents = 0;
  var totalPendStudents = 0;
  var calcTotalBalance = {
    plan: 0,
    paid: 0,
    pend: 0,
  };
  var campAggr = {};
  var campusWiseDataCollect = [];
  var getTimeLineData = {};
  var referTotalPend = 0;
  var getTotalPaidStudents = 0;
  if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
    var totalPendAggr = [
      {
        $match: {
          campusId: String(campus),
        },
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
    var calculateTotalPend = await studentFeePlanModel.aggregate(totalPendAggr);
    referTotalPend =
      calculateTotalPend.length !== 0 ? calculateTotalPend[0].total : 0;
  }
  if (campus != undefined && String(campus).toLocaleLowerCase() == "all") {
    var totalPendAggr = [
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
    var calculateTotalPend = await studentFeePlanModel.aggregate(totalPendAggr);
    referTotalPend =
      calculateTotalPend.length !== 0 ? calculateTotalPend[0].total : 0;
  }
  var getProgramPlanData = [];
  var newToDate = new Date(toDate);
  newToDate = newToDate.setDate(newToDate.getDate() + 1);
  searchAggr.createdAt = {
    $gte: new Date(fromDate),
    $lte: new Date(newToDate),
  };
  pendAggr.paidAmount = Number(0);
  // pendAggr.pendingAmount = { $not: { $eq: Number(0) } }
  if (
    programPlan != undefined &&
    String(programPlan).toLocaleLowerCase() != "all"
  ) {
    searchAggr.programPlan = mongoose.Types.ObjectId(programPlan);
  }
  if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
    searchAggr.campusId = String(campus);
    pendAggr.campusId = String(campus);
    campAggr.campusId = String(campus);
  }
  try {
    let academicYear = "";
    let endYear = new Date().getFullYear() + 1;
    let startYear = new Date().getFullYear();
    academicYear =
      startYear +
      "-" +
      endYear.toString().substr(endYear.toString().length - 2, 2);
    let pgmAggrNew = {};
    pgmAggrNew.academicYear = String(academicYear);
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
      pgmAggrNew.campusId = String(campus);
    }
    await programPlanModel.find(
      pgmAggrNew,
      async (ppErr, ppResp) => {
        await campusesModel.find({}, async (error, results) => {
          getTotalStudents = await studentFeePlanModel.countDocuments();
          // getTotalRecords = await transactionModel.countDocuments(searchAggr);
          getTotalRecords = await studentFeePlanModel.countDocuments(pendAggr);
          getTotalPaidStudents = await studentFeePlanModel.countDocuments({
            pendingAmount: 0,
          });
          var getTotalPlanAmnt = await studentFeePlanModel.aggregate([
            {
              $match: campAggr,
            },
            {
              $group: {
                _id: "",
                plannedAmount: { $sum: "$plannedAmount" },
                paidAmount: { $sum: "$paidAmount" },
                pendingAmount: { $sum: "$pendingAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                totalPlan: "$plannedAmount",
                totalPaid: "$paidAmount",
                totalpend: "$pendingAmount",
              },
            },
          ]);
          calcTotalBalance.plan =
            getTotalPlanAmnt.length > 0 ? getTotalPlanAmnt[0].totalPlan : 0;
          calcTotalBalance.paid =
            getTotalPlanAmnt.length > 0 ? getTotalPlanAmnt[0].totalPaid : 0;
          calcTotalBalance.pend =
            getTotalPlanAmnt.length > 0 ? getTotalPlanAmnt[0].totalpend : 0;

          if (diffDays >= 0 && diffDays < 7) {
            var getWeekDatas = await getTimeLineCalc(
              "wtd",
              new Date(toDate).toLocaleDateString()
            );
            getTimeLineData = getWeekDatas;
          } else if (diffDays >= 7 && diffDays <= 31) {
            var getMonthDatas = await getTimeLineCalc(
              "mtd",
              new Date().toLocaleDateString()
            );
            getTimeLineData = getMonthDatas;
          } else if (diffDays > 31) {
            var getYearDatas = await getTimeLineCalc(
              "ytd",
              new Date().toLocaleDateString()
            );
            getTimeLineData = getYearDatas;
          }
          var campusSrchAggr = searchAggr;
          var getCampusWisePaidAmnt = [];
          for (let i = 0; i < results.length; i++) {
            campusSrchAggr.campusId = String(results[i]._doc._id);
            var cmpPaidAggr = [
              // {
              //     $match: campusSrchAggr
              // },
              {
                $match: {
                  campusId: String(results[i]._doc._id),
                  transactionSubType: "feePayment",
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
            var getTransactCmpsAmnt = await transactionModel.aggregate(
              cmpPaidAggr
            );
            var getCmpsTotalPlanAmnt = await studentFeePlanModel.aggregate([
              {
                $match: {
                  campusId: String(results[i]._doc._id),
                },
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
            ]);
            getCampusWisePaidAmnt.push({
              plan:
                getCmpsTotalPlanAmnt.length > 0
                  ? getCmpsTotalPlanAmnt[0].total
                  : 0,
              paid:
                getTransactCmpsAmnt.length > 0
                  ? getTransactCmpsAmnt[0].total
                  : 0,
              pend:
                Number(
                  getCmpsTotalPlanAmnt.length > 0
                    ? getCmpsTotalPlanAmnt[0].total
                    : 0
                ) -
                Number(
                  getTransactCmpsAmnt.length > 0
                    ? getTransactCmpsAmnt[0].total
                    : 0
                ),
              campusName: results[i]._doc.displayName,
              campusId: String(results[i]._doc._id),
              color: colorCodes[i],
            });
          }
          if (String(campus).toLocaleLowerCase() == "all") {
            campusWiseDataCollect = getCampusWisePaidAmnt;
          } else {
            campusWiseDataCollect = getCampusWisePaidAmnt.filter(
              (e) => e.campusId == String(campus)
            );
          }
        });
        for (let i = 0; i < ppResp.length; i++) {
          let getDataObj = {};
          let feeMapSrchAggr = {};
          // feeMapSrchAggr.updatedAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
          feeMapSrchAggr.programPlanId = mongoose.Types.ObjectId(
            ppResp[i]._doc._id
          );
          if (
            campus != undefined &&
            String(campus).toLocaleLowerCase() != "all"
          ) {
            feeMapSrchAggr.campusId = String(campus);
          }
          getDataObj._id = ppResp[i]._doc._id;
          getDataObj.programPlanName = ppResp[i]._doc.title;
          getDataObj.academicYear = ppResp[i]._doc.academicYear;
          getDataObj.campusId = ppResp[i]._doc.campusId,
            getDataObj.dashboardName = ppResp[i]._doc.dashboardName
          await studentFeeMapsModel.find(
            feeMapSrchAggr,
            (stFeErr, stFeResp) => {
              getDataObj.totalStudents = stFeResp.length;
              var calcTotalPlan = 0;
              var calcTotalpaid = 0;
              var calcTotalPend = 0;
              var totalPaidStud = 0;
              for (let y = 0; y < stFeResp.length; y++) {
                calcTotalPlan =
                  Number(stFeResp[y]._doc.amount) + Number(calcTotalPlan);
                calcTotalpaid = Number(
                  stFeResp[y]._doc.paid + Number(calcTotalpaid)
                );
                calcTotalPend = Number(
                  stFeResp[y]._doc.pending + Number(calcTotalPend)
                );
                if (stFeResp[y]._doc.paid > 0) {
                  totalPaidStud = Number(totalPaidStud + 1);
                }
              }
              getDataObj.totalpaidStudents = totalPaidStud;
              getDataObj.totalPendingStudents = stFeResp.length - totalPaidStud;
              getDataObj.plannedAmnt = calcTotalPlan;
              getDataObj.paidAmt = calcTotalpaid;
              getDataObj.pendingAmt = calcTotalPend;
            }
          );
          if (
            programPlan != undefined &&
            String(programPlan).toLocaleLowerCase() != "all"
          ) {
            if (String(programPlan) == String(ppResp[i]._doc._id)) {
              getProgramPlanData.push(getDataObj);
            }
          } else {
            getProgramPlanData.push(getDataObj);
          }
        }
        let convertprogramPlan = [];
        if (getProgramPlanData.length != 0) {
          convertprogramPlan = getProgramPlanData.reduce((acc, obj) => {
            var existItem = acc.find(item => String(item.dashboardName == "" ? item.programPlanName : item.dashboardName) === String(obj.dashboardName == "" ? obj.programPlanName : obj.dashboardName));
            if (existItem) {
              existItem.paidAmt += obj.paidAmt;
              return acc;
            }
            acc.push(obj);
            return acc;
          }, []);
        }
        res.send({
          status: "success",
          data: {
            totalRecords: getTotalRecords,
            totalPendingStudents: getTotalRecords,
            totalAmount: calcTotalBalance,
            campusData: campusWiseDataCollect,
            timelineData: getTimeLineData,
            programPlanwiseData: convertprogramPlan,
          },
        });
        centralDbConnection.close()
        dbConnection.close()
      }
    );
    async function getTimeLineCalc(type, clcDate) {
      if (String(type).toLocaleLowerCase() == "wtd") {
        var date = new Date(clcDate);
        var nextDate = new Date(clcDate);
        nextDate.setDate(nextDate.getDate() + 1);
        var dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var weekLables = [];
        var allDateList = [];
        var totalMonthPaid = [];
        var dummyDateRec = [];
        allDateList.push(await dbChangeDateFormat(new Date(clcDate)));
        allDateList.push(await dbChangeDateFormat(nextDate));
        for (let i = 0; i < 6; i++) {
          allDateList.unshift(
            await dbChangeDateFormat(new Date(date.setDate(date.getDate() - 1)))
          );
        }
        for (let y = 0; y < allDateList.length - 1; y++) {
          // weekLables.unshift(`${dayName[new Date(allDateList[y]).getDay()]}-${new Date(allDateList[y]).getDate()}`);
          let getDateFormat = await weekLableFormat(new Date(allDateList[y]));
          weekLables.unshift(getDateFormat);
          dummyDateRec.push({
            from: new Date(allDateList[y]).toLocaleDateString(),
            day: dayName[new Date(allDateList[y]).getDay()],
          });
          var calcTotal = await getMonthPaidAmnt(
            new Date(allDateList[y]),
            new Date(allDateList[y + 1])
          );
          totalMonthPaid.unshift(
            calcTotal.length !== 0 ? calcTotal[0].total : 0
          );
        }
        var getProperResp = await arrangeTimeLineData(
          weekLables,
          totalMonthPaid,
          Number(referTotalPend),
          "WTD"
        );
        return getProperResp;
      } else if (String(type).toLocaleLowerCase() == "mtd") {
        var weekLables = ["Week 5", "Week 4", "Week 3", "Week 2", "Week 1"];
        var date = new Date(clcDate);
        var dummyDateRec = [];
        var firstDay = await changeDateFormat(
          new Date(date.getFullYear(), date.getMonth(), 1)
        );
        var lastDay = await changeDateFormat(
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );
        var getAllDate = await generateDateList(firstDay, lastDay);
        var totalMonthPaid = [];
        for (let i = 0; i < 5; i++) {
          var lastDateCalc = new Date(lastDay);
          var addOneDate = lastDateCalc.setDate(lastDateCalc.getDate() + 1);
          if (i == 4) {
            var calcAmnt = await getMonthPaidAmnt(
              new Date(getAllDate[i]),
              new Date(addOneDate)
            );
            dummyDateRec.push({
              from: new Date(getAllDate[i]).toLocaleDateString(),
              to: new Date(lastDay).toLocaleDateString(),
            });
          } else {
            var calcAmnt = await getMonthPaidAmnt(
              new Date(getAllDate[i]),
              new Date(getAllDate[i + 1])
            );
            var calcDate = new Date(
              new Date(getAllDate[i + 1]).toLocaleDateString()
            );
            var newCalc = calcDate.setDate(calcDate.getDate() - 1);
            dummyDateRec.push({
              from: new Date(getAllDate[i]).toLocaleDateString(),
              to: new Date(newCalc).toLocaleDateString(),
            });
          }
          totalMonthPaid.unshift(calcAmnt.length !== 0 ? calcAmnt[0].total : 0);
        }
        var getProperResp = await arrangeTimeLineData(
          weekLables,
          totalMonthPaid,
          Number(referTotalPend),
          "MTD"
        );
        return getProperResp;
      } else if (String(type).toLocaleLowerCase() == "ytd") {
        var today = new Date(clcDate);
        var d;
        var monthName = [
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
        var yearLables = [];
        var totalMonthPaid = [];
        var dummyDateRec = [];
        for (var i = 0; i < 6; i++) {
          d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          var firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
          var lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          var getNewLast = new Date(lastDay);
          var convertNewLast = getNewLast.setDate(getNewLast.getDate() + 1);
          var getTotalVal = await getMonthPaidAmnt(
            new Date(firstDay),
            new Date(convertNewLast)
          );
          yearLables.push(
            `${monthName[lastDay.getMonth()]} ${lastDay.getFullYear()}`
          );

          dummyDateRec.unshift({
            from: new Date(firstDay).toLocaleDateString(),
            to: new Date(lastDay).toLocaleDateString(),
            // new: new Date(convertNewLast).toLocaleDateString()
          });

          totalMonthPaid.push(
            getTotalVal.length !== 0 ? getTotalVal[0].total : 0
          );
        }
        var getProperResp = await arrangeTimeLineData(
          yearLables,
          totalMonthPaid,
          Number(referTotalPend),
          "YTD"
        );
        return getProperResp;
      }
    }
    async function changeDateFormat(ev) {
      if (ev === undefined || ev === "") {
      } else {
        let getDate = `${String(ev.getDate()).length == 1 ? `0${ev.getDate()}` : ev.getDate()
          }`;
        let getMonth = `${ev.getMonth() + 1}`;
        let getYear = `${ev.getFullYear()}`;
        let today = `${getYear}-${getMonth}-${getDate}`;
        return today;
      }
    }
    async function dbChangeDateFormat(ev) {
      if (ev === undefined || ev === "") {
      } else {
        let getDate = `${String(ev.getDate()).length == 1 ? `0${ev.getDate()}` : ev.getDate()
          }`;
        let getMonth = `${String(ev.getMonth() + 1).length == 1
          ? `0${ev.getMonth() + 1}`
          : ev.getMonth() + 1
          }`;
        let getYear = `${ev.getFullYear()}`;
        let today = `${getYear}-${getMonth}-${getDate}`;
        return today;
      }
    }
    async function getMonthPaidAmnt(day1, day2) {
      var getMatchBlock = {};
      getMatchBlock.transactionSubType = "feePayment";
      getMatchBlock.status = { $not: { $eq: String("Cancelled") } }
      getMatchBlock.createdAt = { $gte: day1, $lte: day2 };
      if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
        getMatchBlock.campusId = String(campus);
      }
      if (
        programPlan != undefined &&
        String(programPlan).toLocaleLowerCase() != "all"
      ) {
        getMatchBlock.programPlan = mongoose.Types.ObjectId(programPlan);
      }
      let transactionPaidAmnt = [
        {
          $match: getMatchBlock,
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
    async function arrangeTimeLineData(weekLabel, dummyArr, totalPend, fnType) {
      var dummyPendStore = 0;
      var dummyPlanStore = 0;
      var timeLineWiseData = {
        weekLabels: [],
        paidAmount: [],
        dueAmount: [],
        pendingAmount: [],
      };
      if (
        fnType.toLowerCase() == "mtd" ||
        fnType.toLowerCase() == "ytd" ||
        fnType.toLowerCase() == "wtd"
      ) {
        for (let i = 0; i < dummyArr.length; i++) {
          if (i == 0) {
            timeLineWiseData.weekLabels.unshift(weekLabel[i]);
            timeLineWiseData.paidAmount.unshift(Number(dummyArr[i]));
            timeLineWiseData.dueAmount.unshift(Number(totalPend));
            timeLineWiseData.pendingAmount.unshift(Number(totalPend));
            dummyPendStore = Number(totalPend);
            dummyPlanStore = Number(totalPend) + Number(dummyArr[i]);
          } else {
            timeLineWiseData.weekLabels.unshift(weekLabel[i]);
            timeLineWiseData.paidAmount.unshift(Number(dummyArr[i]));
            timeLineWiseData.dueAmount.unshift(
              Number(dummyPlanStore) + Number(dummyArr[i])
            );
            timeLineWiseData.pendingAmount.unshift(Number(dummyPlanStore));
            dummyPendStore = Number(dummyPlanStore);
            dummyPlanStore = Number(dummyPendStore) + Number(dummyArr[i]);
          }
        }
        return timeLineWiseData;
      } else {
        for (let i = 0; i < dummyArr.length; i++) {
          if (i == 0) {
            timeLineWiseData.weekLabels.unshift(weekLabel[i]);
            timeLineWiseData.paidAmount.unshift(Number(dummyArr[i]));
            timeLineWiseData.dueAmount.unshift(
              Number(dummyArr[i]) == 0
                ? 0
                : Number(totalPend) + Number(dummyArr[i])
            );
            timeLineWiseData.pendingAmount.unshift(
              Number(dummyArr[i]) == 0 ? 0 : Number(totalPend)
            );
            dummyPendStore = Number(totalPend);
            dummyPlanStore = Number(totalPend) + Number(dummyArr[i]);
          } else {
            timeLineWiseData.weekLabels.unshift(weekLabel[i]);
            timeLineWiseData.paidAmount.unshift(Number(dummyArr[i]));
            timeLineWiseData.dueAmount.unshift(
              Number(dummyArr[i]) == 0
                ? 0
                : Number(dummyArr[i]) == 0
                  ? Number(dummyPlanStore)
                  : Number(dummyPendStore) + Number(dummyArr[i])
            );
            timeLineWiseData.pendingAmount.unshift(
              Number(dummyArr[i]) == 0 ? 0 : Number(dummyPlanStore)
            );
            dummyPendStore = Number(dummyPlanStore);
            dummyPlanStore = Number(dummyPendStore) + Number(dummyArr[i]);
          }
        }
        return timeLineWiseData;
      }
    }
    async function generateDateList(from, to) {
      var getDate = function (date) {
        var m = date.getMonth(),
          d = date.getDate();
        return (
          date.getFullYear() +
          "-" +
          (m < 10 ? "0" + m : m) +
          "-" +
          (d < 10 ? "0" + d : d)
        );
      };
      var fs = from.split("-"),
        startDate = new Date(fs[0], fs[1], fs[2]),
        start = startDate.getTime(),
        ts,
        end,
        es = to.split("-"),
        endDate = new Date(es[0], es[1], es[2]);
      var result = [];
      result.push(new Date(getDate(startDate)));
      if (typeof to == "undefined") {
        end = new Date().getTime();
      } else {
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
    async function weekLableFormat(ev) {
      let monthFormat = [
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
      if (ev === undefined || ev === "") {
      } else {
        let getDate = `${String(ev.getDate()).length == 1 ? `0${ev.getDate()}` : ev.getDate()
          }`;
        let getMonth = Number(ev.getMonth());
        let getYear = `${ev.getFullYear()}`.slice(2);
        return `${getDate}-${monthFormat[getMonth]}-${getYear}`;
      }
    }
  } catch (err) {
    res.send({
      status: "failed",
      data: {},
    });
    centralDbConnection.close()
    dbConnection.close()
  } finally {
    // centralDbConnection.close()
    // dbConnection.close()
  }
};

module.exports.getFeePendingData = async (req, res) => {
  // INPUT QUERY
  const { orgId, campus, page, limit, programPlan, searchKey } = req.query;

  // CONNECTION
  let dbConnection;
  let centralDbConnection;
  centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
  const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
  dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

  // COLLECTIONS
  var studentFeePlanModel = dbConnection.model("studentfeeplans", allSchema);
  var studentsModel = dbConnection.model("students", allSchema);
  var studentFeeInstPlanModel = dbConnection.model("studentfeeinstallmentplans", allSchema);
  var campusesModel = dbConnection.model("campuses", allSchema);
  var programPlanModel = dbConnection.model("programplans", allSchema);

  // DECLARATION
  var studentRegId = [];
  var instPendDetails = [];
  var studentDetails = [];
  var programPlanDetails = [];
  var feePlanDetails = [];
  var getFinalResult = [];
  var finalizedResult = [];
  try {
    var newToDate = new Date();
    newToDate = newToDate.setDate(newToDate.getDate() - 1);
    var srchAggr = {};
    srchAggr.__v = 0;
    await studentsModel.find({}, (stdErr, stdResp) => {
      studentDetails = stdResp;
    })
    await programPlanModel.find({}, (pgmErr, pgmResp) => {
      programPlanDetails = pgmResp
    })
    await studentFeePlanModel.find({}, (feePlnErr, feePlnResp) => {
      feePlanDetails = feePlnResp;
    })
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
      srchAggr.campusId = String(campus);
    }
    var getAllCampusData = await campusesModel.find({});
    await studentFeeInstPlanModel.find(srchAggr, async (error, resp) => {
      if (resp.length == 0) {
        res.send({
          status: "success",
          data: []
        });
        centralDbConnection.close()
        dbConnection.close()
      }
      else {
        for (let i = 0; i < resp.length; i++) {
          if (new Date(resp[i]._doc.dueDate) < new Date()) {
            studentRegId.push(resp[i]._doc.studentRegId);
            instPendDetails.push({
              regId: resp[i]._doc.studentRegId,
              installment: resp[i]._doc.label,
              dueDate: resp[i]._doc.dueDate,
              totalAmount: resp[i]._doc.totalAmount,
              InstPlan: resp[i]._doc.plannedAmount,
              instPaid: resp[i]._doc.paidAmount,
              instPend: resp[i]._doc.pendingAmount,
              campusId: resp[i]._doc.campusId
            })
          }
          else { }
        }
        let findUnique = [...new Set(studentRegId)];
        var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        var sortUnique = findUnique.sort(collator.compare);
        for (let i = 0; i < sortUnique.length; i++) {
          if (findUnique[i] != undefined) {
            let dummyObj = {}; let instTot = 0; let instPaid = 0; let instPend = 0;
            dummyObj.instPendDetails = [];
            let getPendDetails = instPendDetails.filter(o => String(o.regId) == String(sortUnique[i]));
            let getstudDetails = studentDetails.find(o => String(o._doc.regId) == String(sortUnique[i]));
            let programDetails = programPlanDetails.find(o => String(getstudDetails == undefined ? "" : getstudDetails._doc.programPlanId) == String(o._doc._id));
            let getfeePlanDetails = feePlanDetails.find(o => String(o._doc.studentRegId) == String(sortUnique[i]));
            let findCampusDetails = getAllCampusData.find(o => String(o._doc._id) == String(getstudDetails == undefined ? "" : getstudDetails._doc.campusId));
            if (Number(i) == 0) {
              console.log(findCampusDetails);
            }
            if (getstudDetails == undefined) {
              dummyObj.studentName = " ";
              dummyObj.displayName = "";
              dummyObj.registerId = findUnique[i];
              dummyObj.studentPhoneNumber = "";
              dummyObj.studentEmail = "";
              dummyObj.parentName = "";
              dummyObj.parentPhoneNumber = "";
              dummyObj.parentEmail = "";
              dummyObj.classBatch = "";
              dummyObj.academicYear = "";
              dummyObj.programPlan = "";
              dummyObj.campusId = "";
              dummyObj.currency = "INR";
              dummyObj.campusName = "";
              dummyObj.totalAmount = 0;
              dummyObj.campusDisplayName = "";
              getPendDetails.map((data, i) => {
                instTot = Number(instTot) + Number(data.InstPlan);
                instPaid = Number(instPaid) + Number(data.instPaid);
                instPend = Number(instPend) + Number(data.instPend);
                dummyObj.instPendDetails.push({
                  title: data.installment,
                  plan: data.InstPlan,
                  paid: data.instPaid,
                  pend: data.instPend,
                  dueDate: new Date(data.dueDate)
                })
              })
              dummyObj.totalFees = instTot;
              dummyObj.paidFees = instPaid;
              dummyObj.pendingFees = instPend;
              dummyObj.plannedAmount = 0;
              dummyObj.paidAmount = 0;
              dummyObj.pendingAmount = 0;
              dummyObj.status = "pending";
              getFinalResult.push(dummyObj);
            }
            else {
              dummyObj.studentName = getstudDetails._doc.firstName + " " + getstudDetails._doc.lastName;
              dummyObj.displayName = getstudDetails._doc.displayName;
              dummyObj.registerId = findUnique[i];
              dummyObj.studentPhoneNumber = getstudDetails._doc.phoneNo;
              dummyObj.studentEmail = getstudDetails._doc.email;
              dummyObj.parentName = getstudDetails._doc.parentName;
              dummyObj.parentPhoneNumber = getstudDetails._doc.parentPhone;
              dummyObj.parentEmail = getstudDetails._doc.parentEmail;
              dummyObj.classBatch = programDetails._doc.title;
              dummyObj.totalAmount = getfeePlanDetails._doc.totalAmount;
              dummyObj.academicYear = programDetails._doc.academicYear;
              dummyObj.programPlan = String(getstudDetails._doc.programPlanId);
              dummyObj.campusId = String(getstudDetails._doc.campusId);
              dummyObj.currency = "INR";
              dummyObj.campusName = String(findCampusDetails._doc.name);
              dummyObj.campusDisplayName = String(findCampusDetails._doc.displayName);
              getPendDetails.map((data, i) => {
                instTot = Number(instTot) + Number(data.InstPlan);
                instPaid = Number(instPaid) + Number(data.instPaid);
                instPend = Number(instPend) + Number(data.instPend);
                dummyObj.instPendDetails.push({
                  title: data.installment,
                  plan: data.InstPlan,
                  paid: data.instPaid,
                  pend: data.instPend,
                  dueDate: new Date(data.dueDate)
                })
              })
              dummyObj.totalFees = instTot;
              dummyObj.paidFees = instPaid;
              dummyObj.pendingFees = instPend;
              dummyObj.plannedAmount = getfeePlanDetails._doc.plannedAmount;
              dummyObj.paidAmount = getfeePlanDetails._doc.paidAmount;
              dummyObj.pendingAmount = getfeePlanDetails._doc.pendingAmount;
              dummyObj.status = "pending";
              getFinalResult.push(dummyObj);
            }
          }
        }
        if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
          let programPlanFilter = getFinalResult.filter(o => String(o.programPlan) == programPlan);
          finalizedResult = programPlanFilter;
        }
        else {
          finalizedResult = getFinalResult;
        }
        let removeZeroDetails = finalizedResult.filter(o => o.pendingFees != 0);
        finalizedResult = removeZeroDetails;
        if (page == undefined || limit == undefined) {
          res.send({
            status: "success",
            totalRecord: finalizedResult.length,
            data: finalizedResult,
            totalPage: null,
            currentPage: Number(page),
            perPage: Number(limit),
            nextPage: null,
          });
          centralDbConnection.close()
          dbConnection.close()
        }
        else {
          if (searchKey != undefined && searchKey != "") {
            let findSearchedData = await findSearchData(finalizedResult, searchKey);
            let convertToPaginate = await dataPagination(findSearchedData, page, limit);
            let calcTotpage = Math.ceil(Number(findSearchedData.length) / Number(limit));
            res.send({
              status: "success",
              totalRecord: findSearchedData.length,
              data: convertToPaginate,
              totalPage: calcTotpage,
              currentPage: Number(page),
              perPage: Number(limit),
              nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null,
            });
            centralDbConnection.close()
            dbConnection.close()
          }
          else {
            let convertToPaginate = await dataPagination(finalizedResult, page, limit);
            let calcTotpage = Math.ceil(Number(finalizedResult.length) / Number(limit));
            res.send({
              status: "success",
              totalRecord: finalizedResult.length,
              data: convertToPaginate,
              totalPage: calcTotpage,
              currentPage: Number(page),
              perPage: Number(limit),
              nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null,
            });
            centralDbConnection.close()
            dbConnection.close()
          }
        }
      }
    })
    async function findSearchData(data, srchVal) {
      let searchedVal = [];
      if (data.length == 0) {
      } else {
        data.map((dataOne, i) => {
          if (
            String(dataOne.studentName)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.displayName)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.registerId)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.studentPhoneNumber)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.parentName)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.parentPhoneNumber)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.parentEmail)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.totalFees)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.paidFees)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.pendingFees)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.fineAmount)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.status)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.classBatch)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.academicYear)
              .toLowerCase()
              .includes(String(srchVal).toLowerCase()) == true
          ) {
            searchedVal.push(dataOne);
          } else {
          }
        });
        return searchedVal;
      }
    }
  }
  catch (err) {
    res.send({
      status: "failed",
      data: {},
    });
    centralDbConnection.close()
    dbConnection.close()
  }
  finally {
    // centralDbConnection.close()
    // dbConnection.close()
  }
};

// API DETAILS

// (1) GET FEE PENDING CHART
// URL: /edu/feePendingChart?orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All&fromDate=2021-04-01&toDate=2021-05-28
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId
//  -- 5fa8daece3eb1f18d4250e98

// 2) Campus
// 	-- All
// 	-- campus id's (Ex: 60654c035fd59b0cf8bf21e6)

// 3) programPlan
// 	-- All
// 	-- program plan id's (Ex: 60654c375fd59b0cf8bf2251)

// 4) fromDate
// 	-- Format (yyyy-mm-dd)

// 5) toDate
// 	-- Format (yyyy-mm-dd)

// (2) GET FEE PENDING DATA
// URL: /edu/pendingStudents?orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All&page=1&limit=10
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId
//  -- 5fa8daece3eb1f18d4250e98

// 2) Campus
// 	-- All
// 	-- campus id's (Ex: 60654c035fd59b0cf8bf21e6)

// 3) programPlan
// 	-- All
// 	-- program plan id's (Ex: 60654c375fd59b0cf8bf2251)

// 4) fromDate
// 	-- Format (yyyy-mm-dd)

// 5) toDate
// 	-- Format (yyyy-mm-dd)
