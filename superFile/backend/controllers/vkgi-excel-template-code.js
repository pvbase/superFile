const orgListSchema = require("../models/orglists-schema");
const { createDatabase, createConnection } = require("../utils/db_creation");
const feeplanschema = require("../models/feeplanModel");
const StudentSchema = require("../models/studentModel");
const sgMail = require("@sendgrid/mail");
const mongoose = require("mongoose");

const HummusRecipe = require("hummus-recipe");
const Promise = require("bluebird");
const XlsxPopulate = require("xlsx-populate");
XlsxPopulate.Promise = Promise;
const fs = require("fs");

const transactionCollectionName = "transactions";
const feeplanInstallmentschema = require("../models/feeplanInstallment");
var moment = require("moment");
const axios = require("axios");
const xlsx = require("xlsx");
var campusSchema = require("../models/campusModel");
const transactionsSchema = require("../models/transactionsModel");
const settingsSchema = require("../models/settings/settings");

const ApplicationSchema = require("../models/ken42/applicationModel");
const FeeTypeSchema = require("../models/feeTypeModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const GuardianSchema = require("../models/guardianModel");
var CryptoJS = require("crypto-js");

async function checkCampusData(req, res) {
    const { orgId } = req.query;
    let dbConnection;
    let centralDbConnection;
    centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");

    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
    dbConnection = await createDatabase(orgData._doc._id.toString(), orgData._doc.connUri);

    const campusModel = dbConnection.model("campuses", campusSchema, "campuses");
    const feePlanModel = dbConnection.model("studentfeeplans", feeplanschema);
    const feeInstallmentPlanModel = dbConnection.model("studentfeeinstallmentplans", feeplanInstallmentschema);
    const studentModel = await dbConnection.model("students", StudentSchema);
    const programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
    const guardianModel = dbConnection.model("guardian", GuardianSchema);
    const transactionModel = await dbConnection.model(transactionCollectionName, transactionsSchema, transactionCollectionName);

    const allCampus = await campusModel.find({});
    const allProgramPlan = await programPlanModel.find({});

    async function getData() {
        const studentAggregator = [
            {
                $lookup: {
                    from: "students",
                    localField: "studentRegId",
                    foreignField: "regId",
                    as: "students",
                },
            },
            {
                $lookup: {
                    from: "studentfeeinstallmentplans",
                    localField: "_id",
                    foreignField: "feePlanId",
                    as: "installmentData",
                },
            },
            {
                $unwind: "$installmentData",
            },
            {
                $unwind: "$students",
            },
            {
                $group: {
                    _id: {
                        studentRegId: "$students.regId",
                        studentId: "$students._id",
                        studentName: {
                            $concat: ["$students.firstName", " ", "$students.lastName"],
                        },
                        campusId: "$students.campusId",
                        section: "$students.section",
                        displayName: "$students.displayName",
                        studentPhone: "$students.phoneNo",
                        studentEmail: "$students.email",
                        parentName: "$students.parentName",
                        parentPhone: "$students.parentPhone",
                        parentEmail: "$students.parentEmail",
                        category: "$students.category",
                        programPlanId: "$students.programPlanId",
                        totalPlannedAmount: "$plannedAmount",
                        totalPaidAmount: "$paidAmount",
                        totalPendingAmount: "$pendingAmount",
                    },
                    installmentData: {
                        $push: {
                            title: "$installmentData.label",
                            totalAmount: "$installmentData.plannedAmount",
                            paidAmount: "$installmentData.paidAmount",
                            pendingAmount: "$installmentData.pendingAmount",
                            discountAmount: "$installmentData.discountAmount",
                        },
                    },
                },
            },
            {
                $project: {
                    _id: 0,
                    regId: "$_id.studentRegId",
                    studentId: "$_id.studentId",
                    studentName: "$_id.studentName",
                    campusId: "$_id.campusId",
                    section: "$_id.section",
                    displayName: "$_id.displayName",
                    studentPhone: "$_id.studentPhone",
                    studentEmail: "$_id.studentEmail",
                    parentName: "$_id.parentName",
                    parentPhone: "$_id.parentPhone",
                    parentEmail: "$_id.parentEmail",
                    category: "$_id.category",
                    programPlanId: "$_id.programPlanId",
                    totalPlannedAmount: "$_id.totalPlannedAmount",
                    totalPaidAmount: "$_id.totalPaidAmount",
                    totalPendingAmount: "$_id.totalPendingAmount",
                    installmentData: "$installmentData",
                },
            },
        ];
        const totalData = await feePlanModel.aggregate(studentAggregator);
        for (let i = 0; i < totalData.length; i++) {
            let campusDetail = [];
            const item = totalData[i];
            campusDetail = allCampus.filter((CampusItem) => {
                if (item.campusId == CampusItem._id) {
                    return CampusItem;
                }
            });
            if (campusDetail.length != 0) {
                item["campusName"] = campusDetail[0].displayName;
            } else {
                item["campusName"] = "";
            }
        }
        for (let i = 0; i < totalData.length; i++) {
            let campusDetail = [];
            const item = totalData[i];
            campusDetail = allProgramPlan.filter((CampusItem) => {
                if (String(item.programPlanId) == String(CampusItem._id)) {
                    return CampusItem;
                }
            });
            if (campusDetail.length != 0) {
                item["classBatch"] = campusDetail[0].title;
            } else {
                item["classBatch"] = "";
            }
        }
        for (let i = 0; i < totalData.length; i++) {
            let campusDetail = [];
            campusDetail = totalData.sort(function (a, b) {
                return a.regId - b.regId;
            });
            return campusDetail;
        }
        return totalData;

    }

    let allData = await getData();

    const cvrData = { "overall": [], "inst1Defaulters": [], "inst1Paid": [], "inst2Defaulters": [], "inst2Paid": [] }
    const jbnData = { "overall": [], "inst1Defaulters": [], "inst1Paid": [], "inst2Defaulters": [], "inst2Paid": [] }
    const ppData = { "overall": [], "inst1Defaulters": [], "inst1Paid": [], "inst2Defaulters": [], "inst2Paid": [] }

    for (let i = 0; i < allData.length; i++) {
        const element = allData[i];
        if (element.campusName.includes('CVR')) {
            let instData = element.installmentData.sort((a, b) => (a.title > b.title ? 1 : -1));
            let totalDiscount = instData.reduce((a, b) => a + b.discountAmount, 0)

            let inst1Total = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
            let inst1Discount = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
            let inst1Paid = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
            let inst1Pending = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

            let inst2Total = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
            let inst2Discount = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
            let inst2Paid = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
            let inst2Pending = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

            let inst3Total = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
            let inst3Discount = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
            let inst3Paid = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
            let inst3Pending = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

            let inst4Total = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
            let inst4Discount = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
            let inst4Paid = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
            let inst4Pending = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)


            let overallFeeDetails = {
                "SL.NO": i + 1,
                "REG. NO.": element.regId,
                "STUDENT NAME": element.studentName,
                "CLASS/BATCH": element.classBatch,
                "CAMPUS": element.campusName,
                "TOTAL FEES": element.totalPlannedAmount,
                "TOTAL DISCOUNTS": totalDiscount,

                "INS1TOTAL": inst1Total,
                "INS1DISCOUNT": inst1Discount,
                "INS1PAID": inst1Paid,
                "INS1PENDING": inst1Pending,

                "INS2TOTAL": inst2Total,
                "INS2DISCOUNT": inst2Discount,
                "INS2PAID": inst2Paid,
                "INS2PENDING": inst2Pending,

                "INS3TOTAL": inst3Total,
                "INS3DISCOUNT": inst3Discount,
                "INS3PAID": inst3Paid,
                "INS3PENDING": inst3Pending,

                "INS4TOTAL": inst4Total,
                "INS4DISCOUNT": inst4Discount,
                "INS4PAID": inst4Paid,
                "INS4PENDING": inst4Pending,
                "PARENT NAME": element.parentName,
                "PARENT EMAIL ID": element.parentEmail,
                "PARENT MOBILE": element.parentPhone,
                "STUDENT MOBILE": element.studentPhone
            }
            cvrData.overall.push(overallFeeDetails)

            if (inst1Pending !== 0) {
                let inst1Defaulters = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst1Total,
                    "DISCOUNT": inst1Discount,
                    "PAID": inst1Paid,
                    "PENDING": inst1Pending,
                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                cvrData.inst1Defaulters.push(inst1Defaulters)
            }
            if (inst1Pending == 0) {
                let installment1Paid = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst1Total,
                    "DISCOUNT": inst1Discount,
                    "PAID": inst1Paid,
                    "PENDING": inst1Pending,
                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                cvrData.inst1Paid.push(installment1Paid)

            }
            if (inst2Pending !== 0) {
                let inst2Defaulters = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst2Total,
                    "DISCOUNT": inst2Discount,
                    "PAID": inst2Paid,
                    "PENDING": inst2Pending,
                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                cvrData.inst2Defaulters.push(inst2Defaulters)
            }
            if (inst2Pending == 0) {
                let installment2Paid = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst2Total,
                    "DISCOUNT": inst2Discount,
                    "PAID": inst2Paid,
                    "PENDING": inst2Pending,
                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                cvrData.inst2Paid.push(installment2Paid)

            }
        }
        else if (element.campusName.includes('JBN')) {
            let instData = element.installmentData.sort((a, b) => (a.title > b.title ? 1 : -1));
            let totalDiscount = instData.reduce((a, b) => a + b.discountAmount, 0)

            let inst1Total = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
            let inst1Discount = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
            let inst1Paid = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
            let inst1Pending = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

            let inst2Total = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
            let inst2Discount = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
            let inst2Paid = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
            let inst2Pending = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

            let inst3Total = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
            let inst3Discount = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
            let inst3Paid = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
            let inst3Pending = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

            let inst4Total = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
            let inst4Discount = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
            let inst4Paid = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
            let inst4Pending = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)


            let overallFeeDetails = {
                "SL.NO": i + 1,
                "REG. NO.": element.regId,
                "STUDENT NAME": element.studentName,
                "CLASS/BATCH": element.classBatch,
                "CAMPUS": element.campusName,
                "TOTAL FEES": element.totalPlannedAmount,
                "TOTAL DISCOUNTS": totalDiscount,

                "INS1TOTAL": inst1Total,
                "INS1DISCOUNT": inst1Discount,
                "INS1PAID": inst1Paid,
                "INS1PENDING": inst1Pending,

                "INS2TOTAL": inst2Total,
                "INS2DISCOUNT": inst2Discount,
                "INS2PAID": inst2Paid,
                "INS2PENDING": inst2Pending,

                "INS3TOTAL": inst3Total,
                "INS3DISCOUNT": inst3Discount,
                "INS3PAID": inst3Paid,
                "INS3PENDING": inst3Pending,

                "INS4TOTAL": inst4Total,
                "INS4DISCOUNT": inst4Discount,
                "INS4PAID": inst4Paid,
                "INS4PENDING": inst4Pending,

                "PARENT NAME": element.parentName,
                "PARENT EMAIL ID": element.parentEmail,
                "PARENT MOBILE": element.parentPhone,
                "STUDENT MOBILE": element.studentPhone
            }
            jbnData.overall.push(overallFeeDetails)

            if (inst1Pending !== 0) {
                let inst1Defaulters = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst1Total,
                    "DISCOUNT": inst1Discount,
                    "PAID": inst1Paid,
                    "PENDING": inst1Pending,
                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                jbnData.inst1Defaulters.push(inst1Defaulters)
            }
            if (inst1Pending == 0) {
                let installment1Paid = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst1Total,
                    "DISCOUNT": inst1Discount,
                    "PAID": inst1Paid,
                    "PENDING": inst1Pending,
                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                jbnData.inst1Paid.push(installment1Paid)

            }
            if (inst2Pending !== 0) {
                let inst2Defaulters = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst2Total,
                    "DISCOUNT": inst2Discount,
                    "PAID": inst2Paid,
                    "PENDING": inst2Pending,

                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                jbnData.inst2Defaulters.push(inst2Defaulters)
            }
            if (inst2Pending == 0) {
                let installment2Paid = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst2Total,
                    "DISCOUNT": inst2Discount,
                    "PAID": inst2Paid,
                    "PENDING": inst2Pending,

                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                jbnData.inst2Paid.push(installment2Paid)

            }
        }
        else if (element.campusName.includes('PP')) {
            let instData = element.installmentData.sort((a, b) => (a.title > b.title ? 1 : -1));
            let totalDiscount = instData.reduce((a, b) => a + b.discountAmount, 0)

            let inst1Total = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.totalAmount, 0)
            let inst1Discount = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.discountAmount, 0)
            let inst1Paid = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
            let inst1Pending = instData.filter(item => item.title == "Installment001").reduce((a, b) => a + b.pendingAmount, 0)

            let inst2Total = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.totalAmount, 0)
            let inst2Discount = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.discountAmount, 0)
            let inst2Paid = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.paidAmount, 0)
            let inst2Pending = instData.filter(item => item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)

            let inst3Total = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.totalAmount, 0)
            let inst3Discount = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.discountAmount, 0)
            let inst3Paid = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
            let inst3Pending = instData.filter(item => item.title == "Installment003").reduce((a, b) => a + b.pendingAmount, 0)

            let inst4Total = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.totalAmount, 0)
            let inst4Discount = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.discountAmount, 0)
            let inst4Paid = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
            let inst4Pending = instData.filter(item => item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)


            let overallFeeDetails = {
                "SL.NO": i + 1,
                "REG. NO.": element.regId,
                "STUDENT NAME": element.studentName,
                "CLASS/BATCH": element.classBatch,
                "CAMPUS": element.campusName,
                "TOTAL FEES": element.totalPlannedAmount,
                "TOTAL DISCOUNTS": totalDiscount,

                "INS1TOTAL": inst1Total,
                "INS1DISCOUNT": inst1Discount,
                "INS1PAID": inst1Paid,
                "INS1PENDING": inst1Pending,

                "INS2TOTAL": inst2Total,
                "INS2DISCOUNT": inst2Discount,
                "INS2PAID": inst2Paid,
                "INS2PENDING": inst2Pending,

                "INS3TOTAL": inst3Total,
                "INS3DISCOUNT": inst3Discount,
                "INS3PAID": inst3Paid,
                "INS3PENDING": inst3Pending,

                "INS4TOTAL": inst4Total,
                "INS4DISCOUNT": inst4Discount,
                "INS4PAID": inst4Paid,
                "INS4PENDING": inst4Pending,

                "PARENT NAME": element.parentName,
                "PARENT EMAIL ID": element.parentEmail,
                "PARENT MOBILE": element.parentPhone,
                "STUDENT MOBILE": element.studentPhone
            }
            ppData.overall.push(overallFeeDetails)

            if (inst1Pending !== 0) {
                let inst1Defaulters = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst1Total,
                    "DISCOUNT": inst1Discount,
                    "PAID": inst1Paid,
                    "PENDING": inst1Pending,

                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                ppData.inst1Defaulters.push(inst1Defaulters)
            }
            if (inst1Pending == 0) {
                let installment1Paid = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst1Total,
                    "DISCOUNT": inst1Discount,
                    "PAID": inst1Paid,
                    "PENDING": inst1Pending,

                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                ppData.inst1Paid.push(installment1Paid)

            }
            if (inst2Pending !== 0) {
                let inst2Defaulters = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst2Total,
                    "DISCOUNT": inst2Discount,
                    "PAID": inst2Paid,
                    "PENDING": inst2Pending,

                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                ppData.inst2Defaulters.push(inst2Defaulters)
            }
            if (inst2Pending == 0) {
                let installment2Paid = {
                    "SL.NO": i + 1,
                    "REG. NO.": element.regId,
                    "STUDENT NAME": element.studentName,
                    "CLASS/BATCH": element.classBatch,
                    "CAMPUS": element.campusName,
                    "TOTAL FEES": element.totalPlannedAmount,
                    "TOTAL DISCOUNTS": totalDiscount,
                    "TOTAL": inst2Total,
                    "DISCOUNT": inst2Discount,
                    "PAID": inst2Paid,
                    "PENDING": inst2Pending,

                    "PARENT NAME": element.parentName,
                    "PARENT EMAIL ID": element.parentEmail,
                    "PARENT MOBILE": element.parentPhone,
                    "STUDENT MOBILE": element.studentPhone
                }
                ppData.inst2Paid.push(installment2Paid)

            }
        }
    }

    let attachment1 = await XlsxPopulate.fromFileAsync('controllers/vkgi-template-files/input-template.xlsx').then(workbook => {
        // Modify the workbook.
        const sheet1 = workbook.sheet(0).name('NCFE CVR Overall');
        let sheet1Details = cvrData.overall.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet2 = workbook.sheet(1)
        let sheet2Details = cvrData.inst1Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet3 = workbook.sheet(2)
        let sheet3Details = cvrData.inst1Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet4 = workbook.sheet(3)
        let sheet4Details = cvrData.inst2Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet5 = workbook.sheet(4)
        let sheet5Details = cvrData.inst2Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        //Sheet 1
        function createSheet1() {
            sheet1Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet1.cell(`A${index + 5}`).value([
                    Object.values(item)
                ])
            })
        }
        createSheet1()
        //Sheet 2
        function createSheet2() {
            sheet2Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet2.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet2()
        //sheet3
        function createSheet3() {

            sheet3Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet3.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet3()
        //sheet4
        function createSheet4() {
            sheet4Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet4.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet4()
        //Sheet 5
        function createSheet5() {
            sheet5Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet5.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet5()
        let todayDate = moment().format("DD/MM/YYYY").split("/");
        let dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";
        workbook.toFileAsync("encrypted-excel1.xlsx", { password: dfcrPassword });
        return workbook.outputAsync({ password: dfcrPassword });
        // return workbook.toFileAsync("out1.xlsx");
    }).then(data => {
        return Buffer.from(data).toString("base64");
    })

    let attachment2 = await XlsxPopulate.fromFileAsync('controllers/vkgi-template-files/input-template.xlsx').then(workbook => {
        // Modify the workbook.
        const sheet1 = workbook.sheet(0).name('NCFE - JBN Overall');
        let sheet1Details = jbnData.overall.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet2 = workbook.sheet(1)
        let sheet2Details = jbnData.inst1Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet3 = workbook.sheet(2)
        let sheet3Details = jbnData.inst1Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet4 = workbook.sheet(3)
        let sheet4Details = jbnData.inst2Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet5 = workbook.sheet(4)
        let sheet5Details = jbnData.inst2Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        // Sheet 1
        function createSheet1() {
            sheet1Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet1.cell(`A${index + 5}`).value([
                    Object.values(item)
                ])
            })
        }
        createSheet1()
        //sheet 2
        function createSheet2() {

            sheet2Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet2.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet2()
        //sheet3
        function createSheet3() {

            sheet3Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet3.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet3()
        //sheet4
        function createSheet4() {
            sheet4Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet4.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet4()
        //Sheet 5
        function createSheet5() {
            sheet5Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet5.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet5()
        let todayDate = moment().format("DD/MM/YYYY").split("/");
        let dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";
        workbook.toFileAsync("encrypted-excel2.xlsx", { password: dfcrPassword });
        return workbook.outputAsync({ password: dfcrPassword });
        // return workbook.toFileAsync("out2.xlsx");
    }).then(data => {
        return Buffer.from(data).toString("base64");
    })

    let attachment3 = await XlsxPopulate.fromFileAsync('controllers/vkgi-template-files/input-template.xlsx').then(workbook => {
        // Modify the workbook.
        const sheet1 = workbook.sheet(0).name('NCFE - PP Overall');
        let sheet1Details = ppData.overall.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet2 = workbook.sheet(1)
        let sheet2Details = ppData.inst1Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet3 = workbook.sheet(2)
        let sheet3Details = ppData.inst1Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet4 = workbook.sheet(3)
        let sheet4Details = ppData.inst2Defaulters.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        const sheet5 = workbook.sheet(4)
        let sheet5Details = ppData.inst2Paid.sort((a, b) => (a['REG. NO.'] > b['REG. NO.'] ? 1 : -1))

        //sheet 1
        function createSheet1() {
            sheet1Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet1.cell(`A${index + 5}`).value([
                    Object.values(item)
                ])
            })
        }
        createSheet1()

        //sheet 2
        function createSheet2() {

            sheet2Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet2.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet2()
        //sheet3
        function createSheet3() {
            sheet3Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet3.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet3()
        //sheet4
        function createSheet4() {
            sheet4Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet4.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet4()
        //Sheet 5
        function createSheet5() {
            sheet5Details.map((item, index) => {
                item['SL.NO'] = index + 1
                sheet5.cell(`A${index + 3}`).value([Object.values(item)])
            })

        }
        createSheet5()
        let todayDate = moment().format("DD/MM/YYYY").split("/");
        let dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";
        workbook.toFileAsync("encrypted-excel3.xlsx", { password: dfcrPassword });
        return workbook.outputAsync({ password: dfcrPassword });
        // return workbook.toFileAsync("out3.xlsx");
    }).then(data => {
        return Buffer.from(data).toString("base64");
    })

    console.log('success')
    let sgKey = "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"
    sgMail.setApiKey(sgKey);

    let msg = {
        to: 'jayanthinathan.c@zenqore.com', // Change to your recipient
        from: 'noreply@ncfe.ac.in', // Change to your verified sender
        subject: `NCFE -${process.env.stage} Test Daily Fee Collection Report of ${moment().format("DD/MM/YYYY")}`,
        html: `Dear NCFE Team, <br/> <br/> Please find the attached Daily Fee Collection Report of ${moment().format("DD/MM/YYYY")} for your reference.<br/>
        <p>These are password protected files.</p>
        <br/>Regards <br/>`,
        attachments: [
            {
                content: attachment1,
                // filename: filename,
                filename: `Fee-Collection-report-CVR-${moment().format("DD-MM-YYYY")}.xlsx`,
                type: "text/html",
                disposition: "attachment",
            },
            {
                content: attachment2,
                // filename: filename,
                filename: `Fee-Collection-report-JBN-${moment().format("DD-MM-YYYY")}.xlsx`,
                type: "text/html",
                disposition: "attachment",
            }, {
                content: attachment3,
                // filename: filename,
                filename: `Fee-Collection-report-PP-${moment().format("DD-MM-YYYY")}.xlsx`,
                type: "text/html",
                disposition: "attachment",
            }
        ],
    };
    sgMail
        .send(msg)
        .then(() => {
            fs.unlink("encrypted-excel1.xlsx", (err) => { console.log("Temp excel file is deleted "); });
            fs.unlink("encrypted-excel2.xlsx", (err) => { console.log("Temp excel file is deleted "); });
            fs.unlink("encrypted-excel3.xlsx", (err) => { console.log("Temp excel file is deleted "); });
            res.send({
                message: 'Mail Sent Successfully',
                success: true
            })
            console.log('Mail Sent Successfully')

        })

}

async function getData(req, res) {
    req.setTimeout(600000);
    const orgId = req.query.orgId
    let dbConnection;
    let centralDbConnection;
    centralDbConnection = await createDatabase(`usermanagement-prod`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");

    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
    dbConnection = await createDatabase(orgData._doc._id.toString(), orgData._doc.connUri);

    const campusModel = dbConnection.model("campuses", campusSchema, "campuses");
    const feePlanModel = dbConnection.model("studentfeeplans", feeplanschema);
    const feeInstallmentPlanModel = dbConnection.model("studentfeeinstallmentplans", feeplanInstallmentschema);
    const studentModel = await dbConnection.model("students", StudentSchema);
    const programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
    const guardianModel = dbConnection.model("guardian", GuardianSchema);
    const transactionModel = await dbConnection.model(transactionCollectionName, transactionsSchema, transactionCollectionName);

    // let allCampusDetails = await campusModel.find({})
    // let allTransactions = await transactionModel.find({})

    let fromDate1 = new Date(new Date().setHours(0, 0, 0, 0));
    let toDate1 = new Date(new Date().setHours(23, 59, 59, 999));
    console.log("from date", fromDate1.toISOString());
    console.log("to date ", toDate1.toISOString());

    let allProgramPlans = await programPlanModel.find({})
    let allStudents = await studentModel.find({})
    let allFeePlanDatas = await feePlanModel.find({})
    let allInstallmentDatas = await feeInstallmentPlanModel.find({})

    //on 30/06/2021
    // from date 2021-06-29T18:30:00.000Z
    // to date  2021-06-30T18:29:59.999Z
    // let todayAgg = { $match: { createdAt: { $gt: new Date("2021-06-29T18:30:00.000Z"), $lt: new Date("2021-06-30T18:29:59.999Z") } } }
    let todayAgg = { $match: { transactionSubType: "feePayment", createdAt: { $gt: fromDate1, $lt: toDate1 } } }

    let todayTransactions = await transactionModel.aggregate([todayAgg])

    let sheet1Details = []
    if (todayTransactions.length == 0) {
        sheet1Details = [{ 'value': 'No Data Found' }]
    }
    else {
        // for (let i = 0; i < 50; i++) {
        for (let i = 0; i < todayTransactions.length; i++) {
            const txnItem = todayTransactions[i];
            // let findMonth = moment(txnItem._doc.transactionDate).utcOffset("GMT+0530").format('MM')
            // let currentMonth = moment().utcOffset("GMT+0530").format('MM')
            // console.log(findMonth, ' : ', currentMonth)
            // if (currentMonth == findMonth) {
            let singleStudent = allStudents.find(item => String(item.regId) == String(txnItem.studentRegId))
            let feePlanData = allFeePlanDatas.find(item => item.studentRegId == singleStudent.regId)

            if (feePlanData) {
                let installmentData = allInstallmentDatas.filter(item => String(item.feePlanId) == String(feePlanData._id))
                let currentTerm = txnItem.data.feesBreakUp[0].title
                let currentInstallment = txnItem.data.feesBreakUp[0].installment
                let instArray = []
                installmentData.map(item => {
                    let installObj = {
                        "termTitle": item.plannedAmountBreakup[0].title,
                        "installment": item.label,
                        "paidAmount": item.paidAmount,
                        "discountAmount": item.discountAmount,
                        "roundOff": 0,
                        "concessionFees": item.concessionFees,
                        "lateFees": item.lateFees
                    }
                    instArray.push(installObj)
                })
                let totalDiscount = instArray.reduce((a, b) => a + b.discountAmount, 0)
                let totalTermFeesWOdiscount = instArray.reduce((a, b) => a + b.paidAmount, 0)

                let sheet1Data = {
                    'slNo': i + 1,
                    "std-section": txnItem.class,
                    'studentName': singleStudent.firstName + ' ' + singleStudent.lastName,
                    "regId": txnItem.studentRegId,
                    "receiptNo": txnItem.receiptNo,
                    "transactionId": txnItem.data.modeDetails.transactionId == null ? txnItem.paymentTransactionId : txnItem.data.modeDetails.transactionId,
                    "paidDate": moment(txnItem.transactionDate).format('DD/MM/YYYY'),
                    "settlementDate": moment(txnItem.transactionDate).format('DD/MM/YYYY'),
                    'Total': feePlanData.plannedAmount,
                    'instFeeBreakup': instArray,
                    'totalTermFeesWOdiscount': totalTermFeesWOdiscount,
                    'totalDiscount': totalDiscount,
                    'Round Off': 0,
                    'transactionAmount': txnItem.amount,
                    'paymentMode': txnItem.data.mode,
                    "currentInstallment": currentInstallment,
                    "currentTerm": currentTerm
                }
                sheet1Details.push(sheet1Data)
            }
        }
    }

    let sheet2Details = []
    // for (let i = 0; i < 20; i++) {
    for (let i = 0; i < allFeePlanDatas.length; i++) {
        const feePlanItem = allFeePlanDatas[i];
        let singleStudent = allStudents.find(item => String(item.regId) == String(feePlanItem.studentRegId))
        // let programPlanData = await programPlanModel.findOne({ _id: String(singleStudent.programPlanId) })
        let programPlanData = allProgramPlans.find(item => String(item._id) == String(singleStudent.programPlanId))
        let instDatas = allInstallmentDatas.filter(item => String(item.feePlanId) == String(feePlanItem._id)).sort((a, b) => (a.label > b.label ? 1 : -1));
        let instDetail = []
        instDatas.map(data => {
            instDetail.push({
                title: data.label,
                plannedAmount: data.plannedAmount,
                paidAmount: data.paidAmount,
                pendingAmount: data.pendingAmount,
                discountAmount: data.discountAmount
            })
        })
        // let guardianData = await guardianModel.findOne({ _id: String(singleStudent.guardianDetails[0]) })
        // console.log(i + 1)
        let sheet2Data = {
            slNo: i + 1,
            batchNo: "-",
            admissionNo: singleStudent.regId,
            studentName: singleStudent.firstName + " " + singleStudent.lastName,
            standard: programPlanData && programPlanData._doc.title,
            section: singleStudent.section,
            fatherName: singleStudent.parentName,
            fatherEmail: singleStudent.parentEmail,
            fatherMobile: singleStudent.parentPhone,
            motherName: "-",
            motherEmail: "-",
            motherMobile: "-",
            installmentDetails: instDetail,
            admissionFee: 0,
            concession: feePlanItem.concessionAmount,
            // guardianData: guardianData
        }
        sheet2Details.push(sheet2Data)
    }

    // noOfStudentsPaid = paidAmount > 0
    // noOfStudentsPending = pendingAmount !== 0
    //Fee Pending Report (Defaulter Report)

    let sheet3Details = []
    // for (let i = 0; i < 30; i++) {
    for (let i = 0; i < allFeePlanDatas.length; i++) {
        const feePlanItem = allFeePlanDatas[i];
        let singleStudent = allStudents.find(item => String(item.regId) == String(feePlanItem.studentRegId))
        // let programPlanData = await programPlanModel.findOne({ _id: String(singleStudent.programPlanId) })
        let programPlanData = allProgramPlans.find(item => item._id == String(singleStudent.programPlanId))
        if (feePlanItem.pendingAmount !== 0) {
            let instDatas = allInstallmentDatas.filter(item => String(item.feePlanId) == String(feePlanItem._id)).sort((a, b) => (a.label > b.label ? 1 : -1));
            let instDetail = []
            instDatas.map(data => {
                instDetail.push({
                    title: data.label,
                    plannedAmount: data.plannedAmount,
                    paidAmount: data.paidAmount,
                    pendingAmount: data.pendingAmount,
                    discountAmount: data.discountAmount
                })
            })
            let term1Total = instDetail.filter(item => item.title == "Installment001" || item.title == "Installment002").reduce((a, b) => a + b.pendingAmount, 0)
            let term2Total = instDetail.filter(item => item.title == "Installment003" || item.title == "Installment004").reduce((a, b) => a + b.pendingAmount, 0)
            let termTotalFee = feePlanItem.pendingAmount
            let instTotal = term1Total + term2Total
            let sheet3Data = {
                slNo: i + 1,
                studentName: singleStudent.firstName + " " + singleStudent.lastName,
                GRNumber: singleStudent.regId,
                class: programPlanData && programPlanData._doc.title,
                section: singleStudent.section,
                transportFee: 0,
                admissionFee: 0,
                term1Fee: term1Total,
                term2Fee: term2Total,
                termTotalFee: termTotalFee,
                totalPendingAmount: instTotal,
                fatherName: singleStudent.parentName,
                fatherEmail: singleStudent.parentEmail,
                fatherMobile: singleStudent.parentPhone,
                motherName: '',
                motherEmail: '',
                motherMobile: '',
                EmailAddress: ''
            }

            sheet3Details.push(sheet3Data)
        }
    }

    let sheet4Details = [];

    let currentYear = moment().format('YYYY')
    let modewisetxnAgg = {
        $match: {
            transactionSubType: "feePayment",
            createdAt: {
                $gte: new Date(`${currentYear}-04-01T18:30:00.000Z`)
            }
        }
    }

    let allTxns = await transactionModel.aggregate([modewisetxnAgg])

    // for (let i = 0; i < 70; i++) {
    for (let i = 0; i < allTxns.length; i++) {
        // for (let i = 0; i < todayTransactions.length; i++) {
        const txnItem = allTxns[i];
        // let findMonth = moment(txnItem._doc.transactionDate).utcOffset("GMT+0530").format('MM')
        // let currentMonth = moment().utcOffset("GMT+0530").format('MM')
        // console.log(findMonth, ' : ', currentMonth)
        // if (currentMonth == findMonth) {
        let singleStudent = allStudents.find(item => String(item.regId) == String(txnItem.studentRegId))
        let feePlanData = allFeePlanDatas.find(item => item.studentRegId == singleStudent.regId)
        // let programPlanData = await programPlanModel.findOne({ _id: String(singleStudent.programPlanId) })
        let programPlanData = allProgramPlans.find(item => item._id == String(singleStudent.programPlanId))
        if (feePlanData) {
            let installmentData = allInstallmentDatas.filter(item => String(item.feePlanId) == String(feePlanData._id))
            let instArray = []
            installmentData.map(item => {
                let installObj = {
                    "termTitle": item.plannedAmountBreakup[0].title,
                    "installment": item.label,
                    "paidAmount": item.paidAmount,
                    "discountAmount": item.discountAmount,
                    "concessionFees": item.concessionFees,
                    "lateFees": item.lateFees
                }
                instArray.push(installObj)
            })
            let installment1 = instArray.filter(item => item.installment == "Installment001").reduce((a, b) => a + b.paidAmount, 0)
            let installment2 = instArray.filter(item => item.installment == "Installment002").reduce((a, b) => a + b.paidAmount, 0)

            let installment3 = instArray.filter(item => item.installment == "Installment003").reduce((a, b) => a + b.paidAmount, 0)
            let installment4 = instArray.filter(item => item.installment == "Installment004").reduce((a, b) => a + b.paidAmount, 0)
            let termTotalFee = installment1 + installment2 + installment3 + installment4

            let sheet4Data = {
                'slNo': i + 1,
                'studentName': singleStudent.firstName + ' ' + singleStudent.lastName,
                'standard': programPlanData && programPlanData._doc.title,
                'section': singleStudent.section,
                'academicYear': programPlanData && programPlanData._doc.academicYear,
                'GRNumber': singleStudent.regId,
                'gender': singleStudent.gender,
                'status': txnItem.status,
                'collectionDate': moment(txnItem.transactionDate).format('DD/MM/YYYY'),
                'mode': txnItem.data.mode,
                'transactionNo': txnItem.data.modeDetails.transactionId == null ? txnItem.paymentTransactionId : txnItem.data.modeDetails.transactionId,
                'receiptNo': txnItem.receiptNo,
                'cheque/DDNo': txnItem.data.modeDetails.instrumentNo,
                'cheque/DDDate': moment(new Date(txnItem.data.modeDetails.instrumentDate)).format('DD/MM/YYYY'),
                'cheque/DDBank': txnItem.data.modeDetails.bankName,
                'feesCollectedBy': txnItem.createdBy,
                'chequeCleareddate': '-',
                'onlineSettlementdate': moment(new Date(txnItem.data.modeDetails.instrumentDate)).format('DD/MM/YYYY'),
                'clearance/settlementStatus': '-',
                // 'receiptAmount': txnItem.amount,
                'installment1Fee': installment1,
                'installment2Fee': installment2,
                'installment3Fee': installment3,
                'installment4Fee': installment4,
                'admissionFee': 0,
                'transportFee': 0,
                'totalCollection': termTotalFee
            }
            sheet4Details.push(sheet4Data)
        }
    }
    // let sheet5Details = [{ "value": "No Data Found" }]
    // let sheet6Details = []
    // for (let i = 0; i < allFeePlanDatas.length; i++) {
    // for (let i = 0; i < 70; i++) {
    //     const feePlanItem = allFeePlanDatas[i];
    //     let singleStudent = allStudents.find(item => String(item.regId) == String(feePlanItem.studentRegId))
    //     let programPlanData = await programPlanModel.findOne({ _id: String(singleStudent.programPlanId) })
    //     let sheet6Data = {
    //         "slNo": i + 1,
    //         "category": '-',
    //         "GR.No.": singleStudent.regId,
    //         "standard": programPlanData && programPlanData._doc.title,
    //         "section": singleStudent.section,
    //         "studentName": singleStudent.firstName + " " + singleStudent.lastName,
    //         "transportFeePayable": 0,
    //         "transportFeePaid": 0,
    //         "transportFeeBalance": 0,
    //         "fatherName": singleStudent.parentName,
    //         "fatherEmail": singleStudent.parentEmail,
    //         "fatherMobile": singleStudent.parentPhone,
    //         "motherName": '-',
    //         "motherMobile": '-',
    //         "motherEmail": '-'
    //     }

    //     sheet6Details.push(sheet6Data)
    // }

    // let sheet7Details = []

    // let sheet8Details = []
    // let cancelledtxns = [
    //     {
    //         'slNo': 1,
    //         'studentName': 'NA',
    //         'GR.Number': 'NA',
    //         'class': 'NA',
    //         'section': 'NA',
    //         'paymentMode': 'NA',
    //         'installments': 'NA',
    //         'receiptNo': 'NA',
    //         'amount': 'NA',
    //         'deletedDate': 'NA',
    //         'deletedTime': 'NA',
    //         'deletedBy': 'NA',
    //         'remarks': 'NA'
    //     }
    // ]
    // for (let i = 0; i < cancelledtxns.length; i++) {
    //     const element = cancelledtxns[i];
    //     let sheet8Data = {
    //         'slNo': i + 1,
    //         'studentName': 'NA',
    //         'GR.Number': 'NA',
    //         'class': 'NA',
    //         'section': 'NA',
    //         'paymentMode': 'NA',
    //         'installments': 'NA',
    //         'receiptNo': 'NA',
    //         'amount': 'NA',
    //         'deletedDate': 'NA',
    //         'deletedTime': 'NA',
    //         'deletedBy': 'NA',
    //         'remarks': 'NA'
    //     }
    //     sheet8Details.push(sheet8Data)
    // }

    let sheet11Details = []
    // for (let i = 0; i < 30; i++) {
    for (let i = 0; i < allTxns.length; i++) {
        const txnItem = allTxns[i];
        let singleStudent = allStudents.find(item => String(item.regId) == String(txnItem.studentRegId))
        let feePlanData = allFeePlanDatas.find(item => item.studentRegId == singleStudent.regId)
        if (feePlanData) {
            let installmentData = allInstallmentDatas.filter(item => String(item.feePlanId) == String(feePlanData._id))
            let instArray = []
            installmentData.map(item => {
                let installObj = {
                    "termTitle": item.plannedAmountBreakup[0].title,
                    "installment": item.label,
                    "plannedAmount": item.plannedAmount,
                    "paidAmount": item.paidAmount,
                    "discountAmount": item.discountAmount,
                    "concessionFees": item.concessionFees,
                    "lateFees": item.lateFees
                }
                instArray.push(installObj)
            })
            let sheetData = {
                'slNo': i + 1,
                'category': 'NA',
                'gapYear': 'NA',
                'dateofpayment': moment(txnItem.transactionDate).format('DD/MM/YYYY'),
                'confirmationofPayment': moment(txnItem.transactionDate).format('DD/MM/YYYY'),
                'GR.No.': txnItem.studentRegId,
                'standard': txnItem['class'],
                'section': singleStudent.section,
                'studentName': singleStudent.firstName + " " + singleStudent.lastName,
                'instData': instArray,
                "fatherName": singleStudent.parentName,
                "fatherEmail": singleStudent.parentEmail,
                "fatherMobile": singleStudent.parentPhone,
                'motherName': '-',
                'contactNumber': '-',
                'motherEmail': '-',
                'comments': '',
                'transactionAmount': txnItem.amount
            }
            sheet11Details.push(sheetData)
        }
    }
    res.send({
        message: 'success',
    })
    {
        XlsxPopulate.fromBlankAsync().then(async workbook => {
            // Modify the workbook.
            const sheet1 = workbook.sheet(0).name(`1.Fee Collection for ${moment().utcOffset('GMT+0530').format('DD-MM-YYYY')}`);
            async function createSheet1() {
                let sheet1Head1 = sheet1.range('A1:X1')
                // let sheet1Header = sheet1.range('A3:X3')

                // sheet1.column('G').width(35)
                let sheet1Bold = sheet1.range(`I4:X${sheet1Details.length + 3}`)
                sheet1Bold.style({ numberFormat: "₹0#,###.00" })

                sheet1Head1.merged(true)
                sheet1Head1.style({ horizontalAlignment: "center", verticalAlignment: "center", bold: true, "fill": "dddddd", shrinkToFit: true })
                sheet1Head1.value(`FEES COLLECTION FOR ${moment().utcOffset('GMT+0530').format('DD-MM-YYYY')}`)
                let sheet1Head2 = [{ 'cell': 'A2:A3', 'value': 'Sl No', 'bold': true }, { 'cell': 'B2:B3', 'value': 'Std - Sec', 'bold': true }, { 'cell': 'C2:C3', 'value': 'Student Name', 'bold': true }, { 'cell': 'D2:D3', 'value': 'GR No', 'bold': true }, { 'cell': 'E2:E3', 'value': 'Receipt No', 'bold': true }, { 'cell': 'F2:F3', 'value': 'Transaction ID', 'bold': true }, { 'cell': 'G2:G3', 'value': 'Paid Date', 'bold': true }, { 'cell': 'H2:H3', 'value': 'Settlement Date', 'bold': true }, { 'cell': 'I2:I3', 'value': 'Total', 'bold': true }, { 'cell': 'V2:V3', 'value': 'Total Term Fees(Excluding discount)', 'bold': true }, { 'cell': 'W2:W3', 'value': 'Total Discount', 'bold': true }, { 'cell': 'X2:X3', 'value': 'R.off', 'bold': true }, { 'cell': 'J2:O2', 'value': 'Term 1', 'bold': true }, { 'cell': 'J3:J3', 'value': 'Installment 1', 'bold': false }, { 'cell': 'K3:K3', 'value': 'Discount', 'bold': false }, { 'cell': 'L3:L3', 'value': 'R.off', 'bold': false }, { 'cell': 'M3:M3', 'value': 'Installment 2', 'bold': false }, { 'cell': 'N3:N3', 'value': 'Discount', 'bold': false }, { 'cell': 'O3:O3', 'value': 'R.off', 'bold': false }, { 'cell': 'P2:U2', 'value': 'Term 2', 'bold': true }, { 'cell': 'P3:P3', 'value': 'Installment 3', 'bold': false }, { 'cell': 'Q3:Q3', 'value': 'Discount', 'bold': false }, { 'cell': 'R3:R3', 'value': 'R.off', 'bold': false }, { 'cell': 'S3:S3', 'value': 'Installment 4', 'bold': false }, { 'cell': 'T3:T3', 'value': 'Discount ', 'bold': false }, { 'cell': 'U3:U3', 'value': 'R.off', 'bold': false }]
                sheet1Head2.forEach((item, idx) => {
                    //Get the row 3 column values 
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('3')) {
                        sheet1.column(cellSplit[1].replace('3', '')).width(item.value.toString().length + 5)
                    }
                    sheet1.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })
                let sheetcolumn = [{ column: 'C', width: 35 }, { column: 'F', width: 35 }, { column: 'I', width: 20 }, { column: 'E', width: 20 }]
                sheetcolumn.forEach(item1 => { return sheet1.column(item1.column).width(item1.width) })
                if (!sheet1Details[0].value) {
                    sheet1Details.map((item, index) => {
                        delete item.paymentMode
                        delete item.currentInstallment
                        delete item.currentTerm
                        delete item.transactionAmount
                        let instFeeBreakup = item.instFeeBreakup

                        let inst1 = instFeeBreakup.filter(item => item.installment == "Installment001")
                        let inst2 = instFeeBreakup.filter(item => item.installment == "Installment002")
                        let inst3 = instFeeBreakup.filter(item => item.installment == "Installment003")
                        let inst4 = instFeeBreakup.filter(item => item.installment == "Installment004")

                        let sheet1SingleRow = {
                            "slNo": item.slNo,
                            "std-section": item["std-section"],
                            "studentName": item['studentName'],
                            "regId": item['regId'],
                            "receiptNo": item['receiptNo'],
                            "transactionId": item['transactionId'],
                            "paidDate": item['paidDate'],
                            "settlementDate": item['settlementDate'],
                            "Total": item['Total'],
                            term11paidAmt: inst1.length > 0 ? inst1[0].paidAmount : 0,
                            term11discAmt: inst1.length > 0 ? inst1[0].discountAmount : 0,
                            term11Roff: inst1.length > 0 ? inst1[0].roundOff : 0,

                            term12paidAmt: inst2.length > 0 ? inst2[0].paidAmount : 0,
                            term12discAmt: inst2.length > 0 ? inst2[0].discountAmount : 0,
                            term12Roff: inst2.length > 0 ? inst2[0].roundOff : 0,

                            term23paidAmt: inst3.length > 0 ? inst3[0].paidAmount : 0,
                            term23discAmt: inst3.length > 0 ? inst3[0].discountAmount : 0,
                            term23Roff: inst3.length > 0 ? inst3[0].roundOff : 0,

                            term24paidAmt: inst4.length > 0 ? inst4[0].paidAmount : 0,
                            term24discAmt: inst4.length > 0 ? inst4[0].discountAmount : 0,
                            term24Roff: inst4.length > 0 ? inst4[0].roundOff : 0,

                            "totalTermFeesWOdiscount": item['totalTermFeesWOdiscount'],
                            "totalDiscount": item['totalDiscount'],
                            "Round Off": item["Round Off"],
                        }
                        sheet1.cell(`A${index + 4}`).value([
                            Object.values(sheet1SingleRow)
                        ])
                    })
                }
                else {
                    sheet1Details.map((item, index) => {
                        sheet1.cell(`A${index + 4}`).value([
                            Object.values(item)
                        ])
                    })
                }
            }
            await createSheet1()

            //sheet2
            const sheet2 = workbook.addSheet('2.Overall Fee Structure Report');
            async function createSheet2() {
                let sheet2Head1 = sheet2.range('A1:Y1')
                let sheet2Bold = sheet2.range(`M4:Y${sheet2Details.length + 3}`)
                // let sheet2Bold = sheet2.range(`M4:Y4`)
                sheet2Bold.style({ numberFormat: "₹0#,###.00" })

                sheet2Head1.merged(true)
                sheet2Head1.style({ horizontalAlignment: "center", verticalAlignment: "center", bold: true, "fill": "dddddd", shrinkToFit: true })
                sheet2Head1.value(`Overall Fee Structure Report `)

                let sheet2Header = [{ 'cell': 'A2:A3', 'value': 'Sl No', 'bold': true }, { 'cell': 'B2:B3', 'value': 'Batch No', 'bold': true }, { 'cell': 'C2:C3', 'value': 'Admission No', 'bold': true }, { 'cell': 'D2:D3', 'value': 'Student Name', 'bold': true }, { 'cell': 'E2:E3', 'value': 'Standard', 'bold': true }, { 'cell': 'F2:F3', 'value': 'Section', 'bold': true }, { 'cell': 'G2:G3', 'value': "Father's Name", 'bold': true }, { 'cell': 'H2:H3', 'value': "Father's Email ID", 'bold': true }, { 'cell': 'I2:I3', 'value': "Phone Number", 'bold': true }, { 'cell': 'J2:J3', 'value': "Mother's Name", 'bold': true }, { 'cell': 'K2:K3', 'value': "Mother's Email ID", 'bold': true }, { 'cell': 'L2:L3', 'value': "Mobile Number", 'bold': true }, { 'cell': 'W2:W3', 'value': "Admission Fee", 'bold': true }, { 'cell': 'X2:X3', 'value': "Concession", 'bold': true }, { 'cell': 'M2:P2', 'value': "Term 1 Fee", 'bold': true }, { 'cell': 'M3:M3', 'value': "Installment 1", 'bold': true }, { 'cell': 'N3:N3', 'value': "Discount", 'bold': true }, { 'cell': 'O3:O3', 'value': "Installment 2", 'bold': true }, { 'cell': 'P3:P3', 'value': "Discount", 'bold': true }, { 'cell': 'Q2:T2', 'value': "Term2 Fee", 'bold': true }, { 'cell': 'Q3:Q3', 'value': "Installment 3", 'bold': true }, { 'cell': 'R3:R3', 'value': "Discount", 'bold': true }, { 'cell': 'S3:S3', 'value': "Installment 4", 'bold': true }, { 'cell': 'T3:T3', 'value': "Discount", 'bold': true }, { 'cell': 'U2:V2', 'value': "Total Term Fee", 'bold': true }, { 'cell': 'U3:U3', 'value': "Total Installment", 'bold': true }, { 'cell': 'V3:V3', 'value': "Total Discount", 'bold': true }, { 'cell': 'Y2:Y3', 'value': "TOTAL", 'bold': true }]

                sheet2Header.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('3')) {
                        sheet2.column(cellSplit[1].replace('3', '')).width(item.value.toString().length + 5)
                    }
                    // sheet2.column(idx + 1).width(item.value.toString().length + 2)
                    sheet2.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })
                sheet2Details.map((item, index) => {
                    // delete item.guardianData
                    let instFeeBreakup = item.installmentDetails
                    let TotalInstallment = instFeeBreakup.reduce((a, b) => a + b.plannedAmount, 0);
                    let totalDiscount = instFeeBreakup.reduce((a, b) => a + b.discountAmount, 0);

                    let inst1 = instFeeBreakup.filter(item => item.title == "Installment001")
                    let inst2 = instFeeBreakup.filter(item => item.title == "Installment002")
                    let inst3 = instFeeBreakup.filter(item => item.title == "Installment003")
                    let inst4 = instFeeBreakup.filter(item => item.title == "Installment004")


                    let sheet2SingleRow = {
                        "slNo": item['slNo'],
                        "batchNo": item['batchNo'],
                        "admissionNo": item['admissionNo'],
                        "studentName": item.studentName,
                        "standard": item.standard,
                        "section": item.section,
                        "fatherName": item.fatherName,
                        "fatherEmail": item.fatherEmail,
                        "fatherMobile": item.fatherMobile,
                        "motherName": item.motherName,
                        "motherEmail": item.motherEmail,
                        "motherMobile": item.motherMobile,
                        term11plannedAmt: inst1.length > 0 ? inst1[0].plannedAmount : 0,
                        term11discAmt: inst1.length > 0 ? inst1[0].discountAmount : 0,
                        term12plannedAmt: inst2.length > 0 ? inst2[0].plannedAmount : 0,
                        term12discAmt: inst2.length > 0 ? inst2[0].discountAmount : 0,
                        term23plannedAmt: inst3.length > 0 ? inst3[0].plannedAmount : 0,
                        term23discAmt: inst3.length > 0 ? inst3[0].discountAmount : 0,
                        term24plannedAmt: inst4.length > 0 ? inst4[0].plannedAmount : 0,
                        term24discAmt: inst4.length > 0 ? inst4[0].discountAmount : 0,
                        totalInstallment: TotalInstallment,
                        totalDiscount: totalDiscount,
                        "admissionFee": item.admissionfee,
                        "concession": 0,
                        "overTotal": TotalInstallment
                    }

                    let sheetcolumn = [{ column: 'Y', width: 30 }, { column: 'D', width: 25 }, { column: 'E', width: 25 }, { column: 'G', width: 25 }, { column: 'H', width: 45 }]

                    sheetcolumn.forEach(item2 => { return sheet2.column(item2.column).width(item2.width) })
                    sheet2.cell(`A${index + 4}`).value([
                        Object.values(sheet2SingleRow)
                    ])
                })

            }
            await createSheet2()

            //  sheet 3
            const sheet3 = workbook.addSheet('3.Fee Defaulters Report');
            async function createSheet3() {

                let sheet3Currency = sheet3.range(`F2:K${sheet3Details.length + 2}`)
                // let sheet2Bold = sheet2.range(`M4:Y4`)
                sheet3Currency.style({ numberFormat: "₹0#,###.00" })

                let sheet3Head1 = [
                    { 'cell': 'A1:A1', 'value': 'Sl No', 'bold': true },
                    { 'cell': 'B1:B1', 'value': 'Student Name', 'bold': true },
                    { 'cell': 'C1:C1', 'value': 'GR Number', 'bold': true },
                    { 'cell': 'D1:D1', 'value': 'Class', 'bold': true },
                    { 'cell': 'E1:E1', 'value': 'Section', 'bold': true },
                    { 'cell': 'F1:F1', 'value': 'Admission Fee', 'bold': true },
                    { 'cell': 'G1:G1', 'value': "Transport Fee", 'bold': true },
                    { 'cell': 'H1:H1', 'value': "I Term Fee", 'bold': true },
                    { 'cell': 'I1:I1', 'value': "II Term Fee", 'bold': true },
                    { 'cell': 'J1:J1', 'value': "I & II Term Fee", 'bold': true },
                    { 'cell': 'K1:K1', 'value': "Amount", 'bold': true },
                    { 'cell': 'L1:L1', 'value': "Father's Name", 'bold': true },
                    { 'cell': 'M1:M1', 'value': "Father's Email ID", 'bold': true },
                    { 'cell': 'N1:N1', 'value': "Phone Number", 'bold': true },
                    { 'cell': 'O1:O1', 'value': "Mother's Name", 'bold': true },
                    { 'cell': 'P1:P1', 'value': "Mother's Email ID", 'bold': true },
                    { 'cell': 'Q1:Q1', 'value': "Mobile Number", 'bold': true },
                    { 'cell': 'R1:R1', 'value': "Email Address", 'bold': true }]
                sheet3Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('1')) {
                        sheet3.column(cellSplit[1].replace('1', '')).width(item.value.toString().length + 5)
                    }
                    sheet3.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })

                sheet3Details.map((item, index) => {
                    let sheetcolumn = [{ column: 'K', width: 30 }, { column: 'L', width: 25 }, { column: 'M', width: 25 }, { column: 'P', width: 25 }, { column: 'B', width: 30 }, { column: 'D', width: 18 }]
                    sheetcolumn.forEach(item2 => { return sheet3.column(item2.column).width(item2.width) })
                    sheet3.cell(`A${index + 2}`).value([
                        Object.values(item)
                    ])
                })
            }
            await createSheet3()

            // sheet 4
            const sheet4 = workbook.addSheet('4.MOP & Account wise Report');
            async function createSheet4() {
                let sheet4Currency = sheet4.range(`T4:Z${sheet4Details.length + 4}`)
                sheet4Currency.style({ numberFormat: "₹0#,###.00" })

                let sheet4Head1 = [{ 'cell': 'A1:R1', 'value': 'Student & Fee Receipt Details', 'bold': true },
                { 'cell': 'S1:Y1', 'value': 'NCFE BOOK', 'bold': true },
                { 'cell': 'Z1:Z1', 'value': 'NCFE TRANSPORT BOOK', 'bold': true },
                { 'cell': 'A2:H2', 'value': 'Student Information', 'bold': true },
                { 'cell': 'I2:P2', 'value': 'Mode of Payment Wise Collection Details', 'bold': true },
                { 'cell': 'Q2:S2', 'value': 'Settlement / Cleared details', 'bold': true },
                { 'cell': 'T2:U2', 'value': 'Term I', 'bold': true },
                { 'cell': 'V2:W2', 'value': 'Term II', 'bold': true },
                { 'cell': 'X2:X2', 'value': 'Registration', 'bold': true },
                { 'cell': 'Y2:Y2', 'value': 'Transport Fee', 'bold': true },
                { 'cell': 'Z2:Z3', 'value': 'Total Collection', 'bold': true },
                { 'cell': 'A3:A3', 'value': 'Sl No', 'bold': true },
                { 'cell': 'B3:B3', 'value': 'Student Name', 'bold': true },
                { 'cell': 'C3:C3', 'value': 'Standard', 'bold': true },
                { 'cell': 'D3:D3', 'value': 'Section', 'bold': true },
                { 'cell': 'E3:E3', 'value': 'Academic Year', 'bold': true },
                { 'cell': 'F3:F3', 'value': 'GR Number', 'bold': true },
                { 'cell': 'G3:G3', 'value': 'Gender', 'bold': true },
                { 'cell': 'H3:H3', 'value': 'Status', 'bold': true },
                { 'cell': 'I3:I3', 'value': 'Collection Date', 'bold': true },
                { 'cell': 'J3:J3', 'value': 'Mode ', 'bold': true },
                { 'cell': 'K3:K3', 'value': 'Transaction No', 'bold': true },
                { 'cell': 'L3:L3', 'value': 'Reciept No', 'bold': true },
                { 'cell': 'M3:M3', 'value': 'Cheque/DD No', 'bold': true },
                { 'cell': 'N3:N3', 'value': 'Cheque/DD Date', 'bold': true },
                { 'cell': 'O3:O3', 'value': 'Cheque/DD Bank', 'bold': true },
                { 'cell': 'P3:P3', 'value': 'Fees Collected By', 'bold': true },
                { 'cell': 'Q3:Q3', 'value': 'Cheque Cleared Date', 'bold': true },
                { 'cell': 'R3:R3', 'value': 'Online Settlement Date', 'bold': true },
                { 'cell': 'S3:S3', 'value': 'Clearance/Settlement Status', 'bold': true },

                { 'cell': 'T3:T3', 'value': 'Installement 1', 'bold': true },
                { 'cell': 'U3:U3', 'value': 'Installement 2', 'bold': true },
                { 'cell': 'V3:V3', 'value': 'Installement 3', 'bold': true },
                { 'cell': 'W3:W3', 'value': 'Installement 4', 'bold': true },

                { 'cell': 'X3:X3', 'value': 'Admission Fee', 'bold': true },
                { 'cell': 'Y3:Y3', 'value': 'Transport Fee', 'bold': true }]
                sheet4Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('3')) {
                        sheet4.column(cellSplit[1].replace('3', '')).width(item.value.toString().length + 5)
                    }
                    sheet4.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })

                sheet4Details.map((item, index) => {
                    delete item.receiptAmount
                    let sheetcolumn = [
                        { column: 'K', width: 30 },
                        { column: 'L', width: 25 },
                        { column: 'M', width: 25 },
                        { column: 'N', width: 25 },
                        { column: 'B', width: 30 },
                        // { column: 'D', width: 18 },
                    ]
                    sheetcolumn.forEach(item2 => { return sheet4.column(item2.column).width(item2.width) })
                    sheet4.cell(`A${index + 4}`).value([
                        Object.values(item)
                    ])
                })
            }
            await createSheet4()

            //Sheet 11
            const sheet11 = workbook.addSheet('5.Overall Fee Paid Report');
            async function createSheet11() {
                let sheet11Head1 = [
                    { 'cell': 'A1:A3', 'value': "Sl.No", 'bold': true },
                    { 'cell': 'B1:B3', 'value': "Category", 'bold': true },
                    { 'cell': 'C1:C3', 'value': "Gap Year", 'bold': true },
                    { 'cell': 'D1:D3', 'value': "Date of payment", 'bold': true },
                    { 'cell': 'E1:E3', 'value': "Confirmation of Payment", 'bold': true },
                    { 'cell': 'F1:F3', 'value': "GR.No.", 'bold': true },
                    { 'cell': 'G1:G3', 'value': "Standard", 'bold': true },
                    { 'cell': 'H1:H3', 'value': "Section", 'bold': true },
                    { 'cell': 'I1:I3', 'value': "Student Name", 'bold': true },

                    { 'cell': 'J1:U1', 'value': "I Term Fee", 'bold': true },
                    { 'cell': 'J2:M2', 'value': "Installment 1", 'bold': true },
                    { 'cell': 'J3:J3', 'value': "Payable", 'bold': true },
                    { 'cell': 'K3:K3', 'value': "Discount", 'bold': true },
                    { 'cell': 'L3:L3', 'value': "Paid Amount", 'bold': true },
                    { 'cell': 'M3:M3', 'value': "Balance", 'bold': true },

                    { 'cell': 'N2:Q2', 'value': "Installment 2", 'bold': true },
                    { 'cell': 'N3:N3', 'value': "Payable", 'bold': true },
                    { 'cell': 'O3:O3', 'value': "Discount", 'bold': true },
                    { 'cell': 'P3:P3', 'value': "Paid Amount", 'bold': true },
                    { 'cell': 'Q3:Q3', 'value': "Balance", 'bold': true },

                    { 'cell': 'R2:U2', 'value': "Total", 'bold': true },
                    { 'cell': 'R3:R3', 'value': "Total Term 1 Payable", 'bold': true },
                    { 'cell': 'S3:S3', 'value': "Total Term 1 Discount", 'bold': true },
                    { 'cell': 'T3:T3', 'value': "Total Term 1 Paid", 'bold': true },
                    { 'cell': 'U3:U3', 'value': "Total Term 1 Balance", 'bold': true },

                    { 'cell': 'V1:AG1', 'value': "II Term Fee", 'bold': true },
                    { 'cell': 'V2:Y2', 'value': "Installment 3", 'bold': true },
                    { 'cell': 'V3:V3', 'value': "Payable", 'bold': true },
                    { 'cell': 'W3:W3', 'value': "Discount", 'bold': true },
                    { 'cell': 'X3:X3', 'value': "Paid Amount", 'bold': true },
                    { 'cell': 'Y3:Y3', 'value': "Balance", 'bold': true },

                    { 'cell': 'Z2:AC2', 'value': "Installment 4", 'bold': true },
                    { 'cell': 'Z3:Z3', 'value': "Payable", 'bold': true },
                    { 'cell': 'AA3:AA3', 'value': "Discount", 'bold': true },
                    { 'cell': 'AB3:AB3', 'value': "Paid Amount", 'bold': true },
                    { 'cell': 'AC3:AC3', 'value': "Balance", 'bold': true },

                    { 'cell': 'AD2:AG2', 'value': "Total", 'bold': true },
                    { 'cell': 'AD3:AD3', 'value': "Total Term 2 Payable", 'bold': true },
                    { 'cell': 'AE3:AE3', 'value': "Total Term 2 Discount", 'bold': true },
                    { 'cell': 'AF3:AF3', 'value': "Total Term 2 Paid", 'bold': true },
                    { 'cell': 'AG3:AG3', 'value': "Total Term 2 Balance", 'bold': true },

                    { 'cell': 'AH1:AH3', 'value': "Father Name", 'bold': true },
                    { 'cell': 'AI1:AI3', 'value': "Contact Number", 'bold': true },
                    { 'cell': 'AJ1:AJ3', 'value': "Email ID", 'bold': true },
                    { 'cell': 'AK1:AK3', 'value': "Mother Name", 'bold': true },
                    { 'cell': 'AL1:AL3', 'value': "Contact Number", 'bold': true },
                    { 'cell': 'AM1:AM3', 'value': "Email ID", 'bold': true },
                    { 'cell': 'AN1:AN3', 'value': "Comments", 'bold': true }]

                let sheet11Currency = sheet11.range(`J4:AG${sheet11Details.length + 4}`)
                sheet11Currency.style({ numberFormat: "₹0#,###.00" })

                sheet11Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('3')) {
                        sheet11.column(cellSplit[1].replace('3', '')).width(item.value.toString().length + 5)
                    }
                    sheet11.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                });
                let sheetcolumn = [{ column: 'F', width: 15 }, { column: 'E', width: 20 }, { column: 'G', width: 25 }, { column: 'I', width: 25 }, { column: 'AH', width: 25 }, { column: 'AI', width: 25 }, { column: 'AJ', width: 30 }]

                sheetcolumn.forEach(item2 => { return sheet11.column(item2.column).width(item2.width) })
                sheet11Details.map((item, index) => {
                    delete item.transactionAmount
                    let instFeeBreakup = item.instData
                    let inst1 = instFeeBreakup.filter(item => item.installment == "Installment001")
                    let inst2 = instFeeBreakup.filter(item => item.installment == "Installment002")
                    let inst3 = instFeeBreakup.filter(item => item.installment == "Installment003")
                    let inst4 = instFeeBreakup.filter(item => item.installment == "Installment004")

                    let installment1payable = inst1[0].plannedAmount
                    let installment1concession = inst1[0].discountAmount
                    let installment1paid = inst1[0].paidAmount
                    let installment1balance = Number(installment1payable) - Number(installment1paid) - Number(installment1concession)

                    let installment2payable = inst2.length ? inst2[0].plannedAmount : 0
                    let installment2concession = inst2.length ? inst2[0].discountAmount : 0
                    let installment2paid = inst2.length ? inst2[0].paidAmount : 0
                    let installment2balance = Number(installment2payable) - Number(installment2paid) - Number(installment2concession)


                    let installment3payable = inst3.length ? inst3[0].plannedAmount : 0
                    let installment3concession = inst3.length ? inst3[0].discountAmount : 0
                    let installment3paid = inst3.length ? inst3[0].paidAmount : 0
                    let installment3balance = Number(installment3payable) - Number(installment3paid) - Number(installment3concession)

                    let installment4payable = inst4.length ? inst4[0].plannedAmount : 0
                    let installment4concession = inst4.length ? inst4[0].discountAmount : 0
                    let installment4paid = inst4.length ? inst4[0].paidAmount : 0
                    let installment4balance = Number(installment4payable) - Number(installment4paid) - Number(installment4concession)

                    let sheetSingleRow = {
                        "slNo": item['slNo'],
                        "category": item['category'],
                        "gapYear": item['gapYear'],
                        "dateofpayment": item['dateofpayment'],
                        "confirmationofPayment": item['confirmationofPayment'],
                        "GR.No.": item['GR.No.'],
                        "standard": item['standard'],
                        "section": item.section,
                        "studentName": item['studentName'],
                        installment1payable: Number(installment1payable),
                        installment1concession: Number(installment1concession),
                        installment1paid: Number(installment1paid),
                        installment1balance: Number(installment1balance),
                        installment2payable: Number(installment2payable),
                        installment2concession: Number(installment2concession),
                        installment2paid: Number(installment2paid),
                        installment2balance: Number(installment2balance),
                        term1payable: Number(installment1payable) + Number(installment2payable),
                        term1concession: Number(installment1concession) + Number(installment2concession),
                        term1paid: Number(installment1paid) + Number(installment2paid),
                        term1balance: Number(installment1balance) + Number(installment2balance),
                        installment3payable: Number(installment3payable),
                        installment3concession: Number(installment3concession),
                        installment3paid: Number(installment3paid),
                        installment3balance: Number(installment3balance),
                        installment4payable: Number(installment4payable),
                        installment4concession: Number(installment4concession),
                        installment4paid: Number(installment4paid),
                        installment4balance: Number(installment4balance),
                        term2payable: Number(installment3payable) + Number(installment4payable),
                        term2concession: Number(installment3concession) + Number(installment4concession),
                        term2paid: Number(installment3paid) + Number(installment4paid),
                        term2balance: Number(installment3balance) + Number(installment4balance),
                        "fatherName": item['fatherName'],
                        "fatherMobile": item['fatherMobile'],
                        "fatherEmail": item['fatherEmail'],
                        "motherName": item['motherName'],
                        "contactNumber": item['contactNumber'],
                        "motherEmail": item['motherEmail'],
                        "comments": item['comments']
                    }
                    sheet11.cell(`A${index + 4}`).value([
                        Object.values(sheetSingleRow)
                    ])
                })
            }
            await createSheet11()

            //sheet 5
            const sheet5 = workbook.addSheet('6.Fee & Fine Concession');
            function createSheet5() {
                let sheet5Head1 = [{ 'cell': 'A1:A3', 'value': 'Sl No', 'bold': true },
                { 'cell': 'B1:B3', 'value': 'Category', 'bold': true },
                { 'cell': 'C1:C3', 'value': 'GR.No.', 'bold': true },
                { 'cell': 'D1:D3', 'value': 'Standard', 'bold': true },
                { 'cell': 'E1:E3', 'value': 'Section', 'bold': true },
                { 'cell': 'F1:F3', 'value': 'Class Teacher', 'bold': true },
                { 'cell': 'G1:G3', 'value': 'Student Name', 'bold': true },
                { 'cell': 'H1:H3', 'value': "Father's Name", 'bold': true },
                { 'cell': 'I1:I3', 'value': "Father's Email ID", 'bold': true },
                { 'cell': 'J1:J3', 'value': 'Phone Number', 'bold': true },
                { 'cell': 'K1:K3', 'value': "Mother's Name", 'bold': true },
                { 'cell': 'L1:L3', 'value': "Mother's Email ID", 'bold': true },
                { 'cell': 'M1:M3', 'value': 'Mobile Number', 'bold': true },
                { 'cell': 'N1:N3', 'value': 'Payable Total Fees', 'bold': true },
                { 'cell': 'O1:O3', 'value': 'Total Concession', 'bold': true },
                { 'cell': 'P1:P3', 'value': 'Total Paid Amount', 'bold': true },
                { 'cell': 'Q1:Q3', 'value': 'Balance To Be Paid', 'bold': true },
                //Admission Fee
                { 'cell': 'R1:AA1', 'value': 'Admission Fee', 'bold': true },
                { 'cell': 'R2:V2', 'value': 'Fee', 'bold': true },
                { 'cell': 'W2:Z2', 'value': 'Fine', 'bold': true },
                { 'cell': 'AA2:AA3', 'value': 'Balance', 'bold': true },
                { 'cell': 'R3:R3', 'value': 'Payable', 'bold': true },
                { 'cell': 'S3:S3', 'value': 'Sibling Concession', 'bold': true },
                { 'cell': 'T3:T3', 'value': 'Other Concession', 'bold': true },
                { 'cell': 'U3:U3', 'value': 'Paid', 'bold': true },
                { 'cell': 'V3:V3', 'value': 'Balance', 'bold': true },
                { 'cell': 'W3:W3', 'value': 'Fine', 'bold': true },
                { 'cell': 'X3:X3', 'value': 'Fine Concession', 'bold': true },
                { 'cell': 'Y3:Y3', 'value': 'Paid', 'bold': true },
                { 'cell': 'Z3:Z3', 'value': 'Due Fine', 'bold': true },
                //I Term Fee
                { 'cell': 'AB1:AK1', 'value': 'I Term Fee', 'bold': true },
                { 'cell': 'AB2:AF2', 'value': 'Fee', 'bold': true },
                { 'cell': 'AG2:AJ2', 'value': 'Fine', 'bold': true },
                { 'cell': 'AK2:AK3', 'value': 'Balance', 'bold': true },
                { 'cell': 'AB3:AB3', 'value': 'Payable', 'bold': true },
                { 'cell': 'AC3:AC3', 'value': 'Staff Concession', 'bold': true },
                { 'cell': 'AD3:AD3', 'value': 'Other Concession', 'bold': true },
                { 'cell': 'AE3:AE3', 'value': 'Paid', 'bold': true },
                { 'cell': 'AF3:AF3', 'value': 'Balance', 'bold': true },
                { 'cell': 'AG3:AG3', 'value': 'Fine', 'bold': true },
                { 'cell': 'AH3:AH3', 'value': 'Fine Concession', 'bold': true },
                { 'cell': 'AI3:AI3', 'value': 'Paid', 'bold': true },
                { 'cell': 'AJ3:AJ3', 'value': 'Due Fine', 'bold': true },
                //II Term Fee
                { 'cell': 'AL1:AU1', 'value': 'II Term Fee', 'bold': true },
                { 'cell': 'AL2:AP2', 'value': 'Fee', 'bold': true },
                { 'cell': 'AQ2:AT2', 'value': 'Fine', 'bold': true },
                { 'cell': 'AU2:AU3', 'value': 'Balance', 'bold': true },
                { 'cell': 'AL3:AL3', 'value': 'Payable', 'bold': true },
                { 'cell': 'AM3:AM3', 'value': 'Staff Concession', 'bold': true },
                { 'cell': 'AN3:AN3', 'value': 'Other Concession', 'bold': true },
                { 'cell': 'AO3:AO3', 'value': 'Paid', 'bold': true },
                { 'cell': 'AP3:AP3', 'value': 'Balance', 'bold': true },
                { 'cell': 'AQ3:AQ3', 'value': 'Fine', 'bold': true },
                { 'cell': 'AR3:AR3', 'value': 'Fine Concession', 'bold': true },
                { 'cell': 'AS3:AS3', 'value': 'Paid', 'bold': true },
                { 'cell': 'AT3:AT3', 'value': 'Due Fine', 'bold': true },

                //Transport Fee
                { 'cell': 'AV1:BE1', 'value': 'Transport Fee', 'bold': true },
                { 'cell': 'AV2:AZ2', 'value': 'Fee', 'bold': true },
                { 'cell': 'BA2:BD2', 'value': 'Fine', 'bold': true },
                { 'cell': 'BE2:BE3', 'value': 'Balance', 'bold': true },
                { 'cell': 'AV3:AV3', 'value': 'Payable', 'bold': true },
                { 'cell': 'AW3:AW3', 'value': 'Staff Concession', 'bold': true },
                { 'cell': 'AX3:AX3', 'value': 'Other Concession', 'bold': true },
                { 'cell': 'AY3:AY3', 'value': 'Paid', 'bold': true },
                { 'cell': 'AZ3:AZ3', 'value': 'Balance', 'bold': true },
                { 'cell': 'BA3:BA3', 'value': 'Fine', 'bold': true },
                { 'cell': 'BB3:BB3', 'value': 'Fine Concession', 'bold': true },
                { 'cell': 'BC3:BC3', 'value': 'Paid', 'bold': true },
                { 'cell': 'BD3:BD3', 'value': 'Due Fine', 'bold': true },
                // I & II Term Fee
                { 'cell': 'BF1:BO1', 'value': 'I & II Term Fee', 'bold': true },
                { 'cell': 'BF2:BJ2', 'value': 'Fee', 'bold': true },
                { 'cell': 'BK2:BN2', 'value': 'Fine', 'bold': true },
                { 'cell': 'BO2:BO3', 'value': 'Balance', 'bold': true },
                { 'cell': 'BF3:BF3', 'value': 'Payable', 'bold': true },
                { 'cell': 'BG3:BG3', 'value': 'Staff Concession', 'bold': true },
                { 'cell': 'BH3:BH3', 'value': 'Other Concession', 'bold': true },
                { 'cell': 'BI3:BI3', 'value': 'Paid', 'bold': true },
                { 'cell': 'BJ3:BJ3', 'value': 'Balance', 'bold': true },
                { 'cell': 'BK3:BK3', 'value': 'Fine', 'bold': true },
                { 'cell': 'BL3:BL3', 'value': 'Fine Concession', 'bold': true },
                { 'cell': 'BM3:BM3', 'value': 'Paid', 'bold': true },
                { 'cell': 'BN3:BN3', 'value': 'Due Fine', 'bold': true }]

                sheet5Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('3')) {
                        sheet5.column(cellSplit[1].replace('3', '')).width(item.value.toString().length + 5)
                    }
                    sheet5.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })
                let sheet5Details = [{
                    "value": "No Data Found"
                }]
                sheet5Details.map((item, index) => {
                    sheet5.cell(`A${index + 4}`).value([
                        Object.values(item)
                    ]).style({ bold: true })
                })
            }
            createSheet5()

            //sheet6
            const sheet6 = workbook.addSheet('7.Transport Fee Details');
            function createSheet6() {

                let sheet6Head1 = [{ 'cell': 'A1:A2', 'value': 'Sl.No', 'bold': true }, { 'cell': 'B1:B2', 'value': 'Category', 'bold': true }, { 'cell': 'C1:C2', 'value': 'GR. Number', 'bold': true }, { 'cell': 'D1:D2', 'value': 'Standard', 'bold': true }, { 'cell': 'E1:E2', 'value': 'Section', 'bold': true }, { 'cell': 'F1:F2', 'value': 'Student Name', 'bold': true }, { 'cell': 'G1:I1', 'value': 'Transport Fee', 'bold': true }, { 'cell': 'G2:G2', 'value': 'Payable', 'bold': true }, { 'cell': 'H2:H2', 'value': 'Paid', 'bold': true }, { 'cell': 'I2:I2', 'value': 'Balance', 'bold': true }, { 'cell': 'J1:J2', 'value': 'Father Name', 'bold': true }, { 'cell': 'K1:K2', 'value': 'Father Mobile Number', 'bold': true }, { 'cell': 'L1:L2', 'value': 'Father Email ID', 'bold': true }, { 'cell': 'M1:M2', 'value': 'Mother Name', 'bold': true }, { 'cell': 'N1:N2', 'value': 'Mother Mobile Number', 'bold': true }, { 'cell': 'O1:O2', 'value': 'Mother Email ID', 'bold': true }]
                sheet6Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('2')) {
                        sheet6.column(cellSplit[1].replace('2', '')).width(item.value.toString().length + 5)
                    }
                    sheet6.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })
                //NO DATA
                let sheet6Details = [{ 'value': 'No Data Found' }]
                let sheet6Currency = sheet6.range(`G3:I${sheet6Details.length + 3}`)
                sheet6Currency.style({ numberFormat: "₹0#,###.00" })

                sheet6Details.map((item, index) => {
                    let sheetcolumn = [{ column: 'L', width: 25 }, { column: 'M', width: 25 }, { column: 'N', width: 25 }, { column: 'F', width: 30 }]
                    sheetcolumn.forEach(item2 => { return sheet6.column(item2.column).width(item2.width) })
                    sheet6.cell(`A${index + 3}`).value([
                        Object.values(item)
                    ]).style({ bold: true })
                })
            }
            createSheet6()

            // Sheet 7
            const sheet7 = workbook.addSheet('8.Student Fee Allocation Detail');
            function createSheet7() {
                let sheet7Head1 = [{ 'cell': 'A1:A1', 'value': 'Sl.No', 'bold': true },
                { 'cell': 'B1:B1', 'value': 'Student Name', 'bold': true },
                { 'cell': 'C1:C1', 'value': 'GR Number', 'bold': true },
                { 'cell': 'D1:D1', 'value': 'User Name', 'bold': true },
                { 'cell': 'E1:E1', 'value': 'Class', 'bold': true },
                { 'cell': 'F1:F1', 'value': 'Section', 'bold': true },
                { 'cell': 'G1:G1', 'value': '2013-2014', 'bold': true },
                { 'cell': 'H1:H1', 'value': '7 To 10 KM BW', 'bold': true },
                { 'cell': 'I1:I1', 'value': '2014-2015', 'bold': true },
                { 'cell': 'J1:J1', 'value': '2013-14: 3801', 'bold': true },
                { 'cell': 'K1:K1', 'value': '2019-2020 New Admission', 'bold': true },
                { 'cell': 'L1:L1', 'value': 'MISC5300', 'bold': true },
                { 'cell': 'M1:M1', 'value': '2009-2010', 'bold': true },
                { 'cell': 'N1:N1', 'value': '2018-2019', 'bold': true },
                { 'cell': 'O1:O1', 'value': 'ABOVE 10 KM BW', 'bold': true },
                { 'cell': 'P1:P1', 'value': '2013-14 : 102800', 'bold': true },
                { 'cell': 'Q1:Q1', 'value': 'MISC2900', 'bold': true },
                { 'cell': 'R1:R1', 'value': 'MISC1000', 'bold': true },
                { 'cell': 'S1:S1', 'value': '2011-2012', 'bold': true },
                { 'cell': 'T1:T1', 'value': '2012-13: UTH', 'bold': true },
                { 'cell': 'U1:U1', 'value': '3 To 7 KM BW', 'bold': true },
                { 'cell': 'V1:V1', 'value': '2020 CVR-1.3L', 'bold': true },
                { 'cell': 'W1:W1', 'value': '2020 CVR-1.5L', 'bold': true },
                { 'cell': 'X1:X1', 'value': '2020-21 ICE To NCFE: 175000', 'bold': true },
                { 'cell': 'Y1:Y1', 'value': '2006-2009', 'bold': true },
                { 'cell': 'Z1:Z1', 'value': '2016-2017', 'bold': true },
                { 'cell': 'AA1:AA1', 'value': '2014-15: 112000', 'bold': true },
                { 'cell': 'AB1:AB1', 'value': '2014 - 2015 - 102800', 'bold': true },
                { 'cell': 'AC1:AC1', 'value': '2013-14: 107500', 'bold': true },
                { 'cell': 'AD1:AD1', 'value': '2015-2016', 'bold': true },
                { 'cell': 'AE1:AE1', 'value': 'TW 5 YRS 100% 1St CHILD 2006-18', 'bold': true },
                { 'cell': 'AF1:AF1', 'value': '2013 - 2014 - 108900', 'bold': true },
                { 'cell': 'AG1:AG1', 'value': '2010 - 2011 - 93900', 'bold': true },
                { 'cell': 'AH1:AH1', 'value': '2010-12: 90700', 'bold': true },
                { 'cell': 'AI1:AI1', 'value': '2019-20-Mid Year', 'bold': true },
                { 'cell': 'AJ1:AJ1', 'value': '2020-2021', 'bold': true },
                { 'cell': 'AK1:AK1', 'value': '2011-2012-102200', 'bold': true },
                { 'cell': 'AL1:AL1', 'value': 'MISC300', 'bold': true },
                { 'cell': 'AM1:AM1', 'value': '2016-17(Admission Fee)', 'bold': true },
                { 'cell': 'AN1:AN1', 'value': 'MISC100', 'bold': true },
                { 'cell': 'AO1:AO1', 'value': 'RTE', 'bold': true },
                { 'cell': 'AP1:AP1', 'value': '2011-12: 93900', 'bold': true },
                { 'cell': 'AQ1:AQ1', 'value': '2020-21 ICE To Ncfe: 125000', 'bold': true },
                { 'cell': 'AR1:AR1', 'value': '2012-2013', 'bold': true },
                { 'cell': 'AS1:AS1', 'value': '2020-21- 125000', 'bold': true },
                { 'cell': 'AT1:AT1', 'value': 'MISC2500', 'bold': true },
                { 'cell': 'AU1:AU1', 'value': '2012-2013-93900', 'bold': true },
                { 'cell': 'AV1:AV1', 'value': '2020-21:CVR:165000', 'bold': true },
                { 'cell': 'AW1:AW1', 'value': 'MISC1700', 'bold': true },
                { 'cell': 'AX1:AX1', 'value': '2010-2011', 'bold': true },
                { 'cell': 'AY1:AY1', 'value': '2020 CVR-50T', 'bold': true },
                { 'cell': 'AZ1:AZ1', 'value': '2020 CVR-1.5LL', 'bold': true },
                { 'cell': 'BA1:BA1', 'value': '2012-2013-99200', 'bold': true },
                { 'cell': 'BB1:BB1', 'value': '2017-2018', 'bold': true },
                { 'cell': 'BC1:BC1', 'value': 'MISC3200', 'bold': true },
                { 'cell': 'BD1:BD1', 'value': '2018 -2019 New Late Admission', 'bold': true },
                { 'cell': 'BE1:BE1', 'value': '0 To 1.5 KM BW', 'bold': true },
                { 'cell': 'BF1:BF1', 'value': '1.5 To 3 KM BW', 'bold': true },
                { 'cell': 'BG1:BG1', 'value': '2018-19: 118000', 'bold': true },
                { 'cell': 'BH1:BH1', 'value': 'MISC3700', 'bold': true },
                ]
                sheet7Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('1')) {
                        sheet7.column(cellSplit[1].replace('1', '')).width(item.value.toString().length + 5)
                    }
                    sheet7.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })
                let sheet7Details = [{ 'value': 'No Data Found' }]
                sheet7Details.map((item, index) => {
                    sheet7.cell(`A${index + 2}`).value([
                        Object.values(item)
                    ]).style({ bold: true })
                })
            }
            createSheet7();

            // Sheet 8
            const sheet8 = workbook.addSheet('9.Cancelled Fee Transaction Rep');
            function createSheet8() {
                let sheet8Head1 = [{ 'cell': 'A1:A1', 'value': 'Sl No', 'bold': true }, { 'cell': 'B1:B1', 'value': 'Student Name', 'bold': true }, { 'cell': 'C1:C1', 'value': 'GR No', 'bold': true }, { 'cell': 'D1:D1', 'value': 'Class', 'bold': true }, { 'cell': 'E1:E1', 'value': 'Section', 'bold': true }, { 'cell': 'F1:F1', 'value': 'Payment Mode', 'bold': true }, { 'cell': 'G1:G1', 'value': 'Installments', 'bold': true }, { 'cell': 'H1:H1', 'value': 'Receipt No', 'bold': true }, { 'cell': 'I1:I1', 'value': 'Amount', 'bold': true }, { 'cell': 'J1:J1', 'value': 'Deleted Date', 'bold': true }, { 'cell': 'K1:K1', 'value': 'Deleted Time', 'bold': true }, { 'cell': 'L1:L1', 'value': 'Deleted By', 'bold': true }, { 'cell': 'M1:M1', 'value': 'Remarks', 'bold': true }]
                sheet8Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('1')) {
                        sheet8.column(cellSplit[1].replace('1', '')).width(item.value.toString().length + 5)
                    }
                    sheet8.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })
                // NO DATA
                let sheet8Details = [{ 'value': 'No Data Found' }]
                sheet8Details.map((item, index) => {
                    sheet8.cell(`A${index + 2}`).value([
                        Object.values(item)
                    ]).style({ bold: true })
                })
            }
            createSheet8();

            //sheet 9
            const sheet9 = workbook.addSheet('10.Unmapped Student Report');
            function createSheet9() {
                //NO DATA
                let sheet9Head1 = [{ 'cell': 'A1:A1', 'value': 'Sl No', 'bold': true }, { 'cell': 'B1:B1', 'value': 'Student Name', 'bold': true }, { 'cell': 'C1:C1', 'value': 'GR Number', 'bold': true }, { 'cell': 'D1:D1', 'value': 'Class', 'bold': true }, { 'cell': 'E1:E1', 'value': 'Section', 'bold': true }]
                sheet9Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('1')) {
                        sheet9.column(cellSplit[1].replace('1', '')).width(item.value.toString().length + 5)
                    }
                    sheet9.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })
                // NO DATA
                let sheet9Details = [{ 'value': 'No Data Found' }]
                sheet9Details.map((item, index) => {
                    sheet9.cell(`A${index + 2}`).value([
                        Object.values(item)
                    ]).style({ bold: true })
                })
            }
            createSheet9();
            //sheet 10

            const sheet10 = workbook.addSheet('11.Inactive Students Fee Rep');
            function createSheet10() {

                let sheet10Head1 = [{ 'cell': 'A1:AB1', 'value': 'Overall Fee Report - 2020-2021', bold: true }, { 'cell': 'A2:A2', 'value': 'Sl No', 'bold': true }, { 'cell': 'B2:B2', 'value': "Student Name", 'bold': true }, { 'cell': 'C2:C2', 'value': "Class", 'bold': true }, { 'cell': 'D2:D2', 'value': "Section", 'bold': true }, { 'cell': 'E2:E2', 'value': "GR Number", 'bold': true }, { 'cell': 'F2:F2', 'value': "Father Name", 'bold': true }, { 'cell': 'G2:G2', 'value': "Receipt Number", 'bold': true }, { 'cell': 'H2:H2', 'value': "Voucher Number", 'bold': true }, { 'cell': 'I2:I2', 'value': "Collection Date", 'bold': true }, { 'cell': 'J2:J2', 'value': "Mode Of Payment", 'bold': true }, { 'cell': 'K2:K2', 'value': "Online Payment Transaction No", 'bold': true }, { 'cell': 'L2:L2', 'value': "I Term Fee", 'bold': true }, { 'cell': 'M2:M2', 'value': "Transport Fee", 'bold': true }, { 'cell': 'N2:N2', 'value': "Admission Fee", 'bold': true }, { 'cell': 'O2:O2', 'value': "II Term Fee", 'bold': true }, { 'cell': 'P2:P2', 'value': "I & II Term Fee", 'bold': true }, { 'cell': 'Q2:Q2', 'value': "Fine Amount", 'bold': true }, { 'cell': 'R2:R2', 'value': "Fine Concession", 'bold': true }, { 'cell': 'S2:S2', 'value': "Fee Concession", 'bold': true }, { 'cell': 'T2:T2', 'value': "Exempted Fine", 'bold': true }, { 'cell': 'U2:U2', 'value': "Total Amount", 'bold': true }, { 'cell': 'V2:V2', 'value': "View Receipt", 'bold': true }, { 'cell': 'W2:W2', 'value': "Father Name", 'bold': true }, { 'cell': 'X2:X2', 'value': "Father Email ID", 'bold': true }, { 'cell': 'Y2:Y2', 'value': "Phone Number", 'bold': true }, { 'cell': 'Z2:Z2', 'value': "Mother's Name", 'bold': true }, { 'cell': 'AA2:AA2', 'value': "Mother's Email ID", 'bold': true }, { 'cell': 'AB2:AB2', 'value': "Mobile Number", 'bold': true }]
                sheet10Head1.forEach((item, idx) => {
                    let cellSplit = String(item.cell).split(':')
                    if (cellSplit[1].includes('2')) {
                        sheet10.column(cellSplit[1].replace('2', '')).width(item.value.toString().length + 5)
                    }
                    sheet10.range(item.cell)
                        .value(item.value)
                        .style({ horizontalAlignment: "center", verticalAlignment: "center", bold: item.bold, border: true, wrapText: true, "fill": "dddddd" })
                        .merged(true)
                })
                //NO DATA
                let sheet10Details = [{ 'value': 'No Data Found' }]
                sheet10Details.map((item, index) => {
                    sheet10.cell(`A${index + 3}`).value([
                        Object.values(item)
                    ]).style({ bold: true })
                })
            }
            createSheet10();
            console.log("sheet created succeessfully")
            // return workbook.toFileAsync("./out.xlsx");

            let todayDate = moment().format("DD/MM/YYYY").split("/");
            let dfcrPassword = "D" + todayDate[0] + "F" + todayDate[1] + "C" + todayDate[2] + "R";
            workbook.toFileAsync("encrypted-excel.xlsx");
            return workbook.outputAsync();

        }).then(data => {
            // res.attachment("output.xlsx");
            let attachment = Buffer.from(data).toString("base64");
            let sgKey = "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"
            sgMail.setApiKey(sgKey);

            let msg = {
                to: req.body.emails, // Change to your recipient
                from: 'noreply@ncfe.ac.in', // Change to your verified sender
                subject: `NCFE - Test Daily Fee Collection Report of ${moment().format("DD/MM/YYYY")}`,
                html: `Dear NCFE Team, <br/> <br/> Please find the attached Daily Fee Collection Report of ${moment().format("DD/MM/YYYY")} for your reference.<br/>
                <p>These are password protected files.</p>
                <br/>Regards <br/>`,
                attachments: [
                    {
                        content: attachment,
                        // filename: filename,
                        filename: `Daily Report ${moment().format("DD-MM-YYYY")}.xlsx`,
                        type: "text/html",
                        disposition: "attachment",
                    }
                ],
            };
            sgMail
                .send(msg)
                .then(() => {
                    fs.unlink("encrypted-excel.xlsx", (err) => {
                        console.log("Temp excel file is deleted ");
                    });

                    console.log('Mail Sent Successfully')
                    // return res.send({
                    //     message: 'success',
                    // })
                    // Send the workbook.
                })
                .catch(err => {
                    return res.status(400).json({
                        err: err,
                        message: "failure"
                    })
                })
        })
    }

}


module.exports = {
    getData: getData,
    checkCampusData: checkCampusData
}