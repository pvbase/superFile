const moment = require("moment");
const orgListSchema = require("../../models/orglists-schema");
const registrationSchema = require("../../models/registrationModel");
const StudentSchema = require("../../models/studentModel");
const feesLedgerSchema = require("../../models/feesLedgerModel");
const GuardianSchema = require("../../models/guardianModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const programPlanSchema = require("../../models/programPlanModel");
const FeeStructureSchema = require("../../models/feeStructureModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const campusSchema = require("../../models/campusModel");
const settingsSchema = require("../../models/settings/feesetting");
const reconciliationTransactionsSchema = require("../../models/reconciliationTransactionsModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const transactionsSchema = require("../../models/transactionsModel");
const journeysSchema = require("../../models/journeyModel");
const {
  commonPostNotification,
} = require("../notifications/notification-common");
const feeplanschema = require("../../models/feeplanModel");
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");

async function createRegistration(req, res) {
  try {
    let inputData = req.body;
    var receiptN = ("" + Math.random()).substring(2, 7);
    var year2 = moment().year();
    var transID = `TXN/${year2}/${receiptN + 1}`;
    let imode = inputData.method;
    let mode = imode.toLowerCase();
    let transactId;
    if (mode == "cash") {
      transactId = transID;
    } else {
      transactId = inputData.paymentTransactionId;
    }
    const centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({
      _id: req.query.orgId,
    });

    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(500).send({
        status: "failure",
        message: "Organization not found",
      });
    } else {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
      let registrationModel = dbConnection.model("registrations", registrationSchema);
      var registrationId = await getDisplayId(dbConnection);
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
        paymentTransactionId:transactId, // RazorPay or other txn id to be populeted on payment
        reconciliationStatus: "",
        receiptStatus: "",
        currencyAmount: inputData.amount,
        campusId: inputData.campusId,
        paymentDetails:inputData.paymentDetails
      });
      newRegistrationDetails.save(function (err, data) {
        if (err)
          return res.status(400).json({
            success: false,
            message: "Database error",
            Erro: err,
          });
        else
          return res.status(200).json({
            message: "New Registration added",
            success: true,
            data: data,
          });
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, Error: error });
  }
}

//getStudentFeeDetails
async function getStudentForRegistration(req, res) {
  var dbUrl = req.headers.resource;
  let id = req.params.id;
  if (!id || !req.query.orgId) {
    res.status(400).json({
      status: "failed",
      message: "Please provide all required parameters.",
      type: "error",
    });
  } else {
    let dbName = req.query.orgId;
    let dbConnection = await createDatabase(dbName, dbUrl);
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );
    let studentModel = dbConnection.model("students", StudentSchema);
    let feeStructureModel = dbConnection.model(
      "feestructures",
      FeeStructureSchema
    );
    let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);
    let feeManagerModel = dbConnection.model("feemanagers", FeeManagerSchema);
    let guardianModel = dbConnection.model("guardians", GuardianSchema);
    let feeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let programPlanModel = dbConnection.model(
      "programplans",
      programPlanSchema
    );
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);

    let installFeePlanModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );

    let settingsModel = dbConnection.model("settings", settingsSchema);

    let studentDetails = await studentModel.findOne({
      regId: { $regex: new RegExp(id, "i") },
    });

    var transactionDetails = await transactionModel.find({
      $or: [{ status: "Pending" }, { status: "Partial" }],
      studentRegId: { $regex: new RegExp(id, "i") },
      transactionSubType: "demandNote",
    });
    let demandNoteId;
    if (transactionDetails.length == 0) {
      demandNoteId = [];
    } else {
      demandNoteId = transactionDetails;
    }
    if (studentDetails == null) {
      return res
        .status(404)
        .json({ status: "failed", message: "Invalid Student ID" });
    } else {
      let studentFeeMapDetails = await feeMapModel.findOne({
        studentId: studentDetails._id,
      });
      let feeStructureDetails = await feeStructureModel.findOne({
        _id: studentFeeMapDetails.feeStructureId,
      });
      let guardianDetails = await guardianModel.findOne({
        _id: studentDetails.guardianDetails[0],
      });
      let programPlanDetails = await programPlanModel.findOne({
        _id: studentDetails.programPlanId,
      });
      let settingsDetails = await settingsModel.find({});
      let feePlanData = await feePlanModel.findOne({
        studentRegId: id,
      });
      let feesBreak = [{
        amount:0,
        feeTypeCode:"FT_2021-22_050",
        title:"Registration Fee"
      }]
      let feePlanId = mongoose.Types.ObjectId(feePlanData._doc._id);
      let installmentPlanData = await installFeePlanModel.findOne({
        feePlanId: feePlanId,
      });

      // if (feePlanData == null) {
      let obj = {
        studentDetails: studentDetails,
        guardianDetails: guardianDetails,
        totalAmount: feePlanData.plannedAmount,
        paid: feePlanData.paidAmount,
        pending: feePlanData.pendingAmount,
        dueDate: installmentPlanData.dueDate,
        feesBreakUp: feesBreak,
        studentFeeMapId: studentFeeMapDetails.displayName,
        receiptStatus: settingsDetails[0].receipts.send,
        demandNoteDetails: demandNoteId,
        programPlanDetails: programPlanDetails,
        partial: settingsDetails[0].receipts.partialAmount,
      };
      res.status(200).json(obj);
    }
  }
}

async function showAllRegistration (req, res) {
  let orgId = req.query.orgId;
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: orgId,
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(500).json({
      success: false,
      message: "Organization not found",
    });
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  let registrationModel = dbConnection.model("registrations", registrationSchema);
  registrationModel
    .find({}, { __v: 0 })
    .sort("-createdAt")
    .then(async function (data) {
      if (data) {
        let paginated = await Paginator(data, req.query.page, req.query.limit);
        res.status(200).json(paginated);
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Registration does not exist" });
      }
    });
};
async function getDisplayId(dbConnection) {
  var getDatas = [];
  var transType = "";
  let registrationModel = dbConnection.model("registrations", registrationSchema);
  //   let rcptSchema = await dbConnection.model(
  //     "transactions",
  //     rcptModel,
  //     "transactions"
  //   );
  getDatas = await registrationModel.find({});
  transType = "REG";
  var date = new Date();
  var month = date.getMonth();
  var finYear = "";
  // if (month >= 2) {

  // } else {
  //   var current = date.getFullYear();
  //   current = String(current).substr(String(current).length - 2);
  //   var prev = Number(date.getFullYear()) - 1;
  //   finYear = `${prev}-${current}`;
  // }
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

function Paginator(items, page, per_page) {
  let current_page = page;
  let perPage = per_page;
  (offset = (current_page - 1) * perPage),
    (paginatedItems = items.slice(offset).slice(0, perPage)),
    (total_pages = Math.ceil(items.length / perPage));
  return {
    page: Number(current_page),
    perPage: Number(perPage),
    nextPage:
      total_pages > Number(current_page) ? Number(current_page) + 1 : null,
    totalRecord: items.length,
    totalPages: total_pages,
    data: paginatedItems,
    status: "success",
  };
}

module.exports = {
  createRegistration: createRegistration,
  showAllRegistration:showAllRegistration,
  getStudentForRegistration:getStudentForRegistration
};
