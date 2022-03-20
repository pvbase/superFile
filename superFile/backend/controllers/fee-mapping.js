const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../models/orglists-schema");
const campusSchema = require("../models/campusModel");
const studentSchema = require("../models/studentModel");
const feeStructureSchema = require("../models/feeStructureModel");
const programPlanSchema = require("../models/programPlanModel");
const { dataPagination, convertToCaps } = require("../controllers/flatten-reports/reports-support");

module.exports.getFeeMappingData = async (req, res) => {
    const { orgId, campus, fromDate, toDate, programPlan, page, limit, searchKey } = req.query;

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

        const studentFeePlanModel = dbConnection.model("studentfeeplans", allSchema);
        const campusModel = await dbConnection.model("campuses", campusSchema);
        const studentsModel = await dbConnection.model("students", studentSchema);
        const feeStructureModel = await dbConnection.model("feestructures", feeStructureSchema);
        const programPlanModel = await dbConnection.model("programplans", programPlanSchema);

        try {
            let studAggr = {};
            if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                studAggr.programPlanId = mongoose.Types.ObjectId(programPlan);
            }
            if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                studAggr.campusId = String(campus);
            }
            const getFeePlan = await studentFeePlanModel.find({});
            const getCampus = await campusModel.find({});
            const getStudents = await studentsModel.find(studAggr);
            const getFeeStructure = await feeStructureModel.find({});
            const getProgramPlan = await programPlanModel.find({});

            if (getStudents.length != 0) {
                if (page == undefined || limit == undefined) {
                    var finalResult = [];
                    for (let i = 0; i < getStudents.length; i++) {
                        let dummyObj = {};
                        let findFeePlan = await getFeePlan.find(o => String(o._doc.studentRegId) == String(getStudents[i]._doc.regId));
                        let findProgramPlan = getProgramPlan.find(o => String(o._id) == String(getStudents[i]._doc.programPlanId));
                        let findCampus = getCampus.find(o => String(o._doc._id) == String(getStudents[i]._doc.campusId));
                        let findFeeStructure = getFeeStructure.find(o => String(o._doc._id) == String(getStudents[i]._doc.feeStructureId));
                        let feesDetails = {
                            plan: findFeePlan != undefined ? findFeePlan._doc.plannedAmount : 0,
                            paid: findFeePlan != undefined ? findFeePlan._doc.paidAmount : 0,
                            pending: findFeePlan != undefined ? findFeePlan._doc.pendingAmount : 0,
                            totalAmount: findFeePlan != undefined ? findFeePlan._doc.totalAmount : 0,
                            discount: findFeePlan != undefined ? findFeePlan._doc.discountAmount : 0
                        }
                        if (Number(i) == 5) {
                            console.log(findFeePlan, findFeeStructure);
                        }
                        dummyObj.feesDetails = feesDetails;
                        dummyObj.studentName = getStudents[i]._doc.firstName + " " + getStudents[i].lastName;
                        dummyObj.studentId = getStudents[i]._doc.displayName;
                        dummyObj.regId = getStudents[i]._doc.regId;
                        dummyObj.campusName = findCampus != undefined ? findCampus.name : "-";
                        dummyObj.campusId = findCampus != undefined ? findCampus.campusId : "-";
                        dummyObj.classBatch = findProgramPlan != undefined ? findProgramPlan.title : "-";
                        dummyObj.createdOn = getStudents[i]._doc.createdAt;
                        dummyObj.createdBy = getStudents[i]._doc.createdBy;
                        dummyObj.feeStructureId = findFeeStructure.displayName;
                        dummyObj.status = getStudents[i]._doc.status;
                        dummyObj.category = getStudents[i]._doc.category;
                        finalResult.push(dummyObj);
                    }
                    res.send({
                        status: "success",
                        totalRecord: finalResult.length,
                        data: finalResult,
                        totalPage: null,
                        currentPage: Number(page),
                        perPage: Number(limit),
                        nextPage: null,
                        message: "Student fee mapping - all data."
                    });
                }
                else {
                    if (searchKey != undefined && searchKey != "") {
                        var finalResult = [];
                        for (let i = 0; i < getStudents.length; i++) {
                            let dummyObj = {};
                            let findFeePlan = await getFeePlan.find(o => String(o._doc.studentRegId) == String(getStudents[i]._doc.regId));
                            let findProgramPlan = getProgramPlan.find(o => String(o._id) == String(getStudents[i]._doc.programPlanId));
                            let findCampus = getCampus.find(o => String(o._doc._id) == String(getStudents[i]._doc.campusId));
                            let findFeeStructure = getFeeStructure.find(o => String(o._doc._id) == String(getStudents[i]._doc.feeStructureId));
                            let feesDetails = {
                                plan: findFeePlan != undefined ? findFeePlan._doc.plannedAmount : 0,
                                paid: findFeePlan != undefined ? findFeePlan._doc.paidAmount : 0,
                                pending: findFeePlan != undefined ? findFeePlan._doc.pendingAmount : 0,
                                totalAmount: findFeePlan != undefined ? findFeePlan._doc.totalAmount : 0,
                                discount: findFeePlan != undefined ? findFeePlan._doc.discountAmount : 0
                            }
                            if (Number(i) == 5) {
                                console.log(findFeePlan, findFeeStructure);
                            }
                            dummyObj.feesDetails = feesDetails;
                            dummyObj.studentName = getStudents[i]._doc.firstName + " " + getStudents[i].lastName;
                            dummyObj.studentId = getStudents[i]._doc.displayName;
                            dummyObj.regId = getStudents[i]._doc.regId;
                            dummyObj.campusName = findCampus != undefined ? findCampus.name : "-";
                            dummyObj.campusId = findCampus != undefined ? findCampus.campusId : "-";
                            dummyObj.classBatch = findProgramPlan != undefined ? findProgramPlan.title : "-";
                            dummyObj.createdOn = getStudents[i]._doc.createdAt;
                            dummyObj.createdBy = getStudents[i]._doc.createdBy;
                            dummyObj.feeStructureId = findFeeStructure.displayName;
                            dummyObj.status = getStudents[i]._doc.status;
                            dummyObj.category = getStudents[i]._doc.category;
                            finalResult.push(dummyObj);
                        }
                        let searchFields = await findSearchData(finalResult, searchKey);
                        let convertToPaginate = await dataPagination(searchFields, page, limit);
                        let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
                        res.send({
                            status: "success",
                            totalRecord: searchFields.length,
                            data: convertToPaginate,
                            totalPage: calcTotpageVal,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                            message: "Student fee mapping - search and paginated data."
                        });
                    }
                    else {
                        var finalResult = [];
                        for (let i = 0; i < getStudents.length; i++) {
                            let dummyObj = {};
                            let findFeePlan = await getFeePlan.find(o => String(o._doc.studentRegId) == String(getStudents[i]._doc.regId));
                            let findProgramPlan = getProgramPlan.find(o => String(o._id) == String(getStudents[i]._doc.programPlanId));
                            let findCampus = getCampus.find(o => String(o._doc._id) == String(getStudents[i]._doc.campusId));
                            let findFeeStructure = getFeeStructure.find(o => String(o._doc._id) == String(getStudents[i]._doc.feeStructureId));
                            let feesDetails = {
                                plan: findFeePlan != undefined ? findFeePlan._doc.plannedAmount : 0,
                                paid: findFeePlan != undefined ? findFeePlan._doc.paidAmount : 0,
                                pending: findFeePlan != undefined ? findFeePlan._doc.pendingAmount : 0,
                                totalAmount: findFeePlan != undefined ? findFeePlan._doc.totalAmount : 0,
                                discount: findFeePlan != undefined ? findFeePlan._doc.discountAmount : 0
                            }
                            if (Number(i) == 5) {
                                console.log(findFeePlan, findFeeStructure);
                            }
                            dummyObj.feesDetails = feesDetails;
                            dummyObj.studentName = getStudents[i]._doc.firstName + " " + getStudents[i].lastName;
                            dummyObj.studentId = getStudents[i]._doc.displayName;
                            dummyObj.regId = getStudents[i]._doc.regId;
                            dummyObj.campusName = findCampus != undefined ? findCampus.name : "-";
                            dummyObj.campusId = findCampus != undefined ? findCampus.campusId : "-";
                            dummyObj.classBatch = findProgramPlan != undefined ? findProgramPlan.title : "-";
                            dummyObj.createdOn = getStudents[i]._doc.createdAt;
                            dummyObj.createdBy = getStudents[i]._doc.createdBy;
                            dummyObj.feeStructureId = findFeeStructure.displayName;
                            dummyObj.status = getStudents[i]._doc.status;
                            dummyObj.category = getStudents[i]._doc.category;
                            finalResult.push(dummyObj);
                        }
                        let convertToPaginate = await dataPagination(finalResult, page, limit);
                        let calcTotpageVal = Math.ceil(Number(finalResult.length) / Number(limit));
                        res.send({
                            status: "success",
                            totalRecord: finalResult.length,
                            data: convertToPaginate,
                            totalPage: calcTotpageVal,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                            message: "Student fee mapping - paginated data."
                        });
                    }
                }
            }
            else {
                res.send({
                    status: "success",
                    totalRecord: 0,
                    data: [],
                    totalPage: 0,
                    currentPage: Number(page),
                    perPage: Number(limit),
                    nextPage: null,
                    message: "Student fee mapping - No data."
                });
            }
            async function findSearchData(data, srchVal) {
                let searchedVal = [];
                if (data.length == 0) {
                    return searchedVal;
                } 
                else {
                    data.map((dataOne, i) => {
                        if (
                            String(dataOne.studentName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                            String(dataOne.studentId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                            String(dataOne.regId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                            String(dataOne.campusName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                            String(dataOne.campusId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                            String(dataOne.classBatch).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                            String(dataOne.feeStructureId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
                            String(dataOne.category).toLowerCase().includes(String(srchVal).toLowerCase()) == true
                        ) {
                            searchedVal.push(dataOne);
                        }
                        else { }
                    });
                    return searchedVal;
                }
            }
        }
        catch (err) {
            res.status(400).send({
                status: "failed",
                message: err.message
            })
        }
        finally { }

    }
    else {
        res.status(400).send({
            status: "failed",
            message: "student fee mapping - 'orgId' query is missing. please provide all the required parameters."
        })
    }
}