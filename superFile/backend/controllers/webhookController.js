const orgListSchema = require("../models/orglists-schema");
const { createDatabase } = require("../utils/db_creation");
const webhookSchema = require("../models/webhookModel");

module.exports.getSignerWebhook = async (req, res) => {
  let orgId = "5fa8daece3eb1f18d4250e98";
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
    let webhookModel = dbConnection.model("webhook", webhookSchema);
    var newWebhookDetails = new webhookModel({
      data: req.body,
    });
    newWebhookDetails.save(function (err, data) {
      if (err) {
        centralDbConnection.close() // new
        dbConnection.close() // new
        return res.status(500).json({
          message: "Database error",
          success: false,
          Error: err,
        });
      } else {
        if (req.body.event == "refund.processed") {
        }
      }

      // return res.status(200).json({
      //   message: "New Webhook added",
      //   success: true,
      //   data: data,
      // });
    });
  }
  // console.log(event.body);
};
