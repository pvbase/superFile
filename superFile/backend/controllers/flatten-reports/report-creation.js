const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const orgListSchema = require("../../models/orglists-schema");
const studentSchema = require("../../models/studentModel");
const feePlanSchema = require("../../models/feeplanModel");
const installmentSchema = require("../../models/feeplanInstallment");
const campusSchema = require("../../models/campusModel");
const programPlanSchema = require("../../models/programPlanModel");
const transactionSchema = require("../../models/transactionsModel");
const GuardianSchema = require("../../models/guardianModel")
const feesLedgerSchema = require("../../models/feesLedgerModel")
const reportSchema = require("./report-schema");
const reportCollectionName = "reportdetails";

async function deleteCollection(req, res) {
    const { orgId } = req.query;
    let dbConnection;
    let centralDbConnection;
    centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");

    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
    dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);
    var reportModel = dbConnection.model("reportdetails", reportSchema, "reportdetails");

    await reportModel.deleteMany().then(function (data) {
        if (data) console.log("Deleted all records in reportDetails collection");
        else return console.log("No records in reportDetails collection found");
    });
    res.send({
        message: "successfully cleared the collection",
        status: true
    })
}
async function createNewReportCollection(req, res) {
    const { orgId } = req.query;
    if (orgId != undefined) {
        const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
        const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
        const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });

        if (!orgData || orgData == null) {
            centralDbConnection.close();
            res.status(500).send({
                status: "failure",
                message: "Organization not found",
            });
        }
        const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

        const studentModel = dbConnection.model("students", studentSchema);
        const feePlanModel = dbConnection.model("studentfeeplans", feePlanSchema);
        const guardianModel = dbConnection.model("guardians", GuardianSchema);
        const installmentModel = dbConnection.model("studentfeeinstallmentplans", installmentSchema);
        const campusModel = dbConnection.model("campuses", campusSchema);
        const programPlanModel = dbConnection.model("programplans", programPlanSchema);
        const transactionModel = dbConnection.model("transactions", transactionSchema);
        const feesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
        const reportCreation = dbConnection.model(`${reportCollectionName}`, reportSchema, `${reportCollectionName}`);
        const reportModel = dbConnection.model("reportdetails", reportSchema);

        try {
            await reportModel.deleteMany().then(function (data) {
                if (data) console.log("Deleted all records in reportDetails collection");
                else return console.log("No records in reportDetails collection found");
            });
            console.log("Initialize new report creation");
            const getStudentData = await studentModel.find({});
            const getCampusData = await campusModel.find({});
            const getProgramPlanData = await programPlanModel.find({});
            const guardianData = await guardianModel.find({})
            const getFeePlanData = await feePlanModel.find({});
            const getFeeLedgerData = await feesLedgerModel.find({});
            const getInstallmentData = await installmentModel.find({});
            const getTransactionData = await transactionModel.find({});

            for (let i = 0; i < getFeePlanData.length; i++) {
                let feePlanItem = getFeePlanData[i]._doc
                console.log("S.NO. :", i + 1, "Student ID: ", feePlanItem.studentRegId);

                let studentInfoData = getStudentData.find(item => String(item.regId) == String(feePlanItem.studentRegId))
                let studentCampusData = getCampusData.find(item => String(item._id) == String(studentInfoData.campusId))
                let studentPPData = getProgramPlanData.find(item => String(item._id) == String(studentInfoData.programPlanId))
                let studentGuardianData = guardianData.find(item => String(item._id) == String(studentInfoData.guardianDetails[0]))
                let studentInstData = getInstallmentData.filter(item => String(item.feePlanId) == String(feePlanItem._id))
                let studentTxnData = getTransactionData.filter(item => (String(item.studentRegId) == String(studentInfoData.regId)) && String(item.transactionSubType) == "feePayment")
                // let studentLedgerData = getFeeLedgerData.filter(item => String(item.studentRegId) == String(studentInfoData.studentRegId))

                var payloadObj = {};
                payloadObj.studentRegId = studentInfoData.regId
                payloadObj.feePlanId = feePlanItem._id
                payloadObj.programPlanId = studentInfoData.programPlanId;
                payloadObj.campusId = studentInfoData.campusId;
                payloadObj.studentDetails = {
                    studentId: studentInfoData._id,
                    studentRegId: studentInfoData.regId,
                    displayName: studentInfoData.displayName,
                    rollNumber: studentInfoData.rollNumber,
                    firstName: studentInfoData.firstName,
                    lastName: studentInfoData.lastName,
                    section: studentInfoData.section,
                    dob: studentInfoData.dob,
                    phoneNo: studentInfoData.phoneNo,
                    email: studentInfoData.email,
                    category: studentInfoData.category,
                    gender: studentInfoData.gender,
                    citizenship: studentInfoData.citizenship,
                    currency: studentInfoData.currency,
                    FOREX: studentInfoData.FOREX,
                    admittedOn: studentInfoData.admittedOn,
                    parentName: studentInfoData.parentName,
                    parentPhone: studentInfoData.parentPhone,
                    parentEmail: studentInfoData.parentEmail,
                    guardianDetails: {
                        guardianId: studentGuardianData._id,
                        firstName: studentGuardianData.firstName,
                        lastName: studentGuardianData.lastName,
                        fullName: studentGuardianData.fullName,
                        phoneNumber: studentGuardianData.phoneNumber,
                        email: studentGuardianData.email,
                        relation: studentGuardianData.relation
                    },
                    status: studentInfoData.status,
                    isFinalYear: studentInfoData.isFinalYear
                };
                payloadObj.campusDetails = {
                    headaId: studentCampusData.headaId,
                    displayName: studentCampusData.displayName,
                    campusdisplayName: studentCampusData.campusId,
                    name: studentCampusData.name,
                    legalName: studentCampusData.legalName,
                    logo: studentCampusData.logo
                };
                payloadObj.programPlanDetails = {
                    programPlanId: studentPPData ? studentPPData._id : '',
                    displayName: studentPPData ? studentPPData.displayName : '',
                    title: studentPPData ? studentPPData.title : '',
                    fromDate: studentPPData ? studentPPData.fromDate : '',
                    toDate: studentPPData ? studentPPData.toDate : '',
                    academicYear: studentPPData ? studentPPData.academicYear : '',
                    description: studentPPData ? studentPPData.description : ''
                };
                payloadObj.feePlanDetails = {
                    programPlanHEDAId: feePlanItem.programPlanHEDAId,
                    plannedAmount: feePlanItem.plannedAmount,
                    paidAmount: feePlanItem.paidAmount,
                    pendingAmount: feePlanItem.pendingAmount,
                    discountType: feePlanItem.discountType,
                    discountPercentage: feePlanItem.discountPercentage,
                    discountAmount: feePlanItem.discountAmount,
                    concessionFees: feePlanItem.concessionFees
                }
                let instData = []
                for (let j = 0; j < studentInstData.length; j++) {
                    const item = studentInstData[j];
                    let obj = {
                        installmentId: item._id,
                        label: item.label,
                        description: item.description,
                        dueDate: new Date(item.dueDate),
                        lateFeeStartDate: new Date(item.lateFeeStartDate),
                        percentage: item.percentage,
                        plannedAmount: item.plannedAmount,
                        paidAmount: item.paidAmount,
                        pendingAmount: item.pendingAmount,
                        discountType: item.discountType,
                        discountPercentage: item.discountPercentage,
                        discountAmount: item.discountAmount,
                        status: item.status,
                        lateFees: item.lateFees,
                        concessionFees: item.concessionFees
                    }
                    instData.push(obj)
                }
                payloadObj.installmentDetails = instData.sort((a, b) => (a.label > b.label ? 1 : -1));

                let txnData = []
                if (studentTxnData) {
                    for (let k = 0; k < studentTxnData.length; k++) {
                        let item = studentTxnData[k];
                        let currentLedgerItem = getFeeLedgerData.find(ledItem => {
                            let ledgerId = item.feesLedgerIds[item.feesLedgerIds.length - 1]
                            if (String(ledItem._id) == String(ledgerId) && (String(ledItem.studentRegId).toUpperCase() == String(item.studentRegId).toUpperCase())) {
                                return ledItem
                            }
                        })
                        item['pendingAmount'] = currentLedgerItem ? currentLedgerItem.pendingAmount : '-'
                        txnData.push(item)
                    }
                }
                payloadObj.transactionDetails = txnData.sort((a, b) => (a.displayName > b.displayName ? 1 : -1));
                let createReport = new reportCreation(payloadObj);
                createReport.save()
            }
            console.log('Report Successfully Created')
            return res.send({
                status: "success",
                message: "Report data created successfully."
            })
            centralDbConnection.close();
            dbConnection.close();

        }
        catch (err) {
            res.status(400).send({
                status: "failed",
                error: err.message
            })
            centralDbConnection.close();
            dbConnection.close();
        }
        finally { }
    }
    else {
        res.status(400).send({
            status: "failed",
            message: "Report creation 'orgId' query is missing. please provide all the required parameters."
        })
    }
}
async function getReportDetails(req, res) {
    const { orgId, regId, page, limit } = req.query;

    const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });

    if (!orgData || orgData == null) {
        centralDbConnection.close();
        res.status(500).send({
            status: "failure",
            message: "Organization not found",
        });
    }
    const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);
    const reportDetailModel = dbConnection.model(reportCollectionName, reportSchema, reportCollectionName)

    let itemsPerPage = parseInt(limit);
    let currentPage = parseInt(page);
    let skipItems = parseInt(itemsPerPage * currentPage - itemsPerPage);
    let aggregateData = []
    let responseData = []
    if (regId && regId.length !== 0) {

        aggregateData = [{
            $match: {
                studentRegId: regId
            }
        }]
        responseData = await reportDetailModel.aggregate(aggregateData)

        res.send({
            message: `${regId} - Student record found`,
            data: responseData,
        })
    }
    else if (page && limit) {
        aggregateData = [
            {
                $facet: {
                    metadata: [
                        { $count: "total" },
                        {
                            $addFields: {
                                page: currentPage,
                                itemsPerPage,
                                totalPages: {
                                    $ceil: { $divide: ["$total", itemsPerPage] },
                                },
                                nextPage: {
                                    $cond: {
                                        if: {
                                            $gt: [
                                                {
                                                    $ceil: { $divide: ["$total", itemsPerPage] },
                                                },
                                                currentPage,
                                            ],
                                        },
                                        then: currentPage + 1,
                                        else: null,
                                    },
                                },
                            },
                        },
                    ],
                    data: [
                        { $skip: skipItems < 0 ? 0 : skipItems },
                        { $limit: itemsPerPage },
                    ], // add projection here wish you re-shape the docs
                },
            },
        ]
        responseData = await reportDetailModel.aggregate(aggregateData)
        var data =
            responseData["0"] != undefined
                ? responseData["0"]["data"] != undefined
                    ? responseData["0"]["data"]
                    : []
                : [];
        var pageDetails =
            responseData["0"] != undefined
                ? responseData["0"]["metadata"] != undefined
                    ? responseData["0"]["metadata"]["0"]
                    : {
                        page: null,
                        nextPage: null,
                        total: null,
                        totalPages: null,
                    }
                : {
                    page: null,
                    nextPage: null,
                    total: null,
                    totalPages: null,
                };
        res.send({
            message: 'success',
            data: data,
            currentPage: pageDetails.page,
            perPage: itemsPerPage,
            nextPage: pageDetails.nextPage,
            totalRecord: pageDetails.total,
            totalPages: pageDetails.totalPages,
        })
    }
    else {

        // let itemsPerPage = await reportDetailModel.countDocuments();
        let data = await reportDetailModel.find({}).sort({ studentRegId: 1 });
        res.status(200).json({
            status: "success",
            message: `Report Details Collection Data`,
            totalRecord: data.length,
            data: data
        })

    }
}

module.exports = {
    createNewReportCollection: createNewReportCollection,
    getReportDetails: getReportDetails,
    deleteCollection: deleteCollection
}