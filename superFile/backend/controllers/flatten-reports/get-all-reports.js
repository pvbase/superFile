const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const orgListSchema = require("../../models/orglists-schema");
const reportSchema = require('./report-schema');
const campusSchema = require("../../models/campusModel");
const programPlanSchema = require("../../models/programPlanModel");
const feeTypeSchema = require("../../models/feeTypeModel");
const transactionSchema = require("../../models/transactionsModel");
const { dataPagination, convertToCaps } = require("./reports-support");
const allSchema = mongoose.Schema({}, { strict: false });

module.exports.getReports = async (req, res) => {
    const { orgId, type, feeType, campus, programPlan, fromDate, toDate, page, limit, searchKey } = req.query;

    const methodNames = ["cash", "cheque", "card", "netbanking", "wallet", "upi", "NEFT"];
    const colorCodes = ["#00AF50", "#CC6601", "#01B0F1", "#0071C1", "#4AACC5", "#CB3398", "#9933FF"];
    const currencyTypes = ["INR", "USD", "AED"];

    let pendingDetails = {};
    let transactionDetails = {};
    let feeCollectionDetails = {};
    let applicationDetails = {};
    let feeTypeDetails = {};
    let feeTypeTxnDetails = {};
    let studentStatementDetails = {};
    let loanDetails = {};
    let refundDetails = {};

    if (orgId != undefined) {
        if (type && String(type).length !== 0) {
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

            const reportModel = dbConnection.model("reportdetails", reportSchema, "reportdetails");
            const applicationModel = dbConnection.model("applications", allSchema);
            const feeTypeModel = await dbConnection.model("feetypes", feeTypeSchema);
            const campusModel = await dbConnection.model("campuses", campusSchema);
            const transactionModel = await dbConnection.model("transactions", transactionSchema);
            try {
                let filterMatch = {};
                if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                    filterMatch.programPlanId = mongoose.Types.ObjectId(programPlan);
                }
                if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                    filterMatch.campusId = String(campus);
                }
                if (page == undefined || limit == undefined) {
                    if (String(type) == "feePending") {
                        const calcPendingDetails = await getFeePendingReport();
                        res.send({
                            status: "success",
                            totalRecord: calcPendingDetails.length,
                            pendingDetails: pendingDetails,
                            data: calcPendingDetails,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Fee pending report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else if (String(type) == "transaction") {
                        const calcTransactionDetails = await getTransactionReport();
                        res.send({
                            status: "success",
                            totalRecord: calcTransactionDetails.length,
                            transactionDetails: transactionDetails,
                            data: calcTransactionDetails,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Transaction report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else if (String(type) == "feeCollection") {
                        const calcFeeCollectionDetails = await getFeeCollectionReport();
                        res.send({
                            status: "success",
                            totalRecord: calcFeeCollectionDetails.length,
                            feeCollectionDetails: feeCollectionDetails,
                            data: calcFeeCollectionDetails,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Fee collection report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else if (String(type) == "application") {
                        const calcApplicationDetails = await getApplicationReport();
                        res.send({
                            status: "success",
                            totalRecord: calcApplicationDetails.length,
                            applicationDetails: applicationDetails,
                            data: calcApplicationDetails,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Application report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else if (String(type) == "feeType") {
                        const calcFeeTypeDetails = await getFeeTypeData();
                        res.send({
                            status: "success",
                            totalRecord: calcFeeTypeDetails.length,
                            feeTypeDetails: feeTypeDetails,
                            data: calcFeeTypeDetails,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Fee type report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else if (String(type) == "feeTypeTransaction") {
                        const calcFeeTypeTxnDetails = await getFeeTypeTransactionData();
                        res.send({
                            status: "success",
                            totalRecord: calcFeeTypeTxnDetails.length,
                            feeTypeTxnDetails: feeTypeTxnDetails,
                            data: calcFeeTypeTxnDetails,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Fee type transaction report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else if (String(type) == "studentStatement") {
                        const calcStudentStatementDetails = await getStudentStatement();
                        res.send({
                            status: "success",
                            totalRecord: calcStudentStatementDetails.length,
                            studentStatementDetails: studentStatementDetails,
                            data: calcStudentStatementDetails,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Student statement report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else if (String(type) == "loan") {
                        const calcLoanTransaction = await getLoanTransaction();
                        res.send({
                            status: "success",
                            totalRecord: calcLoanTransaction.length,
                            loanDetails: loanDetails,
                            data: calcLoanTransaction,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Loan report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else if (String(type) == "refund") {
                        const calcRefundTransaction = await getRefundReport();
                        res.send({
                            status: "success",
                            totalRecord: calcRefundTransaction.length,
                            refundDetails: refundDetails,
                            data: calcRefundTransaction,
                            totalPage: null,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: null,
                            message: "Refund report - all data."
                        });
                        centralDbConnection.close();
                        dbConnection.close();
                    }
                    else {
                        await errorTypeResp();
                    }
                }
                else {
                    if (searchKey != undefined && searchKey != "") {
                        if (String(type) == "feePending") {
                            const calcPendingDetails = await getFeePendingReport();
                            let searchFields = await findSearchData(calcPendingDetails, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                pendingDetails: pendingDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Fee pending report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "transaction") {
                            const calcTransactionDetails = await getTransactionReport();
                            let searchFields = await findSearchData(calcTransactionDetails, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                transactionDetails: transactionDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Transaction report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "feeCollection") {
                            const calcFeeCollectionDetails = await getFeeCollectionReport();
                            let searchFields = await findSearchData(calcFeeCollectionDetails, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                feeCollectionDetails: feeCollectionDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Fee collection report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "application") {
                            const calcApplicationDetails = await getApplicationReport();
                            let searchFields = await findSearchData(calcApplicationDetails, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                applicationDetails: applicationDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Application report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "feeType") {
                            const calcFeeTypeDetails = await getFeeTypeData();
                            let searchFields = await findSearchData(calcFeeTypeDetails, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                feeTypeDetails: feeTypeDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Fee type report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "feeTypeTransaction") {
                            const calcFeeTypeTxnDetails = await getFeeTypeTransactionData();
                            let searchFields = await findSearchData(calcFeeTypeTxnDetails, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                feeTypeTxnDetails: feeTypeTxnDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Fee type transaction report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "studentStatement") {
                            const calcStudentStatementDetails = await getStudentStatement();
                            let searchFields = await findSearchData(calcStudentStatementDetails, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                studentStatementDetails: studentStatementDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Student statement report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "loan") {
                            const calcLoanTransaction = await getLoanTransaction();
                            let searchFields = await findSearchData(calcLoanTransaction, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                loanDetails: loanDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Loan report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "refund") {
                            const calcRefundTransaction = await getRefundReport();
                            let searchFields = await findSearchData(calcRefundTransaction, searchKey);
                            let convertToPaginate = await dataPagination(searchFields, page, limit);
                            let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: searchFields.length,
                                refundDetails: refundDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Refund report - search and paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else {
                            await errorTypeResp();
                        }
                    }
                    else {
                        if (String(type) == "feePending") {
                            const calcPendingDetails = await getFeePendingReport();
                            let convertToPaginate = await dataPagination(calcPendingDetails, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcPendingDetails.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcPendingDetails.length,
                                pendingDetails: pendingDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Fee pending report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "transaction") {
                            const calcTransactionDetails = await getTransactionReport();
                            let convertToPaginate = await dataPagination(calcTransactionDetails, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcTransactionDetails.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcTransactionDetails.length,
                                transactionDetails: transactionDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Transaction report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "feeCollection") {
                            const calcFeeCollectionDetails = await getFeeCollectionReport();
                            let convertToPaginate = await dataPagination(calcFeeCollectionDetails, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcFeeCollectionDetails.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcFeeCollectionDetails.length,
                                feeCollectionDetails: feeCollectionDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Fee collection report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "application") {
                            const calcApplicationDetails = await getApplicationReport();
                            let convertToPaginate = await dataPagination(calcApplicationDetails, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcApplicationDetails.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcApplicationDetails.length,
                                applicationDetails: applicationDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Application report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "feeType") {
                            const calcFeeTypeDetails = await getFeeTypeData();
                            let convertToPaginate = await dataPagination(calcFeeTypeDetails, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcFeeTypeDetails.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcFeeTypeDetails.length,
                                feeTypeDetails: feeTypeDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Fee type report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "feeTypeTransaction") {
                            const calcFeeTypeTxnDetails = await getFeeTypeTransactionData();
                            let convertToPaginate = await dataPagination(calcFeeTypeTxnDetails, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcFeeTypeTxnDetails.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcFeeTypeTxnDetails.length,
                                feeTypeTxnDetails: feeTypeTxnDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Fee type transaction report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close(); a
                        }
                        else if (String(type) == "studentStatement") {
                            const calcStudentStatementDetails = await getStudentStatement();
                            let convertToPaginate = await dataPagination(calcStudentStatementDetails, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcStudentStatementDetails.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcStudentStatementDetails.length,
                                studentStatementDetails: studentStatementDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Student statement report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "loan") {
                            const calcLoanTransaction = await getLoanTransaction();
                            let convertToPaginate = await dataPagination(calcLoanTransaction, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcLoanTransaction.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcLoanTransaction.length,
                                loanDetails: loanDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Loan report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else if (String(type) == "refund") {
                            const calcRefundTransaction = await getRefundReport();
                            let convertToPaginate = await dataPagination(calcRefundTransaction, page, limit);
                            let calcTotpageVal = Math.ceil(Number(calcRefundTransaction.length) / Number(limit));
                            res.send({
                                status: "success",
                                totalRecord: calcRefundTransaction.length,
                                refundDetails: refundDetails,
                                data: convertToPaginate,
                                totalPage: calcTotpageVal,
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                                message: "Refund report - paginated data."
                            });
                            centralDbConnection.close();
                            dbConnection.close();
                        }
                        else {
                            await errorTypeResp();
                        }
                    }
                }
                async function getFeePendingReport() {
                    filterMatch.installmentDetails = { $elemMatch: { "dueDate": { $lt: new Date() }, } }
                    let aggregateData = [
                        { $match: filterMatch },
                        { $sort: { studentRegId: 1 } },
                        {
                            $project: {
                                _id: 0,
                                regId: "$studentDetails.studentRegId",
                                studentId: "$studentDetails.studentId",
                                studentName: { $concat: ["$studentDetails.firstName", " ", "$studentDetails.lastName"], },
                                campusId: "$campusId",
                                campusName: "$campusDetails.displayName",
                                campusFullName: "$campusDetails.name",
                                classBatch: "$programPlanDetails.title",
                                section: "$studentDetails.section",
                                studentDisplayName: "$studentDetails.displayName",
                                academicYear: "$programPlanDetails.academicYear",
                                studentPhone: "$studentDetails.phoneNo",
                                studentEmail: "$studentDetails.email",
                                parentName: "$studentDetails.parentName",
                                parentPhone: "$studentDetails.parentPhone",
                                parentEmail: "$studentDetails.parentEmail",
                                category: "$studentDetails.category",
                                programPlanId: "$studentDetails.programPlanId",
                                totalPlannedAmount: "$feePlanDetails.plannedAmount",
                                totalPaidAmount: "$feePlanDetails.paidAmount",
                                totalPendingAmount: "$feePlanDetails.pendingAmount",
                                installmentDetails: {
                                    $filter: {
                                        input: "$installmentDetails", // le tableau à limiter 
                                        as: "index", // un alias
                                        cond: {
                                            $and: [
                                                { $lt: ["$$index.dueDate", new Date()] },
                                            ]
                                        },
                                    }
                                },

                            },
                        },
                    ]
                    let responseData = await reportModel.aggregate(aggregateData)
                    let respData = [];
                    let aggregatedData = responseData.length > 0 ? responseData : []
                    pendingDetails.total = 0; pendingDetails.inst = 0;
                    for (let i = 0; i < aggregatedData.length; i++) {
                        let dummyObj = {};
                        const fPendElt = aggregatedData[i];
                        let instdata = fPendElt.installmentDetails;
                        let instTot = 0; instPaid = 0; instPend = 0; let totalPending = 0;
                        pendingDetails.total = Number(pendingDetails.total) + Number(fPendElt.totalPendingAmount);
                        totalPending = instdata.reduce((a, b) => a + b.pendingAmount, 0);
                        let formatInst = [];
                        instdata.map(item => {
                            pendingDetails.inst = Number(pendingDetails.inst) + Number(item.pendingAmount);
                            instTot = Number(instTot) + Number(item.plannedAmount);
                            instPaid = Number(instPaid) + Number(item.paidAmount);
                            instPend = Number(instPend) + Number(item.pendingAmount);
                            formatInst.push({
                                "title": item.label,
                                "plan": item.plannedAmount,
                                "paid": item.paidAmount,
                                "pending": item.pendingAmount,
                                "dueDate": new Date(item.dueDate)
                            })
                        })
                        dummyObj.registerId = fPendElt.regId
                        dummyObj.studentId = fPendElt.studentId
                        dummyObj.studentName = fPendElt.studentName
                        dummyObj.campusId = fPendElt.campusId
                        dummyObj.campusName = fPendElt.campusName
                        dummyObj.classBatch = fPendElt.classBatch
                        dummyObj.section = fPendElt.section
                        dummyObj.academicYear = fPendElt.academicYear
                        dummyObj.displayName = fPendElt.studentDisplayName
                        dummyObj.studentPhoneNumber = fPendElt.studentPhone
                        dummyObj.studentEmail = fPendElt.studentEmail
                        dummyObj.parentName = fPendElt.parentName
                        dummyObj.parentPhoneNumber = fPendElt.parentPhone
                        dummyObj.parentEmail = fPendElt.parentEmail
                        dummyObj.category = fPendElt.category
                        dummyObj.programPlanId = fPendElt.programPlanId
                        dummyObj.plannedAmount = fPendElt.totalPlannedAmount
                        dummyObj.paidAmount = fPendElt.totalPaidAmount
                        dummyObj.pendingAmount = fPendElt.totalPendingAmount
                        dummyObj.totalFees = instTot;
                        dummyObj.paidFees = instPaid;
                        dummyObj.pendingFees = instPend;
                        dummyObj.instPendDetails = formatInst
                        dummyObj.status = await convertToCaps("Pending")
                        if (totalPending !== 0) {
                            respData.push(dummyObj)
                        }
                    }
                    return respData
                }
                async function findSearchData(data, srchVal) {
                    let searchedVal = []; pendingDetails.total = 0; pendingDetails.inst = 0; transactionDetails.total = 0;
                    if (data.length == 0) {
                        return searchedVal;
                    } else {
                        data.map((dataOne, i) => {
                            if (
                                String(dataOne.regId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.registerId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.studentRegId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.studentName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.section).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.academicYear).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.displayName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.studentDisplayName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.studentPhone).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.studentPhoneNumber).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.studentEmail).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.parentName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.parentPhone).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.parentEmail).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.category).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.programPlanId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.totalPlannedAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.totalPaidAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.totalPendingAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.plannedAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.paidAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.pendingAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.campusId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.status).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.class).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.classBatch).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.emailCommunicationRefIds).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.receiptNo).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.name).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.email).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.mobile).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.applicationId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.label).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                                String(dataOne.campusName).toLowerCase().includes(String(srchVal).toLowerCase()) == true
                            ) {
                                searchedVal.push(dataOne);
                                if (String(type) == "feePending") {
                                    pendingDetails.total = Number(pendingDetails.total) + Number(dataOne.pendingAmount);
                                    if (dataOne.instPendDetails.length != 0) {
                                        dataOne.instPendDetails.map((item) => {
                                            pendingDetails.inst = Number(pendingDetails.inst) + Number(item.pending);
                                        })
                                    }
                                }
                                if (String(type) == "transaction") {
                                    transactionDetails.total = Number(transactionDetails.total) + Number(dataOne.amount);
                                    transactionDetails.modeWise.find(o =>
                                        String(o.label).toLowerCase() == String(dataOne.data.method).toLowerCase() ? o.paid = Number(o.paid) + Number(dataOne.amount) : null
                                    )
                                }
                                if (String(type) == "application") {
                                    applicationDetails.totalCount.find(o =>
                                        String(o.label).toLowerCase() == String(dataOne.currencyCode).toLowerCase() ?
                                            o.total = Number(o.total) + Number(dataOne.amount)
                                            : null
                                    )
                                    applicationDetails.totalCount.find(o =>
                                        String(o.label).toLowerCase() == String(dataOne.currencyCode).toLowerCase() ?
                                            o.count = Number(o.count + 1)
                                            : null
                                    )
                                }
                                if (String(type) == "feeTypeTransaction") {
                                    feeTypeTxnDetails.methodWise.find(o =>
                                        String(o.label).toLowerCase() == String(dataOne.data.method).toLowerCase() ? o.paid = Number(o.paid) + Number(dataOne.amount) : null
                                    )
                                }
                            }
                            else { }
                        });
                        return searchedVal;
                    }
                }
                async function getTransactionReport() {
                    var newToDate = new Date(toDate);
                    newToDate = newToDate.setDate(newToDate.getDate() + 1);

                    filterMatch.transactionDetails = {
                        $elemMatch: {
                            transactionSubType: 'feePayment',
                            status: { $not: { $eq: String("Cancelled") } },
                            createdAt: {
                                $gte: new Date(fromDate),
                                $lte: new Date(newToDate)
                            }
                        }
                    }

                    let aggregateData = [
                        { $match: filterMatch },
                        {
                            $project: {
                                _id: 0,
                                plannedAmount: "$feePlanDetails.plannedAmount",
                                paidAmount: "$feePlanDetails.paidAmount",
                                pendingAmount: "$feePlanDetails.pendingAmount",
                                discountAmount: "$feePlanDetails.DiscountAmount",
                                transactionDetails: {
                                    $filter: {
                                        input: "$transactionDetails",
                                        as: "index",
                                        cond: {
                                            $and: [
                                                { $gte: ["$$index.createdAt", new Date(fromDate)] },
                                                { $lte: ["$$index.createdAt", new Date(newToDate)] },
                                            ]
                                        },
                                    }
                                },
                            },
                        },
                    ];
                    let txnRespData = await reportModel.aggregate(aggregateData)
                    let respData = [];
                    transactionDetails.total = 0;
                    for (let i = 0; i < txnRespData.length; i++) {
                        const element = txnRespData[i];
                        let dummyObj = {};
                        transactionDetails.total = Number(element.paidAmount) + Number(transactionDetails.total);
                        dummyObj.plannedAmount = element.plannedAmount;
                        dummyObj.paidAmount = element.paidAmount;
                        dummyObj.pendingAmount = element.pendingAmount;
                        dummyObj.discountAmount = element.discountAmount;
                        if (element.transactionDetails.length > 1) {
                            element.transactionDetails.map(item => {
                                let dummyObj1 = dummyObj;
                                dummyObj1 = { ...dummyObj, ...item };
                                respData.push(dummyObj1);
                            })
                        } else {
                            dummyObj = { ...dummyObj, ...element.transactionDetails[0] };
                            respData.push(dummyObj);
                        }
                    }
                    respData.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
                    transactionDetails.modeWise = await calcModeWiseData();
                    return respData
                }
                async function calcModeWiseData() {
                    let newToDate = new Date(toDate);
                    newToDate = newToDate.setDate(newToDate.getDate() + 1);
                    let modeData = [];
                    for (let i = 0; i < methodNames.length; i++) {
                        let dummyObj = {};
                        dummyObj.label = await convertToCaps(`${methodNames[i]}`);
                        dummyObj.color = `${colorCodes[i]}`;

                        let getMode = await reportModel.aggregate([
                            {
                                $unwind: "$transactionDetails"
                            },
                            {
                                $match: {
                                    "transactionDetails.createdAt": { $gte: new Date(fromDate), $lte: new Date(newToDate) },
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
                        dummyObj.paid = searchKey != undefined ? 0 : getMode.length != 0 ? getMode[0].paid : 0;
                        modeData.push(dummyObj)
                    }
                    return modeData
                }
                async function getFeeCollectionReport() {
                    let aggregateData = [
                        {
                            $match: filterMatch
                        },
                        {
                            $sort: {
                                studentRegId: 1
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                regId: "$studentDetails.studentRegId",
                                studentId: "$studentDetails.studentId",
                                studentName: { $concat: ["$studentDetails.firstName", " ", "$studentDetails.lastName"], },
                                campusId: "$campusId",
                                campusName: "$campusDetails.displayName",
                                classBatch: "$programPlanDetails.title",
                                section: "$studentDetails.section",
                                studentDisplayName: "$studentDetails.displayName",
                                academicYear: "$programPlanDetails.academicYear",
                                studentPhone: "$studentDetails.phoneNo",
                                studentEmail: "$studentDetails.email",
                                parentName: "$studentDetails.parentName",
                                parentPhone: "$studentDetails.parentPhone",
                                parentEmail: "$studentDetails.parentEmail",
                                category: "$studentDetails.category",
                                programPlanId: "$studentDetails.programPlanId",
                                totalPlannedAmount: "$feePlanDetails.plannedAmount",
                                totalPaidAmount: "$feePlanDetails.paidAmount",
                                totalPendingAmount: "$feePlanDetails.pendingAmount",
                                installmentData: {
                                    $map: {
                                        input: "$installmentDetails",
                                        as: "item",
                                        in: {
                                            title: "$$item.label",
                                            totalAmount: "$$item.plannedAmount",
                                            paidAmount: "$$item.paidAmount",
                                            pendingAmount: "$$item.pendingAmount",
                                            discountAmount: "$$item.discountAmount",
                                        }
                                    }
                                },


                            },
                        }
                    ];
                    let calcFeeCollection = await reportModel.aggregate(aggregateData);
                    return calcFeeCollection
                }
                async function getApplicationReport() {
                    let appMatchAggr = {};
                    let newToDate = new Date(toDate);
                    newToDate = newToDate.setDate(newToDate.getDate() + 1);

                    appMatchAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
                    let appRespData = await applicationModel.aggregate([
                        {
                            $match: appMatchAggr
                        }
                    ]);
                    await calcApplicationData();
                    return appRespData
                }
                async function calcApplicationData() {
                    let appAggr = {}; let getTotalResp = [];
                    let newToDate = new Date(toDate);
                    newToDate = newToDate.setDate(newToDate.getDate() + 1);
                    appAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
                    for (let i = 0; i < currencyTypes.length; i++) {
                        appAggr.currencyCode = String(currencyTypes[i]);
                        let appRespData = await applicationModel.aggregate([
                            {
                                $match: appAggr
                            },
                            {
                                $group: {
                                    _id: 0,
                                    data: { $sum: "$amount" },
                                    count: { $sum: 1 }
                                }
                            },
                            {
                                $project: {
                                    total: "$data",
                                    count: "$count"
                                }
                            }
                        ]);
                        getTotalResp.push({
                            label: `${currencyTypes[i]}`,
                            total: searchKey != undefined ? 0 : appRespData.length != 0 ? appRespData[0].total : 0,
                            count: searchKey != undefined ? 0 : appRespData.length != 0 ? appRespData[0].count : 0
                        });
                    }
                    applicationDetails.totalCount = getTotalResp;
                    return null
                }
                async function errorTypeResp() {
                    return res.status(400).send({
                        status: "failed",
                        message: "Reports 'type' query is not matching. Please provide valid report type."
                    })
                }
                async function getFeeTypeData() {
                    let filterFeeType = {}; let feeTypeDatas = [];
                    filterFeeType.status = 1;
                    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                        filterFeeType.campusId = String(campus);
                    }
                    const feeTypeData = await feeTypeModel.find(filterFeeType);
                    const campusData = await campusModel.find({});
                    if (feeTypeData.length != 0) {
                        for (let i = 0; i < feeTypeData.length; i++) {
                            const filterCampus = campusData.find(o => String(o._doc._id) == String(feeTypeData[i]._doc.campusId));
                            let dummyObj = {};
                            dummyObj.id = feeTypeData[i]._doc._id;
                            dummyObj.displayName = feeTypeData[i]._doc.displayName;
                            dummyObj.label = feeTypeData[i]._doc.title;
                            dummyObj.partialAllowed = feeTypeData[i]._doc.partialAllowed;
                            dummyObj.status = feeTypeData[i]._doc.status;
                            dummyObj.campusId = feeTypeData[i]._doc.campusId;
                            dummyObj.campusName = filterCampus._doc.displayName;
                            let getTxnDetail = await transactionModel.aggregate([
                                {
                                    $match: {
                                        "data.feesBreakUp.feeTypeCode": `${feeTypeData[i]._doc.displayName}`
                                    }
                                },
                                {
                                    $group: {
                                        _id: 0,
                                        total: {
                                            $sum: "$amount"
                                        },
                                        count: { $sum: 1 }
                                    }
                                },
                                {
                                    $project: {
                                        total: "$total",
                                        count: "$count"
                                    }
                                }
                            ]);
                            dummyObj.totalPaid = getTxnDetail.length != 0 ? getTxnDetail[0].total : 0;
                            dummyObj.totalTransactions = getTxnDetail.length != 0 ? getTxnDetail[0].count : 0;
                            feeTypeDatas.push(dummyObj);
                        }
                        return feeTypeDatas
                    }
                    else {
                        return feeTypeDatas
                    }
                }
                async function getFeeTypeTransactionData() {
                    let filterTransaction = {};
                    var newToDate = new Date(toDate);
                    newToDate = newToDate.setDate(newToDate.getDate() + 1);
                    const feeTypeDetail = await feeTypeModel.find({ _id: mongoose.Types.ObjectId(feeType) });

                    filterTransaction.transactionSubType = "feePayment";
                    filterTransaction.status = { $not: { $eq: String("Cancelled") } };

                    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                        filterTransaction.campusId = String(campus);
                    }
                    if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                        filterTransaction.programPlan = mongoose.Types.ObjectId(programPlan);
                    }
                    if (fromDate != undefined && toDate != undefined) {
                        filterTransaction.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
                    }
                    if (feeTypeDetail.length != 0) {
                        let getTransactData = await transactionModel.aggregate([
                            {
                                $match: filterTransaction
                            },
                            {
                                $match: {
                                    "data.feesBreakUp.feeTypeCode": feeTypeDetail[0].displayName
                                }
                            }
                        ]);
                        feeTypeTxnDetails.methodWise = [];
                        for (let i = 0; i < methodNames.length; i++) {
                            let filterMode = getTransactData.filter(o => o.data.method == methodNames[i]);
                            let calcTotAmount = filterMode.reduce(function (cnt, o) { return cnt + o.amount; }, 0);
                            feeTypeTxnDetails.methodWise.push({
                                label: await convertToCaps(methodNames[i]),
                                paid: searchKey != undefined ? 0 : Number(calcTotAmount),
                                color: colorCodes[i]
                            })
                        }
                        return getTransactData
                    }
                    else {
                        res.status(400).send({
                            status: "failed",
                            message: "Reports 'feeType' query is not matching. please provide valid fee type id."
                        })
                    }
                }
                async function getStudentStatement() {
                    let statementAggr = {};
                    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                        statementAggr.campusId = String(campus);
                    }
                    if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                        statementAggr.programPlanId = mongoose.Types.ObjectId(programPlan);
                    }

                    let getStatement = await reportModel.aggregate([
                        {
                            $match: statementAggr
                        },
                        {
                            $group: {
                                _id: 0,
                                data: {
                                    $push: {
                                        regId: "$studentRegId",
                                        studentId: "$studentDetails.studentId",
                                        status: "$studentDetails.status",
                                        displayName: "$studentDetails.displayName",
                                        studentName: { $concat: ["$studentDetails.firstName", " ", "$studentDetails.lastName"] },
                                        section: "$studentDetails.section",
                                        academicYear: "$programPlanDetails.academicYear",
                                        classbatch: "$programPlanDetails.title",
                                        planned: "$feePlanDetails.plannedAmount",
                                        paid: "$feePlanDetails.paidAmount",
                                        pending: "$feePlanDetails.pendingAmount",
                                        discount: "$feePlanDetails.discountAmount",
                                        concession: "$feePlanDetails.concessionFees",
                                        transactions: "$transactionDetails"
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                data: "$data"
                            }
                        }
                    ]);
                    return getStatement.length != 0 ? getStatement[0].data : [];
                }
                async function getLoanTransaction() {
                    var newToDate = new Date(toDate);
                    newToDate = newToDate.setDate(newToDate.getDate() + 1);

                    filterMatch.transactionDetails = {
                        $elemMatch: {
                            transactionSubType: 'feePayment',
                            // status: { $not: { $eq: String("Cancelled") } },
                            "data.mode": "Loan",
                            createdAt: {
                                $gte: new Date(fromDate),
                                $lte: new Date(newToDate)
                            }
                        }
                    }

                    let aggregateData = [
                        { $match: filterMatch },
                        {
                            $project: {
                                _id: 0,
                                plannedAmount: "$feePlanDetails.plannedAmount",
                                paidAmount: "$feePlanDetails.paidAmount",
                                pendingAmount: "$feePlanDetails.pendingAmount",
                                discountAmount: "$feePlanDetails.DiscountAmount",
                                transactionDetails: {
                                    $filter: {
                                        input: "$transactionDetails",
                                        as: "index",
                                        cond: {
                                            $and: [
                                                { $gte: ["$$index.createdAt", new Date(fromDate)] },
                                                { $lte: ["$$index.createdAt", new Date(newToDate)] },
                                            ]
                                        },
                                    }
                                },
                            },
                        },
                    ];
                    let txnRespData = await reportModel.aggregate(aggregateData)
                    let respData = [];
                    transactionDetails.total = 0;
                    for (let i = 0; i < txnRespData.length; i++) {
                        const element = txnRespData[i];
                        let dummyObj = {};
                        transactionDetails.total = Number(element.paidAmount) + Number(transactionDetails.total);
                        dummyObj.plannedAmount = element.plannedAmount;
                        dummyObj.paidAmount = element.paidAmount;
                        dummyObj.pendingAmount = element.pendingAmount;
                        dummyObj.discountAmount = element.discountAmount;
                        if (element.transactionDetails.length > 1) {
                            element.transactionDetails.map(item => {
                                let dummyObj1 = dummyObj;
                                dummyObj1 = { ...dummyObj, ...item };
                                respData.push(dummyObj1);
                            })
                        } else {
                            dummyObj = { ...dummyObj, ...element.transactionDetails[0] };
                            respData.push(dummyObj);
                        }
                    }
                    respData.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
                    return respData
                }
                async function getRefundReport() {
                    var newToDate = new Date(toDate);
                    newToDate = newToDate.setDate(newToDate.getDate() + 1);

                    filterMatch.transactionDetails = {
                        $elemMatch: {
                            transactionSubType: 'refund',
                            status: { $not: { $eq: String("Cancelled") } },
                            createdAt: {
                                $gte: new Date(fromDate),
                                $lte: new Date(newToDate)
                            }
                        }
                    }

                    let aggregateData = [
                        { $match: filterMatch },
                        {
                            $project: {
                                _id: 0,
                                plannedAmount: "$feePlanDetails.plannedAmount",
                                paidAmount: "$feePlanDetails.paidAmount",
                                pendingAmount: "$feePlanDetails.pendingAmount",
                                discountAmount: "$feePlanDetails.DiscountAmount",
                                transactionDetails: {
                                    $filter: {
                                        input: "$transactionDetails",
                                        as: "index",
                                        cond: {
                                            $and: [
                                                { $gte: ["$$index.createdAt", new Date(fromDate)] },
                                                { $lte: ["$$index.createdAt", new Date(newToDate)] },
                                            ]
                                        },
                                    }
                                },
                            },
                        },
                    ];
                    let txnRespData = await reportModel.aggregate(aggregateData)
                    let respData = [];
                    transactionDetails.total = 0;
                    for (let i = 0; i < txnRespData.length; i++) {
                        const element = txnRespData[i];
                        let dummyObj = {};
                        transactionDetails.total = Number(element.paidAmount) + Number(transactionDetails.total);
                        dummyObj.plannedAmount = element.plannedAmount;
                        dummyObj.paidAmount = element.paidAmount;
                        dummyObj.pendingAmount = element.pendingAmount;
                        dummyObj.discountAmount = element.discountAmount;
                        if (element.transactionDetails.length > 1) {
                            element.transactionDetails.map(item => {
                                let dummyObj1 = dummyObj;
                                dummyObj1 = { ...dummyObj, ...item };
                                respData.push(dummyObj1);
                            })
                        } else {
                            dummyObj = { ...dummyObj, ...element.transactionDetails[0] };
                            respData.push(dummyObj);
                        }
                    }
                    respData.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
                    return respData
                }
            }
            catch (err) {
                res.status(400).send({
                    status: "failed",
                    message: err.message
                })
                centralDbConnection.close();
                dbConnection.close();
            }
            finally { }
        }
        else {
            res.status(400).json({
                message: "Reports 'type' query is missing. Please provide all the required parameters.",
                status: 'failure'
            })
        }
    }
    else {
        res.status(400).send({
            status: "failed",
            message: "Reports 'orgId' query is missing. please provide all the required parameters."
        })
    }
}