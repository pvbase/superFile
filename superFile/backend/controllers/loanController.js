const Loan = require("../models/loanModel");
const orgListSchema = require("../models/orglists-schema");
const { createDatabase } = require("../utils/db_creation");
const bankSchema = require("../models/bankModel");
exports.createLoan = async function (req, res) {
  let inputData = req.body;
  if (
    !inputData.provider ||
    !inputData.displayName ||
    !inputData.bankId ||
    !inputData.orgId ||
    !inputData.createdBy
  ) {
    res.status(404).json({
      success: false,
      message: "Please provide all required parameters.",
      type: "error",
    });
  } else {
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
      _id: inputData.orgId,
    });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(500).json({
        success: false,
        message: "Organization not found",
      });
    }

    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    let loanModel = dbConnection.model("loans", Loan);
    var newLoanDetails = new loanModel({
      displayName: inputData.displayName,
      provider: inputData.provider,
      campusId: inputData.campusId,
      bankId: inputData.bankId,
      createdBy: inputData.createdBy,
    });
    newLoanDetails.save(function (err, data) {
      if (err) {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res.status(400).json({
          success: false,
          message: "Database error",
          Erro: err,
        });
      }
      else {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res.status(200).json({
          message: "New Loan added",
          success: true,
          data: data,
        });
      }
    });
  }
};

exports.getLoanDetails = async function (req, res) {
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
    res.status(500).send({
      success: false,
      message: "Organization not found",
    });
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  let loanModel = dbConnection.model("loans", Loan);
  loanModel.findOne({ _id: req.params.id }, { __v: 0 }).then(function (data) {
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
        .json({ success: false, message: "Loan does not exist" });
    }
  });
};

exports.showAllLoan = async function (req, res) {
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
  let loanModel = dbConnection.model("loans", Loan);
  loanModel
    .find({}, { __v: 0 })
    .sort("-createdAt")
    .then(async function (data) {
      if (data) {
        var result = [];
        let bankModel = dbConnection.model("bankdetails", bankSchema);
        for (one of data) {
          let bankId = one.bankId;
          var bankDetails = await bankModel.findOne({
            _id: bankId,
          });
          let obj = {
            status: one.status,
            _id: one._id,
            displayName: one.displayName,
            provider: one.provider,
            bankDetails: bankDetails,
            campusId: one.campusId,
            createdBy: one.createdBy,
            createdAt: one.createdAt,
            updatedAt: one.updatedAt,
          };
          result.push(obj);
        }
        let paginated = await Paginator(
          result,
          req.query.page,
          req.query.limit
        );
        res.status(200).json(paginated);
        centralDbConnection.close() // new
        dbConnection.close() // new
      } else {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res
          .status(400)
          .json({ success: false, message: "Loan does not exist" });
      }
    });
};

exports.updateLoanDetails = async function (req, res) {
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
  let loanModel = dbConnection.model("loans", Loan);
  loanModel.update({ _id: req.params.id }, req.body).then(function (data) {
    if (data.nModified) {
      centralDbConnection.close() // new
      dbConnection.close() // new
      return res.status(200).json({
        success: true,
        message: "Loan data has been updated successfully",
      });
    }
    else {
      centralDbConnection.close() // new
      dbConnection.close() // new
      return res
        .status(400)
        .json({ success: false, message: "Nothing updated" });
    }
  });
};

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
