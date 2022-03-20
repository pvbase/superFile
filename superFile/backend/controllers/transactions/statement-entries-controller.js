const mongoose = require("mongoose");
const { createDatabase } = require("../../utils/db_creation");
const orgListSchema = require("../../models/orglists-schema");
const statementEntriesSchema = require("../../models/statementEntries-Model");
const statementEntriesCollection = "statemententries";

const addStatement = async (req, res) => {
  let inputData = req.body;
  const { orgId } = req.params;
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
  const statementEntriesModel = dbConnection.model(
    statementEntriesCollection,
    statementEntriesSchema,
    statementEntriesCollection
  );
  inputData = inputData.map((item) => ({
    ...item,
    status: "notReconciled",
    transactionReferenceId: null,
  }));
  statementEntriesModel
    .insertMany(inputData)
    .then((data) => {
      res.status(200).send({
        status: "success",
        message: "Statements added successfully",
        data,
      });
      centralDbConnection.close() // new
      dbConnection.close() // new
    })
    .catch((err) => {
      res.status(500).send({
        status: "Failure",
        message: "Unable to add statement",
        data: err,
      });
      centralDbConnection.close() // new
      dbConnection.close() // new
    });
};

module.exports = {
  addStatement,
};
