const orgListSchema = require("../models/orglists-schema");
const { createDatabase } = require("../utils/db_creation");
const programPlanSchema = require("../models/programPlanModel");
const FeeTypeSchema = require("../models/feeTypeModel");

async function createStructure(req, res) {
  let inputData = req.body;
  res.status(200).json({ success: true, data: inputData });
}

async function createProgramPlan(req, res) {
  let inputData = req.body;
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

    let programPlanModel = dbConnection.model(
      "programplans",
      programPlanSchema
    );
    // let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);

    let ppDisplayName = await getDisplayId(programPlanModel, "PP");
    var newProgramPlanDetails = new programPlanModel({
      displayName: ppDisplayName,
      fromDate: inputData.fromDate,
      toDate: inputData.toDate,
      academicYear: inputData.academicYear,
      title: inputData.title,
      description: inputData.description,
      createdBy: inputData.userId,
      status: { type: Number, default: 1 },
    });
    newProgramPlanDetails.save(function (err, data) {
      if (err) {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res.status(500).json({
          message: "Database error",
          success: false,
          Error: err,
        });
      }
      else {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res.status(200).json({
          message: "New Program Plan added",
          success: true,
          data: data,
        });
      }
    });
  }
}

async function createFeeTypes(req, res) {
  let inputData = req.body;
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

    let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);

    let ftDisplayName = await getDisplayId(feeTypeModel, "FT");
    var newFeeTypeDetails = new feeTypeModel({
      displayName: ftDisplayName,
      fromDate: inputData.fromDate,
      toDate: inputData.toDate,
      academicYear: inputData.academicYear,
      title: inputData.title,
      description: inputData.description,
      createdBy: inputData.userId,
      status: { type: Number, default: 1 },
    });
    newProgramPlanDetails.save(function (err, data) {
      if (err) {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res.status(500).json({
          message: "Database error",
          success: false,
          Error: err,
        });
      }
      else {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res.status(200).json({
          message: "New Program Plan added",
          success: true,
          data: data,
        });
      }
    });
  }
}

async function createFeeStructure(req, res) {
  let inputData = req.body;
  res.status(200).json({ success: true, data: inputData });
}

async function getDisplayId(model, type) {
  var getDatas = [];
  var transType = "";
  //   let rcptSchema = await dbConnection.model(
  //     "transactions",
  //     rcptModel,
  //     "transactions"
  //   );
  getDatas = await model.find({});

  transType = type;
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
  return finalVal;
}

module.exports = {
  createStructure: createStructure,
  createProgramPlan: createProgramPlan,
  createFeeTypes: createFeeTypes,
  createFeeStructure: createFeeStructure,
};
