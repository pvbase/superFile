const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../../models/orglists-schema");

// (1) REPORTS-RECEIVABLES DATA + REPORTS-RECEIVABLES CHART
module.exports.getReportReceivables = async (req, res) => {
  const { orgId, campus, programPlan } = req.query;
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
  var studentFeeMapsModel = dbConnection.model("studentfeesmaps", allSchema);
  var studentFeePlansModel = dbConnection.model("studentfeeplans", allSchema);
  var searchAggr = {};
  var planAggr = {};
  var totAggr = {};
  var getFinalResults = [];
  var getTotalRecords = 0;
  var getTotalAmount = 0;
  var receivedTot = 0;
  var receivableTot = 0;
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
  var getChartData = {
    weekLabels: [],
    receivable: [],
    received: [],
  };
  var percentageMonth = [
    {
      label: "Apr",
      percent: 15,
    },
    {
      label: "May",
      percent: 15,
    },
    {
      label: "Jun",
      percent: 30,
    },
    {
      label: "Sep",
      percent: 20,
    },
    {
      label: "Nov",
      percent: 20,
    },
  ];

  try {
    var academicYear = "";
    let endYear = new Date().getFullYear() + 1;
    let startYear = new Date().getFullYear();
    academicYear =
      startYear +
      "-" +
      endYear.toString().substr(endYear.toString().length - 2, 2);
    if (
      programPlan != undefined &&
      String(programPlan).toLocaleLowerCase() != "all"
    ) {
      searchAggr.programPlan = mongoose.Types.ObjectId(programPlan);
      planAggr.programPlan = mongoose.Types.ObjectId(programPlan);
      totAggr.programPlanId = mongoose.Types.ObjectId(programPlan);
    }
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
      searchAggr.campusId = String(campus);
      planAggr.campusId = String(campus);
      totAggr.campusId = String(campus);
    }
    var totalPlannedAggregation = [
      {
        $match: totAggr,
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
    totalPlannedAmnt = await studentFeeMapsModel.aggregate(
      totalPlannedAggregation
    );
    var getAllDates = await getListOfDate(new Date());
    for (let i = 0; i < getAllDates.length; i++) {
      let getNewLast = new Date(getAllDates[i].to);
      let convertNewLast = getNewLast.setDate(getNewLast.getDate() - 1);
      searchAggr.createdAt = {
        $gte: new Date(getAllDates[i].from),
        $lte: new Date(getAllDates[i].to),
      };
      planAggr.updatedAt = {
        $gte: new Date(getAllDates[i].from),
        $lte: new Date(getAllDates[i].to),
      };
      getTotalRecords = await transactionModel.countDocuments(searchAggr);
      getTotalAmount = await transactionModel.aggregate([
        {
          $match: searchAggr,
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
      getFinalResults.push({
        fromDate: new Date(getAllDates[i].from).toLocaleDateString(),
        toDate: new Date(convertNewLast).toLocaleDateString(),
        totalRecords: getTotalRecords,
        received: getTotalAmount.length > 0 ? getTotalAmount[0].total : 0,
        month: monthName[new Date(getAllDates[i].from).getMonth()],
        year: new Date(getAllDates[i].from).getFullYear(),
        receivable: 0,
        installmentPercentage: "0%",
      });
    }
    for (let i = 0; i < getFinalResults.length; i++) {
      for (let y = 0; y < percentageMonth.length; y++) {
        if (getFinalResults[i].month == percentageMonth[y].label) {
          let a = getFinalResults[i];
          a["receivable"] = Math.ceil(
            (Number(
              totalPlannedAmnt.length != 0 ? totalPlannedAmnt[0].total : 0
            ) /
              100) *
            Number(percentageMonth[y].percent)
          );
          a["installmentPercentage"] = `${Number(percentageMonth[y].percent)}%`;
        }
      }
      getChartData.weekLabels.push(getFinalResults[i].month);
      getChartData.received.push(getFinalResults[i].received);
    }
    for (let i = 0; i < getFinalResults.length; i++) {
      receivedTot = Number(receivedTot) + Number(getFinalResults[i].received);
      receivableTot =
        Number(receivableTot) + Number(getFinalResults[i].receivable);
      getChartData.receivable.push(Number(getFinalResults[i].receivable));
    }
    getFinalResults.push({
      fromDate: "-",
      toDate: "-",
      totalRecords: getTotalRecords,
      received: receivedTot,
      month: "Total",
      year: academicYear,
      receivable: receivableTot,
      installmentPercentage: "100%",
    });
    getChartData.weekLabels.push("Total");
    getChartData.received.push(receivedTot);
    getChartData.receivable.push(receivableTot);
    res.send({
      status: "success",
      data: getFinalResults,
      chartData: getChartData,
    });
    centralDbConnection.close();
    dbConnection.close();
    async function getListOfDate(e) {
      var todayDate = new Date(e);
      var d;
      var collectDate = [];
      if (todayDate.getMonth() <= 3) {
        var today = new Date(
          `05-01-${Number(new Date(todayDate).getFullYear()) - 1}`
        );
        for (let i = 0; i < 12; i++) {
          d = new Date(today.getFullYear(), today.getMonth() + i, 1);
          let firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
          let lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          let newToDate = new Date(lastDay);
          newToDate = newToDate.setDate(newToDate.getDate() + 1);
          collectDate.push({
            from: await changeDateFormat(new Date(firstDay)),
            to: await changeDateFormat(new Date(newToDate)),
          });
        }
      } else if (todayDate.getMonth() > 3) {
        for (let i = 0; i < 12; i++) {
          let today = new Date(
            `05-01-${Number(new Date(todayDate).getFullYear())}`
          );
          d = new Date(today.getFullYear(), today.getMonth() + i, 1);
          let firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
          let lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          let newToDate = new Date(lastDay);
          newToDate = newToDate.setDate(newToDate.getDate() + 1);
          collectDate.push({
            from: await changeDateFormat(new Date(firstDay)),
            to: await changeDateFormat(new Date(newToDate)),
          });
        }
      }
      return collectDate;
    }
    async function changeDateFormat(ev) {
      if (ev === undefined || ev === "") {
      } else {
        let getDate = `${String(ev.getDate()).length == 1 ? `0${ev.getDate()}` : ev.getDate()
          }`;
        let getMonth = `${String(ev.getMonth()).length == 1
          ? `0${ev.getMonth()}`
          : ev.getMonth()
          }`;
        let getYear = `${ev.getFullYear()}`;
        let today = `${getYear}-${getMonth == 00 ? 12 : getMonth
          }-${getDate}T00:00:00.000Z`;
        return today;
      }
    }
  } catch (err) {
    res.send({
      status: "failed",
      data: [],
    });
    centralDbConnection.close();
    dbConnection.close();
  } finally {
    // centralDbConnection.close()
    // dbConnection.close()
  }
};

// API DETAILS

// (1) REPORTS-RECEIVABLES DATA + REPORTS-RECEIVABLES CHART
// /edu/getReceivables?orgId=5fa8daece3eb1f18d4250e98&&campus=All&programPlan=All
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
