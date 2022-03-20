const axios = require("axios");
const taskSchema = require("../models/tasksModel");
const orgListSchema = require("../models/orglists-schema");
const { createDatabase } = require("../utils/db_creation");
async function createTasks(req, res) {
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
    let taskModel = dbConnection.model("tasks", taskSchema);

    var newTaskDetails = new taskModel({
      taskId: inputData.taskId,
      title: inputData.title,
      description: inputData.description,
      data: inputData.data,
      action: inputData.action,
      status: inputData.status,
      type: inputData.type,
      dueDate: inputData.dueDate,
      assignedTo: inputData.assignedTo,
    });
    newTaskDetails.save(function (err, data) {
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
          message: "New Tasks added",
          success: true,
          data: data,
        });
      }
    });
  }
}
async function getTaskDetails(req, res) {
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
  let taskModel = dbConnection.model("tasks", taskSchema);
  taskModel.findOne({ _id: req.params.id }, { __v: 0 }).then(function (data) {
    if (data) {
      centralDbConnection.close() // new
      dbConnection.close() // new
      return res.status(200).json({ success: true, data: data });
    }
    else {
      centralDbConnection.close() // new
      dbConnection.close() // new
      return res
        .status(400)
        .json({ success: false, message: "Tasks does not exist" });
    }
  });
}

async function getTasks(req, res) {
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
  let taskModel = dbConnection.model("tasks", taskSchema);
  taskModel
    .find({}, { __v: 0 })
    .sort("-createdAt")
    .then(async function (data) {
      if (data) {
        let paginated = await Paginator(data, req.query.page, req.query.limit);
        res.status(200).json(paginated);
        centralDbConnection.close() // new
        dbConnection.close() // new
      } else {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res
          .status(404)
          .json({ success: false, message: "Tasks does not exist" });
      }
    });
}
async function getTaskDisplayId(req, res) {
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
  let taskModel = dbConnection.model("tasks", taskSchema);
  var getDatas = [];
  var transType = "";
  //   let rcptSchema = await dbConnection.model(
  //     "transactions",
  //     rcptModel,
  //     "transactions"
  //   );
  getDatas = await taskModel.find({});

  transType = "TASK";
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
    if (el["taskId"]) {
      let filStr = el["taskId"].split("_");
      let typeStr = filStr[0];
      let typeYear = filStr[1];
      if (typeStr == transType && typeYear == finYear) {
        check = true;
        dataArr.push(el["taskId"]);
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
  res.status(200).json({ success: true, taskId: finalVal });
  centralDbConnection.close() // new
  dbConnection.close() // new
}

async function updateTasks(req, res) {
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
  let taskModel = dbConnection.model("tasks", taskSchema);
  taskModel.update({ _id: req.params.id }, req.body).then(function (data) {
    if (data.nModified) {
      centralDbConnection.close() // new
      dbConnection.close() // new
      return res.status(200).json({
        success: true,
        message: "Tasks data has been updated successfully",
      });
    }
    else {
      centralDbConnection.close() // new
      dbConnection.close() // new
      return res.json({ success: false, message: "Nothing updated" });
    }
  });
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
  getTasks: getTasks,
  getTaskDetails: getTaskDetails,
  updateTasks: updateTasks,
  createTasks: createTasks,
  getTaskDisplayId: getTaskDisplayId,
};
