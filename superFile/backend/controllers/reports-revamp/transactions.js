const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const orgListSchema = require("../../models/orglists-schema");
const { dataPagination } = require("./reports-support");
const moment = require('moment')
// (1) TRANSACTIONS CHART
module.exports.getFeeCollectionChart = async (req, res) => {
    const { orgId, campus, fromDate, toDate, programPlan, user } = req.query;
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
    var campusesModel = dbConnection.model("campuses", allSchema);
    var programPlanModel = dbConnection.model("programplans", allSchema);
    var searchAggr = {};
    var colorCodes = [
        "#FF7655",
        "#1FBFDE",
        "#C2AC4D",
        "#CC0098",
        "#000000",
        "#000000",
    ]; // --> for campus wise color (UI suggested)
    var methodColorCodes = [
        "#00AF50",
        "#CC6601",
        "#01B0F1",
        "#0071C1",
        "#4AACC5",
        "#CB3398",
        "#9933FF",
    ]; // --> for method wise color (UI suggested)
    var methodNames = [
        "cash",
        "cheque",
        "card",
        "netbanking",
        "wallet",
        "upi",
        "NEFT",
    ];
    const diffTime = Math.abs(new Date(fromDate) - new Date(toDate));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    var referTotalPend = 0;
    var modeAggr = {};
    var modeWiseData = [];
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
        var totalPendAggr = [
            {
                $match: {
                    campusId: String(campus),
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
            // {
            //     $match: {
            //         "students.status": 1
            //     }
            // },
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
            // {
            //     $match: {
            //         "students.status": 1
            //     }
            // },
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
    var countSearchAggr = {};
    searchAggr.transactionSubType = "feePayment";
    countSearchAggr.transactionSubType = "feePayment";
    searchAggr.status = { $not: { $eq: String("Cancelled") } }
    var newToDate = new Date(toDate);
    newToDate = newToDate.setDate(newToDate.getDate() + 1);

    // var fromDate1 = moment(new Date(fromDate)).format('YYYY-MM-DD[T00:00:00.000Z]');
    // var d = new Date();
    // d.setDate(new Date(toDate).getDate() + 1);
    // var newToDate1 = moment(d).format('YYYY-MM-DD[T00:00:00.000Z]');

    searchAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate), };
    searchAggr.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(newToDate),
    };
    countSearchAggr.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(newToDate),
    };
    modeAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
    if (
        programPlan != undefined &&
        String(programPlan).toLocaleLowerCase() != "all"
    ) {
        searchAggr.programPlan = mongoose.Types.ObjectId(programPlan);
        countSearchAggr.programPlan = mongoose.Types.ObjectId(programPlan);
        modeAggr.programPlan = mongoose.Types.ObjectId(programPlan);
    }
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
        searchAggr.campusId = String(campus);
        countSearchAggr.campusId = String(campus);
        modeAggr.campusId = String(campus);
    }
    if (user != undefined && String(user).toLocaleLowerCase() != "all") {
        searchAggr.createdBy = String(user);
        countSearchAggr.createdBy = String(user);
        modeAggr.createdBy = String(user);
    }
    var getTotalRecords = 0;
    var getTotalAmount = 0;
    var calcTotalBalance = {
        plan: 0,
        paid: 0,
        pend: 0,
    };
    var campusWiseDataCollect = [];
    var getTimeLineData = {};
    modeAggr.transactionSubType = "feePayment";
    modeAggr.status = { $not: { $eq: String("Cancelled") } }
    try {
        for (let i = 0; i < methodNames.length; i++) {
            modeAggr["data.method"] = methodNames[i];
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
                total: getModeAmount.length != 0 ? getModeAmount[0].total : 0,
                color: methodColorCodes[i],
            });
        }
        await campusesModel.find({}, async (error, results) => {
            try {
                getTotalRecords = await transactionModel.countDocuments(countSearchAggr);
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
                var getTotalPlanAmnt = await studentFeePlanModel.aggregate([
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
                    // {
                    //     $match: {
                    //         "students.status": 1
                    //     }
                    // },
                    {
                        $group: {
                            _id: "",
                            plannedAmount: { $sum: "$plannedAmount" },
                            // paidAmount: { $sum: "$paidAmount" },
                            pendingAmount: { $sum: "$pendingAmount" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            totalPlan: "$plannedAmount",
                            // totalPaid: "$paidAmount",
                            totalpend: "$pendingAmount",
                        },
                    },
                ]);
                var getTotalPaidAmount = await studentFeePlanModel.aggregate([  //both
                    {
                        $group: {
                            _id: "",
                            paidAmount: { $sum: "$paidAmount" },
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            totalPaid: "$paidAmount",
                        },
                    },
                ]);
                calcTotalBalance.plan =
                    getTotalPlanAmnt.length > 0 ? getTotalPlanAmnt[0].totalPlan : 0;
                calcTotalBalance.paid =
                    getTotalPaidAmount.length > 0 ? getTotalPaidAmount[0].totalPaid : 0;
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
                const feePlanModel = dbConnection.model(
                    "studentfeesmaps",
                    StudentFeeMapSchema,
                    "studentfeesmaps"
                );
                let academicYear = "";
                let endYear = new Date().getFullYear() + 1;
                let startYear = new Date().getFullYear();
                academicYear = startYear + "-" + endYear.toString().substr(endYear.toString().length - 2, 2);
                const studentFeePipeline = [
                    {
                        $lookup: {
                            from: "programplans",
                            localField: "programPlanId",
                            foreignField: "_id",
                            as: "programPlanData",
                        },
                    },
                    {
                        $unwind: "$programPlanData",
                    },
                    {
                        $group: {
                            _id: "$programPlanId",
                            planned: { $sum: "$amount" },
                            pending: { $sum: "$pending" },
                            paid: { $sum: "$paid" },
                            studentsCount: { $sum: 1 },
                            details: {
                                $push: {
                                    title: "$programPlanData.title",
                                    academicYear: "$programPlanData.academicYear",
                                },
                            },
                        },
                    },
                    {
                        $project: {
                            programPlanName: { $arrayElemAt: ["$details.title", 0] },
                            academicYear: { $arrayElemAt: ["$details.academicYear", 0] },
                            plannedAmnt: "$planned",
                            paidAmt: "$paid",
                            pendingAmt: "$pending",
                            totalStudents: "$studentsCount",
                        },
                    },
                    {
                        $match: {
                            academicYear: academicYear,
                        },
                    },
                    {
                        $sort: { _id: -1 },
                    },
                ];
                // getProgramPlanData = await feePlanModel.aggregate(studentFeePipeline);
                getProgramPlanData = await calculateProgramPlan();
                var campusSrchAggr = searchAggr;
                var getCampusWisePaidAmnt = [];
                for (let i = 0; i < results.length; i++) {
                    campusSrchAggr.campusId = String(results[i]._doc._id);
                    var cmpPaidAggr = [
                        {
                            $match: campusSrchAggr,
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
                    var getTransactCmpsAmnt = await transactionModel.aggregate(cmpPaidAggr);
                    var getCmpsTotalPlanAmnt = await studentFeePlanModel.aggregate([
                        {
                            $match: {
                                campusId: String(results[i]._doc._id),
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
                        // {
                        //     $match: {
                        //         "students.status": 1
                        //     }
                        // },
                        {
                            $group: {
                                _id: "",
                                plannedAmount: { $sum: "$plannedAmount" },
                                pendingAmount: { $sum: "$plannedAmount" },
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
                        plan: getCmpsTotalPlanAmnt.length > 0 ? getCmpsTotalPlanAmnt[0].total : 0,
                        paid: getTransactCmpsAmnt.length > 0 ? getTransactCmpsAmnt[0].total : 0,
                        pend: Number(getCmpsTotalPlanAmnt.length > 0 ? getCmpsTotalPlanAmnt[0].total : 0) -
                            Number(getTransactCmpsAmnt.length > 0 ? getTransactCmpsAmnt[0].total : 0),
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
                res.send({
                    status: "success",
                    data: {
                        totalRecords: getTotalRecords,
                        transactionAmount: getTotalAmount.length > 0 ? getTotalAmount[0].total : 0,
                        totalApplicationAmount: calcTotalBalance,
                        campusData: campusWiseDataCollect,
                        timelineData: getTimeLineData,
                        programPlanwiseData: getProgramPlanData,
                        methodWiseAmount: modeWiseData,
                    },
                });
                centralDbConnection.close()
                dbConnection.close()
            } catch (err) {
                res.send({
                    status: "failed",
                    data: {},
                });
                centralDbConnection.close()
                dbConnection.close()
            }
        });
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
            // var fromDate1 = moment(new Date(day1)).format('YYYY-MM-DD[T00:00:00.000Z]');
            // var d = new Date();
            // d.setDate(new Date(day2).getDate() + 1);
            // var newToDate1 = moment(d).format('YYYY-MM-DD[T00:00:00.000Z]');

            // getMatchBlock.createdAt = { $gte: fromDate1, $lte: newToDate1 };
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
                                : Number(dummyPlanStore) + Number(dummyArr[i])
                        );
                        timeLineWiseData.pendingAmount.unshift(
                            Number(dummyArr[i]) == 0 ? 0 : Number(dummyPlanStore)
                        );
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
        async function calculateProgramPlan() {
            var transactNewAggr = {};
            let pgmNewAggr = {};
            let academicYear = "";
            let endYear = new Date().getFullYear() + 1;
            let startYear = new Date().getFullYear();
            academicYear = startYear + "-" + endYear.toString().substr(endYear.toString().length - 2, 2);
            if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                pgmNewAggr._id = mongoose.Types.ObjectId(programPlan);
            }
            if (campus !== undefined && campus !== null && campus !== "" && campus.toLowerCase() != "all") {
                pgmNewAggr.campusId = campus;
            }
            // pgmNewAggr.status = 1;
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

                // var fromDate1 = moment(new Date(fromDate)).format('YYYY-MM-DD[T00:00:00.000Z]');
                // var d = new Date();
                // d.setDate(new Date(toDate).getDate() + 1);
                // var newToDate1 = moment(d).format('YYYY-MM-DD[T00:00:00.000Z]');

                var newToDate = new Date(toDate);
                newToDate = newToDate.setDate(newToDate.getDate() + 1);
                transactNewAggr.createdAt = {
                    $gte: new Date(fromDate),
                    $lte: new Date(newToDate),
                };
                if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                    transactNewAggr.campusId = String(campus);
                }
                var totalAmnt = 0;
                for (let i = 0; i < getPgmData[0].data.length; i++) {
                    transactNewAggr.programPlan = getPgmData[0].data[i]._id;
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
                    getPgmData[0].data[i].paidAmt = Number(
                        getTransactTotal.length != 0 ? getTransactTotal[0].data : 0
                    );
                    totalAmnt =
                        Number(totalAmnt) +
                        Number(getTransactTotal.length != 0 ? getTransactTotal[0].data : 0);
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
    } catch (err) {
        res.status(400).json({
            status: "failed",
            data: err,
        });
        centralDbConnection.close()
        dbConnection.close()
    } finally {
        // centralDbConnection.close()
        // dbConnection.close()
    }
};

// (2) TRANSACTIONS DATA
module.exports.getFeeCollectionData = async (req, res) => {
    const { orgId, campus, fromDate, toDate, programPlan, page, limit, searchKey, user } = req.query;
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
    var feesLedgersModel = dbConnection.model("feesledgers", allSchema);
    var studentfeeplansModel = dbConnection.model("studentfeeplans", allSchema);
    var campusModel = dbConnection.model("campuses", allSchema);
    var getLedgersData;
    var feePlanData;
    try {
        let findCampusWise = [];
        await campusModel.find({}, async (err, resp) => {
            if (resp.length != 0) {
                for (let i = 0; i < resp.length; i++) {
                    let getDetail = await calcCampusWiseData(resp[i]._doc._id, resp[i]._doc.displayName)
                    findCampusWise.push(getDetail);
                }
            }
            return null
        })
        await feesLedgersModel.find({}, (ledgErr, ledgResp) => {
            getLedgersData = ledgResp;
        })
        await studentfeeplansModel.find({}, (feeErr, feeResp) => {
            feePlanData = feeResp;
        })
        var filterAggr = {};
        filterAggr.transactionSubType = "feePayment";
        // filterAggr.status = { $not: { $eq: String("Cancelled") } }
        if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
            filterAggr.programPlan = mongoose.Types.ObjectId(programPlan);
        }
        if (campus != undefined && String(campus).toLocaleLowerCase() != 'all') {
            filterAggr.campusId = String(campus);
        }
        if (user != undefined && String(user).toLocaleLowerCase() != "all") {
            filterAggr.createdBy = String(user);
        }
        if (fromDate == undefined || toDate == undefined) {
            res.send({
                status: "success",
                data: [],
                totalData: 0,
                totalPage: null,
                currentPage: Number(page),
                perPage: Number(limit),
                nextPage: null,
                message: "Please provide from and to date"
            });
            // centralDbConnection.close()
            // dbConnection.close()
        }
        else {
            var newToDate = new Date(toDate);
            newToDate = newToDate.setDate(newToDate.getDate() + 1);
            // var fromDate1 = moment(new Date(fromDate)).format('YYYY-MM-DD[T00:00:00.000Z]');
            // var d = new Date();
            // d.setDate(new Date(toDate).getDate() + 1);
            // var newToDate1 = moment(d).format('YYYY-MM-DD[T00:00:00.000Z]');

            filterAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
            var findTotal = await calcModeWiseData();
            console.log(findCampusWise);
            if (page == undefined || limit == undefined) {
                await transactionModel.find(filterAggr, async (txnErr, dbTxnResp) => {
                    var txnResp = dbTxnResp.reverse();
                    var calcTotpage = Math.ceil(Number(txnResp.length) / Number(limit));
                    if (txnResp.length == 0) {
                        res.send({
                            status: "success",
                            totalRecords: 0,
                            data: [],
                            modeDetails: findTotal,
                            campusWise: findCampusWise,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "No Data"
                        });
                        // centralDbConnection.close()
                        // dbConnection.close()
                    }
                    else {
                        var txnRespData = [];
                        for (let i = 0; i < txnResp.length; i++) {
                            var dummyObj = { ...txnResp[i]._doc };
                            let ledgId = txnResp[i]._doc.feesLedgerIds[txnResp[i]._doc.feesLedgerIds.length - 1];
                            let pendingValue = await filterAnArr(getLedgersData, ledgId);
                            let feePlanFilter = await filterFeePlan(feePlanData, txnResp[i]._doc.studentRegId);
                            dummyObj.pendingAmount = pendingValue[0]._doc.pendingAmount;
                            dummyObj.totalPlannedAmount = feePlanFilter[0]._doc.plannedAmount;
                            dummyObj.currentPendingAmount = feePlanFilter[0]._doc.pendingAmount;
                            dummyObj.currentPaidAmount = feePlanFilter[0]._doc.paidAmount;
                            dummyObj.discountTotalAmount = feePlanFilter[0]._doc.discountAmount;
                            dummyObj.totalAmount = feePlanFilter[0]._doc.totalAmount;
                            txnRespData.push(dummyObj);
                        }
                        res.send({
                            status: "success",
                            totalRecords: txnResp.length,
                            data: txnRespData,
                            modeDetails: findTotal,
                            campusWise: findCampusWise,
                            totalPage: calcTotpage,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null
                        });
                        // centralDbConnection.close()
                        // dbConnection.close()
                    }
                })
            }
            else if (searchKey != undefined && searchKey != "") {
                await transactionModel.find(filterAggr, async (txnErr, dbTxnResp) => {
                    var txnResp = dbTxnResp.reverse();
                    if (txnResp.length == 0) {
                        res.send({
                            status: "success",
                            totalRecords: 0,
                            data: [],
                            modeDetails: findTotal,
                            campusWise: findCampusWise,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "No Data"
                        });
                        // centralDbConnection.close()
                        // dbConnection.close()
                    }
                    else {
                        // console.log("Total:", txnResp.length);
                        var findSearchVal = await searchData(txnResp);
                        // console.log("Search:", findSearchVal.length)
                        var getPaginatedData = await dataPagination(findSearchVal, page, limit);
                        var calcTotpage = Math.ceil(Number(findSearchVal.length) / Number(limit));
                        var txnRespData = [];
                        for (let i = 0; i < getPaginatedData.length; i++) {
                            var dummyObj = { ...getPaginatedData[i]._doc };
                            let ledgId = getPaginatedData[i]._doc.feesLedgerIds[getPaginatedData[i]._doc.feesLedgerIds.length - 1];
                            let pendingValue = await filterAnArr(getLedgersData, ledgId);
                            let feePlanFilter = await filterFeePlan(feePlanData, getPaginatedData[i]._doc.studentRegId);
                            dummyObj.pendingAmount = pendingValue[0]._doc.pendingAmount;
                            dummyObj.totalPlannedAmount = feePlanFilter[0]._doc.plannedAmount;
                            dummyObj.currentPendingAmount = feePlanFilter[0]._doc.pendingAmount;
                            dummyObj.currentPaidAmount = feePlanFilter[0]._doc.paidAmount;
                            dummyObj.discountTotalAmount = feePlanFilter[0]._doc.discountAmount;
                            dummyObj.totalAmount = feePlanFilter[0]._doc.totalAmount;
                            txnRespData.push(dummyObj);
                        }
                        res.send({
                            status: "success",
                            totalRecords: findSearchVal.length,
                            data: txnRespData,
                            modeDetails: findTotal,
                            campusWise: findCampusWise,
                            totalPage: calcTotpage,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null
                        });
                        // centralDbConnection.close()
                        // dbConnection.close()
                    }
                })
            }
            else {
                await transactionModel.find(filterAggr, async (txnErr, dbTxnResp) => {
                    var txnResp = dbTxnResp.reverse();
                    var calcTotpage = Math.ceil(Number(txnResp.length) / Number(limit));
                    if (txnResp.length == 0) {
                        res.send({
                            status: "success",
                            totalRecords: 0,
                            data: [],
                            modeDetails: findTotal,
                            campusWise: findCampusWise,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "No Data"
                        });
                        // centralDbConnection.close()
                        // dbConnection.close()
                    }
                    else {
                        var getPaginatedData = await dataPagination(txnResp, page, limit);
                        var txnRespData = [];
                        for (let i = 0; i < getPaginatedData.length; i++) {
                            var dummyObj = { ...getPaginatedData[i]._doc };
                            let ledgId = getPaginatedData[i]._doc.feesLedgerIds[getPaginatedData[i]._doc.feesLedgerIds.length - 1];
                            let pendingValue = await filterAnArr(getLedgersData, ledgId);
                            let feePlanFilter = await filterFeePlan(feePlanData, getPaginatedData[i]._doc.studentRegId);
                            dummyObj.pendingAmount = pendingValue[0]._doc.pendingAmount;
                            dummyObj.totalPlannedAmount = feePlanFilter[0]._doc.plannedAmount;
                            dummyObj.currentPendingAmount = feePlanFilter[0]._doc.pendingAmount;
                            dummyObj.currentPaidAmount = feePlanFilter[0]._doc.paidAmount;
                            dummyObj.discountTotalAmount = feePlanFilter[0]._doc.discountAmount;
                            dummyObj.totalAmount = feePlanFilter[0]._doc.totalAmount;
                            txnRespData.push(dummyObj);
                        }
                        res.send({
                            status: "success",
                            totalRecords: txnResp.length,
                            data: txnRespData,
                            modeDetails: findTotal,
                            campusWise: findCampusWise,
                            totalPage: calcTotpage,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null
                        });
                        // centralDbConnection.close()
                        // dbConnection.close()
                    }
                })
            }
        }
        async function calcModeWiseData() {
            var methodNames = [
                "cash",
                "cheque",
                "card",
                "netbanking",
                "wallet",
                "upi",
                "NEFT"
            ];
            var modeAggr = {};
            var modeWiseData = {};
            modeWiseData["total"] = 0;
            modeAggr.transactionSubType = "feePayment";
            modeAggr.status = { $not: { $eq: String("Cancelled") } }
            let newToDate = new Date(toDate);
            newToDate = newToDate.setDate(newToDate.getDate() + 1);
            // var fromDate1 = moment(new Date(fromDate)).format('YYYY-MM-DD[T00:00:00.000Z]');
            // var d = new Date();
            // d.setDate(new Date(toDate).getDate() + 1);
            // var newToDate1 = moment(d).format('YYYY-MM-DD[T00:00:00.000Z]');

            modeAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
            if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                modeAggr.programPlan = mongoose.Types.ObjectId(programPlan);
            }
            if (campus != undefined && String(campus).toLocaleLowerCase() != 'all') {
                modeAggr.campusId = String(campus);
            }
            if (user != undefined && String(user).toLocaleLowerCase() != "all") {
                modeAggr.createdBy = String(user);
            }
            for (let i = 0; i < methodNames.length; i++) {
                modeAggr["data.method"] = methodNames[i];
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
                modeWiseData[`${methodNames[i] == "NEFT" ? "loans" : methodNames[i]}`] = getModeAmount.length != 0 ? getModeAmount[0].total : 0
                modeWiseData["total"] = Number(modeWiseData["total"]) + Number(getModeAmount.length != 0 ? getModeAmount[0].total : 0);
            }
            return modeWiseData;
        }
        async function filterAnArr(arr, data) {
            let filterVal = arr.filter(function (item) {
                return String(item._id) == String(data);
            });
            // console.log(filterVal);
            return filterVal
        }
        async function filterFeePlan(arr, data) {
            let filterVal = arr.filter(function (item) {
                return String(item._doc.studentRegId) == String(data);
            });
            return filterVal
        }
        async function searchData(data) {
            var searchedData = [];
            if (data.length == 0) { }
            else {
                let searchData = String(searchKey).toLowerCase();
                for (let i = 0; i < data.length; i++) {
                    if (
                        String(data[i]._doc.displayName).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.studentRegId).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.studentName).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.class).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.receiptNo).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.amount).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.paymentTransactionId).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.status).toLowerCase().includes(searchData) == true
                    ) {
                        searchedData.push(data[i]);
                    }
                    else { }
                }
                return searchedData
            }
        }
        async function calcCampusWiseData(campArgId, campArgName) {
            var methodNames = [
                "cash",
                "cheque",
                "card",
                "netbanking",
                "wallet",
                "upi",
                "NEFT"
            ];
            var modeAggr = {};
            var modeWiseData = {};
            modeWiseData["total"] = 0;
            modeWiseData["campusName"] = campArgName;
            modeAggr.transactionSubType = "feePayment";
            modeAggr.status = { $not: { $eq: String("Cancelled") } }
            let newToDate = new Date(toDate);
            newToDate = newToDate.setDate(newToDate.getDate() + 1);

            // var fromDate1 = moment(new Date(fromDate)).format('YYYY-MM-DD[T00:00:00.000Z]');
            // var d = new Date();
            // d.setDate(new Date(toDate).getDate() + 1);
            // var newToDate1 = moment(d).format('YYYY-MM-DD[T00:00:00.000Z]');

            modeAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
            if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                modeAggr.programPlan = mongoose.Types.ObjectId(programPlan);
            }
            modeAggr.campusId = String(campArgId);
            if (user != undefined && String(user).toLocaleLowerCase() != "all") {
                modeAggr.createdBy = String(user);
            }
            for (let i = 0; i < methodNames.length; i++) {
                modeAggr["data.method"] = methodNames[i];
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
                modeWiseData[`${methodNames[i] == "NEFT" ? "loans" : methodNames[i]}`] = getModeAmount.length != 0 ? getModeAmount[0].total : 0
                modeWiseData["total"] = Number(modeWiseData["total"]) + Number(getModeAmount.length != 0 ? getModeAmount[0].total : 0);
            }
            return modeWiseData;
        }
    }
    catch (err) { }
    finally {
        // centralDbConnection.close()
        // dbConnection.close()
    }
};

// API DETAILS

// (1) GET TRANSACTIONS CHART:
// URL: /edu/feeCollectionChart?orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All&fromDate=2021-04-01&toDate=2021-05-28
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

// (2) GET TRANSACTIONS DATA
// URL : /edu/feeCollectionData?orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All&fromDate=2021-04-01&toDate=2021-06-22&page=6&limit=10&searchKey=100
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId *
// 	-- 5fa8daece3eb1f18d4250e98
// 2) campus 
// 	-- All
// 	-- 60a78345d9da6012d081518a
// 3) programPlan 
// 	-- All
// 	-- program plan id's (Ex: 60a78366d9da6012d0815224)
// 4) fromDate *
// 	-- Format (yyyy-mm-dd)
// 5) toDate *
// 	-- Format (yyyy-mm-dd)
// 6) page 
// 	-- Number(0-9)
// 7)limit 
// 	-- Number(0-9)
// 8) searchKey 
// 	-- string
