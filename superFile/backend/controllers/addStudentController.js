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
const defaultPlan = require("../models/hkbkLeadmodel/defaultProgramPlan");
const FeeTypeSchema = require("../models/feeTypeModel");
const { LexRuntime } = require("aws-sdk");

async function newStudent(req, res) {
  let inputData = req.body;
  const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
  const orgData = await orgListModel.findOne({ _id: singleDemand.data.orgId, });

  if (!orgData || orgData == null) {
    centralDbConnection.close();
    Response = {
      status: "failure",
      message: "Organization data not found",
    };
  } else {
    let dbConnection = await createDatabase(singleDemand.data.orgId, orgData.connUri);
    centralDbConnection.close();
    let inputData = {
      plannedAmount = inputData.plannedAmount,
      studentDetails: inputData.studentDetails
    };
    let addedStudent = await addStudentStrcuture(dbConnection, inputData);
    res.status(200).send(addedStudent)
    dbConnection.close() // new
  }
}
async function addStudentStrcuture(dbConnection, inputData) {
  let studentModel = dbConnection.model("students", studentSchema);
  let guardianModel = dbConnection.model("guardians", guardianSchema);
  let programPlanModel = dbConnection.model("programplans", programPlanSchema);
  let feeStructureModel = dbConnection.model("feestructures", feeStructureSchema);
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanSchema);
  let installFeePlanModel = dbConnection.model("studentfeeinstallmentplans", feeInstallmentSchema);

  let feeMapModel = dbConnection.model("studentFeesMap", studentFeeMapSchema);
  let programFeesModel = dbConnection.model("defaultProgramPlanFees", defaultPlan);
  let savedGuardianData;
  let savedStudentData;
  let savedFeeMapData;
  let savedFeePlanData;
  try {
    let findProgramPlan = await programPlanModel.findOne({ hedaId: inputData.studentDetails.programPlanId, });
    let findProgramPlanFees = await programFeesModel.findOne({ programPlanId: inputData.studentDetails.programPlanId, });
    let findFeeStructure = await feeStructureModel.findOne({ displayName: "FS_2021-22_001", });
    let findStudent = await studentModel.findOne({ regId: inputData.studentDetails.studentId, });

    if (findStudent) {
      let obj = {
        success: true,
        message: `The student registration ID ${inputData.studentDetails.studentId} already exists`,
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
      savedStudentData = await addStudent(
        dbConnection,
        inputData,
        studentModel,
        savedGuardianData,
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
      let obj = {
        success: true,
        message: `New student created for the  ${inputData.studentDetails.studentId} Registration ID`,
      };
      return obj;
    }
  } catch (err) {
    await guardianModel.deleteOne({ _id: savedGuardianData._id });
    await studentModel.deleteOne({ _id: savedStudentData._id });
    await feeMapModel.deleteOne({ _id: savedFeeMapData._id });
    await feePlanModel.deleteOne({ _id: savedFeePlanData._id });
    await installFeePlanModel.deleteOne({ _id: savedInstallmentData._id });
    throw err;
  }
}

async function addParent(guardianModel, inputData) {
  try {
    let guardians = {
      firstName: inputData.studentDetails.guardianDetails.firstname,
      lastName: inputData.studentDetails.guardianDetails.lastname,
      fullName:
        inputData.studentDetails.guardianDetails.firstname +
        " " +
        inputData.studentDetails.guardianDetails.lastname,
      mobile: inputData.studentDetails.guardianDetails.mobile,
      email: inputData.studentDetails.guardianDetails.email,
      relation: "parent",
      createdBy: "admin",
    };
    const guardianDetails = new guardianModel(guardians);
    var savedGuardianData = await guardianDetails.save();
    return savedGuardianData;
  } catch (err) {
    throw err;
  }
}
async function addStudent(dbConnection, inputData, studentModel, savedGuardianData, findProgramPlan, findFeeStructure) {
  try {
    var studentId = await getStudentDisplayId(dbConnection);
    let student = {
      displayName: studentId,
      regId: inputData.studentDetails.studentId,
      salutation: null,
      category: "", // Category
      section: "",
      firstName: inputData.studentDetails.firstName, //First Name *
      middleName: "", //
      lastName: inputData.studentDetails.lastName, //Last Name *
      guardianDetails: [savedGuardianData._id],
      gender: inputData.studentDetails.gender, //Gender
      dob: inputData.studentDetails.dob,
      citizenship: inputData.studentDetails.citizenShip, //
      currency: "INR", //
      FOREX: 1, //
      admittedOn: new Date(),
      // admittedOn: new Date(req.body.student.admittedOn) instanceof Date ? new Date(req.body.student.admittedOn) : null, //Admitted Date *
      programPlanId: findProgramPlan._id,
      feeStructureId: findFeeStructure._id,
      phoneNo: inputData.mobile, //Phone Number *
      email: inputData.email, // Email Address *
      alternateEmail: "",
      parentName: inputData.studentDetails.guardianDetails.firstname,
      parentPhone: inputData.studentDetails.guardianDetails.mobile,
      parentEmail: inputData.studentDetails.guardianDetails.email,
      relation: inputData.studentDetails.guardianDetails.relation,
      addressDetails: inputData.studentDetails.addressDetails,
      isFinalYear: false,
      final: "",
      campusId: inputData.studentDetails.campus,
      status: 1,
      createdBy: "all",
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
      amount: Number(findProgramPlan.feesDetails[1].fees),
      paid: 0.0,
      receivedDate: "",
      receiptNumbers: "",
      concession: 0,
      fine: 0,
      pending: Number(findProgramPlan.feesDetails[1].fees),
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
async function addFeePlan(
  dbConnection,
  feePlanModel,
  findFeeStructure,
  findProgramPlanFees,
  savedStudentData
) {
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
          amount: Number(findProgramPlanFees.feesDetails[1].fees),
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
      plannedAmount: Number(findProgramPlanFees.feesDetails[1].fees),
      paidAmount: 0,
      pendingAmount: Number(findProgramPlanFees.feesDetails[1].fees),
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
    let feeInstallment = {
      feePlanId: savedFeePlanData._id,
      studentRegId: savedFeePlanData.studentRegId,
      label: "Installment001",
      description: "Installment001",
      dueDate: new Date(`2021-July-10`),
      lateFeeStartDate: new Date(`2021-July-11`),
      percentage: 100,
      totalAmount: savedFeePlanData.plannedAmount,
      // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
      plannedAmount: savedFeePlanData.plannedAmount,
      plannedAmountBreakup: savedFeePlanData.plannedAmountBreakup,
      paidAmount: savedFeePlanData.paidAmount,
      paidAmountBreakup: savedFeePlanData.paidAmountBreakup,
      pendingAmount: savedFeePlanData.pendingAmount,
      pendingAmountBreakup: savedFeePlanData.pendingAmountBreakup,
      discountType: "",
      discountPercentage: 0,
      discountAmount: 0,
      discountAmountBreakup: savedFeePlanData.discountAmountBreakup,
      status: "Planned",
      transactionId: "",
      campusId: savedFeePlanData.campusId,
      remarks: {
        seller: "",
        finance: "",
        headseller: "",
      },
    };
    let feePlanInstallmentDetails = new installFeePlanModel(feeInstallment);
    var savedInstallmentData = await feePlanInstallmentDetails.save();
    return savedInstallmentData;
  } catch (err) {
    throw err;
  }
}
async function getStudentDisplayId(dbConnection) {
  var getDatas = [];
  var transType = "";
  const studentModel = dbConnection.model("students", studentSchema, "students");
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
  let feeMapModel = dbConnection.model("studentFeesMap", studentFeeMapSchema);
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
module.exports = { addStudentStrcuture, newStudent };
