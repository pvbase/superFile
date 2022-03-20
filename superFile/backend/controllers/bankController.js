const orgListSchema = require("../models/orglists-schema");
const { createDatabase } = require("../utils/db_creation");
const bankSchema = require("../models/bankModel");
const mongoose = require("mongoose");
exports.showAllBank = async function (req, res) {
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
  } else {
    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    // const bankSchema = mongoose.Schema({}, { strict: false });
    let bankModel = dbConnection.model("bankdetails", bankSchema);
    bankModel.find({}).then(function (data) {
      console.log("response", data);
      if (data) {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res.status(200).json({ success: true, data: data });
      } else {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res
          .status(400)
          .json({ success: false, message: "Bank does not exist" });
      }
    });
  }
};
