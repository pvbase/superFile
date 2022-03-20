const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const reportSchema = require('../flatten-reports/report-schema');
const orgListSchema = require("../../models/orglists-schema");
const campusSchema = require("../../models/campusModel");
const programPlanSchema = require("../../models/programPlanModel");
const feeTypeSchema = require("../../models/feeTypeModel");
const { convertToCurrency } = require("../flatten-reports/reports-support");

module.exports.getUpdatedDashboard = async (req, res) => {
    const { orgId, type } = req.query;

    if (orgId != undefined) {
        const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
        const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
        const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
        if (!orgData || orgData == null) {
            centralDbConnection.close();
            res.status(400).send({
                status: "failure",
                message: "Organization not found"
            });
        }
        const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

        const reportDetailModel = dbConnection.model("reportdetails", reportSchema);
        const campusModel = dbConnection.model("campuses", campusSchema);
        const programPlanModel = dbConnection.model("programplans", programPlanSchema);
        const feeTypeModel = dbConnection.model("feetypes", feeTypeSchema);

        const campusColor = ["#FF7655", "#1FBFDE", "#C2AC4D", "#00AF51", "#000000", "#000000"];
        const methodNames = ["cash", "cheque", "card", "netbanking", "wallet", "upi", "NEFT"];
        const colorCodes = ["#00AF50", "#CC6601", "#01B0F1", "#0071C1", "#4AACC5", "#CB3398", "#9933FF"];
        const categoryTypes = ["general", "RTE", "sibilings", "teachers-child"];

        if (type != undefined) {
            try {
                const campusData = await campusModel.find({});
                const programPlanData = await programPlanModel.find({ status: 1 });
                const feeTypeData = await feeTypeModel.find({ status: 1 });

                res.send({
                    status: "success",
                    data: {
                        totalStudents: await reportDetailModel.countDocuments(),
                        totalAmount: await calcTotalAmount(),
                        campus: await calcCampusData(campusData),
                        programPlan: await calcProgramPlanData(programPlanData),
                        installment: await calcInstallmentData(),
                        modeOfPayment: await calcModeWiseData(),
                        feeTypes: await calcFeeTypeData(feeTypeData),
                        categories: await calcCategoryData(),
                        refund: await calcRefundData(),
                        timeline: await calcTimeLineData()
                    },
                    message: `Dashboard data calculated successfully for ${type}.`
                });
                centralDbConnection.close();
                dbConnection.close()
            }
            catch (err) {
                res.status(400).send({
                    status: "failed",
                    message: err.message
                })
                centralDbConnection.close();
                dbConnection.close()
            }
            finally { }
        }
        else {
            res.status(400).send({
                status: "failed",
                message: "Dashboard 'type' query is missing. please provide all the required parameters."
            })
            centralDbConnection.close();
            dbConnection.close()
        }
        async function calcTotalAmount() {
            let getTotalAmount = {};
            let totalAmount = await reportDetailModel.aggregate([
                {
                    $group: {
                        _id: 0,
                        plannedAmount: { $sum: "$feePlanDetails.plannedAmount" },
                        paidAmount: { $sum: "$feePlanDetails.paidAmount" },
                        pendingAmount: { $sum: "$feePlanDetails.pendingAmount" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        planned: "$plannedAmount",
                        paid: "$paidAmount",
                        pending: "$pendingAmount"
                    }
                }
            ]);
            getTotalAmount.planned = totalAmount.length != 0 ? totalAmount[0].planned : 0;
            getTotalAmount.paid = totalAmount.length != 0 ? totalAmount[0].paid : 0;
            getTotalAmount.pending = totalAmount.length != 0 ? totalAmount[0].pending : 0;
            return getTotalAmount
        }
        async function calcCampusData(response) {
            let getCampusData = [];
            if (response.length != 0) {
                for (let i = 0; i < response.length; i++) {
                    let dummyObj = {};
                    dummyObj.id = response[i]._doc._id;
                    dummyObj.label = await capsLabel(response[i]._doc.displayName);
                    dummyObj.name = await capsLabel(response[i]._doc.name);
                    dummyObj.studentCount = await reportDetailModel.countDocuments({ campusId: `${response[i]._doc._id}` });
                    dummyObj.paidStudent = await reportDetailModel.countDocuments({
                        campusId: `${response[i]._doc._id}`,
                        'feePlanDetails.paidAmount': { $not: { $eq: Number(0) } }
                    })
                    dummyObj.pendingStudent = await reportDetailModel.countDocuments({
                        campusId: `${response[i]._doc._id}`,
                        'feePlanDetails.paidAmount': 0
                    })
                    let calcAmount = await reportDetailModel.aggregate([
                        {
                            $match: {
                                campusId: `${response[i]._doc._id}`
                            }
                        },
                        {
                            $group: {
                                _id: 0,
                                plan: { $sum: "$feePlanDetails.plannedAmount" },
                                paid: { $sum: "$feePlanDetails.paidAmount" },
                                pending: { $sum: "$feePlanDetails.pendingAmount" }
                            }
                        },
                        {
                            $project: {
                                plan: "$plan",
                                paid: "$paid",
                                pending: "$pending"
                            }
                        }
                    ]);
                    dummyObj.plan = calcAmount.length != 0 ? calcAmount[0].plan : 0;
                    dummyObj.paid = calcAmount.length != 0 ? calcAmount[0].paid : 0;
                    dummyObj.pending = calcAmount.length != 0 ? calcAmount[0].pending : 0;
                    dummyObj.color = campusColor[i];
                    getCampusData.push(dummyObj);
                }
                return getCampusData
            }
            else { }
        }
        async function calcProgramPlanData(response) {
            let getprogramPlanData = [];
            if (response.length != 0) {
                for (let i = 0; i < response.length; i++) {
                    let dummyObj = {};
                    dummyObj._id = response[i]._doc._id;
                    dummyObj.label = await capsLabel(response[i]._doc.title);
                    dummyObj.academicYear = response[i]._doc.academicYear;
                    dummyObj.studentCount = await reportDetailModel.countDocuments({ programPlanId: mongoose.Types.ObjectId(response[i]._doc._id) });
                    dummyObj.paidStudent = await reportDetailModel.countDocuments({
                        programPlanId: mongoose.Types.ObjectId(response[i]._doc._id),
                        'feePlanDetails.paidAmount': { $not: { $eq: Number(0) } }
                    })
                    dummyObj.pendingStudent = await reportDetailModel.countDocuments({
                        programPlanId: mongoose.Types.ObjectId(response[i]._doc._id),
                        'feePlanDetails.paidAmount': 0
                    })
                    let calcAmount = await reportDetailModel.aggregate([
                        {
                            $match: {
                                programPlanId: mongoose.Types.ObjectId(response[i]._doc._id)
                            }
                        },
                        {
                            $group: {
                                _id: 0,
                                plan: { $sum: "$feePlanDetails.plannedAmount" },
                                paid: { $sum: "$feePlanDetails.paidAmount" },
                                pending: { $sum: "$feePlanDetails.pendingAmount" }
                            }
                        },
                        {
                            $project: {
                                plan: "$plan",
                                paid: "$paid",
                                pending: "$pending"
                            }
                        }
                    ]);
                    dummyObj.plan = calcAmount.length != 0 ? calcAmount[0].plan : 0;
                    dummyObj.paid = calcAmount.length != 0 ? calcAmount[0].paid : 0;
                    dummyObj.pending = calcAmount.length != 0 ? calcAmount[0].pending : 0;
                    getprogramPlanData.push(dummyObj);
                }
            }
            else { }
            return getprogramPlanData
        }
        async function calcInstallmentData() {
            let instData = [];
            for (let i = 1; i < 5; i++) {
                let getInst = await reportDetailModel.aggregate([
                    {
                        $unwind: "$installmentDetails"
                    },
                    {
                        $match: {
                            "installmentDetails.label": `Installment00${i}`
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            plan: { $sum: "$installmentDetails.plannedAmount" },
                            paid: { $sum: "$installmentDetails.paidAmount" },
                            pending: { $sum: "$installmentDetails.pendingAmount" }
                        }
                    },
                    {
                        $group: {
                            _id: 0,
                            plan: { $sum: { $sum: "$plan" } },
                            paid: { $sum: { $sum: "$paid" } },
                            pending: { $sum: { $sum: "$pending" } }
                        }
                    },
                    {
                        $project: {
                            _id: `${i}`,
                            plan: "$plan",
                            paid: "$paid",
                            pending: "$pending",
                            type: `${i <= 2 ? "Term 1" : "Term 2"}`,
                            label: `${i <= 2 ? "Term 1" : "Term 2"} - Installment ${i}`
                        }
                    }
                ]);
                instData.push({
                    _id: getInst.length != 0 ? getInst[0]._id : "-",
                    plan: getInst.length != 0 ? getInst[0].plan : 0,
                    paid: getInst.length != 0 ? getInst[0].paid : 0,
                    pending: getInst.length != 0 ? getInst[0].pending : 0,
                    type: `${i <= 2 ? "Term 1" : "Term 2"}`,
                    label: `${i <= 2 ? "Term 1" : "Term 2"} - Installment ${i}`
                });
            }
            return instData
        }
        async function calcModeWiseData() {
            let modeData = [];
            for (let i = 0; i < methodNames.length; i++) {
                let dummyObj = {};
                dummyObj.label = await capsLabel(`${methodNames[i]}`);
                dummyObj.color = `${colorCodes[i]}`;

                let getMode = await reportDetailModel.aggregate([
                    {
                        $unwind: "$transactionDetails"
                    },
                    {
                        $match: {
                            "transactionDetails.status": { $not: { $eq: String("Cancelled") } },
                            "transactionDetails.transactionSubType": "feePayment",
                            "transactionDetails.data.method": `${methodNames[i]}`
                        }
                    },
                    {
                        $group: {
                            _id: "$_id",
                            total: { $sum: "$transactionDetails.amount" }
                        }
                    },
                    {
                        $group: {
                            _id: 0,
                            total: { $sum: { $sum: "$total" } },
                        }
                    },
                    {
                        $project: {
                            _id: `${i + 1}`,
                            paid: "$total",
                        }
                    }
                ]);
                dummyObj.paid = getMode.length != 0 ? getMode[0].paid : 0;
                modeData.push(dummyObj)
            }
            return modeData
        }
        async function calcFeeTypeData(response) {
            let feeTypeDatas = [];
            if (response.length != 0) {
                for (let i = 0; i < response.length; i++) {
                    let dummyObj = {};
                    dummyObj.label = await capsLabel(response[i]._doc.title);
                    dummyObj.id = response[i]._doc.displayName;
                    let getFeeType = await reportDetailModel.aggregate([
                        {
                            $unwind: "$transactionDetails"
                        },
                        {
                            $group: {
                                _id: "0",
                                total_count: {
                                    $sum: 1
                                },
                                feesBreakUp: {
                                    $push: "$transactionDetails.data.feesBreakUp"
                                }
                            }
                        },
                        {
                            $unwind: "$feesBreakUp"
                        },
                        {
                            $unwind: "$feesBreakUp"
                        },
                        {
                            $match: {
                                "feesBreakUp.feeTypeCode": `${response[i]._doc.displayName}`
                            }
                        },
                        {
                            $group: {
                                _id: 0,
                                total: { $sum: "$feesBreakUp.paid" }
                            }
                        },
                        {
                            $project: {
                                total: "$total"
                            }
                        }
                    ]);
                    dummyObj.paid = getFeeType.length != 0 ? getFeeType[0].total : 0;
                    dummyObj.color = colorCodes[i] == undefined ? "-" : colorCodes[i];
                    feeTypeDatas.push(dummyObj);
                }
            }
            else { }
            return feeTypeDatas
        }
        async function calcCategoryData() {
            let categoryData = [];
            for (let i = 0; i < categoryTypes.length; i++) {
                let dummyObj = {};
                dummyObj.label = await capsLabel(categoryTypes[i]);
                let getCategory = await reportDetailModel.aggregate([
                    {
                        $match: {
                            "studentDetails.category": categoryTypes[i]
                        }
                    },
                    {
                        $group: {
                            _id: 0,
                            paid: { $sum: "$feePlanDetails.paidAmount" }
                        }
                    },
                    {
                        $project: {
                            label: categoryTypes[i],
                            paid: "$paid"
                        }
                    }
                ])
                dummyObj.paid = getCategory.length != 0 ? getCategory[0].paid : 0;
                categoryData.push(dummyObj);
            }
            return categoryData
        }
        async function calcRefundData() {
            let refundDetails = {};
            let getRefund = await reportDetailModel.aggregate([
                {
                    $unwind: "$transactionDetails"
                },
                {
                    $match: {
                        "transactionDetails.transactionSubType": "refund",
                    }
                },
                {
                    $group: {
                        _id: 0,
                        studentCount: { $sum: 1 },
                        refundAmount: { $sum: "$transactionDetails.amount" }
                    }
                },
                {
                    $project: {
                        studentCount: "$studentCount",
                        refundAmount: "$refundAmount"
                    }
                }
            ]);
            refundDetails.label = "Refund";
            refundDetails.studentCount = getRefund.length != 0 ? getRefund[0].studentCount : 0;
            refundDetails.refundAmount = getRefund.length != 0 ? getRefund[0].refundAmount : 0;
            return refundDetails
        }
        async function calcTimeLineData() {
            let calcTotalPend = await calcTotalAmount();
            let referTotalPend = calcTotalPend.pending;

            if (String(type).toUpperCase() == "WTD") {
                let date = new Date();
                let nextDate = new Date();
                nextDate.setDate(nextDate.getDate() + 1);
                let weekLables = [];
                let allDateList = [];
                let totalMonthPaid = [];
                allDateList.push(await dbChangeDateFormat(new Date()));
                allDateList.push(await dbChangeDateFormat(nextDate));
                for (let i = 0; i < 6; i++) {
                    allDateList.unshift(await dbChangeDateFormat(new Date(date.setDate(date.getDate() - 1))));
                }
                for (let y = 0; y < allDateList.length - 1; y++) {
                    let getDateFormat = await weekLableFormat(new Date(allDateList[y]));
                    weekLables.unshift(getDateFormat);
                    var calcTotal = await calcTransactionTotal(new Date(allDateList[y]), new Date(allDateList[y + 1]));
                    totalMonthPaid.unshift(calcTotal);
                }
                let getProperResp = await arrangeTimeLineData(weekLables, totalMonthPaid, Number(referTotalPend), "WTD");
                return getProperResp
            }
            else if (String(type).toUpperCase() == "MTD") {
                const weekLables = ["Week 5", "Week 4", "Week 3", "Week 2", "Week 1"];
                let date = new Date();
                let totalMonthPaid = [];
                let firstDay = await changeDateFormat(new Date(date.getFullYear(), date.getMonth(), 1));
                let lastDay = await changeDateFormat(new Date(date.getFullYear(), date.getMonth() + 1, 0));
                let getAllDate = await generateDateList(firstDay, lastDay);
                for (let i = 0; i < 5; i++) {
                    let lastDateCalc = new Date(lastDay);
                    let addOneDate = lastDateCalc.setDate(lastDateCalc.getDate() + 1);
                    if (i == 4) {
                        let calcAmnt = await calcTransactionTotal(new Date(getAllDate[i]), new Date(addOneDate));
                        totalMonthPaid.unshift(calcAmnt);
                    }
                    else {
                        let calcAmnt = await calcTransactionTotal(new Date(getAllDate[i]), new Date(getAllDate[i + 1]));
                        let calcDate = new Date(new Date(getAllDate[i + 1]).toLocaleDateString());
                        let newCalc = calcDate.setDate(calcDate.getDate() - 1);
                        totalMonthPaid.unshift(calcAmnt);
                    }
                }
                let getProperResp = await arrangeTimeLineData(weekLables, totalMonthPaid, Number(referTotalPend), "MTD");
                return getProperResp
            }
            else if (String(type).toUpperCase() == "YTD") {
                let today = new Date();
                let d;
                const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                let yearLables = [];
                let totalMonthPaid = [];
                for (var i = 0; i < 6; i++) {
                    d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    let firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
                    let lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                    let getNewLast = new Date(lastDay);
                    let convertNewLast = getNewLast.setDate(getNewLast.getDate() + 1);
                    let getTotalVal = await calcTransactionTotal(new Date(firstDay), new Date(convertNewLast));
                    yearLables.push(`${monthName[lastDay.getMonth()]} ${lastDay.getFullYear()}`);
                    totalMonthPaid.push(getTotalVal);
                }
                var getProperResp = await arrangeTimeLineData(yearLables, totalMonthPaid, Number(referTotalPend), "YTD");
                return getProperResp
            }
            else {
                return { message: "'type' query is not in the following format (WTD | MTD | YTD)." }
            }
        }
        async function calcTransactionTotal(from, to) {
            let getTxnTotal = await reportDetailModel.aggregate([
                {
                    "$unwind": "$transactionDetails"
                },
                {
                    $match: {
                        "transactionDetails.transactionSubType": "feePayment",
                        "transactionDetails.createdAt": {
                            $gte: new Date(from),
                            $lte: new Date(to)
                        }
                    }
                },
                {
                    $group: {
                        _id: 0,
                        total: { $sum: "$transactionDetails.amount" }
                    }
                },
                {
                    $project: {
                        total: "$total"
                    }
                }
            ]);
            return getTxnTotal.length != 0 ? getTxnTotal[0].total : 0
        }


        async function capsLabel(data) {
            return data.charAt(0).toUpperCase() + data.slice(1);
        }
        async function timeLabel(ev) {
            let monthFormat = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            if (ev === undefined || ev === "") { }
            else {
                let getDate = `${String(ev.getDate()).length == 1 ? `0${ev.getDate()}` : ev.getDate()}`;
                let getMonth = Number(ev.getMonth());
                let getYear = `${ev.getFullYear()}`;
                return `${getDate}-${monthFormat[getMonth]}-${getYear} at ${await formatTime(ev)}`;
            }
        }
        async function formatTime(date) {
            let hours = date.getHours();
            let minutes = date.getMinutes();
            let seconds = date.getSeconds();
            let ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0' + minutes : minutes;
            seconds = seconds < 10 ? '0' + seconds : seconds;
            const strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
            return strTime;
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
    }
    else {
        res.status(400).send({
            status: "failed",
            message: "Dashboard 'orgId' query is missing. please provide all the required parameters."
        })
    }
}

// API DETAILS

// DASHBOARD DATA
// URL: /edu/dashboard?orgId=5fa8daece3eb1f18d4250e98&type=WTD
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId
//  -- 5fa8daece3eb1f18d4250e98
// 2) type
//  -- WTD | MTD | YTD