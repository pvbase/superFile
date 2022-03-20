const transactionsSchema = require("../models/transactionsModel");
const feesLedgerSchema = require("../models/feesLedgerModel");
const StudentSchema = require("../models/studentModel");
const GuardianSchema = require("../models/guardianModel");
const FeeStructureSchema = require("../models/feeStructureModel");
const FeeTypeSchema = require("../models/feeTypeModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
const FeeManagerSchema = require("../models/feesManagerModel");
const settingsSchema = require("../models/settings/feesetting");
const { createDatabase } = require("../utils/db_creation");
const { createDemandNote } = require("../controllers/transactions/demand-note");
exports.createStudentMap = async function (req, res) {
  let dbName = "5fa922adb52cca29a4027786";
  let dbConnection = await createDatabase(dbName, req.headers.resource);
  let masterUpladModel = dbConnection.model(
    "masteruploads",
    masterUploadSchema
  );

  masterUpladModel.find({}, async function (err, doc) {
    let studentDetails = doc[0]["data"]["studentDetails"];
    let feeManager = doc[0]["data"]["feeManagers"];
    var feeMapDetails = await Promise.all(
      _.map(studentDetails, async function (x, j) {
        let studentModel = dbConnection.model("students", StudentSchema);
        let check = await studentModel.findOne({ regId: x["Reg No *"] });
        let studentId = check._id;
        let feesManager = x.feeManager;

        var feeManagerId = await Promise.all(
          _.map(feesManager, async function (y) {
            let feeManagerModel = dbConnection.model(
              "feemanagers",
              FeeManagerSchema
            );
            let check = await feeManagerModel.findOne({ id: y });
            let mainId = check._id;
            return mainId;
          })
        );
        let reminder = [];
        let dating = [];
        _.times(12, function (value) {
          let mainDate = new moment().add(value + 1, "months").date(1);
          var remainderDate = new moment(mainDate).subtract(5, "days");
          var obj = {
            dueDate: mainDate,
            id: 1,
            percentage: 8,
          };
          var obj2 = {
            date: remainderDate,
          };
          reminder.push(obj2);
          dating.push(obj);
        }); // 'foo' (4x)

        var newFeeMap = {
          displayName: `SM-${
            String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""
          }${Number(j) + 1}`,
          studentId: studentId,
          feeManager: {
            id: feeManagerId,
            paymentSchedule: dating,
            reminderPlan: reminder,
          },
          createdBy: dbName,
        };
        return newFeeMap;
      })
    );

    let feeMapModel = dbConnection.model("studentFeesMap", StudentFeeMapSchema);

    feeMapModel.insertMany(feeMapDetails, async function (error, docs) {
      if (error) {
        if (error.name === "BulkWriteError" && error.code === 11000) {
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
        return res.status(201).json({
          message: "New Fee Map added",
          type: "success",
          data: docs,
          count: docs.length,
        }); // Success
      }
    });
  });
};

exports.getStudentDetails = async function (req, res) {
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
    let settingsModel = dbConnection.model("settings", settingsSchema);
    var transactionDetails = await transactionModel.find({
      $or: [{ status: "Pending" }, { status: "Partial" }],
      studentRegId: id,
      transactionSubType: "demandNote",
    });
    if (transactionDetails.length == 0) {
      return res
        .status(404)
        .json({ status: "failed", message: "No Active Demand Note" });
    }
    var studentFeeMapDetails = await feeMapModel.findOne({
      studentId: transactionDetails[0].studentId,
    });
    let feeStructureDetails = await feeStructureModel.findOne({
      _id: studentFeeMapDetails.feeStructureId,
    });
    let settingsDetails = await settingsModel.find({});
    console.log("settings", settingsDetails);
    let feeTypesAll = [];
    for (feeTypesI of feeStructureDetails.feeTypeIds) {
      let feeTypesDetails = await feeTypeModel.findOne({
        _id: feeTypesI,
      });
      let feeManagerDetails = await feeManagerModel.findOne({
        feeTypeId: feeTypesI,
      });
      let obj1 = {
        feeTypesDetails: feeTypesDetails,
        feeManagerDetails: feeManagerDetails,
      };
      feeTypesAll.push(obj1);
    }
    if (studentFeeMapDetails == null) {
      return res
        .status(404)
        .json({ status: "failed", message: "Invalid Student ID" });
    }

    let feeLedgerData = [];
    for (oneLedger of transactionDetails) {
      let studentDetails = await studentModel.findOne({
        _id: oneLedger.studentId,
      });
      let guardianDetails = await guardianModel.findOne({
        _id: studentDetails.guardianDetails[0],
      });
      let feesBreakUp = [];
      for (feeTypesI of feeStructureDetails.feeTypeIds) {
        let feeTypesDetails = await feeTypeModel.findOne({
          _id: feeTypesI,
        });
        let fees;
        if (
          feeTypesDetails.displayName ==
          oneLedger.data.feesBreakUp[0].feeTypeCode
        ) {
          fees = oneLedger.data.feesBreakUp[0].amount;
        } else {
          fees = 0;
        }
        let obj = {
          feeTypeId: feeTypesDetails._id,
          feeType: feeTypesDetails.title,
          amount: fees,
          feeTypeCode: feeTypesDetails.displayName,
        };
        feesBreakUp.push(obj);
      }
      let obj = {
        demandNote: oneLedger,
        guardianDetails: guardianDetails,
        studentDetails: studentDetails,
        studentFeeMapDetails: studentFeeMapDetails,
        pending: studentFeeMapDetails.pending,
        paid: studentFeeMapDetails.paid,
        feeDetails: feeTypesAll,
        feesBreakUp: feesBreakUp,
        receiptStatus: settingsDetails[0].receipts.send,
      };
      feeLedgerData.push(obj);
    }
    res.status(200).json(feeLedgerData);
  }
};

exports.getAllDemandNoteDetails = async function (req, res) {
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
    var transactionDetails = await transactionModel.find({
      $or: [{ status: "Pending" }, { status: "Partial" }],
      studentRegId: id,
      transactionSubType: "demandNote",
    });
    if (transactionDetails.length == 0) {
      let payL = {
        displayName: "",
        transactionType: "",
        transactionSubType: "",
        transactionDate: "",
        studentId: "5fdb1ff4910d6a721726f7c3",
        studentRegId: "GHS10003",
        studentName: "Aayush",
        class: "2020-Class 1",
        academicYear: "2020-21",
        programPlan: "VKKPCLASSFIRST",
        amount: 100000,
        dueDate: "2021-11-01T08:40:08.458Z",
        emailCommunicationRefIds: "",
        smsCommunicationRefIds: "9655173928",
        status: "",
        relatedTransactions: [],
        orgId: "5fa8daece3eb1f18d4250e98",
        data: {
          orgId: "5fa8daece3eb1f18d4250e98",
          displayName: "",
          studentId: "5fc9fb2e86fc7e592c80293a",
          studentRegId: "GHS10001",
          class: "2020-Class 1",
          academicYear: "2020-21",
          programPlan: "VKKPCLASSFIRST",
          issueDate: "",
          dueDate: "",
          feesBreakUp: [
            {
              feeTypeId: "5fc9fb1786fc7e592c801f57",
              feeTypeCode: "FT001",
              amount: 100000,
              feeType: "Tuition Fee",
            },
          ],
        },
        createdBy: "5fa8daece3eb1f18d4250e98",
        studentFeeMapId: "SFM003",
      };
      let createDemand = await createDemand(payL);

      return res.status(200).json({
        status: "failed",
        message: "No Active Demand Note",
        data: createDemand,
      });
    }
    var studentFeeMapDetails = await feeMapModel.findOne({
      studentId: transactionDetails[0].studentId,
    });
    let feeStructureDetails = await feeStructureModel.findOne({
      _id: studentFeeMapDetails.feeStructureId,
    });
    let feeTypesAll = [];
    for (feeTypesI of feeStructureDetails.feeTypeIds) {
      let feeTypesDetails = await feeTypeModel.findOne({
        _id: feeTypesI,
      });
      let feeManagerDetails = await feeManagerModel.findOne({
        feeTypeId: feeTypesI,
      });
      let obj1 = {
        feeTypesDetails: feeTypesDetails,
        feeManagerDetails: feeManagerDetails,
      };
      feeTypesAll.push(obj1);
    }
    if (studentFeeMapDetails == null) {
      return res
        .status(404)
        .json({ status: "failed", message: "Invalid Student ID" });
    }

    let feeLedgerData = [];
    for (oneLedger of transactionDetails) {
      let studentDetails = await studentModel.findOne({
        _id: oneLedger.studentId,
      });
      let guardianDetails = await guardianModel.findOne({
        _id: studentDetails.guardianDetails[0],
      });

      let obj = {
        demandNote: oneLedger,
        guardianDetails: guardianDetails,
        studentDetails: studentDetails,
        studentFeeMapDetails: studentFeeMapDetails,
        pending: studentFeeMapDetails.pending,
        paid: studentFeeMapDetails.paid,
        feeDetails: feeTypesAll,
      };
      feeLedgerData.push(obj);
    }
    res.status(200).json(feeLedgerData);
  }
};

exports.getStudentDetailsForPayment = async function (req, res) {
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
    var transactionDetails = await transactionModel.find({
      $or: [{ status: "Pending" }, { status: "Partial" }],
      studentRegId: id,
      transactionSubType: "demandNote",
    });
    console.log("transactionDetails", transactionDetails);
    if (transactionDetails.length == 0) {
      return res
        .status(404)
        .json({ status: "failed", message: "No Active Demand Note" });
    }
    var studentFeeMapDetails = await feeMapModel.findOne({
      studentId: transactionDetails[0].studentId,
    });
    let feeStructureDetails = await feeStructureModel.findOne({
      _id: studentFeeMapDetails.feeStructureId,
    });
    let feeTypesAll = [];
    for (feeTypesI of feeStructureDetails.feeTypeIds) {
      let feeTypesDetails = await feeTypeModel.findOne({
        _id: feeTypesI,
      });
      let feeManagerDetails = await feeManagerModel.findOne({
        feeTypeId: feeTypesI,
      });
      let obj1 = {
        feeTypesDetails: feeTypesDetails,
        feeManagerDetails: feeManagerDetails,
      };
      feeTypesAll.push(obj1);
    }
    if (studentFeeMapDetails == null) {
      return res
        .status(404)
        .json({ status: "failed", message: "Invalid Student ID" });
    }

    let feeLedgerData = [];

    for (oneLedger of transactionDetails) {
      let studentDetails = await studentModel.findOne({
        _id: oneLedger.studentId,
      });
      let guardianDetails = await guardianModel.findOne({
        _id: studentDetails.guardianDetails[0],
      });

      let feesBreakUp = [];
      for (feeTypesI of feeStructureDetails.feeTypeIds) {
        let feeTypesDetails = await feeTypeModel.findOne({
          _id: feeTypesI,
        });
        let obj = {
          feeTypeId: feeTypesDetails._id,
          feeType: feeTypesDetails.title,
          amount: oneLedger.data.feesBreakUp[0].amount,
          feeTypeCode: feeTypesDetails.displayName,
        };
        feesBreakUp.push(obj);
      }
      let obj = {
        demandNote: oneLedger,
        guardianDetails: guardianDetails,
        studentDetails: studentDetails,
        studentFeeMapDetails: studentFeeMapDetails,
        pending: studentFeeMapDetails.pending,
        paid: studentFeeMapDetails.paid,
        feeDetails: oneLedger.data.feesBreakUp,
        feesBreakUp: feesBreakUp,
      };
      feeLedgerData.push(obj);
    }
    res.status(200).json(feeLedgerData);
  }
};
