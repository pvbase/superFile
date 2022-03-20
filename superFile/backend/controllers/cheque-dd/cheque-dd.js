const mongoose = require("mongoose");
const { createDatabase } = require("../../utils/db_creation");
const ChequeSchema = require("./cheque-dd-schema");
const moment = require("moment");
const orgListSchema = require("../../models/orglists-schema");
const chequeCollectionName = "cheques";

// get cheque details
module.exports.getChequeDetails = async (req, res) => {
  var campusData = req.query.campusId;
  var pageData = Number(req.query.page);
  var perPageData = Number(req.query.perPage);

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
    let chequesModel = dbConnection.model(
      `${chequeCollectionName}`,
      ChequeSchema
    );
    chequesModel.find({}, async (error, result) => {
      let finalArr = [];
      for (oneData of result) {
        let obj = {
          createdAt: oneData.createdAt,
          chequeNo: oneData.chequeNo,
          chequeDate: oneData.chequeDate,
          bankName: oneData.bankName,
          totalAmount: oneData.totalAmount,
          collectedBy: oneData.collectedBy,
          collectedUserName:
            oneData.collectedUserName === undefined
              ? ""
              : oneData.collectedUserName,
          collectedOn: oneData.collectedOn,
          transactionRefId: oneData.transactionRefId,
          status:
            oneData.status.toLowerCase() != "reconciled"
              ? (
                (new Date() - new Date(oneData.chequeDate)) /
                (1000 * 60 * 60 * 24)
              ).toFixed(0) > 2
                ? "Long Pending"
                : "Pending"
              : oneData.status,
          daysSinceCollected: (
            (new Date() - new Date(oneData.chequeDate)) /
            (1000 * 60 * 60 * 24)
          ).toFixed(0),
        };
        finalArr.push(obj);
      }
      let filterPagination = Paginator(finalArr, pageData, perPageData);
      res.status(200).json({ success: true, data: filterPagination });
      centralDbConnection.close();
      dbConnection.close();
    });
  } catch (err) {
    res.send({ status: "failed", data: [] });
    centralDbConnection.close();
    dbConnection.close();
  } finally {
  }
};

// Add Cheque Details
exports.recordChallanTransaction = async function (getDetail, orgId) {
  var getTotalAmount = getDetail.data.feesBreakUp.reduce(
    (acc, item) => acc + Number(item.amount),
    0
  );
  let createPayload = {
    chequeNo: getDetail.data.modeDetails.transactionId,
    chequeDate: moment(getDetail.data.modeDetails.instrumentDate).toISOString(),
    bankName: getDetail.data.modeDetails.bankName,
    totalAmount: getTotalAmount.toFixed(2),
    collectedBy: getDetail.campusId,
    collectedUserName: getDetail.userName,
    collectedOn: moment().toISOString(),
    transactionRefId: getDetail.displayName,
    createdAt: moment().toISOString(),
    status: "Pending",
  };
  console.log(createPayload);
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
  try {
    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    let ChallanConnection = await dbConnection.model(
      `${chequeCollectionName}`,
      ChequeSchema
    );
    let collectData = await new ChallanConnection(createPayload);
    collectData.save();
    centralDbConnection.close();
    dbConnection.close();

  } catch (err) {
    centralDbConnection.close();
    dbConnection.close();
    return "failed";
  } finally {
  }
};

// Edit cheque details
exports.editChequeDetails = async function (orgId, chqId, status) {
  editChequeDetails(orgId, chqId, status);
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

// edit cheque test (local common fun)
async function editChequeDetails(orgId, chqId, status) {
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
  var myquery = { chequeNo: chqId };
  var newvalues = { $set: { status: status } };
  dbConnection
    .collection(`${chequeCollectionName}`)
    .updateOne(myquery, newvalues, function (err, result) {
      if (err) throw err;
      console.log("1 document updated", result);
    });
  centralDbConnection.close();
  dbConnection.close();
}

// To update cheque collection status
// editChequeDetails(orgId, chequeNo, status)
