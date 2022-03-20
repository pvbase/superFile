const FeeManagerSchema = require("../models/feesManagerModel");
const { createDatabase } = require("../utils/db_creation");

exports.createFeesManager = async function (req, res) {
  var input = req.body

  let dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  var newFeeManagerDetails = new feeManagerSchema({
    displayName: input.displayName,
    title: input.title,
    description: input.description,
    feeTypeId: input.feeTypeId,
    programPlanId: input.programPlanId,
    reminderPlanId: input.reminderPlanId,
    paymentScheduleId: input.paymentScheduleId,
    concessionPlanId: input.concessionPlanId == null ? undefined : input.concessionPlanId,
    lateFeePlanId: input.lateFeePlanId,
    installmentPlanId: input.installmentPlanId == null ? undefined : input.installmentPlanId,
    feeDetails: {
      units: null,
      perUnitAmount: null,
      totalAmount: input.feeDetails.totalAmount,
    },
    status: input.status === "active" ? 1 : 0,
    createdBy: input.createdBy,
  })


  // let inputData = req.body;
  // let dbConnection = await createDatabase("admin", req.headers.resource);
  // let feeManagerModel = dbConnection.model("feesManager", FeeManagerSchema);
  // if (
  //   !inputData.displayName ||
  //   !inputData.title ||
  //   !inputData.types ||
  //   !inputData.feeDetails
  // ) {
  //   res.status(404).json({
  //     status: "failed",
  //     message: "Please provide all required parameters.",
  //     type: "error",
  //   });
  // } else {
  //   var newFeeManagerDetails = new feeManagerModel({
  //     displayName: inputData.displayName,
  //     title: inputData.title,
  //     description: inputData.description,
  //     types: inputData.types,
  //     feeDetails: inputData.feeDetails,
  //     default: inputData.default,
  //     createdBy: inputData.createdBy,
  //   });
  newFeeManagerDetails.save(function (err, data) {
    if (err) {
      return res.status(400).json({
        message: "Database error",
        type: "error",
        data: err,
      });
    } else {
      return res.status(201).json({
        message: "New Fee Manager added",
        type: "success",
        data: data,
      });
    }
  });
  // }
};

exports.getDisplayname = async function (req, res) {
  let dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  feeManagerSchema.find().then((data) => {
    console.log(data.length)
    return res.status(201).json({

      type: "success",
      data: `FM${data.length.toString().length == 1 ? "00" : data.length.toString().length == 2 ? "0" : ""}${Number(data.length) + 1}`,
    });

  })


}



exports.getFeeManagerDetails = async function (req, res) {
  let feeTypeId = req.params.id;
  let dbConnection = await createDatabase("admin", req.headers.resource);
  let feeManagerModel = dbConnection.model("feeManager", FeeManagerSchema);
  feeManagerModel.findById(feeTypeId, function (err, doc) {
    if (doc) {
      return res.status(200).json({ status: "success", data: doc });
    } else {
      return res
        .status(400)
        .json({ status: "failure", message: "Fee Manager does not exist" });
    }
  });
};

exports.showAllFeeManager = async function (req, res) {
  let dbConnection = await createDatabase("admin", process.env.database);
  let feeManagerModel = dbConnection.model("feeManager", FeeManagerSchema);
  feeManagerModel.find({}, function (err, doc) {
    if (doc) {
      return res.status(200).json({ status: "success", data: doc });
    } else {
      return res
        .status(400)
        .json({ status: "failure", message: "Fee Manager does not exist" });
    }
  });
};

exports.updatefeeManagerDetails = async function (req, res) {
  var input = req.body
  let dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  let displayname=await feeManagerSchema.find({displayName:input.displayName})
  let id = { _id: displayname[0]._id }
  var newFeeManagerDetails = {
    $set: {
      displayName: input.displayName,
      title: input.title,
      description: input.description,
      feeTypeId: input.feeTypeId,
      programPlanId: input.programPlanId,
      reminderPlanId: input.reminderPlanId,
      paymentScheduleId: input.paymentScheduleId,
      concessionPlanId: input.concessionPlanId == null ? undefined : input.concessionPlanId,
      lateFeePlanId: input.lateFeePlanId,
      installmentPlanId: input.installmentPlanId == null ? undefined : input.installmentPlanId,
      feeDetails: {
        units: null,
        perUnitAmount: null,
        totalAmount: input.feeDetails.totalAmount,
      },
      status: input.status === "active" ? 1 : 0,
      createdBy: input.createdBy,
    }
  }
  console.log(id)

  feeManagerSchema.updateOne(id, newFeeManagerDetails ,function (err, doc) {
    if (doc.nModified) {
      return res.status(200).json({
        status: "success",
        message: "Fee Manager data has been updated successfully",
      });
    } else {
      return res
        .status(400)
        .json({ status: "failure", message: "Nothing updated" });
    }
   })

  

};
//
// exports.deleteStudent = function (req, res) {
//   Role.deleteOne({ _id: req.params.id }).then(function (data) {
//     if (data.deletedCount)
//       return res.json("Role has been deleted successfully");
//     else return res.json({ message: "User does not exist" });
//   });
// };
