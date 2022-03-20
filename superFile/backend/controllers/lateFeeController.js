const settingsSchema = require("../models/settings/feesetting");
const { createDatabase } = require("../utils/db_creation");
const orgListSchema = require("../models/orglists-schema");
const mongoose = require("mongoose");
const feeplanschema = require("../models/feeplanModel");
const StudentSchema = require("../models/studentModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const GuardianSchema = require("../models/guardianModel");
const ReminderSchema = require("../models/reminderModel");
// const feeplanschema = require("../models/feeplanModel");
const feeplanInstallmentschema = require("../models/feeplanInstallment");
module.exports.enableDisabeleLateFee = async (req, res) => {
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
  dbConnectionp = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  const settingsModel = dbConnectionp.model(
    "settings",
    settingsSchema,
    "settings"
  );

  const orgSettings = await settingsModel.find({});
  let orgDetails = orgSettings[0]._doc;
  if (orgDetails.lateFees.status.toLowerCase() == "active") {
    await settingsModel.updateOne(
      { _id: orgDetails_id },
      { $set: { "lateFees.status": "Inactive" } }
    );
  } else if (orgDetails.lateFees.status.toLowerCase() == "inactive") {
    await settingsModel.updateOne(
      { _id: orgDetails_id },
      { $set: { "lateFees.status": "Active" } }
    );
  }
};

module.exports.calculateLateFee = async (req, res) => {
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
  dbConnectionp = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  const settingsModel = dbConnectionp.model(
    "settings",
    settingsSchema,
    "settings"
  );

  const orgSettings = await settingsModel.find({});
  let orgDetails = orgSettings[0]._doc;
  if (orgDetails.lateFees.status.toLowerCase() == "active") {
    await settingsModel.updateOne(
      { _id: orgDetails_id },
      { $set: { "lateFees.status": "Inactive" } }
    );
  } else if (orgDetails.lateFees.status.toLowerCase() == "inactive") {
    await settingsModel.updateOne(
      { _id: orgDetails_id },
      { $set: { "lateFees.status": "Active" } }
    );
  }
};

module.exports.calculateLateFee = async (req, res) => {
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
  dbConnectionp = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  const settingsModel = dbConnectionp.model(
    "settings",
    settingsSchema,
    "settings"
  );

  const orgSettings = await settingsModel.find({});
  let orgDetails = orgSettings[0]._doc;
  if (orgDetails.lateFees.status.toLowerCase() == "active") {
    await settingsModel.updateOne(
      { _id: orgDetails_id },
      { $set: { "lateFees.status": "Inactive" } }
    );
  } else if (orgDetails.lateFees.status.toLowerCase() == "inactive") {
    await settingsModel.updateOne(
      { _id: orgDetails_id },
      { $set: { "lateFees.status": "Active" } }
    );
  }
};
