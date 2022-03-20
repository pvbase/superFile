const { createDatabase } = require("../utils/db_creation");
const moment = require("moment-timezone");
const orgListSchema = require("../models/orglists-schema");
const axios = require("axios");
const studentSchema = require("../models/studentModel");
const programPlanSchema = require("../models/programPlanModel");
const feeStructureSchema = require("../models/feeStructureModel");
const studentFeeMapSchema = require("../models/studentFeeMapModel");
const paymentScheduleSchema = require("../models/paymentScheduleModel");
const guardianSchema = require("../models/guardianModel");
const categorySchema = require("../models/categoryModel");
const lateFeesSchema = require("../models/lateFeeModel");
const transactionSchema = require("../models/transactionsModel");
const feesLedgerSchema = require("../models/feesLedgerModel");
const journeySchema = require("../models/journeyModel");
const feeplanSchema = require("../models/feeplanModel");
const feeInstallmentSchema = require("../models/feeplanInstallment");
const campusSchema = require("../models/campusModel");
const GuardianSchema = require("../models/guardianModel");
const defaultPlan = require("../models/vkgiLeadModel/defaultProgramPlan");
const FeeTypeSchema = require("../models/feeTypeModel");
const { LexRuntime } = require("aws-sdk");
const mongoose = require("mongoose");
const { updateInstallmentPlan } = require("./studentPortalController");
const allSchema = mongoose.Schema({}, { strict: false });
const registrationSchema = require("../models/registrationModel");

async function createNewStudent(req, res) {
    // let inputData = req.body;
    const { orgId } = req.query;
    let dbConnection;
    let centralDbConnection;
    centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
    dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

    try {
        let responses = [];
        let data = req.body;
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            let inputData = {
                plannedAmount: 0,
                studentDetails: item,
            };
            let addedStudent = await addStudentStructure(dbConnection, inputData);
            responses.push(addedStudent);
        }
        console.log(`${responses.length} data items - success`);
        res.status(200).send(responses);
    } catch (err) {
        res.status(404).send({
            status: "failure",
            message: "Student Creation Failure ",
            data: err.message,
        });
        throw err;
    } finally {
        dbConnection.close();
        centralDbConnection.close();
    }
}

async function addStudentStructure(dbConnection, inputData) {
    let studentModel = dbConnection.model("students", studentSchema);
    let guardianModel = dbConnection.model("guardians", guardianSchema);
    let programPlanModel = dbConnection.model("programplans", programPlanSchema);
    let feeStructureModel = dbConnection.model("feestructures", feeStructureSchema);
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanSchema);
    let installFeePlanModel = dbConnection.model("studentfeeinstallmentplans", feeInstallmentSchema);
    let feeMapModel = dbConnection.model("studentfeesmaps", studentFeeMapSchema);
    let programFeesModel = dbConnection.model("defaultprogramplanfees", defaultPlan);
    let campusModel = dbConnection.model("campuses", campusSchema);

    let savedGuardianData;
    let savedStudentData;
    let savedFeeMapData;
    let savedFeePlanData;
    let savedGuardIds = [];
    let savedInstallmentIds = [];

    let updatedGuardianData;
    let updatedStudentData;
    try {
        let findProgramPlan = await programPlanModel.findOne({ hedaId: inputData.studentDetails.programPlanId, });
        let findProgramPlanFees = await programFeesModel.findOne({ programPlanId: inputData.studentDetails.programPlanId, });
        let findFeeStructure = await feeStructureModel.findOne({ displayName: "FS_2021-22_001", });
        let findStudent = await studentModel.findOne({ regId: inputData.studentDetails.studentRegId, });

        console.log("find student is", findStudent);

        if (findStudent) {
            let findGuardIds = findStudent.guardianDetails;
            var deleteGuardQuery = { _id: { $in: findGuardIds } };
            await guardianModel.deleteMany(deleteGuardQuery);

            savedGuardianData = await addParent(guardianModel, inputData);
            for (let i = 0; i < savedGuardianData.length; i++) {
                const element = savedGuardianData[i];
                savedGuardIds.push(element._id);
            }

            updatedStudentData = await updateStudent(dbConnection, inputData, studentModel, savedGuardianData, savedGuardIds, campusModel, findProgramPlan, findFeeStructure);

            let obj = {
                success: true,
                message: `The student registration ID ${inputData.studentDetails.studentRegId} updated`,
            };
            return obj;
        }

        if (!findProgramPlan) {
            let obj = {
                success: false,
                message: `Invalid Programplan ID ${inputData.studentDetails.programPlanId}`,
            };
            return obj;
        } else {
            savedGuardianData = await addParent(guardianModel, inputData);
            for (let i = 0; i < savedGuardianData.length; i++) {
                const element = savedGuardianData[i];
                savedGuardIds.push(element._id);
            }
            savedStudentData = await addStudent(
                dbConnection,
                inputData,
                studentModel,
                campusModel,
                savedGuardianData,
                savedGuardIds,
                findProgramPlan,
                findFeeStructure
            );

            savedFeeMapData = await addFeeMap(
                dbConnection,
                feeMapModel,
                savedStudentData,
                findProgramPlanFees
            );

            savedFeePlanData = await addFeePlan(
                dbConnection,
                feePlanModel,
                findFeeStructure,
                findProgramPlanFees,
                savedStudentData
            );

            savedInstallmentData = await addInstallmentPlan(
                dbConnection,
                installFeePlanModel,
                savedFeePlanData
            );
            let savedInstallmentIds = [];
            for (let i = 0; i < savedInstallmentData.length; i++) {
                const element = savedInstallmentData[i];
                savedInstallmentIds.push(element._id);
            }
            let obj = {
                success: true,
                message: `New student created for the  ${inputData.studentDetails.studentRegId} Registration ID`,
            };
            return obj;
        }
    } catch (err) {
        var deleteGuardQuery = { _id: { $in: savedGuardIds } };
        var deleteInstallmentQuery = { _id: { $in: savedInstallmentIds } };

        await guardianModel.deleteMany(deleteGuardQuery);
        await studentModel.deleteOne({ _id: savedStudentData._id });
        await feeMapModel.deleteOne({ _id: savedFeeMapData._id });
        await feePlanModel.deleteOne({ _id: savedFeePlanData._id });
        await installFeePlanModel.deleteMany(deleteInstallmentQuery);
        throw err;
    }
}

async function addParent(guardianModel, inputData) {
    try {
        let parentArray = inputData.studentDetails.guardianDetails;
        let savedParent = [];
        for (let i = 0; i < parentArray.length; i++) {
            const element = parentArray[i];
            let guardians = {
                firstName: element.firstname,
                lastName: element.lastname,
                fullName: element.firstname + " " + element.lastname,
                mobile: element.mobile,
                email: element.email,
                relation: "parent",
                createdBy: "admin",
            };
            savedParent.push(guardians);
        }
        let savedGuardianData = await guardianModel.insertMany(savedParent);
        return savedGuardianData;

        // const guardianDetails = new guardianModel(guardians);
        // var savedGuardianData = await guardianDetails.save();
        // return savedGuardianData;
    } catch (err) {
        throw err;
    }
}

async function addStudent(
    dbConnection,
    inputData,
    studentModel,
    campusModel,
    savedGuardianData,
    savedGuardIds,
    findProgramPlan,
    findFeeStructure
) {
    try {
        let parentEmailArray = inputData.studentDetails.guardianDetails.filter(item => (item['email'] !== ""))
        let parentMobileArray = inputData.studentDetails.guardianDetails.filter(item => (item['mobile'] !== ""))
        let parentEmail = parentEmailArray.length == 0 ? inputData.studentDetails.email : parentEmailArray[0].email
        let parentMobile = parentMobileArray.length == 0 ? inputData.studentDetails.mobile : parentMobileArray[0].mobile

        var studentId = await getStudentDisplayId(dbConnection);
        var campusData = await campusModel.findOne({
            headaId: inputData.studentDetails.campusId,
        });
        let student = {
            displayName: studentId,
            regId: inputData.studentDetails.studentRegId,
            salutation: null,
            category: "", // Category
            section: "",
            firstName: inputData.studentDetails.firstName, //First Name *
            middleName: "", //
            lastName: inputData.studentDetails.lastName, //Last Name *
            rollNumber: inputData.studentDetails.hedaId,
            guardianDetails: savedGuardIds,
            gender: inputData.studentDetails.details.gender, //Gender
            dob: inputData.studentDetails.dob,
            citizenship: inputData.studentDetails.citizenShip, //
            currency: "INR", //
            FOREX: 1, //
            admittedOn: new Date(),
            // admittedOn: new Date(req.body.student.admittedOn) instanceof Date ? new Date(req.body.student.admittedOn) : null, //Admitted Date *
            programPlanId: findProgramPlan._id,
            feeStructureId: findFeeStructure._id,
            phoneNo: inputData.studentDetails.mobile, //Phone Number *
            email: inputData.studentDetails.email, // Email Address *
            alternateEmail: "",
            parentName: inputData.studentDetails.guardianDetails[0].firstname + " " + inputData.studentDetails.guardianDetails[0].lastname,
            parentPhone: parentMobile,
            parentEmail: parentEmail,
            relation: inputData.studentDetails.guardianDetails[0].relation,
            addressDetails: inputData.studentDetails.addressDetails,
            isFinalYear: false,
            final: "",
            campusId: campusData._id,
            // status: 1,
            createdBy: "all",
            status: inputData.studentDetails.status
        };
        const studentDetails = new studentModel(student);
        var savedStudent = await studentDetails.save();
        return savedStudent;
    } catch (err) {
        throw err;
    }
}

async function addFeeMap(
    dbConnection,
    feeMapModel,
    savedStudentData,
    findProgramPlan
) {
    try {
        let feeMapId = await getFeeMapDisplayId(dbConnection);
        let feeMap = {
            displayName: feeMapId,
            studentId: savedStudentData._id,
            usn: savedStudentData.regId,
            programPlanId: savedStudentData.programPlanId,
            feeStructureId: savedStudentData.feeStructureId,
            feeManagerId: undefined,
            dueDate: new Date(),
            amount: Number(findProgramPlan.feesDetails[0].fees),
            paid: 0.0,
            receivedDate: "",
            receiptNumbers: "",
            concession: 0,
            fine: 0,
            pending: Number(findProgramPlan.feesDetails[0].fees),
            transactionPlan: {},
            campusId: savedStudentData.campusId,
            status: 1,
            createdBy: savedStudentData.createdBy,
        };
        const feeMapDetails = new feeMapModel(feeMap);
        var savedFeeMapData = await feeMapDetails.save();
        return savedFeeMapData;
    } catch (err) {
        throw err;
    }
}
async function addFeePlan(dbConnection, feePlanModel, findFeeStructure, findProgramPlanFees, savedStudentData) {
    try {
        let feePlanId = await getFeePlanDisplayId(dbConnection);
        let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
        let feeBreakup = await feeTypeModel.find({
            _id: { $in: findFeeStructure.feeTypeIds },
        });
        let plannedAmountBreakup = [];
        let paidAmountBreakup = [];
        let pendingAmountBreakup = [];
        for (oneFee of feeBreakup) {
            let obj;
            if (oneFee.displayName == "FT_2021-22_001") {
                obj = {
                    amount: Number(findProgramPlanFees.feesDetails[0].fees),
                    feeTypeCode: oneFee.displayName,
                    title: oneFee.title,
                };
            } else {
                obj = {
                    amount: 0,
                    feeTypeCode: oneFee.displayName,
                    title: oneFee.title,
                };
            }

            let obj1 = {
                amount: 0,
                feeTypeCode: oneFee.displayName,
                title: oneFee.title,
            };
            plannedAmountBreakup.push(obj);
            pendingAmountBreakup.push(obj);
            paidAmountBreakup.push(obj1);
        }
        let feePlan = {
            applicationId: feePlanId,
            studentRegId: savedStudentData.regId,
            studentId: savedStudentData._id,
            programPlanHEDAId: findProgramPlanFees.programPlanId,
            totalAmount: Number(findProgramPlanFees.feesDetails[0].fees),
            plannedAmount: Number(findProgramPlanFees.feesDetails[0].fees),
            paidAmount: 0,
            pendingAmount: Number(findProgramPlanFees.feesDetails[0].fees),
            plannedAmountBreakup: plannedAmountBreakup,
            paidAmountBreakup: paidAmountBreakup,
            pendingAmountBreakup: pendingAmountBreakup,
            discountAmountBreakup: paidAmountBreakup,
            currency: savedStudentData.currency,
            forex: savedStudentData.FOREX,
            discountType: "",
            discountPercentage: 0,
            discountAmount: 0,
            campusId: savedStudentData.campusId,
            remarks: {
                seller: "",
                finance: "",
                headseller: "",
            },
        };
        const feePlanDetails = new feePlanModel(feePlan);
        var savedFeePlanData = await feePlanDetails.save();
        return savedFeePlanData;
    } catch (err) {
        throw err;
    }
}
async function addInstallmentPlan(
    dbConnection,
    installFeePlanModel,
    savedFeePlanData
) {
    try {
        let allInstallment = [];
        let inst = [40, 20, 20, 20];
        for (let i = 0; i < inst.length; i++) {
            const instItem = inst[i];
            const index = i + 1;
            let latefeeDate;
            let dueDate;
            let endYear = new Date().getFullYear() + 1;
            let startYear = new Date().getFullYear();
            let academicYear = startYear + "-" + endYear.toString().substr(endYear.toString().length - 2, 2);

            if (i == 0) {
                dueDate = "2021-July-01";
                latefeeDate = "2021-July-31";
            }
            if (i == 1) {
                dueDate = "2021-October-01";
                latefeeDate = "2021-October-31";
            }
            if (i == 2) {
                dueDate = "2022-January-01";
                latefeeDate = "2022-January-31";
            }
            if (i == 3) {
                dueDate = "2022-April-01";
                latefeeDate = "2022-April-30";
            }
            let feeInstallment = {
                feePlanId: savedFeePlanData._doc._id,
                studentRegId: savedFeePlanData.studentRegId,
                label: `Installment00${i + 1}`,
                // displayName: `INST_${academicYear}_${(Number(dcount) + 1).toString().length == 1 ? "00" : (Number(dcount) + 1).toString().length == 2 ? "0" : ""}${Number(dcount) + 1}`,
                description: `Installment00${i + 1}`,
                dueDate: new Date(dueDate),
                lateFeeStartDate: new Date(latefeeDate),
                percentage: instItem,
                totalAmount: savedFeePlanData.plannedAmount,
                // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
                plannedAmount:
                    parseFloat(savedFeePlanData.plannedAmount) * (instItem / 100),
                plannedAmountBreakup: [
                    {
                        amount: parseFloat(savedFeePlanData.plannedAmount) * (instItem / 100),
                        feeTypeCode: savedFeePlanData.plannedAmountBreakup[0].feeTypeCode,
                        title: savedFeePlanData.plannedAmountBreakup[0].title,
                    },
                ],
                paidAmount: 0,
                paidAmountBreakup: [
                    {
                        amount: 0,
                        feeTypeCode: savedFeePlanData.paidAmountBreakup[0].feeTypeCode,
                        title: savedFeePlanData.paidAmountBreakup[0].title,
                    },
                ],
                pendingAmount: parseFloat(savedFeePlanData.plannedAmount) * (instItem / 100),
                pendingAmountBreakup: [
                    {
                        amount: parseFloat(savedFeePlanData.plannedAmount) * (instItem / 100),
                        feeTypeCode: savedFeePlanData.pendingAmountBreakup[0].feeTypeCode,
                        title: savedFeePlanData.pendingAmountBreakup[0].title,
                    },
                ],
                discountType: "",
                discountPercentage: 0,
                discountAmount: 0,
                discountAmountBreakup: [
                    {
                        amount: savedFeePlanData.discountAmountBreakup[0].amount,
                        feeTypeCode: savedFeePlanData.discountAmountBreakup[0].feeTypeCode,
                        title: savedFeePlanData.discountAmountBreakup[0].title,
                    },
                ],
                status: "Planned",
                transactionId: "",
                campusId: savedFeePlanData.campusId,
                remarks: {
                    seller: "",
                    finance: "",
                    headseller: "",
                },
            };
            // let feeInstallment = {
            //     feePlanId: savedFeePlanData._id,
            //     studentRegId: savedFeePlanData.studentRegId,
            //     label: "Installment001",
            //     description: "Installment001",
            //     dueDate: new Date(`2021-July-10`),
            //     lateFeeStartDate: new Date(`2021-July-11`),
            //     percentage: 100,
            //     totalAmount: savedFeePlanData.plannedAmount,
            //     // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
            //     plannedAmount: savedFeePlanData.plannedAmount,
            //     plannedAmountBreakup: savedFeePlanData.plannedAmountBreakup,
            //     paidAmount: savedFeePlanData.paidAmount,
            //     paidAmountBreakup: savedFeePlanData.paidAmountBreakup,
            //     pendingAmount: savedFeePlanData.pendingAmount,
            //     pendingAmountBreakup: savedFeePlanData.pendingAmountBreakup,
            //     discountType: "",
            //     discountPercentage: 0,
            //     discountAmount: 0,
            //     discountAmountBreakup: savedFeePlanData.discountAmountBreakup,
            //     status: "Planned",
            //     transactionId: "",
            //     campusId: savedFeePlanData.campusId,
            //     remarks: {
            //         seller: "",
            //         finance: "",
            //         headseller: "",
            //     },
            // };
            allInstallment.push(feeInstallment);
            // let feePlanInstallmentDetails = new installFeePlanModel(feeInstallment);
            // var savedInstallmentData = await feePlanInstallmentDetails.save();
            // if (index == inst.length) return savedInstallmentData;
        }

        // allInstallment.map((feeInstItem) => {
        //     // console.log(feeInstItem);
        //     let feePlanInstallmentDetails = new installFeePlanModel(feeInstItem);
        //     let savedInstallmentData = feePlanInstallmentDetails.save();
        //     return savedInstallmentData
        // });
        let savedInstallmentData = await installFeePlanModel.insertMany(
            allInstallment
        );
        return savedInstallmentData;
    } catch (err) {
        throw err;
    }
}
async function getStudentDisplayId(dbConnection) {
    var getDatas = [];
    var transType = "";
    const studentModel = dbConnection.model(
        "students",
        studentSchema,
        "students"
    );
    getDatas = await studentModel.find({});
    transType = "STU";
    var date = new Date();
    var month = date.getMonth();
    var finYear = "";
    var current = date.getFullYear();
    var prev = Number(date.getFullYear()) + 1;
    prev = String(prev).substr(String(prev).length - 2);
    finYear = `${current}-${prev}`;

    let initial = `${transType}_${finYear}_001`;
    let dataArr = [];
    let check;
    let finalVal;
    const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
    getDatas.forEach((el) => {
        if (el["displayName"]) {
            let filStr = el["displayName"].split("_");
            let typeStr = filStr[0];
            let typeYear = filStr[1];
            if (typeStr == transType && typeYear == finYear) {
                check = true;
                dataArr.push(el["displayName"]);
            }
        }
    });
    if (!check) {
        finalVal = initial;
    } else {
        let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split("_");
        let lastCountNo = Number(lastCount[2]) + 1;
        if (lastCountNo.toString().length == 1) lastCountNo = "00" + lastCountNo;
        if (lastCountNo.toString().length == 2) lastCountNo = "0" + lastCountNo;
        lastCount[2] = lastCountNo;
        finalVal = lastCount.join("_");
    }
    return finalVal;
}
async function getFeeMapDisplayId(dbConnection) {
    var getDatas = [];
    var transType = "";
    let feeMapModel = dbConnection.model("studentfeesmaps", studentFeeMapSchema);
    getDatas = await feeMapModel.find({});
    transType = "SFM";
    var date = new Date();
    var month = date.getMonth();
    var finYear = "";
    var current = date.getFullYear();
    var prev = Number(date.getFullYear()) + 1;
    prev = String(prev).substr(String(prev).length - 2);
    finYear = `${current}-${prev}`;

    let initial = `${transType}_${finYear}_001`;
    let dataArr = [];
    let check;
    let finalVal;
    const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
    getDatas.forEach((el) => {
        if (el["displayName"]) {
            let filStr = el["displayName"].split("_");
            let typeStr = filStr[0];
            let typeYear = filStr[1];
            if (typeStr == transType && typeYear == finYear) {
                check = true;
                dataArr.push(el["displayName"]);
            }
        }
    });
    if (!check) {
        finalVal = initial;
    } else {
        let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split("_");
        let lastCountNo = Number(lastCount[2]) + 1;
        if (lastCountNo.toString().length == 1) lastCountNo = "00" + lastCountNo;
        if (lastCountNo.toString().length == 2) lastCountNo = "0" + lastCountNo;
        lastCount[2] = lastCountNo;
        finalVal = lastCount.join("_");
    }
    return finalVal;
}
async function getFeePlanDisplayId(dbConnection) {
    var getDatas = [];
    var transType = "";
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanSchema);
    getDatas = await feePlanModel.find({});
    transType = "FPLAN";
    var date = new Date();
    var month = date.getMonth();
    var finYear = "";
    var current = date.getFullYear();
    var prev = Number(date.getFullYear()) + 1;
    prev = String(prev).substr(String(prev).length - 2);
    finYear = `${current}-${prev}`;

    let initial = `${transType}_${finYear}_001`;
    let dataArr = [];
    let check;
    let finalVal;
    const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
    getDatas.forEach((el) => {
        if (el["applicationId"]) {
            let filStr = el["applicationId"].split("_");
            let typeStr = filStr[0];
            let typeYear = filStr[1];
            if (typeStr == transType && typeYear == finYear) {
                check = true;
                dataArr.push(el["applicationId"]);
            }
        }
    });
    if (!check) {
        finalVal = initial;
    } else {
        let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split("_");
        let lastCountNo = Number(lastCount[2]) + 1;
        if (lastCountNo.toString().length == 1) lastCountNo = "00" + lastCountNo;
        if (lastCountNo.toString().length == 2) lastCountNo = "0" + lastCountNo;
        lastCount[2] = lastCountNo;
        finalVal = lastCount.join("_");
    }
    return finalVal;
}

async function updateStudent(
    dbConnection,
    inputData,
    studentModel,
    savedGuardianData,
    savedGuardIds,
    campusModel,
    findProgramPlan,
    findFeeStructure
) {
    try {
        const findStudent = await studentModel.findOne({ regId: inputData.studentDetails.studentRegId, });
        var campusData = await campusModel.findOne({ headaId: inputData.studentDetails.campusId, });
        var admitDate = moment.utc(inputData.studentDetails.details.admittedOn).tz("Asia/Kolkata");

        await studentModel.updateOne(
            { regId: inputData.studentDetails.studentRegId },
            {
                $set: {
                    displayName: findStudent.displayName,
                    regId: inputData.studentDetails.studentRegId,
                    salutation: null,
                    category: inputData.studentDetails.details.category,
                    section: inputData.studentDetails.details.section,
                    firstName: inputData.studentDetails.firstName,
                    middleName: "",
                    lastName: inputData.studentDetails.lastName,
                    rollNumber: inputData.studentDetails.hedaId,
                    guardianDetails: savedGuardIds,
                    gender: inputData.studentDetails.details.gender,
                    dob: inputData.studentDetails.dob,
                    citizenship: inputData.studentDetails.citizenShip,
                    currency: "INR",
                    FOREX: 1,
                    admittedOn: admitDate,
                    programPlanId: findProgramPlan._id,
                    feeStructureId: findFeeStructure._id,
                    phoneNo: inputData.mobile,
                    email: inputData.email,
                    alternateEmail: "",
                    parentName: inputData.studentDetails.guardianDetails[0].firstname + " " + inputData.studentDetails.guardianDetails[0].lastname,
                    parentPhone: inputData.studentDetails.guardianDetails[0].mobile,
                    parentEmail: inputData.studentDetails.guardianDetails[0].email,
                    relation: inputData.studentDetails.guardianDetails[0].relation,
                    addressDetails: inputData.studentDetails.addressDetails,
                    isFinalYear: false,
                    final: "",
                    campusId: campusData._id,
                    status: inputData.studentDetails.status !== undefined ? inputData.studentDetails.status : 1,
                    createdBy: "all",
                },
            })
            .then((data) => {
                if (data.nModified) {
                    return data;
                } else
                    throw {
                        message: "Nothing updated",
                        type: "failure",
                        data: data,
                    };
            });
    } catch (err) {
        res.status(500).send(err);
        throw err;
    }
}

async function getStudentFeeStructure(req, res) {
    let id = req.params.id;
    const { orgId } = req.query;
    let centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });

    let dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);
    let registrationModel = dbConnection.model("registrations", registrationSchema);
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanSchema);
    try {
        let feePlanData = await feePlanModel.findOne({ studentRegId: id, });
        let registrationData = await registrationModel.findOne({ studentRegId: id, });
        let registrationAmount;
        if (registrationData) {
            registrationAmount = registrationData.amount
        } else {
            registrationAmount = 0
        }
        if (feePlanData) {
            let obj = {
                tuitionFees: feePlanData.totalAmount !== undefined ? feePlanData.totalAmount : feePlanData.plannedAmount,
                discount: feePlanData.discountAmount,
                registration: registrationAmount,
                isUpdated: feePlanData.isUpdated !== undefined ? feePlanData.isUpdated : false,
                remarks: feePlanData.remarks.feeRemarks !== undefined ? feePlanData.remarks.feeRemarks : ""
            };
            res.status(200).json({ success: true, data: obj });
        } else {
            res.status(400).json({ success: false, Message: "No fee Details" });
        }
    } catch (err) {
        res.status(400).json({ success: false, Error: err });
    } finally {
        centralDbConnection.close();
        dbConnection.close();
    }
}
async function updateFeeStructure(req, res) {
    let id = req.params.id;
    let inputData = req.body;
    const { orgId } = req.query;
    let centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);

    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");

    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
    let dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);
    let feePlanModel = dbConnection.model("studentfeeplans", feeplanSchema);
    let installFeePlanModel = dbConnection.model("studentfeeinstallmentplans", feeInstallmentSchema);
    let feePlanData = await feePlanModel.findOne({ studentRegId: id, });

    let feeInstallmentData = await installFeePlanModel.find({ feePlanId: feePlanData._id })
    let savedUpdateFeePlan;
    let result;
    let result2;
    let savedUpdateInstallmentPlan;
    let savedUpdateRegistration;

    try {
        // if (Number(feePlanData.paidAmount) == 0) {

        result = await updateFeePlan(feePlanModel, feePlanData, inputData, id);
        savedUpdateFeePlan = await feePlanModel.findOne({ studentRegId: id });
        result2 = await updateFeeInstallmentPlan(dbConnection, installFeePlanModel, savedUpdateFeePlan);

        let registrationModel = dbConnection.model("registrations", registrationSchema);
        let regData = registrationModel.findOne({ studentRegId: id })
        // savedUpdateInstallmentPlan = await updateFeeInstallmentPlan(installFeePlanModel, feePlanData, inputData, id);
        if (!regData) {
            if (inputData.registration !== 0) {
                savedUpdateRegistration = await updateRegistration(dbConnection, inputData, id)
                res.status(200).json({
                    success: true, Message: `Fees updated for the student ID ${id}`,
                    url: savedUpdateRegistration.receiptWithQr,
                    result, result2
                });
            }
        }
        else {
            res.status(200).json({
                success: true,
                Message: `Fees updated for the student ID ${id}`,
                result, result2
            });
        }
        // }
        // else {
        //     res.status(400).json({ success: true, Message: `Fees can't be updated for the student ID ${id}` });
        // }
    } catch (err) {
        res.status(400).json({ success: false, Error: err.message, Message: `Fees not updated for the student ID ${id}` });
    } finally {
        centralDbConnection.close();
        dbConnection.close();
    }
}


async function updateFeePlan(feePlanModel, feePlanData, inputData, studentRegId) {
    try {
        let plannedAmountBreakup = feePlanData.plannedAmountBreakup
        let paidAmountBreakup = feePlanData.paidAmountBreakup
        let pendingAmountBreakup = feePlanData.pendingAmountBreakup
        let discountAmountBreakup = feePlanData.discountAmountBreakup
        let isUpdated = false

        let feePlanRemarks = feePlanData.remarks
        feePlanRemarks['feeRemarks'] = inputData['remarks']
        isUpdated = inputData['isUpdated']

        let plannedAmount;
        let paidAmount = feePlanData.paidAmount
        let pendingAmount;
        let discountAmount;
        let discount = Number(inputData['discount'])
        let totalFees = Number(inputData['tuitionFees'])

        plannedAmount = Number(inputData['tuitionFees'])

        if (discount == 0) {
            discountAmount = Number(inputData['discount'])
            plannedAmount = Number(totalFees) - Number(discount)
            pendingAmount = Number(plannedAmount)

            plannedAmountBreakup.map(item => {
                item['amount'] = Number(plannedAmount)
            })
            paidAmountBreakup.map(item => {
                item['amount'] = Number(feePlanData.paidAmount)
            })
            pendingAmountBreakup.map(item => {
                item['amount'] = Number(pendingAmount)
            })
            discountAmountBreakup.map(item => {
                item['amount'] = Number(discountAmount)
            })
        }
        else {
            discountAmount = Number(inputData['discount'])
            plannedAmount = Number(totalFees) - Number(discount)
            pendingAmount = Number(plannedAmount)
            plannedAmountBreakup.map(item => {
                item['amount'] = Number(plannedAmount)
            })
            paidAmountBreakup.map(item => {
                item['amount'] = Number(feePlanData.paidAmount)
            })
            pendingAmountBreakup.map(item => {
                item['amount'] = Number(pendingAmount)
            })
            discountAmountBreakup.map(item => {
                item['amount'] = Number(discountAmount)
            })
        }

        await feePlanModel.updateOne(
            { studentRegId: studentRegId },
            {
                $set: {
                    isUpdated: isUpdated,
                    remarks: feePlanRemarks,
                    totalAmount: totalFees,
                    plannedAmount: plannedAmount,
                    pendingAmount: pendingAmount,
                    paidAmount: paidAmount,
                    discountAmount: discountAmount,
                    plannedAmountBreakup: plannedAmountBreakup,
                    pendingAmountBreakup: pendingAmountBreakup,
                    paidAmountBreakup: paidAmountBreakup,
                    discountAmountBreakup: discountAmountBreakup
                }
            })
            .then((data) => {
                if (data.nModified) {
                    return 'Fee Plans Updated'
                }
                else
                    throw {
                        message: "Nothing updated",
                        type: "failure",
                        data: data,
                    };
            });

    } catch (err) {
        res.status(500).send(err);
        throw err;
    }
}
async function updateFeeInstallmentPlan(dbConnection, installFeePlanModel, savedFeePlanData) {

    try {
        let allInstData = await installFeePlanModel.find({ feePlanId: savedFeePlanData._id })
        for (let i = 0; i < allInstData.length; i++) {
            const instItem = allInstData[i]._doc;
            const index = i + 1;

            await installFeePlanModel.updateOne(
                {
                    feePlanId: savedFeePlanData._id,
                    label: `Installment00${index}`
                },
                {
                    $set: {
                        totalAmount: savedFeePlanData.plannedAmount,
                        plannedAmount: parseFloat(savedFeePlanData.plannedAmount) * (instItem.percentage / 100),
                        plannedAmountBreakup: [
                            {
                                amount: parseFloat(savedFeePlanData.plannedAmount) * (instItem.percentage / 100),
                                feeTypeCode: savedFeePlanData.plannedAmountBreakup[0].feeTypeCode,
                                title: savedFeePlanData.plannedAmountBreakup[0].title,
                            },
                        ],
                        paidAmount: 0,
                        paidAmountBreakup: [
                            {
                                amount: 0,
                                feeTypeCode: savedFeePlanData.paidAmountBreakup[0].feeTypeCode,
                                title: savedFeePlanData.paidAmountBreakup[0].title,
                            },
                        ],
                        pendingAmount: parseFloat(savedFeePlanData.plannedAmount) * (instItem.percentage / 100),
                        pendingAmountBreakup: [
                            {
                                amount: parseFloat(savedFeePlanData.plannedAmount) * (instItem.percentage / 100),
                                feeTypeCode: savedFeePlanData.pendingAmountBreakup[0].feeTypeCode,
                                title: savedFeePlanData.pendingAmountBreakup[0].title,
                            },
                        ],
                        discountType: "",
                        discountPercentage: 0,
                        discountAmount: 0,
                        discountAmountBreakup: [
                            {
                                amount: savedFeePlanData.discountAmountBreakup[0].amount,
                                feeTypeCode: savedFeePlanData.discountAmountBreakup[0].feeTypeCode,
                                title: savedFeePlanData.discountAmountBreakup[0].title,
                            },
                        ],
                    }
                })
                .then((data) => {
                    if (data.nModified) {
                        return 'Installments updated'
                    }
                    else
                        throw {
                            message: "Nothing updated",
                            type: "failure",
                            data: data,
                        };
                });
        }
    }
    catch (err) {
        throw err;
    }
}
async function updateRegistration(dbConnection, payloadData, studentRegId) {

    let studentModel = dbConnection.model("students", studentSchema);
    let programPlanModel = dbConnection.model("programplans", programPlanSchema);

    const findStudent = await studentModel.findOne({ regId: studentRegId });
    let findProgramPlan = await programPlanModel.findOne({ _id: findStudent.programPlanId, });


    var receiptN = ("" + Math.random()).substring(2, 7);
    var year2 = moment().year();
    var transID = `TXN/${year2}/${receiptN + 1}`;

    let inputData = {
        transactionDate: moment(new Date()).toISOString(),
        method: 'cash',
        mode: 'otc',
        studentRegId: findStudent.regId,
        studentName: findStudent.firstName + ' ' + findStudent.lastName,
        academicYear: findProgramPlan.academicYear,
        class: findProgramPlan.title,
        programPlanId: findProgramPlan._id,
        paymentTransactionId: '',
        amount: payloadData.registration,
        emailCommunicationRefIds: findStudent.email,
        campusId: findStudent.campusId
    };
    let imode = inputData.method;
    let mode = imode.toLowerCase();
    let transactId;
    if (mode == "cash") {
        transactId = transID;
    } else {
        transactId = inputData.paymentTransactionId;
    }
    inputData.paymentTransactionId = transactId;
    let registrationModel = dbConnection.model("registrations", registrationSchema);
    var registrationId = await getRegistrationId(dbConnection);
    let payload = {
        email: inputData.emailCommunicationRefIds,
        academicYear: inputData.academicYear,
        applicationId: registrationId,
        transactionId: transactId,
        studentName: inputData.studentName,
        class: inputData.class,
        applicationFees: String(inputData.amount) + "00",
        mode: "Online",
        currencyCode: "INR",
        programPlan: inputData.class,
        feeStatement: "",
        parentName: findStudent.parentName,

    };
    let createPdf = await axios.post(
        process.env.receiptAPI +
        "?institute=vkgi&&type=registration",
        payload
    );
    console.log('recieot', createPdf.data.url)
    var newRegistrationDetails = new registrationModel({
        displayName: registrationId,
        transactionType: "eduFees",
        transactionSubType: "registration",
        transactionDate: inputData.transactionDate,
        studentRegId: inputData.studentRegId,
        studentName: inputData.studentName,
        academicYear: inputData.academicYear,
        class: inputData.class,
        programPlan: inputData.programPlanId,
        paymentRefId: transactId,
        receiptNo: registrationId,
        amount: inputData.amount,
        emailCommunicationRefIds: [inputData.emailCommunicationRefIds],
        smsCommunicationRefIds: [],
        status: "paid",
        paymentTransactionId: transactId, // RazorPay or other txn id to be populeted on payment
        reconciliationStatus: "",
        receiptStatus: "",
        currencyAmount: inputData.amount,
        campusId: inputData.campusId,
        receiptWithQr: createPdf.data.url
    });



    return savedRegDetails = await newRegistrationDetails.save()
}

async function getRegistrationId(dbConnection) {
    var getDatas = [];
    var transType = "";
    let registrationModel = dbConnection.model("registrations", registrationSchema);

    getDatas = await registrationModel.find({});
    transType = "REG";
    var date = new Date();
    var month = date.getMonth();
    var finYear = "";

    var current = date.getFullYear();
    var prev = Number(date.getFullYear()) + 1;
    prev = String(prev).substr(String(prev).length - 2);
    finYear = `${current}-${prev}`;

    let initial = `${transType}_${finYear}_001`;
    let dataArr = [];
    let check;
    let finalVal;
    const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
    getDatas.forEach((el) => {
        if (el["displayName"]) {
            let filStr = el["displayName"].split("_");
            let typeStr = filStr[0];
            let typeYear = filStr[1];
            if (typeStr == transType && typeYear == finYear) {
                check = true;
                dataArr.push(el["displayName"]);
            }
        }
    });
    if (!check) {
        finalVal = initial;
    } else {
        let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split("_");
        let lastCountNo = Number(lastCount[2]) + 1;
        if (lastCountNo.toString().length == 1) lastCountNo = "00" + lastCountNo;
        if (lastCountNo.toString().length == 2) lastCountNo = "0" + lastCountNo;
        lastCount[2] = lastCountNo;
        finalVal = lastCount.join("_");
    }
    return finalVal;
}
module.exports = {
    createNewStudent,
    getStudentFeeStructure,
    updateFeeStructure,
};
