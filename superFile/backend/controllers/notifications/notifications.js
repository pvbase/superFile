const mongoose = require("mongoose");
const { createDatabase } = require("../../utils/db_creation");
const notificationSchema = require("./notification-schema");
const notifiyCollectionName = "notifications";
const orgListSchema = require("../../models/orglists-schema");
const { commonPostNotification } = require("./notification-common");
const { generateChallan } = require("../generate-challan/challan");

module.exports.getNotifications = async (req, res) => {
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
    const connectNotifiyCol = await dbConnection.model(
      `${notifiyCollectionName}`,
      notificationSchema
    );
    let noOfPendingView = 0;
    let noOfReadStatus = 0;
    connectNotifiyCol.find(async (err, results) => {
      let sendResults = results.filter((x) => {
        return x._doc.clearStatus === false;
      });
      if (results.length === 0) {
        res.send({
          status: "success",
          message: "success",
          data: {
            orgId: req.body.orgId,
            result: sendResults.reverse(),
            viewStatus: noOfPendingView,
            readStatus: noOfReadStatus,
          },
        });
        centralDbConnection.close();
        dbConnection.close();
      } else {
        results.forEach((dataOne, i) => {
          if (dataOne._doc.viewStatus === false) {
            noOfPendingView = noOfPendingView + 1;
          }
          if (dataOne._doc.readStatus === false) {
            noOfReadStatus = noOfReadStatus + 1;
          }
          if (results.length - 1 === i) {
            res.send({
              status: "success",
              message: "success",
              data: {
                orgId: req.body.orgId,
                result: sendResults.reverse(),
                viewStatus: noOfPendingView,
                readStatus: noOfReadStatus,
              },
            });
            centralDbConnection.close();
            dbConnection.close();
          }
        });
      }
    });
  } catch (err) {
    res.send({
      status: "failed",
      message: "failed",
      data: { orgId: req.query.orgId, result: [] },
    });
    centralDbConnection.close();
    dbConnection.close();
  } finally {
  }
};

module.exports.postNotifications = async (req, res) => {
  let orgId = req.body.orgId;
  let title = req.body.title;
  let message = req.body.message;
  let status = req.body.status;
  const commonNotification = await commonPostNotification(
    orgId,
    status,
    title,
    message
  );
  res.send(commonNotification);
};

module.exports.putNotifications = async (req, res) => {
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
    centralDbConnection.close();
    dbConnection.close();
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  if (
    req.query.type !== undefined ||
    (req.query.type !== "" && req.query.orgId !== undefined) ||
    req.query.orgId !== ""
  ) {
    if (req.query.type.toLowerCase() === "viewall") {
      try {
        const connectNotifiyCol = dbConnection.model(
          `${notifiyCollectionName}`,
          { viewStatus: { type: Boolean } }
        );
        connectNotifiyCol.updateMany({ viewStatus: true }, (err, results) => {
          if (err) {
            res.send({
              status: "failed",
              message: "failed to update",
              data: { err: err },
            });
            centralDbConnection.close();
            dbConnection.close();
          } else {
            res.send({
              status: "success",
              message: "successfully updated",
              data: { results: results },
            });
            centralDbConnection.close();
            dbConnection.close();
          }
        });
      } catch (err) {
        res.send({
          status: "failed",
          message: "functional error",
          data: { err: err },
        });
        centralDbConnection.close();
        dbConnection.close();
      } finally {
      }
    } else if (req.query.type.toLowerCase() === "readall") {
      try {
        const connectNotifiyCol = dbConnection.model(
          `${notifiyCollectionName}`,
          { readStatus: { type: Boolean } }
        );
        connectNotifiyCol.updateMany({ readStatus: true }, (err, results) => {
          if (err) {
            res.send({
              status: "failed",
              message: "failed to update",
              data: { err: err },
            });
            centralDbConnection.close();
            dbConnection.close();
          } else {
            res.send({
              status: "success",
              message: "successfully updated",
              data: { results: results },
            });
            centralDbConnection.close();
            dbConnection.close();
          }
        });
      } catch (err) {
        res.send({
          status: "failed",
          message: "functional error",
          data: { err: err },
        });
        centralDbConnection.close();
        dbConnection.close();
      } finally {
      }
    }
    if (req.query.type.toLowerCase() === "readone") {
      try {
        const connectNotifiyCol = dbConnection.model(
          `${notifiyCollectionName}`,
          { readStatus: { type: Boolean } }
        );
        connectNotifiyCol.findByIdAndUpdate(
          mongoose.Types.ObjectId(req.query.notifyId),
          { $set: { readStatus: true } },
          { new: true },
          (err, results) => {
            if (err) {
              res.send({
                status: "failed",
                message: "failed to update",
                data: { err: err },
              });
              centralDbConnection.close();
              dbConnection.close();
            } else {
              res.send({
                status: "success",
                message: "successfully updated",
                data: { results: results },
              });
              centralDbConnection.close();
              dbConnection.close();
            }
          }
        );
      } catch (err) {
        res.send({
          status: "failed",
          message: "functional error",
          data: { err: err },
        });
        centralDbConnection.close();
        dbConnection.close();
      } finally {
      }
    } else if (req.query.type.toLowerCase() === "clearall") {
      try {
        const connectNotifiyCol = dbConnection.model(
          `${notifiyCollectionName}`,
          { clearStatus: { type: Boolean } }
        );
        connectNotifiyCol.updateMany({ clearStatus: true }, (err, results) => {
          if (err) {
            res.send({
              status: "failed",
              message: "failed to update",
              data: { err: err },
            });
            centralDbConnection.close();
            dbConnection.close();
          } else {
            res.send({
              status: "success",
              message: "successfully updated",
              data: { results: results },
            });
            centralDbConnection.close();
            dbConnection.close();
          }
        });
      } catch (err) {
        res.send({
          status: "failed",
          message: "functional error",
          data: { err: err },
        });
        centralDbConnection.close();
        dbConnection.close();
      } finally {
      }
    }
  } else {
    res.send({
      status: "failed",
      message: "Please provide type of operations to be handled",
      data: {},
    });
    centralDbConnection.close();
    dbConnection.close();
  }
};

// module.exports.getPdfData = async (req, res) => {
//     const createNewChallan = await generateChallan(req.body[0], "DN_2020-21_001")
//     res.send(createNewChallan);
// }
