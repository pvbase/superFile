const { createDatabase } = require("../utils/db_creation");
const axios = require("axios");
const mongoose = require("mongoose");
// const dbName = "admin";
const msaterCollectionName = "masteruploads";
const orgListSchema = require("../models/orglists-schema");
const StudentSchema = require("../models/studentModel");
const PaymentScheduleSchema = require("../models/paymentScheduleModel");
const InstallmentSchema = require("../models/installmentModel");
const LateFeeSchema = require("../models/lateFeeModel");
const ReminderSchema = require("../models/reminderModel");
const FeeTypeSchema = require("../models/feeTypeModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const FeeManagerSchema = require("../models/feesManagerModel");
const FeeStructureSchema = require("../models/feeStructureModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
const GuardianSchema = require("../models/guardianModel");
const categorySchema = require("../models/categoryModel");
const concessionSchema = require("../models/concessionModel");
const scholarshipSchema = require("../models/scholarshipModel");
const loanSchema = require("../models/loanModel");

var _ = require("lodash");
var moment = require("moment");

async function createMaster(req, res) {
  var dbUrl = req.headers.resource;
  // var dbUrl = "mongodb://a117c6039a7fb4507ae53ec593c83cf3-92be4982110f6c62.elb.us-east-1.amazonaws.com:27017"
  console.log("dburl", dbUrl);
  const { type } = req.params;
  let inputData = req.body;
  let dbName = inputData.orgId;
  if (dbName == undefined) {
    res.status(404).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    var masterResponse = await masterManagement(
      type,
      null,
      "post",
      inputData,
      null,
      dbUrl,
      dbName,
      req
    );
    if (masterResponse.status == "success") {
      res.status(201).send(masterResponse);
    } else {
      if (masterResponse.status == "failure") {
        res.status(400).send(masterResponse);
      } else {
        res.status(500).send(masterResponse);
      }
    }
  }
}
async function getMaster(req, res) {
  var dbUrl = req.headers.resource;
  const { type } = req.params;
  const queryData = req.query == undefined ? undefined : req.query;
  let dbName = queryData.orgId;
  var masterResponse = await masterManagement(
    type,
    null,
    "get",
    null,
    queryData,
    dbUrl,
    dbName,
    req
  );
  if (masterResponse.status == "success") {
    res.status(200).send(masterResponse);
  } else {
    if (masterResponse.status == "failure") {
      res.status(400).send(masterResponse);
    } else {
      res.status(500).send(masterResponse);
    }
  }
}
async function updateMaster(req, res) {
  var dbUrl = req.headers.resource;
  const { type } = req.params;
  let inputData = req.body;
  const queryData = req.query == undefined ? undefined : req.query;
  let dbName = inputData.orgId;
  if (dbName == undefined) {
    res.status(404).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    var masterResponse = await masterManagement(
      type,
      null,
      "put",
      inputData,
      queryData,
      dbUrl,
      dbName
    );
    if (masterResponse.status == "success") {
      res.status(200).send(masterResponse);
    } else {
      if (masterResponse.status == "failure") {
        res.status(400).send(masterResponse);
      } else {
        res.status(500).send(masterResponse);
      }
    }
  }
}
//
async function masterManagement(
  type,
  id,
  method,
  inputData,
  queryData,
  dbUrl,
  dbName,
  req
) {
  var responseReturn = {};
  let dbConnection = await createDatabase(dbName, dbUrl);
  // console.log(queryData)
  // let { page, limit, searchKey, campusId } = queryData;
  switch (type) {
    case "programPlan":
      const programPlanModel = dbConnection.model(
        "programplans",
        ProgramPlanSchema,
        "programplans"
      );
      if (method == "get" && queryData.searchKey !== undefined) {
        let { page, limit, searchKey, campusId } = queryData;
        page = isNaN(Number(page)) ? undefined : Number(page);
        limit = isNaN(Number(limit)) ? undefined : Number(limit);
        programPlanResponse = await ProgramPlanMasterSearch(
          dbConnection,
          limit,
          page,
          searchKey
        );
        var pageDetails = programPlanResponse;
        console.log("after response", pageDetails);
        responseReturn = {
          status: "success",
          message: `${type} data`,
          data: programPlanResponse.data,
          currentPage: pageDetails.currentPage,
          perPage: pageDetails.perPage,
          nextPage: pageDetails.nextPage,
          totalRecord: pageDetails.totalRecord,
          totalPages: pageDetails.totalPages,
        };
      } else {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          programPlanModel,
          queryData
        );
      }
      break;
    case "paymentSchedule":
      let paymentScheduleModel = dbConnection.model(
        "paymentSchedule",
        PaymentScheduleSchema
      );
      if (method == "get") {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          paymentScheduleModel,
          queryData
        );
      } else {
        if (
          !inputData.displayName ||
          !inputData.title ||
          !inputData.description ||
          !inputData.scheduleDetails ||
          !inputData.feesBreakUp ||
          !inputData.createdBy // !inputData.parentId ||
        ) {
          responseReturn = {
            status: "failed",
            message: "Please provide all required parameters.",
            type: "error",
          };
        } else {
          responseReturn = await masterCRUD(
            type,
            method,
            inputData,
            dbConnection,
            paymentScheduleModel,
            queryData
          );
        }
      }
      break;
    case "installments":
      let installmentSchema = dbConnection.model(
        "installments",
        InstallmentSchema
      );
      if (method == "get") {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          installmentSchema,
          queryData
        );
      } else {
        if (
          !inputData.displayName ||
          !inputData.title ||
          !inputData.description ||
          !inputData.numberOfInstallments ||
          !inputData.frequency ||
          !inputData.feesBreakUp ||
          !inputData.dueDate ||
          !inputData.createdBy
        ) {
          responseReturn = {
            status: "failed",
            message: "Please provide all required parameters.",
            type: "error",
          };
        } else {
          responseReturn = await masterCRUD(
            type,
            method,
            inputData,
            dbConnection,
            installmentSchema,
            queryData
          );
        }
      }
      break;
    case "reminders":
      let reminderSchema = dbConnection.model("reminderPlan", ReminderSchema);
      if (method == "get") {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          reminderSchema,
          queryData
        );
      } else {
        if (
          !inputData.displayName ||
          !inputData.title ||
          !inputData.description ||
          !inputData.numberOfReminders ||
          !inputData.scheduleDetails ||
          !inputData.createdBy
        ) {
          responseReturn = {
            status: "failed",
            message: "Please provide all required parameters.",
            type: "error",
          };
        } else {
          responseReturn = await masterCRUD(
            type,
            method,
            inputData,
            dbConnection,
            reminderSchema,
            queryData
          );
        }
      }
      break;
    case "lateFees":
      let lateFeeSchema = dbConnection.model("lateFees", LateFeeSchema);
      if (method == "get") {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          lateFeeSchema,
          queryData
        );
      } else {
        if (
          !inputData.displayName ||
          !inputData.title ||
          !inputData.description ||
          !inputData.type ||
          !inputData.amount ||
          !inputData.every ||
          !inputData.createdBy
        ) {
          responseReturn = {
            status: "failed",
            message: "Please provide all required parameters.",
            type: "error",
          };
        } else {
          responseReturn = await masterCRUD(
            type,
            method,
            inputData,
            dbConnection,
            lateFeeSchema,
            queryData
          );
        }
      }
      break;
    case "students":
      let { page, limit, searchKey, campusId } = queryData;
      page = isNaN(Number(page)) ? undefined : Number(page);
      limit = isNaN(Number(limit)) ? undefined : Number(limit);
      console.log(page, limit);
      if (searchKey==undefined) {
        studentResponse = await getStudents(
          dbConnection,
          limit,
          page,
          campusId
        );
        var pageDetails = studentResponse["0"].metadata["0"];
        let duplicates = [];
        let nonduplicates = [];
        for(let i=0; i<studentResponse[0].data.length; i++){

          if(duplicates.includes(studentResponse[0].data[i]._id.toString())){
            console.log(studentResponse[0].data[i]._id)
          }else{
            nonduplicates.push(studentResponse[0].data[i])
            duplicates.push(studentResponse[0].data[i]._id.toString())
          }
        }
        console.log(studentResponse[0].data.length, nonduplicates.length)
        if (pageDetails !== undefined) {
          responseReturn = {
            status: "success",
            message: `${type} data`,
            data: nonduplicates,
            currentPage: pageDetails.page,
            perPage: limit,
            nextPage: pageDetails.nextPage,
            totalRecord: pageDetails.total,
            totalPages: pageDetails.totalPages,
          };
        } else {
          responseReturn = {
            status: "success",
            data: nonduplicates,
            message: "No Students found",
          };
        }
      } else {
        studentResponse = await StudentsMasterSearch(
          dbConnection,
          limit,
          page,
          searchKey
        );
        var pageDetails = studentResponse;
        console.log("after response: ", pageDetails);
        let duplicates = [];
        let nonduplicates = [];
        for(let i=0; i<studentResponse.data.length; i++){
          if(duplicates.includes(studentResponse.data[i]._id.toString())){
            console.log(studentResponse.data[i]._id)
          }else{
            nonduplicates.push(studentResponse.data[i])
            duplicates.push(studentResponse.data[i]._id.toString())
          }
        }
        responseReturn = {
          status: "success",
          message: `${type} data`,
          data: nonduplicates,
          currentPage: pageDetails.currentPage,
          perPage: pageDetails.perPage,
          nextPage: pageDetails.nextPage,
          totalRecord: pageDetails.totalRecord,
          totalPages: pageDetails.totalPages,
        };
      }
      break;
    case "studentFeesMapping":
      console.log("***entered***");
      let feeMapModel = dbConnection.model(
        "studentfeesmaps",
        StudentFeeMapSchema
      );
      responseReturn = await studentFeeMap(
        type,
        method,
        inputData,
        dbConnection,
        feeMapModel,
        queryData
      );
      console.log("ok");
      break;
    case "sendDemandNote":
      let sfmModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
      responseReturn = await sendDemandNote(
        type,
        method,
        inputData,
        dbConnection,
        sfmModel,
        queryData
      );
      break;
    case "feesManager":
      var fmResponse = await getFeeManagers(
        dbConnection,
        Number(queryData.limit),
        Number(queryData.page),
        queryData.campusId
      );
      console.log("feesmanagers", fmResponse);
      var pageDetails = fmResponse[0].metadata[0];
      const instituteSchema = mongoose.Schema({}, { strict: false });
      let instituteModel = dbConnection.model(
        "institutedetails",
        instituteSchema,
        "institutedetails"
      );
      let instituteData = await instituteModel.find({});
      instituteData = instituteData[0]._doc.instituteContact[0].contactname;
      //data
      let programPlanModel1 = dbConnection.model(
        "programplans",
        ProgramPlanSchema,
        "programplans"
      );

      let paymentScheduleModel1 = dbConnection.model(
        "paymentSchedule",
        PaymentScheduleSchema
      );

      let reminderModel1 = dbConnection.model("reminderPlan", ReminderSchema);
      let lateFeeModel1 = dbConnection.model("lateFees", LateFeeSchema);
      let feeTypeModel1 = dbConnection.model("feeTypes", FeeTypeSchema);
      let paymentScheduleData = await paymentScheduleModel1.find({});
      let programPlanData = await programPlanModel1.find({});
      let reminderData = await reminderModel1.find({});
      let lateFeeData = await lateFeeModel1.find({});
      let feeTypeData = await feeTypeModel1.find({});
      responseReturn = {
        status: "success",
        message: `${type} data`,
        data: fmResponse[0].data.length
          ? fmResponse[0].data.map((item) => ({
              ...item,
              createdBy: instituteData,
            }))
          : fmResponse[0].data,
        allProgramPlan: programPlanData,
        allPaymentSchedule: paymentScheduleData,
        allReminderPlan: reminderData,
        allLateFee: lateFeeData,
        allFeeType: feeTypeData,
        currentPage: pageDetails.page,
        perPage: Number(queryData.limit),
        nextPage: pageDetails.nextPage,
        totalRecord: pageDetails.total,
        totalPages: pageDetails.totalPages,
      };
      break;
    case "feeStructure":
      let feeStructureModel = dbConnection.model(
        "feestructures",
        FeeStructureSchema,
        "feestructures"
      );
      if (method == "get") {
        let feeManagerModel = dbConnection.model(
          "feemanagers",
          FeeManagerSchema,
          "feemanagers"
        );
        let feesTypesModel = dbConnection.model(
          "feetypes",
          FeeTypeSchema,
          "feetypes"
        );
        const allFeesManagers = await feeManagerModel.find();
        const allFeesData = await feesTypesModel.find();
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          feeStructureModel,
          queryData
        );

        if (responseReturn.data && responseReturn.data.length) {
          responseReturn.data = responseReturn.data.map((item) => {
            let feeTypes = [];
            item._doc.feeTypeIds.forEach((element) => {
              // const feeManager = allFeesManagers.find(
              //   (ele) => ele._doc._id.toString() == element.toString()
              // );
              const feeType = allFeesData.find(
                (ele) => ele._doc._id.toString() == element.toString()
              );
              if (feeType) feeTypes.push(feeType.title);
            });
            return { ...item._doc, feeTypes };
          });
        }
      } else {
        if (
          !inputData.displayName ||
          !inputData.title ||
          !inputData.description ||
          !inputData.feeTypeIds ||
          !inputData.createdBy
        ) {
          responseReturn = {
            status: "failed",
            message: "Please provide all required parameters.",
            type: "error",
          };
        } else {
          responseReturn = await masterCRUD(
            type,
            method,
            inputData,
            dbConnection,
            feeStructureModel,
            queryData
          );
        }
      }
      break;
    case "feeTypes":
      let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
      if (method == "get") {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          feeTypeModel,
          queryData
        );
      } else {
        if (
          !inputData.displayName ||
          !inputData.title ||
          !inputData.description
        ) {
          responseReturn = {
            status: "failed",
            message: "Please provide all required parameters.",
            type: "error",
          };
        } else {
          responseReturn = await masterCRUD(
            type,
            method,
            inputData,
            dbConnection,
            feeTypeModel,
            queryData
          );
        }
      }
      break;
    case "reminderPlan":
      let reminderModel = dbConnection.model("reminders", reminderSchema);
      if (method == "get") {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          reminderModel,
          queryData
        );
      }
      break;
    case "category":
      let categoryModel = dbConnection.model("categoryplans", categorySchema);
      if (method == "get") {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          categoryModel,
          queryData
        );
      } else {
        if (
          !inputData.displayName ||
          !inputData.title ||
          !inputData.description ||
          !inputData.createdBy
        ) {
          responseReturn = {
            status: "failed",
            message: "Please provide all required parameters.",
            type: "error",
          };
        } else {
          responseReturn = await masterCRUD(
            type,
            method,
            inputData,
            dbConnection,
            categoryModel,
            queryData
          );
        }
      }
      break;
    case "concession":
      let concessionModel = dbConnection.model(
        "concessionplans",
        concessionSchema
      );
      if (method == "get") {
        responseReturn = await masterCRUD(
          type,
          method,
          inputData,
          dbConnection,
          concessionModel,
          queryData
        );
      } else {
        if (
          !inputData.displayName ||
          !inputData.title ||
          !inputData.description ||
          !inputData.categoryId ||
          !inputData.concessionType ||
          !inputData.concessionValue == undefined ||
          !inputData.createdBy
        ) {
          responseReturn = {
            status: "failed",
            message: "Please provide all required parameters.",
            type: "error",
          };
        } else {
          responseReturn = await masterCRUD(
            type,
            method,
            inputData,
            dbConnection,
            concessionModel,
            queryData
          );
        }
      }
      break;
  }
  dbConnection.close();
  console.log("finals");
  console.log(responseReturn);
  return responseReturn;
}

async function masterCRUD(
  master,
  method,
  inputData,
  dbConnection,
  modelData,
  queryData
) {
  try {
    var responseReturn = {};
    if (method == "post") {
      // console.log('**Input Data**',master,inputData)
      var addDetails = new modelData({
        ...inputData,
        updatedBy: inputData.createdBy,
      });
      await addDetails
        .save()
        .then((data) => {
          if (data) {
            responseReturn = {
              message: `New ${master} has been added successfully`,
              status: "success",
              data: data._id,
            };
          } else
            throw {
              message: "Database error",
              status: "error",
              data: data,
            };
        })
        .catch((err) => {
          throw {
            message: "Database error",
            status: "error",
            data: err,
          };
        });
    } else if (method == "put") {
      if (queryData.id == undefined) {
        responseReturn = {
          status: "failure",
          message: `${master} record not found`,
          data: id,
        };
      } else {
        let id = queryData.id;
        var scheduleData = await modelData.findOne({ _id: id });
        console.log(scheduleData);
        var parms = {
          ...inputData,
          updatedBy: inputData.createdBy,
          // __v: Number(scheduleData["__v"]) + 1,
        };
        await modelData
          .updateOne({ _id: id }, parms)
          .then((data) => {
            if (data.nModified) {
              responseReturn = {
                status: "success",
                message: `${master} data has been updated successfully`,
                data: id,
              };
            } else
              throw {
                message: "Nothing updated",
                type: "failure",
                data: data,
              };
          })
          .catch((err) => {
            throw {
              message: "Database error",
              type: "error",
              data: err,
            };
          });
      }
    } else if (method == "get") {
      var getDatasDetails = [];
      if (master == "students") {
        // await getStudents(dbConnection);
        // let getD =
        //   queryData.id == undefined
        //     ? await modelData.find({})
        //     : await modelData.findOne({ _id: queryData.id });
        // for (student of getD) {
        //   let requiredData = {};
        //   console.log("student", student);
        //   let guardianModel = dbConnection.model("guardians", GuardianSchema);
        //   let parentData = await guardianModel.findOne({
        //     _id: student.guardianDetails[0],
        //   });
        //   requiredData["parentName"] = parentData._doc.firstName;
        //   // console.log("guardiandetails", parentData);
        //   var programPlanModel = dbConnection.model(
        //     "programplans",
        //     ProgramPlanSchema,
        //     "programplans"
        //   );
        //   let programData = await programPlanModel.findOne({
        //     _id: student.programPlanId,
        //   });
        //   // console.log("prorgamplan", programData);
        //   requiredData["programPlanId"] = programData._doc.title;
        //   let feeStructureModel = dbConnection.model(
        //     "feestructures",
        //     FeeStructureSchema,
        //     "feestructures"
        //   );
        //   // let feeStructureData = await feeStructureModel.findOne({
        //   //   _id: student.feeStructureId,
        //   // });
        //   // requiredData["feeStructureId"] = feeStructureData._doc.title;
        //   getDatasDetails.push({
        //     ...student._doc,
        //     guardianDetails: [requiredData.parentName],
        //     ...requiredData,
        //   });
        // }
      }else if (master == "paymentSchedule") {
        try {
          console.log("paymentschedule")
          let paymentschdata = await modelData.find({})
          for (let i = 0; i < paymentschdata.length; i++) {
            let cdata = paymentschdata[i];
            let dispsplit = cdata._doc.displayName.split("_")
            let dates = { "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "fifteenth": 15, "fifteen": 15, "sixteenth": 16, "sixteen": 16, "sixth": 6, "last": 30, "second last": 29, "third last": 28, "twenty four": 24, "twenty five": 25, "fifth last": 26 }
            let collectionperiods = { "year": 1, "yearly": 1, "half year": 2, "half yearly": 2, "4 months": 3, "quarter": 4, "two months": 6, "monthly": 12, "month": 12, "one time date": 1, "one time date range": 1, "quarterly": 4, "one time range": 1 }
            let collecteveryp = { "year": 12, "yearly": 12, "half year": 6, "half yearly": 6, "4 months": 3, "quarterly": 3, "quarter": 3, "two months": 2, "monthly": 1, "month": 1, "one time date": 1, "one time date range": 1, "quarterly": 4, "one time range": 1 }
            const monthNames = { "january": "01", "february": "02", "march": "03", "april": "04", "may": "05", "june": "06", "july": "07", "august": "08", "september": "09", "october": "10", "november": "11", "december": "12" };
            let labels = { "year": ["Term 1"], "half year": ["Term 1", "Term 2"], "4 months": ["Term 1 (Quarter 1)", "Term 1 (Quarter 2)", "Term 2 (Quarter 3)"], "quarter": ["Term 1 (Quarter 1)", "Term 1 (Quarter 2)", "Term 2 (Quarter 3)", "Term 2 (Quarter 4)"], "quarterly": ["Term 1 (Quarter 1)", "Term 1 (Quarter 2)", "Term 2 (Quarter 3)", "Term 2 (Quarter 4)"], "two months": ["Months 1, 2", "Months 3, 4", "Months 5, 6", "Months 7, 8", "Months 9, 10", "Months 11, 12"], "month": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"], "one time date": ["Term 1"], "one time range": ["Term 1"], "one time date range": ["Term 1"] }
            let dateterm1 = !cdata._doc.scheduleDetails.dueDate || cdata._doc.scheduleDetails.dueDate == null ? null : new Date(`${dispsplit[1].split("-")[0]}/${cdata._doc.startMonth ? monthNames[cdata._doc.startMonth.toLowerCase()] : monthNames[cdata._doc.scheduleDetails.startMonth.toLowerCase()]}/${isNaN(cdata._doc.scheduleDetails.dueDate) ? Number(dates[cdata._doc.scheduleDetails.dueDate.toLowerCase()]) : Number(cdata._doc.scheduleDetails.dueDate)}`);
            let startdate1 = !cdata._doc.scheduleDetails.startDate || cdata._doc.scheduleDetails.startDate == null ? null : new Date(`${dispsplit[1].split("-")[0]}/${cdata._doc.startMonth ? monthNames[cdata._doc.startMonth.toLowerCase()] : monthNames[cdata._doc.scheduleDetails.startMonth.toLowerCase()]}/${cdata._doc.scheduleDetails.startDate && isNaN(cdata._doc.scheduleDetails.startDate) ? Number(dates[cdata._doc.scheduleDetails.startDate.toLowerCase()]) : Number(cdata._doc.scheduleDetails.startDate)}`);
            // let enddate1 = new Date(`${dispsplit[1].split("-")[0]}/${cdata._doc.startMonth ? monthNames[cdata._doc.startMonth] : monthNames[cdata._doc.scheduleDetails.startMonth]}/${isNaN(cdata._doc.scheduleDetails.endDate) ? Number(dates[cdata._doc.scheduleDetails.endDate.toLowerCase()])+1 : Number(cdata._doc.scheduleDetails.endDate)+1}`);
            let penaltydate1 = !cdata._doc.scheduleDetails.startMonth || !cdata._doc.scheduleDetails.penaltyStartDate || cdata._doc.scheduleDetails.penaltyStartDate == null ? null : new Date(`${dispsplit[1].split("-")[0]}/${cdata._doc.startMonth ? monthNames[cdata._doc.startMonth.toLowerCase()] : monthNames[cdata._doc.scheduleDetails.startMonth.toLowerCase()]}/${isNaN(Number(cdata._doc.scheduleDetails.penaltyStartDate)) ? Number(dates[cdata._doc.scheduleDetails.penaltyStartDate.toLowerCase()]) : Number(cdata._doc.scheduleDetails.penaltyStartDate)}`);
            if (cdata._doc.scheduleDetails.collectEvery.toLowerCase().includes("range")) {
              dateterm1 = new Date(`${dispsplit[1].split("-")[0]}/${monthNames[cdata._doc.scheduleDetails.oneTimeDateRange.toStartMonth]}/${isNaN(Number(cdata._doc.scheduleDetails.oneTimeDateRange.toDueDate)) ? Number(dates[cdata._doc.scheduleDetails.oneTimeDateRange.toDueDate.toLowerCase()]) : Number(cdata._doc.scheduleDetails.oneTimeDateRange.toDueDate)}`)
              startdate1 = new Date(`${dispsplit[1].split("-")[0]}/${monthNames[cdata._doc.scheduleDetails.oneTimeDateRange.fromStartMonth]}/${isNaN(Number(cdata._doc.scheduleDetails.oneTimeDateRange.fromStartDate)) ? Number(dates[cdata._doc.scheduleDetails.oneTimeDateRange.fromStartDate.toLowerCase()]) : Number(cdata._doc.scheduleDetails.oneTimeDateRange.fromStartDate)}`)
              penaltydate1 = new Date(`${dispsplit[1].split("-")[0]}/${monthNames[cdata._doc.scheduleDetails.oneTimeDateRange.toStartMonth]}/${isNaN(Number(cdata._doc.scheduleDetails.penaltyStartDate)) ? Number(dates[cdata._doc.scheduleDetails.penaltyStartDate.toLowerCase()]) : Number(cdata._doc.scheduleDetails.penaltyStartDate)}`)
            }
            let feesbreakup = [];
            let ddate
            let ddate2
            let ddate3
            for (let j = 0; j < cdata._doc.feesBreakUp.length; j++) {
              if (j == 0) {
                let duddatee = new Date((dateterm1).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
                let startdatee = new Date((startdate1).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
                let penaltydatee = new Date((penaltydate1).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
                // let enddate = enddate1
                let objc = {
                  percentage: cdata._doc.feesBreakUp[j],
                  label: `${labels[cdata._doc.scheduleDetails.collectEvery.toLowerCase()][j]}`,
                  dueDate: duddatee,
                  startDate: startdatee,
                  penaltyStartDate: penaltydatee,
                  // endDate: enddate
                }
                // console.log(objc)
                await feesbreakup.push(objc)
              } else {
                ddate = dateterm1
                ddate2 = startdate1
                ddate3 = penaltydate1
                let duddate = !cdata._doc.scheduleDetails.dueDate || cdata._doc.scheduleDetails.dueDate == null || dateterm1 == null ? null : new Date(ddate.setMonth(Number(ddate.getMonth()) + Number(collecteveryp[cdata._doc.scheduleDetails.collectEvery.toLowerCase()])));
                let startdate = !cdata._doc.scheduleDetails.startDate || cdata._doc.scheduleDetails.startDate == null || startdate1 == null ? null : new Date(ddate2.setMonth(Number(ddate2.getMonth()) + Number(collecteveryp[cdata._doc.scheduleDetails.collectEvery.toLowerCase()])));
                let penaltydate = !cdata._doc.scheduleDetails.penaltyStartDate || cdata._doc.scheduleDetails.penaltyStartDate == null || penaltydate1 == null ? null : new Date(ddate3.setMonth(Number(ddate3.getMonth()) + Number(collecteveryp[cdata._doc.scheduleDetails.collectEvery.toLowerCase()])));
                // let enddate = new Date(enddate1.setMonth(Number(enddate1.getMonth()) + Number(collectionperiods[cdata.scheduleDetails.collectEvery.toLowerCase()])));
                let objc = {
                  percentage: cdata._doc.feesBreakUp[j],
                  label: `${labels[cdata._doc.scheduleDetails.collectEvery.toLowerCase()][j]}`,
                  dueDate: duddate,
                  startDate: startdate,
                  penaltyStartDate: penaltydate,
                  // endDate: enddate
                }
                feesbreakup.push(objc)
              }
            }
            cdata._doc.scheduleDetails.feesBreakUp = feesbreakup;
            // cdata._doc.scheduleDetails.startDate = feesbreakup;
            getDatasDetails.push(cdata)

          }
        }
        catch (errorr) {
          return {
            status: "failure",
            message: "Payment schedule error : " + errorr.stack,
          }
        }
      } else {
        if (
          queryData.campusId == "undefined" ||
          queryData.campusId == undefined ||
          queryData.campusId == "null"
        ) {
          getDatasDetails =
            queryData.id == undefined
              ? await modelData.find({})
              : await modelData.findOne({ _id: queryData.id });
        } else if (queryData.campusId.toLowerCase() == "all") {
          getDatasDetails =
            queryData.id == undefined
              ? await modelData.find({})
              : await modelData.findOne({ _id: queryData.id });
        } else {
          let createdUser = queryData.campusId;
          getDatasDetails =
            queryData.id == undefined
              ? await modelData.find({ campusId: createdUser })
              : await modelData.findOne({
                  _id: queryData.id,
                  campusId: createdUser,
                });
        }
      }
      // console.log("getDatasDetails", getDatasDetails);
      const campusSchema = mongoose.Schema({}, { strict: false });
      const campusModel = dbConnection.model("campuses", campusSchema);
      const campusDetails = await campusModel.find({});
      console.log(".................>", getDatasDetails.length);
      if (getDatasDetails.length == 0) {
        responseReturn = {
          status: "success",
          message: `No data`,
        };
      } else {
        getDatasDetails.map((gd, gi) => {
          if (gd._doc.campusId != undefined) {
            console.log(typeof campusDetails);
            campusDetails.map((cd) => {
              if (String(gd._doc.campusId) == String(cd._doc._id)) {
                getDatasDetails[gi]._doc["campusIdName"] =
                  cd._doc.campusId == undefined
                    ? cd._doc._id
                    : cd._doc.legalName;
              }
            });
          }
        });
        // console.log("getDatasDetails update", getDatasDetails);
        const { page, limit } = queryData;
        let paginationDatas = await Paginator(getDatasDetails, page, limit);
        let getDatas = paginationDatas.data;
        const instituteSchema = mongoose.Schema({}, { strict: false });
        let instituteModel = dbConnection.model(
          "institutedetails",
          instituteSchema,
          "institutedetails"
        );
        let instituteData = await instituteModel.find({});
        instituteData = instituteData[0]._doc.legalName;
        responseReturn = {
          status: "success",
          message: `${master} data`,
          data: getDatas.length
            ? getDatas.map((item) =>
                master == "feesManager" || master == "feeStructure"
                  ? {
                      ...item,
                      _doc: { ...item._doc, createdBy: instituteData },
                    }
                  : master == "students"
                  ? { ...item, createdBy: instituteData }
                  : { ...item._doc, createdBy: instituteData }
              )
            : getDatas,
          currentPage: paginationDatas.page,
          perPage: paginationDatas.perPage,
          nextPage: paginationDatas.next_page,
          totalRecord: paginationDatas.total,
          totalPages: paginationDatas.total_pages,
        };
      }
    } else {
      responseReturn = {
        status: "failure",
        message: "master not found",
      };
    }
    return responseReturn;
  } catch (e) {
    return e;
  }
}

async function studentFeeMap(
  master,
  method,
  inputData,
  dbConnection,
  modelData,
  queryData,
  campusId
) {
  try {
    var responseReturn = {};
    // const masterDataSchema = mongoose.Schema({}, { strict: false });
    // let mesterDataCollection = await dbConnection.model(
    //   msaterCollectionName,
    //   masterDataSchema,
    //   msaterCollectionName
    // );
    // let details = await mesterDataCollection.find({});
    // var mastersData = details["0"]._doc["data"];
    if (method == "post") {
    } else if (method == "put") {
    } else if (method == "get") {
      if (
        queryData.campusId == "undefined" ||
        queryData.campusId == undefined ||
        queryData.campusId == "null"
      ) {
        page = isNaN(Number(queryData.page))
          ? undefined
          : Number(queryData.page);
        limit = isNaN(Number(queryData.limit))
          ? undefined
          : Number(queryData.limit);
        searchKey = queryData.searchKey;
        if (searchKey == undefined) {
          if (page !== undefined && limit !== undefined) {
            //without Search Query
            let itemsPerPage = parseInt(queryData.limit);
            let currentPage = parseInt(queryData.page);
            let skipItems = parseInt(itemsPerPage * currentPage - itemsPerPage);
            const aggregateData = [
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $lookup: {
                  from: "campuses",
                  localField: "programPlan.campusId",
                  foreignField: "_id",
                  as: "campuseDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  pendingAmount: "$pending",
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                  campusIdName: {
                    $arrayElemAt: ["$campuseDetails.campusId", 0],
                  },
                },
              },
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
            ];
            const sfmData = await modelData.aggregate(aggregateData);
            const instituteSchema = mongoose.Schema({}, { strict: false });
            let instituteModel = dbConnection.model(
              "institutedetails",
              instituteSchema,
              "institutedetails"
            );
            let instituteData = await instituteModel.find({});
            instituteData =
              instituteData[0]._doc.instituteContact[0].contactname;
            var sfmDetails =
              sfmData["0"] != undefined
                ? sfmData["0"]["data"] != undefined
                  ? sfmData["0"]["data"]
                  : []
                : [];
            var pageDetails =
              sfmData["0"] != undefined
                ? sfmData["0"]["metadata"] != undefined
                  ? sfmData["0"]["metadata"]["0"]
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
            responseReturn = {
              status: "success",
              message: `${master} data`,
              data: sfmDetails.length
                ? sfmDetails.map((item) => ({
                    ...item,
                    createdBy: instituteData,
                  }))
                : sfmDetails,
              currentPage: pageDetails.page,
              perPage: itemsPerPage,
              nextPage: pageDetails.nextPage,
              totalRecord: pageDetails.total,
              totalPages: pageDetails.totalPages,
            };
          } else if (page == undefined && limit == undefined) {
            {
              console.log("came to else part");
              const aggregateData = [
                {
                  $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student",
                  },
                },
                {
                  $lookup: {
                    from: "feestructures",
                    localField: "feeStructureId",
                    foreignField: "_id",
                    as: "feeStructure",
                  },
                },
                // { $unwind: "$feeStructure" },
                {
                  $lookup: {
                    from: "feetypes",
                    localField: "feeStructure.feeTypeIds",
                    foreignField: "_id",
                    as: "feeType",
                  },
                },
                // {
                //   $lookup: {
                //     from: "feemanagers",
                //     let: { feeTypeId: "$feeType._id", programPlanId: "$programPlanId" },
                //     pipeline: [
                //       {
                //         $match: {
                //           $expr: {
                //             // $and:
                //             feeTypeId: "$feeType._id",
                //             programPlanId: "$programPlanId",
                //             // [
                //             //   { $feeTypeId: "$$feeType._id" },
                //             //   { $programPlanId: "$programPlanId" }
                //             // ]
                //           },
                //         },
                //       },
                //     ],
                //     as: "feeManager",
                //   },
                // },
                // { $unwind: "$feeManager" },
                {
                  $lookup: {
                    from: "reminderplans",
                    localField: "feeManager.reminderPlanId",
                    foreignField: "_id",
                    as: "reminderPlan",
                  },
                },
                {
                  $lookup: {
                    from: "programplans",
                    localField: "programPlanId",
                    foreignField: "_id",
                    as: "programPlan",
                  },
                },
                {
                  $lookup: {
                    from: "paymentschedules",
                    localField: "feeManager.paymentScheduleId",
                    foreignField: "_id",
                    as: "paymentSchedule",
                  },
                },
                {
                  $lookup: {
                    from: "concessionplans",
                    localField: "feeManager.concessionPlanId",
                    foreignField: "_id",
                    as: "concessionPlan",
                  },
                },
                {
                  $lookup: {
                    from: "latefees",
                    localField: "feeManager.lateFeePlanId",
                    foreignField: "_id",
                    as: "lateFee",
                  },
                },
                {
                  $lookup: {
                    from: "installments",
                    localField: "feeManager.installmentPlanId",
                    foreignField: "_id",
                    as: "installment",
                  },
                },
                {
                  $lookup: {
                    from: "feetypes",
                    localField: "feeManager.feeTypeId",
                    foreignField: "_id",
                    as: "feeType",
                  },
                },
                {
                  $lookup: {
                    from: "institutedetails",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "instituteDetails",
                  },
                },
                {
                  $project: {
                    displayName: 1,
                    studentId: {
                      $arrayElemAt: ["$student.displayName", 0],
                    },
                    regId: {
                      $arrayElemAt: ["$student.regId", 0],
                    },
                    dueDate: 1,
                    studentDetails: "$student",
                    studentName: {
                      $concat: [
                        { $arrayElemAt: ["$student.firstName", 0] },
                        " ",
                        { $arrayElemAt: ["$student.lastName", 0] },
                      ],
                    },
                    feeStructureId: {
                      $arrayElemAt: ["$feeStructure.displayName", 0],
                    },
                    feeStructure: {
                      $arrayElemAt: ["$feeStructure.title", 0],
                    },
                    feeStructureDescription: {
                      $arrayElemAt: ["$feeStructure.description", 0],
                    },
                    // programPlanDetails: "$programPlan",
                    totalAmount: "$amount",
                    paidAmount: "$paid",
                    pendingAmount: "$pending",
                    parentName: {
                      $arrayElemAt: ["$student.parentName", 0],
                    },
                    createdBy: "$createdBy",
                    createdAt: "$createdAt",
                    programPlanId: {
                      $arrayElemAt: ["$programPlan.displayName", 0],
                    },
                    reminderPlanId: {
                      $arrayElemAt: ["$reminderPlan.displayName", 0],
                    },
                    reminderPlan: {
                      $arrayElemAt: ["$reminderPlan.title", 0],
                    },
                    reminderPlanDescription: {
                      $arrayElemAt: ["$reminderPlan.description", 0],
                    },
                    paymentScheduleId: {
                      $arrayElemAt: ["$paymentSchedule.displayName", 0],
                    },
                    paymentSchedule: {
                      $arrayElemAt: ["$paymentSchedule.title", 0],
                    },
                    paymentScheduleDescription: {
                      $arrayElemAt: ["$paymentSchedule.description", 0],
                    },
                    concessionPlanId: {
                      $arrayElemAt: ["$concessionPlan.displayName", 0],
                    },
                    concessionPlan: {
                      $arrayElemAt: ["$concessionPlan.title", 0],
                    },
                    concessionPlanDescription: {
                      $arrayElemAt: ["$concessionPlan.description", 0],
                    },
                    lateFeePlanId: {
                      $arrayElemAt: ["$lateFee.displayName", 0],
                    },
                    lateFeePlan: {
                      $arrayElemAt: ["$lateFee.title", 0],
                    },
                    lateFeePlanDescription: {
                      $arrayElemAt: ["$lateFee.description", 0],
                    },
                    installmentPlanId: {
                      $arrayElemAt: ["$installment.displayName", 0],
                    },
                    installment: {
                      $arrayElemAt: ["$installment.title", 0],
                    },
                    installmentDescription: {
                      $arrayElemAt: ["$installment.description", 0],
                    },
                    programPlan: {
                      $arrayElemAt: ["$programPlan.title", 0],
                    },
                    programPlanCode: {
                      $arrayElemAt: ["$programPlan.programCode", 0],
                    },
                    feeTypeName: {
                      $arrayElemAt: ["$feeType.title", 0],
                    },
                    feeTypeId: {
                      $arrayElemAt: ["$feeType.displayName", 0],
                    },
                    feeTypeDescription: {
                      $arrayElemAt: ["$feeType.description", 0],
                    },
                  },
                },
              ];
              const sfmData = await modelData.aggregate(aggregateData);
              const instituteSchema = mongoose.Schema({}, { strict: false });
              let instituteModel = dbConnection.model(
                "institutedetails",
                instituteSchema,
                "institutedetails"
              );
              let instituteData = await instituteModel.find({});
              instituteData =
                instituteData[0]._doc.instituteContact[0].contactname;
              var sfmDetails = sfmData;
              responseReturn = {
                status: "success",
                message: `${master} data`,
                data: sfmDetails.length
                  ? sfmDetails.map((item) => ({
                      ...item,
                      createdBy: instituteData,
                    }))
                  : sfmDetails,
              };
            }
          }
        } else {
          if (
            page !== undefined &&
            limit !== undefined &&
            searchKey !== undefined
          ) {
            //With search Query
            let itemsPerPage = parseInt(queryData.limit);
            let currentPage = parseInt(queryData.page);
            let searchData = [];
            // let skipItems = parseInt(itemsPerPage * currentPage - itemsPerPage);
            const aggregateData = [
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  pendingAmount: "$pending",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                },
              },
            ];
            let findKey = String(searchKey).toLowerCase();
            const sfmData = await modelData.aggregate(aggregateData);
            sfmData.map((item) => {
              if (
                String(item.displayName).toLowerCase().includes(findKey) ||
                String(item.studentName).toLowerCase().includes(findKey) ||
                String(item.studentId).toLowerCase().includes(findKey) ||
                String(item.regId).toLowerCase().includes(findKey) ||
                String(item.programPlanDetails[0].academicYear)
                  .toLowerCase()
                  .includes(findKey) ||
                String(item.feeStructure).toLowerCase().includes(findKey) ||
                String(item.programPlan).toLowerCase().includes(findKey) ||
                String(item.feeTypeName).toLowerCase().includes(findKey) ||
                String(item.feeTypeId).toLowerCase().includes(findKey) ||
                String(item.totalAmount).toLowerCase().includes(findKey) ||
                String(item.paidAmount).toLowerCase().includes(findKey) ||
                String(item.pendingAmount).toLowerCase().includes(findKey) ||
                String(item.parentName).toLowerCase().includes(findKey)
              ) {
                searchData.push(item);
              }
            });
            const instituteSchema = mongoose.Schema({}, { strict: false });
            let instituteModel = dbConnection.model(
              "institutedetails",
              instituteSchema,
              "institutedetails"
            );
            let instituteData = await instituteModel.find({});
            instituteData =
              instituteData[0]._doc.instituteContact[0].contactname;

            // var sfmDetails =
            //   sfmData["0"] != undefined
            //     ? sfmData["0"]["data"] != undefined
            //       ? sfmData["0"]["data"]
            //       : []
            //     : [];

            // var pageDetails =
            //   sfmData["0"] != undefined
            //     ? sfmData["0"]["metadata"] != undefined
            //       ? sfmData["0"]["metadata"]["0"]
            //       : {
            //         page: null,
            //         nextPage: null,
            //         total: null,
            //         totalPages: null,
            //       }
            //     : {
            //       page: null,
            //       nextPage: null,
            //       total: null,
            //       totalPages: null,
            //     };
            let paginated = await Paginator(
              searchData,
              currentPage,
              itemsPerPage
            );
            // console.log(paginated)
            // return searchData
            responseReturn = {
              status: "success",
              message: `${master} data has been fetched successfully`,
              data: paginated.data,
              currentPage: paginated.page,
              perPage: itemsPerPage,
              nextPage: paginated.next_page,
              totalRecord: paginated.total,
              totalPages: paginated.total_pages,
            };
          } else {
            let searchData = [];
            const aggregateData = [
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  pendingAmount: "$pending",
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                },
              },
            ];
            let findKey = String(searchKey).toLowerCase();
            const sfmData = await modelData.aggregate(aggregateData);
            // return sfmData
            sfmData.map((item) => {
              if (
                String(item.displayName).toLowerCase().includes(findKey) ||
                String(item.studentName).toLowerCase().includes(findKey) ||
                String(item.studentId).toLowerCase().includes(findKey) ||
                String(item.regId).toLowerCase().includes(findKey) ||
                String(item.programPlanDetails[0].academicYear)
                  .toLowerCase()
                  .includes(findKey) ||
                String(item.feeStructure).toLowerCase().includes(findKey) ||
                String(item.programPlan).toLowerCase().includes(findKey) ||
                String(item.feeTypeName).toLowerCase().includes(findKey) ||
                String(item.feeTypeId).toLowerCase().includes(findKey) ||
                String(item.totalAmount).toLowerCase().includes(findKey) ||
                String(item.paidAmount).toLowerCase().includes(findKey) ||
                String(item.pendingAmount).toLowerCase().includes(findKey) ||
                String(item.parentName).toLowerCase().includes(findKey)
              ) {
                searchData.push(item);
              }
            });
            // const instituteSchema = mongoose.Schema({}, { strict: false });
            // let instituteModel = dbConnection.model(
            //   "institutedetails",
            //   instituteSchema,
            //   "institutedetails"
            // );
            // let instituteData = await instituteModel.find({});
            // instituteData = instituteData[0]._doc.instituteContact[0].contactname;

            responseReturn = {
              status: "success",
              message: `${master} data`,
              data: searchData,
            };
          }
        }
      } else if (queryData.campusId.toLowerCase() == "all") {
        page = isNaN(Number(queryData.page))
          ? undefined
          : Number(queryData.page);
        limit = isNaN(Number(queryData.limit))
          ? undefined
          : Number(queryData.limit);
        searchKey = queryData.searchKey;
        if (searchKey == undefined) {
          if (page !== undefined && limit !== undefined) {
            //without Search Query
            let itemsPerPage = parseInt(queryData.limit);
            let currentPage = parseInt(queryData.page);
            let skipItems = parseInt(itemsPerPage * currentPage - itemsPerPage);
            const aggregateData = [
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $lookup: {
                  from: "campuses",
                  localField: "programPlan.campusId",
                  foreignField: "_id",
                  as: "campuseDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  pendingAmount: "$pending",
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                  campusIdName: {
                    $arrayElemAt: ["$campuseDetails.campusId", 0],
                  },
                },
              },
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
            ];
            const sfmData = await modelData.aggregate(aggregateData);
            const instituteSchema = mongoose.Schema({}, { strict: false });
            let instituteModel = dbConnection.model(
              "institutedetails",
              instituteSchema,
              "institutedetails"
            );
            let instituteData = await instituteModel.find({});
            instituteData =
              instituteData[0]._doc.instituteContact[0].contactname;
            var sfmDetails =
              sfmData["0"] != undefined
                ? sfmData["0"]["data"] != undefined
                  ? sfmData["0"]["data"]
                  : []
                : [];
            var pageDetails =
              sfmData["0"] != undefined
                ? sfmData["0"]["metadata"] != undefined
                  ? sfmData["0"]["metadata"]["0"]
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
            responseReturn = {
              status: "success",
              message: `${master} data`,
              data: sfmDetails.length
                ? sfmDetails.map((item) => ({
                    ...item,
                    createdBy: instituteData,
                  }))
                : sfmDetails,
              currentPage: pageDetails.page,
              perPage: itemsPerPage,
              nextPage: pageDetails.nextPage,
              totalRecord: pageDetails.total,
              totalPages: pageDetails.totalPages,
            };
          } else if (page == undefined && limit == undefined) {
            {
              console.log("came to else part");
              const aggregateData = [
                {
                  $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student",
                  },
                },
                {
                  $lookup: {
                    from: "feestructures",
                    localField: "feeStructureId",
                    foreignField: "_id",
                    as: "feeStructure",
                  },
                },
                // { $unwind: "$feeStructure" },
                {
                  $lookup: {
                    from: "feetypes",
                    localField: "feeStructure.feeTypeIds",
                    foreignField: "_id",
                    as: "feeType",
                  },
                },
                // {
                //   $lookup: {
                //     from: "feemanagers",
                //     let: { feeTypeId: "$feeType._id", programPlanId: "$programPlanId" },
                //     pipeline: [
                //       {
                //         $match: {
                //           $expr: {
                //             // $and:
                //             feeTypeId: "$feeType._id",
                //             programPlanId: "$programPlanId",
                //             // [
                //             //   { $feeTypeId: "$$feeType._id" },
                //             //   { $programPlanId: "$programPlanId" }
                //             // ]
                //           },
                //         },
                //       },
                //     ],
                //     as: "feeManager",
                //   },
                // },
                // { $unwind: "$feeManager" },
                {
                  $lookup: {
                    from: "reminderplans",
                    localField: "feeManager.reminderPlanId",
                    foreignField: "_id",
                    as: "reminderPlan",
                  },
                },
                {
                  $lookup: {
                    from: "programplans",
                    localField: "programPlanId",
                    foreignField: "_id",
                    as: "programPlan",
                  },
                },
                {
                  $lookup: {
                    from: "paymentschedules",
                    localField: "feeManager.paymentScheduleId",
                    foreignField: "_id",
                    as: "paymentSchedule",
                  },
                },
                {
                  $lookup: {
                    from: "concessionplans",
                    localField: "feeManager.concessionPlanId",
                    foreignField: "_id",
                    as: "concessionPlan",
                  },
                },
                {
                  $lookup: {
                    from: "latefees",
                    localField: "feeManager.lateFeePlanId",
                    foreignField: "_id",
                    as: "lateFee",
                  },
                },
                {
                  $lookup: {
                    from: "installments",
                    localField: "feeManager.installmentPlanId",
                    foreignField: "_id",
                    as: "installment",
                  },
                },
                {
                  $lookup: {
                    from: "feetypes",
                    localField: "feeManager.feeTypeId",
                    foreignField: "_id",
                    as: "feeType",
                  },
                },
                {
                  $lookup: {
                    from: "institutedetails",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "instituteDetails",
                  },
                },
                {
                  $project: {
                    displayName: 1,
                    studentId: {
                      $arrayElemAt: ["$student.displayName", 0],
                    },
                    regId: {
                      $arrayElemAt: ["$student.regId", 0],
                    },
                    dueDate: 1,
                    studentDetails: "$student",
                    studentName: {
                      $concat: [
                        { $arrayElemAt: ["$student.firstName", 0] },
                        " ",
                        { $arrayElemAt: ["$student.lastName", 0] },
                      ],
                    },
                    feeStructureId: {
                      $arrayElemAt: ["$feeStructure.displayName", 0],
                    },
                    feeStructure: {
                      $arrayElemAt: ["$feeStructure.title", 0],
                    },
                    feeStructureDescription: {
                      $arrayElemAt: ["$feeStructure.description", 0],
                    },
                    // programPlanDetails: "$programPlan",
                    totalAmount: "$amount",
                    paidAmount: "$paid",
                    pendingAmount: "$pending",
                    parentName: {
                      $arrayElemAt: ["$student.parentName", 0],
                    },
                    createdBy: "$createdBy",
                    createdAt: "$createdAt",
                    programPlanId: {
                      $arrayElemAt: ["$programPlan.displayName", 0],
                    },
                    reminderPlanId: {
                      $arrayElemAt: ["$reminderPlan.displayName", 0],
                    },
                    reminderPlan: {
                      $arrayElemAt: ["$reminderPlan.title", 0],
                    },
                    reminderPlanDescription: {
                      $arrayElemAt: ["$reminderPlan.description", 0],
                    },
                    paymentScheduleId: {
                      $arrayElemAt: ["$paymentSchedule.displayName", 0],
                    },
                    paymentSchedule: {
                      $arrayElemAt: ["$paymentSchedule.title", 0],
                    },
                    paymentScheduleDescription: {
                      $arrayElemAt: ["$paymentSchedule.description", 0],
                    },
                    concessionPlanId: {
                      $arrayElemAt: ["$concessionPlan.displayName", 0],
                    },
                    concessionPlan: {
                      $arrayElemAt: ["$concessionPlan.title", 0],
                    },
                    concessionPlanDescription: {
                      $arrayElemAt: ["$concessionPlan.description", 0],
                    },
                    lateFeePlanId: {
                      $arrayElemAt: ["$lateFee.displayName", 0],
                    },
                    lateFeePlan: {
                      $arrayElemAt: ["$lateFee.title", 0],
                    },
                    lateFeePlanDescription: {
                      $arrayElemAt: ["$lateFee.description", 0],
                    },
                    installmentPlanId: {
                      $arrayElemAt: ["$installment.displayName", 0],
                    },
                    installment: {
                      $arrayElemAt: ["$installment.title", 0],
                    },
                    installmentDescription: {
                      $arrayElemAt: ["$installment.description", 0],
                    },
                    programPlan: {
                      $arrayElemAt: ["$programPlan.title", 0],
                    },
                    programPlanCode: {
                      $arrayElemAt: ["$programPlan.programCode", 0],
                    },
                    feeTypeName: {
                      $arrayElemAt: ["$feeType.title", 0],
                    },
                    feeTypeId: {
                      $arrayElemAt: ["$feeType.displayName", 0],
                    },
                    feeTypeDescription: {
                      $arrayElemAt: ["$feeType.description", 0],
                    },
                  },
                },
              ];
              const sfmData = await modelData.aggregate(aggregateData);
              const instituteSchema = mongoose.Schema({}, { strict: false });
              let instituteModel = dbConnection.model(
                "institutedetails",
                instituteSchema,
                "institutedetails"
              );
              let instituteData = await instituteModel.find({});
              instituteData =
                instituteData[0]._doc.instituteContact[0].contactname;
              var sfmDetails = sfmData;
              responseReturn = {
                status: "success",
                message: `${master} data`,
                data: sfmDetails.length
                  ? sfmDetails.map((item) => ({
                      ...item,
                      createdBy: instituteData,
                    }))
                  : sfmDetails,
              };
            }
          }
        } else {
          if (
            page !== undefined &&
            limit !== undefined &&
            searchKey !== undefined
          ) {
            //With search Query
            let itemsPerPage = parseInt(queryData.limit);
            let currentPage = parseInt(queryData.page);
            let searchData = [];
            // let skipItems = parseInt(itemsPerPage * currentPage - itemsPerPage);
            const aggregateData = [
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  pendingAmount: "$pending",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                },
              },
            ];
            let findKey = String(searchKey).toLowerCase();
            const sfmData = await modelData.aggregate(aggregateData);
            sfmData.map((item) => {
              if (
                String(item.displayName).toLowerCase().includes(findKey) ||
                String(item.studentName).toLowerCase().includes(findKey) ||
                String(item.studentId).toLowerCase().includes(findKey) ||
                String(item.regId).toLowerCase().includes(findKey) ||
                String(item.programPlanDetails[0].academicYear)
                  .toLowerCase()
                  .includes(findKey) ||
                String(item.feeStructure).toLowerCase().includes(findKey) ||
                String(item.programPlan).toLowerCase().includes(findKey) ||
                String(item.feeTypeName).toLowerCase().includes(findKey) ||
                String(item.feeTypeId).toLowerCase().includes(findKey) ||
                String(item.totalAmount).toLowerCase().includes(findKey) ||
                String(item.paidAmount).toLowerCase().includes(findKey) ||
                String(item.pendingAmount).toLowerCase().includes(findKey) ||
                String(item.parentName).toLowerCase().includes(findKey)
              ) {
                searchData.push(item);
              }
            });
            const instituteSchema = mongoose.Schema({}, { strict: false });
            let instituteModel = dbConnection.model(
              "institutedetails",
              instituteSchema,
              "institutedetails"
            );
            let instituteData = await instituteModel.find({});
            instituteData =
              instituteData[0]._doc.instituteContact[0].contactname;

            // var sfmDetails =
            //   sfmData["0"] != undefined
            //     ? sfmData["0"]["data"] != undefined
            //       ? sfmData["0"]["data"]
            //       : []
            //     : [];

            // var pageDetails =
            //   sfmData["0"] != undefined
            //     ? sfmData["0"]["metadata"] != undefined
            //       ? sfmData["0"]["metadata"]["0"]
            //       : {
            //         page: null,
            //         nextPage: null,
            //         total: null,
            //         totalPages: null,
            //       }
            //     : {
            //       page: null,
            //       nextPage: null,
            //       total: null,
            //       totalPages: null,
            //     };
            let paginated = await Paginator(
              searchData,
              currentPage,
              itemsPerPage
            );
            // console.log(paginated)
            // return searchData
            responseReturn = {
              status: "success",
              message: `${master} data has been fetched successfully`,
              data: paginated.data,
              currentPage: paginated.page,
              perPage: itemsPerPage,
              nextPage: paginated.next_page,
              totalRecord: paginated.total,
              totalPages: paginated.total_pages,
            };
          } else {
            let searchData = [];
            const aggregateData = [
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  pendingAmount: "$pending",
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                },
              },
            ];
            let findKey = String(searchKey).toLowerCase();
            const sfmData = await modelData.aggregate(aggregateData);
            // return sfmData
            sfmData.map((item) => {
              if (
                String(item.displayName).toLowerCase().includes(findKey) ||
                String(item.studentName).toLowerCase().includes(findKey) ||
                String(item.studentId).toLowerCase().includes(findKey) ||
                String(item.regId).toLowerCase().includes(findKey) ||
                String(item.programPlanDetails[0].academicYear)
                  .toLowerCase()
                  .includes(findKey) ||
                String(item.feeStructure).toLowerCase().includes(findKey) ||
                String(item.programPlan).toLowerCase().includes(findKey) ||
                String(item.feeTypeName).toLowerCase().includes(findKey) ||
                String(item.feeTypeId).toLowerCase().includes(findKey) ||
                String(item.totalAmount).toLowerCase().includes(findKey) ||
                String(item.paidAmount).toLowerCase().includes(findKey) ||
                String(item.pendingAmount).toLowerCase().includes(findKey) ||
                String(item.parentName).toLowerCase().includes(findKey)
              ) {
                searchData.push(item);
              }
            });
            // const instituteSchema = mongoose.Schema({}, { strict: false });
            // let instituteModel = dbConnection.model(
            //   "institutedetails",
            //   instituteSchema,
            //   "institutedetails"
            // );
            // let instituteData = await instituteModel.find({});
            // instituteData = instituteData[0]._doc.instituteContact[0].contactname;

            responseReturn = {
              status: "success",
              message: `${master} data`,
              data: searchData,
            };
          }
        }
      } else {
        page = isNaN(Number(queryData.page))
          ? undefined
          : Number(queryData.page);
        limit = isNaN(Number(queryData.limit))
          ? undefined
          : Number(queryData.limit);
        searchKey = queryData.searchKey;
        if (searchKey == undefined) {
          if (page !== undefined && limit !== undefined) {
            //without Search Query
            let itemsPerPage = parseInt(queryData.limit);
            let currentPage = parseInt(queryData.page);
            let skipItems = parseInt(itemsPerPage * currentPage - itemsPerPage);
            let createdUser = queryData.campusId;
            console.log("campusid", createdUser);
            const aggregateData = [
              {
                $match: { campusId: createdUser },
              },
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $lookup: {
                  from: "campuses",
                  localField: "programPlan.campusId",
                  foreignField: "_id",
                  as: "campuseDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  pendingAmount: "$pending",
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                  campusIdName: {
                    $arrayElemAt: ["$campuseDetails.campusId", 0],
                  },
                },
              },
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
            ];
            const sfmData = await modelData.aggregate(aggregateData);
            const instituteSchema = mongoose.Schema({}, { strict: false });
            let instituteModel = dbConnection.model(
              "institutedetails",
              instituteSchema,
              "institutedetails"
            );
            let instituteData = await instituteModel.find({});
            instituteData =
              instituteData[0]._doc.instituteContact[0].contactname;
            var sfmDetails =
              sfmData["0"] != undefined
                ? sfmData["0"]["data"] != undefined
                  ? sfmData["0"]["data"]
                  : []
                : [];
            var pageDetails =
              sfmData["0"] != undefined
                ? sfmData["0"]["metadata"] != undefined
                  ? sfmData["0"]["metadata"]["0"]
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
            responseReturn = {
              status: "success",
              message: `${master} data`,
              data: sfmDetails.length
                ? sfmDetails.map((item) => ({
                    ...item,
                    createdBy: instituteData,
                  }))
                : sfmDetails,
              currentPage: pageDetails.page,
              perPage: itemsPerPage,
              nextPage: pageDetails.nextPage,
              totalRecord: pageDetails.total,
              totalPages: pageDetails.totalPages,
            };
          } else if (page == undefined && limit == undefined) {
            {
              let createdUser = queryData.campusId;
              console.log("campusid", createdUser);
              const aggregateData = [
                {
                  $match: { campusId: createdUser },
                },
                {
                  $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student",
                  },
                },
                {
                  $lookup: {
                    from: "feestructures",
                    localField: "feeStructureId",
                    foreignField: "_id",
                    as: "feeStructure",
                  },
                },
                // { $unwind: "$feeStructure" },
                {
                  $lookup: {
                    from: "feetypes",
                    localField: "feeStructure.feeTypeIds",
                    foreignField: "_id",
                    as: "feeType",
                  },
                },
                // {
                //   $lookup: {
                //     from: "feemanagers",
                //     let: { feeTypeId: "$feeType._id", programPlanId: "$programPlanId" },
                //     pipeline: [
                //       {
                //         $match: {
                //           $expr: {
                //             // $and:
                //             feeTypeId: "$feeType._id",
                //             programPlanId: "$programPlanId",
                //             // [
                //             //   { $feeTypeId: "$$feeType._id" },
                //             //   { $programPlanId: "$programPlanId" }
                //             // ]
                //           },
                //         },
                //       },
                //     ],
                //     as: "feeManager",
                //   },
                // },
                // { $unwind: "$feeManager" },
                {
                  $lookup: {
                    from: "reminderplans",
                    localField: "feeManager.reminderPlanId",
                    foreignField: "_id",
                    as: "reminderPlan",
                  },
                },
                {
                  $lookup: {
                    from: "programplans",
                    localField: "programPlanId",
                    foreignField: "_id",
                    as: "programPlan",
                  },
                },
                {
                  $lookup: {
                    from: "paymentschedules",
                    localField: "feeManager.paymentScheduleId",
                    foreignField: "_id",
                    as: "paymentSchedule",
                  },
                },
                {
                  $lookup: {
                    from: "concessionplans",
                    localField: "feeManager.concessionPlanId",
                    foreignField: "_id",
                    as: "concessionPlan",
                  },
                },
                {
                  $lookup: {
                    from: "latefees",
                    localField: "feeManager.lateFeePlanId",
                    foreignField: "_id",
                    as: "lateFee",
                  },
                },
                {
                  $lookup: {
                    from: "installments",
                    localField: "feeManager.installmentPlanId",
                    foreignField: "_id",
                    as: "installment",
                  },
                },
                {
                  $lookup: {
                    from: "feetypes",
                    localField: "feeManager.feeTypeId",
                    foreignField: "_id",
                    as: "feeType",
                  },
                },
                {
                  $lookup: {
                    from: "institutedetails",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "instituteDetails",
                  },
                },
                {
                  $project: {
                    displayName: 1,
                    studentId: {
                      $arrayElemAt: ["$student.displayName", 0],
                    },
                    regId: {
                      $arrayElemAt: ["$student.regId", 0],
                    },
                    dueDate: 1,
                    studentDetails: "$student",
                    studentName: {
                      $concat: [
                        { $arrayElemAt: ["$student.firstName", 0] },
                        " ",
                        { $arrayElemAt: ["$student.lastName", 0] },
                      ],
                    },
                    feeStructureId: {
                      $arrayElemAt: ["$feeStructure.displayName", 0],
                    },
                    feeStructure: {
                      $arrayElemAt: ["$feeStructure.title", 0],
                    },
                    feeStructureDescription: {
                      $arrayElemAt: ["$feeStructure.description", 0],
                    },
                    // programPlanDetails: "$programPlan",
                    totalAmount: "$amount",
                    paidAmount: "$paid",
                    pendingAmount: "$pending",
                    parentName: {
                      $arrayElemAt: ["$student.parentName", 0],
                    },
                    createdBy: "$createdBy",
                    createdAt: "$createdAt",
                    programPlanId: {
                      $arrayElemAt: ["$programPlan.displayName", 0],
                    },
                    reminderPlanId: {
                      $arrayElemAt: ["$reminderPlan.displayName", 0],
                    },
                    reminderPlan: {
                      $arrayElemAt: ["$reminderPlan.title", 0],
                    },
                    reminderPlanDescription: {
                      $arrayElemAt: ["$reminderPlan.description", 0],
                    },
                    paymentScheduleId: {
                      $arrayElemAt: ["$paymentSchedule.displayName", 0],
                    },
                    paymentSchedule: {
                      $arrayElemAt: ["$paymentSchedule.title", 0],
                    },
                    paymentScheduleDescription: {
                      $arrayElemAt: ["$paymentSchedule.description", 0],
                    },
                    concessionPlanId: {
                      $arrayElemAt: ["$concessionPlan.displayName", 0],
                    },
                    concessionPlan: {
                      $arrayElemAt: ["$concessionPlan.title", 0],
                    },
                    concessionPlanDescription: {
                      $arrayElemAt: ["$concessionPlan.description", 0],
                    },
                    lateFeePlanId: {
                      $arrayElemAt: ["$lateFee.displayName", 0],
                    },
                    lateFeePlan: {
                      $arrayElemAt: ["$lateFee.title", 0],
                    },
                    lateFeePlanDescription: {
                      $arrayElemAt: ["$lateFee.description", 0],
                    },
                    installmentPlanId: {
                      $arrayElemAt: ["$installment.displayName", 0],
                    },
                    installment: {
                      $arrayElemAt: ["$installment.title", 0],
                    },
                    installmentDescription: {
                      $arrayElemAt: ["$installment.description", 0],
                    },
                    programPlan: {
                      $arrayElemAt: ["$programPlan.title", 0],
                    },
                    programPlanCode: {
                      $arrayElemAt: ["$programPlan.programCode", 0],
                    },
                    feeTypeName: {
                      $arrayElemAt: ["$feeType.title", 0],
                    },
                    feeTypeId: {
                      $arrayElemAt: ["$feeType.displayName", 0],
                    },
                    feeTypeDescription: {
                      $arrayElemAt: ["$feeType.description", 0],
                    },
                  },
                },
              ];
              const sfmData = await modelData.aggregate(aggregateData);
              const instituteSchema = mongoose.Schema({}, { strict: false });
              let instituteModel = dbConnection.model(
                "institutedetails",
                instituteSchema,
                "institutedetails"
              );
              let instituteData = await instituteModel.find({});
              instituteData =
                instituteData[0]._doc.instituteContact[0].contactname;
              var sfmDetails = sfmData;
              responseReturn = {
                status: "success",
                message: `${master} data`,
                data: sfmDetails.length
                  ? sfmDetails.map((item) => ({
                      ...item,
                      createdBy: instituteData,
                    }))
                  : sfmDetails,
              };
            }
          }
        } else {
          if (
            page !== undefined &&
            limit !== undefined &&
            searchKey !== undefined
          ) {
            //With search Query
            let itemsPerPage = parseInt(queryData.limit);
            let currentPage = parseInt(queryData.page);
            let searchData = [];
            // let skipItems = parseInt(itemsPerPage * currentPage - itemsPerPage);
            let createdUser = queryData.campusId;
            console.log("campusid", createdUser);
            const aggregateData = [
              {
                $match: { campusId: createdUser },
              },
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  pendingAmount: "$pending",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                },
              },
            ];
            let findKey = String(searchKey).toLowerCase();
            const sfmData = await modelData.aggregate(aggregateData);
            sfmData.map((item) => {
              if (
                String(item.displayName).toLowerCase().includes(findKey) ||
                String(item.studentName).toLowerCase().includes(findKey) ||
                String(item.studentId).toLowerCase().includes(findKey) ||
                String(item.regId).toLowerCase().includes(findKey) ||
                String(item.programPlanDetails[0].academicYear)
                  .toLowerCase()
                  .includes(findKey) ||
                String(item.feeStructure).toLowerCase().includes(findKey) ||
                String(item.programPlan).toLowerCase().includes(findKey) ||
                String(item.feeTypeName).toLowerCase().includes(findKey) ||
                String(item.feeTypeId).toLowerCase().includes(findKey) ||
                String(item.totalAmount).toLowerCase().includes(findKey) ||
                String(item.paidAmount).toLowerCase().includes(findKey) ||
                String(item.pendingAmount).toLowerCase().includes(findKey) ||
                String(item.parentName).toLowerCase().includes(findKey)
              ) {
                searchData.push(item);
              }
            });
            const instituteSchema = mongoose.Schema({}, { strict: false });
            let instituteModel = dbConnection.model(
              "institutedetails",
              instituteSchema,
              "institutedetails"
            );
            let instituteData = await instituteModel.find({});
            instituteData =
              instituteData[0]._doc.instituteContact[0].contactname;

            // var sfmDetails =
            //   sfmData["0"] != undefined
            //     ? sfmData["0"]["data"] != undefined
            //       ? sfmData["0"]["data"]
            //       : []
            //     : [];

            // var pageDetails =
            //   sfmData["0"] != undefined
            //     ? sfmData["0"]["metadata"] != undefined
            //       ? sfmData["0"]["metadata"]["0"]
            //       : {
            //         page: null,
            //         nextPage: null,
            //         total: null,
            //         totalPages: null,
            //       }
            //     : {
            //       page: null,
            //       nextPage: null,
            //       total: null,
            //       totalPages: null,
            //     };
            let paginated = await Paginator(
              searchData,
              currentPage,
              itemsPerPage
            );
            // console.log(paginated)
            // return searchData
            responseReturn = {
              status: "success",
              message: `${master} data has been fetched successfully`,
              data: paginated.data,
              currentPage: paginated.page,
              perPage: itemsPerPage,
              nextPage: paginated.next_page,
              totalRecord: paginated.total,
              totalPages: paginated.total_pages,
            };
          } else {
            let searchData = [];
            let createdUser = queryData.campusId;
            console.log("campusid", createdUser);
            const aggregateData = [
              {
                $match: { campusId: createdUser },
              },
              {
                $lookup: {
                  from: "students",
                  localField: "studentId",
                  foreignField: "_id",
                  as: "student",
                },
              },
              {
                $lookup: {
                  from: "feestructures",
                  localField: "feeStructureId",
                  foreignField: "_id",
                  as: "feeStructure",
                },
              },
              // { $unwind: "$feeStructure" },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeStructure.feeTypeIds",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "feemanagers",
                  let: {
                    feeTypeId: "$feeType._id",
                    programPlanId: "$programPlanId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          // $and:
                          feeTypeId: "$feeType._id",
                          programPlanId: "$programPlanId",
                          // [
                          //   { $feeTypeId: "$$feeType._id" },
                          //   { $programPlanId: "$programPlanId" }
                          // ]
                        },
                      },
                    },
                  ],
                  as: "feeManager",
                },
              },
              // { $unwind: "$feeManager" },
              {
                $lookup: {
                  from: "reminderplans",
                  localField: "feeManager.reminderPlanId",
                  foreignField: "_id",
                  as: "reminderPlan",
                },
              },
              {
                $lookup: {
                  from: "programplans",
                  localField: "programPlanId",
                  foreignField: "_id",
                  as: "programPlan",
                },
              },
              {
                $lookup: {
                  from: "paymentschedules",
                  localField: "feeManager.paymentScheduleId",
                  foreignField: "_id",
                  as: "paymentSchedule",
                },
              },
              {
                $lookup: {
                  from: "concessionplans",
                  localField: "feeManager.concessionPlanId",
                  foreignField: "_id",
                  as: "concessionPlan",
                },
              },
              {
                $lookup: {
                  from: "latefees",
                  localField: "feeManager.lateFeePlanId",
                  foreignField: "_id",
                  as: "lateFee",
                },
              },
              {
                $lookup: {
                  from: "installments",
                  localField: "feeManager.installmentPlanId",
                  foreignField: "_id",
                  as: "installment",
                },
              },
              {
                $lookup: {
                  from: "feetypes",
                  localField: "feeManager.feeTypeId",
                  foreignField: "_id",
                  as: "feeType",
                },
              },
              {
                $lookup: {
                  from: "institutedetails",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "instituteDetails",
                },
              },
              {
                $project: {
                  displayName: 1,
                  studentId: {
                    $arrayElemAt: ["$student.displayName", 0],
                  },
                  regId: {
                    $arrayElemAt: ["$student.regId", 0],
                  },
                  dueDate: 1,
                  studentDetails: "$student",
                  studentName: {
                    $concat: [
                      { $arrayElemAt: ["$student.firstName", 0] },
                      " ",
                      { $arrayElemAt: ["$student.lastName", 0] },
                    ],
                  },
                  feeStructureId: {
                    $arrayElemAt: ["$feeStructure.displayName", 0],
                  },
                  feeStructure: {
                    $arrayElemAt: ["$feeStructure.title", 0],
                  },
                  feeStructureDescription: {
                    $arrayElemAt: ["$feeStructure.description", 0],
                  },
                  programPlanDetails: "$programPlan",
                  feeDetails: "$feeManager.feeDetails",
                  totalAmount: "$amount",
                  paidAmount: "$paid",
                  parentName: {
                    $arrayElemAt: ["$student.parentName", 0],
                  },
                  pendingAmount: "$pending",
                  createdBy: "$createdBy",
                  createdAt: "$createdAt",
                  programPlanId: {
                    $arrayElemAt: ["$programPlan.displayName", 0],
                  },
                  reminderPlanId: {
                    $arrayElemAt: ["$reminderPlan.displayName", 0],
                  },
                  reminderPlan: {
                    $arrayElemAt: ["$reminderPlan.title", 0],
                  },
                  reminderPlanDescription: {
                    $arrayElemAt: ["$reminderPlan.description", 0],
                  },
                  paymentScheduleId: {
                    $arrayElemAt: ["$paymentSchedule.displayName", 0],
                  },
                  paymentSchedule: {
                    $arrayElemAt: ["$paymentSchedule.title", 0],
                  },
                  paymentScheduleDescription: {
                    $arrayElemAt: ["$paymentSchedule.description", 0],
                  },
                  concessionPlanId: {
                    $arrayElemAt: ["$concessionPlan.displayName", 0],
                  },
                  concessionPlan: {
                    $arrayElemAt: ["$concessionPlan.title", 0],
                  },
                  concessionPlanDescription: {
                    $arrayElemAt: ["$concessionPlan.description", 0],
                  },
                  lateFeePlanId: {
                    $arrayElemAt: ["$lateFee.displayName", 0],
                  },
                  lateFeePlan: {
                    $arrayElemAt: ["$lateFee.title", 0],
                  },
                  lateFeePlanDescription: {
                    $arrayElemAt: ["$lateFee.description", 0],
                  },
                  installmentPlanId: {
                    $arrayElemAt: ["$installment.displayName", 0],
                  },
                  installment: {
                    $arrayElemAt: ["$installment.title", 0],
                  },
                  installmentDescription: {
                    $arrayElemAt: ["$installment.description", 0],
                  },
                  programPlan: {
                    $arrayElemAt: ["$programPlan.title", 0],
                  },
                  programPlanCode: {
                    $arrayElemAt: ["$programPlan.programCode", 0],
                  },
                  feeTypeName: {
                    $arrayElemAt: ["$feeType.title", 0],
                  },
                  feeTypeId: {
                    $arrayElemAt: ["$feeType.displayName", 0],
                  },
                  feeTypeDescription: {
                    $arrayElemAt: ["$feeType.description", 0],
                  },
                },
              },
            ];
            let findKey = String(searchKey).toLowerCase();
            const sfmData = await modelData.aggregate(aggregateData);
            // return sfmData
            sfmData.map((item) => {
              if (
                String(item.displayName).toLowerCase().includes(findKey) ||
                String(item.studentName).toLowerCase().includes(findKey) ||
                String(item.studentId).toLowerCase().includes(findKey) ||
                String(item.regId).toLowerCase().includes(findKey) ||
                String(item.programPlanDetails[0].academicYear)
                  .toLowerCase()
                  .includes(findKey) ||
                String(item.feeStructure).toLowerCase().includes(findKey) ||
                String(item.programPlan).toLowerCase().includes(findKey) ||
                String(item.feeTypeName).toLowerCase().includes(findKey) ||
                String(item.feeTypeId).toLowerCase().includes(findKey) ||
                String(item.totalAmount).toLowerCase().includes(findKey) ||
                String(item.paidAmount).toLowerCase().includes(findKey) ||
                String(item.pendingAmount).toLowerCase().includes(findKey) ||
                String(item.parentName).toLowerCase().includes(findKey)
              ) {
                searchData.push(item);
              }
            });
            // const instituteSchema = mongoose.Schema({}, { strict: false });
            // let instituteModel = dbConnection.model(
            //   "institutedetails",
            //   instituteSchema,
            //   "institutedetails"
            // );
            // let instituteData = await instituteModel.find({});
            // instituteData = instituteData[0]._doc.instituteContact[0].contactname;

            responseReturn = {
              status: "success",
              message: `${master} data`,
              data: searchData,
            };
          }
        }
      }
    } else {
      responseReturn = {
        status: "failure",
        message: "master not found",
      };
    }
    return responseReturn;
  } catch (e) {
    return e;
  }
}

async function sendDemandNote(
  master,
  method,
  inputData,
  dbConnection,
  modelData,
  queryData
) {
  try {
    var responseReturn = {};
    const masterDataSchema = mongoose.Schema({}, { strict: false });
    let mesterDataCollection = await dbConnection.model(
      msaterCollectionName,
      masterDataSchema,
      msaterCollectionName
    );
    let details = await mesterDataCollection.find({});
    var mastersData = details["0"]._doc["data"];
    if (method == "post") {
    } else if (method == "put") {
    } else if (method == "get") {
      var studentFeeMngerData = [];
      let studentModel = dbConnection.model("students", StudentSchema);
      let feeManagerSchema = dbConnection.model(
        "feemanagers",
        FeeManagerSchema
      );
      let feeStructureSchema = dbConnection.model(
        "feestructures",
        FeeStructureSchema
      );
      let programPlanSchema = dbConnection.model(
        "programplans",
        ProgramPlanSchema
      );
      let guardianModel = dbConnection.model("guardian", GuardianSchema);
      let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
      var getDatasDetails =
        queryData.id == undefined
          ? await modelData.find({})
          : await modelData.findOne({ _id: queryData.id });
      const { page, limit } = queryData;
      let paginationDatas = await Paginator(getDatasDetails, page, limit);
      let getDatas = paginationDatas.data;
      for (let i = 0; i < getDatas.length; i++) {
        var gd = getDatas[i];
        var studentFeeMngerDataObj = {};
        studentFeeMngerDataObj["displayName"] = gd["displayName"];
        studentFeeMngerDataObj["studentId"] = gd["studentId"];
        let studentDatas = await studentModel.findOne({ _id: gd.studentId });
        // let particularStudent = {};
        let feeStructData = {};
        let ftDatas = [];
        var dueDate = {};
        // for (let w = 0; w < mastersData["studentDetails"].length; w++) {
        //   if (
        //     studentDatas["regId"] ==
        //     mastersData["studentDetails"][w]["Reg No *"]
        //   ) {
        //     particularStudent = mastersData["studentDetails"][w];
        //   }
        // }
        // for (let j = 0; j < gd["feeStructureId"].length; j++) {
        //   var fsData = gd["feeStructureId"][j];
        //   if (j == 0) {
        //     dueDate = {
        //       dueDate:
        //         gd["feeStructureId"][j]["paymentSchedule"]["0"]["dueDate"],
        //       type: "Year",
        //     };
        //   }
        //   let fsDatas = await feeStructureSchema.findOne({
        //     _id: gd["feeStructureId"][j]["id"],
        //   });
        let fsDatas = await feeStructureSchema.findOne({
          _id: gd["feeStructureId"],
        });
        feeStructData = fsDatas;
        for (let k = 0; k < fsDatas["feeTypeIds"].length; k++) {
          // let fmDatas = await feeManagerSchema.findOne({
          //   feeTypeId: fsDatas["feeTypeIds"][k],
          //   programPlanId: gd["programPlanId"]
          // });
          let fsItems = await feeTypeModel.findOne({
            _id: fsDatas["feeTypeIds"][k],
          });
          var ftMerge = {
            ...fsItems._doc,
          };
          ftDatas.push(ftMerge);
        }
        // }

        let ppDetails = await programPlanSchema.findOne({
          _id: gd["programPlanId"],
        });
        studentFeeMngerDataObj["programPlanDetails"] = ppDetails._doc;
        studentFeeMngerDataObj["dueDate"] =
          gd["dueDate"] != undefined ? gd["dueDate"] : null;
        studentFeeMngerDataObj["studentDetails"] = studentDatas;
        var guardianDetails = [];
        for (let i = 0; i < studentDatas.guardianDetails.length; i++) {
          var gdd = await guardianModel.findOne({
            _id: studentDatas.guardianDetails[i],
          });
          guardianDetails.push(gdd);
        }
        studentFeeMngerDataObj["guardianDetails"] = guardianDetails;
        studentFeeMngerDataObj["studentName"] = `${studentDatas["firstName"]}${
          studentDatas["middleName"] == null
            ? ""
            : " " + studentDatas["middleName"]
        } ${studentDatas["lastName"]}`;
        studentFeeMngerDataObj["feeStructureId"] = feeStructData["displayName"];
        studentFeeMngerDataObj["feeStructure"] = feeStructData["title"];
        studentFeeMngerDataObj["feeStructureDescription"] =
          feeStructData["description"];
        studentFeeMngerDataObj["feeDetails"] = ftDatas;
        studentFeeMngerDataObj["totalAmount"] = gd["amount"];
        studentFeeMngerDataObj["paidAmount"] = gd["paid"];
        studentFeeMngerDataObj["pendingAmount"] = gd["pending"];
        studentFeeMngerDataObj["createdBy"] = gd["createdBy"];
        studentFeeMngerDataObj["createdAt"] = gd["createdAt"];
        studentFeeMngerData.push(studentFeeMngerDataObj);
      }
      const instituteSchema = mongoose.Schema({}, { strict: false });
      let instituteModel = dbConnection.model(
        "institutedetails",
        instituteSchema,
        "institutedetails"
      );
      let instituteData = await instituteModel.find({});
      instituteData = instituteData[0]._doc.instituteContact[0].contactname;
      responseReturn = {
        status: "success",
        message: `${master} data`,
        data: studentFeeMngerData.length
          ? studentFeeMngerData.map((item) => ({
              ...item,
              createdBy: instituteData,
            }))
          : studentFeeMngerData,
        currentPage: paginationDatas.page,
        perPage: paginationDatas.perPage,
        nextPage: paginationDatas.next_page,
        totalRecord: paginationDatas.total,
        totalPages: paginationDatas.total_pages,
      };
    } else {
      responseReturn = {
        status: "failure",
        message: "master not found",
      };
    }
    return responseReturn;
  } catch (e) {
    return e;
  }
}

async function getDisplayId(req, res) {
  const { type } = req.params;
  const { orgId } = req.query;
  console.log("type", type);
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
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  var getDatas = [];
  var transType = "";
  if (type == "paymentSchedule") {
    let paymentScheduleModel = dbConnection.model(
      "paymentSchedule",
      PaymentScheduleSchema
    );
    // getDatas = await paymentScheduleModel.find({ parentId: id })
    getDatas = await paymentScheduleModel.find({});
    transType = "PYMSCH";
  } else if (type == "installments") {
    let installmentSchema = dbConnection.model(
      "installments",
      InstallmentSchema
    );
    getDatas = await installmentSchema.find({});
    transType = "INST";
  } else if (type == "lateFees") {
    let lateFeeSchema = dbConnection.model("lateFees", LateFeeSchema);
    getDatas = await lateFeeSchema.find({});
    transType = "LTFEE";
  } else if (type == "reminders") {
    let reminderSchema = dbConnection.model("reminderPlan", ReminderSchema);
    getDatas = await reminderSchema.find({});
    transType = "REM";
  } else if (type == "category") {
    let cateSchema = dbConnection.model("categoryplans", categorySchema);
    getDatas = await cateSchema.find({});
    transType = "CAT";
  } else if (type == "concession") {
    let conSchema = dbConnection.model("concessionplans", concessionSchema);
    getDatas = await conSchema.find({});
    transType = "CON";
  } else if (type == "feeStructure") {
    let fsSchema = dbConnection.model("feestructures", FeeStructureSchema);
    getDatas = await fsSchema.find({});
    transType = "FS";
  } else if (type == "feeTypes") {
    let ftSchema = dbConnection.model("feeTypes", FeeTypeSchema);
    getDatas = await ftSchema.find({});
    transType = "FT";
  } else if (type == "scholarships") {
    console.log("enterd into sch");
    let ftSchema = dbConnection.model("scholarships", scholarshipSchema);
    getDatas = await ftSchema.find({});
    transType = "SCH";
  } else if (type == "loans") {
    let ftSchema = dbConnection.model("loans", loanSchema);
    getDatas = await ftSchema.find({});
    transType = "LOAN";
  }
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
  res.status(200).send({
    status: "success",
    message: `ID generated`,
    data: finalVal,
  });
  centralDbConnection.close() // new
  dbConnection.close() // new
}

// const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
// getDatas.forEach((el) => {
//   if (el["displayName"]) {
//     // let filStr = el["displayName"].split("");
//     let typeStr = String(el["displayName"]).slice(
//       0,
//       String(transType).length
//     );
//     // let typeYear = filStr[1];
//     // if (typeStr == transType && typeYear == finYear) {
//     if (typeStr == transType) {
//       check = true;
//       dataArr.push(el["displayName"]);
//     }
//   }
// });
// if (!check) {
//   finalVal = initial;
// } else {
//   let lastCount = String(
//     dataArr.sort(sortAlphaNum)[dataArr.length - 1]
//   ).slice(String(transType).length);
//   let lastCountNo = Number(lastCount) + 1;
//   if (lastCountNo.toString().length == 1) lastCountNo = "00" + lastCountNo;
//   if (lastCountNo.toString().length == 2) lastCountNo = "0" + lastCountNo;
//   lastCount[2] = lastCountNo;
//   finalVal = `${transType}${lastCountNo}`;
// }
// res.status(200).send({
//   status: "success",
//   message: `ID generated`,
//   data: finalVal,
// });
// }

async function getStudents(dbConnection, itemsPerPage, currentPage, campusId) {
  let skipItems = itemsPerPage * currentPage - itemsPerPage;
  let aggregateData;
  if (campusId == "undefined" || campusId == undefined || campusId == "null") {
    aggregateData = [
      { $unwind: "$guardianDetails" },
      {
        $lookup: {
          from: "guardians",
          localField: "guardianDetails",
          foreignField: "_id",
          as: "guardianDetails",
        },
      },
      {
        $lookup: {
          from: "programplans",
          localField: "programPlanId",
          foreignField: "_id",
          as: "programPlan",
        },
      },
      {
        $lookup: {
          from: "campuses",
          localField: "programPlan.campusId",
          foreignField: "_id",
          as: "campuseDetails",
        },
      },
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
                        { $ceil: { $divide: ["$total", itemsPerPage] } },
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
    ];
  } else if (campusId.toLowerCase() == "all") {
    aggregateData = [
      { $unwind: "$guardianDetails" },
      {
        $lookup: {
          from: "guardians",
          localField: "guardianDetails",
          foreignField: "_id",
          as: "guardianDetails",
        },
      },
      {
        $lookup: {
          from: "programplans",
          localField: "programPlanId",
          foreignField: "_id",
          as: "programPlan",
        },
      },
      {
        $lookup: {
          from: "campuses",
          localField: "programPlan.campusId",
          foreignField: "_id",
          as: "campuseDetails",
        },
      },
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
                        { $ceil: { $divide: ["$total", itemsPerPage] } },
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
    ];
  } else {
    let createdUser = campusId;
    aggregateData = [
      {
        $match: { campusId: createdUser },
      },
      { $unwind: "$guardianDetails" },
      {
        $lookup: {
          from: "guardians",
          localField: "guardianDetails",
          foreignField: "_id",
          as: "guardianDetails",
        },
      },
      {
        $lookup: {
          from: "programplans",
          localField: "programPlanId",
          foreignField: "_id",
          as: "programPlan",
        },
      },
      {
        $lookup: {
          from: "campuses",
          localField: "programPlan.campusId",
          foreignField: "_id",
          as: "campuseDetails",
        },
      },
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
                        { $ceil: { $divide: ["$total", itemsPerPage] } },
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
    ];
  }
  const studentModel = dbConnection.model(
    "students",
    StudentSchema,
    "students"
  );
  const studentData = await studentModel.aggregate(aggregateData);
  return studentData;
}

async function getFeeManagers(
  dbConnection,
  itemsPerPage,
  currentPage,
  campusId
) {
  let skipItems = itemsPerPage * currentPage - itemsPerPage;
  let aggregateData;
  if (campusId == "undefined" || campusId == undefined || campusId == "null") {
    aggregateData = [
      // { $unwind: "$reminderPlan" },
      // { $unwind: "$programPlan" },
      // { $unwind: "$paymentSchedule" },
      // { $unwind: "$concessionPlan" },
      // { $unwind: "$lateFee" },
      // { $unwind: "$installment" },
      {
        $lookup: {
          from: "reminderplans",
          localField: "reminderPlanId",
          foreignField: "_id",
          as: "reminderPlan",
        },
      },
      {
        $lookup: {
          from: "programplans",
          localField: "programPlanId",
          foreignField: "_id",
          as: "programPlan",
        },
      },
      {
        $lookup: {
          from: "paymentschedules",
          localField: "paymentScheduleId",
          foreignField: "_id",
          as: "paymentSchedule",
        },
      },
      {
        $lookup: {
          from: "concessionplans",
          localField: "concessionPlanId",
          foreignField: "_id",
          as: "concessionPlan",
        },
      },
      {
        $lookup: {
          from: "latefees",
          localField: "lateFeePlanId",
          foreignField: "_id",
          as: "lateFee",
        },
      },
      {
        $lookup: {
          from: "installments",
          localField: "installmentPlanId",
          foreignField: "_id",
          as: "installment",
        },
      },
      {
        $lookup: {
          from: "feetypes",
          localField: "feeTypeId",
          foreignField: "_id",
          as: "feeType",
        },
      },
      {
        $lookup: {
          from: "institutedetails",
          localField: "createdBy",
          foreignField: "_id",
          as: "instituteDetails",
        },
      },
      {
        $lookup: {
          from: "campuses",
          localField: "programPlan.campusId",
          foreignField: "_id",
          as: "campuseDetails",
        },
      },
      {
        $addFields: {
          programPlanDetails: "$programPlan",
          reminderPlanDetails: "$reminderPlan",
          paymentScheduleDetails: "$paymentSchedule",
          concessionPlanDetais: "$concessionPlan",
          feeTypeDet: "$feeType",
          lateFeePlanDetails: "$lateFee",
          installmentPlanDetails: "$installment",
          createdBy: "$instituteDetails",
        },
      },
      {
        $project: {
          // projection
          programPlan: {
            $arrayElemAt: ["$programPlanDetails", 0],
          },
          reminderPlan: {
            $arrayElemAt: ["$reminderPlanDetails", 0],
          },
          paymentSchedule: {
            $arrayElemAt: ["$paymentScheduleDetails", 0],
          },
          concessionPlan: {
            $arrayElemAt: ["$concessionPlanDetais", 0],
          },
          lateFeePlan: {
            $arrayElemAt: ["$lateFeePlanDetails", 0],
          },
          installmentPlan: {
            $arrayElemAt: ["$installmentPlanDetails", 0],
          },
          feeType: {
            $arrayElemAt: ["$feeTypeDet", 0],
          },
          displayName: 1,
          title: 1,
          description: 1,
          feeDetails: 1,
          campusIdName: {
            $arrayElemAt: ["$campuseDetails.campusId", 0],
          },
          createdBy: {
            $arrayElemAt: ["$createdBy.instituteContact[0].contactname", 0],
          },
          createdAt: 1,
        },
      },
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
                        { $ceil: { $divide: ["$total", itemsPerPage] } },
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
    ];
  } else if (campusId.toLowerCase() == "all") {
    aggregateData = [
      // { $unwind: "$reminderPlan" },
      // { $unwind: "$programPlan" },
      // { $unwind: "$paymentSchedule" },
      // { $unwind: "$concessionPlan" },
      // { $unwind: "$lateFee" },
      // { $unwind: "$installment" },
      {
        $lookup: {
          from: "reminderplans",
          localField: "reminderPlanId",
          foreignField: "_id",
          as: "reminderPlan",
        },
      },
      {
        $lookup: {
          from: "programplans",
          localField: "programPlanId",
          foreignField: "_id",
          as: "programPlan",
        },
      },
      {
        $lookup: {
          from: "paymentschedules",
          localField: "paymentScheduleId",
          foreignField: "_id",
          as: "paymentSchedule",
        },
      },
      {
        $lookup: {
          from: "concessionplans",
          localField: "concessionPlanId",
          foreignField: "_id",
          as: "concessionPlan",
        },
      },
      {
        $lookup: {
          from: "latefees",
          localField: "lateFeePlanId",
          foreignField: "_id",
          as: "lateFee",
        },
      },
      {
        $lookup: {
          from: "installments",
          localField: "installmentPlanId",
          foreignField: "_id",
          as: "installment",
        },
      },
      {
        $lookup: {
          from: "feetypes",
          localField: "feeTypeId",
          foreignField: "_id",
          as: "feeType",
        },
      },
      {
        $lookup: {
          from: "institutedetails",
          localField: "createdBy",
          foreignField: "_id",
          as: "instituteDetails",
        },
      },
      {
        $lookup: {
          from: "campuses",
          localField: "programPlan.campusId",
          foreignField: "_id",
          as: "campuseDetails",
        },
      },
      {
        $addFields: {
          programPlanDetails: "$programPlan",
          reminderPlanDetails: "$reminderPlan",
          paymentScheduleDetails: "$paymentSchedule",
          concessionPlanDetais: "$concessionPlan",
          feeTypeDet: "$feeType",
          lateFeePlanDetails: "$lateFee",
          installmentPlanDetails: "$installment",
          createdBy: "$instituteDetails",
        },
      },
      {
        $project: {
          // projection
          programPlan: {
            $arrayElemAt: ["$programPlanDetails", 0],
          },
          reminderPlan: {
            $arrayElemAt: ["$reminderPlanDetails", 0],
          },
          paymentSchedule: {
            $arrayElemAt: ["$paymentScheduleDetails", 0],
          },
          concessionPlan: {
            $arrayElemAt: ["$concessionPlanDetais", 0],
          },
          lateFeePlan: {
            $arrayElemAt: ["$lateFeePlanDetails", 0],
          },
          installmentPlan: {
            $arrayElemAt: ["$installmentPlanDetails", 0],
          },
          feeType: {
            $arrayElemAt: ["$feeTypeDet", 0],
          },
          displayName: 1,
          title: 1,
          description: 1,
          feeDetails: 1,
          campusIdName: {
            $arrayElemAt: ["$campuseDetails.campusId", 0],
          },
          createdBy: {
            $arrayElemAt: ["$createdBy.instituteContact[0].contactname", 0],
          },
          createdAt: 1,
        },
      },
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
                        { $ceil: { $divide: ["$total", itemsPerPage] } },
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
    ];
  } else {
    let createdUser = campusId;
    aggregateData = [
      // { $unwind: "$reminderPlan" },
      // { $unwind: "$programPlan" },
      // { $unwind: "$paymentSchedule" },
      // { $unwind: "$concessionPlan" },
      // { $unwind: "$lateFee" },
      // { $unwind: "$installment" },
      {
        $match: { campusId: createdUser },
      },
      {
        $lookup: {
          from: "reminderplans",
          localField: "reminderPlanId",
          foreignField: "_id",
          as: "reminderPlan",
        },
      },
      {
        $lookup: {
          from: "programplans",
          localField: "programPlanId",
          foreignField: "_id",
          as: "programPlan",
        },
      },
      {
        $lookup: {
          from: "paymentschedules",
          localField: "paymentScheduleId",
          foreignField: "_id",
          as: "paymentSchedule",
        },
      },
      {
        $lookup: {
          from: "concessionplans",
          localField: "concessionPlanId",
          foreignField: "_id",
          as: "concessionPlan",
        },
      },
      {
        $lookup: {
          from: "latefees",
          localField: "lateFeePlanId",
          foreignField: "_id",
          as: "lateFee",
        },
      },
      {
        $lookup: {
          from: "installments",
          localField: "installmentPlanId",
          foreignField: "_id",
          as: "installment",
        },
      },
      {
        $lookup: {
          from: "feetypes",
          localField: "feeTypeId",
          foreignField: "_id",
          as: "feeType",
        },
      },
      {
        $lookup: {
          from: "institutedetails",
          localField: "createdBy",
          foreignField: "_id",
          as: "instituteDetails",
        },
      },
      {
        $lookup: {
          from: "campuses",
          localField: "programPlan.campusId",
          foreignField: "_id",
          as: "campuseDetails",
        },
      },
      {
        $addFields: {
          programPlanDetails: "$programPlan",
          reminderPlanDetails: "$reminderPlan",
          paymentScheduleDetails: "$paymentSchedule",
          concessionPlanDetais: "$concessionPlan",
          feeTypeDet: "$feeType",
          lateFeePlanDetails: "$lateFee",
          installmentPlanDetails: "$installment",
          createdBy: "$instituteDetails",
        },
      },
      {
        $project: {
          // projection
          programPlan: {
            $arrayElemAt: ["$programPlanDetails", 0],
          },
          reminderPlan: {
            $arrayElemAt: ["$reminderPlanDetails", 0],
          },
          paymentSchedule: {
            $arrayElemAt: ["$paymentScheduleDetails", 0],
          },
          concessionPlan: {
            $arrayElemAt: ["$concessionPlanDetais", 0],
          },
          lateFeePlan: {
            $arrayElemAt: ["$lateFeePlanDetails", 0],
          },
          installmentPlan: {
            $arrayElemAt: ["$installmentPlanDetails", 0],
          },
          feeType: {
            $arrayElemAt: ["$feeTypeDet", 0],
          },
          displayName: 1,
          title: 1,
          description: 1,
          feeDetails: 1,
          campusIdName: {
            $arrayElemAt: ["$campuseDetails.campusId", 0],
          },
          createdBy: {
            $arrayElemAt: ["$createdBy.instituteContact[0].contactname", 0],
          },
          createdAt: 1,
        },
      },
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
                        { $ceil: { $divide: ["$total", itemsPerPage] } },
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
    ];
  }
  let feesManagerModel = dbConnection.model(
    "feemanagers",
    FeeManagerSchema,
    "feemanagers"
  );
  const fmData = await feesManagerModel.aggregate(aggregateData);

  return fmData;
}

async function dueDateCalculation(req, res) {
  // const { collectEvery, dueDate, group } = req.query;
  // const authHeader = req.headers.authorization;
  // const settingsPayload = {
  //   headers:{
  //     'Authorization': authHeader
  //   }
  // }
  // const instituteSettings = await axios.get(`${process.env.apiUri}/${group}/setup/settings?instituteid=5fe0667d8c36be3698b32ca4`,settingsPayload);
  // res.send({
  //   token: authHeader,
  //   resource: req.headers.resource,
  //   instituteSettings: instituteSettings.data
  // })
  var dbUrl = req.headers.resource;
  if (process.env.stage == "local") {
    dbUrl = "mongodb+srv://admin:R6BbEn8UUJjoeDQq@mongo-cluster.orkv6.mongodb.net"
  }
  let centralDbConnection;
  let dbConnection
  try {
    centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({
      _id: mongoose.Types.ObjectId(req.query.orgId),
    });
    dbConnection = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
    let dates = { "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "sixth": 6, "last": 30, "second last": 29, "third last": 28, "twenty four": 24, "twenty five": 25, "fifth last": 26 }
    let collectionperiods = { "year": 1, "half year": 2, "4 months": 3, "quarter": 4, "two months": 6, "month": 12, "one time date": 1, "one time date range": 1 }
    let collecteveryp = { "year": 12, "yearly": 12, "half year": 6, "half yearly": 6, "4 months": 3, "quarterly": 3, "quarter": 3, "two months": 2, "monthly": 1, "month": 1, "one time date": 1, "one time date range": 1, "quarterly": 4, "one time range": 1 }
    const monthNames = { "january": "01", "february": "02", "march": "03", "april": "04", "may": "05", "june": "06", "july": "07", "august": "08", "september": "09", "october": "10", "november": "11", "december": "12" };
    const queryData = req.query == undefined ? undefined : req.query;
    let dbName = queryData.orgId;
    const { collectEvery, dueDate, startMonth, startDate, lateFeeDate } = req.query;
    // let dbConnection = await createDatabase(dbName, dbUrl);
    // let arrFeesBreakup = inputData.feesBreakup;
    const standardschema = mongoose.Schema({}, { strict: false });
    let paymentScheduleModel = dbConnection.model("paymentSchedule", PaymentScheduleSchema);
    let programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
    let curedate = new Date()
    let cureyear = curedate.getFullYear()
    let startdate = new Date(`${cureyear}/${monthNames[startMonth.toLowerCase()]}/${Number(dates[startDate.toLowerCase()])}`);
    let duedate = new Date(`${cureyear}/${monthNames[startMonth.toLowerCase()]}/${Number(dates[dueDate.toLowerCase()])}`);
    let latefeedate = new Date(`${cureyear}/${monthNames[startMonth.toLowerCase()]}/${Number(lateFeeDate)}`);
    console.log("dateterm1", startdate, duedate, latefeedate)
    if (req.query.endMonth && req.query.endMonth !== "" && req.query.endMonth !== "-") {
      duedate = new Date(`${cureyear}/${monthNames[req.query.endMonth.toLowerCase()]}/${Number(dates[dueDate.toLowerCase()])}`);
      latefeedate = new Date(`${cureyear}/${monthNames[req.query.endMonth.toLowerCase()]}/${Number(lateFeeDate)}`);

    }
    let paymentscheduleData = await paymentScheduleModel.findOne({});
    let labels = { "year": ["Term 1"], "half year": ["Term 1", "Term 2"], "4 months": ["Term 1 (Quarter 1)", "Term 1 (Quarter 2)", "Term 2 (Quarter 3)"], "quarter": ["Term 1 (Quarter 1)", "Term 1 (Quarter 2)", "Term 2 (Quarter 3)", "Term 2 (Quarter 4)"], "two months": ["Months 1, 2", "Months 3, 4", "Months 5, 6", "Months 7, 8", "Months 9, 10", "Months 11, 12"], "month": ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6", "Month 7", "Month 8", "Month 9", "Month 10", "Month 11", "Month 12"], "one time date": ["Term 1"], "one time date range": ["Term 1"] }
    console.log()
    var monthRange = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    var currentMonth = new Date("2020-06-01");
    var monthIndex =
      Number(
        monthRange[
        currentMonth.getMonth() >= 5
          ? Number(currentMonth.getMonth()) - Number(5)
          : Number(currentMonth.getMonth()) + Number(7)
        ]
      ) - 1;
    let dating = [];
    var quarterIndex = monthIndex / 4;
    var yearIndex = monthIndex / 12;
    var halfIndex = monthIndex / 2;
    var collectEveryRatio =
      collectEvery.toLowerCase() == "month"
        ? monthIndex
        : collectEvery.toLowerCase() == "half year"
          ? 2
          : collectEvery.toLowerCase() == "quarter"
            ? 4
            : 1;
    var typeOfDueDate =
      dueDate.toLowerCase() == "first"
        ? 1
        : dueDate.toLowerCase() == "second"
          ? 2
          : dueDate.toLowerCase() == "third"
            ? 3
            : dueDate.toLowerCase() == "fourth"
              ? 4
              : 5;
    collectEveryRatio = Number(collectionperiods[collectEvery.toLowerCase()]);
    var adjAmt = 0;
    console.log("monthindex", monthIndex)
    let stdate
    let dddate
    let pendate
    _.times(collectEveryRatio, function (value) {
      let re = value + 1;
      var mainDate =
        collectEvery.toLowerCase() == "month"
          ? new moment().add(value + 1, "months").date(typeOfDueDate)
          : collectEvery.toLowerCase() == "half year"
            ? new moment().add(re * halfIndex, "months").date(typeOfDueDate)
            : collectEvery.toLowerCase() == "quarter"
              ? new moment().add(re * quarterIndex, "months").date(typeOfDueDate)
              : new moment("2020-06-01").add(yearIndex, "year").date(typeOfDueDate);
      var obj
      if (value == 0) {
        let startdate1 = startDate ? new Date(startdate) : ""
        let duedate1 = dueDate ? new Date(duedate) : ""
        let latefeedate1 = lateFeeDate ? new Date(latefeedate) : ""
        obj = {
          dueDate: mainDate,
          id: dueDate,
          label: `${labels[collectEvery.toLowerCase()][value]}`,
          percentage: Number((100 / collectEveryRatio).toFixed(2)),
          dueDate: duedate1,
          startDate: startdate1,
          endDate: duedate1,
          lateFeeStartDate: latefeedate1
        };
      } else {
        stdate = startdate
        dddate = duedate
        pendate = latefeedate
        let startdate1 = startDate ? new Date(stdate.setMonth(Number(stdate.getMonth()) + Number(collecteveryp[collectEvery.toLowerCase()]))) : "";
        let duedate1 = dueDate ? new Date(dddate.setMonth(Number(dddate.getMonth()) + Number(collecteveryp[collectEvery.toLowerCase()]))) : "";
        let latefeedate1 = lateFeeDate ? new Date(pendate.setMonth(Number(pendate.getMonth()) + Number(collecteveryp[collectEvery.toLowerCase()]))) : "";
        obj = {
          dueDate: mainDate,
          id: dueDate,
          label: `${labels[collectEvery.toLowerCase()][value]}`,
          percentage: Number((100 / collectEveryRatio).toFixed(2)),
          dueDate: duedate1,
          startDate: startdate1,
          endDate: duedate1,
          lateFeeStartDate: latefeedate1
        };
      }
      adjAmt = Number((100 / collectEveryRatio).toFixed(2)) + Number(adjAmt);
      dating.push(obj);
    });
    dating["0"]["percentage"] = Number(
      (Number(dating["0"]["percentage"]) + Number(100 - adjAmt)).toFixed(2)
    );
    res.status(200).json({ data: dating, status: "success" });
    centralDbConnection.close() // new
    dbConnection.close() // new
  } catch (err) {
    res.json({
      status: "failure",
      message: "due date calculation: " + err.stack,
    });
    centralDbConnection.close() // new
    dbConnection.close() // new
  }
  finally {
    centralDbConnection.close();
    dbConnection.close()
  }
}

async function installmentDueDateCalculation(req, res) {
  let { noOfInst, frequency, dueDate } = req.query;
  let dating = [];
  var installmentRadtio = Number((100 / Number(noOfInst)).toFixed(2));
  var typeOfDueDate =
    dueDate.toLowerCase() == "first"
      ? 1
      : dueDate.toLowerCase() == "second"
      ? 2
      : dueDate.toLowerCase() == "third"
      ? 3
      : 4;
  var startDate =
    frequency.toLowerCase() == "fortnight"
      ? moment()
          .day(7 + typeOfDueDate)
          .add(7, "days")
      : moment().day(7 + typeOfDueDate);
  var defaultDays = frequency.toLowerCase() == "fortnight" ? 14 : 7;
  var adjAmt = 0;
  if (
    frequency.toLowerCase() == "week" ||
    frequency.toLowerCase() == "fortnight"
  ) {
    _.times(noOfInst, function (value) {
      let re = value + 1;
      var mainDate = new moment(new Date(startDate)).add(
        value * defaultDays,
        "days"
      );
      var obj = {
        dueDate: mainDate,
        id: dueDate,
        percentage: installmentRadtio,
      };

      adjAmt = Number(installmentRadtio) + Number(adjAmt);
      dating.push(obj);
    });
  } else if (frequency.toLowerCase() == "month") {
    _.times(noOfInst, function (value) {
      let re = value + 1;
      var mainDate = new moment().add(value + 1, "months").date(typeOfDueDate);
      var obj = {
        dueDate: mainDate,
        id: dueDate,
        percentage: installmentRadtio,
      };

      adjAmt = Number(installmentRadtio) + Number(adjAmt);
      dating.push(obj);
    });
  }

  dating["0"]["percentage"] = Number(
    (Number(dating["0"]["percentage"]) + Number(100 - adjAmt)).toFixed(2)
  );
  res.status(200).json({ data: dating, status: "success" });
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
async function onDateFormat(d) {
  let dateField = new Date(String(d));
  let month = dateField.getMonth() + 1;
  month = String(month).length == 1 ? `0${String(month)}` : String(month);
  let date = dateField.getDate();
  date = String(date).length == 1 ? `0${String(date)}` : String(date);
  let year = dateField.getFullYear();
  return `${date}/${month}/${year}`;
}

async function StudentsMasterSearch( //Students Master - Search
  dbConnection,
  itemsPerPage,
  currentPage,
  searchKey
) {
  const studentModel = dbConnection.model(
    "students",
    StudentSchema,
    "students"
  );

  if (itemsPerPage == undefined && currentPage == undefined) {
    const aggregateData = [{ $sort: { _id: -1 } }];
    const getData = await studentModel.findOne({});
    let objkeys = Object.keys(getData._doc);
    let searchData = [];
    let queryOptions;
    queryOptions = { $regex: searchKey };
    console.log("queryOptions", queryOptions);
    for (let i = 0; i < objkeys.length; i++) {
      let getd = await studentModel.find({
        $where: `function() { if(this.${[objkeys[i]]}!==undefined && this.${[
          objkeys[i],
        ]}!==null ){ return this.${[
          objkeys[i],
        ]}.toString().toLowerCase().match(/${searchKey.toLowerCase()}/) != null}}`,
      });
      // console.log("getd", getd)
      searchData = searchData.concat(getd);
    }
    // console.log("searchData", searchData);

    return (responseReturn = {
      status: "success",
      message: `data`,
      data: searchData,
      currentPage: null,
      perPage: null,
      nextPage: null,
      totalRecord: null,
      totalPages: null,
    });
  } else {
    const aggregateData = [
      { $unwind: "$guardianDetails" },
      {
        $lookup: {
          from: "guardians",
          localField: "guardianDetails",
          foreignField: "_id",
          as: "guardianDetails",
        },
      },
      {
        $lookup: {
          from: "programplans",
          localField: "programPlanId",
          foreignField: "_id",
          as: "programPlan",
        },
      },
    ];
    let findKeys = String(searchKey).toLowerCase();
    const studentData = await studentModel.aggregate(aggregateData);
    let searchData = [];
    studentData.map((item) => {
      if (
        String(item.parentName).toLowerCase().includes(findKeys) ||
        String(item.email).toLowerCase().includes(findKeys) ||
        String(item.firstName).toLowerCase().includes(findKeys) ||
        String(item.lastName).toLowerCase().includes(findKeys) ||
        String(item.regId).toLowerCase().includes(findKeys) ||
        String(item.displayName).toLowerCase().includes(findKeys) ||
        String(item.dob).toLowerCase().includes(findKeys) ||
        String(item.phoneNo).toLowerCase().includes(findKeys) ||
        // String(item.addressDetails.address1).toLowerCase().includes(findKeys) ||
        String(item.citizenship).toLowerCase().includes(findKeys) ||
        String(item.programPlan[0].academicYear)
          .toLowerCase()
          .includes(findKeys) ||
        String(item.programPlan[0].description)
          .toLowerCase()
          .includes(findKeys) ||
        String(item.programPlan[0].displayName).toLowerCase().includes(findKeys)
      ) {
        searchData.push(item);
      }
    });
    let paginated = await Paginator(searchData, currentPage, itemsPerPage);
    return (responseReturn = {
      status: "success",
      message: `data`,
      data: paginated["data"],
      currentPage: paginated.page,
      perPage: paginated.perPage,
      nextPage: paginated.next_page,
      totalRecord: paginated.total,
      totalPages: paginated.total_pages,
    });
  }
}

async function ProgramPlanMasterSearch( //Program Plan Master - Search
  dbConnection,
  itemsPerPage,
  currentPage,
  searchKey
) {
  const programPlanModel = dbConnection.model(
    "programplans",
    ProgramPlanSchema,
    "programplans"
  );
  if (itemsPerPage == undefined && currentPage == undefined) {
    const aggregateData = [{ $sort: { _id: -1 } }];
    const getData = await programPlanModel.findOne({});
    let objkeys = Object.keys(getData._doc);
    let searchData = [];
    let queryOptions;
    queryOptions = { $regex: searchKey };
    console.log("queryOptions", queryOptions);
    for (let i = 0; i < objkeys.length; i++) {
      let getd = await programPlanModel.find({
        $where: `function() { if(this.${[objkeys[i]]}!==undefined && this.${[
          objkeys[i],
        ]}!==null ){ return this.${[
          objkeys[i],
        ]}.toString().toLowerCase().match(/${searchKey.toLowerCase()}/) != null}}`,
      });
      // console.log("getd", getd)
      console.log(searchData);
      searchData = searchData.concat(getd);
    }
    // console.log("searchData", searchData);

    return (responseReturn = {
      status: "success",
      message: `data`,
      data: searchData,
      currentPage: null,
      perPage: null,
      nextPage: null,
      totalRecord: null,
      totalPages: null,
    });
  } else {
    const getData = await programPlanModel.findOne({});
    let objkeys = Object.keys(getData._doc);
    let searchData = [];
    let queryOptions;
    queryOptions = { $regex: searchKey };
    console.log("queryOptions", objkeys);
    for (let i = 0; i < objkeys.length; i++) {
      let getd = await programPlanModel.find({
        $where: `function() { if(this.${[objkeys[i]]}!==undefined && this.${[
          objkeys[i],
        ]}!==null ){ return this.${[
          objkeys[i],
        ]}.toString().toLowerCase().match(/${searchKey.toLowerCase()}/) != null}}`,
      });
      // console.log("getd",getd)
      searchData = searchData.concat(getd);
    }
    // console.log("searchData", searchData);
    console.log(searchData);
    let paginated = await Paginator(searchData, currentPage, itemsPerPage);
    console.log("*********paginated****** ", paginated);
    return (responseReturn = {
      status: "success",
      message: `data`,
      data: paginated["data"],
      currentPage: paginated.page,
      perPage: paginated.perPage,
      nextPage: paginated.next_page,
      totalRecord: paginated.total,
      totalPages: paginated.total_pages,
    });
  }
}

module.exports = {
  createMaster: createMaster,
  getMaster: getMaster,
  updateMaster: updateMaster,
  getDisplayId: getDisplayId,
  dueDateCalculation: dueDateCalculation,
  installmentDueDateCalculation: installmentDueDateCalculation,
};

/*
Program Plan - PRGPLN
Payment Schedule - PSCH
Installment - INST
Late fee - LTFEE
Reminder - REM
*/
