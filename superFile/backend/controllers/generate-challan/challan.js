const mongoose = require("mongoose");
const { createDatabase } = require("../../utils/db_creation");
const orgListSchema = require("../../models/orglists-schema");
const { BlobServiceClient } = require("@azure/storage-blob");
const moment = require("moment");
const challanCollectionName = "challandetails";
const challanSchema = require("./challan-schema");
const { createHtml } = require("./challan-html");
const axios = require("axios");
const { sendEmail } = require("../emailController");
const { createEmailTemplate } = require("./demandNoteTemplate");
const { generateQrCode } = require("../qrCodeController");

exports.generateChallan = async function (challanGenerateData, demandId) {
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
    _id: challanGenerateData.orgId,
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    return {
      status: "failure",
      message: "Organization not found",
    };
  }
  let dbConnection = await createDatabase(String(orgData._id), orgData.connUri);
  let displayName = await getDisplayId(dbConnection);
  var createChallanPayload = {
    studentName: challanGenerateData.studentName,
    studentRegId: challanGenerateData.studentRegId,
    class: challanGenerateData.class,
    demandNoteId: demandId,
    createdAt: moment().toISOString(),
    challanGeneratedDate: moment().toISOString(),
    orgId: challanGenerateData.orgId,
    emailCommunicationRefIds: challanGenerateData.emailCommunicationRefIds,
    feesBreakUp: challanGenerateData.data.feesBreakUp,
    displayName: displayName,
  };
  let qrCod = await generateQrCode(
    `https://devfeecollection.zenqore.com/#/bldeaps/challan?orgId=${challanGenerateData.orgId}&id=${displayName}`
  );
  const connectChallanModel = dbConnection.model(
    `${challanCollectionName}`,
    challanSchema
  );
  try {
    var createNewChallan = new connectChallanModel(createChallanPayload);
    createNewChallan.save();
    var createPrefilledHtml = await createHtml(createChallanPayload, qrCod);
    var createPayload = { html: createPrefilledHtml };
    axios
      .post(`${process.env.externalServer}?type=challan`, createPayload)
      .then(async (resp) => {
        const blobName = resp.data.data;
        const blobServiceClient = BlobServiceClient.fromConnectionString(
          process.env.AZURE_STORAGE_CONNECTION_STRING
        );
        const containerClient = blobServiceClient.getContainerClient(
          process.env.containerName
        );
        const blobClient = await containerClient.getBlobClient(blobName);
        const settingsSchema = mongoose.Schema({}, { strict: false });
        const settingsModel = dbConnection.model(
          "settings",
          settingsSchema,
          "settings"
        );
        const orgSettings = await settingsModel.find({});
        let orgDetails = orgSettings[0]._doc;
        let templatePayload = {
          orgDetails: orgDetails,
          demandPayload: challanGenerateData,
          demandId: demandId,
        };
        var emailTemplate = await createEmailTemplate(templatePayload);
        var sendToEmail = await sendEmail(
          orgDetails.emailServer[0].emailServer,
          challanGenerateData.emailCommunicationRefIds,
          orgDetails.emailServer[0].emailAddress,
          "ZQ EDU-Demand Note",
          emailTemplate,
          resp.data.file
        );
        centralDbConnection.close();
        dbConnection.close();
      })
      .catch((err) => {
        centralDbConnection.close();
        dbConnection.close();
        return err;
      });
  } catch (err) {
    return err;
  } finally {
  }
};

async function getDisplayId(dbConnection) {
  const connectChallanModel = dbConnection.model(
    `${challanCollectionName}`,
    challanSchema
  );
  var getDatas = [];
  var transType = "";
  getDatas = await connectChallanModel.find({});
  transType = "CHALLAN";
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
    if (el["displayName"]) {
      let filStr = el["displayName"].split("_");
      let typeStr = filStr[0];
      let typeYear = filStr[1];
      if (typeStr == transType && typeYear == finYear) {
        check = true;
        dataArr.push(el["displayName"]);
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
  return finalVal;
}
