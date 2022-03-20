const mongoose = require("mongoose");
const { createDatabase } = require("../../utils/db_creation");
const moment = require("moment");
const franchisesCollectionName = "franchises";
const orgListSchema = require("../../models/orglists-schema");
const franchiseNew = require("./franchise-schema");

module.exports.getFranchisesData = async (req, res) => {
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    l_mongoDbUrl
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
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  let connectFranchiseCollection = dbConnection.model(
    `${franchisesCollectionName}`,
    franchiseNew
  );
  connectFranchiseCollection.find(async (error, results) => {
    console.log(results);
    let paginated = await Paginator(results, req.query.page, req.query.limit);
    res.status(200).json(paginated);
    centralDbConnection.close();
    dbConnection.close()
  });
};

module.exports.postFranchisesData = async (req, res) => {
  let payloadData = req.body;
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
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  try {
    let connectFranchiseCollection = dbConnection.model(
      `${franchisesCollectionName}`,
      franchiseNew
    );
    let createPayload = new connectFranchiseCollection(payloadData);
    createPayload.save();
    res.send({
      status: true,
      message: "Added successfully",
    });
    centralDbConnection.close();
    dbConnection.close();
  } catch (err) {
    res.send({
      status: false,
      message: "error",
    });
    centralDbConnection.close();
    dbConnection.close()
  } finally {
  }
};

module.exports.putFranchisesData = async (req, res) => { };

module.exports.generateFranchisesId = async (req, res) => {
  // Generate new Id for displayName
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
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  const schemaDetails = mongoose.Schema({}, { strict: false });
  const connectChallanModel = dbConnection.model(
    `${franchisesCollectionName}`,
    schemaDetails
  );
  connectChallanModel.find({}, (error, results) => {
    let type = "FRN";
    if (results.length < 9) {
      let id = "00";
      res.status(200).send({ displayName: `${type}${id}${results.length + 1}` });

      centralDbConnection.close();
      dbConnection.close()
    }
    else {
      let id = "0";
      res.status(200).send({ displayName: `${type}${id}${results.length + 1}` });
      centralDbConnection.close();
      dbConnection.close()
    }
  });
};

// paginator function
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
