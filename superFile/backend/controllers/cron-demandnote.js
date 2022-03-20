const mongoose = require("mongoose");
const { demandNoteTemplate } = require('../utils/helper_functions/templates/vkgi-demand-note-email-template');
const { createDatabase } = require("../utils/db_creation");
const moment = require('moment-timezone')
const sgMail = require("@sendgrid/mail");
const allSchema = mongoose.Schema({}, { strict: false });

async function processDemandNote2(req, res) {
    const { orgId } = req.query
    let dbConnection;
    let centralDbConnection;
    try {
        centralDbConnection = await createDatabase("edu-central", process.env.central_mongoDbUrl);
        const orgListModel = centralDbConnection.model("orglists", allSchema, "orglists");
        const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
        dbConnection = await createDatabase(orgData._doc._id.toString(), orgData._doc.connUri);
        let studentModel = dbConnection.model("students", allSchema);
        let feePlanModel = dbConnection.model("studentfeeplans", allSchema);
        let feeInstallmentModel = dbConnection.model("studentfeeinstallmentplans", allSchema);

        let studentAggregate = [
            {
                $match: {
                    pendingAmount: {
                        $gt: 0
                    },
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "studentRegId",
                    foreignField: "regId",
                    as: "studentsData",
                }
            },
            {
                $unwind: {
                    path: "$studentsData",
                    "preserveNullAndEmptyArrays": true
                }
            },
            {
                $group: {
                    _id: "0",
                    data: {
                        $push: {
                            regId: "$studentsData.regId",
                            feePlanId: "$_id",
                            studentName: { $concat: ["$studentsData.firstName", " ", "$studentsData.lastName"] },
                            totalFees: "$plannedAmount",
                            paidAmnt: "$paidAmount",
                            pendAmnt: "$pendingAmount"
                        }
                    }
                }
            },
            {
                $project: {
                    data: "$data",
                }
            }
        ]
        let aggregatedData = await feePlanModel.aggregate(studentAggregate)

        for (let i = 0; i < aggregatedData[0].data.length; i++) {
            let element = aggregatedData[0].data[i];
            let installmentData = []
            await feeInstallmentModel.find({ feePlanId: element.feePlanId }, (err, result) => {
                if (result.length == 0) { }
                else {
                    for (let j = 0; j < result.length; j++) {
                        installmentData.push({
                            "serialNo": j + 1,
                            "label": result[j]._doc.label,
                            "percentage": result[j]._doc.percentage,
                            "term": result[j]._doc.plannedAmountBreakup[0].title,
                            "dueDate": result[j]._doc.dueDate,
                            "fineDate": result[j]._doc.lateFeeStartDate,
                            "plannedAmt": result[j]._doc.plannedAmount,
                            "paidAmt": result[j]._doc.paidAmount,
                            "pendingAmt": result[j]._doc.pendingAmount
                        })
                    }
                }
            })
            element.termwiseBreakup = installmentData

        }

        res.send({
            message: 'success',
            data: aggregatedData[0].data,
            records: aggregatedData[0].data.length
        })
    }
    catch (err) {
        console.log("err", err)
    }
    finally {
    }
}
async function processDemandNote(req, res) {
    const { orgId } = req.query
    let dbConnection;
    let centralDbConnection;
    try {
        centralDbConnection = await createDatabase("edu-central", process.env.central_mongoDbUrl);
        const orgListModel = centralDbConnection.model("orglists", allSchema, "orglists");
        const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
        dbConnection = await createDatabase(orgData._doc._id.toString(), orgData._doc.connUri);
        let studentModel = dbConnection.model("students", allSchema);
        let feePlanModel = dbConnection.model("studentfeeplans", allSchema);
        let programPlanModel = dbConnection.model('programplans', allSchema)
        let feeInstallmentModel = dbConnection.model("studentfeeinstallmentplans", allSchema);
        let feeMapModel = dbConnection.model("studentfeesmaps", allSchema);
        let guardianModel = dbConnection.model("guardians", allSchema);
        let settingsModel = dbConnection.model("settings", allSchema)
        let reminderModel = dbConnection.model("reminderplans", allSchema);
        let reminderData = await reminderModel.find({});
        let demandnoteDay = reminderData[0]._doc.scheduleDetails[0].days;
        let todayDate = moment().format('DD/MM/YYYY')
        let demandNoteDate = moment(new Date(`2021/06/${demandnoteDay}`)).utcOffset("GMT-0530").format('DD/MM/YYYY')
        console.log(demandnoteDay, todayDate, demandNoteDate);

        let studData = await studentModel.find({})
        let settingsData = await settingsModel.find({})
        let demandNoteData = []
        // for (let i = 0; i < studData.length; i++) {
        for (let i = 0; i < 20; i++) {
            let installmentData = []
            let element = studData[i];
            let programPlanData = await programPlanModel.findOne({ _id: element._doc.programPlanId });
            let feePlanData = await feePlanModel.findOne({ studentRegId: element._doc.regId })
            let feeMapData = await feeMapModel.findOne({ studentId: element._doc._id });
            let guardianData = await guardianModel.findOne({})
            // let emailCommunicationRefIds = guardianData._doc.email !== "" ? guardianData._doc.email :
            //     (element._doc.parentEmail !== "" ? element._doc.parentEmail : element._doc.email);
            let emailCommunicationRefIds = "jayanthinathan.c@zenqore.com"
            let academicObj = settingsData[0]._doc.instituteDetails.academicYear
            let academicYear = academicObj.startYear + '-' + String(academicObj.endYear).slice(2)

            if (feePlanData && feePlanData._doc.pendingAmount > 0 && programPlanData && programPlanData._doc.academicYear == academicYear) {
                let data = {}
                data.studentName = element._doc.firstName + ' ' + element._doc.lastName
                data.regId = element._doc.regId
                data.parentEmail = emailCommunicationRefIds
                data.plannedAmt = feePlanData._doc.plannedAmount
                data.paidAmt = feePlanData._doc.paidAmount
                data.pendingAmt = feePlanData._doc.pendingAmount
                // if (data.paidAmt !== data.pendingAmt) {
                await feeInstallmentModel.find({ feePlanId: feePlanData._doc._id }, async (err, result) => {
                    if (result.length == 0) { }
                    else {
                        for (let j = 0; j < result.length; j++) {
                            installmentData.push({
                                "serialNo": j + 1,
                                "label": result[j]._doc.label,
                                "percentage": result[j]._doc.percentage,
                                "term": result[j]._doc.plannedAmountBreakup[0].title,
                                "dueDate": result[j]._doc.dueDate,
                                "fineDate": result[j]._doc.lateFeeStartDate,
                                "plannedAmt": result[j]._doc.plannedAmount,
                                "paidAmt": result[j]._doc.paidAmount,
                                "pendingAmt": result[j]._doc.pendingAmount
                            })
                        }
                        data.termwiseBreakup = installmentData
                        let demandBreakup = []
                        await installmentData.map(async item => {
                            if ((item.pendingAmt > 0 && moment(new Date(item.fineDate)).isBefore()) ||
                                ((moment(new Date(item.fineDate)).format('MM') == moment(new Date()).format('MM')) && item.pendingAmt > 0)) {
                                demandBreakup.push(item)
                            }
                        })
                        data.demandBreakup = demandBreakup
                    }
                })
                demandNoteData.push(data)
            }
        }
        res.send({
            message: 'success',
            data: demandNoteData,
            records: demandNoteData.length
        })
    }
    catch (err) {
        console.log("err", err)
    }
    finally {
    }
}

async function sendMail(emails, emailTemplate, settingsData) {
    let sgKey = settingsData.emailServer[0].apiKey
    sgMail.setApiKey(sgKey);
    let msg = {
        // to: parentEmail,
        to: emails, // Change to your recipient
        from: settingsData.emailServer[0].emailAddress, // Change to your verified sender
        subject: "ZQ EDU-Demand Note",
        html: emailTemplate,
        attachments: [],
    };
    sgMail
        .send(msg)
        .then(() => {
            console.log("Demand Note Email has been sent");
            var obj = {
                success: true,
            };
            return true
        })
        .catch((error) => {
            console.log("error", error);
            var obj = {
                success: false,
            };
        });
}

async function getNextId(result) {
    let txnData = {
        transactionType: "eduFees",
        transactionSubType: "demandNote",
        transactionPattern: {
            txnCode: "DN",
            txnCodePeriodSeparator: "_",
            period: "YYYY-YY",
            periodDigitSeparator: "_",
            noOfDigits: 3,
        },
    };
    const {
        transactionType,
        transactionSubType,
        transactionPattern: {
            txnCode,
            txnCodePeriodSeparator,
            period,
            periodDigitSeparator,
            noOfDigits,
        },
    } = txnData;
    const type = txnCode;
    var date = new Date();
    let financialYear = getDates(period, date);
    var month = date.getMonth();
    var finYear = "";
    if (month > 2) {
        var current = date.getFullYear();
        var prev = Number(date.getFullYear()) + 1;
        prev = String(prev).substr(String(prev).length - 2);
        finYear = `${current}-${prev}`;
    } else {
        var current = date.getFullYear();
        current = String(current).substr(String(current).length - 2);
        var prev = Number(date.getFullYear()) - 1;
        finYear = `${prev}-${current}`;
    }
    let initial = `${type}${txnCodePeriodSeparator}${financialYear}${periodDigitSeparator}${padLeft(
        1,
        noOfDigits
    )}`;
    let dataArr = [];
    let check;
    let finalVal;
    const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
    let regexVariable =
        txnCodePeriodSeparator === periodDigitSeparator
            ? txnCodePeriodSeparator
            : `${txnCodePeriodSeparator}${periodDigitSeparator}`;
    let regex = new RegExp(regexVariable);
    if (!result || !result.length) {
        return initial;
    } else {
        result.forEach((el) => {
            if (el["displayName"]) {
                let filStr = el["displayName"].split(regex);
                let typeStr = filStr[0];
                let typeYear = filStr[1];
                if (typeStr === type && typeYear == financialYear) {
                    check = true;
                    dataArr.push(el["displayName"]);
                }
            }
        });
        if (!check) {
            const perviousPattern = await getPatternFromChangeHistory();
            return initial;
        }
        let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split(regex);
        let lastCountNo = Number(lastCount[2]) + 1;
        lastCountNo = padLeft(lastCountNo, noOfDigits);
        lastCount[2] = lastCountNo;
        finalVal = `${type}${txnCodePeriodSeparator}${financialYear}${periodDigitSeparator}${lastCount[2]}`;
        return finalVal;
    }
}

function getDates(dateFormat, date) {
    let parsedDate;
    const dateFormats = [
        "YYYY-YY",
        "YY-YY",
        "YYYY",
        "YY",
        "MM-YY",
        "Mmm-YY",
        "ddmmyyyy",
        "ddmmyy",
        "ddMmmyyyy",
    ];
    var mL = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    var mS = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "June",
        "July",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
    ];
    switch (dateFormat) {
        case dateFormats[0]:
            var date = new Date();
            var month = date.getMonth();
            var finYear = "";
            if (month > 2) {
                var current = date.getFullYear();
                var prev = Number(date.getFullYear()) + 1;
                prev = String(prev).substr(String(prev).length - 2);
                finYear = `${current}-${prev}`;
            } else {
                var current = date.getFullYear();
                current = String(current).substr(String(current).length - 2);
                var prev = Number(date.getFullYear()) - 1;
                finYear = `${prev}-${current}`;
            }
            parsedDate = finYear;
            break;
        case dateFormats[1]:
            var date = new Date();
            var month = date.getMonth();
            var finYear = "";
            if (month > 2) {
                var current = date.getFullYear();
                current = String(current).substr(String(current).length - 2);
                var prev = Number(date.getFullYear()) + 1;
                prev = String(prev).substr(String(prev).length - 2);
                finYear = `${current}-${prev}`;
            } else {
                var current = date.getFullYear();
                current = String(current).substr(String(current).length - 2);
                var prev = Number(date.getFullYear()) - 1;
                prev = String(prev).substr(String(prev).length - 2);
                finYear = `${prev}-${current}`;
            }
            parsedDate = finYear;
            break;
        case dateFormats[2]:
            var date = new Date();
            var current = date.getFullYear();
            parsedDate = current;
            break;
        case dateFormats[3]:
            var date = new Date();
            var current = date.getFullYear();
            current = String(current).substr(String(current).length - 2);
            parsedDate = current;
            break;
        case dateFormats[4]:
            var date = new Date();
            var current = date.getFullYear();
            current = String(current).substr(String(current).length - 2);
            var month = date.getMonth() + 1;
            month = month < 10 ? `0${month}` : month;
            parsedDate = `${month}-${current}`;
            break;
        case dateFormats[5]:
            var date = new Date();
            var current = date.getFullYear();
            current = String(current).substr(String(current).length - 2);
            var month = date.getMonth();
            month = mS[month];
            parsedDate = `${month}-${current}`;
            break;
        case dateFormats[6]:
            var date = new Date();
            var current = date.getFullYear();
            var month = date.getMonth() + 1;
            month = month < 10 ? `0${month}` : month;
            parsedDate = `${date.getDate()}${month}${current}`;
            break;
        case dateFormats[7]:
            var date = new Date();
            var current = date.getFullYear();
            current = String(current).substr(String(current).length - 2);
            var month = date.getMonth() + 1;
            month = month < 10 ? `0${month}` : month;
            parsedDate = `${date.getDate()}${month}${current}`;
            break;
        case dateFormats[8]:
            var date = new Date();
            var current = date.getFullYear();
            var month = date.getMonth();
            month = mS[month];
            parsedDate = `${date.getDate()}${month}${current}`;
            break;
    }
    return parsedDate;
}

function padLeft(nr, n, str) {
    return Array(n - String(nr).length + 1).join(str || "0") + nr;
}
async function getPatternFromChangeHistory(connection) { }



module.exports = {
    processDemandNote: processDemandNote
}