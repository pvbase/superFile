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
const moment = require("moment");

exports.updateReportCollection = async function (orgIdData, studId) {
    const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
    const orgData = await orgListModel.findOne({ _id: orgIdData });
    if (!orgData || orgData == null) {
        centralDbConnection.close();
        return {
            status: "failure",
            message: "Organization not found",
        };
    }
    else {
        const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

        const studentModel = dbConnection.model("students", studentSchema);
        const feePlanModel = dbConnection.model("studentfeeplans", feePlanSchema);
        const guardianModel = dbConnection.model("guardians", GuardianSchema);
        const installmentModel = dbConnection.model("studentfeeinstallmentplans", installmentSchema);
        const campusModel = dbConnection.model("campuses", campusSchema);
        const programPlanModel = dbConnection.model("programplans", programPlanSchema);
        const transactionModel = dbConnection.model("transactions", transactionSchema);
        const feesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
        const reportCreation = dbConnection.model(`${reportCollectionName}`, reportSchema, `${reportCollectionName}`)

        try {
            await reportCreation.deleteOne({ studentRegId: String(studId) });
            const getStudentData = await studentModel.find({});
            const getCampusData = await campusModel.find({});
            const getProgramPlanData = await programPlanModel.find({});
            const guardianData = await guardianModel.find({})
            const getFeePlanData = await feePlanModel.find({ studentRegId: String(studId) });
            const getFeeLedgerData = await feesLedgerModel.find({});
            const getInstallmentData = await installmentModel.find({});
            const getTransactionData = await transactionModel.find({});

            for (let i = 0; i < getFeePlanData.length; i++) {
                let feePlanItem = getFeePlanData[i]._doc
                // console.log('feeplan item', i + 1, feePlanItem.studentRegId,)

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
                    phoneNumber: studentInfoData.phoneNumber,
                    emailId: studentInfoData.emailId,
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
                        dueDate: item.dueDate,
                        lateFeeStartDate: item.lateFeeStartDate,
                        percentage: item.percentage,
                        plannedAmount: item.plannedAmount,
                        paidAmount: item.paidAmount,
                        pendingAmount: item.pendingAmount,
                        discountType: item.discountType,
                        discountPercentage: item.discountPercentage,
                        discountAmount: item.discountAmount,
                        status: item.status
                    }
                    instData.push(obj)
                }
                payloadObj.installmentDetails = instData.sort((a, b) => (a.label > b.label ? 1 : -1));

                let txnData = []
                if (studentTxnData) {
                    for (let k = 0; k < studentTxnData.length; k++) { //2
                        let item = studentTxnData[k];
                        let currentLedgerItem = getFeeLedgerData.find(ledItem => (String(ledItem.transactionDisplayName) == String(item.displayName)) && (String(ledItem.studentRegId).toUpperCase() == String(item.studentRegId).toUpperCase()))
                        item['pendingAmount'] = currentLedgerItem ? currentLedgerItem.pendingAmount : '-'
                        txnData.push(item)
                    }
                }
                payloadObj.transactionDetails = txnData.sort((a, b) => (a.displayName > b.displayName ? 1 : -1));
                let createReport = new reportCreation(payloadObj);
                createReport.save()
            }
            centralDbConnection.close();
            dbConnection.close();
            return `Student data updated successfully. Student ID: ${studId}`;
        }
        catch (err) {
            centralDbConnection.close();
            dbConnection.close();
            return `Failed to update student. Student ID:${studId}`;
        }
        finally { }
    }
}