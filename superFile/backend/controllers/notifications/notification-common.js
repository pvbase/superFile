const mongoose = require("mongoose");
const { createDatabase } = require("../../utils/db_creation");
const notificationSchema = require("./notification-schema");
const notifiyCollectionName = "notifications";
const orgListSchema = require("../../models/orglists-schema");
const PubNub = require("pubnub");
const moment = require("moment");

var pubnubSecretKey = {
  subscribeKey: "sub-c-982dbaba-1d98-11ea-8c76-2e065dbe5941",
  publishKey: "pub-c-87ae3cc8-8d0a-40e0-8e0f-dbb286306b21",
  secretKey: "sec-c-ODRhYWJjZmYtZGQ0MS00ZjY2LTkzMGMtY2VhNGZhYjYzOWRi",
};

exports.commonPostNotification = async function (orgId, status, title, message) {
  const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
  const orgData = await orgListModel.findOne({ _id: orgId });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    return {
      status: "failure",
      message: "Organization not found",
    };
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  const connectNotification = dbConnection.model(`${notifiyCollectionName}`, notificationSchema);

  try {
    // d = new Date();
    // utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    // nd = new Date(utc + (3600000 * + 5.5));
    let getDateForIst = moment().toISOString();
    let messageData = {
      orgId: orgId,
      title: title,
      message: message,
      status: status,
    };
    let actionData = fileList.filter((x) => {
      return x.title == title;
    });
    messageData.action = actionData[0];
    messageData.createdAt = getDateForIst;
    let createObject = new connectNotification(messageData);
    createObject.save();
    const pubnub = new PubNub(pubnubSecretKey);
    const pubnubResult = pubnub.publish({
      channel: [`${messageData.orgId}`],
      message: {
        title: "new message",
        description: createObject,
      },
    });
    return {
      status: "success",
      message: "success",
      data: {},
    };
  } catch (err) {
    return {
      status: "failed",
      message: "failed",
      data: messageData,
      error: err,
    };
  } finally {
  }
};

var fileList = [
  {
    label: "demand note",
    title: "transaction_demandNote",
  },
  {
    label: "collect payment",
    title: "transaction_collectPayment",
  },
  {
    label: "send receipt",
    title: "transaction_sendReceipt",
  },
  {
    label: "scholarships",
    title: "transactions_scholarships",
  },
  {
    label: "loans",
    title: "transactions_loans",
  },
  {
    label: "refund",
    title: "transactions_refund",
  },
  {
    label: "cancel transaction",
    title: "transactions_cancelTransaction",
  },
  {
    label: "tasks",
    title: "tasks",
  },
  {
    label: "reconciliation",
    title: "reconciliation",
  },
  {
    label: "fee types",
    title: "fee_configuration_feeTypes",
  },
  {
    label: "fee structure",
    title: "fee_configuration_feeStructure",
  },
  {
    label: "fee inventory",
    title: "fee_configuration_feeInventory",
  },
  {
    label: "student fee mapping",
    title: "fee_configuration_studentFeeMapping",
  },
  {
    label: "users",
    title: "setup_users",
  },
  {
    label: "students",
    title: "setup_students",
  },
  {
    label: "programplan",
    title: "setup_programPlan",
  },
  {
    label: "payment schedule",
    title: "setup_paymentSchedule",
  },
  {
    label: "reminders",
    title: "setup_reminders",
  },
  {
    label: "installments",
    title: "setup_installments",
  },
  {
    label: "late fees",
    title: "setup_lateFees",
  },
  {
    label: "categories",
    title: "setup_categories",
  },
  {
    label: "concessions",
    title: "setup_concessions",
  },
  {
    label: "scholarships",
    title: "setup_scholarships",
  },
  {
    label: "loans",
    title: "setup_loans",
  },
  {
    label: "settings",
    title: "setup_settings",
  },
];
