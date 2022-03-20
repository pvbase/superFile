const masterUploadSchema = require("../models/masterUploadModel");
const { createDatabase } = require("../utils/db_creation");
const {
  processTransaction,
} = require("./transactions/transactionTestController");
var _ = require("lodash");
const moment = require("moment");
const FeeTypeSchema = require("../models/feeTypeModel");
const StudentSchema = require("../models/studentModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const CategorySchema = require("../models/categoryModel");
const LateFeesSchema = require("../models/lateFeeModel");
const ConcessionSchema = require("../models/concessionModel");
const InstallmentSchema = require("../models/installmentModel");
const FeeManagerSchema = require("../models/feesManagerModel");
const FeeStructureSchema = require("../models/feeStructureModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
const GuardianSchema = require("../models/guardianModel");
const paymentScheduleSchema = require("../models/paymentScheduleModel");
const ReminderScheduleSchema = require("../models/reminderModel");
const PubNub = require("pubnub");
const categorySchema = require("../models/categoryModel");
const concessionSchema = require("../models/concessionModel");
var pubnub = new PubNub({
  subscribeKey: "sub-c-982dbaba-1d98-11ea-8c76-2e065dbe5941",
  publishKey: "pub-c-87ae3cc8-8d0a-40e0-8e0f-dbb286306b21",
  secretKey: "sec-c-ODRhYWJjZmYtZGQ0MS00ZjY2LTkzMGMtY2VhNGZhYjYzOWRi",
  ssl: false,
});

exports.init = async function (req, res) {
  var dbUrl = req.headers.resource;
  console.log("url", dbUrl);
  let inputData = req.body;
  let dbName = inputData.orgId;
  let dbConnection = await createDatabase(dbName, dbUrl);
  let masterUpladModel = dbConnection.model(
    "masteruploads",
    masterUploadSchema
  );
  let programPlanSchema = dbConnection.model("programplans", ProgramPlanSchema);
  let feeStructureSchema = dbConnection.model(
    "feestructures",
    FeeStructureSchema
  );

  let paymentScheduleModel = dbConnection.model(
    "paymentschedules",
    paymentScheduleSchema
  );
  let reminderModel = dbConnection.model("reminders", ReminderScheduleSchema);

  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  masterUpladModel.find({}, async function (err, doc) {
    if (doc) {
      console.log("masterdata", doc);
      let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
      //   return res.status(200).json({ status: "success", data: doc });
      let pubnubConfig = {
        channel: inputData.orgId.toString(),
        message: {
          description: { message: "Setup Initiated", data: {} },
          status: 0,
        },
      };
      let feeType = doc[0]["data"]["feeTypes"];
      let feeStructure = doc[0]["data"]["feeStructures"];
      let paymentSchedule = doc[0]["data"]["feeStructures"];
      let programPlanDatas = doc[0]["data"]["programPlans"];
      let feeManagerDatas = doc[0]["data"]["feeManagers"];
      let studentDetails = doc[0]["data"]["studentDetails"];
      //   let displayId = await getDisplayId("feeTypes", dbName, dbUrl);

      var feeTypeDetails = await Promise.all(
        _.map(feeType, async function (x, j) {
          var newFeeTypes = {
            displayName: `FT_${
              String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
              }${Number(j) + 1}`,
            title: x["Fee Type *"],
            description: x["Description"],
            refId: x["Fee Id *"],
            unit: 1,
            frequency: 1,
            createdBy: dbName,
          };
          return newFeeTypes;
        })
      );
      feeTypeModel.insertMany(feeTypeDetails, async function (error, docs) {
        if (error) {
          if (error.name === "BulkWriteError" && error.code === 11000) {
            // Duplicate username
            return res.status(200).json({
              success: true,
              message: "Fee Types already exist!",
              count: 0,
            });
          }
          return res.status(400).json({
            message: "Database Error",
            type: "error",
            data: error,
          });
        } else {
          //    let feeStructure = await createFeeStructure(docs,feeStructure)
          pubnubConfig.message.description = {
            message: `Fee Type has been added successfully.`,
          };
          await pubnub.publish(pubnubConfig);

          //Program Plan Added
          var allProgramPlan = [];
          for (let j = 0; j < programPlanDatas.length; j++) {
            var ppInputData = programPlanDatas[j];
            var ppData = {
              displayName: `PP_${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              programCode: ppInputData["Program code *"],
              title: ppInputData["Program Name *"],
              academicYear: ppInputData["academicYear"],
              description: ppInputData["Description "],
              createdBy: inputData.orgId,
              status: ppInputData["Status"],
            };
            allProgramPlan.push(ppData);
          }
          console.log("allProgramPlan", allProgramPlan);
          if (allProgramPlan.length > 0) {
            await programPlanSchema.insertMany(allProgramPlan);
            pubnubConfig.message.description = {
              message: `Program Plan has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }

          // Fee Manager added
          var allFeeManager = [];
          for (let j = 0; j < feeManagerDatas.length; j++) {
            var pfmInputData = feeManagerDatas[j];
            var ppDetails = await programPlanSchema.findOne({
              programCode: pfmInputData["Program Plan Id *"]["0"],
            });
            var feeTypesDetails = await feeTypeModel.findOne({
              refId: pfmInputData["Fee Type Id *"]["0"],
            });
            if (ppDetails != null && feeTypesDetails != null) {
              var pfmData = {
                id: pfmInputData["id *"],
                displayName: `FEES_${
                  String(j).length == 1
                    ? "00"
                    : String(j).length == 2
                      ? "0"
                      : ""
                  }${Number(j) + 1}_${pfmInputData["Program Plan Id *"]["0"]}`,
                title: pfmInputData["Title *"],
                description: pfmInputData["Description"],
                feeTypeId: feeTypesDetails._id,
                programPlanId: ppDetails._id,
                feeDetails: {
                  units: null,
                  perUnitAmount: null,
                  annualAmount: pfmInputData["Total Fees *"],
                },
                createdBy: inputData.orgId,
              };
              allFeeManager.push(pfmData);
            }
          }
          console.log("allFeeManager", allFeeManager);
          if (allFeeManager.length > 0) {
            await feeManagerSchema.insertMany(allFeeManager);
            pubnubConfig.message.description = {
              message: `Program Plan has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }
          var feeStructureDetails = await Promise.all(
            _.map(feeStructure, async function (x, j) {
              let feety = x["Fee Manager *"];
              var feeTypeId = await Promise.all(
                _.map(feety, async function (x) {
                  let check = await feeManagerSchema.findOne({ id: x });
                  let mainId = check._id;
                  return mainId;
                })
              );
              var newFesStructure = {
                displayName: `FS_${
                  String(j).length == 1
                    ? "00"
                    : String(j).length == 2
                      ? "0"
                      : ""
                  }${Number(j) + 1}`,
                title: x["Title *"],
                refId: x["id"],
                description: x["Description"],
                feeManagerId: feeTypeId,
                createdBy: dbName,
              };
              return newFesStructure;
            })
          );
          let feeStructureModel = dbConnection.model(
            "feeStructure",
            FeeStructureSchema
          );
          feeStructureModel.insertMany(
            feeStructureDetails,
            async function (error, docs) {
              if (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(200).json({
                    success: true,
                    message: "Fee Structure already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error,
                });
              } else {
                pubnubConfig.message.description = {
                  message: `Fee Structure has been added successfully.`,
                };
                await pubnub.publish(pubnubConfig);

                //Student Details
                var allStudentData = [];
                let studentModel = dbConnection.model(
                  "students",
                  StudentSchema
                );
                let guardianSchema = dbConnection.model(
                  "guardian",
                  GuardianSchema
                );
                for (let j = 0; j < studentDetails.length; j++) {
                  var studentInputData = studentDetails[j];
                  var feeManagerDetails = {};
                  var fmIdDet = {};
                  if (studentInputData["feeStructure"] != undefined) {
                    for (
                      let k = 0;
                      k < studentInputData["feeStructure"].length;
                      k++
                    ) {
                      console.log(
                        "fee manager",
                        studentInputData["feeStructure"][k]
                      );
                      var feeMngtDetails = await feeStructureModel.findOne({
                        refId: studentInputData["feeStructure"][k],
                      });
                      console.log("feeMngtDetails", feeMngtDetails);
                      fmIdDet = await feeManagerSchema.findOne({
                        _id: feeMngtDetails["feeManagerId"]["0"],
                      });
                      feeManagerDetails = feeMngtDetails._id;
                    }
                  }
                  var guardianDetails = {
                    isPrimary: true,
                    firstName: studentInputData["Parent Name"],
                    lastName: studentInputData["Parent Name"],
                    mobile: studentInputData["Phone Number"],
                    email: studentInputData["Parent Email Address"],
                    relation: "Parent",
                    createdBy: dbName,
                  };
                  const guardianData = new guardianSchema(guardianDetails);
                  var guardianResponse = await guardianData.save();
                  console.log("guardianResponse", guardianResponse);

                  var studentData = {
                    displayName: `STUD_${
                      String(j).length == 1
                        ? "00"
                        : String(j).length == 2
                          ? "0"
                          : ""
                      }${Number(j) + 1}`,
                    regId: studentInputData["Reg No *"],
                    salutation:
                      studentInputData["salutation"] == undefined
                        ? null
                        : studentInputData["salutation"], // salutation
                    category: studentInputData["Category"], // Category
                    firstName: studentInputData["First Name *"], //First Name *
                    middleName:
                      studentInputData["Middle Name *"] == undefined
                        ? null
                        : studentInputData["Middle Name *"], //
                    lastName: studentInputData["Last Name *"], //Last Name *
                    guardianDetails: [guardianResponse._id],
                    gender: studentInputData["Gender"],
                    dob: studentInputData["DOB"],
                    admittedOn: studentInputData["Admitted Date *"],
                    programPlanId: fmIdDet.programPlanId,
                    feeStructureId: feeManagerDetails,
                    phoneNo: studentInputData["Phone Number *"],
                    email: studentInputData["Email Address *"],
                    alternateEmail: null,
                    createdBy: inputData.orgId,
                    addressDetails: {
                      address1: studentInputData["Address 1"],
                      address2: studentInputData["Address 2"],
                      address3: studentInputData["Address 3"],
                      city: studentInputData["City/Town"],
                      state: null,
                      country: studentInputData["Country"],
                      pincode: studentInputData["PIN Code"],
                    },
                  };
                  allStudentData.push(studentData);
                }
                console.log("allStudentData", allStudentData);
                if (allStudentData.length > 0) {
                  await studentModel.insertMany(allStudentData);
                  pubnubConfig.message.description = {
                    message: `Student has been added successfully.`,
                  };
                  await pubnub.publish(pubnubConfig);
                }
                var feeMapDetails = await Promise.all(
                  _.map(studentDetails, async function (x, j) {
                    let studentModel = dbConnection.model(
                      "students",
                      StudentSchema
                    );
                    let check = await studentModel.findOne({
                      regId: x["Reg No *"],
                    });
                    let studentId = check._id;
                    console.log("***X***", x);
                    let feesManager = x.feeStructure;
                    console.log("***feesManager***", feesManager);

                    var feeManagerId = await Promise.all(
                      _.map(feesManager, async function (y) {
                        console.log("***y***", y);
                        let check = await feeStructureModel.findOne({
                          refId: y,
                        });
                        console.log("***check***", check);
                        let mainId = check._id;
                        return mainId;
                      })
                    );
                    console.log("feeManagerId", feeManagerId);

                    let mainDate = new moment().add(1, "year").date(1);
                    var dating = [
                      {
                        dueDate: mainDate,
                        id: 3,
                        percentage: 100,
                      },
                    ];

                    var newFeeMap = {
                      displayName: `SFM_${
                        String(j).length == 1
                          ? "00"
                          : String(j).length == 2
                            ? "0"
                            : ""
                        }${Number(j) + 1}`,
                      studentId: studentId,
                      feeStructureId: {
                        id: feeManagerId,
                        paymentSchedule: dating,
                      },
                      createdBy: dbName,
                    };
                    return newFeeMap;
                  })
                );
                console.log("feeMapDetails", feeMapDetails);


                feeMapModel.insertMany(
                  feeMapDetails,
                  async function (error, docs) {
                    if (error) {
                      if (
                        error.name === "BulkWriteError" &&
                        error.code === 11000
                      ) {
                        // Duplicate username
                        return res.status(200).json({
                          success: true,
                          message: "Fee Student Map already exist!",
                          count: 0,
                        });
                      }
                      return res.status(400).json({
                        message: "Database Error",
                        type: "error",
                        data: error,
                      });
                    } else {
                      pubnubConfig.message.description = {
                        message: `Student Fee Map has been added successfully.`,
                      };
                      pubnubConfig.message.description = {
                        message: `Setup has been added successfully.`,
                      };
                      await pubnub.publish(pubnubConfig);
                      var newPaymentScheduleDetails = new paymentScheduleModel({
                        displayName: "PS_001",
                        title: "Year",
                        description: "Every year",
                        scheduleDetails: {
                          collectEvery: "year",
                          dueDate: "first",
                        },
                        feesBreakUp: [
                          {
                            dueDate: "first date",
                            percentage: 100,
                          },
                        ],
                        createdBy: dbName,
                      });
                      newPaymentScheduleDetails.save(function (err, data) {
                        if (err) {
                          return res.status(400).json({
                            message: "Database error",
                            type: "error",
                            data: err,
                          });
                        } else {
                          var newReminderDetails = new reminderModel({
                            displayName: "RP_001",
                            title: "Default",
                            description: "Default Reminder",
                            numberOfReminders: 5,
                            scheduleDetails: [
                              {
                                days: 5,
                              },
                              {
                                days: 5,
                              },
                              {
                                days: 5,
                              },
                              {
                                days: 5,
                              },
                              {
                                days: 5,
                              },
                            ],
                            createdBy: dbName,
                          });
                          newReminderDetails.save(function (err, data) {
                            if (err) {
                              return res.status(400).json({
                                message: "Database error",
                                type: "error",
                                data: err,
                              });
                            } else {
                              return res.status(201).json({
                                message: "New Setup added",
                                type: "success",
                              });
                            }
                          });
                        }
                      });
                    }
                  }
                );
              }
            }
          );
        }
      });
    } else {
      return res.status(400).json({
        status: "failure",
        message: "Upload file does not exist",
        Error: err,
      });
    }
  });
};

exports.initCheck = async function (req, res) {
  var dbUrl = req.headers.resource;
  let inputData = req.body;
  let dbName = inputData.orgId;
  let dbConnection = await createDatabase(dbName, dbUrl);
  let masterUpladModel = dbConnection.model(
    "masteruploads",
    masterUploadSchema
  );
  let programPlanSchema = dbConnection.model("programplans", ProgramPlanSchema);
  let feeStructureModel = dbConnection.model(
    "feestructures",
    FeeStructureSchema
  );
  let paymentScheduleModel = dbConnection.model(
    "paymentschedules",
    paymentScheduleSchema
  );

  let reminderModel = dbConnection.model(
    "reminderplans",
    ReminderScheduleSchema
  );
  let lateFeeModel = dbConnection.model("latefees", LateFeesSchema);
  let installmentModel = dbConnection.model("installments", InstallmentSchema);
  let categoryModel = dbConnection.model("categoryplans", CategorySchema);
  let concessionModel = dbConnection.model("concessionplans", ConcessionSchema);
  let studentModel = dbConnection.model("students", StudentSchema);
  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  let feeMapModel = dbConnection.model(
    "studentFeesMap",
    StudentFeeMapSchema
  );
  masterUpladModel.find({}, async function (err, doc) {
    if (doc) {
      let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
      //   return res.status(200).json({ status: "success", data: doc });
      let pubnubConfig = {
        channel: inputData.orgId.toString(),
        message: {
          description: { message: "Setup Initiated", data: {} },
          status: 0,
        },
      };
      let feeType = doc[0]["data"]["feeTypes"];
      let feeStructure = doc[0]["data"]["feeStructures"];
      let paymentSchedule = doc[0]["data"]["paymentSchedule"];
      let reminderPlan = doc[0]["data"]["reminderPlan"];
      let lateFeePlan = doc[0]["data"]["lateFeePlan"];
      let installmentPlan = doc[0]["data"]["installmentPlan"];
      let categoryPlan = doc[0]["data"]["categoryPlan"];
      let cencessionPlan = doc[0]["data"]["cencessionPlan"];
      let programPlanDatas = doc[0]["data"]["programPlans"];
      let feeManagerDatas = doc[0]["data"]["feeManagers"];
      let studentDetails = doc[0]["data"]["studentDetails"];
      //   let displayId = await getDisplayId("feeTypes", dbName, dbUrl);

      var feeTypeDetails = await Promise.all(
        _.map(feeType, async function (x, j) {
          var newFeeTypes = {
            displayName: `FT${
              String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
              }${Number(j) + 1}`,
            title: x["Fee Type *"],
            description: x["Description"],
            refId: x["Fee Id *"],
            createdBy: inputData.orgId,
          };
          return newFeeTypes;
        })
      );
      feeTypeModel.insertMany(feeTypeDetails, async function (error, docs) {
        if (error) {
          if (error.name === "BulkWriteError" && error.code === 11000) {
            // Duplicate username
            return res.status(200).json({
              success: true,
              message: "Fee Types already exist!",
              count: 0,
            });
          }
          return res.status(400).json({
            message: "Database Error",
            type: "error",
            data: error,
          });
        } else {
          //    let feeStructure = await createFeeStructure(docs,feeStructure)
          pubnubConfig.message.description = {
            message: `Fee Type has been added successfully.`,
          };
          await pubnub.publish(pubnubConfig);

          //Fee Structure Add
          var allFeeStructure = [];
          for (let j = 0; j < feeStructure.length; j++) {
            var ppInputData = feeStructure[j];
            var feeTypeData = [];
            for (
              let ftData = 0;
              ftData < ppInputData["Fee Types *"].length;
              ftData++
            ) {
              var ftDet = await feeTypeModel.findOne({
                refId: ppInputData["Fee Types *"][ftData],
              });
              // console.log("ftDet", ftDet);
              feeTypeData.push(ftDet._id);
            }
            var ppData = {
              displayName: `FS${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              title: ppInputData["Title *"],
              description: ppInputData["Description"],
              feeTypeIds: feeTypeData,
              createdBy: inputData.orgId,
            };
            allFeeStructure.push(ppData);
          }
          if (allFeeStructure.length > 0) {
            await feeStructureModel.insertMany(allFeeStructure);
            pubnubConfig.message.description = {
              message: `fees Structure has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }
          //Program Plan Add
          var allProgramPlan = [];
          for (let j = 0; j < programPlanDatas.length; j++) {
            var ppInputData = programPlanDatas[j];
            var ppData = {
              displayName: `PP${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              programCode: ppInputData["Program code *"],
              title: ppInputData["Program Name *"],
              academicYear: ppInputData["academicYear"],
              description: ppInputData["Description "],
              createdBy: inputData.orgId,
            };
            allProgramPlan.push(ppData);
          }
          if (allProgramPlan.length > 0) {
            await programPlanSchema.insertMany(allProgramPlan);
            pubnubConfig.message.description = {
              message: `Program Plan has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }

          //Payment Schdule Add
          var allPaymentSchedule = [];
          for (let j = 0; j < paymentSchedule.length; j++) {
            var ppInputData = paymentSchedule[j];
            var ppData = {
              displayName: `PS${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              title: ppInputData["Payment Schld Title"],
              payementSchId: ppInputData["Payment Schld Id"],
              description: ppInputData["Description"],
              scheduleDetails: {
                collectEvery: ppInputData["Collection period"],
                dueDate: ppInputData["Due By"],
              },
              feesBreakUp: [
                {
                  percentage: ppInputData["Percentage"],
                },
              ],
              createdBy: inputData.orgId,
            };
            allPaymentSchedule.push(ppData);
          }
          if (allPaymentSchedule.length > 0) {
            await paymentScheduleModel.insertMany(allPaymentSchedule);
            pubnubConfig.message.description = {
              message: `Payment Schdule has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }

          //ReminderPlan Add
          var allReminderPlam = [];
          for (let j = 0; j < reminderPlan.length; j++) {
            var ppInputData = reminderPlan[j];
            var ppData = {
              displayName: `RP${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              reminderPlanId: ppInputData["Reminder id"],
              title: ppInputData["Title"],
              description: ppInputData["description"],
              numberOfReminders: ppInputData["no of reminders"],
              scheduleDetails: [
                {
                  daysBefore: ppInputData["Days before due date"],
                },
                {
                  daysAfter: ppInputData["Days after demand note due date"],
                },
                {
                  daysAfter: ppInputData["Days after 1st reminder"],
                },
                {
                  daysAfter: ppInputData["Days after 2nd Reminde"],
                },
              ],
              createdBy: inputData.orgId,
            };
            allReminderPlam.push(ppData);
          }
          if (allReminderPlam.length > 0) {
            await reminderModel.insertMany(allReminderPlam);
            pubnubConfig.message.description = {
              message: `Reminder Plan has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }
          //LateFee Add
          var allLateFee = [];
          for (let j = 0; j < lateFeePlan.length; j++) {
            var ppInputData = lateFeePlan[j];
            var ppData = {
              displayName: `LF${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              lateFeeId: ppInputData["Late fee id"],
              title: ppInputData["Title"],
              description: ppInputData["Description"],
              type: ppInputData["Type"],
              amount: ppInputData["Charges"],
              every: ppInputData["Freequency"],
              createdBy: inputData.orgId,
            };
            allLateFee.push(ppData);
          }
          if (allLateFee.length > 0) {
            await lateFeeModel.insertMany(allLateFee);
            pubnubConfig.message.description = {
              message: `Late Fee has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }

          //Category Add
          var allCategory = [];
          for (let j = 0; j < categoryPlan.length; j++) {
            var ppInputData = categoryPlan[j];
            var ppData = {
              displayName: `CAT${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              title: ppInputData["Title"],
              description: ppInputData["Description"],
              createdBy: inputData.orgId,
              refId: ppInputData["Category Id"],
            };
            allCategory.push(ppData);
          }
          if (allCategory.length > 0) {
            await categoryModel.insertMany(allCategory);
            pubnubConfig.message.description = {
              message: `Category has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }
          //InstallmentPlan Add
          var allInstallment = [];
          for (let j = 0; j < installmentPlan.length; j++) {
            var ppInputData = installmentPlan[j];
            var ppData = {
              displayName: `IP${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              installmentId: ppInputData["Instalment id"],
              title: ppInputData["Title"],
              description: ppInputData["Description"],
              numberOfInstallments: Number(ppInputData["No of Installments"]),
              frequency: ppInputData["Freequency"],
              dueDate: ppInputData["Due Date"],
              createdBy: inputData.orgId,
              updatedBy: inputData.orgId,
            };
            allInstallment.push(ppData);
          }
          if (allInstallment.length > 0) {
            await installmentModel.insertMany(allInstallment);
            pubnubConfig.message.description = {
              message: `Installment has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }
          //Concession Add
          var allConcession = [];
          for (let j = 0; j < cencessionPlan.length; j++) {
            var ppInputData = cencessionPlan[j];
            let categoryData = await categoryModel.findOne({
              refId: ppInputData["Category Id"],
            });
            var ppData = {
              displayName: `CON${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              concessionId: ppInputData["Concession Id"],
              title: ppInputData["Title"],
              description: ppInputData["Description"],
              categoryId: categoryData._id,
              concessionType: ppInputData["Concession Type"],
              concessionValue: ppInputData["Concession Value"],
              createdBy: inputData.orgId,
            };
            allConcession.push(ppData);
          }
          if (allConcession.length > 0) {
            await concessionModel.insertMany(allConcession);
            pubnubConfig.message.description = {
              message: `Concession Plan has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }

          //student Add
          var allStudents = [];
          for (let j = 0; j < studentDetails.length; j++) {
            var ppInputData = studentDetails[j];
            var guardianDetails = {
              isPrimary: true,
              firstName: ppInputData["Parent Name"],
              lastName: ppInputData["Parent Name"],
              mobile: ppInputData["Parent Phone Number"],
              email: ppInputData["Parent Email Address"],
              relation: "Parent",
              createdBy: inputData.orgId,
            };
            let guardianSchema = dbConnection.model("guardian", GuardianSchema);
            let guardianData = new guardianSchema(guardianDetails);
            var guardianResponse = await guardianData.save();
            // console.log("guardiandetails", guardianResponse);
            let programPlanData = await programPlanSchema.findOne({
              programCode: ppInputData["Program Plan ID"],
            });
            // console.log("prorgamplan", programPlanData);
            let feeStructureData = await feeStructureModel.findOne({
              displayName: ppInputData["feeStructure"],
            });
            // console.log("feeStructure", feeStructureData);
            // let categoryId = await categoryModel.findOne({
            //   programCode: ppInputData["Program Plan ID"],
            // });
            var ppData = {
              displayName: `STU${
                String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                }${Number(j) + 1}`,
              regId: ppInputData["Reg ID *"],
              salutation:
                ppInputData["Salutation"] != undefined
                  ? ppInputData["Salutation"]
                  : null, // salutation
              category: ppInputData["Category"], // Category
              firstName: ppInputData["First Name *"], //First Name *
              middleName: ppInputData["Middle Name"], //
              lastName: ppInputData["Last Name *"], //Last Name *
              guardianDetails: [guardianData._id],
              gender: ppInputData["Gender"], //Gender
              dob: ppInputData["DOB"],
              admittedOn: ppInputData["Admitted Date"], //Admitted Date *
              programPlanId: programPlanData._id,
              feeStructureId: feeStructureData._id,
              phoneNo: ppInputData["Phone Number *"], //Phone Number *
              email: ppInputData["Email Address *"], // Email Address *
              alternateEmail:
                ppInputData["alterEmail"] != undefined
                  ? ppInputData["alterEmail"]
                  : null,
              parentName: ppInputData["Parent Name"],
              parentPhone: ppInputData["Parent Phone Number"],
              parentEmail: ppInputData["Parent Email Address"],
              relation: "parent",
              addressDetails: {
                address1: ppInputData["Address 1"],
                address2: ppInputData["Address 2"],
                address3: ppInputData["Address 3"],
                city: ppInputData["City/Town"],
                state: ppInputData["State"],
                country: ppInputData["Country"], //Country
                pincode: ppInputData["PIN Code"], //PIN Code
              },
              createdBy: inputData.orgId,
            };
            allStudents.push(ppData);
          }
          if (allStudents.length > 0) {
            await studentModel.insertMany(allStudents);
            pubnubConfig.message.description = {
              message: `Students has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }

          // Fee Manager added
          var allFeeManager = [];
          for (let j = 0; j < feeManagerDatas.length; j++) {
            var pfmInputData = feeManagerDatas[j];
            var ppDetails = await programPlanSchema.findOne({
              programCode: pfmInputData["Program Plan Id *"]["0"],
            });
            console.log("ppDetails", ppDetails)
            var feeTypesDetails = await feeTypeModel.findOne({
              refId: pfmInputData["Fee Type Id *"]["0"],
            });
            console.log("feeTypesDetails", feeTypesDetails)
            var concessionPlans = await concessionModel.findOne({
              concessionId: pfmInputData["Concession Id"]
            })
            console.log("concessionPlans", concessionPlans)
            var installmentPlans = await installmentModel.findOne({
              installmentId: pfmInputData["Installment Id"]
            })
            console.log("installmentPlans", installmentPlans)
            var reminderPlans = await reminderModel.findOne({
              reminderPlanId: pfmInputData["Reminder plan id"]
            })
            console.log("reminderPlans", reminderPlans)
            var latefees = await lateFeeModel.findOne({
              lateFeeId: pfmInputData["Late Fee plan id"]
            })
            console.log("latefees", latefees)
            var paymentschedules = await paymentScheduleModel.findOne({
              payementSchId: pfmInputData["Payment Schedule Id"]
            })
            console.log("paymentschedules", paymentschedules)
            if (ppDetails != null && feeTypesDetails != null && concessionPlans != null && installmentPlans != null && reminderPlans != null && latefees != null && paymentschedules != null) {

              var pfmData = {
                id: pfmInputData["id *"],
                displayName: `FM_${
                  String(j).length == 1
                    ? "00"
                    : String(j).length == 2
                      ? "0"
                      : ""
                  }${Number(j) + 1}_${pfmInputData["Program Plan Id *"]["0"]}`,
                title: pfmInputData["Title *"],
                description: pfmInputData["Description"],
                feeTypeId: feeTypesDetails._id,
                programPlanId: ppDetails._id,
                reminderPlanId: reminderPlans._id,
                paymentScheduleId: paymentschedules._id,
                concessionPlanId: concessionPlans._id,
                lateFeePlanId: latefees._id,
                installmentPlanId: installmentPlans._id,
                feeDetails: {
                  units: null,
                  perUnitAmount: null,
                  totalAmount: pfmInputData["Total Fees *"],
                },
                createdBy: inputData.orgId,
              };
              allFeeManager.push(pfmData);
            }
          }
          console.log("allFeeManager", allFeeManager);
          if (allFeeManager.length > 0) {
            await feeManagerSchema.insertMany(allFeeManager);
            pubnubConfig.message.description = {
              message: `Fee Managers added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }

          //Student Fees Map
          var allStudentMap = [];
          for (let j = 0; j < studentDetails.length; j++) {
            var ppInputData = studentDetails[j];
            let feeStructureData = await feeStructureModel.findOne({
              displayName: ppInputData["feeStructure"],
            });
            let studentData = await studentModel.findOne({
              regId: ppInputData["Reg ID *"],
            });

            let programPlanOne = await programPlanSchema.findOne({
              programCode: ppInputData["Program Plan ID"],
            });

            let feeManagerData = await feeManagerSchema.findOne({
              programPlanId: programPlanOne._id,
            });

            // let today = moment().format();
            // let mainDate = new moment().add(today * 3, "months").date(1);
            var d = new Date();
            d.setMonth(d.getMonth() + 3);
            d.setDate(1);
            if (feeManagerData != null) {
              console.log("amount", feeManagerData.feeDetails.totalAmount)
              var ppData = {
                displayName: `SFM${
                  String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
                  }${Number(j) + 1}`,
                studentId: studentData._id,
                programPlanId: programPlanOne._id,
                feeStructureId: feeStructureData._id,
                amount: feeManagerData.feeDetails.totalAmount,
                paid: 0,
                pending: feeManagerData.feeDetails.totalAmount,
                dueDate: d.toISOString(),
                createdBy: inputData.orgId,
              }
              allStudentMap.push(ppData);
            }
          }
          if (allStudentMap.length > 0) {
            await feeMapModel.insertMany(allStudentMap);
            pubnubConfig.message.description = {
              message: `Student Fee Map has been added successfully.`,
            };
            await pubnub.publish(pubnubConfig);
          }

          return res.send(allStudentMap)

          // // Student Fee Mapping added
          // var feeMapDetails = await Promise.all(
          //   _.map(studentDetails, async function (x, j) {
          //     let studentModel = dbConnection.model(
          //       "students",
          //       StudentSchema
          //     );
          //     let feeManagerModel = dbConnection.model("feemanagers",feeManagerSchema)
          //     let check = await studentModel.findOne({
          //       regId: x["Reg No *"],
          //     });
          //     let studentId = check._id;
          //     console.log("***X***", x);
          //     let feesManager = x.feeStructure;
          //     let pplan = check.programPlanId
          //     let fstr = check.feeStructureId
          //     let feestr = await feeStructureModel.findOne({_id:fstr})
          //     let fmanagers = []
          //     let fmanagers = await feeManagerModel.find({programPlanId:pplan})
          //     // for(let i=0;i<feestr.feeTypeIds.length;i++){
          //     //   let fmanagers = await feeManagerModel.find({programPlanId:pplan})
          //     //   let 
          //     // }
          //     var feeManagerId = await Promise.all(
          //       _.map(feesManager, async function (y) {
          //         console.log("***y***", y);
          //         let check = await feeStructureModel.findOne({
          //           refId: y,
          //         });
          //         console.log("***check***", check);
          //         let mainId = check._id;
          //         return mainId;
          //       })
          //     );
          //     console.log("feeManagerId", feeManagerId);

          //     let mainDate = new moment().add(1, "year").date(1);
          //     var dating = [
          //       {
          //         dueDate: mainDate,
          //         id: 3,
          //         percentage: 100,
          //       },
          //     ];

          //     var newFeeMap = {
          //       displayName: `SFM_${
          //         String(j).length == 1
          //           ? "00"
          //           : String(j).length == 2
          //           ? "0"
          //           : ""
          //       }${Number(j) + 1}`,
          //       studentId: studentId,
          //       feeStructureId: {
          //         id: feeManagerId,
          //         paymentSchedule: dating,
          //       },
          //       createdBy: dbName,
          //     };
          //     return newFeeMap;
          //   })
          // );
          // console.log("feeMapDetails", feeMapDetails);
          // let feeMapModel = dbConnection.model(
          //   "studentFeesMap",
          //   StudentFeeMapSchema
          // );

          // feeMapModel.insertMany(
          //   feeMapDetails,
          //   async function (error, docs) {
          //     if (error) {
          //       if (
          //         error.name === "BulkWriteError" &&
          //         error.code === 11000
          //       ) {
          //         // Duplicate username
          //         return res.status(200).json({
          //           success: true,
          //           message: "Fee Student Map already exist!",
          //           count: 0,
          //         });
          //       }
          //       return res.status(400).json({
          //         message: "Database Error",
          //         type: "error",
          //         data: error,
          //       });
          //     } else {

          //     }
          //   }
          // );



          return res.send(allStudents);

          //   var feeStructureDetails = await Promise.all(
          //     _.map(feeStructure, async function (x, j) {
          //       let feety = x["Fee Manager *"];
          //       var feeTypeId = await Promise.all(
          //         _.map(feety, async function (x) {
          //           let check = await feeManagerSchema.findOne({ id: x });
          //           let mainId = check._id;
          //           return mainId;
          //         })
          //       );
          //       var newFesStructure = {
          //         displayName: `FS_${
          //           String(j).length == 1
          //             ? "00"
          //             : String(j).length == 2
          //             ? "0"
          //             : ""
          //         }${Number(j) + 1}`,
          //         title: x["Title *"],
          //         refId: x["id"],
          //         description: x["Description"],
          //         feeManagerId: feeTypeId,
          //         createdBy: dbName,
          //       };
          //       return newFesStructure;
          //     })
          //   );
          //   let feeStructureModel = dbConnection.model(
          //     "feeStructure",
          //     FeeStructureSchema
          //   );
          //   feeStructureModel.insertMany(
          //     feeStructureDetails,
          //     async function (error, docs) {
          //       if (error) {
          //         if (error.name === "BulkWriteError" && error.code === 11000) {
          //           // Duplicate username
          //           return res.status(200).json({
          //             success: true,
          //             message: "Fee Structure already exist!",
          //             count: 0,
          //           });
          //         }
          //         return res.status(400).json({
          //           message: "Database Error",
          //           type: "error",
          //           data: error,
          //         });
          //       } else {
          //         pubnubConfig.message.description = {
          //           message: `Fee Structure has been added successfully.`,
          //         };
          //         await pubnub.publish(pubnubConfig);

          //         //Student Details
          //         var allStudentData = [];
          //         let studentModel = dbConnection.model(
          //           "students",
          //           StudentSchema
          //         );
          //         let guardianSchema = dbConnection.model(
          //           "guardian",
          //           GuardianSchema
          //         );
          //         for (let j = 0; j < studentDetails.length; j++) {
          //           var studentInputData = studentDetails[j];
          //           var feeManagerDetails = {};
          //           var fmIdDet = {};
          //           if (studentInputData["feeStructure"] != undefined) {
          //             for (
          //               let k = 0;
          //               k < studentInputData["feeStructure"].length;
          //               k++
          //             ) {
          //               console.log(
          //                 "fee manager",
          //                 studentInputData["feeStructure"][k]
          //               );
          //               var feeMngtDetails = await feeStructureModel.findOne({
          //                 refId: studentInputData["feeStructure"][k],
          //               });
          //               console.log("feeMngtDetails", feeMngtDetails);
          //               fmIdDet = await feeManagerSchema.findOne({
          //                 _id: feeMngtDetails["feeManagerId"]["0"],
          //               });
          //               feeManagerDetails = feeMngtDetails._id;
          //             }
          //           }
          //           var guardianDetails = {
          //             isPrimary: true,
          //             firstName: studentInputData["Parent Name"],
          //             lastName: studentInputData["Parent Name"],
          //             mobile: studentInputData["Phone Number"],
          //             email: studentInputData["Parent Email Address"],
          //             relation: "Parent",
          //             createdBy: dbName,
          //           };
          //           const guardianData = new guardianSchema(guardianDetails);
          //           var guardianResponse = await guardianData.save();
          //           console.log("guardianResponse", guardianResponse);

          //           var studentData = {
          //             displayName: `STUD_${
          //               String(j).length == 1
          //                 ? "00"
          //                 : String(j).length == 2
          //                 ? "0"
          //                 : ""
          //             }${Number(j) + 1}`,
          //             regId: studentInputData["Reg No *"],
          //             salutation:
          //               studentInputData["salutation"] == undefined
          //                 ? null
          //                 : studentInputData["salutation"], // salutation
          //             category: studentInputData["Category"], // Category
          //             firstName: studentInputData["First Name *"], //First Name *
          //             middleName:
          //               studentInputData["Middle Name *"] == undefined
          //                 ? null
          //                 : studentInputData["Middle Name *"], //
          //             lastName: studentInputData["Last Name *"], //Last Name *
          //             guardianDetails: [guardianResponse._id],
          //             gender: studentInputData["Gender"],
          //             dob: studentInputData["DOB"],
          //             admittedOn: studentInputData["Admitted Date *"],
          //             programPlanId: fmIdDet.programPlanId,
          //             feeStructureId: feeManagerDetails,
          //             phoneNo: studentInputData["Phone Number *"],
          //             email: studentInputData["Email Address *"],
          //             alternateEmail: null,
          //             createdBy: inputData.orgId,
          //             addressDetails: {
          //               address1: studentInputData["Address 1"],
          //               address2: studentInputData["Address 2"],
          //               address3: studentInputData["Address 3"],
          //               city: studentInputData["City/Town"],
          //               state: null,
          //               country: studentInputData["Country"],
          //               pincode: studentInputData["PIN Code"],
          //             },
          //           };
          //           allStudentData.push(studentData);
          //         }
          //         console.log("allStudentData", allStudentData);
          //         if (allStudentData.length > 0) {
          //           await studentModel.insertMany(allStudentData);
          //           pubnubConfig.message.description = {
          //             message: `Student has been added successfully.`,
          //           };
          //           await pubnub.publish(pubnubConfig);
          //         }
          //         var feeMapDetails = await Promise.all(
          //           _.map(studentDetails, async function (x, j) {
          //             let studentModel = dbConnection.model(
          //               "students",
          //               StudentSchema
          //             );
          //             let check = await studentModel.findOne({
          //               regId: x["Reg No *"],
          //             });
          //             let studentId = check._id;
          //             console.log("***X***", x);
          //             let feesManager = x.feeStructure;
          //             console.log("***feesManager***", feesManager);

          //             var feeManagerId = await Promise.all(
          //               _.map(feesManager, async function (y) {
          //                 console.log("***y***", y);
          //                 let check = await feeStructureModel.findOne({
          //                   refId: y,
          //                 });
          //                 console.log("***check***", check);
          //                 let mainId = check._id;
          //                 return mainId;
          //               })
          //             );
          //             console.log("feeManagerId", feeManagerId);

          //             let mainDate = new moment().add(1, "year").date(1);
          //             var dating = [
          //               {
          //                 dueDate: mainDate,
          //                 id: 3,
          //                 percentage: 100,
          //               },
          //             ];

          //             var newFeeMap = {
          //               displayName: `SFM_${
          //                 String(j).length == 1
          //                   ? "00"
          //                   : String(j).length == 2
          //                   ? "0"
          //                   : ""
          //               }${Number(j) + 1}`,
          //               studentId: studentId,
          //               feeStructureId: {
          //                 id: feeManagerId,
          //                 paymentSchedule: dating,
          //               },
          //               createdBy: dbName,
          //             };
          //             return newFeeMap;
          //           })
          //         );
          //         console.log("feeMapDetails", feeMapDetails);
          //         let feeMapModel = dbConnection.model(
          //           "studentFeesMap",
          //           StudentFeeMapSchema
          //         );

          //         feeMapModel.insertMany(
          //           feeMapDetails,
          //           async function (error, docs) {
          //             if (error) {
          //               if (
          //                 error.name === "BulkWriteError" &&
          //                 error.code === 11000
          //               ) {
          //                 // Duplicate username
          //                 return res.status(200).json({
          //                   success: true,
          //                   message: "Fee Student Map already exist!",
          //                   count: 0,
          //                 });
          //               }
          //               return res.status(400).json({
          //                 message: "Database Error",
          //                 type: "error",
          //                 data: error,
          //               });
          //             } else {
          //               pubnubConfig.message.description = {
          //                 message: `Student Fee Map has been added successfully.`,
          //               };
          //               pubnubConfig.message.description = {
          //                 message: `Setup has been added successfully.`,
          //               };
          //               await pubnub.publish(pubnubConfig);
          //               var newPaymentScheduleDetails = new paymentScheduleModel({
          //                 displayName: "PS_001",
          //                 title: "Year",
          //                 description: "Every year",
          //                 scheduleDetails: {
          //                   collectEvery: "year",
          //                   dueDate: "first",
          //                 },
          //                 feesBreakUp: [
          //                   {
          //                     dueDate: "first date",
          //                     percentage: 100,
          //                   },
          //                 ],
          //                 createdBy: dbName,
          //               });
          //               newPaymentScheduleDetails.save(function (err, data) {
          //                 if (err) {
          //                   return res.status(400).json({
          //                     message: "Database error",
          //                     type: "error",
          //                     data: err,
          //                   });
          //                 } else {
          //                   var newReminderDetails = new reminderModel({
          //                     displayName: "RP_001",
          //                     title: "Default",
          //                     description: "Default Reminder",
          //                     numberOfReminders: 5,
          //                     scheduleDetails: [
          //                       {
          //                         days: 5,
          //                       },
          //                       {
          //                         days: 5,
          //                       },
          //                       {
          //                         days: 5,
          //                       },
          //                       {
          //                         days: 5,
          //                       },
          //                       {
          //                         days: 5,
          //                       },
          //                     ],
          //                     createdBy: dbName,
          //                   });
          //                   newReminderDetails.save(function (err, data) {
          //                     if (err) {
          //                       return res.status(400).json({
          //                         message: "Database error",
          //                         type: "error",
          //                         data: err,
          //                       });
          //                     } else {
          //                       return res.status(201).json({
          //                         message: "New Setup added",
          //                         type: "success",
          //                       });
          //                     }
          //                   });
          //                 }
          //               });
          //             }
          //           }
          //         );
          //       }
          //     }
          //   );
        }
      });
    } else {
      return res.status(400).json({
        status: "failure",
        message: "Upload file does not exist",
        Error: err,
      });
    }
  });
};

exports.initLedger = async function (req, res) {
  var dbUrl = req.headers.resource;
  console.log("url", dbUrl);
  let inputData = req.body;
  let dbName = inputData.orgId;
  let dbConnection = await createDatabase(dbName, dbUrl);
  let masterUpladModel = dbConnection.model(
    "masteruploads",
    masterUploadSchema
  );
  let programPlanSchema = dbConnection.model("programplans", ProgramPlanSchema);
  let feeStructureSchema = dbConnection.model(
    "feestructures",
    FeeStructureSchema
  );
  let paymentScheduleModel = dbConnection.model(
    "paymentschedules",
    paymentScheduleSchema
  );
  let reminderModel = dbConnection.model("reminders", ReminderScheduleSchema);

  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  masterUpladModel.find({}, async function (err, doc) {
    if (doc) {
      let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
      //   return res.status(200).json({ status: "success", data: doc });
      let pubnubConfig = {
        channel: inputData.orgId.toString(),
        message: {
          description: { message: "Setup Initiated", data: {} },
          status: 0,
        },
      };
      let feeType = doc[0]["data"]["feeTypes"];
      let feeStructure = doc[0]["data"]["feeStructures"];
      let programPlanDatas = doc[0]["data"]["programPlans"];
      let feeManagerDatas = doc[0]["data"]["feeManagers"];
      let studentDetails = doc[0]["data"]["studentDetails"];
      let demdnSt = [];
      for (let j = 0; j < studentDetails.length; j++) {
        console.log("student", j);
        console.log("class", j["Course"]);
        let date = new Date();
        let payload = {
          displayName: `DN_2020-21${
            String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
            }${Number(j) + 1}`,
          transactionType: "eduFees",
          transactionSubType: "demandNote",
          transactionDate: date.toISOString(),
          studentId: "5fab8b852ae0482510832368",
          studentRegId: j["Reg No *"],
          studentName: j["First Name *"],
          class: j["Course"] + " " + j["Branch"],
          academicYear: "2020-21",
          programPlan: "BE_ENG_CSC_20-21",
          amount: 70000,
          dueDate: "2021-11-01T07:14:41.150Z",
          emailCommunicationRefIds: "zenqoretester32@gmail.com",
          smsCommunicationRefIds: "7036327992",
          status: "pending",
          relatedTransactions: [],
          data: {
            orgId: "5fa8daece3eb1f18d4250e98",
            displayName: `DN_2020-21${
              String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
              }${Number(j) + 1}`,
            studentId: "5fab8b852ae0482510832368",
            studentRegId: "BIT_EE_00002",
            class: "BE Computer Science  ",
            academicYear: "2020-21",
            programPlan: "PP_001",
            issueDate: date.toISOString(),
            dueDate: date.toISOString(),
            feesBreakUp: [
              {
                feeTypeId: "5fab8b7e2ae0482510832359",
                feeTypeCode: "FT_001",
                amount: 70000,
                feeType: "Tuition Fee",
              },
            ],
          },
          createdBy: "5fa8daece3eb1f18d4250e98",
        };
        processTransaction({ body: payload }, dbConnection)
          .then((jNoteData) => {
            console.log("demdnstatus", jNoteData);
            demdnSt.push(jNoteData);
          })
          .catch((err) => {
            console.log("demdnstatuserr", err);
            demdnSt.push(err);
          });
      }
      res.send(demdnSt);

      //   let displayId = await getDisplayId("feeTypes", dbName, dbUrl);

      // var feeTypeDetails = await Promise.all(
      //   _.map(feeType, async function (x, j) {
      //     var newFeeTypes = {
      //       displayName: `FT_${
      //         String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
      //       }${Number(j) + 1}`,
      //       title: x["Fee Type *"],
      //       description: x["Description"],
      //       refId: x["Fee Id *"],
      //       unit: 1,
      //       frequency: 1,
      //       createdBy: dbName,
      //     };
      //     return newFeeTypes;
      //   })
      // );
      // feeTypeModel.insertMany(feeTypeDetails, async function (error, docs) {
      //   if (error) {
      //     if (error.name === "BulkWriteError" && error.code === 11000) {
      //       // Duplicate username
      //       return res.status(200).json({
      //         success: true,
      //         message: "Fee Types already exist!",
      //         count: 0,
      //       });
      //     }
      //     return res.status(400).json({
      //       message: "Database Error",
      //       type: "error",
      //       data: error,
      //     });
      //   } else {
      //     //    let feeStructure = await createFeeStructure(docs,feeStructure)
      //     pubnubConfig.message.description = {
      //       message: `Fee Type has been added successfully.`,
      //     };
      //     await pubnub.publish(pubnubConfig);

      //     //Program Plan Added
      //     var allProgramPlan = [];
      //     for (let j = 0; j < programPlanDatas.length; j++) {
      //       var ppInputData = programPlanDatas[j];
      //       var ppData = {
      //         displayName: `PP_${
      //           String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
      //         }${Number(j) + 1}`,
      //         programCode: ppInputData["Program code *"],
      //         title: ppInputData["Program Name *"],
      //         academicYear: ppInputData["academicYear"],
      //         description: ppInputData["Description "],
      //         createdBy: inputData.orgId,
      //         status: ppInputData["Status"],
      //       };
      //       allProgramPlan.push(ppData);
      //     }
      //     console.log("allProgramPlan", allProgramPlan);
      //     if (allProgramPlan.length > 0) {
      //       await programPlanSchema.insertMany(allProgramPlan);
      //       pubnubConfig.message.description = {
      //         message: `Program Plan has been added successfully.`,
      //       };
      //       await pubnub.publish(pubnubConfig);
      //     }

      //     // Fee Manager added
      //     var allFeeManager = [];
      //     for (let j = 0; j < feeManagerDatas.length; j++) {
      //       var pfmInputData = feeManagerDatas[j];
      //       var ppDetails = await programPlanSchema.findOne({
      //         programCode: pfmInputData["Program Plan Id *"]["0"],
      //       });
      //       var feeTypesDetails = await feeTypeModel.findOne({
      //         refId: pfmInputData["Fee Type Id *"]["0"],
      //       });
      //       if (ppDetails != null && feeTypesDetails != null) {
      //         var pfmData = {
      //           id: pfmInputData["id *"],
      //           displayName: `FEES_${
      //             String(j).length == 1
      //               ? "00"
      //               : String(j).length == 2
      //               ? "0"
      //               : ""
      //           }${Number(j) + 1}_${pfmInputData["Program Plan Id *"]["0"]}`,
      //           title: pfmInputData["Title *"],
      //           description: pfmInputData["Description"],
      //           feeTypeId: feeTypesDetails._id,
      //           programPlanId: ppDetails._id,
      //           feeDetails: {
      //             units: null,
      //             perUnitAmount: null,
      //             annualAmount: pfmInputData["Total Fees *"],
      //           },
      //           createdBy: inputData.orgId,
      //         };
      //         allFeeManager.push(pfmData);
      //       }
      //     }
      //     console.log("allFeeManager", allFeeManager);
      //     if (allFeeManager.length > 0) {
      //       await feeManagerSchema.insertMany(allFeeManager);
      //       pubnubConfig.message.description = {
      //         message: `Program Plan has been added successfully.`,
      //       };
      //       await pubnub.publish(pubnubConfig);
      //     }
      //     var feeStructureDetails = await Promise.all(
      //       _.map(feeStructure, async function (x, j) {
      //         let feety = x["Fee Manager *"];
      //         var feeTypeId = await Promise.all(
      //           _.map(feety, async function (x) {
      //             let check = await feeManagerSchema.findOne({ id: x });
      //             let mainId = check._id;
      //             return mainId;
      //           })
      //         );
      //         var newFesStructure = {
      //           displayName: `FS_${
      //             String(j).length == 1
      //               ? "00"
      //               : String(j).length == 2
      //               ? "0"
      //               : ""
      //           }${Number(j) + 1}`,
      //           title: x["Title *"],
      //           refId: x["id"],
      //           description: x["Description"],
      //           feeManagerId: feeTypeId,
      //           createdBy: dbName,
      //         };
      //         return newFesStructure;
      //       })
      //     );
      //     let feeStructureModel = dbConnection.model(
      //       "feeStructure",
      //       FeeStructureSchema
      //     );
      //     feeStructureModel.insertMany(feeStructureDetails, async function (
      //       error,
      //       docs
      //     ) {
      //       if (error) {
      //         if (error.name === "BulkWriteError" && error.code === 11000) {
      //           // Duplicate username
      //           return res.status(200).json({
      //             success: true,
      //             message: "Fee Structure already exist!",
      //             count: 0,
      //           });
      //         }
      //         return res.status(400).json({
      //           message: "Database Error",
      //           type: "error",
      //           data: error,
      //         });
      //       } else {
      //         pubnubConfig.message.description = {
      //           message: `Fee Structure has been added successfully.`,
      //         };
      //         await pubnub.publish(pubnubConfig);

      //         //Student Details
      //         var allStudentData = [];
      //         let studentModel = dbConnection.model("students", StudentSchema);
      //         let guardianSchema = dbConnection.model(
      //           "guardian",
      //           GuardianSchema
      //         );
      //         for (let j = 0; j < studentDetails.length; j++) {
      //           var studentInputData = studentDetails[j];
      //           var feeManagerDetails = {};
      //           var fmIdDet = {};
      //           if (studentInputData["feeStructure"] != undefined) {
      //             for (
      //               let k = 0;
      //               k < studentInputData["feeStructure"].length;
      //               k++
      //             ) {
      //               console.log(
      //                 "fee manager",
      //                 studentInputData["feeStructure"][k]
      //               );
      //               var feeMngtDetails = await feeStructureModel.findOne({
      //                 refId: studentInputData["feeStructure"][k],
      //               });
      //               console.log("feeMngtDetails", feeMngtDetails);
      //               fmIdDet = await feeManagerSchema.findOne({
      //                 _id: feeMngtDetails["feeManagerId"]["0"],
      //               });
      //               feeManagerDetails = feeMngtDetails._id;
      //             }
      //           }
      //           var guardianDetails = {
      //             isPrimary: true,
      //             firstName: studentInputData["Parent Name"],
      //             lastName: studentInputData["Parent Name"],
      //             mobile: studentInputData["Phone Number"],
      //             email: studentInputData["Parent Email Address"],
      //             relation: "Parent",
      //             createdBy: dbName,
      //           };
      //           const guardianData = new guardianSchema(guardianDetails);
      //           var guardianResponse = await guardianData.save();
      //           console.log("guardianResponse", guardianResponse);

      //           var studentData = {
      //             displayName: `STUD_${
      //               String(j).length == 1
      //                 ? "00"
      //                 : String(j).length == 2
      //                 ? "0"
      //                 : ""
      //             }${Number(j) + 1}`,
      //             regId: studentInputData["Reg No *"],
      //             salutation:
      //               studentInputData["salutation"] == undefined
      //                 ? null
      //                 : studentInputData["salutation"], // salutation
      //             category: studentInputData["Category"], // Category
      //             firstName: studentInputData["First Name *"], //First Name *
      //             middleName:
      //               studentInputData["Middle Name *"] == undefined
      //                 ? null
      //                 : studentInputData["Middle Name *"], //
      //             lastName: studentInputData["Last Name *"], //Last Name *
      //             guardianDetails: [guardianResponse._id],
      //             gender: studentInputData["Gender"],
      //             dob: studentInputData["DOB"],
      //             admittedOn: studentInputData["Admitted Date *"],
      //             programPlanId: fmIdDet.programPlanId,
      //             feeStructureId: feeManagerDetails,
      //             phoneNo: studentInputData["Phone Number *"],
      //             email: studentInputData["Email Address *"],
      //             alternateEmail: null,
      //             createdBy: inputData.orgId,
      //             addressDetails: {
      //               address1: studentInputData["Address 1"],
      //               address2: studentInputData["Address 2"],
      //               address3: studentInputData["Address 3"],
      //               city: studentInputData["City/Town"],
      //               state: null,
      //               country: studentInputData["Country"],
      //               pincode: studentInputData["PIN Code"],
      //             },
      //           };
      //           allStudentData.push(studentData);
      //         }
      //         console.log("allStudentData", allStudentData);
      //         if (allStudentData.length > 0) {
      //           await studentModel.insertMany(allStudentData);
      //           pubnubConfig.message.description = {
      //             message: `Student has been added successfully.`,
      //           };
      //           await pubnub.publish(pubnubConfig);
      //         }
      //         var feeMapDetails = await Promise.all(
      //           _.map(studentDetails, async function (x, j) {
      //             let studentModel = dbConnection.model(
      //               "students",
      //               StudentSchema
      //             );
      //             let check = await studentModel.findOne({
      //               regId: x["Reg No *"],
      //             });
      //             let studentId = check._id;
      //             console.log("***X***", x);
      //             let feesManager = x.feeStructure;
      //             console.log("***feesManager***", feesManager);

      //             var feeManagerId = await Promise.all(
      //               _.map(feesManager, async function (y) {
      //                 console.log("***y***", y);
      //                 let check = await feeStructureModel.findOne({ refId: y });
      //                 console.log("***check***", check);
      //                 let mainId = check._id;
      //                 return mainId;
      //               })
      //             );
      //             console.log("feeManagerId", feeManagerId);

      //             let mainDate = new moment().add(1, "year").date(1);
      //             var dating = [
      //               {
      //                 dueDate: mainDate,
      //                 id: 3,
      //                 percentage: 100,
      //               },
      //             ];

      //             var newFeeMap = {
      //               displayName: `SFM_${
      //                 String(j).length == 1
      //                   ? "00"
      //                   : String(j).length == 2
      //                   ? "0"
      //                   : ""
      //               }${Number(j) + 1}`,
      //               studentId: studentId,
      //               feeStructureId: {
      //                 id: feeManagerId,
      //                 paymentSchedule: dating,
      //               },
      //               createdBy: dbName,
      //             };
      //             return newFeeMap;
      //           })
      //         );
      //         console.log("feeMapDetails", feeMapDetails);
      //         let feeMapModel = dbConnection.model(
      //           "studentFeesMap",
      //           StudentFeeMapSchema
      //         );

      //         feeMapModel.insertMany(feeMapDetails, async function (
      //           error,
      //           docs
      //         ) {
      //           if (error) {
      //             if (error.name === "BulkWriteError" && error.code === 11000) {
      //               // Duplicate username
      //               return res.status(200).json({
      //                 success: true,
      //                 message: "Fee Student Map already exist!",
      //                 count: 0,
      //               });
      //             }
      //             return res.status(400).json({
      //               message: "Database Error",
      //               type: "error",
      //               data: error,
      //             });
      //           } else {
      //             pubnubConfig.message.description = {
      //               message: `Student Fee Map has been added successfully.`,
      //             };
      //             pubnubConfig.message.description = {
      //               message: `Setup has been added successfully.`,
      //             };
      //             await pubnub.publish(pubnubConfig);
      //             var newPaymentScheduleDetails = new paymentScheduleModel({
      //               displayName: "PS_001",
      //               title: "Year",
      //               description: "Every year",
      //               scheduleDetails: {
      //                 collectEvery: "year",
      //                 dueDate: "first",
      //               },
      //               feesBreakUp: [
      //                 {
      //                   dueDate: "first date",
      //                   percentage: 100,
      //                 },
      //               ],
      //               createdBy: dbName,
      //             });
      //             newPaymentScheduleDetails.save(function (err, data) {
      //               if (err) {
      //                 return res.status(400).json({
      //                   message: "Database error",
      //                   type: "error",
      //                   data: err,
      //                 });
      //               } else {
      //                 var newReminderDetails = new reminderModel({
      //                   displayName: "RP_001",
      //                   title: "Default",
      //                   description: "Default Reminder",
      //                   numberOfReminders: 5,
      //                   scheduleDetails: [
      //                     {
      //                       days: 5,
      //                     },
      //                     {
      //                       days: 5,
      //                     },
      //                     {
      //                       days: 5,
      //                     },
      //                     {
      //                       days: 5,
      //                     },
      //                     {
      //                       days: 5,
      //                     },
      //                   ],
      //                   createdBy: dbName,
      //                 });
      //                 newReminderDetails.save(function (err, data) {
      //                   if (err) {
      //                     return res.status(400).json({
      //                       message: "Database error",
      //                       type: "error",
      //                       data: err,
      //                     });
      //                   } else {
      //                     return res.status(201).json({
      //                       message: "New Setup added",
      //                       type: "success",
      //                     });
      //                   }
      //                 });
      //               }
      //             });
      //           }
      //         });
      //       }
      //     });
      //   }
      // });
    } else {
      return res.status(400).json({
        status: "failure",
        message: "Upload file does not exist",
        Error: err,
      });
    }
  });
};
