const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const transactionCollectionName = "transactions";
const feeLedgerCollectionName = "feesledgers";
const StudentSchema = require("../models/studentModel");
const FeeTypeSchema = require("../models/feeTypeModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const GuardianSchema = require("../models/guardianModel");
const FeeManagerSchema = require("../models/feesManagerModel");
const feesLedgerSchema = require("../models/feesLedgerModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
var _ = require("lodash");
var moment = require("moment");

async function createReports(req, res) {
    var dbUrl = req.headers.resource;
    console.log('dburl', dbUrl)
    const { type } = req.params;
    const { orgId, page, limit, sortType, sortKey, searchKey } = req.query;
    let dbConnection = await createDatabase(orgId, dbUrl);
    var withoutSchema = mongoose.Schema({}, { strict: false });
    var transactionModel = await dbConnection.model(
        transactionCollectionName,
        withoutSchema,
        transactionCollectionName
    );
    var feeledgerModel = await dbConnection.model(
        feeLedgerCollectionName,
        feesLedgerSchema,
        feeLedgerCollectionName
    );
    var getDatasDetails = await transactionModel
        .find({ transactionSubType: type })
        .sort({ displayName: -1 });
    var paginationDatas = {};
    let feeTypeModel = await dbConnection.model("feeTypes", FeeTypeSchema);
    let studentModel = await dbConnection.model("students", StudentSchema);
    let programPlanSchema = await dbConnection.model(
        "programplans",
        ProgramPlanSchema
    );
    let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
    let feeMapModel = dbConnection.model(
        "studentfeesmaps",
        StudentFeeMapSchema
    );
    let guardianModel = dbConnection.model("guardian", GuardianSchema);
    var responseData = [];
    var modifiedType = type.toLowerCase();
    if (modifiedType == "demandnote") {
        if (page != undefined || limit != undefined) {
            paginationDatas = await Paginator(getDatasDetails, page, limit);
        } else {
            paginationDatas = await Paginator(
                getDatasDetails,
                1,
                getDatasDetails.length
            );
        }
        var transactionDetails = paginationDatas.data;
        for (let i = 0; i < transactionDetails.length; i++) {
            const element = transactionDetails[i]._doc;
            var fbBreakUp = [];
            var dnStatus = element["status"];
            for (let j = 0; j < element["feesLedgerIds"].length; j++) {
                const fbElts = element["feesLedgerIds"][j];
                const feeLedgerDet = await feeledgerModel.findOne({ _id: fbElts });
                var dnCollection = await feeledgerModel.find({
                    primaryTransaction: feeLedgerDet._doc["primaryTransaction"],
                    transactionSubType: "feePayment",
                });
                dnStatus =
                    dnCollection.length > 0
                        ? dnCollection[dnCollection.length - 1]._doc["status"]
                        : element["status"];
                var amount = 0;
                var description = "";
                for (let k = 0; k < element["data"]["feesBreakUp"].length; k++) {
                    const fbu = element["data"]["feesBreakUp"][k];
                    if (feeLedgerDet._doc["feeTypeCode"] == fbu["feeTypeCode"]) {
                        // const ftDet = await feeTypeModel.findOne({
                        //     displayName: fbu["feeTypeCode"],
                        // });
                        // if (ftDet != null) {
                            amount = fbu["amount"];
                            description = fbu["feeType"]
                        // }
                    }
                }
                fbBreakUp.push({
                    description: description,
                    amount: amount,
                    pendingAmount: feeLedgerDet._doc["pendingAmount"],
                    dueAmount: feeLedgerDet._doc["dueAmount"],
                    status: dnStatus,
                });
            }
            var totalAmt = 0;
            var totalPendingAmt = 0;
            var totalDueAmt = 0;
            for (let totalDN = 0; totalDN < fbBreakUp.length; totalDN++) {
                const fbBreakUpElt = fbBreakUp[totalDN];
                totalAmt = totalAmt + Number(fbBreakUpElt["amount"]);
                totalPendingAmt =
                    totalPendingAmt + Number(fbBreakUpElt["pendingAmount"]);
                totalDueAmt = totalDueAmt + Number(fbBreakUpElt["dueAmount"]);
            }
            fbBreakUp.push({
                description: "Total",
                amount: totalAmt,
                pendingAmount: totalPendingAmt,
                dueAmount: totalDueAmt,
                status: dnStatus,
            });
            const studentDet = await studentModel.findOne({
                _id: element["studentId"],
            });

            let dnReportElt = {
                data: {
                    leadId: null,
                    students: [
                        {
                            studentName: element["studentName"],
                            regId: element["studentRegId"],
                            class: element.data.class,
                            academicYear: element.data.academicYear,
                            admittedOn:
                                studentDet != null
                                    ? await onDateFormat(studentDet["admittedOn"])
                                    : null, // student collection
                            studentFeesMappingId:
                                studentDet != null ? studentDet["feeStructureId"] : null, // student collection
                            dueDate: await onDateFormat(element.dueDate),
                            studentRefId: element["studentId"], //student collection mongoid
                            feesBreakup: fbBreakUp,
                        },
                    ],
                    totalFees: element["amount"],
                },
                ledgerRefIds: element["feesLedgerIds"],
                _id: element["_id"],
                displayName: element["displayName"],
                entityId: orgId,
                todayDate: await onDateFormat(element["transactionDate"]),
                parentEmail: element["emailCommunicationRefIds"]["0"],
                transactionType: element["transactionType"],
                transactionSubType: element["transactionSubType"],
                totalFees: element["amount"],
                createdBy: element["createdBy"],
                updatedBy: element["createdBy"],
                status: dnStatus,
                paymentStatus: element["status"],
                additionalDetails: {
                    date: await onDateFormat(element["createdAt"]),
                    transactionId: element["_id"],
                    remarks: "Demand Note Sent",
                },
                createdAt: await onDateFormat(element["createdAt"]),
                updatedAt: await onDateFormat(element["updatedAt"]),
                __v: element["__v"],
            };

            responseData.push(dnReportElt);
        }
    } else if (modifiedType == "feepayment") {
        if (page != undefined || limit != undefined) {
            paginationDatas = await Paginator(getDatasDetails, page, limit);
        } else {
            paginationDatas = await Paginator(
                getDatasDetails,
                1,
                getDatasDetails.length
            );
        }
        var transactionDetails = paginationDatas.data;
        for (let i = 0; i < transactionDetails.length; i++) {
            const element = transactionDetails[i]._doc;
            var fbBreakUp = [];
            let fpElt = {};
            for (let j = 0; j < element["feesLedgerIds"].length; j++) {
                const fbElts = element["feesLedgerIds"][j];
                var feeLedgerDet = await feeledgerModel.findOne({ _id: fbElts });
                if (feeLedgerDet != null) {
                    if (j == 0) {
                        fpElt["studentName"] = feeLedgerDet._doc["studentName"];
                        fpElt["regId"] = feeLedgerDet._doc["studentRegId"];
                        fpElt["academicYear"] = feeLedgerDet._doc["academicYear"];
                        fpElt["classBatch"] = feeLedgerDet._doc["class"];
                        fpElt["DemandId"] = feeLedgerDet._doc["primaryTransaction"];
                        fpElt["description"] = [];
                    }
                    const ftDet = await feeTypeModel.findOne({
                        displayName: feeLedgerDet._doc["feeTypeCode"],
                    });
                    var paymentDet = await transactionModel.findOne({
                        _id: feeLedgerDet._doc["transactionId"],
                    });
                    fpElt["description"].push({
                        name: ftDet != null ? ftDet["title"] : null,
                        due: element["amount"],
                        paid: feeLedgerDet._doc["paidAmount"],
                        paidDate: await onDateFormat(element["transactionDate"]),
                        balance: feeLedgerDet._doc["pendingAmount"],
                        status: feeLedgerDet._doc["status"],
                        txnId:
                            paymentDet != null ? paymentDet._doc.paymentTransactionId : "-",
                    });
                }
            }
            var totalDue = 0;
            var totalPaid = 0;
            var totalBalance = 0;
            if (fpElt.description != undefined) {
                for (
                    let totalDN = 0;
                    totalDN < fpElt["description"].length;
                    totalDN++
                ) {
                    const fbBreakUpElt = fpElt["description"][totalDN];
                    totalDue = totalDue + Number(fbBreakUpElt["due"]);
                    totalPaid = totalPaid + Number(fbBreakUpElt["paid"]);
                    totalBalance = totalBalance + Number(fbBreakUpElt["balance"]);
                }
                fpElt["description"].push({
                    name: "Total",
                    due: totalDue,
                    paid: totalPaid,
                    paidDate: "-",
                    balance: totalBalance,
                    status: element["status"],
                    txnId: "-",
                });
                responseData.push(fpElt);
            }
        }
    } else if (modifiedType == "feependingold") {
        const aggregatePipeline = [
            // { $match: { primaryTransaction: { $in: txnData.relatedTransactions } } },
            { $sort: { updatedAt: 1 } },
            {
                $group: {
                    _id: { programPlan: "$programPlan", studentRegId: "$studentRegId" },
                    totalDue: { $sum: "$dueAmount" },
                    totalPaid: { $sum: "$paidAmount" },
                    studentName: { $first: "$studentName" },
                    feeLedgerCount: { $sum: 1 },
                    details: {
                        $push: {
                            studentRegId: "$studentRegId",
                            studentName: "$studentName",
                            feeTypeCode: "$feeTypeCode",
                            dueAmount: "$dueAmount",
                            paidAmount: "$paidAmount",
                        },
                    },
                },
            },
            {
                $project: {
                    // projection
                    _id: 0,
                    programPlan: "$_id.programPlan",
                    studentRegId: "$_id.studentRegId",
                    studentName: "$studentName",
                    totalDue: { $round: ["$totalDue", 2] },
                    totalPaid: { $round: ["$totalPaid", 2] },
                    pendingAmount: { $subtract: ["$totalDue", "$totalPaid"] },
                    feeLedgerCount: "$feeLedgerCount",
                    details: "$details",
                },
            },
        ]; // aggregatePipeline
        const studPendingFeePipeline = [
            { $sort: { updatedAt: 1 } },
            {
                $group: {
                    _id: { studentRegId: "$studentRegId" },
                    totalDue: { $sum: "$dueAmount" },
                    totalPaid: { $sum: "$paidAmount" },
                    studentName: { $first: "$studentName" },
                    feeLedgerCount: { $sum: 1 },
                    details: {
                        $push: {
                            studentRegId: "$studentRegId",
                            studentName: "$studentName",
                            feeTypeCode: "$feeTypeCode",
                            dueAmount: "$dueAmount",
                            paidAmount: "$paidAmount",
                        },
                    },
                },
            },
            {
                $project: {
                    // projection
                    _id: 0,
                    studentRegId: "$_id.studentRegId",
                    studentName: "$studentName",
                    totalDue: { $round: ["$totalDue", 2] },
                    totalPaid: { $round: ["$totalPaid", 2] },
                    pendingAmount: { $subtract: ["$totalDue", "$totalPaid"] },
                    feeLedgerCount: "$feeLedgerCount",
                    details: "$details",
                },
            },
            { $match: { pendingAmount: { $gt: 0 } } },
        ]; // aggregatePipeline
        let getDatasDetails = await feeledgerModel.aggregate(aggregatePipeline);
        let getPendingStudentDetails = await feeledgerModel.aggregate(
            studPendingFeePipeline
        );
        if (page != undefined || limit != undefined) {
            paginationDatas = await Paginator(getDatasDetails, page, limit);
        } else {
            paginationDatas = await Paginator(
                getDatasDetails,
                1,
                getDatasDetails.length
            );
        }
        var feePendingReport = paginationDatas.data;
        let fpr = {};
        for (let i = 0; i < feePendingReport.length; i++) {
            const element = feePendingReport[i];
            fpr[element.programPlan] =
                fpr[element.programPlan] == undefined ? [] : fpr[element.programPlan];
            fpr[element.programPlan].push(element);
        }
        var fprObjKey = Object.keys(fpr);
        var fprDet = [];
        for (let i = 0; i < fprObjKey.length; i++) {
            var ppDetails = await programPlanSchema.findOne({
                programCode: fprObjKey[i],
            });
            // const studentTotal = await studentModel.find({})
            //   if(i == 0) {
            var fprDetBasic = {
                programPlanId: fprObjKey[i],
                programPlanDisplayName: ppDetails == null ? fprObjKey[i] : ppDetails["displayName"],
                programPlanName: ppDetails == null ? null : ppDetails["title"],
                numberOfStudents: getDatasDetails.length,
                pendingStudents: getPendingStudentDetails.length,
                items: [],
            };
            //   }
            for (let j = 0; j < fpr[fprObjKey[i]].length; j++) {
                const fprInside = fpr[fprObjKey[i]][j];
                fprDetBasic["totalFees"] =
                    fprDetBasic["totalFees"] == undefined
                        ? fprInside["totalDue"]
                        : Number(fprDetBasic["totalFees"]) + Number(fprInside["totalDue"]);
                fprDetBasic["totalFeesCollected"] =
                    fprDetBasic["totalFeesCollected"] == undefined
                        ? fprInside["totalPaid"]
                        : Number(fprDetBasic["totalFeesCollected"]) +
                        Number(fprInside["totalPaid"]);
                fprDetBasic["totalPending"] =
                    fprDetBasic["totalPending"] == undefined
                        ? fprInside["pendingAmount"]
                        : Number(fprDetBasic["totalPending"]) +
                        Number(fprInside["pendingAmount"]);
                fprDetBasic["items"].push({
                    regId: fprInside["studentRegId"],
                    studentName: fprInside["studentName"],
                    programPlanName: ppDetails == null ? null : ppDetails._doc["title"],
                    totalFees: fprInside["totalDue"],
                    totalPaid: fprInside["totalPaid"],
                    totalPending: fprInside["pendingAmount"],
                });
            }
            fprDet.push(fprDetBasic);
        }
        responseData = fprDet;
        // feeledgerModel
    } else if (modifiedType == "feepending") {
        const ppDatas = await programPlanSchema.find({}).sort({ _id: -1 });
        var getDatasDetails = []
        const studentDetails = await studentModel.find({});
        for (let ppIndex = 0; ppIndex < ppDatas.length; ppIndex++) {
            const ppDatasElt = ppDatas[ppIndex];
            const ST = studentDetails.filter(item => item._doc.programPlanId.toString() == ppDatasElt["_id"].toString())
            if (ST.length > 0) {
                getDatasDetails.push(ppDatasElt)
            }
        }
        if (page != undefined || limit != undefined) {
            paginationDatas = await Paginator(getDatasDetails, page, limit);
        } else {
            paginationDatas = await Paginator(
                getDatasDetails,
                1,
                getDatasDetails.length
            );
        }
        var ppDetails = getDatasDetails;
        var statementDetails = [];
        const feeLedgerDetails = await feeledgerModel.find({});
        const fmDetails = await feeManagerSchema.find({});
        for (let i = 0; i < ppDetails.length; i++) {
            const element = ppDetails[i]._doc;
            const fmDet = fmDetails.filter(item => item._doc.programPlanId.toString() == element["_id"].toString())
            const feeLedgerDet = feeLedgerDetails.filter(item => item._doc.programPlan.toString() == element["programCode"].toString())
            const feeLedgerDNDetails = await feeledgerModel.find({ programPlan: element['programCode'], transactionSubType: "demandNote" });
            const feeLedgerFPDetails = await feeledgerModel.find({ programPlan: element['programCode'], transactionSubType: "feePayment", pendingAmount: 0 });
            const studentTotal = studentDetails.filter(item => item._doc.programPlanId.toString() == element["_id"].toString())
            var statementRecord = {
                "programPlanDisplayName": element["displayName"],
                "programPlanId": element["programCode"],
                "programPlanName": element["title"],
                "numberOfStudents": studentTotal.length,
                pendingStudents: Number(studentTotal.length) - Number(feeLedgerFPDetails == null ? 0 : feeLedgerFPDetails.length),
                "PROGRAM FEE": 0,
                "totalFees": 0,
                "totalFeesCollected": 0,
                totalPending: 0,
                items: []
            };
            for (let k = 0; k < fmDet.length; k++) {
                const fmDatas = fmDet[k]._doc;
                statementRecord["PROGRAM FEE"] =
                    Number(statementRecord["PROGRAM FEE"]) +
                    Number(fmDatas.feeDetails.annualAmount);
                statementRecord["totalFees"] = statementRecord["PROGRAM FEE"] * studentTotal.length
            }
            if (feeLedgerDet.length == 0) {
                statementRecord["totalPending"] = statementRecord["PROGRAM FEE"] * studentTotal.length
            }
            var feeAmtObj = {}
            for (let j = 0; j < feeLedgerDet.length; j++) {
                const ledgerElt = feeLedgerDet[j]._doc;
                var feeLedgerDNDet;
                if (ledgerElt["transactionSubType"] == "feePayment") {
                    feeLedgerDNDet = feeLedgerDetails.find(item => item._doc.transactionDisplayName === ledgerElt["primaryTransaction"]);
                }

                var dueAmt =
                    feeLedgerDNDet != undefined
                        ? feeLedgerDNDet._doc["dueAmount"]
                        : ledgerElt["dueAmount"];
                var paidAmt =
                    ledgerElt["paidAmount"] != undefined ? ledgerElt["paidAmount"] : 0;
                statementRecord["totalFeesCollected"] = statementRecord["totalFeesCollected"] + Number(paidAmt);
                statementRecord["totalPending"] =
                    Number(statementRecord["totalFees"]) - Number(statementRecord["totalFeesCollected"]);
                feeAmtObj[ledgerElt['studentId']] = {
                    totalFees: feeAmtObj[ledgerElt['studentId']] != undefined ? Number(statementRecord["totalFees"]) : 0,
                    totalPaid: feeAmtObj[ledgerElt['studentId']] != undefined ? (Number(feeAmtObj[ledgerElt['studentId']]['totalPaid']) + Number(paidAmt)) : paidAmt,
                    totalFeesCollected: feeAmtObj[ledgerElt['studentId']] != undefined ? statementRecord["totalFeesCollected"] : Number(statementRecord["totalFeesCollected"])
                }

            }
            for (let stj = 0; stj < studentTotal.length; stj++) {
                var studDet = studentTotal[stj]._doc

                statementRecord["items"].push({
                    "studentName": `${studDet["firstName"]}${studDet["middleName"] == null ? '' : ' '+studDet["middleName"]} ${studDet["lastName"]}`,
                    regId: studDet["regId"],
                    "programPlanName": element["title"],
                    "totalFees": feeAmtObj['studentId'] != undefined ? feeAmtObj['studentId']['totalFees'] : 0,
                    "totalPaid": feeAmtObj['studentId'] != undefined ? feeAmtObj['studentId']['totalPaid'] : 0,
                    totalPending: feeAmtObj["studentId"] != undefined ? feeAmtObj['studentId']['totalPending'] : 0,
                });
            }
            // console.log('statementRecord', statementRecord['items'].length)
            // if (statementRecord['items'].length > 0) {
            //     for (let fbCalc = 0; fbCalc < statementRecord['items'].length; fbCalc++) {
            //         const fbCalcDet = statementRecord['items'][fbCalc];
            //         // console.log('fbCalcDet',fbCalcDet)
            //         var tp = fbCalcDet['totalPaid'] != undefined ? fbCalcDet['totalPaid'] : 0
            //         var tpend = fbCalcDet['totalPending'] != undefined ? fbCalcDet['totalPending'] : 0
            //         statementRecord["totalFeesCollected"] = Number(statementRecord["totalFeesCollected"]) + Number(tp);
            //         statementRecord["totalPending"] =
            //             Number(statementRecord["totalPending"]) + Number(tpend);
            //     }
            // }
            statementDetails.push(statementRecord);
        }
        responseData = statementDetails;
    } else if (modifiedType == "studentstatement") {
        // const getDatasDetails = await studentModel.find({}).sort({ _id: -1 });
        const getDatasDetails = await studentModel.find({});
        if (page != undefined || limit != undefined) {
            paginationDatas = await Paginator(getDatasDetails, page, limit);
        } else {
            paginationDatas = await Paginator(
                getDatasDetails,
                1,
                getDatasDetails.length
            );
        }
        var studentDet = paginationDatas.data;
        var statementDetails = [];
        for (let i = 0; i < studentDet.length; i++) {
            const element = studentDet[i]._doc;
            const feeLedgerDet = await feeledgerModel.find({
                studentId: element["_id"],
                transactionSubType: "feePayment",
            });
            var ppDetails = await programPlanSchema.findOne({
                _id: element["programPlanId"],
            });
            var statementRecord = {
                "REGISTRATION ID": element["regId"],
                "STUDENT NAME": `${element["firstName"]} ${element["lastName"]}`,
                "CLASS/BATCH": ppDetails._doc["title"],
                "ADMISSION DATE": await onDateFormat(element["admittedOn"]),
                items: [],
            };
            for (let j = 0; j < feeLedgerDet.length; j++) {
                const ledgerElt = feeLedgerDet[j]._doc;
                const ftDet = await feeTypeModel.findOne({
                    displayName: ledgerElt["feeTypeCode"],
                });

                const feeLedgerDNDet = await feeledgerModel.findOne({
                    transactionDisplayName: ledgerElt["primaryTransaction"],
                    studentId: element["_id"],
                });
                statementRecord["items"].push({
                    "DEMAND NOTE DATE":
                        feeLedgerDNDet._doc["transactionSubType"] == "demandNote"
                            ? await onDateFormat(feeLedgerDNDet._doc["transactionDate"])
                            : "NA",
                    "PAYMENT DATE":
                        ledgerElt["transactionSubType"] == "demandNote"
                            ? "NA"
                            : await onDateFormat(ledgerElt["transactionDate"]),
                    PARTICULARS: ftDet != null ? ftDet["title"] : null,
                    "DUE AMOUNT":
                        feeLedgerDNDet._doc["dueAmount"] != undefined
                            ? feeLedgerDNDet._doc["dueAmount"]
                            : null,
                    "PAID AMOUNT": ledgerElt["paidAmount"],
                    BALANCE: ledgerElt["pendingAmount"],
                    // "Ledger Id": ledgerElt["_id"],
                    // "Demond Note Id": feeLedgerDNDet._doc["_id"]
                });
            }
            statementDetails.push(statementRecord);
        }
        responseData = statementDetails;
    } else if (modifiedType == "programplanstatement") {
        const getDatasDetails = await programPlanSchema.find({}).sort({ _id: -1 });
        if (page != undefined || limit != undefined) {
            paginationDatas = await Paginator(getDatasDetails, page, limit);
        } else {
            paginationDatas = await Paginator(
                getDatasDetails,
                1,
                getDatasDetails.length
            );
        }
        var ppDetails = paginationDatas.data;
        var statementDetails = [];
        const feeLedgerDetails = await feeledgerModel.find({});
        const fmDetails = await feeManagerSchema.find({});
        const studentDetails = await studentModel.find({});
        for (let i = 0; i < ppDetails.length; i++) {
            const element = ppDetails[i]._doc;
            const fmDet = fmDetails.filter(item => item._doc.programPlanId.toString() == element["_id"].toString())
            const feeLedgerDet = feeLedgerDetails.filter(item => item._doc.programPlan.toString() == element["programCode"].toString())
            const studentTotal = studentDetails.filter(item => item._doc.programPlanId.toString() == element["_id"].toString())
            var statementRecord = {
                "PROGRAM NAME": element["displayName"],
                "PROGRAM CODE": element["programCode"],
                "PROGRAM FEE": 0,
                "TOTAL STUDENTS": studentTotal.length,
                "TOTAL FEES": 0,
                "TOTAL FEES COLLECTED": 0,
                BALANCE: 0,
                items: [],
            };
            for (let k = 0; k < fmDet.length; k++) {
                const fmDatas = fmDet[k]._doc;
                statementRecord["PROGRAM FEE"] =
                    Number(statementRecord["PROGRAM FEE"]) +
                    Number(fmDatas.feeDetails.annualAmount);
                statementRecord["TOTAL FEES"] = statementRecord["PROGRAM FEE"] * studentTotal.length
            }
            if (feeLedgerDet.length == 0) {
                statementRecord["BALANCE"] = statementRecord["PROGRAM FEE"] * studentTotal.length
            }
            for (let j = 0; j < feeLedgerDet.length; j++) {
                const ledgerElt = feeLedgerDet[j]._doc;
                const ftDet = await feeTypeModel.findOne({
                    displayName: ledgerElt["feeTypeCode"],
                });
                var feeLedgerDNDet;
                if (ledgerElt["transactionSubType"] == "feePayment") {
                    feeLedgerDNDet = feeLedgerDetails.find(item => item._doc.transactionDisplayName === ledgerElt["primaryTransaction"]);
                }
                var dueAmt =
                    feeLedgerDNDet != undefined
                        ? feeLedgerDNDet._doc["dueAmount"]
                        : ledgerElt["dueAmount"];
                var addDue =
                    ledgerElt["transactionSubType"] == "feePayment" ? dueAmt : 0;
                var paidAmt =
                    ledgerElt["paidAmount"] != undefined ? ledgerElt["paidAmount"] : 0;
                // statementRecord["TOTAL FEES"] = Number(statementRecord["TOTAL FEES"]) + Number(addDue)
                // statementRecord["TOTAL FEES"] =
                //   Number(statementRecord["TOTAL FEES"]) * Number(studentTotal.length);
                statementRecord["TOTAL FEES COLLECTED"] = statementRecord["TOTAL FEES COLLECTED"] + Number(paidAmt);
                // statementRecord["BALANCE"] = Number(statementRecord["BALANCE"]) + (ledgerElt['transactionSubType'] == "demandNote" ? 0 : (dueAmt - paidAmt))
                statementRecord["BALANCE"] =
                    Number(statementRecord["TOTAL FEES"]) - Number(statementRecord["TOTAL FEES COLLECTED"]);
                statementRecord["items"].push({
                    "TRANSACTION NO": ledgerElt["transactionDisplayName"],
                    "DEMAND NOTE NO": ledgerElt["primaryTransaction"],
                    "TRANSACTION DATE": await onDateFormat(ledgerElt["transactionDate"]),
                    "STUDENT NAME": ledgerElt["studentName"],
                    PARTICULARS: ftDet != null ? ftDet["title"] : null,
                    "DUE AMOUNT": dueAmt,
                    "PAID AMOUNT": paidAmt,
                    BALANCE: ledgerElt["pendingAmount"],
                });
            }
            statementDetails.push(statementRecord);
        }
        responseData = statementDetails;
    } else if (modifiedType == "defaulterreport") {

        const sfmDatas = await feeMapModel.find({}).sort({ _id: -1 });
        var getDatasDetails = []
        for (let sfm = 0; sfm < sfmDatas.length; sfm++) {
            const sfmElts = sfmDatas[sfm]._doc;
            for (let fsElt = 0; fsElt < sfmElts['feeStructureId'].length; fsElt++) {
                const psElt = sfmElts['feeStructureId'][fsElt]['paymentSchedule'];
                for (let psI = 0; psI < psElt.length; psI++) {
                    const psEltObj = psElt[psI];
                    var todayDate = await momentDateFormate(String(new Date()))
                    var scheduleDate = await momentDateFormate(String(new Date(psEltObj['dueDate'])))
                    if (!moment(scheduleDate).isAfter(todayDate)) {
                        getDatasDetails.push({
                            ...sfmElts,
                            scheduleDate: scheduleDate
                        })
                    }
                }

            }
        }
        var statementDetails = [];
        if (getDatasDetails.length > 0) {
            if (page != undefined || limit != undefined) {
                paginationDatas = await Paginator(getDatasDetails, page, limit);
            } else {
                paginationDatas = await Paginator(
                    getDatasDetails,
                    1,
                    getDatasDetails.length
                );
            }
            var studentDet = paginationDatas.data;
            for (let i = 0; i < studentDet.length; i++) {
                const element = studentDet[i];
                const feeLedgerDet = await feeledgerModel.findOne({
                    studentId: element["_id"],
                    transactionSubType: "demandNote",
                });
                if (feeLedgerDet != null) {
                    var ppDetails = await programPlanSchema.findOne({
                        _id: element["programPlanId"],
                    });
                    var guardianDetails = [];
                    var parentName = undefined;
                    for (let j = 0; j < element["guardianDetails"].length; j++) {
                        var guardianDet = await guardianModel.findOne({
                            _id: element["guardianDetails"][j],
                        });
                        guardianDetails.push(guardianDet);
                        if (String(guardianDet["relation"]).toLowerCase() == "parent") {
                            parentName = guardianDet["firstName"];
                        }
                    }
                    const feePaymentLedgerDet = await feeledgerModel.find({
                        primaryTransaction: feeLedgerDet._doc["transactionDisplayName"],
                        transactionSubType: "feePayment",
                    });
                    var paidAmt = 0;
                    var pendingAmt = 0;
                    var paymentRecord = [];
                    var dueRed = feeLedgerDet._doc["dueAmount"];
                    if (feePaymentLedgerDet != null) {
                        for (let k = 0; k < feePaymentLedgerDet.length; k++) {
                            const feePaymentData = feePaymentLedgerDet[k]._doc;
                            paidAmt = Number(paidAmt) + Number(feePaymentData.paidAmount);
                            paymentRecord.push(feePaymentData);
                        }
                    }
                    var year = new Date(
                        String(element['scheduleDate'])
                    ).getFullYear()
                    var month = new Date(String(element['scheduleDate'])).getMonth()
                    var date = new Date(String(element['scheduleDate'])).getDate()
                    var daysAgo = moment([year, month, date]).fromNow(true);
                    var balance =
                        paymentRecord.length > 0
                            ? paymentRecord[paymentRecord.length - 1]["pendingAmount"]
                            : feeLedgerDet._doc["dueAmount"];
                    var statementRecord = {
                        "REGISTRATION ID": element["regId"],
                        "STUDENT NAME": `${element["firstName"]} ${element["lastName"]}`,
                        "CLASS/BATCH": ppDetails._doc["title"],
                        "ADMISSION DATE": await onDateFormat(element["admittedOn"]),
                        studentName: `${element["firstName"]} ${element["lastName"]}`,
                        regId: element["regId"],
                        parentName:
                            parentName == undefined
                                ? guardianDetails["0"]["firstName"]
                                : parentName,
                        programPlan: ppDetails._doc["programCode"],
                        displayName: feeLedgerDet._doc["transactionDisplayName"],
                        demandNoteId: feeLedgerDet._doc["transactionDisplayName"],
                        demandNoteDate: await onDateFormat(
                            feeLedgerDet._doc["transactionDate"]
                        ),
                        totalFees: feeLedgerDet._doc["dueAmount"],
                        feePaid: paidAmt,
                        feeBalance: balance,
                        pendingSince:
                            balance == 0 ? "-" : daysAgo == "a day" ? "1 day" : daysAgo,
                    };
                    statementDetails.push(statementRecord);
                }
            }
        }
        responseData = statementDetails;
    }
    res.status(200).send({
        status: "success",
        message: `${type} reports`,
        data: responseData,
        currentPage:
            paginationDatas.page != undefined ? paginationDatas.page : null,
        perPage:
            paginationDatas.perPage != undefined ? paginationDatas.perPage : null,
        nextPage:
            paginationDatas.next_page != undefined ? paginationDatas.next_page : null,
        totalRecord:
            paginationDatas.total != undefined ? paginationDatas.total : null,
        totalPages:
            paginationDatas.total_pages != undefined
                ? paginationDatas.total_pages
                : null,
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
async function momentDateFormate(d) {
    return [new Date(String(d)).getFullYear(), new Date(String(d)).getMonth() + 1, new Date(String(d)).getDate()]
}
async function momentDateFormateTest(d) {
    return [new Date(String(d)).getFullYear() - 1, new Date(String(d)).getMonth() + 1, new Date(String(d)).getDate()]
}
function Paginator(items, page, per_page) {
    let current_page = page;
    let perPage = per_page;
    (offset = (current_page - 1) * perPage),
        (paginatedItems = items.slice(offset).slice(0, perPage)),
        (total_pages = Math.ceil(items.length / perPage));
    return {
        page: Number(current_page),
        perPage: Number(perPage),
        pre_page: Number(current_page) - 1 ? Number(current_page) - 1 : null,
        next_page:
            total_pages > Number(current_page) ? Number(current_page) + 1 : null,
        total: items.length,
        total_pages: total_pages,
        data: paginatedItems,
    };
}

module.exports = {
    createReports: createReports,
};
