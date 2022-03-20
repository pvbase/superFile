const StudentSchema = require("../models/studentModel");
const { decryption } = require("./cryptoController");
const { createDatabase } = require("../utils/db_creation");
const masterUploadSchema = require("../models/masterUploadModel");
const settingsSchema = require("../models/settings/feesetting");
const settingsSchemawithversion = require("../models/settings-model");
var _ = require("lodash");
// var moment = require("moment");
const moment = require('moment-timezone')
const CryptoJS = require('crypto-js');

const csvtojson = require("csvtojson");
const instituteDetailsSchema = require("../models/instituteDetailsModel");
const FeeTypeSchema = require("../models/feeTypeModel");
// const StudentSchema = require("../models/studentModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const statecodes = require("../helper_jsons/stateCodes");
const FeeManagerSchema = require("../models/feesManagerModel");
const FeeStructureSchema = require("../models/feeStructureModel");
// const { getDisplayId } = require("./displayIdController");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
const paymentScheduleSchema = require("../models/paymentScheduleModel");
const PaymentScheduleSchema = require("../models/paymentScheduleModel");
const ReminderScheduleSchema = require("../models/reminderModel");
const GuardianSchema = require("../models/guardianModel");
// const OrgListSchema = require("../models/orglists-schema");
const CategorySchema = require("../models/categoryModel");
const LateFeesSchema = require("../models/lateFeeModel");
const LateFeeSchema = require("../models/lateFeeModel");

const ConcessionSchema = require("../models/concessionModel");
const InstallmentSchema = require("../models/installmentModel");
const bankDetailsSchema = require("../models/bankModel");
const templateversion = require("../config/templateVersion");
const transactionsSchema = require("../models/transactionsModel");
const feesLedgerSchema = require("../models/feesLedgerModel");
const journeysSchema = require("../models/journeyModel");
const mongoose = require("mongoose");
const orgListSchema = require("../models/orglists-schema");
const feeplanschema = require("../models/feeplanModel");
const feeplanInstallmentschema = require("../models/feeplanInstallment");
const campusSchema = require("../models/campusModel");
const {
  demandNoteTemplate,
} = require("../utils/helper_functions/templates/demand-note-email-template");
const ApplicationSchema = require("../models/ken42/applicationModel");
const tinyUrl =
  "https://cwpjc8rnb2.execute-api.ap-south-1.amazonaws.com/prod/tiny/shorturl";
// const {createOtcPayment, getStudentFeesDetails} = require("./transactions/otcController");
var AWS = require("aws-sdk");
let axios = require("axios");
const PubNub = require("pubnub");
var jsonDiff = require("json-diff");
var url = require("url");
const { sendEmail } = require("./emailController");
const sgMail = require("@sendgrid/mail");

var _ = require("lodash");
const {
  receiptTemplate,
  receiptPdf,
} = require("../utils/helper_functions/templates/receipt-email-template");
const {
  receiptVkgiPdf,
  receiptVkgiTemplate,
} = require("../utils/helper_functions/templates/vkgiReceiptTemplate");
const { getBlobData } = require("./azureController");
const { generateQrCode } = require("./qrCodeController");
const {
  feePaymentTemplate,
} = require("../utils/helper_functions/templates/feePaymentSuccess");
const { BlobServiceClient } = require("@azure/storage-blob");
var storage = require("@azure/storage-blob");
const programPlanSchema = require("../models/programPlanModel");
const reconciliationTransactionsSchema = require("../models/reconciliationTransactionsModel");
const {
  commonPostNotification,
} = require("./notifications/notification-common");
const { recordChallanTransaction } = require("./cheque-dd/cheque-dd");

const { processDFCR } = require('./cron/dfcr')

const fs = require("fs");
var pubnub = new PubNub({
  subscribeKey: "sub-c-40815e58-bc97-11eb-9c3c-fe487e55b6a4",
  publishKey: "pub-c-2d5b6cbe-9af0-4733-be3e-90aad2cd9485",
  secretKey: "sec-c-ZDQ2OTI0MzAtMDllMS00NTQ2LTg5NmQtMDM4YzU3OTAxZDhj",
  ssl: false,
});
//Multer configuration
var aws_region = "us-east-1";

awsCredentials = {
  accessKeyId: "AKIAR6HU7QOXBS76HGOC",
  secretAccessKey: "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",
  region: aws_region,
};
AWS.config.update(awsCredentials);

var pinpoint = new AWS.Pinpoint();
var pinpointEmail = new AWS.PinpointEmail();

const S3 = new AWS.S3({
  region: process.env.region,
  aws_access_key_id: process.env.accessKeyId,
  aws_secret_access_key: process.env.secretAccessKey,
});

module.exports.uploadMaster = async (req, res) => { };
module.exports.getFileRecords = async (req, res) => {
  console.log("connuri", req.headers.resource);
  console.log("sdfsfd", req.headers);
  console.log("orgid", req.headers.orgId);
  let dbConnectionp = await createDatabase(
    req.headers.orgId,
    req.headers.resource
  );
  console.log("dbConnectionp", dbConnectionp);
  let masterUploadModel = dbConnectionp.model(
    "masteruploads",
    masterUploadSchema
  );
  masterUploadModel.find({}, async function (err, uplloaddata) {
    console.log(uplloaddata);
    if (err) {
      await dbConnectionp.close();
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.status(500).send({
        status: "failure",
        Message: "could not get records",
        cause: err.toString(),
      });
    } else if (uplloaddata.length == 0) {
      await dbConnectionp.close();
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.status(200).send({
        status: "success",
        Message: "Get uploaded records",
        data: uplloaddata,
      });
    } else {
      await dbConnectionp.close();
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.status(200).send({
        status: "success",
        Message: "Get uploaded records",
        data: uplloaddata,
      });
    }
  });
};
module.exports.getUserProfileInfo = async (req, res) => { };

module.exports.nodeCleanup = async (req, res) => {
  let dbConnectionp = await createDatabase(
    req.headers.orgId,
    req.headers.resource
  );
  let journeyModel = dbConnection.model("journeys", journeysSchema);
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let feeMapModel = dbConnectionp.model("studentFeesMap", StudentFeeMapSchema);
  let guardianModel = dbConnectionp.model("guardian", GuardianSchema);
  let transactionModel = dbConnectionp.model(
    "transactions",
    transactionsSchema
  );
  let feeLedgerModel = dbConnectionp.model("feeledgers", feesLedgerSchema);
  let data = req.body.students;
  for (i = 0; i < data.length; i++) {
    let stdata = await studentModel.findOne({ regId: data[i] });
    let deleteguard = await guardianModel.deleteOne({
      _id: stdata._doc.guardianDetails[0],
    });
    let deletemap = await feeMapModel.deleteOne({ studentId: stdata._doc._id });
    let deletetran = await transactionModel.deleteMany({
      studentId: stdata._doc._id,
    });
    let deleteled = await feeLedgerModel.deleteMany({
      studentId: stdata._doc._id,
    });
    let deletejur = await journeyModel.deleteMany({
      studentId: stdata._doc._id,
    });
    let deletestd = await studentModel.deleteOne({ _id: stdata._doc._id });
    console.log(
      deleteguard,
      deletemap,
      deletetran,
      deleteled,
      deletejur,
      deletestd
    );
    if (i + 1 == data.length) {
      console.log("all data deleted");
    }
  }
};
module.exports.parentDetails = async (req, res) => {
  let dbConnectionp;
  let centralDbConnection;
  // try {
  let spliturl = req.originalUrl.split("/");
  let namaspace;
  for (let i = 0; i < spliturl.length; i++) {
    if (spliturl[i] == "edu") {
      namaspace = spliturl[i - 1];
      // namaspace =  "vkgi"
    }
  }
  centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  // centralDbConnection = await createDatabase(
  //   `usermanagement-${process.env.stage}`,
  //   process.env.central_mongoDbUrl
  // );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: mongoose.Types.ObjectId(req.body.orgId),
  });
  // var mongourl = await decryption(orgData.connUri);
  // dbConnectionp = await createDatabase(String(orgData._id), mongourl);
  dbConnectionp = await createDatabase(
    String(orgData._id),
    orgData.connUri
  );
  // dbConnectionp = await createDatabase(orgData._doc._id.toString(), orgData._doc.connUri);
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
  let studata = await studentModel.findOne({ rollNumber: req.params.studentId })
  let guardianData = await guardianModel.findOne({ _id: studata._doc.guardianDetails[0] })
  if (guardianData._doc.fatherDetails) {
    var bytes = CryptoJS.AES.decrypt(guardianData._doc.fatherDetails, req.body.orgId);
    guardianData._doc.fatherDetails = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }
  if (guardianData._doc.motherDetails) {
    var bytes = CryptoJS.AES.decrypt(guardianData._doc.motherDetails, req.body.orgId);
    guardianData._doc.motherDetails = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }
  if (guardianData._doc.guardianDetails) {
    var bytes = CryptoJS.AES.decrypt(guardianData._doc.guardianDetails, req.body.orgId);
    guardianData._doc.guardianDetails = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  }

  // if(guardianData._doc.PIIUsageFlag == true){
  console.log(guardianData)
  let guardupdate1
  let guardupdate2
  let guardupdate3
  if (req.body.fatherDetails && req.body.fatherDetails.bankDetails && req.body.fatherDetails.bankDetails.isPrimary) {
    if (guardianData._doc.fatherDetails && guardianData._doc.fatherDetails.contacts && guardianData._doc.fatherDetails.contacts.length > 0) {
      req.body.fatherDetails.contacts = guardianData._doc.fatherDetails.contacts
    } else {
      req.body.fatherDetails.contacts = [];
    }
    if (!req.body.fatherDetails.contacts.includes(req.params.studentId)) {
      req.body.fatherDetails.contacts.push(req.params.studentId);
    }
    if (
      guardianData._doc.motherDetails &&
      guardianData._doc.motherDetails.contacts &&
      guardianData._doc.motherDetails.contacts.length > 0
    ) {
      req.body.motherDetails.contacts =
        guardianData._doc.motherDetails.contacts;
    } else {
      req.body.motherDetails.contacts = [];
    }
    if (!req.body.motherDetails.contacts.includes(req.params.studentId)) {
      req.body.motherDetails.contacts.push(req.params.studentId);
    }
    if (
      guardianData._doc.guardianDetails &&
      guardianData._doc.guardianDetails.contacts &&
      guardianData._doc.guardianDetails.contacts.length > 0
    ) {
      req.body.guardianDetails.contacts =
        guardianData._doc.guardianDetails.contacts;
    } else {
      req.body.guardianDetails.contacts = [];
    }
    if (!req.body.guardianDetails.contacts.includes(req.params.studentId)) {
      req.body.guardianDetails.contacts.push(req.params.studentId);
    }
    // req.body.fatherDetails.contact = req.params.studentId;
    var cipherfatherDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.fatherDetails), req.body.orgId);
    cipherfatherDetails = cipherfatherDetails.toString();
    var ciphermotherDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.motherDetails), req.body.orgId);
    ciphermotherDetails = ciphermotherDetails.toString();
    var cipherguardianDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.guardianDetails), req.body.orgId);
    cipherguardianDetails = cipherguardianDetails.toString();
    guardupdate1 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { fatherDetails: cipherfatherDetails } })
    let guardupdate111 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { motherDetails: ciphermotherDetails } })
    let guardupdate112 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { guardianDetails: cipherguardianDetails } })
    // let guardupdate12 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { "motherDetails.bankDetails.isPrimary": false } })
    // let guardupdate13 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { "guardianDetails.bankDetails.isPrimary": false } })

  }
  if (
    req.body.motherDetails &&
    req.body.motherDetails.bankDetails &&
    req.body.motherDetails.bankDetails.isPrimary
  ) {
    if (
      guardianData._doc.fatherDetails &&
      guardianData._doc.fatherDetails.contacts &&
      guardianData._doc.fatherDetails.contacts.length > 0
    ) {
      req.body.fatherDetails.contacts =
        guardianData._doc.fatherDetails.contacts;
    } else {
      req.body.fatherDetails.contacts = [];
    }
    if (!req.body.fatherDetails.contacts.includes(req.params.studentId)) {
      req.body.fatherDetails.contacts.push(req.params.studentId);
    }
    if (
      guardianData._doc.motherDetails &&
      guardianData._doc.motherDetails.contacts &&
      guardianData._doc.motherDetails.contacts.length > 0
    ) {
      req.body.motherDetails.contacts =
        guardianData._doc.motherDetails.contacts;
    } else {
      req.body.motherDetails.contacts = [];
    }
    if (!req.body.motherDetails.contacts.includes(req.params.studentId)) {
      req.body.motherDetails.contacts.push(req.params.studentId);
    }
    if (
      guardianData._doc.guardianDetails &&
      guardianData._doc.guardianDetails.contacts &&
      guardianData._doc.guardianDetails.contacts.length > 0
    ) {
      req.body.guardianDetails.contacts =
        guardianData._doc.guardianDetails.contacts;
    } else {
      req.body.guardianDetails.contacts = [];
    }
    if (!req.body.guardianDetails.contacts.includes(req.params.studentId)) {
      req.body.guardianDetails.contacts.push(req.params.studentId);
    }
    // req.body.motherDetails.contacts = req.params.studentId;
    var cipherfatherDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.fatherDetails), req.body.orgId);
    cipherfatherDetails = cipherfatherDetails.toString();
    var ciphermotherDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.motherDetails), req.body.orgId);
    ciphermotherDetails = ciphermotherDetails.toString();
    var cipherguardianDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.guardianDetails), req.body.orgId);
    cipherguardianDetails = cipherguardianDetails.toString();
    guardupdate2 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { motherDetails: ciphermotherDetails } })
    let guardupdate211 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { fatherDetails: cipherfatherDetails } })
    let guardupdate212 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { guardianDetails: cipherguardianDetails } })
    // let guardupdate22 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { "fatherDetails.bankDetails.isPrimary": false } })
    // let guardupdate23 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { "guardianDetails.bankDetails.isPrimary": false } })

  }
  if (
    req.body.guardianDetails &&
    req.body.guardianDetails.bankDetails &&
    req.body.guardianDetails.bankDetails.isPrimary
  ) {
    if (
      guardianData._doc.fatherDetails &&
      guardianData._doc.fatherDetails.contacts &&
      guardianData._doc.fatherDetails.contacts.length > 0
    ) {
      req.body.fatherDetails.contacts =
        guardianData._doc.fatherDetails.contacts;
    } else {
      req.body.fatherDetails.contacts = [];
    }
    if (!req.body.fatherDetails.contacts.includes(req.params.studentId)) {
      req.body.fatherDetails.contacts.push(req.params.studentId);
    }
    if (
      guardianData._doc.motherDetails &&
      guardianData._doc.motherDetails.contacts &&
      guardianData._doc.motherDetails.contacts.length > 0
    ) {
      req.body.motherDetails.contacts =
        guardianData._doc.motherDetails.contacts;
    } else {
      req.body.motherDetails.contacts = [];
    }
    if (!req.body.motherDetails.contacts.includes(req.params.studentId)) {
      req.body.motherDetails.contacts.push(req.params.studentId);
    }
    if (
      guardianData._doc.guardianDetails &&
      guardianData._doc.guardianDetails.contacts &&
      guardianData._doc.guardianDetails.contacts.length > 0
    ) {
      req.body.guardianDetails.contacts =
        guardianData._doc.guardianDetails.contacts;
    } else {
      req.body.guardianDetails.contacts = [];
    }
    if (!req.body.guardianDetails.contacts.includes(req.params.studentId)) {
      req.body.guardianDetails.contacts.push(req.params.studentId);
    }
    // req.body.guardianDetails.contacts = req.params.studentId;
    var cipherfatherDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.fatherDetails), req.body.orgId);
    cipherfatherDetails = cipherfatherDetails.toString();
    var ciphermotherDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.motherDetails), req.body.orgId);
    ciphermotherDetails = ciphermotherDetails.toString();
    var cipherguardianDetails = await CryptoJS.AES.encrypt(JSON.stringify(req.body.guardianDetails), req.body.orgId);
    cipherguardianDetails = cipherguardianDetails.toString();
    guardupdate3 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { guardianDetails: cipherguardianDetails } })
    let guardupdate311 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { fatherDetails: cipherfatherDetails } })
    let guardupdate312 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { motherDetails: ciphermotherDetails } })
    // let guardupdate32 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { "motherDetails.bankDetails.isPrimary": false } })
    // let guardupdate33 = await guardianModel.updateOne({ _id: studata._doc.guardianDetails[0] }, { $set: { "fatherDetails.bankDetails.isPrimary": false } })

  }
  // else{
  //     res.header("Access-Control-Allow-Origin", "*");
  //     res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  //     res.send({ status: "success", message:"parent details not updated", data: req.body })
  // }
  let guardupdate = guardupdate1
    ? guardupdate1
    : guardupdate2
      ? guardupdate2
      : guardupdate3
        ? guardupdate3
        : null;
  if (guardupdate != null) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.send({
      status: "success",
      message: "parent details updated successfully",
      data: req.body,
    });
  } else {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.send({ status: "failure", code: "400", data: guardupdate });
  }
  // }
  // else{
  //        res.header("Access-Control-Allow-Origin", "*");
  //         res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  //         res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  //         res.send({ status: "failure", code: "403", data: "KYC Details Update not allowed" })
  // }

  // }
  // catch (err) {
  //     res.status(404).send({ status: "failure", message: "parent details: ", data: err.message });
  // }
  // finally {
  //     await dbConnectionp.close()
  //     await centralDbConnection.close();
  // }
};
module.exports.getparentDetails = async (req, res) => {
  let dbConnectionp;
  let centralDbConnection;
  try {
    let spliturl = req.originalUrl.split("/");
    let namaspace;
    for (let i = 0; i < spliturl.length; i++) {
      if (spliturl[i] == "edu") {
        namaspace = spliturl[i - 1];
        // namaspace =  "vkgi"
      }
    }
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
    // var mongourl = await decryption(orgData.connUri);
    // dbConnectionp = await createDatabase(String(orgData._id), mongourl);
    dbConnectionp = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    // dbConnectionp = await createDatabase(orgData._doc._id.toString(), orgData._doc.connUri);
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
    let studata = await studentModel.findOne({
      rollNumber: req.params.studentId,
    });
    let guardianData = await guardianModel.findOne({
      _id: studata._doc.guardianDetails[0],
    });
    // if(guardianData._doc.PIIUsageFlag == true){
    let response = {
      "fullName": guardianData._doc.fullName,
      "mobile": guardianData._doc.mobile,
      "email": guardianData._doc.email,
      "createdAt": guardianData._doc.createdAt,
      "updatedAt": guardianData._doc.updatedAt,
    }
    if (guardianData._doc.fatherDetails) {
      var bytes = CryptoJS.AES.decrypt(guardianData._doc.fatherDetails, req.query.orgId);
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (decryptedData.contacts && decryptedData.contacts.includes(req.params.studentId)) {
        response.fatherDetails = decryptedData
      }
    }
    if (guardianData._doc.guardianDetails) {
      var bytes = CryptoJS.AES.decrypt(guardianData._doc.guardianDetails, req.query.orgId);
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (decryptedData.contacts && decryptedData.contacts.includes(req.params.studentId)) {
        response.guardianDetails = decryptedData
      }
    }
    if (guardianData._doc.motherDetails) {
      var bytes = CryptoJS.AES.decrypt(guardianData._doc.motherDetails, req.query.orgId);
      var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      if (decryptedData.contacts && decryptedData.contacts.includes(req.params.studentId)) {
        response.motherDetails = decryptedData
      }
    }


    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.send({ status: "success", statusCode: 200, data: response });
    // }
    // else{
    //     res.header("Access-Control-Allow-Origin", "*");
    //     res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    //     res.send({ status: "success", statusCode: 403, data: "get parent kyc details not allowed" })
    // }
  } catch (err) {
    res.status(404).send({
      status: "failure",
      message: "parent details: ",
      data: err.message,
    });
  } finally {
    await dbConnectionp.close();
    await centralDbConnection.close();
  }
}
module.exports.encryptGuardianDetails = async (req, res) => {
  let dbConnectionp
  let centralDbConnection
  try {
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
      _id: mongoose.Types.ObjectId(req.body.orgId),
    });
    // dbConnectionp = await createDatabase(orgData._doc._id.toString(), orgData._doc.connUri);
    // var mongourl = await decryption(orgData.connUri);
    // dbConnectionp = await createDatabase(String(orgData._id), mongourl);
    dbConnectionp = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    let GuardianSchema2 = mongoose.Schema({}, { strict: false });
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema2);
    let studata = await studentModel.findOne({ rollNumber: req.params.studentId })
    let guardianData = await guardianModel.find({})
    for (let i = 0; i < guardianData.length; i++) {
      // console.log(guardianData.length, guardianData[i]._doc.fatherDetails,guardianData[i]._doc)
      if (guardianData[i]._doc.fatherDetails && typeof guardianData[i]._doc.fatherDetails !== "string") {
        var cipherfatherDetails = await CryptoJS.AES.encrypt(JSON.stringify(guardianData[i]._doc.fatherDetails), req.body.orgId).toString();
        guardupdate1 = await guardianModel.updateOne({ _id: guardianData[i]._doc._id }, { $set: { fatherDetails: cipherfatherDetails } })
      }
      if (guardianData[i]._doc.guardianDetails && typeof guardianData[i]._doc.guardianDetails !== "string") {
        var cipherfatherDetails = await CryptoJS.AES.encrypt(JSON.stringify(guardianData[i]._doc.guardianDetails), req.body.orgId).toString();
        guardupdate1 = await guardianModel.updateOne({ _id: guardianData[i]._doc._id }, { $set: { guardianDetails: cipherfatherDetails } })
      }
      if (guardianData[i]._doc.motherDetails && typeof guardianData[i]._doc.motherDetails !== "string") {
        var cipherfatherDetails = await CryptoJS.AES.encrypt(JSON.stringify(guardianData[i]._doc.motherDetails), req.body.orgId).toString();
        guardupdate1 = await guardianModel.updateOne({ _id: guardianData[i]._doc._id }, { $set: { motherDetails: cipherfatherDetails } })
      }
      if (i + 1 == guardianData.length) {
        // if(guardianData._doc.PIIUsageFlag == true){
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        res.send({ status: "success", statusCode: 200, message: "guardians collection data encrypted" })
      }
    }
  }
  catch (err) {
    res.status(404).send({ status: "failure", message: "parent details: ", data: err.message });
  }
  finally {
    await dbConnectionp.close()
    await centralDbConnection.close();
  }
}
module.exports.calculateLateFee = async (req, res) => {
  let orgId = req.query.orgId;
  console.log(orgId);
  let dbConnectionp;
  let centralDbConnection;
  try {
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
      _id: mongoose.Types.ObjectId(orgId),
    });
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
    let studentModel = dbConnectionp.model("students", StudentSchema);
    // await studentModel.updateMany({},{$set:{email:"zenqoretester19@gmail.com", parentEmail:"zenqoretester19@gmail.com"}})
    // console.log("updated");
    // console.log(sdfs)
    let studata = await studentModel.find({});
    let lateFeeModel = dbConnectionp.model("latefees", LateFeeSchema);
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    let paymentScheduleModel = dbConnectionp.model(
      "paymentschedules",
      PaymentScheduleSchema
    );
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let feeMapModel = dbConnectionp.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let paymentScheduledata = await paymentScheduleModel.find({});
    console.log("dsfdsf");
    console.log(paymentScheduledata[0]._doc.scheduleDetails.penaltyStartDate);
    let lateFeeData = await lateFeeModel.find({});
    let lateFeeAmount = lateFeeData[0]._doc.amount;
    let todayDate = moment().date();
    let lateFeeDate = moment(
      new Date(paymentScheduledata[0]._doc.scheduleDetails.penaltyStartDate)
    )
      .utcOffset("GMT-0530")
      .date();
    console.log("amount", lateFeeData[0]._doc.amount);
    console.log(lateFeeDate, todayDate);
    let result = [];
    await feeInstallmentPlanModel.updateMany(
      {},
      { $set: { lateFees: 0, concessionFees: 0 } }
    );
    // console.log("dsfds",dsf)
    for (let i = 0; i < studata.length; i++) {
      let ppdata = await ppmodel.findOne({
        _id: studata[i]._doc.programPlanId,
      });
      let feeplandata = await feePlanModel.findOne({
        studentRegId: studata[i]._doc.regId,
      });
      let feeMapData = await feeMapModel.findOne({
        studentId: studata[i]._doc._id,
      });
      console.log(
        feeMapData &&
        feeplandata &&
        Number(feeplandata._doc.paidAmount) == 0 &&
        Number(feeplandata._doc.plannedAmount) > 0 &&
        Number(lateFeeDate) == Number(todayDate) &&
        ppdata &&
        ppdata._doc.academicYear == "2021-22"
      );
      if (
        feeMapData &&
        feeplandata &&
        Number(feeplandata._doc.paidAmount) == 0 &&
        Number(feeplandata._doc.plannedAmount) > 0 &&
        Number(lateFeeDate) == Number(todayDate) &&
        ppdata &&
        ppdata._doc.academicYear == "2021-22"
      ) {
        let feeInstdata = await feeInstallmentPlanModel.find({
          feePlanId: feeplandata._doc._id,
        });
        result.push(studata[i]._doc.regId);
        // console.log(feeplandata._doc.lateFee!==undefined)
        // if(feeplandata._doc.lateFee){
        //   // await feePlanModel.updateOne({_id:feeplandata._doc._id},{$set:{lateFee:{amount:Number(feeplandata._doc.lateFee.amount)+Number(lateFeeAmount),totalLateFeedays:Number(feeplandata._doc.lateFee.totalLateFeedays)+1,lateFeeFrom:lateFeeDate}}})
        //   // await feePlanModel.updateOne({_id:feeplandata._doc._id},{$set:{
        //   //   pendingAmount:Number(feeplandata._doc.pendingAmount)+Number(lateFeeAmount),
        //   //   plannedAmount: Number(feeplandata._doc.plannedAmount)+Number(lateFeeAmount),
        //   //   $push:{paidAmountBreakup:{amount:0,feeTypeCode:`FT_2021-22_00${feeplandata._doc.paidAmountBreakup.length + 1}`,title:"Late Fee"}},
        //   //   $push:{pendingAmountBreakup:{amount:lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeplandata._doc.pendingAmountBreakup.length + 1}`,title:"Late Fee"}}
        //   // }})
        //   // await feeMapModel.updateOne({_id:feeMapData._doc._id},{amount: Number(feeMapData._doc.amount)+Number(lateFeeAmount),pending: Number(feeMapData._doc.pending)+Number(lateFeeAmount)})
        //   // await feeInstallmentPlanModel.updateOne({_id: feeInstdata[0]._doc._id},{$set:{plannedAmount: Number(feeInstdata[0]._doc.plannedAmount)+Number(lateFeeAmount), pendingAmount: Number(feeInstdata[0]._doc.plannedAmount)+Number(lateFeeAmount)},
        //   //       $push:{paidAmountBreakup:{amount:0,feeTypeCode:`FT_2021-22_00${feeInstdata[0]._doc.paidAmountBreakup.length + 1}`,title:"Late Fee"}},
        //   //       $push:{plannedAmountBreakup:{amount: lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeInstdata[0]._doc.plannedAmountBreakup.length + 1}`,title:"Late Fee"}},
        //   //       $push:{pendingAmountBreakup:{amount:lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeInstdata[0]._doc.pendingAmountBreakup.length + 1}`,title:"Late Fee"}},
        //   //     })
        // }else{
        // await feePlanModel.updateOne({_id:feeplandata._doc._id},{$set:{lateFee:{amount:lateFeeAmount,totalLateFeedays:1,lateFeeFrom:lateFeeDate}},$push:{plannedAmountBreakup:{amount:lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeplandata._doc.plannedAmountBreakup.length + 1}`,title:"Late Fee"}}})

        // await feePlanModel.updateOne({_id:feeplandata._doc._id},{$set:{
        //   pendingAmount:Number(feeplandata._doc.pendingAmount)+Number(lateFeeAmount),
        //   plannedAmount: Number(feeplandata._doc.plannedAmount)+Number(lateFeeAmount),
        //   "paidAmountBreakup.1":{amount:0,feeTypeCode:`FT_2021-22_00${feeplandata._doc.paidAmountBreakup.length + 1}`,title:"Late Fee"},
        // "pendingAmountBreakup.1":{amount:lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeplandata._doc.pendingAmountBreakup.length + 1}`,title:"Late Fee"},
        // "plannedAmountBreakup.1":{amount:lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeplandata._doc.plannedAmountBreakup.length + 1}`,title:"Late Fee"}}});
        // await feeMapModel.updateOne({_id:feeMapData._doc._id},{amount: Number(feeMapData._doc.amount)+Number(lateFeeAmount),pending: Number(feeMapData._doc.pending)+Number(lateFeeAmount)})
        // await feeInstallmentPlanModel.updateOne({_id: feeInstdata[0]._doc._id},{$set:{plannedAmount: Number(feeInstdata[0]._doc.plannedAmount)+Number(lateFeeAmount), pendingAmount: Number(feeInstdata[0]._doc.plannedAmount)+Number(lateFeeAmount)},
        //       "paidAmountBreakup.1":{amount:0,feeTypeCode:`FT_2021-22_00${feeInstdata[0]._doc.paidAmountBreakup.length + 1}`,title:"Late Fee"},
        //       "plannedAmountBreakup.1":{amount: lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeInstdata[0]._doc.plannedAmountBreakup.length + 1}`,title:"Late Fee"},
        //       "pendingAmountBreakup.1":{amount:lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeInstdata[0]._doc.pendingAmountBreakup.length + 1}`,title:"Late Fee"},
        //     })

        // await feePlanModel.updateOne({_id:feeplandata._doc._id},{$set:{
        //   pendingAmount:Number(feeplandata._doc.pendingAmount)+Number(lateFeeAmount),
        //   plannedAmount: Number(feeplandata._doc.plannedAmount)+Number(lateFeeAmount),
        //   "paidAmountBreakup.1":{amount:0,feeTypeCode:`FT_2021-22_00${feeplandata._doc.paidAmountBreakup.length + 1}`,title:"Late Fee"},
        //   "pendingAmountBreakup.1":{amount:lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeplandata._doc.pendingAmountBreakup.length + 1}`,title:"Late Fee"},
        //   "plannedAmountBreakup.1":{amount:lateFeeAmount,feeTypeCode:`FT_2021-22_00${feeplandata._doc.plannedAmountBreakup.length + 1}`,title:"Late Fee"}}});
        // await feeMapModel.updateOne({_id:feeMapData._doc._id},{amount: Number(feeMapData._doc.amount)+Number(lateFeeAmount),pending: Number(feeMapData._doc.pending)+Number(lateFeeAmount)})
        // await feeInstallmentPlanModel.updateMany({feePlanId: feeplandata._doc._id},{$set:{totalAmount: Number(feeInstdata[0]._doc.totalAmount) + Number(lateFeeAmount)}})
        // await feeInstallmentPlanModel.updateOne({_id: feeInstdata[0]._doc._id},{$set:{plannedAmount: Number(feeInstdata[0]._doc.plannedAmount)+Number(lateFeeAmount),
        //   pendingAmount: Number(feeInstdata[0]._doc.plannedAmount) + Number(lateFeeAmount),
        //   lateFees: Number(lateFeeAmount),
        //   concessionFees: 0
        // }})

        // await feePlanModel.updateOne({ _id: feeplandata._doc._id }, {
        //   $set: {
        //     pendingAmount: Number(feeplandata._doc.pendingAmount) - Number(lateFeeAmount),
        //     plannedAmount: Number(feeplandata._doc.plannedAmount) - Number(lateFeeAmount),
        //     lateFees: Number(lateFeeAmount),
        //     concessionFees: 0,
        //     "paidAmountBreakup.1": { amount: 0, feeTypeCode: `FT_2021-22_00${feeplandata._doc.paidAmountBreakup.length + 1}`, title: "Late Fee" },
        //     "pendingAmountBreakup.1": { amount: lateFeeAmount, feeTypeCode: `FT_2021-22_00${feeplandata._doc.pendingAmountBreakup.length + 1}`, title: "Late Fee" },
        //     "plannedAmountBreakup.1": { amount: lateFeeAmount, feeTypeCode: `FT_2021-22_00${feeplandata._doc.plannedAmountBreakup.length + 1}`, title: "Late Fee" }
        //   }
        // });
        // await feeMapModel.updateOne({ _id: feeMapData._doc._id }, { amount: Number(feeMapData._doc.amount) - Number(lateFeeAmount), pending: Number(feeMapData._doc.pending) - Number(lateFeeAmount) })
        // await feeInstallmentPlanModel.updateMany({ feePlanId: feeplandata._doc._id }, { $set: { totalAmount: Number(feeInstdata[0]._doc.totalAmount) - Number(lateFeeAmount) } })
        // await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[0]._doc._id }, {
        //   $set: {
        // plannedAmount: Number(feeInstdata[0]._doc.plannedAmount) - Number(lateFeeAmount),
        // pendingAmount: Number(feeInstdata[0]._doc.plannedAmount) - Number(lateFeeAmount),
        // lateFees: Number(lateFeeAmount),
        // concessionFees: 0
        //   }
        // })

        await feePlanModel.updateOne(
          { _id: feeplandata._doc._id },
          {
            $set: {
              lateFees: Number(lateFeeAmount),
              concessionFees: 0,
            },
          }
        );
        await feeInstallmentPlanModel.updateOne(
          { _id: feeInstdata[0]._doc._id },
          {
            $set: {
              lateFees: Number(lateFeeAmount),
            },
          }
        );

        // await feePlanModel.updateOne({_id:feeplandata._doc._id},{$set:{
        //   pendingAmount:Number(feeplandata._doc.plannedAmountBreakup[0].amount),
        //   plannedAmount: Number(feeplandata._doc.plannedAmountBreakup[0].amount)}});
        // await feeMapModel.updateOne({_id:feeMapData._doc._id},{amount: Number(feeplandata._doc.plannedAmountBreakup[0].amount),pending: Number(feeplandata._doc.plannedAmountBreakup[0].amount)})
        // await feeInstallmentPlanModel.updateOne({_id: feeInstdata[0]._doc._id},{$pull:{plannedAmount: Number(feeInstdata[0]._doc.plannedAmountBreakup[0].amount), pendingAmount: Number(feeInstdata[0]._doc.plannedAmountBreakup[0].amount)}
        //     })

        // }
      }
      if (i + 1 == studata.length) {
        console.log(result.length);
        res.send({ totalNotPaid: result.length, data: result });
      }
    }
  } catch (err) {
    console.log("err", err);
    // res.status(404).send({ status: "failure", message: "parent details: ", data: err.message });
  } finally {
    // await dbConnectionp.close()
    // await centralDbConnection.close();
  }
};

module.exports.getPendingStudents2 = async (req, res) => {
  let dbConnectionp;
  let centralDbConnection;
  try {
    centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    // console.log(centralDbConnection)
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({
      _id: mongoose.Types.ObjectId(req.params.id),
    });
    // console.log(orgData)
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
    let studata = await studentModel.find({});
    const settingsSchema = mongoose.Schema({}, { strict: false });
    const settingsModel = dbConnectionp.model(
      "settings",
      settingsSchema,
      "settings"
    );

    const orgSettings = await settingsModel.find({});
    let orgDetails = orgSettings[0]._doc;
    console.log("email", orgDetails.emailServer[0].emailAddress);
    let studentnames = `<table style="border: 2px solid #000000; border-collapse: collapse"><tr><td style="border: 1px solid #000000; border-collapse: collapse">Name</td><td style="border: 1px solid #000000; border-collapse: collapse">Reg ID</td><td style="border: 1px solid #000000; border-collapse: collapse">Class</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 1 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 2 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Total Amount</td></tr>`;
    for (let i = 0; i < studata.length; i++) {
      console.log(i);
      let ppdata = await ppmodel.findOne({
        _id: studata[i]._doc.programPlanId,
      });
      let feePlandata = await feePlanModel.findOne({
        studentRegId: studata[i]._doc.regId,
      });
      let feeInstallments = await feeInstallmentPlanModel.find({
        feePlanId: feePlandata._doc._id,
      });

      if (
        feeInstallments[0]._doc.status.toLowerCase() == "planned" &&
        feeInstallments[0]._doc.status.toLowerCase() !== "paid" &&
        Number(feeInstallments[0]._doc.totalAmount) > 0
      ) {
        studentnames =
          studentnames +
          `<tr style="border: 2px solid #000000; border-collapse: collapse"><td style="border: 1px solid #000000; border-collapse: collapse">${studata[i]._doc.firstName.includes(".")
            ? studata[i]._doc.firstName.replace(".", "")
            : studata[i]._doc.firstName
          } ${studata[i]._doc.lastName.includes(".")
            ? studata[i]._doc.lastName.replace(".", "")
            : studata[i]._doc.lastName
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${studata[i]._doc.regId
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${ppdata._doc.title
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${feeInstallments[0]._doc.plannedAmount.toFixed(
            2
          )}</td><td style="border: 1px solid #000000; border-collapse: collapse">${feeInstallments[1]._doc.plannedAmount.toFixed(
            2
          )}</td><td style="border: 1px solid #000000; border-collapse: collapse">${feeInstallments[0]._doc.totalAmount.toFixed(
            2
          )}</td></tr>`;
        if (i + 1 == studata.length) {
          studentnames = studentnames + `</table>`;
          //   console.log(studentnames)
          res.send(studentnames);
          await dbConnectionp.close();
          await centralDbConnection.close();
        }
      } else {
        if (i + 1 == studata.length) {
          await dbConnectionp.close();
          await centralDbConnection.close();
        }
      }
    }
  } catch (err) {
  } finally {
  }
};
module.exports.getPendingStudents = async (req, res) => {
  let emailids = { cvRaman: [], jeevanBheema: [] };

  dbConnectionp = await createDatabase(
    "5fa8daece3eb1f18d4250e98",
    "mongodb://20.44.39.232:30000"
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
  let CampSchema = mongoose.Schema({}, { strict: false });
  let campusModel = dbConnectionp.model("campuses", CampSchema);
  let campusData = await campusModel.find({});
  for (let i = 0; i < req.body.length; i++) {
    let element = req.body[i];
    var totalBalance = 0;
    let stddata = await studentModel.findOne({
      regId: req.body[i].studentRegId,
    });
    let feePlandata = await feePlanModel.findOne({
      studentRegId: element.studentRegId,
    });
    let feeinstdata = await feeInstallmentPlanModel.find({
      feePlanId: feePlandata._doc._id,
    });
    for (let j = 0; j < feeinstdata.length; j++) {
      totalBalance =
        feeinstdata[j + 1] && Number(feeinstdata[j + 1]._doc["paidAmount"]) == 0
          ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
          : feeinstdata[j + 1] &&
            Number(feeinstdata[j + 1]._doc["paidAmount"]) > 0
            ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
            : Number(feeinstdata[j]._doc["pendingAmount"]);
    }
    let findcampus = await campusData.find(
      (item) => item._id.toString() == req.body[i].campusId.toString()
    );
    let d = new Date(req.body[i].transactionDate);
    let date = `${d.getDate().toString().length == 2
      ? d.getDate()
      : 0 + d.getDate().toString()
      }-${d.getMonth().toString().length == 2
        ? d.getMonth()
        : 0 + d.getMonth().toString()
      }-${d.getFullYear()}`;
    if (findcampus._doc.name.toLowerCase().includes("raman")) {
      // emailids.cvRaman.push({"Student Name": `${stddata ? stddata._doc.firstName : "" } ${stddata ? stddata._doc.lastName : ""}`, "Student Admission Number":req.body[i].studentRegId, "Parent Name": stddata._doc.parentName, Class: req.body[i].class, "Parent Email": req.body[i].emailCommunicationRefIds[0], "Date Of Payment":date, "Campus":"CV Raman Nagar Branch"})
      emailids.cvRaman.push({
        "RECEIPT ID": element["displayName"],
        "REG ID": element["studentRegId"],
        "STUDENT NAME": element["studentName"],
        "ACADEMIC YEAR": element["academicYear"],
        "CLASS/BATCH": element["class"],
        "PARENT NAME": stdData ? stdData._doc.parentName : "",
        "PARENT EMAIL": stdData ? stdData._doc.parentPhone : "",
        "PARENT PHONE NUMBER": stdData ? stdData._doc.parentEmail : "",
        DESCRIPTION: feePlandata._doc.plannedAmountBreakup[0].title,
        "TOTAL FEES (INR)": feePlandata._doc["plannedAmount"],
        "PAID (INR)": element["amount"],
        "PAID ON": await onDateFormat(element["transactionDate"]),
        MODE: element.data.mode.toUpperCase(),
        "PENDING (INR)": totalBalance,
        "TXN ID": element["paymentTransactionId"],
        // "REFUND": this.formatAmount(item.refundAmount),
        STATUS: "Paid",
      });
    } else {
      emailids.jeevanBheema.push({
        "Student Name": `${stddata ? stddata._doc.firstName : ""} ${stddata ? stddata._doc.lastName : ""
          }`,
        "Student Admission Number": req.body[i].studentRegId,
        "Parent Name": stddata._doc.parentName,
        Class: req.body[i].class,
        "Parent Email": req.body[i].emailCommunicationRefIds[0],
        "Date Of Payment": date,
        Campus: "Jeevan Bima Nagar Branch",
      });
    }
    if (i + 1 == req.body.length) {
      res.send(emailids);
    }
  }
};
module.exports.reminderCronJob = async (req, res) => {
  let dbConnectionp;
  let centralDbConnection;
  try {
    centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    // console.log(centralDbConnection)
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({
      _id: mongoose.Types.ObjectId(req.params.id),
    });
    // console.log(orgData)
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
    let studentModel = dbConnectionp.model("students", StudentSchema);
    // let reminderModel = dbConnectionp.model("reminderplans", ReminderSchema);
    // let reminderplan = await reminderModel.find({});
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let feeInstallments1 = await feeInstallmentPlanModel.find({});
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
    let studata = await studentModel.find({});
    const settingsSchema = mongoose.Schema({}, { strict: false });
    const settingsModel = dbConnectionp.model(
      "settings",
      settingsSchema,
      "settings"
    );

    const orgSettings = await settingsModel.find({});
    let orgDetails = orgSettings[0]._doc;
    console.log("email", orgDetails.emailServer[0].emailAddress);
    let remindercount = 0;
    let failurecount = 0;
    let successdata = [];
    let failuredata = [];
    res.send({
      message: "Reminders are sending",
    });
    let studentnames = `<table style="border: 2px solid #000000; border-collapse: collapse"><tr><td style="border: 1px solid #000000; border-collapse: collapse">Name</td><td style="border: 1px solid #000000; border-collapse: collapse">Reg ID</td><td style="border: 1px solid #000000; border-collapse: collapse">Class</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 1 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 2 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Total Amount</td></tr>`;
    for (let i = 0; i < studata.length; i++) {
      // for (let i = 0; i < 10; i++) {
      let guardianData = await guardianModel.findOne({
        _id: studata[i]._doc.guardianDetails[0],
      });
      let ppdata = await ppmodel.findOne({
        _id: studata[i]._doc.programPlanId,
      });
      let feePlandata = await feePlanModel.findOne({
        studentRegId: studata[i]._doc.regId,
      });
      if (feePlandata) {
        let feeInstallments = await feeInstallmentPlanModel.find({
          feePlanId: feePlandata._doc._id,
        });
        // console.log(
        //   {
        //     studentName: `${studata[i]._doc.firstName} ${studata[i]._doc.lastName}`,
        //     studentId: studata[i]._doc.regId,
        //     class: ppdata._doc.title,
        // let email = guardianData._doc.email;
        let email =
          guardianData._doc.email == ""
            ? studata[i]._doc.email
            : guardianData._doc.email;
        // let email = "naveen.p@zenqore.com";
        // let email = ""
        // console.log("email",email,guardianData._doc)
        //     academicYear: ppdata._doc.academicYear,
        //     dueDate: feeInstallments[0]._doc.dueDate,
        //     penaltyDate: feeInstallments[0]._doc.lateFeeStartDate,
        //     status: feeInstallments[0]._doc.status,
        //     dueAmount1: feeInstallments[0]._doc.plannedAmount,
        //     dueAmount2: feeInstallments[0]._doc.plannedAmount,
        //   }
        // )

        if (
          feeInstallments[0]._doc.status.toLowerCase() == "planned" &&
          feeInstallments[0]._doc.status.toLowerCase() !== "paid" &&
          Number(feeInstallments[0]._doc.totalAmount) > 0 &&
          ppdata &&
          ppdata._doc.academicYear == "2021-22"
        ) {
          studentnames =
            studentnames +
            `<tr style="border: 2px solid #000000; border-collapse: collapse"><td style="border: 1px solid #000000; border-collapse: collapse">${studata[i]._doc.firstName.includes(".")
              ? studata[i]._doc.firstName.replace(".", "")
              : studata[i]._doc.firstName
            } ${studata[i]._doc.lastName.includes(".")
              ? studata[i]._doc.lastName.replace(".", "")
              : studata[i]._doc.lastName
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${studata[i]._doc.regId
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${ppdata._doc.title
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${parseFloat(feeInstallments[0]._doc.plannedAmount.toFixed(2)) +
            parseFloat(feeInstallments[1]._doc.plannedAmount.toFixed(2))
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${parseFloat(feeInstallments[2]._doc.plannedAmount.toFixed(2)) +
            parseFloat(feeInstallments[3]._doc.plannedAmount.toFixed(2))
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${feeInstallments[0]._doc.totalAmount.toFixed(
              2
            )}</td></tr>`;

          let message = `<div style="display:flex;justify-content:flex-start;text-align:center"><img  title="logo.jpg" alt="" width="148" height="148" text-align="center" src="https://supportings.blob.core.windows.net/zenqore-supportings/ncef.png"/><p style="margin-left:20px">
          </div>
              <br>
              <hr/>
              <br>
              <p><strong>Dear Parent,</strong></p>
              <p><strong>This is a gentle reminder for you to initiate the fee payment of your ward ${studata[i]._doc.firstName.includes(".")
              ? studata[i]._doc.firstName.replace(".", "")
              : studata[i]._doc.firstName
            } ${studata[i]._doc.lastName.includes(".")
              ? studata[i]._doc.lastName.replace(".", "")
              : studata[i]._doc.lastName
            }.</strong></p>
              <p><strong>Please ignore this message if you have already paid.</strong></p>
              <p><strong>If you have applied for loan and you are seeing this reminder, you  may ignore the same. This reminder may have been sent due to a gap of few days between the loan application, payment and reconciliation.</p>
              <p><strong>To pay the fees, please login to our Parent Portal by clicking the following button:</strong></p>
              <p><a href="https://vkgi-parentportal.ken42.com/home" <button class="button button1" style="background-color: #00218d;border: none;
              color: white;
              padding: 15px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              margin: 4px 2px;
              cursor: pointer;font-size: 20px;" >Login</button></a></p>
              <p>Regards,</p>
              <p><strong>NCFE Accounts Team</strong></p>
              <p>&nbsp;</p>`;
          sendEmail(
            orgDetails.emailServer[0].emailServer,
            [email],
            process.env.sendgridEmail,
            "NCFE - Reminder for Fee Payment",
            message,
            [],
            "vkgi"
          )
            .then(async (data) => {
              // successdata.push(data)
              remindercount++;
              if (i + 1 == studata.length) {
                // if (i + 1 == 10) {
                studentnames = studentnames + `</table>`;
                res.send(studentnames);
                await dbConnectionp.close();
                await centralDbConnection.close();
                sendEmail(
                  orgDetails.emailServer[0].emailServer,
                  [
                    "mehul.patel@zenqore.com",
                    "fajo.joy@zenqore.com",
                    "naveen.p@zenqore.com",
                  ],
                  // ["naveen.p@zenqore.com"],
                  "noreply@ncfe.ac.in",
                  `NCFE - Reminder Mail Sent Status ${process.env.stage
                    .toString()
                    .toUpperCase()}-${orgData._doc.nameSpace
                      .toString()
                      .toUpperCase()}`,
                  `<body><p><strong>reminder mail sent to ${remindercount} students. </strong></p>
                    <div>${studentnames}</div>
                    </body>`,
                  [],
                  "vkgi"
                )
                  .then(async (data2) => {
                    console.log({
                      status: "success",
                      message: `reminder mail sent to ${remindercount} students: `,
                      data: data2,
                    });
                    // res.status(200).send({ status: "success", message: `reminder mail sent to ${remindercount} students: `, data: data2, successData: successdata, failureData: failurecount });
                  })
                  .catch((error1) => {
                    console.log("error", error1);
                  });
              }
            })
            .catch((error1) => {
              failurecount++;
              console.log("error", error1);
            });
        } else {
          // if (i + 1 == 10) {
          if (i + 1 == studata.length) {
            await dbConnectionp.close();
            await centralDbConnection.close();
            sendEmail(
              orgDetails.emailServer[0].emailServer,
              [
                "mehul.patel@zenqore.com",
                "fajo.joy@zenqore.com",
                "naveen.p@zenqore.com",
              ],
              // ["naveen.p@zenqore.com"],
              "noreply@ncfe.ac.in",
              `NCFE - Reminder Mail Sent Status ${process.env.stage
                .toString()
                .toUpperCase()}-${orgData._doc.nameSpace
                  .toString()
                  .toUpperCase()}`,
              `<body><p><strong>reminder mail sent to ${remindercount} students </strong></p>
              <div>${studentnames}</div></body>`,
              [],
              "vkgi"
            )
              .then(async (data2) => {
                console.log({
                  status: "success",
                  message: `reminder mail sent to ${remindercount} students: `,
                  data: data2,
                });
                // res.status(200).send({ status: "success", message: `reminder mail sent to ${remindercount} students: `, data: data2 });
              })
              .catch((error) => {
                console.log("error", error);
                var obj = {
                  success: false,
                };
                return obj;
              });
          }
        }
      } else if (!feePlandata || !ppdata) {
        if (!ppdata) {
          console.log("prplan", studata[i]._doc);
        } else {
          console.log("feeplan", studata[i]._doc);
        }
      }
    }
  } catch (err) {
    console.log("err", err);
    // res.status(404).send({ status: "failure", message: "parent details: ", data: err.message });
  } finally {
  }
};

module.exports.updateInstallmentPlan = async (req, res) => {
  let dbConnection;
  let centralDbConnection;
  let orgId = req.body.orgId;
  try {
    console.log("1")
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
      _id: mongoose.Types.ObjectId(orgId),
    });
    // console.log(orgData)
    dbConnection = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
    // dbConnection = await createDatabase(
    //   "5faa2d6d83774b0007e6537d",
    //   "mongodb://20.44.39.232:30000"
    // );
    console.log("2")
    let feePlanModel = dbConnection.model("studentfeeplans", feeplanschema);
    let feeInstallmentPlanModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let feePlandata = await feePlanModel.find({ studentRegId: { $in: req.body.regIds } });
    let dcount = 0;
    for (let i = 0; i < feePlandata.length; i++) {
      let feeinstdata = await feeInstallmentPlanModel.find({
        feePlanId: feePlandata[i]._doc._id,
      });
      console.log("dss", i)
      for (let j = 0; j < feeinstdata.length; j++) {
        console.log("dsss", j)

        dcount++;
        // console.log(Number(feeinstdata[j]._doc.pendingAmount) == Number(feeinstdata[j]._doc.plannedAmount),Number(feeinstdata[j]._doc.percentage) == 60)
        if (
          Number(feeinstdata[j]._doc.paidAmount) ==
          Number(feeinstdata[j]._doc.plannedAmount) &&
          Number(feeinstdata[j]._doc.percentage) == 60
        ) {
          let instpayload40 = new feeInstallmentPlanModel({
            feePlanId: feePlandata[i]._doc._id,
            studentRegId: feePlandata[i]._doc.studentRegId,
            label: "Installment001",
            displayName: `INST_2021-22_${(Number(dcount) + 1).toString().length == 1
              ? "00"
              : (Number(dcount) + 1).toString().length == 2
                ? "0"
                : ""
              }${Number(dcount) + 1}`,
            description: "Installment001",
            dueDate: new Date(`2021-April-10`),
            lateFeeStartDate: feeinstdata[j].lateFeeStartDate,
            percentage: 40,
            totalAmount: feeinstdata[j].totalAmount,
            // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
            plannedAmount: parseFloat(feeinstdata[j].totalAmount) * 0.4,
            plannedAmountBreakup: [
              {
                amount: parseFloat(feeinstdata[j].totalAmount) * 0.4,
                feeTypeCode: feeinstdata[j].plannedAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].plannedAmountBreakup[0].title,
              },
            ],
            paidAmount: parseFloat(feeinstdata[j].totalAmount) * 0.4,
            paidAmountBreakup: [
              {
                amount: parseFloat(feeinstdata[j].totalAmount) * 0.4,
                feeTypeCode: feeinstdata[j].paidAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].paidAmountBreakup[0].title,
              },
            ],
            pendingAmount: 0,
            pendingAmountBreakup: [
              {
                amount: 0,
                feeTypeCode: feeinstdata[j].pendingAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].pendingAmountBreakup[0].title,
              },
            ],
            discountType: "",
            discountPercentage: 0,
            discountAmount: 0,
            discountAmountBreakup: [
              {
                amount: feeinstdata[j].discountAmountBreakup[0].amount,
                feeTypeCode: feeinstdata[j].discountAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].discountAmountBreakup[0].title,
              },
            ],
            status: "Paid",
            transactionId: "",
            campusId: feePlandata[i]._doc.campusId,
            remarks: {
              seller: "",
              finance: "",
              headseller: "",
            },
            "concessionFees": 0.0,
            "lateFees": 0.0
          });
          let instpayload20 = new feeInstallmentPlanModel({
            feePlanId: feePlandata[i]._doc._id,
            studentRegId: feePlandata[i]._doc.studentRegId,
            label: "Installment002",
            displayName: `INST_2021-22_${(Number(dcount) + 1).toString().length == 1
              ? "00"
              : (Number(dcount) + 1).toString().length == 2
                ? "0"
                : ""
              }${Number(dcount) + 1}`,
            description: "Installment002",
            dueDate: new Date(`2021-June-10`),
            lateFeeStartDate: new Date(`2021-June-30`),
            percentage: 20,
            totalAmount: feeinstdata[j].totalAmount,
            // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
            plannedAmount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
            plannedAmountBreakup: [
              {
                amount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
                feeTypeCode: feeinstdata[j].plannedAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].plannedAmountBreakup[0].title,
              },
            ],
            paidAmount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
            paidAmountBreakup: [
              {
                amount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
                feeTypeCode: feeinstdata[j].paidAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].paidAmountBreakup[0].title,
              },
            ],
            pendingAmount: 0,
            pendingAmountBreakup: [
              {
                amount: 0,
                feeTypeCode: feeinstdata[j].pendingAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].pendingAmountBreakup[0].title,
              },
            ],
            discountType: "",
            discountPercentage: 0,
            discountAmount: 0,
            discountAmountBreakup: [
              {
                amount: feeinstdata[j].discountAmountBreakup[0].amount,
                feeTypeCode: feeinstdata[j].discountAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].discountAmountBreakup[0].title,
              },
            ],
            status: "Paid",
            transactionId: "",
            campusId: feePlandata[i]._doc.campusId,
            remarks: {
              seller: "",
              finance: "",
              headseller: "",
            },
            "concessionFees": 0.0,
            "lateFees": 0.0
          });
          await feeInstallmentPlanModel.deleteOne({
            feePlanId: feePlandata[i]._doc._id,
            label: feeinstdata[j]._doc.label,
          });
          await instpayload40.save();
          await instpayload20.save();
        }
        if (
          Number(feeinstdata[j].paidAmount) ==
          Number(feeinstdata[j].plannedAmount) &&
          Number(feeinstdata[j].percentage) == 40
        ) {
          let instpayload201 = new feeInstallmentPlanModel({
            feePlanId: feePlandata[i]._doc._id,
            studentRegId: feePlandata[i]._doc.studentRegId,
            label: "Installment003",
            displayName: `INST_2021-22_${(Number(dcount) + 1).toString().length == 1
              ? "00"
              : (Number(dcount) + 1).toString().length == 2
                ? "0"
                : ""
              }${Number(dcount) + 1}`,
            description: "Installment003",
            dueDate: new Date(`2021-September-10`),
            lateFeeStartDate: new Date(`2021-September-30`),
            percentage: 20,
            totalAmount: feeinstdata[j].totalAmount,
            // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
            plannedAmount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
            plannedAmountBreakup: [
              {
                amount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
                feeTypeCode: feeinstdata[j].plannedAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].plannedAmountBreakup[0].title,
              },
            ],
            paidAmount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
            paidAmountBreakup: [
              {
                amount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
                feeTypeCode: feeinstdata[j].paidAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].paidAmountBreakup[0].title,
              },
            ],
            pendingAmount: 0,
            pendingAmountBreakup: [
              {
                amount: 0,
                feeTypeCode: feeinstdata[j].pendingAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].pendingAmountBreakup[0].title,
              },
            ],
            discountType: "",
            discountPercentage: 0,
            discountAmount: 0,
            discountAmountBreakup: [
              {
                amount: feeinstdata[j].discountAmountBreakup[0].amount,
                feeTypeCode: feeinstdata[j].discountAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].discountAmountBreakup[0].title,
              },
            ],
            status: "Paid",
            transactionId: "",
            campusId: feePlandata[i]._doc.campusId,
            remarks: {
              seller: "",
              finance: "",
              headseller: "",
            },
            "concessionFees": 0.0,
            "lateFees": 0.0
          });
          let instpayload202 = new feeInstallmentPlanModel({
            feePlanId: feePlandata[i]._doc._id,
            studentRegId: feePlandata[i]._doc.studentRegId,
            label: "Installment004",
            displayName: `INST_2021-22_${(Number(dcount) + 1).toString().length == 1
              ? "00"
              : (Number(dcount) + 1).toString().length == 2
                ? "0"
                : ""
              }${Number(dcount) + 1}`,
            description: "Installment004",
            dueDate: new Date(`2021-November-10`),
            lateFeeStartDate: new Date(`2021-November-30`),
            percentage: 20,
            totalAmount: feeinstdata[j].totalAmount,
            // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
            plannedAmount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
            plannedAmountBreakup: [
              {
                amount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
                feeTypeCode: feeinstdata[j].plannedAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].plannedAmountBreakup[0].title,
              },
            ],
            paidAmount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
            paidAmountBreakup: [
              {
                amount: parseFloat(feeinstdata[j].totalAmount) * 0.2,
                feeTypeCode: feeinstdata[j].paidAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].paidAmountBreakup[0].title,
              },
            ],
            pendingAmount: 0,
            pendingAmountBreakup: [
              {
                amount: 0,
                feeTypeCode: feeinstdata[j].pendingAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].pendingAmountBreakup[0].title,
              },
            ],
            discountType: "",
            discountPercentage: 0,
            discountAmount: 0,
            discountAmountBreakup: [
              {
                amount: feeinstdata[j].discountAmountBreakup[0].amount,
                feeTypeCode: feeinstdata[j].discountAmountBreakup[0].feeTypeCode,
                title: feeinstdata[j].discountAmountBreakup[0].title,
              },
            ],
            status: "Paid",
            transactionId: "",
            campusId: feePlandata[i]._doc.campusId,
            remarks: {
              seller: "",
              finance: "",
              headseller: "",
            },
            "concessionFees": 0.0,
            "lateFees": 0.0
          });
          await feeInstallmentPlanModel.deleteOne({
            feePlanId: feePlandata[i]._doc._id,
            label: feeinstdata[j]._doc.label,
          });
          await instpayload201.save();
          await instpayload202.save();
        }
      }
      if (i + 1 == feePlandata.length) {
        console.log({ message: "fee installment plan updated" });
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res.send({ message: "fee installment plan updated" });
      }
    }
  }
  catch (err) {
    res.status(404).send({ status: "failure", message: "parent details: ", data: err.stack });
  }
  finally {
    await dbConnection.close()
    await centralDbConnection.close();
  }
};

module.exports.addStudentMaster = async (req, res) => {
  // let input = req.body;
  let centralDbConnection;
  let orgId = req.query.orgId;
  let leadId = req.query.leadId;
  let studenttype
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
    _id: mongoose.Types.ObjectId(orgId),
  });
  // let dbConnection = await createDatabase( `usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  // const instituteModel = dbConnection.model("orglists", OrgListSchema);
  console.log(req.body.organizationId);
  let dbConnectionp = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  const leadsSchema = mongoose.Schema({}, { strict: false });
  let leadsModel = dbConnectionp.model("leads", leadsSchema);
  try {
    let programPlanSchema = dbConnectionp.model(
      "programplans",
      ProgramPlanSchema
    );
    let feeStructureModel = dbConnectionp.model(
      "feestructures",
      FeeStructureSchema
    );
    let paymentScheduleModel = dbConnectionp.model(
      "paymentschedules",
      leadsSchema
    );
    let reminderModel = dbConnectionp.model(
      "reminderplans",
      ReminderScheduleSchema
    );
    let lateFeeModel = dbConnectionp.model("latefees", LateFeesSchema);
    let installmentModel = dbConnectionp.model(
      "installments",
      leadsSchema
    );
    let categoryModel = dbConnectionp.model("categoryplans", CategorySchema);
    let concessionModel = dbConnectionp.model(
      "concessionplans",
      ConcessionSchema
    );
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let feeManagerSchema = dbConnectionp.model("feemanagers", FeeManagerSchema);
    let feeMapModel = dbConnectionp.model(
      "studentFeesMap",
      StudentFeeMapSchema
    );
    let feeTypeModel = dbConnectionp.model("feeTypes", FeeTypeSchema);
    let guardianSchema = dbConnectionp.model("guardian", GuardianSchema);
    let transactionModel = dbConnectionp.model(
      "transactions",
      transactionsSchema
    );
    let feeLedgerModel = dbConnectionp.model("feeledgers", feesLedgerSchema);
    let campusModel = dbConnectionp.model("campuses", campusSchema);
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let leaddata = await leadsModel.findOne({ leadId: leadId });
    if (
      leaddata &&
      !leaddata._doc.accountStatus.toLowerCase().includes("student") && leaddata._doc.type.toLowerCase() !== "trial"
    ) {
      req.body = leaddata._doc;
      let campid1 = await campusModel.find({});
      let campid
      if (campid1.length == 0) {
        let newcampus = new campusModel({
          legalName: "Bright Kid Montessori House",
          organizationType: "Commercial",
          logo: "",
          name: "Bright Kid Montessori House",
          displayName: "BKAH",
          campusId: "CAMP_2021-22_001",
          dateOfRegistration: "",
          legalAddress: {
            address1: "No. 16, Beena Villa, 2nd Cross",
            address2: "Papamma Layout, Behind Ramamurthy Nagar Old Police Station",
            address3: " near D-Mart",
            city: "Bengaluru",
            state: "Karnataka",
            country: "India",
            pincode: "560016"
          },
          financialDetails: {
            GSTIN: "",
            PAN: ""
          },
          bankDetails: [
            {
              bankName: "",
              bankAccountName: "",
              bankAccountNumber: "",
              bankIFSC: "",
              status: "Active",
            }
          ],
          instituteContact: [
            {
              contactname: "",
              designation: "",
              department: "",
              emailAddress: "",
              phoneNumber: "",
              mobileNumber: "",
            },
          ],
          headApprover: [
            {
              headApproverName: "",
              designation: "",
              emailAddress: "",
              phoneNumber: "",
              mobileNumber: "",
            }
          ],
        })
        await newcampus.save();
        campid = newcampus._id
      }
      else {
        campid = campid1[0]._doc["_id"];
      }
      let finYear = `${req.body.programdetail.academicYear}-${Number(req.body.programdetail.academicYear.toString().slice(2, 4)) + 1}`
      let paymntschdata = await paymentScheduleModel.find({})
      let feeBreakup = []
      for (let i = 0; i < req.body.installmentDetails.length; i++) {
        feeBreakup.push(req.body.installmentDetails[i].percentage)
      }
      let yearbreakup = Math.round(12 / req.body.installmentDetails.length);
      let collectionperiods = { "1": "yearly", "2": "Half Yearly", "3": "4 Months", "4": "Quarterly", "6": "2 Months", "12": "Monthly" }
      let collect = collectionperiods[req.body.installmentDetails.length.toString()]
      console.log(collect)
      let dueDate = new Date(req.body.installmentDetails[0].dueDate)
      let dueDay = dueDate.getDate();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      var ppData = new paymentScheduleModel({
        _id: mongoose.Types.ObjectId(),
        displayName: `PYMSCH_${finYear}_${(Number(paymntschdata.length) + 1).toString().length == 1 ? "00" : (Number(paymntschdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(paymntschdata.length) + 1}`,
        title: `PYMSCH_${finYear}_${(Number(paymntschdata.length) + 1).toString().length == 1 ? "00" : (Number(paymntschdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(paymntschdata.length) + 1}`,
        refid: `PYMSCH_${finYear}_${(Number(paymntschdata.length) + 1).toString().length == 1 ? "00" : (Number(paymntschdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(paymntschdata.length) + 1}`,
        description: `PYMSCH_${finYear}_${(Number(paymntschdata.length) + 1).toString().length == 1 ? "00" : (Number(paymntschdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(paymntschdata.length) + 1}`,
        scheduleDetails: {
          collectEvery: collect,
          dueDate: dueDay,
          penaltyStartDate: null,
        },
        period: collect,
        startMonth: monthNames[dueDate.getMonth()],
        feesBreakUp: feeBreakup,
        campusId: campid,
        status: 1,
        createdBy: req.query.orgId
      });

      let allfeeStructureData = await feeStructureModel.find({});
      let feeStructureData
      if (allfeeStructureData.length == 0) {
        let feeTypeData = await feeTypeModel.find({});
        if (feeTypeData.length == 0) {
          let newFeeType = new feeTypeModel({
            _id: mongoose.Types.ObjectId(),
            displayName: `FT_${finYear}_${(1).toString().length == 1 ? "00" : (1).toString().length == 2 ? "0" : ""
              }${1}`,
            refid: `FT_${finYear}_${(1).toString().length == 1 ? "00" : (1).toString().length == 2 ? "0" : ""
              }${1}`,
            title: "Tuition Fees",
            description: "Tuition Fees",
            roleView: 'Admin',
            partialAllowed: true,
            campusId: campid,
            status: 1,
            createdBy: req.query.orgId,
          })
          await newFeeType.save();
          let newFS = new feeStructureModel({
            _id: mongoose.Types.ObjectId(),
            displayName: `FS_${finYear}_${(Number(1)).toString().length == 1 ? "00" : (Number(1)).toString().length == 2 ? "0" : ""
              }${Number(1)}`,
            refid: `FS_${finYear}_${(Number(1)).toString().length == 1 ? "00" : (Number(1)).toString().length == 2 ? "0" : ""
              }${Number(1)}`,
            title: "Tuition Fees",
            description: "Tuition Fees",
            feeTypeIds: newFeeType._id,
            campusId: campid,
            status: 1,
            createdBy: req.query.orgId,
          })
          await newFS.save();
          feeStructureData = newFS;
        }
        else {
          let newFS = new feeStructureModel({
            _id: mongoose.Types.ObjectId(),
            displayName: `FS_${finYear}_${(Number(1)).toString().length == 1 ? "00" : (Number(1)).toString().length == 2 ? "0" : ""
              }${Number(1)}`,
            refid: `FS_${finYear}_${(Number(1)).toString().length == 1 ? "00" : (Number(1)).toString().length == 2 ? "0" : ""
              }${Number(1)}`,
            title: "Tuition Fees",
            description: "Tuition Fees",
            feeTypeIds: feeTypeData[0]._doc._id,
            campusId: campid,
            status: 1,
            createdBy: req.query.orgId,
          })
          await newFS.save();
          feeStructureData = newFS;
        }
      }
      else {
        feeStructureData = allfeeStructureData[0]._doc;
      }

      let programPlanData = await programPlanSchema.findOne({
        HEDAID: req.body.programdetail.programPlanId,
      });
      let allprogramPlanData = await programPlanSchema.find({});
      if (!programPlanData) {
        let cdate = new Date();
        let newPPlan = new programPlanSchema({
          _id: mongoose.Types.ObjectId(),
          displayName: `PP_${finYear}_${(Number(allprogramPlanData.length) + 1).toString().length == 1 ? "00" : (Number(allprogramPlanData.length) + 1).toString().length == 2 ? "0" : ""
            }${Number(allprogramPlanData.length) + 1}`,
          refid: `PP_${finYear}_${(Number(allprogramPlanData.length) + 1).toString().length == 1 ? "00" : (Number(allprogramPlanData.length) + 1).toString().length == 2 ? "0" : ""
            }${Number(allprogramPlanData.length) + 1}`,
          HEDAID: req.body.programdetail.programPlanId,
          title: req.body.programdetail.programPlanName,
          fromDate: `${monthNames[cdate.getMonth()]} 01 ${req.body.programdetail.academicYear}`,
          toDate: `${monthNames[cdate.getMonth() - 1]} 30 ${req.body.programdetail.academicYear}`,
          academicYear: `${req.body.programdetail.academicYear}-${Number(req.body.programdetail.academicYear.toString().slice(2, 4)) + 1}`,
          description: req.body.programdetail.programPlanName,
          campusId: campid,
          status: 1,
          createdBy: req.query.orgId,
        })
        await newPPlan.save()
        programPlanData = newPPlan
      }
      let allinstdata = await installmentModel.find({})
      let newInstall = new installmentModel({
        _id: mongoose.Types.ObjectId(),
        displayName: `INST_${finYear}_${(Number(allinstdata.length) + 1).toString().length == 1 ? "00" : (Number(allinstdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(allinstdata.length) + 1}`,
        refid: `INST_${finYear}_${(Number(allinstdata.length) + 1).toString().length == 1 ? "00" : (Number(allinstdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(allinstdata.length) + 1}`,
        title: `INST_${finYear}_${(Number(allinstdata.length) + 1).toString().length == 1 ? "00" : (Number(allinstdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(allinstdata.length) + 1}`,
        description: `INST_${finYear}_${(Number(allinstdata.length) + 1).toString().length == 1 ? "00" : (Number(allinstdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(allinstdata.length) + 1}`,
        numberOfInstallments: req.body.installmentDetails.length,
        frequency: `${yearbreakup} Months`,
        dueDate: dueDay,
        percentageBreakup: feeBreakup,
        campusId: campid,
        status: 1,
        createdBy: req.query.orgId,
        updatedBy: req.query.orgId,
      })
      let existpaysh = await paymntschdata.find(item => item._doc.scheduleDetails.collectEvery == collect && item._doc.scheduleDetails.dueDate == dueDay.toString());
      if (!existpaysh) {
        await newInstall.save();
        await ppData.save();
      }

      var guardianDetails = {
        isPrimary: true,
        firstName: req.body.parent.name,
        lastName: " ",
        fullName: req.body.parent.name,
        mobile:
          req.body.parent.phoneNumber !== ""
            ? req.body.parent.phoneNumber
            : "-",
        email: req.body.parent.email !== "" ? req.body.parent.email : "-",
        PIIUsageFlag: true,
        PIIUsageFlagUpdated: new Date(),
        fatherDetails: "",
        motherDetails: "",
        guardianDetails: "",
        relation: "Parent",
        createdBy: "FC Admin",
      };
      let guardianData = new guardianSchema(guardianDetails);
      let allexiststds = await studentModel.find({});
      let existstd = await studentModel.findOne({ parentPhone: req.body.parentPhone });
      console.log(existstd)
      if (existstd) {
        console.log("existing")
        await guardianSchema.updateOne({ _id: existstd._doc.guardianDetails[0] }, { $set: guardianDetails })
      }
      else {
        await guardianData.save();
      }
      // var guardianResponse = await guardianData.save();
      // console.log("guardiandetails", ppInputData["feeStructure"], ppInputData["Program Plan ID"]);
      // console.log("prorgamplan", programPlanData);

      // console.log(feeStructureData,programPlanData)
      let rollnum = `BKAHSTU${(1 + allexiststds.length).toString().length == 1
        ? "00"
        : (1 + allexiststds.length).toString().length == 2
          ? "0"
          : ""
        }${1 + allexiststds.length}`;
      var ppData = {
        // _id: mongoose.Types.ObjectId(),
        displayName: `STU_${req.body.programdetail.academicYear}_${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        regId: `BKAHSTU${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        rollNumber: `BKAHSTU${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        salutation: null,
        category: "", // Category
        section: "",
        firstName: req.body.student.firstName, //First Name *
        middleName: req.body.student.middleName, //
        lastName: req.body.student.lastName, //Last Name *
        guardianDetails: [guardianData._id],
        gender: req.body.student.gender, //Gender
        dob: req.body.student.dob,
        citizenship: req.body.student.citizenShip, //
        currency: "INR", //
        FOREX: 1, //
        admittedOn: req.body.student.admittedOn.toLowerCase() == "na" ? new Date() : req.body.student.admittedOn,
        // admittedOn: new Date(req.body.student.admittedOn) instanceof Date ? new Date(req.body.student.admittedOn) : null, //Admitted Date *
        programPlanId: programPlanData._id,
        feeStructureId: feeStructureData._id,
        phoneNo: req.body.student.phoneNumber, //Phone Number *
        email: req.body.student.email, // Email Address *
        alternateEmail:
          req.body.student["alterEmail"] != undefined
            ? req.body.student["alterEmail"]
            : null,
        parentName: req.body.parent.name,
        parentPhone: req.body.parent.phoneNumber,
        parentEmail: req.body.parent.email,
        relation: "parent",
        addressDetails: {
          address1: req.body.parent.address.address1,
          address2: req.body.parent.address.address2,
          address3: req.body.parent.address.address3,
          city: req.body.parent.address.city,
          state: req.body.parent.address.state,
          country: req.body.parent.address.country, //Country
          pincode: req.body.parent.address.pinCode, //PIN Code
        },
        isFinalYear: false,
        final: "",
        campusId: campid,
        status: 1,
        createdBy: "FC Admin",
      };
      if (existstd && existstd._doc.status.toString() == "2") {
        let feeplanData = await feePlanModel.deleteOne({ studentRegId: existstd._doc.regId })
        rollnum = existstd._doc.rollNumber
        ppData.rollNumber = existstd._doc.rollNumber
        ppData.regId = existstd._doc.regId
        ppData.displayName = existstd._doc.displayName
        ppData.programPlanId = existstd._doc.programPlanId
        ppData.feeStructureId = existstd._doc.feeStructureId
        await studentModel.updateOne({ _id: existstd._doc._id }, { $set: ppData });
        console.log("student Updated");
      }
      else {
        let newstd = new studentModel(ppData);
        await newstd.save();
        console.log("student Created");
      }
      let studentData = await studentModel.findOne({
        rollNumber: rollnum,
      });

      if (!studentData) {
        console.log(stdfeeMaps[j]);
      }
      let prplan = programPlanData._doc;

      var d = new Date("2021-04-01");
      var d2 = new Date("2021-04-01");
      let amountp = req.body.programPlan.offeredFees;
      let amountr = 0;
      let pend = amountp;
      let paidamt = 0;
      let rid = 0;
      trdate = null;
      let feesbkp = [];
      let paidamts = [];
      let feeTypeDetails = await feeTypeModel.find({});
      for (ll = 0; ll < feeTypeDetails.length; ll++) {
        if (
          feeTypeDetails[ll]._doc.title
            .trim()
            .toLowerCase()
            .includes("tuition") &&
          campid.toString()
        ) {
          feesbkp.push({
            amount: isNaN(Number(amountp)) ? 0.0 : amountp,
            paid: 0.0,
            pending: isNaN(Number(amountp)) ? 0.0 : amountp,
            feeTypeCode: feeTypeDetails[ll]._doc["displayName"],
            title: feeTypeDetails[ll]._doc["title"],
          });
          paidamts.push(0);
        }
      }
      var stmapid = {
        displayName: `SFM_${req.body.programdetail.academicYear}_${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        studentId: studentData._doc._id,
        usn: studentData._doc.regId,
        programPlanId: studentData._doc.programPlanId,
        feeStructureId: studentData._doc.feeStructureId,
        feeManagerId: undefined,
        dueDate: new Date(),
        amount: isNaN(Number(amountp)) ? 0.0 : amountp,
        paid: 0.0,
        receivedDate: trdate,
        receiptNumbers: "",
        concession: 0,
        fine: 0,
        pending: isNaN(Number(amountp)) ? 0.0 : amountp,
        transactionPlan: {
          feesBreakUp: feesbkp,
          totalAmount: isNaN(amountp) ? 0.0 : amountp,
          paidAmount: paidamts,
          totalPaid: 0.0,
          totalPending: isNaN(amountp) ? 0.0 : amountp,
        },
        campusId: campid,
        status: 1,
        createdBy: "FC Admin",
      };
      let newstmaps = new feeMapModel(stmapid);
      let savefm = await newstmaps.save();
      console.log("student maps created");
      let trdata = await transactionModel.findOne({ studentId: studentData._doc._id })
      let payment
      if (!trdata) {
        payment = Number(req.body.installmentDetails[0].amount);
      }
      else {
        payment = Number(req.body.installmentDetails[0].amount) - Number(trdata._doc.amount);
      }
      console.log("payment", payment)
      //creating feeplans and installment plans
      studentData = studentData._doc;

      let stuFeeplan = {
        _id: mongoose.Types.ObjectId(),
        applicationId: `FPLAN_${req.body.programdetail.academicYear}_${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        studentRegId: studentData.regId,
        studentId: studentData._id,
        programPlanHEDAId: studentData.programPlanId,
        totalAmount: Number(req.body.programPlan.offeredFees),
        plannedAmount: Number(req.body.programPlan.offeredFees),
        plannedAmountBreakup: [
          {
            amount: Number(req.body.programPlan.offeredFees),
            feeTypeCode: feeTypeDetails[0]._doc["displayName"],
            title: feeTypeDetails[0]._doc["title"],
          },
        ],
        paidAmount: 0,
        paidAmountBreakup: [
          {
            amount: 0,
            feeTypeCode: feeTypeDetails[0]._doc["displayName"],
            title: feeTypeDetails[0]._doc["title"],
          },
        ],
        pendingAmount: req.body.programPlan.offeredFees,
        pendingAmountBreakup: [
          {
            amount: Number(req.body.programPlan.offeredFees),
            feeTypeCode: feeTypeDetails[0]._doc["displayName"],
            title: feeTypeDetails[0]._doc["title"],
          },
        ],
        currency: studentData.currency,
        forex: studentData.FOREX,
        discountType: "",
        discountPercentage: 0,
        discountAmount: 0,
        dueDate: req.body.installmentDetails[0].dueDate,
        penaltyStartDate: "",
        percentageBreakup: [],
        installmentPlan: {},
        discountAmountBreakup: [
          {
            amount: 0,
            feeTypeCode: feeTypeDetails[0]._doc["displayName"],
            title: feeTypeDetails[0]._doc["title"],
          },
        ],
        campusId: campid,
        remarks: {
          seller: "",
          finance: "",
          headseller: "",
        },
      };
      let newfeeplan = new feePlanModel(stuFeeplan);
      let cnewfeeplan = await newfeeplan.save();
      console.log(cnewfeeplan);
      let instdata = await feeInstallmentPlanModel.find({});
      let dcount = instdata.length;
      let installmentplans = [];
      for (let i = 0; i < req.body.installmentDetails.length; i++) {
        dcount++;
        let count = i + 1;
        let stuinstallplans = new feeInstallmentPlanModel({
          feePlanId: stuFeeplan._id,
          label: `Installment${Number(count).toString().length == 1
            ? "00"
            : Number(count).toString().length == 2
              ? "0"
              : ""
            }${Number(count)}`,
          displayName: `INST_${req.body.programdetail.academicYear}_${(Number(dcount) + 1).toString().length == 1
            ? "00"
            : (Number(dcount) + 1).toString().length == 2
              ? "0"
              : ""
            }${Number(dcount) + 1}`,
          description: `Installment${Number(count).toString().length == 1
            ? "00"
            : Number(count).toString().length == 2
              ? "0"
              : ""
            }${Number(count)}`,
          dueDate: req.body.installmentDetails[i].dueDate,
          lateFeeStartDate: req.body.installmentDetails[i].dueDate,
          percentage: Number(req.body.installmentDetails[i].percentage),
          totalAmount: Number(req.body.programPlan.offeredFees),
          // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
          plannedAmount: Number(req.body.installmentDetails[i].amount),
          plannedAmountBreakup: [
            {
              amount: Number(req.body.installmentDetails[i].amount),
              feeTypeCode: feeTypeDetails[0]._doc["displayName"],
              title: feeTypeDetails[0]._doc["title"],
            },
          ],
          paidAmount: 0,
          paidAmountBreakup: [
            {
              amount: 0,
              feeTypeCode: feeTypeDetails[0]._doc["displayName"],
              title: feeTypeDetails[0]._doc["title"],
            },
          ],
          pendingAmount: Number(req.body.installmentDetails[i].amount),
          pendingAmountBreakup: [
            {
              amount: Number(req.body.installmentDetails[i].amount),
              feeTypeCode: feeTypeDetails[0]._doc["displayName"],
              title: feeTypeDetails[0]._doc["title"],
            },
          ],
          discountType: "",
          discountPercentage: 0,
          discountAmount: 0,
          discountAmountBreakup: [
            {
              amount: 0,
              feeTypeCode: feeTypeDetails[0]._doc["displayName"],
              title: feeTypeDetails[0]._doc["title"],
            },
          ],
          status: "Planned",
          transactionId: "",
          campusId: campid,
          remarks: {
            seller: "",
            finance: "",
            headseller: "",
          },
        });
        await stuinstallplans.save();
        if (i + 1 == req.body.installmentDetails.length) {
          // if (i + 1 == req.body.installmentDetails.length && req.body.installmentDetails[0].status.toLowerCase()=="paid") {
          console.log("fee plan and installement plan created");
          inputData = {
            transactionDate: new Date(),
            relatedTransactions: [],
            studentId: studentData._id,
            emailCommunicationRefIds:
              req.body.parent.email !== ""
                ? req.body.parent.email
                : req.body.student.email,
            transactionType: "eduFees",
            transactionSubType: "feePayment",
            studentFeeMap: stmapid.displayName,
            amount: payment,
            status: "initiated",
            userName: "test user",
            data: {
              feesBreakUp: [
                {
                  feeType: "Tuition Fee ",
                  amount: stmapid,
                  feeTypeCode: feeTypeDetails[0]._doc.displayName,
                },
              ],
              orgId: req.body.organizationId,
              transactionType: "eduFees",
              transactionSubType: "feePayment",
              mode: "netbanking",
              method: "card",
              modeDetails: {
                netBankingType: null,
                walletType: null,
                instrumentNo: null,
                cardType: null,
                nameOnCard: null,
                cardNumber: null,
                instrumentDate: new Date(),
                bankName: null,
                branchName: null,
                transactionId: req.body.installmentDetails[0].transactionId,
                remarks: "first installment payment",
              },
            },
            paymentTransactionId: req.body.installmentDetails[0].transactionId,
            createdBy: req.body.organizationId,
            campusId: campid,
            academicYear: req.body.programdetail.academicYear,
            class: req.body.programdetail.programPlanName,
            studentName: `${studentData.firstName} ${studentData.lastName}`,
            studentRegId: studentData.regId,
            programPlanId: prplan._id,
            parentName: studentData.parentName,
            type: "receipt",
          };

          createOtcPayment({ body: inputData }, orgData, dbConnectionp)
            .then(async (createdTr) => {
              let feeplandata = await feePlanModel.findOne({
                studentRegId: studentData.regId,
              });
              let feeinstdata = await feeInstallmentPlanModel.find({
                feePlanId: feeplandata._doc._id,
              });
              await leadsModel.updateOne(
                { leadId: leadId },
                { $set: { accountStatus: "Student Created" } }
              );
              console.log("transactions created");
              dbConnectionp.close();
              centralDbConnection.close();
              res.header("Access-Control-Allow-Origin", "*");
              res.header(
                "Access-Control-Allow-Methods",
                "GET,HEAD,OPTIONS,POST,PUT"
              );
              res.header(
                "Access-Control-Allow-Headers",
                "Origin, X-Requested-With, Content-Type, Accept, Authorization"
              );
              res.send({
                status: "success",
                message: `Student Created Successfully for the Application ID ${leaddata._doc.applicationId}`,
                // data: {
                //   student: studentData,
                //   guardian: guardianData,
                //   feePlansData: feeplandata,
                //   feeInstallmentData: feeinstdata,
                //   transaction: createdTr,
                // },
              });
            })
            .catch((error) => {
              dbConnectionp.close();
              centralDbConnection.close();
              console.log("error", error.stack);
              res.send(error.stack);
            });
        }
      }
    } else if (leaddata &&
      !leaddata._doc.accountStatus.toLowerCase().includes("student") && leaddata._doc.type.toLowerCase() == "trial") {
      console.log("came to trial")
      req.body = leaddata._doc;
      let campid1 = await campusModel.find({});
      let campid
      if (campid1.length == 0) {
        let newcampus = new campusModel({
          legalName: "Bright Kid Montessori House",
          organizationType: "Commercial",
          logo: "",
          name: "Bright Kid Montessori House",
          displayName: "BKAH",
          campusId: "CAMP_2021-22_001",
          dateOfRegistration: "",
          legalAddress: {
            address1: "No. 16, Beena Villa, 2nd Cross",
            address2: "Papamma Layout, Behind Ramamurthy Nagar Old Police Station",
            address3: " near D-Mart",
            city: "Bengaluru",
            state: "Karnataka",
            country: "India",
            pincode: "560016"
          },
          financialDetails: {
            GSTIN: "",
            PAN: ""
          },
          bankDetails: [
            {
              bankName: "",
              bankAccountName: "",
              bankAccountNumber: "",
              bankIFSC: "",
              status: "Active",
            }
          ],
          instituteContact: [
            {
              contactname: "",
              designation: "",
              department: "",
              emailAddress: "",
              phoneNumber: "",
              mobileNumber: "",
            },
          ],
          headApprover: [
            {
              headApproverName: "",
              designation: "",
              emailAddress: "",
              phoneNumber: "",
              mobileNumber: "",
            }
          ],
        })
        await newcampus.save();
        campid = newcampus._id
      }
      else {
        campid = campid1[0]._doc["_id"];
      }
      let finYear = `${req.body.programdetail.academicYear}-${Number(req.body.programdetail.academicYear.toString().slice(2, 4)) + 1}`
      let paymntschdata = await paymentScheduleModel.find({})
      let feeBreakup = []
      for (let i = 0; i < req.body.installmentDetails.length; i++) {
        feeBreakup.push(req.body.installmentDetails[i].percentage)
      }
      let yearbreakup = Math.round(12 / req.body.installmentDetails.length);
      let collectionperiods = { "1": "yearly", "2": "Half Yearly", "3": "4 Months", "4": "Quarterly", "6": "2 Months", "12": "Monthly" }
      let collect = collectionperiods[req.body.installmentDetails.length.toString()]
      console.log(collect)
      let dueDate = new Date(req.body.installmentDetails[0].dueDate)
      let dueDay = dueDate.getDate();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      var ppData = new paymentScheduleModel({
        _id: mongoose.Types.ObjectId(),
        displayName: `PYMSCH_${finYear}_${(Number(paymntschdata.length) + 1).toString().length == 1 ? "00" : (Number(paymntschdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(paymntschdata.length) + 1}`,
        title: `PYMSCH_${finYear}_${(Number(paymntschdata.length) + 1).toString().length == 1 ? "00" : (Number(paymntschdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(paymntschdata.length) + 1}`,
        refid: `PYMSCH_${finYear}_${(Number(paymntschdata.length) + 1).toString().length == 1 ? "00" : (Number(paymntschdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(paymntschdata.length) + 1}`,
        description: `PYMSCH_${finYear}_${(Number(paymntschdata.length) + 1).toString().length == 1 ? "00" : (Number(paymntschdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(paymntschdata.length) + 1}`,
        scheduleDetails: {
          collectEvery: collect,
          dueDate: dueDay,
          penaltyStartDate: null,
        },
        period: collect,
        startMonth: monthNames[dueDate.getMonth()],
        feesBreakUp: feeBreakup,
        campusId: campid,
        status: 1,
        createdBy: req.query.orgId
      });

      let allfeeStructureData = await feeStructureModel.find({});
      let feeStructureData
      if (allfeeStructureData.length == 0) {
        let feeTypeData = await feeTypeModel.find({});
        if (feeTypeData.length == 0) {
          let newFeeType = new feeTypeModel({
            _id: mongoose.Types.ObjectId(),
            displayName: `FT_${finYear}_${(1).toString().length == 1 ? "00" : (1).toString().length == 2 ? "0" : ""
              }${1}`,
            refid: `FT_${finYear}_${(1).toString().length == 1 ? "00" : (1).toString().length == 2 ? "0" : ""
              }${1}`,
            title: "Tuition Fees",
            description: "Tuition Fees",
            roleView: 'Admin',
            partialAllowed: true,
            campusId: campid,
            status: 1,
            createdBy: req.query.orgId,
          })
          await newFeeType.save();
          let newFS = new feeStructureModel({
            _id: mongoose.Types.ObjectId(),
            displayName: `FS_${finYear}_${(Number(1)).toString().length == 1 ? "00" : (Number(1)).toString().length == 2 ? "0" : ""
              }${Number(1)}`,
            refid: `FS_${finYear}_${(Number(1)).toString().length == 1 ? "00" : (Number(1)).toString().length == 2 ? "0" : ""
              }${Number(1)}`,
            title: "Tuition Fees",
            description: "Tuition Fees",
            feeTypeIds: newFeeType._id,
            campusId: campid,
            status: 1,
            createdBy: req.query.orgId,
          })
          await newFS.save();
          feeStructureData = newFS;
        }
        else {
          let newFS = new feeStructureModel({
            _id: mongoose.Types.ObjectId(),
            displayName: `FS_${finYear}_${(Number(1)).toString().length == 1 ? "00" : (Number(1)).toString().length == 2 ? "0" : ""
              }${Number(1)}`,
            refid: `FS_${finYear}_${(Number(1)).toString().length == 1 ? "00" : (Number(1)).toString().length == 2 ? "0" : ""
              }${Number(1)}`,
            title: "Tuition Fees",
            description: "Tuition Fees",
            feeTypeIds: feeTypeData[0]._doc._id,
            campusId: campid,
            status: 1,
            createdBy: req.query.orgId,
          })
          await newFS.save();
          feeStructureData = newFS;
        }
      }
      else {
        feeStructureData = allfeeStructureData[0]._doc;
      }

      let programPlanData = await programPlanSchema.findOne({
        HEDAID: req.body.programdetail.programPlanId,
      });
      let allprogramPlanData = await programPlanSchema.find({});
      if (!programPlanData) {
        let cdate = new Date();
        let newPPlan = new programPlanSchema({
          _id: mongoose.Types.ObjectId(),
          displayName: `PP_${finYear}_${(Number(allprogramPlanData.length) + 1).toString().length == 1 ? "00" : (Number(allprogramPlanData.length) + 1).toString().length == 2 ? "0" : ""
            }${Number(allprogramPlanData.length) + 1}`,
          refid: `PP_${finYear}_${(Number(allprogramPlanData.length) + 1).toString().length == 1 ? "00" : (Number(allprogramPlanData.length) + 1).toString().length == 2 ? "0" : ""
            }${Number(allprogramPlanData.length) + 1}`,
          HEDAID: req.body.programdetail.programPlanId,
          title: req.body.programdetail.programPlanName,
          fromDate: `${monthNames[cdate.getMonth()]} 01 ${req.body.programdetail.academicYear}`,
          toDate: `${monthNames[cdate.getMonth() - 1]} 30 ${req.body.programdetail.academicYear}`,
          academicYear: `${req.body.programdetail.academicYear}-${Number(req.body.programdetail.academicYear.toString().slice(2, 4)) + 1}`,
          description: req.body.programdetail.programPlanName,
          campusId: campid,
          status: 1,
          createdBy: req.query.orgId,
        })
        await newPPlan.save()
        programPlanData = newPPlan
      }
      let allinstdata = await installmentModel.find({})
      let newInstall = new installmentModel({
        _id: mongoose.Types.ObjectId(),
        displayName: `INST_${finYear}_${(Number(allinstdata.length) + 1).toString().length == 1 ? "00" : (Number(allinstdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(allinstdata.length) + 1}`,
        refid: `INST_${finYear}_${(Number(allinstdata.length) + 1).toString().length == 1 ? "00" : (Number(allinstdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(allinstdata.length) + 1}`,
        title: `INST_${finYear}_${(Number(allinstdata.length) + 1).toString().length == 1 ? "00" : (Number(allinstdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(allinstdata.length) + 1}`,
        description: `INST_${finYear}_${(Number(allinstdata.length) + 1).toString().length == 1 ? "00" : (Number(allinstdata.length) + 1).toString().length == 2 ? "0" : ""
          }${Number(allinstdata.length) + 1}`,
        numberOfInstallments: req.body.installmentDetails.length,
        frequency: `${yearbreakup} Months`,
        dueDate: dueDay,
        percentageBreakup: feeBreakup,
        campusId: campid,
        status: 1,
        createdBy: req.query.orgId,
        updatedBy: req.query.orgId,
      })
      let existpaysh = await paymntschdata.find(item => item._doc.scheduleDetails.collectEvery == collect && item._doc.scheduleDetails.dueDate == dueDay.toString());
      if (!existpaysh) {
        await newInstall.save();
        await ppData.save();
      }
      var guardianDetails = {
        isPrimary: true,
        firstName: req.body.parent.name,
        lastName: " ",
        fullName: req.body.parent.name,
        mobile:
          req.body.parent.phoneNumber !== ""
            ? req.body.parent.phoneNumber
            : "-",
        email: req.body.parent.email !== "" ? req.body.parent.email : "-",
        PIIUsageFlag: true,
        PIIUsageFlagUpdated: new Date(),
        fatherDetails: "",
        motherDetails: "",
        guardianDetails: "",
        relation: "Parent",
        createdBy: "FC Admin",
      };
      let guardianData = new guardianSchema(guardianDetails);
      await guardianData.save();
      // var guardianResponse = await guardianData.save();
      // console.log("guardiandetails", ppInputData["feeStructure"], ppInputData["Program Plan ID"]);
      // console.log("prorgamplan", programPlanData);
      let allexiststds = await studentModel.find({});
      // console.log(feeStructureData,programPlanData)
      let rollnum = `BKAHSTU${(1 + allexiststds.length).toString().length == 1
        ? "00"
        : (1 + allexiststds.length).toString().length == 2
          ? "0"
          : ""
        }${1 + allexiststds.length}`;
      var ppData = {
        _id: mongoose.Types.ObjectId(),
        displayName: `STU_${req.body.programdetail.academicYear}_${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        regId: `BKAHSTU${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        rollNumber: `BKAHSTU${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        salutation: null,
        category: "", // Category
        section: "",
        firstName: req.body.student.firstName, //First Name *
        middleName: req.body.student.middleName, //
        lastName: req.body.student.lastName, //Last Name *
        guardianDetails: [guardianData._id],
        gender: req.body.student.gender, //Gender
        dob: req.body.student.dob,
        citizenship: req.body.student.citizenShip, //
        currency: "INR", //
        FOREX: 1, //
        admittedOn: req.body.student.admittedOn.toLowerCase() == "na" ? new Date() : req.body.student.admittedOn,
        // admittedOn: new Date(req.body.student.admittedOn) instanceof Date ? new Date(req.body.student.admittedOn) : null, //Admitted Date *
        programPlanId: programPlanData._id,
        feeStructureId: feeStructureData._id,
        phoneNo: req.body.student.phoneNumber, //Phone Number *
        email: req.body.student.email, // Email Address *
        alternateEmail:
          req.body.student["alterEmail"] != undefined
            ? req.body.student["alterEmail"]
            : null,
        parentName: req.body.parent.name,
        parentPhone: req.body.parent.phoneNumber,
        parentEmail: req.body.parent.email,
        relation: "parent",
        addressDetails: {
          address1: req.body.parent.address.address1,
          address2: req.body.parent.address.address2,
          address3: req.body.parent.address.address3,
          city: req.body.parent.address.city,
          state: req.body.parent.address.state,
          country: req.body.parent.address.country, //Country
          pincode: req.body.parent.address.pinCode, //PIN Code
        },
        isFinalYear: false,
        final: "",
        campusId: campid,
        status: 2,
        createdBy: "FC Admin",
      };
      let newstd = new studentModel(ppData);
      await newstd.save();
      console.log("student Created");
      let payment = Number(req.body.installmentDetails[0].amount);
      let studentData = await studentModel.findOne({
        rollNumber: rollnum,
      });
      studentData = studentData._doc;
      let feeTypeDetails = await feeTypeModel.find({});

      let stuFeeplan = {
        _id: mongoose.Types.ObjectId(),
        applicationId: `FPLAN_${req.body.programdetail.academicYear}_${(1 + allexiststds.length).toString().length == 1
          ? "00"
          : (1 + allexiststds.length).toString().length == 2
            ? "0"
            : ""
          }${1 + allexiststds.length}`,
        studentRegId: studentData.regId,
        studentId: studentData._id,
        programPlanHEDAId: studentData.programPlanId,
        plannedAmount: payment,
        plannedAmountBreakup: [
          {
            amount: payment,
            feeTypeCode: feeTypeDetails[0]._doc["displayName"],
            title: feeTypeDetails[0]._doc["title"],
          },
        ],
        paidAmount: payment,
        paidAmountBreakup: [
          {
            amount: payment,
            feeTypeCode: feeTypeDetails[0]._doc["displayName"],
            title: feeTypeDetails[0]._doc["title"],
          },
        ],
        pendingAmount: 0,
        pendingAmountBreakup: [
          {
            amount: 0,
            feeTypeCode: feeTypeDetails[0]._doc["displayName"],
            title: feeTypeDetails[0]._doc["title"],
          },
        ],
        currency: studentData.currency,
        forex: studentData.FOREX,
        discountType: "",
        discountPercentage: 0,
        discountAmount: 0,
        dueDate: req.body.installmentDetails[0].dueDate,
        penaltyStartDate: "",
        percentageBreakup: [],
        installmentPlan: {},
        discountAmountBreakup: [
          {
            amount: 0,
            feeTypeCode: feeTypeDetails[0]._doc["displayName"],
            title: feeTypeDetails[0]._doc["title"],
          },
        ],
        campusId: campid,
        remarks: {
          seller: "",
          finance: "",
          headseller: "",
        },
      };
      let newfeeplan = new feePlanModel(stuFeeplan);
      let cnewfeeplan = await newfeeplan.save();
      console.log("fee plan and installement plan created");
      let prplan = programPlanData._doc;
      inputData = {
        transactionDate: new Date(),
        relatedTransactions: [],
        studentId: studentData._id,
        emailCommunicationRefIds:
          req.body.parent.email !== ""
            ? req.body.parent.email
            : req.body.student.email,
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        studentFeeMap: null,
        amount: payment,
        status: "initiated",
        userName: "test user",
        data: {
          feesBreakUp: [
            {
              feeType: "Tuition Fee ",
              amount: {},
              feeTypeCode: feeTypeDetails[0]._doc.displayName,
            },
          ],
          orgId: req.body.organizationId,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          mode: "netbanking",
          method: "card",
          modeDetails: {
            netBankingType: null,
            walletType: null,
            instrumentNo: null,
            cardType: null,
            nameOnCard: null,
            cardNumber: null,
            instrumentDate: new Date(),
            bankName: null,
            branchName: null,
            transactionId: req.body.installmentDetails[0].transactionId == undefined ? null : req.body.installmentDetails[0].transactionId,
            remarks: "Trail Fees Payment",
          },
        },
        paymentTransactionId: req.body.installmentDetails[0].transactionId == undefined ? null : req.body.installmentDetails[0].transactionId,
        createdBy: req.body.organizationId,
        campusId: campid,
        academicYear: req.body.programdetail.academicYear,
        class: req.body.programdetail.programPlanName,
        studentName: `${studentData.firstName} ${studentData.lastName}`,
        studentRegId: studentData.regId,
        programPlanId: prplan._id,
        parentName: studentData.parentName,
        type: "receipt",
      };

      createOtcPaymentTrial({ body: inputData }, orgData, dbConnectionp)
        .then(async (createdTr) => {
          await leadsModel.updateOne(
            { leadId: leadId },
            { $set: { accountStatus: "Trail Student Created" } }
          );
          console.log("transactions created");
          dbConnectionp.close();
          centralDbConnection.close();
          res.header("Access-Control-Allow-Origin", "*");
          res.header(
            "Access-Control-Allow-Methods",
            "GET,HEAD,OPTIONS,POST,PUT"
          );
          res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization"
          );
          res.send({
            status: "success",
            message: `Trail Student Created Successfully for the Application ID ${leaddata._doc.applicationId}`,
          });
        })
        .catch((error) => {
          dbConnectionp.close();
          centralDbConnection.close();
          console.log("error", error);
          res.send(error.stack);
        });
    } else {
      let message;
      let statuscode;
      if (!leaddata) {
        message = "Lead Information Not Found";
        statuscode = 404;
      } else if (
        leaddata._doc.accountStatus.toLowerCase().includes("student")
      ) {
        message = `Student Already Exist for the application ID ${leaddata._doc.applicationId}`;
        statuscode = 409;
      }
      if (
        leaddata._doc.accountStatus.toLowerCase().includes("student") && leaddata._doc.accountStatus.toLowerCase().includes("failed")
      ) {
        message = `Student Creation Failed for the application ID ${leaddata._doc.applicationId}`;
        statuscode = 409;
      }
      dbConnectionp.close();
      centralDbConnection.close();
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.status(statuscode).send({
        status: "failed",
        statuscode: statuscode,
        message: message,
      });
    }
  } catch (err) {
    await leadsModel.updateOne(
      { leadId: leadId },
      { $set: { accountStatus: "Student Creation Falied" } }
    );
    dbConnectionp.close();
    res.json({
      status: "failure",
      message: "student master creation: " + err.stack,
    });
  }
  finally {
    // dbConnectionp.close();
    // centralDbConnection.close();
  }
};

module.exports.addStudentMasterold = async (req, res) => {
  let input = req.body;
  let centralDbConnection;
  let orgId = req.body.orgId;
  // try {
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
    _id: mongoose.Types.ObjectId(orgId),
  });
  // let dbConnection = await createDatabase( `usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  // const instituteModel = dbConnection.model("orglists", OrgListSchema);
  console.log(req.query.orgId);
  let dbConnectionp = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  let programPlanSchema = dbConnectionp.model(
    "programplans",
    ProgramPlanSchema
  );
  let feeStructureModel = dbConnectionp.model(
    "feestructures",
    FeeStructureSchema
  );
  let paymentScheduleModel = dbConnectionp.model(
    "paymentschedules",
    paymentScheduleSchema
  );
  let reminderModel = dbConnectionp.model(
    "reminderplans",
    ReminderScheduleSchema
  );
  let lateFeeModel = dbConnectionp.model("latefees", LateFeesSchema);
  let installmentModel = dbConnectionp.model("installments", InstallmentSchema);
  let categoryModel = dbConnectionp.model("categoryplans", CategorySchema);
  let concessionModel = dbConnectionp.model(
    "concessionplans",
    ConcessionSchema
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let feeManagerSchema = dbConnectionp.model("feemanagers", FeeManagerSchema);
  let feeMapModel = dbConnectionp.model("studentFeesMap", StudentFeeMapSchema);
  let feeTypeModel = dbConnectionp.model("feeTypes", FeeTypeSchema);
  let guardianSchema = dbConnectionp.model("guardian", GuardianSchema);
  let transactionModel = dbConnectionp.model(
    "transactions",
    transactionsSchema
  );
  let feeLedgerModel = dbConnectionp.model("feeledgers", feesLedgerSchema);
  let campusModel = dbConnectionp.model("campuses", campusSchema);
  let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
  let feeInstallmentPlanModel = dbConnectionp.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );

  let campid1 = await campusModel.find({});
  let campid = campid1[0]._doc["_id"];
  var guardianDetails = {
    isPrimary: true,
    firstName: req.body.parent.name,
    lastName: " ",
    fullName: req.body.parent.name,
    mobile:
      req.body.parent.phoneNumber == !"" ? req.body.parent.phoneNumber : "-",
    email: req.body.parent.email == !"" ? req.body.parent.email : "-",
    PIIUsageFlag: true,
    PIIUsageFlagUpdated: new Date(),
    fatherDetails: {},
    motherDetails: {},
    guardianDetails: {},
    relation: "Parent",
    createdBy: "FC Admin",
  };
  let guardianData = new guardianSchema(guardianDetails);
  await guardianData.save();
  // var guardianResponse = await guardianData.save();
  // console.log("guardiandetails", ppInputData["feeStructure"], ppInputData["Program Plan ID"]);
  let programPlanData = await programPlanSchema.findOne({
    _id: mongoose.Types.ObjectId(req.body.programdetail.programPlanId),
  });
  // console.log("prorgamplan", programPlanData);
  let allfeeStructureData = await feeStructureModel.find({});
  let feeStructureData = allfeeStructureData[0];
  let allexiststds = await studentModel.find({});
  // console.log(feeStructureData,programPlanData)
  let rollnum = `BKAHSTU${(1 + allexiststds.length).toString().length == 1
    ? "00"
    : (1 + allexiststds.length).toString().length == 2
      ? "0"
      : ""
    }${1 + allexiststds.length}`;
  var ppData = {
    _id: mongoose.Types.ObjectId(),
    displayName: `STU_${req.body.programdetail.academicYear}_${(1 + allexiststds.length).toString().length == 1
      ? "00"
      : (1 + allexiststds.length).toString().length == 2
        ? "0"
        : ""
      }${1 + allexiststds.length}`,
    regId: `BKAHSTU${(1 + allexiststds.length).toString().length == 1
      ? "00"
      : (1 + allexiststds.length).toString().length == 2
        ? "0"
        : ""
      }${1 + allexiststds.length}`,
    rollNumber: `BKAHSTU${(1 + allexiststds.length).toString().length == 1
      ? "00"
      : (1 + allexiststds.length).toString().length == 2
        ? "0"
        : ""
      }${1 + allexiststds.length}`,
    salutation: null,
    category: "", // Category
    section: "",
    firstName: req.body.student.firstName, //First Name *
    middleName: req.body.student.middleName, //
    lastName: req.body.student.lastName, //Last Name *
    guardianDetails: [guardianData._id],
    gender: req.body.student.gender, //Gender
    dob: req.body.student.dob,
    citizenship: req.body.student.citizenShip, //
    currency: "INR", //
    FOREX: 1, //
    admittedOn: req.body.student.admittedOn,
    // admittedOn: new Date(ppInputData["Admitted Date"]) instanceof Date ? new Date(ppInputData["Admitted Date"]) : null, //Admitted Date *
    programPlanId: programPlanData._id,
    feeStructureId: feeStructureData._doc._id,
    phoneNo: req.body.student.phoneNumber, //Phone Number *
    email: req.body.student.email, // Email Address *
    alternateEmail:
      req.body.student["alterEmail"] != undefined
        ? req.body.student["alterEmail"]
        : null,
    parentName: req.body.parent.name,
    parentPhone: req.body.parent.phoneNumber,
    parentEmail: req.body.parent.email,
    relation: "parent",
    addressDetails: {
      address1: req.body.parent.address.address1,
      address2: req.body.parent.address.address2,
      address3: req.body.parent.address.address3,
      city: req.body.parent.address.city,
      state: req.body.parent.address.state,
      country: req.body.parent.address.country, //Country
      pincode: req.body.parent.address.pinCode, //PIN Code
    },
    isFinalYear: false,
    final: "",
    campusId: campid,
    status: 1,
    createdBy: "FC Admin",
  };
  let newstd = new studentModel(ppData);
  await newstd.save();
  console.log("student Created");
  let studentData = await studentModel.findOne({
    rollNumber: rollnum,
  });

  if (!studentData) {
    console.log(stdfeeMaps[j]);
  }
  let prplan = programPlanData._doc;

  var d = new Date("2021-04-01");
  var d2 = new Date("2021-04-01");
  let amountp = req.body.programPlan.offeredFees;
  let amountr = 0;
  let pend = amountp;
  let paidamt = 0;
  let rid = 0;
  trdate = null;
  let feesbkp = [];
  let paidamts = [];
  let feeTypeDetails = await feeTypeModel.find({});
  for (ll = 0; ll < feeTypeDetails.length; ll++) {
    if (
      feeTypeDetails[ll]._doc.title.trim().toLowerCase().includes("tuition") &&
      campid.toString()
    ) {
      feesbkp.push({
        amount: isNaN(Number(amountp)) ? 0.0 : amountp,
        paid: 0.0,
        pending: isNaN(Number(amountp)) ? 0.0 : amountp,
        feeTypeCode: feeTypeDetails[ll]._doc["displayName"],
        title: feeTypeDetails[ll]._doc["title"],
      });
      paidamts.push(0);
    }
  }
  var stmapid = {
    displayName: `SFM_${req.body.programdetail.academicYear}_${(1 + allexiststds.length).toString().length == 1
      ? "00"
      : (1 + allexiststds.length).toString().length == 2
        ? "0"
        : ""
      }${1 + allexiststds.length}`,
    studentId: studentData._doc._id,
    usn: studentData._doc.regId,
    programPlanId: studentData._doc.programPlanId,
    feeStructureId: studentData._doc.feeStructureId,
    feeManagerId: undefined,
    dueDate: new Date(),
    amount: isNaN(Number(amountp)) ? 0.0 : amountp,
    paid: 0.0,
    receivedDate: trdate,
    receiptNumbers: "",
    concession: 0,
    fine: 0,
    pending: isNaN(Number(amountp)) ? 0.0 : amountp,
    transactionPlan: {
      feesBreakUp: feesbkp,
      totalAmount: isNaN(amountp) ? 0.0 : amountp,
      paidAmount: paidamts,
      totalPaid: 0.0,
      totalPending: isNaN(amountp) ? 0.0 : amountp,
    },
    campusId: campid,
    status: 1,
    createdBy: "FC Admin",
  };
  let newstmaps = new feeMapModel(stmapid);
  let savefm = await newstmaps.save();
  console.log("student maps created");
  let payment = Number(req.body.installmentDetails[0].amount);
  //creating feeplans and installment plans
  studentData = studentData._doc;

  let stuFeeplan = {
    _id: mongoose.Types.ObjectId(),
    applicationId: `FPLAN_${req.body.programdetail.academicYear}_${(1 + allexiststds.length).toString().length == 1
      ? "00"
      : (1 + allexiststds.length).toString().length == 2
        ? "0"
        : ""
      }${1 + allexiststds.length}`,
    studentRegId: studentData.regId,
    studentId: studentData._id,
    programPlanHEDAId: studentData.programPlanId,
    plannedAmount: Number(req.body.programPlan.offeredFees),
    plannedAmountBreakup: [
      {
        amount: Number(req.body.programPlan.offeredFees),
        feeTypeCode: feeTypeDetails[0]._doc["displayName"],
        title: feeTypeDetails[0]._doc["title"],
      },
    ],
    paidAmount: 0,
    paidAmountBreakup: [
      {
        amount: 0,
        feeTypeCode: feeTypeDetails[0]._doc["displayName"],
        title: feeTypeDetails[0]._doc["title"],
      },
    ],
    pendingAmount: req.body.programPlan.offeredFees,
    pendingAmountBreakup: [
      {
        amount: Number(req.body.programPlan.offeredFees),
        feeTypeCode: feeTypeDetails[0]._doc["displayName"],
        title: feeTypeDetails[0]._doc["title"],
      },
    ],
    currency: studentData.currency,
    forex: studentData.FOREX,
    discountType: "",
    discountPercentage: 0,
    discountAmount: 0,
    dueDate: req.body.installmentDetails[0].dueDate,
    penaltyStartDate: "",
    percentageBreakup: [],
    installmentPlan: {},
    discountAmountBreakup: [
      {
        amount: 0,
        feeTypeCode: feeTypeDetails[0]._doc["displayName"],
        title: feeTypeDetails[0]._doc["title"],
      },
    ],
    campusId: campid,
    remarks: {
      seller: "",
      finance: "",
      headseller: "",
    },
  };
  let newfeeplan = new feePlanModel(stuFeeplan);
  await newfeeplan.save();
  let instdata = await feeInstallmentPlanModel.find({});
  let dcount = instdata.length;
  for (let i = 0; i < req.body.installmentDetails.length; i++) {
    dcount++;
    let count = i + 1;
    let stuinstallplans = new feeInstallmentPlanModel({
      feePlanId: stuFeeplan._id,
      label: `Installment${Number(count).toString().length == 1
        ? "00"
        : Number(count).toString().length == 2
          ? "0"
          : ""
        }${Number(count)}`,
      displayName: `INST_${req.body.programdetail.academicYear}_${(Number(dcount) + 1).toString().length == 1
        ? "00"
        : (Number(dcount) + 1).toString().length == 2
          ? "0"
          : ""
        }${Number(dcount) + 1}`,
      description: `Installment${Number(count).toString().length == 1
        ? "00"
        : Number(count).toString().length == 2
          ? "0"
          : ""
        }${Number(count)}`,
      dueDate: req.body.installmentDetails[i].dueDate,
      lateFeeStartDate: req.body.installmentDetails[i].dueDate,
      percentage: Number(req.body.installmentDetails[i].percentage),
      totalAmount: Number(req.body.programPlan.offeredFees),
      // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
      plannedAmount: Number(req.body.installmentDetails[i].amount),
      plannedAmountBreakup: [
        {
          amount: Number(req.body.installmentDetails[i].amount),
          feeTypeCode: feeTypeDetails[0]._doc["displayName"],
          title: feeTypeDetails[0]._doc["title"],
        },
      ],
      paidAmount: 0,
      paidAmountBreakup: [
        {
          amount: 0,
          feeTypeCode: feeTypeDetails[0]._doc["displayName"],
          title: feeTypeDetails[0]._doc["title"],
        },
      ],
      pendingAmount: Number(req.body.installmentDetails[i].amount),
      pendingAmountBreakup: [
        {
          amount: Number(req.body.installmentDetails[i].amount),
          feeTypeCode: feeTypeDetails[0]._doc["displayName"],
          title: feeTypeDetails[0]._doc["title"],
        },
      ],
      discountType: "",
      discountPercentage: 0,
      discountAmount: 0,
      discountAmountBreakup: [
        {
          amount: 0,
          feeTypeCode: feeTypeDetails[0]._doc["displayName"],
          title: feeTypeDetails[0]._doc["title"],
        },
      ],
      status: "Planned",
      transactionId: "",
      campusId: campid,
      remarks: {
        seller: "",
        finance: "",
        headseller: "",
      },
    });
    await stuinstallplans.save();
  }

  console.log("fee plan and installement plan created");
  //creating transactions
  // inputData = {
  //   stemapdata: stmapid,
  //   studentFeeMap: stmapid.displayName,
  //   "displayName": `RCPT_2020-21_${
  //     rid < 9 ? "00" : rid < 99 ? "0" : ""
  //     }${Number(rid) + 1}`,
  //   "transactionDate": new Date(),
  //   "relatedTransactions": [],
  //   "transactionType": "eduFees",
  //   "transactionSubType": "feePayment",
  //   "studentId": studentData._id,
  //   "studentName": `${studentData.firstName} ${studentData.lastName}`,
  //   "class": prplan.title,
  //   "parentName": studentData.parentName,
  //   "academicYear": prplan.academicYear,
  //   "amount": payment,
  //   "studentRegId": studentData.regId,
  //   "receiptNo": req.body.installmentDetails[0].transactionId,
  //   "programPlan": prplan._id,
  //   "paymentTransactionId": req.body.installmentDetails[0].transactionId,
  //   "paymentRefId": req.body.installmentDetails[0].transactionId,
  //   "receiptStatus": "",
  //   "currency": studentData.currency,
  //   "currencyAmount": parseFloat(payment) * parseFloat(studentData.FOREX),
  //   "exchangeRate": studentData.FOREX,
  //   "userName": "",
  //   "createdBy": "FC Admin",
  //   "campusId": studentData.campusId,
  //   "data": {
  //     "feesBreakUp":
  //       [
  //         {
  //           "feeTypeCode": feeTypeDetails[0]._doc.displayName,
  //           "feeTypeId": feeTypeDetails[0]._doc._id,
  //           "amount": payment,
  //           "feeType": feeTypeDetails[0]._doc.title
  //         }
  //       ],
  //     "orgId": req.body.orgId,
  //     "transactionType": "eduFees",
  //     "transactionSubType": "feePayment",
  //     "mode": "cash",
  //     "method": "otc",
  //     "modeDetails": {
  //       "netBankingType": "",
  //       "walletType": "",
  //       "instrumentNo": req.body.installmentDetails[0].transactionId,
  //       "cardType": "",
  //       "nameOnCard": "",
  //       "cardNumber": "",
  //       "instrumentDate": new Date(),
  //       "bankName": "",
  //       "branchName": "",
  //       "transactionId": "",
  //       "remarks": ""
  //     }
  //   }
  // }

  inputData = {
    transactionDate: new Date(),
    relatedTransactions: [],
    studentId: studentData._id,
    emailCommunicationRefIds:
      req.body.parent.email !== ""
        ? req.body.parent.email
        : req.body.student.email,
    transactionType: "eduFees",
    transactionSubType: "feePayment",
    studentFeeMap: stmapid.displayName,
    amount: payment,
    status: "initiated",
    userName: "test user",
    data: {
      feesBreakUp: [
        {
          feeType: "Tuition Fee ",
          amount: stmapid,
          feeTypeCode: feeTypeDetails[0]._doc.displayName,
        },
      ],
      orgId: req.body.orgId,
      transactionType: "eduFees",
      transactionSubType: "feePayment",
      mode: "otc",
      method: "cash",
      modeDetails: {
        netBankingType: null,
        walletType: null,
        instrumentNo: null,
        cardType: null,
        nameOnCard: null,
        cardNumber: null,
        instrumentDate: new Date(),
        bankName: null,
        branchName: null,
        transactionId: req.body.installmentDetails[0].transactionId,
        remarks: "first installment payment",
      },
    },
    paymentTransactionId: req.body.installmentDetails[0].transactionId,
    createdBy: req.body.orgId,
    campusId: campid,
    academicYear: req.body.programdetail.academicYear,
    class: req.body.programdetail.programPlanName,
    studentName: `${studentData.firstName} ${studentData.lastName}`,
    studentRegId: studentData.regId,
    programPlanId: prplan._id,
    parentName: studentData.parentName,
    type: "receipt",
  };

  var receiptN = ("" + Math.random()).substring(2, 7);
  var year2 = moment().year();

  var transID = `TXN/${year2}/${receiptN + 1}`;
  let imode = inputData.data.mode;
  let mode = imode.toLowerCase();

  let feMapDe = await feeMapModel.findOne({
    displayName: inputData.studentFeeMap,
  });
  let paidAA = Number(feMapDe.paid) + Number(inputData.amount);

  if (Number(feMapDe.amount) < Number(paidAA)) {
    aid++;
    let extraAmount = Math.abs(Number(feMapDe.amount) - Number(paidAA));
    let payable = Number(feMapDe.pending);

    var advanceId = `ADV_2020-21_${aid < 9 ? "00" : aid < 99 ? "0" : ""}${Number(aid) + 1
      }`;
    let transactionId;
    if (mode == "cash") {
      transactionId = transID;
    } else {
      transactionId = inputData.paymentTransactionId;
    }
    let passData = {
      displayName: advanceId,
      transactionDate: inputData.transactionDate,
      relatedTransactions: inputData.relatedTransactions,
      transactionType: "eduFees",
      transactionSubType: "advance",
      studentId: inputData.studentId,
      studentName: inputData.studentName,
      class: inputData.class,
      academicYear: inputData.academicYear,
      amount: extraAmount,
      studentRegId: inputData.studentRegId,
      receiptNo: advanceId,
      programPlan: inputData.programPlanId,
      data: inputData.data,
      paymentTransactionId: transactionId,
      receiptStatus: inputData.receiptStatus,
      currency: inputData.currency,
      currencyAmount: inputData.currencyAmount,
      exchangeRate: inputData.exchangeRate,
      userName: inputData.userName,
      campusId: studentData.campusId,
      createdBy: inputData.createdBy,
      updatedBy: inputData.createdBy,
    };
    let paymentData = await advanceLedgerEntry(
      { body: passData },
      dbConnectionp,
      inputData.stemapdata
    );
    console.log("sdfds", paymentData);
    if (paymentData.status == "failure") {
      return false;
    } else {
      var rcptId = inputData.displayName;
      let transactionId;
      if (mode == "cash") {
        transactionId = transID;
      } else {
        transactionId = inputData.paymentTransactionId;
      }
      // let receiptNo;
      // if (inputData.type == "receipt") {
      //   receiptNo = `${year2}/${receiptN + 1}`;
      // } else {
      //   receiptNo = transactionId;
      // }
      var afterAdvanceFee = [];
      for (oneFee of inputData.data.feesBreakUp) {
        let obje;
        if (String(oneFee.feeTypeCode) == "FT001") {
          obje = {
            feeTypeId: oneFee.feeTypeId,
            feeType: oneFee.feeType,
            amount: payable,
            feeTypeCode: oneFee.feeTypeCode,
          };
        } else {
          obje = {
            feeTypeId: oneFee.feeTypeId,
            feeType: oneFee.feeType,
            amount: oneFee.amount,
            feeTypeCode: oneFee.feeTypeCode,
          };
        }
        afterAdvanceFee.push(obje);
      }
      let passData = {
        displayName: rcptId,
        transactionDate: inputData.transactionDate,
        relatedTransactions: inputData.relatedTransactions,
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        studentId: inputData.studentId,
        studentName: inputData.studentName,
        class: inputData.class,
        academicYear: inputData.academicYear,
        amount: payable,
        studentRegId: inputData.studentRegId,
        receiptNo: rcptId,
        programPlan: inputData.programPlanId,
        data: {
          feesBreakUp: afterAdvanceFee,
          orgId: inputData.data.orgId,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          mode: inputData.data.mode,
          method: inputData.data.method,
          modeDetails: {
            netBankingType: inputData.data.modeDetails.netBankingType,
            walletType: inputData.data.modeDetails.walletType,
            instrumentNo: inputData.data.modeDetails.instrumentNo,
            cardType: inputData.data.modeDetails.cardType,
            nameOnCard: inputData.data.modeDetails.nameOnCard,
            cardNumber: inputData.data.modeDetails.cardNumber,
            instrumentDate: inputData.data.modeDetails.instrumentDate,
            bankName: inputData.data.modeDetails.bankName,
            branchName: inputData.data.modeDetails.branchName,
            transactionId: inputData.data.modeDetails.transactionId,
            remarks: inputData.data.modeDetails.remarks,
          },
        },
        paymentTransactionId: transactionId,
        receiptStatus: inputData.receiptStatus,
        currency: inputData.currency,
        currencyAmount: inputData.currencyAmount,
        exchangeRate: inputData.exchangeRate,
        userName: inputData.userName,
        createdBy: inputData.createdBy,
        updatedBy: inputData.createdBy,
      };
      console.log("pppp");
      paymentData = await ledgerEntry(
        { body: passData },
        dbConnectionp,
        inputData.stemapdata
      );
      if (paymentData.status == "failure") {
        return false;
      } else {
        const settingsSchema = mongoose.Schema({}, { strict: false });
        const settingsModel = dbConnectionp.model(
          "settings",
          settingsSchema,
          "settings"
        );
        let feeMapModel = dbConnectionp.model(
          "studentfeesmaps",
          StudentFeeMapSchema
        );
        let feeStructureModel = dbConnectionp.model(
          "feestructures",
          FeeStructureSchema
        );
        let feeManagerModel = dbConnectionp.model(
          "feemanagers",
          FeeManagerSchema
        );
        let feeTypeModel = dbConnectionp.model("feetypes", FeeTypeSchema);

        let feMapDe = await feeMapModel.findOne({
          displayName: inputData.studentFeeMap,
        });
        let feeStructureDetails = await feeStructureModel.findOne({
          _id: feMapDe.feeStructureId,
        });
        let feeBre = [];
        if (feMapDe.transactionPlan.feesBreakUp.length !== 0) {
          for (singleData of feMapDe.transactionPlan.feesBreakUp) {
            let fees = singleData.amount;
            for (oneFee of afterAdvanceFee) {
              if (
                String(singleData.feeTypeCode) == String(oneFee.feeTypeCode)
              ) {
                let fullPaid = Number(singleData.paid) + Number(oneFee.amount);
                let fullPending = Number(fees) - fullPaid;
                let obje = {
                  amount: fees,
                  paid: fullPaid,
                  pending: fullPending,
                  feeTypeCode: oneFee.feeTypeCode,
                  title: oneFee.feeType,
                };
                feeBre.push(obje);
              }
            }
          }
        } else {
          let fees = singleData.amount;
          for (oneFee of afterAdvanceFee) {
            if (String(singleData.feeTypeCode) == String(oneFee.feeTypeCode)) {
              let fullPaid = Number(oneFee.amount);
              let fullPending = Number(fees) - fullPaid;
              let obje = {
                amount: fees,
                paid: fullPaid,
                pending: fullPending,
                feeTypeCode: oneFee.feeTypeCode,
                title: oneFee.feeType,
              };
              feeBre.push(obje);
            }
          }
        }
        var tota = 0;
        var pai = 0;
        var penda = 0;
        for (oneFees of feeBre) {
          tota += oneFees.amount;
          pai += oneFees.paid;
          penda += oneFees.pending;
        }
        let feeTypesPaid = {
          feesBreakUp: feeBre,
          totalAmount: tota,
          totalPaid: pai,
          totalPending: penda,
        };
        let paidA = Number(feMapDe.paid) + Number(inputData.amount);
        if (Number(feMapDe.amount) - Number(paidA) < 0) {
          await feeMapModel.updateOne(
            { displayName: inputData.studentFeeMap },
            {
              $set: {
                paid: paidA,
                pending: 0,
                transactionPlan: feeTypesPaid,
              },
            }
          );
        } else {
          await feeMapModel.updateOne(
            { displayName: inputData.studentFeeMap },
            {
              $set: {
                paid: paidA,
                pending: Number(feMapDe.amount) - Number(paidA),
                transactionPlan: feeTypesPaid,
              },
            }
          );
        }
      }
    }
    console.log("advance transaction created");
  } else {
    // let ctdata = await createOtcPayment(transactionPayload, dbConnectionpp)
    var rcptId = inputData.displayName;
    let transactionId;
    if (mode == "cash") {
      transactionId = transID;
    } else {
      transactionId = inputData.paymentTransactionId;
    }
    let passData = {
      displayName: rcptId,
      transactionDate: inputData.transactionDate,
      relatedTransactions: inputData.relatedTransactions,
      transactionType: "eduFees",
      transactionSubType: "feePayment",
      studentId: inputData.studentId,
      studentName: inputData.studentName,
      parentName: inputData.parentName,
      class: inputData.class,
      academicYear: inputData.academicYear,
      amount: inputData.amount,
      studentRegId: inputData.studentRegId,
      receiptNo: rcptId,
      programPlan: inputData.programPlanId,
      data: inputData.data,
      paymentTransactionId: transactionId,
      receiptStatus: inputData.receiptStatus,
      currency: inputData.currency,
      currencyAmount: inputData.currencyAmount,
      exchangeRate: inputData.exchangeRate,
      userName: inputData.userName,
      campusId: studentData.campusId,
      createdBy: inputData.createdBy,
      updatedBy: inputData.createdBy,
    };
    let paymentData = await ledgerEntry(
      { body: passData },
      dbConnectionp,
      inputData.stemapdata
    );
    if (paymentData == false) {
      console.log("fail to", inputData.studentRegId);
      return false;
    } else {
      let feeMapModel = dbConnectionp.model(
        "studentfeesmaps",
        StudentFeeMapSchema
      );
      let feeStructureModel = dbConnectionp.model(
        "feestructures",
        FeeStructureSchema
      );
      let feeManagerModel = dbConnectionp.model(
        "feemanagers",
        FeeManagerSchema
      );
      let feeTypeModel = dbConnectionp.model("feetypes", FeeTypeSchema);

      let feMapDe = await feeMapModel.findOne({
        displayName: inputData.studentFeeMap,
      });
      let feeStructureDetails = await feeStructureModel.findOne({
        _id: feMapDe.feeStructureId,
      });
      let feeBre = [];
      if (feMapDe.transactionPlan.feesBreakUp.length !== 0) {
        for (singleData of feMapDe.transactionPlan.feesBreakUp) {
          let fees = singleData.amount;
          for (oneFee of inputData.data.feesBreakUp) {
            if (String(singleData.feeTypeCode) == String(oneFee.feeTypeCode)) {
              let fullPaid = Number(singleData.paid) + Number(oneFee.amount);
              let fullPending = Number(fees) - fullPaid;
              let obje;
              if (Number(fullPending) < 0) {
                obje = {
                  amount: fees,
                  paid: fullPaid,
                  pending: 0,
                  feeTypeCode: oneFee.feeTypeCode,
                  title: oneFee.feeType,
                };
              } else {
                obje = {
                  amount: fees,
                  paid: fullPaid,
                  pending: fullPending,
                  feeTypeCode: oneFee.feeTypeCode,
                  title: oneFee.feeType,
                };
              }
              feeBre.push(obje);
            }
          }
        }
      } else {
        let fees = singleData.amount;
        for (oneFee of inputData.data.feesBreakUp) {
          if (String(singleData.feeTypeCode) == String(oneFee.feeTypeCode)) {
            let fullPaid = Number(oneFee.amount);
            let fullPending = Number(fees) - fullPaid;
            let obje;
            if (Number(fullPending) < 0) {
              obje = {
                amount: fees,
                paid: fullPaid,
                pending: 0,
                feeTypeCode: oneFee.feeTypeCode,
                title: oneFee.feeType,
              };
            } else {
              obje = {
                amount: fees,
                paid: fullPaid,
                pending: fullPending,
                feeTypeCode: oneFee.feeTypeCode,
                title: oneFee.feeType,
              };
            }
            await feeBre.push(obje);
          }
        }
      }
      var tota = 0;
      var pai = 0;
      var penda = 0;
      for (oneFees of feeBre) {
        tota += oneFees.amount;
        pai += oneFees.paid;
        penda += oneFees.pending;
      }
      let feeTypesPaid = {
        feesBreakUp: feeBre,
        totalAmount: tota,
        totalPaid: pai,
        totalPending: penda,
      };
      let paidA = Number(feMapDe.paid) + Number(inputData.amount);
      let pendingAmountTotal = Number(feMapDe.amount) - Number(paidA);
      let upd = await feeMapModel.updateOne(
        { studentId: studentData._id },
        {
          $set: {
            paid: paidA,
            pending: pendingAmountTotal,
            "transactionPlan.totalPaid": paidA,
            "transactionPlan.paidAmount.0": paidA,
            "transactionPlan.totalPending": pendingAmountTotal,
            "transactionPlan.feesBreakUp.0.paid": paidA,
            "transactionPlan.feesBreakUp.0.pending": pendingAmountTotal,
          },
        }
      );
    }
    console.log("transaction created");
  }
};
async function ledgerEntry(req, dbConnection, studentFeeDetails) {
  let txnData = req.body;
  transactionSubType = txnData.transactionSubType;
  let TxnModel = dbConnection.model("transactions", transactionsSchema);
  let FeesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
  let journeyModel = dbConnection.model("journeys", journeysSchema);
  let studentModel = dbConnection.model("students", StudentSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let studentData = await studentModel.findOne({ _id: txnData.studentId });
  var savedTxnData;
  var ledgerIds;
  var status = "Pending";
  var journeysData;
  try {
    // savedTxnData = await insertTransaction(txnData, TxnModel);
    savedTxnData = new TxnModel(txnData);
    await savedTxnData.save();
    let totalPendingAmount = studentFeeDetails.pending;
    var status = "Paid";
    let pada = Number(studentFeeDetails.paid) + Number(savedTxnData.amount);
    if (pada < totalPendingAmount) {
      status = "Partial";
    }
    var ledgerIds = [];
    var pending = totalPendingAmount;
    // for (feeItem of savedTxnData.data.feesBreakUp) {
    let ans = Number(pending) - Number(savedTxnData.data.feesBreakUp[0].amount);
    // if (Number(feeItem.amount) > 0) {
    let primary;
    if (savedTxnData.relatedTransactions.length == 0) {
      primary = "";
    } else {
      primary = savedTxnData.relatedTransactions[0];
    }
    feesLedgerData = {
      transactionId: savedTxnData._id,
      transactionDate: savedTxnData.transactionDate,
      transactionDisplayName: savedTxnData.displayName,
      primaryTransaction: primary,
      feeTypeCode: savedTxnData.data.feesBreakUp[0].feeTypeCode,
      paidAmount: Number(savedTxnData.data.feesBreakUp[0].amount),
      pendingAmount: ans,
      transactionType: savedTxnData.transactionType,
      transactionSubType: savedTxnData.transactionSubType,
      studentId: savedTxnData.studentId,
      studentRegId: savedTxnData.studentRegId,
      studentName: savedTxnData.studentName,
      academicYear: savedTxnData.academicYear,
      class: savedTxnData.class,
      programPlan: savedTxnData.programPlan,
      campusId: txnData.campusId,
      status: status,
    };
    let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
    ledgerResponse = await feesLedgerModel.save();
    // console.log("saved")
    ledgerIds.push(ledgerResponse._id);
    //     }
    // } // for

    let journeyData = {
      primaryCoaCode: savedTxnData.studentId,
      primaryTransaction: primary,
      transaction: savedTxnData.displayName,
      transactionDate: savedTxnData.transactionDate,
      ledgerId: ledgerIds,
      creditAmount: 0,
      debitAmount: savedTxnData.amount,
      pendingAmount: totalPendingAmount,
    };
    let journeyLedgerData = new journeyModel(journeyData);
    journeyResponse = await journeyLedgerData.save();

    if (Number(studentFeeDetails.amount) == Number(studentFeeDetails.paid)) {
      status = "Paid";
    } else {
      status = "Partial";
    }
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: status }
    );
    return true;
  } catch (err) {
    console.log(err);
    msg = "feesTransactionsController: Error: " + err.message;
    // need to do cleanup in case transaction (and some ledger entries) were inserted
    if (savedTxnData) {
      if (TxnModel) {
        await TxnModel.deleteOne({ _id: savedTxnData._id });
      }
      if (FeesLedgerModel && ledgerIds) {
        await FeesLedgerModel.deleteMany({ _id: { $in: ledgerIds } });
      }
    }
    return false;
  }
}

async function advanceLedgerEntry(req, dbConnection, studentFeesDetails) {
  let txnData = req.body;
  transactionSubType = txnData.transactionSubType;
  let TxnModel = dbConnection.model("transactions", transactionsSchema);
  let FeesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
  let journeyModel = dbConnection.model("journeys", journeysSchema);
  let studentModel = dbConnection.model("students", StudentSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let studentData = await studentModel.findOne({ _id: txnData.studentId });
  var savedTxnData;
  var ledgerIds;
  var status = "Pending";
  var journeysData;
  try {
    console.log(studentFeesDetails.paid);
    savedTxnData = new TxnModel(txnData);
    await savedTxnData.save();
    let totalPendingAmount = studentFeesDetails.pending;
    var status = "Paid";
    let pada = Number(studentFeesDetails.paid) + Number(savedTxnData.amount);
    if (pada < totalPendingAmount) {
      status = "Partial";
    }

    var ledgerIds = [];
    var pending = totalPendingAmount;
    // for (feeItem of savedTxnData.data.feesBreakUp) {
    let ans = Number(pending) - Number(savedTxnData.data.feesBreakUp[0].amount);
    //     if (Number(feeItem.amount) >0 ) {
    let primary;
    if (savedTxnData.relatedTransactions.length == 0) {
      primary = "";
    } else {
      primary = savedTxnData.relatedTransactions[0];
    }
    feesLedgerData = {
      transactionId: savedTxnData._id,
      transactionDate: savedTxnData.transactionDate,
      transactionDisplayName: savedTxnData.displayName,
      primaryTransaction: primary,
      feeTypeCode: savedTxnData.data.feesBreakUp[0].feeTypeCode,
      paidAmount: Number(savedTxnData.data.feesBreakUp[0].amount),
      pendingAmount: ans,
      transactionType: savedTxnData.transactionType,
      transactionSubType: savedTxnData.transactionSubType,
      studentId: savedTxnData.studentId,
      studentRegId: savedTxnData.studentRegId,
      studentName: savedTxnData.studentName,
      academicYear: savedTxnData.academicYear,
      class: savedTxnData.class,
      programPlan: savedTxnData.programPlan,
      campusId: txnData.campusId,
      status: status,
    };
    let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
    ledgerResponse = await feesLedgerModel.save();
    ledgerIds.push(ledgerResponse._id);
    //     }
    // } // for
    let journeyData = {
      primaryCoaCode: savedTxnData.studentId,
      primaryTransaction: primary,
      transaction: savedTxnData.displayName,
      transactionDate: savedTxnData.transactionDate,
      ledgerId: ledgerIds,
      creditAmount: 0,
      debitAmount: savedTxnData.amount,
      pendingAmount: totalPendingAmount,
    };
    let journeyLedgerData = new journeyModel(journeyData);
    journeyResponse = await journeyLedgerData.save();
    if (Number(studentFeesDetails.amount) == Number(studentFeesDetails.paid)) {
      status = "Paid";
    } else {
      status = "Partial";
    }
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: status }
    );
    return true;
  } catch (err) {
    // need to do cleanup in case transaction (and some ledger entries) were inserted
    console.log("catch", err.toString());
    if (savedTxnData) {
      if (TxnModel) {
        await TxnModel.deleteOne({ _id: savedTxnData._id });
      }
      if (FeesLedgerModel && ledgerIds) {
        await FeesLedgerModel.deleteMany({ _id: { $in: ledgerIds } });
      }
    }
    return false;
  }
}

module.exports.sendDemandNote = async (req, res) => {
  let dbConnectionp;
  let centralDbConnection;
  try {
    centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    // console.log(centralDbConnection)
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({
      _id: mongoose.Types.ObjectId(req.query.orgId),
    });
    // console.log(orgData)
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
    const orgNameSpace = orgData._doc.nameSpace;
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    const applicationModel = await dbConnectionp.model(
      "applications",
      ApplicationSchema,
      "applications"
    );
    const settingsSchema = mongoose.Schema({}, { strict: false });
    const settingsModel = dbConnectionp.model(
      "settings",
      settingsSchema,
      "settings"
    );
    const orgSettings = await settingsModel.find({});
    let paymentScheduleModel = dbConnectionp.model(
      "paymentschedules",
      PaymentScheduleSchema
    );
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let reminderModel = dbConnectionp.model(
      "reminderplans",
      ReminderScheduleSchema
    );
    let reminderData = await reminderModel.find({});
    let demandnoteDay = reminderData[0]._doc.scheduleDetails[0].days;
    let feeMapModel = dbConnectionp.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let studata = await studentModel.find({});
    let paymentScheduledata = await paymentScheduleModel.find({});
    let todayDate = moment().date();
    let demandNoteDate = moment(new Date(`2021/05/${demandnoteDay}`))
      .utcOffset("GMT-0530")
      .date();
    // console.log("amount", lateFeeData[0]._doc.amount)
    console.log(demandNoteDate, todayDate);
    let orgDetails = orgSettings[0]._doc;
    // for (let i = 0; i < studata.length; i++) {
    for (let i = 0; i < 2; i++) {
      let ppdata = await ppmodel.findOne({
        _id: studata[i]._doc.programPlanId,
      });
      let feeplandata = await feePlanModel.findOne({
        studentRegId: studata[i]._doc.regId,
      });
      let feeMapData = await feeMapModel.findOne({
        studentId: studata[i]._doc._id,
      });
      // console.log(feeMapData && feeplandata && Number(feeplandata._doc.paidAmount) == 0 && Number(feeplandata._doc.plannedAmount) > 0 && Number(lateFeeDate) == Number(todayDate) && ppdata && ppdata._doc.academicYear == "2021-22")
      if (
        feeMapData &&
        feeplandata &&
        Number(feeplandata._doc.paidAmount) == 0 &&
        Number(feeplandata._doc.plannedAmount) > 0 &&
        ppdata &&
        ppdata._doc.academicYear == "2021-22"
      ) {
        let mobileNumber = studata[i]._doc.phoneNo;
        // let emailAddress = studata[i]._doc.parentEmail == "" ? studata[i]._doc.parentEmail : studata[i]._doc.email;
        let emailAddress = "naveen.p@zenqore.com";
        let data;
        let totalDueAmt = feeplandata._doc.pendingAmount;
        let applicationId;
        let displayName = "2020/20";
        let tinyUri;
        let inputData = {
          studentName: `${studata[i]._doc.firstName} ${studata[i]._doc.lastName}`,
          dueDate: "June 10 2021",
          studentRegId: studata[i]._doc.regId,
          displayName: "sfdsf",
          applicationId: "sdfdsf",
          class: "class 1",
          totalDueAmt: feeplandata._doc.pendingAmount,
          data: { feesBreakUp: [{ feeType: "Term Fee", amount: 12000 }] },
        };
        const tinyUrlPayload = {
          Url: `${process.env.feeCollectionURL
            }${orgNameSpace}/getRazorpayLink?orgId=${req.query.orgId
            }&demanNote=${displayName}&applicationId=${applicationId}&shortCourse=true&dueAmount=${Number(
              totalDueAmt
            ).toFixed(2)}`,
        };
        // tinyUri = await axios.post(tinyUrl, tinyUrlPayload);

        // const demandNoteLink = tinyUri.data ? tinyUri.data.ShortUrl : tinyUrlPayload.Url;
        const demandNoteLink = tinyUrlPayload.Url;

        let openingLine = "Please find your fee details as follows:";
        let emailTemplate = demandNoteTemplate(
          orgDetails,
          [inputData],
          demandNoteLink,
          openingLine,
          feeplandata._doc.paidAmount,
          "shortCourseDN"
        );
        let sentMail = await sendEmail(
          orgDetails.emailServer[0].emailServer,
          emailAddress,
          orgDetails.emailServer[0].emailAddress,
          "ZQ EDU-Demand Note",
          emailTemplate,
          []
        );
        console.log("template", emailTemplate);
      }
    }
  } catch (err) {
    console.log("err", err);
    // res.status(404).send({ status: "failure", message: "parent details: ", data: err.message });
  } finally {
  }
};
module.exports.updateMasterData = async (req, res) => {
  // console.log(req.headers)
  let response = req.file;
  let date = new Date();
  var current = date.getFullYear();
  var prev = Number(date.getFullYear()) + 1;
  prev = String(prev).substr(String(prev).length - 2);
  finYear = `${current}-${prev}`;
  let result = {
    instituteDetails: {},
    programPlans: [],
    feeManagers: [],
    feeStructures: [],
    feeTypes: [],
    studentDetails: [],
    reminderPlan: [],
    installmentPlan: [],
    studentFeeMaps: [],
  };
  //console.log("req",response.file[0].key)
  let centralDbConnection;
  let orgId = req.query.orgId;
  // try {
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
    _id: mongoose.Types.ObjectId(orgId),
  });
  // let dbConnection = await createDatabase( `usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  // const instituteModel = dbConnection.model("orglists", OrgListSchema);
  console.log(req.query.orgId);
  let dbConnectionp = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  // dbConnectionp = await createDatabase(
  //   "5faa2d6d83774b0007e6537d",
  //   "mongodb://20.44.39.232:30000"
  // );

  if (response == undefined) {
    res.status(400).send({ Message: "Please Upload file" });
  } else {
    let filename = req.query.filename;
    let input = JSON.parse(req.file.buffer.toString());
    let stddata = input.apidata;
    // let ctemplate = await updateTemplate(stddata, res)
    // console.log("template version status", ctemplate)
    let uidata = input.uidata;
    console.log(
      "file info",
      stddata["Student Details"].length,
      req.query.orgId
    );
    // let academicyear = stddata["Program Plan"][0]["Academic Year"].toString()
    // let dbname = orgData._doc._id.toString()
    let masterUploadModel = dbConnectionp.model(
      "masteruploads",
      masterUploadSchema
    );
    let programPlanSchema = dbConnectionp.model(
      "programplans",
      ProgramPlanSchema
    );
    let feeStructureModel = dbConnectionp.model(
      "feestructures",
      FeeStructureSchema
    );
    let paymentScheduleModel = dbConnectionp.model(
      "paymentschedules",
      paymentScheduleSchema
    );
    let reminderModel = dbConnectionp.model(
      "reminderplans",
      ReminderScheduleSchema
    );
    let lateFeeModel = dbConnectionp.model("latefees", LateFeesSchema);
    let installmentModel = dbConnectionp.model(
      "installments",
      InstallmentSchema
    );
    let categoryModel = dbConnectionp.model("categoryplans", CategorySchema);
    let concessionModel = dbConnectionp.model(
      "concessionplans",
      ConcessionSchema
    );
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let feeManagerSchema = dbConnectionp.model("feemanagers", FeeManagerSchema);
    let feeMapModel = dbConnectionp.model(
      "studentFeesMap",
      StudentFeeMapSchema
    );
    let feeTypeModel = dbConnectionp.model("feeTypes", FeeTypeSchema);
    let guardianSchema = dbConnectionp.model("guardian", GuardianSchema);
    let bankdetailsModel = dbConnectionp.model(
      "bankDetails",
      bankDetailsSchema
    );
    let states = "";
    // let states = statecodes.options.find(item => item.label.toLowerCase() == stddata["Institute Details"].legalAddress.state.value.toLowerCase())
    let institutionModel = dbConnectionp.model(
      "instituteDetails",
      instituteDetailsSchema
    );
    let campusModel = dbConnectionp.model("campuses", campusSchema);

    bankDetails = [];
    result.feeTypes = stddata["Fee Types"];
    // result.paymentSchedule = stddata["Payment Schedules"]
    // result.reminderPlan = stddata["Reminder Plan"]
    result.lateFeePlan = stddata["Late Fee Plans"];
    // result.installmentPlan = stddata["Installment plan"]
    result.categoryPlan = stddata["Categories"];
    result.cencessionPlan = stddata["Concession Plans"];
    result.programPlans = stddata["Program Plans"];
    result.studentFeeMaps = stddata["Students Fee Mapping"];
    let festrdata = [];
    let fmang = [];
    let stds = [];
    let rmlans = [];
    let inplans = [];
    let paymentshedules = [];
    stddata["Payment Schedules"].forEach(async function (item) {
      item["Percentage"] = item["Percentage"].split(",");
      paymentshedules.push(item);
    });
    stddata["Fee Structures"].forEach(async function (item) {
      item["Fee Types *"] = item["Fee Types *"].split(",");
      festrdata.push(item);
    });
    stddata["Fee Inventory"].forEach(async function (item) {
      item["Program Plan ID *"] = item["Program Plan ID *"].split(",");
      item["Fee Type ID *"] = item["Fee Type ID *"].split(",");
      fmang.push(item);
    });
    stddata["Student Details"].forEach(async function (item) {
      item["feeStructure"] = item["Fee Structure ID *"];
      delete item["Fee Structure ID *"];
      stds.push(item);
    });
    stddata["Reminder Plans"].forEach(async function (item) {
      item["Other Reminders"] = item["Other Reminders"].split(",");
      item["nor"] = item["No. of Reminders"];
      delete item["No. of Reminders"];
      rmlans.push(item);
    });
    stddata["Installment Plans"].forEach(async function (item) {
      item["Percentage Breakup"] = item["Percentage Breakup"].split(",");
      item["noi"] = item["No. of Installments"];
      delete item["No. of Installments"];
      inplans.push(item);
    });
    result.paymentSchedule = paymentshedules;
    result.feeStructures = festrdata;
    result.feeManagers = fmang;
    result.studentDetails = stds;
    result.reminderPlan = rmlans;
    result.installmentPlan = inplans;
    let masters = await masterUploadModel.find({});
    let urmplans = [];
    let uinplans = [];
    uidata["Reminder Plans"].forEach(async function (item) {
      item["Number of Reminders"] = item["No. of Reminders"];
      delete item["No. of Reminders"];
      urmplans.push(item);
    });
    uidata["Installment Plans"].forEach(async function (item) {
      item["Number of Installments"] = item["No. of Installments"];
      delete item["No. of Installments"];
      uinplans.push(item);
    });
    uidata["Reminder Plan"] = urmplans;
    uidata["Installment Plan"] = uinplans;
    let masteruploadData = {
      fileName: filename,
      uploadedFileName: req.file.originalname,
      fileSize: `${req.file.buffer.length * 0.001} KB`,
      totalRecords: stddata["Student Details"].length,
      totalStudents: stddata["Student Details"].length,
      totalFeetypes: stddata["Fee Types"].length,
      totalFeeStructures: stddata["Fee Structures"].length,
      totalPrograPlans: stddata["Program Plans"].length,
      totalFeeManagers: stddata["Fee Inventory"].length,
      data: result,
      uidata: uidata,
      version: 1,
    };
    let newMasterUpload = new masterUploadModel(masteruploadData);
    // let input2 = { orgId: req.query.orgId, resource: orgData._doc.connUri }
    let input2 = {
      orgId: req.query.orgId,
      resource: "mongodb://20.44.39.232:30000",
    };

    let campuses = await campusModel.find({});
    console.log(req.query.type);
    if (req.query.type == "new") {
      initCheck3(
        input2,
        masterUploadModel,
        dbConnectionp,
        newMasterUpload,
        stddata["Institute Details"].legalName.legalName.value,
        result,
        states,
        campuses,
        finYear,
        res
      )
        .then(async (studentinitialize) => {
          // newinst.save(async function (err3, data3) {
          //   if (err3) {
          //     res.status(500).send({
          //       message: "Mongoose error",
          //       type: "error",
          //       cause: err3.toString(),
          //     });
          //   } else {
          //     console.log("initcheck function executed successfully")
          //     try {
          console.log("New Students saved");
          await dbConnectionp.close();
          await centralDbConnection.close();
          res.status(201).send({
            status: "success",
            message: "Excel Uploaded Successfully",
            data: newMasterUpload,
          });

          //     }
          //     catch (err) {
          //       res.json({ status: "failure", message: "reconciliation: " + err.message });
          //     }
          //   }
          // })
        })
        .catch(async function (err) {
          await dbConnectionp.close();
          res.status(500).send({
            status: "failure",
            message: "Failed to Create Student Mapping Setup",
            data: req.body,
            cause: err.toString(),
          });
        });
    } else {
      initCheck2(
        input2,
        masterUploadModel,
        dbConnectionp,
        newMasterUpload,
        stddata["Institute Details"].legalName.legalName.value,
        result,
        states,
        campuses,
        finYear,
        res
      )
        .then(async (studentinitialize) => {
          console.log("Old Students updated");
          await dbConnectionp.close();
          await centralDbConnection.close();
          res.status(201).send({
            status: "success",
            message: "Excel Uploaded Successfully",
            data: newMasterUpload,
          });
        })
        .catch(async function (err) {
          await dbConnectionp.close();
          res.status(500).send({
            status: "failure",
            message: "Failed to Create Student Mapping Setup",
            data: req.body,
            cause: err.toString(),
          });
        });
    }
  }
};

async function initCheck2(
  req,
  masterUpladModel,
  dbConnectionp,
  newMasterUpload,
  instName,
  result,
  states,
  campuses,
  finYear,
  res
) {
  let inputData = req;
  let dbName = req.orgId;
  let response = { pp: [], stdsnew: [], stdsold: [], stdfmaps: [] };
  let programPlanSchema = dbConnectionp.model(
    "programplans",
    ProgramPlanSchema
  );
  let feeStructureModel = dbConnectionp.model(
    "feestructures",
    FeeStructureSchema
  );
  let paymentScheduleModel = dbConnectionp.model(
    "paymentschedules",
    paymentScheduleSchema
  );
  let reminderModel = dbConnectionp.model(
    "reminderplans",
    ReminderScheduleSchema
  );
  let lateFeeModel = dbConnectionp.model("latefees", LateFeesSchema);
  let installmentModel = dbConnectionp.model("installments", InstallmentSchema);
  let categoryModel = dbConnectionp.model("categoryplans", CategorySchema);
  let concessionModel = dbConnectionp.model(
    "concessionplans",
    ConcessionSchema
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let feeManagerSchema = dbConnectionp.model("feemanagers", FeeManagerSchema);
  let feeMapModel = dbConnectionp.model("studentFeesMap", StudentFeeMapSchema);
  let feeTypeModel = dbConnectionp.model("feeTypes", FeeTypeSchema);
  let guardianSchema = dbConnectionp.model("guardian", GuardianSchema);
  let transactionModel = dbConnectionp.model(
    "transactions",
    transactionsSchema
  );
  let feeLedgerModel = dbConnectionp.model("feeledgers", feesLedgerSchema);
  let campusModel = dbConnectionp.model("campuses", campusSchema);
  let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
  let feeInstallmentPlanModel = dbConnectionp.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );

  let transData = await transactionModel.find({});
  let tcount = transData.length;
  return new Promise(async function (resolve, reject) {
    doc = [newMasterUpload];
    if (doc) {
      //   return res.status(200).json({ status: "success", data: doc });
      let pubnubConfig = {
        channel: inputData.orgId.toString(),
        message: {
          description: { message: "Setup Initiated", data: 0 },
          status: 0,
        },
      };
      let feeTypeDetails = await feeTypeModel.find({});
      let feeStructure = await feeStructureModel.find({});
      let paymentSchedule = await paymentScheduleModel.find({});
      let reminderPlan = await reminderModel.find({});
      let lateFeePlan = await lateFeeModel.find({});
      let installmentPlan = await installmentModel.find({});
      let categoryPlan = await categoryModel.find({});
      let cencessionPlan = await concessionModel.find({});
      let programPlanDatas = doc[0]["data"]["programPlans"];
      let feeManagerDatas = await feeManagerSchema.find({});
      let studentDetails = doc[0]["data"]["studentDetails"];
      let stdfeeMaps = doc[0]["data"]["studentFeeMaps"];
      let allexiststds = await studentModel.find({});
      //   let displayId = await getDisplayId("feeTypes", dbName, dbUrl);
      pubnubConfig.message.description = {
        message: `Institute Details has been added successfully.`,
        current: "Institute Details",
        next: "Fee Type",
      };
      pubnubConfig.message.status = 2;
      // await pubnub.publish(pubnubConfig);
      // var feeTypeDetails = []
      let i = 0;
      //Fee Structure Add
      let allFeeStructure;

      //Program Plan Add
      var allProgramPlan = [];
      var allPPlan = [];
      for (let j = 0; j < programPlanDatas.length; j++) {
        var ppInputData = programPlanDatas[j];
        let campid1 = await campuses.find(
          (item) => item.campusId == ppInputData["Campus ID"]
        );
        let campid = campid1._doc["_id"];
        let splitfromdate = ppInputData["From Date"].split("-");
        let splittodate = ppInputData["To Date"].split("-");
        let frdata = new Date(ppInputData["From Date"]);
        let trdata = new Date(ppInputData["To Date"]);
        let academicyear = `${frdata.getFullYear()}-${trdata
          .getFullYear()
          .toString()
          .slice(2, 4)}`;
        var ppData = {
          _id: mongoose.Types.ObjectId(),
          displayName: `PP_${finYear}_${(Number(j) + 1).toString().length == 1
            ? "00"
            : (Number(j) + 1).toString().length == 2
              ? "0"
              : ""
            }${Number(j) + 1}`,
          refid: ppInputData["Program Code *"],
          title: ppInputData["Program Name *"],
          fromDate: ppInputData["From Date"],
          toDate: ppInputData["To Date"],
          academicYear: academicyear,
          description: ppInputData["Description"],
          campusId: campid,
          status: ppInputData["Status"].toLowerCase() == "active" ? 1 : 0,
          createdBy: instName,
        };
        let existPP = await programPlanSchema.findOne({
          title: ppInputData["Program Name *"],
        });
        if (!existPP) {
          allProgramPlan.push(ppData);
        }
        allPPlan.push(ppData);
      }
      console.log(allProgramPlan.length);
      if (allProgramPlan.length > 0) {
        await programPlanSchema.insertMany(allProgramPlan);
        response.pp = allProgramPlan;
        pubnubConfig.message.description = {
          message: `Program Plan has been added successfully.`,
          current: "Program Plans",
          next: "Payment Schedules",
        };
        pubnubConfig.message.status = 24;
        // await pubnub.publish(pubnubConfig);
      }
      console.log("pp", allProgramPlan);
      //Payment Schdule Add
      var allPaymentSchedule = [];

      //ReminderPlan Add
      console.log("rr");
      var allReminderPlam = [];

      //LateFee Add
      var allLateFee = [];
      console.log("cc");
      //Category Add
      var allCategory = [];
      console.log("inst");
      //InstallmentPlan Add
      var allInstallment = [];
      console.log("con");
      var allConcession = [];
      console.log("std");
      var allStudents = [];
      for (let j = 0; j < studentDetails.length; j++) {
        // let existStd = await studentModel.findOne({ regId: studentDetails[j]["Reg ID *"] })
        let existStd = await studentModel.findOne({
          rollNumber: studentDetails[j]["HEDA ID"],
        });

        var ppInputData = studentDetails[j];
        let campid1 = await campuses.find(
          (item) => item.campusId == ppInputData["Campus ID"]
        );
        if (!campid1) {
          console.log(ppInputData["Campus ID"], campuses);
        }
        let campid = campid1._doc["_id"];
        if (!campid) {
          ppInputData;
        }
        let cipherfatherDetails = await CryptoJS.AES.encrypt(JSON.stringify({}), req.orgId).toString();
        var guardianDetails = {
          isPrimary: true,
          firstName:
            ppInputData["Parent Name"] == !""
              ? ppInputData["Parent Name"]
              : "-",
          lastName:
            ppInputData["Parent Name"] == !""
              ? ppInputData["Parent Name"]
              : " ",
          fullName:
            ppInputData["Parent Name"] == !""
              ? ppInputData["Parent Name"]
              : "-",
          mobile:
            ppInputData["Parent Phone Number"] == !""
              ? ppInputData["Parent Phone Number"]
              : "-",
          email:
            ppInputData["Parent Email Address"] == !""
              ? ppInputData["Parent Email Address"]
              : "-",
          PIIUsageFlag: true,
          PIIUsageFlagUpdated: new Date(),
          fatherDetails: cipherfatherDetails,
          motherDetails: cipherfatherDetails,
          guardianDetails: cipherfatherDetails,
          relation: "Parent",
          createdBy: instName,
        };
        if (existStd || existStd !== null) {
          // var guardianResponse = await guardianData.save();
          // console.log("guardiandetails", ppInputData["feeStructure"], ppInputData["Program Plan ID"]);
          // console.log(feeStructureData,programPlanData)
          var ppData = {
            displayName: existStd._doc.displayName,
            regId: ppInputData["Reg ID *"],
            rollNumber:
              ppInputData["HEDA ID"] == "-"
                ? ppInputData["Reg ID *"]
                : ppInputData["HEDA ID"],
            salutation:
              ppInputData["Salutation"] != undefined
                ? ppInputData["Salutation"]
                : null, // salutation
            category: ppInputData["Category"], // Category
            section: ppInputData["Section"] ? ppInputData["Section"] : "A",
            firstName: ppInputData["First Name *"], //First Name *
            middleName: ppInputData["Middle Name"], //
            lastName: ppInputData["Last Name *"], //Last Name *
            guardianDetails: existStd._doc.guardianDetails,
            gender: ppInputData["Gender"], //Gender
            dob: null,
            citizenship: ppInputData["Citizenship"], //
            currency: ppInputData["Currency"], //
            FOREX: ppInputData["FOREX"], //
            admittedOn: null,
            // admittedOn: new Date(ppInputData["Admitted Date"]) instanceof Date ? new Date(ppInputData["Admitted Date"]) : null, //Admitted Date *
            programPlanId: existStd._doc.programPlanId,
            feeStructureId: existStd._doc.feeStructureId,
            phoneNo: ppInputData["Phone Number *"], //Phone Number *
            email: ppInputData["Email Address *"], // Email Address *
            alternateEmail:
              ppInputData["alterEmail"] != undefined
                ? ppInputData["alterEmail"]
                : null,
            parentName: ppInputData["Parent Name"],
            parentPhone: ppInputData["Parent Phone Number"],
            parentEmail: ppInputData["Parent Email Address"],
            relation: "parent",
            addressDetails: {
              address1: ppInputData["Address 1"],
              address2: ppInputData["Address 2"],
              address3: ppInputData["Address 3"],
              city: ppInputData["City/Town"],
              state: ppInputData["State"],
              country: ppInputData["Country"], //Country
              pincode: ppInputData["PIN Code"], //PIN Code
            },
            isFinalYear:
              ppInputData["Is Final Year"].toLowerCase() == "yes"
                ? true
                : false,
            final: ppInputData["Final"],
            campusId: campid,
            status: ppInputData["Status"].toLowerCase() == "active" ? 1 : 0,
            createdBy: instName,
          };
          allStudents.push(ppData);
          response.stdsold.push(ppData);
          await studentModel.updateOne(
            { rollNumber: ppInputData["HEDA ID"] },
            { $set: ppData }
          );
          let updateguardian = await guardianSchema.updateOne(
            { _id: existStd._doc.guardianDetails[0] },
            { $set: guardianDetails }
          );
          await feePlanModel.updateOne(
            { studentRegId: existStd._doc.regId },
            {
              $set: { studentRegId: ppInputData["Reg ID *"], campusId: campid },
            }
          );
          await feeLedgerModel.updateMany({ studentRegId: existStd._doc.regId }, {
            $set: { studentRegId: ppInputData["Reg ID *"], campusId: campid },
          })
          await transactionModel.updateMany({ studentRegId: existStd._doc.regId }, {
            $set: { studentRegId: ppInputData["Reg ID *"], campusId: campid },
          })
          // let feepd = await feePlanModel.findOne({"studentRegId":ppInputData["Reg ID *"]})
          // await feeInstallmentPlanModel.updateMany({feePlanId: feepd._doc._id},{$set:{campusId: campid}} )
          // await feeMapModel.updateOne({studentId: existStd._doc._id}, {$set:{campusId: campid}})
        }
        // else if (!existStd || existStd ==null) {
        //   let guardianData = new guardianSchema(guardianDetails);
        //   await guardianData.save();
        //   // var guardianResponse = await guardianData.save();
        //   // console.log("guardiandetails", ppInputData["feeStructure"], ppInputData["Program Plan ID"]);
        //   let programPlanData = await allPPlan.find(item => item.refid.trim() == ppInputData["Program Plan ID"]);
        //   if (!programPlanData) {
        //     let programPlanData1 = await allPPlan.find(item => item.refid.trim() == ppInputData["Program Plan ID"]);
        //     programPlanData = await programPlanSchema.findOne({ title: programPlanData1.title });
        //   }
        //   // console.log("prorgamplan", programPlanData);
        //   let feeStructureData = await feeStructureModel.findOne({ campusId: campid.toString() });
        //   // console.log(feeStructureData,programPlanData)
        //   var ppData = {
        //     _id: mongoose.Types.ObjectId(),
        //     displayName: `STU_${finYear}_${
        //       (Number(j) + allexiststds.length).toString().length == 1 ? "00" : (Number(j) + allexiststds.length).toString().length == 2 ? "0" : ""
        //       }${Number(j) + allexiststds.length}`,
        //     regId: ppInputData["Reg ID *"] == "-" ? ppInputData["HEDA ID"] : ppInputData["Reg ID *"],
        //     rollNumber: ppInputData["HEDA ID"] == "-" ? ppInputData["Reg ID *"] : ppInputData["HEDA ID"],
        //     salutation:
        //       ppInputData["Salutation"] != undefined
        //         ? ppInputData["Salutation"]
        //         : null, // salutation
        //     category: ppInputData["Category"], // Category
        //     section: ppInputData["Section"] ? ppInputData["Section"] : "A",
        //     firstName: ppInputData["First Name *"], //First Name *
        //     middleName: ppInputData["Middle Name"], //
        //     lastName: ppInputData["Last Name *"], //Last Name *
        //     guardianDetails: [guardianData._id],
        //     gender: ppInputData["Gender"], //Gender
        //     dob: null,
        //     citizenship: ppInputData["Citizenship"], //
        //     currency: ppInputData["Currency"], //
        //     FOREX: ppInputData["FOREX"], //
        //     admittedOn: null,
        //     // admittedOn: new Date(ppInputData["Admitted Date"]) instanceof Date ? new Date(ppInputData["Admitted Date"]) : null, //Admitted Date *
        //     programPlanId: programPlanData._id,
        //     feeStructureId: feeStructureData._doc._id,
        //     phoneNo: ppInputData["Phone Number *"], //Phone Number *
        //     email: ppInputData["Email Address *"], // Email Address *
        //     alternateEmail:
        //       ppInputData["alterEmail"] != undefined
        //         ? ppInputData["alterEmail"]
        //         : null,
        //     parentName: ppInputData["Parent Name"],
        //     parentPhone: ppInputData["Parent Phone Number"],
        //     parentEmail: ppInputData["Parent Email Address"],
        //     relation: "parent",
        //     addressDetails: {
        //       address1: ppInputData["Address 1"],
        //       address2: ppInputData["Address 2"],
        //       address3: ppInputData["Address 3"],
        //       city: ppInputData["City/Town"],
        //       state: ppInputData["State"],
        //       country: ppInputData["Country"], //Country
        //       pincode: ppInputData["PIN Code"], //PIN Code
        //     },
        //     isFinalYear: ppInputData["Is Final Year"].toLowerCase() == "yes" ? true : false,
        //     final: ppInputData["Final"],
        //     campusId: campid,
        //     status: ppInputData["Status"].toLowerCase() == "active" ? 1 : 0,
        //     createdBy: instName,
        //   };
        //   allStudents.push(ppData);
        //   response.stdsnew.push(ppData);
        //   let newstd = new studentModel(ppData);
        //   await newstd.save()
        // }
      }
      if (allStudents.length > 0) {
        // await studentModel.insertMany(allStudents);
        pubnubConfig.message.description = {
          message: `Students has been added successfully.`,
          current: "Student Details",
          next: "Fee Manager",
        };
        pubnubConfig.message.status = 88;
        // await pubnub.publish(pubnubConfig);
        console.log("students added successfully");
      }

      // Fee Manager added
      var allFeeManager = [];

      // console.log("student fee map started")
      // var allStudentMap = [];
      // let feetypesd = await feeTypeModel.findOne({ displayName: "FT001" })
      // for (let j = 0; j < stdfeeMaps.length; j++) {
      //   // console.log(j)
      //   let existStdmaps
      //   existStdmaps = await response.stdsnew.find(item => item.regId == stdfeeMaps[j]["USN"])
      //   // console.log(Number(amountp1))
      //   if (existStdmaps) {
      //     let transdata = await transactionModel.find({})
      //     let transcount = transdata.length
      //     var ppInputData = stdfeeMaps[j];

      //     let studentData = await studentModel.findOne({
      //       rollNumber: ppInputData["Student ID"],
      //     });

      //     if (studentData === null) {
      //       studentData = await studentModel.findOne({
      //         regId: ppInputData["USN"],
      //       });
      //     }
      //     if (studentData === null) {
      //       studentData = await studentModel.findOne({
      //         regId: ppInputData["Reg ID *"],
      //       });
      //     }
      //     if (studentData === null) {
      //       studentData = await studentModel.findOne({
      //         regId: ppInputData["HEDA ID"],
      //       });
      //     }
      //     if (studentData === null) {
      //       studentData = await response.stdsnew.find(item => item["regId"] == ppInputData["USN"]);
      //     }
      //     let campid = studentData._doc["campusId"];
      //     // if (studentData._doc) {
      //     //     campid = studentData._doc["campusId"];
      //     //     existStdmaps = await feeMapModel.findOne({ studentId: studentData._doc._id })
      //     // }
      //     // else {
      //     //     campid = studentData["campusId"];
      //     //     existStdmaps = await feeMapModel.findOne({ studentId: studentData._id })
      //     // }
      //     // console.log(existStdmaps)
      //     let months = ["First", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      //     let duemonths = { "Year": 12, "Half-Year": 6, "Quarter": 3, "Month": 1, "One time date": 0, "One time date range": 0 }
      //     let dueDates = { "Second": 2, "Third": 3, "Fourth": 4, "Fifth": 5, "Last": 30, "Second Last": 28, "Third last": 27, "Fourth last": 2 }
      //     if (!studentData) {
      //       console.log(stdfeeMaps[j])
      //     }
      //     let prplan = await programPlanSchema.findOne({ _id: studentData.programPlanId })

      //     if (!prplan) {
      //       stdfeeMaps[j]
      //     }
      //     var d = new Date("2021-04-01");
      //     var d2 = new Date("2021-04-01");
      //     let amountp = stdfeeMaps[j]["Amount"] ? stdfeeMaps[j]["Amount"].replace(",", "") : "0";
      //     amountp = amountp.replace(/ +/g, "");
      //     let amountr = isNaN(Number(stdfeeMaps[j]["Amount Received"])) ? "0" : stdfeeMaps[j]["Amount Received"].replace(",", "");
      //     amountr = amountr.replace(/ +/g, "");
      //     let pend = parseFloat(amountp) - parseFloat(amountr)
      //     if (isNaN(pend) && !isNaN(amountp)) {
      //       pend = amountp
      //     }
      //     else if (isNaN(amountp)) {
      //       pend = 0.00
      //     }
      //     let paidamt = isNaN(amountr) ? "0" : amountr
      //     let rid = 0;
      //     trdate = null
      //     let feesbkp = []
      //     let paidamts = []
      //     for (ll = 0; ll < feeTypeDetails.length; ll++) {
      //       if (feeTypeDetails[ll]._doc.title.trim().toLowerCase().includes("term") && campid.toString() == feeTypeDetails[ll]._doc["campusId"].toString()) {
      //         feesbkp.push({
      //           amount: isNaN(amountp) ? 0.00 : amountp,
      //           paid: 0.00,
      //           pending: isNaN(amountp) ? 0.00 : amountp,
      //           feeTypeCode: feeTypeDetails[ll]._doc["displayName"],
      //           title: feeTypeDetails[ll]._doc["title"],
      //         })
      //         paidamts.push(0)
      //       }
      //     }
      //     var ppData
      //     ppData = {
      //       displayName: `SFM_${finYear}_${
      //         (Number(j) + allexiststds.length).toString().length == 1 ? "00" : (Number(j) + allexiststds.length).toString().length == 2 ? "0" : ""
      //         }${Number(j) + allexiststds.length}`,
      //       studentId: studentData._id,
      //       usn: stdfeeMaps[j]["USN"],
      //       programPlanId: studentData.programPlanId,
      //       feeStructureId: studentData.feeStructureId,
      //       feeManagerId: undefined,
      //       dueDate: d2.toISOString(),
      //       amount: isNaN(amountp) ? 0.00 : amountp,
      //       paid: 0.00,
      //       receivedDate: trdate,
      //       receiptNumbers: stdfeeMaps[j]["Receipt Number"],
      //       concession: 0,
      //       fine: 0,
      //       pending: isNaN(amountp) ? 0.00 : amountp,
      //       transactionPlan: {
      //         feesBreakUp: feesbkp,
      //         totalAmount: isNaN(amountp) ? 0.00 : amountp,
      //         paidAmount: paidamts,
      //         totalPaid: 0.00,
      //         totalPending: isNaN(amountp) ? 0.00 : amountp
      //       },
      //       campusId: campid,
      //       status: 1,
      //       createdBy: req.orgId,
      //     }
      //     allStudentMap.push(ppData);
      //     response.stdfmaps.push(ppData)
      //     let newstmaps = new feeMapModel(ppData);
      //     await newstmaps.save();
      //   }
      // }
      // console.log(allStudentMap)
      // if (allStudentMap.length > 0) {
      // feeMapModel.insertMany(allStudentMap, async function (err2, fmp) {
      //   if (err2) {
      //     if (err2) {
      //       console.log(err2)
      //       res.send(err2.toString())
      //     }
      //   } else {
      console.log("resolving");
      // createFeePlansN(req, dbConnectionp, feeManagerDatas, feeTypeDetails, studentDetails, feeManagerSchema, feeStructureModel, studentModel, stdfeeMaps, campuses, allProgramPlan, finYear, allStudentMap, response.stdsnew).then(ctresult => {
      // resolve({ status: "success", message: "Excel Uploaded Successfully", data: newMasterUpload })
      resolve({ message: "feeplans updated successfully" });
      // })
      // }
      // })
      // }
    } else {
      return res.status(400).json({
        status: "failure",
        message: "Upload file does not exist",
        Error: err,
      });
    }
  });
}

async function initCheck3(
  req,
  masterUpladModel,
  dbConnectionp,
  newMasterUpload,
  instName,
  result,
  states,
  campuses,
  finYear,
  res
) {
  let inputData = req;
  let dbName = req.orgId;
  let response = { pp: [], stdsnew: [], stdsold: [], stdfmaps: [] };
  let programPlanSchema = dbConnectionp.model(
    "programplans",
    ProgramPlanSchema
  );
  let feeStructureModel = dbConnectionp.model(
    "feestructures",
    FeeStructureSchema
  );
  let paymentScheduleModel = dbConnectionp.model(
    "paymentschedules",
    paymentScheduleSchema
  );
  let reminderModel = dbConnectionp.model(
    "reminderplans",
    ReminderScheduleSchema
  );
  let lateFeeModel = dbConnectionp.model("latefees", LateFeesSchema);
  let installmentModel = dbConnectionp.model("installments", InstallmentSchema);
  let categoryModel = dbConnectionp.model("categoryplans", CategorySchema);
  let concessionModel = dbConnectionp.model(
    "concessionplans",
    ConcessionSchema
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let feeManagerSchema = dbConnectionp.model("feemanagers", FeeManagerSchema);
  let feeMapModel = dbConnectionp.model("studentFeesMap", StudentFeeMapSchema);
  let feeTypeModel = dbConnectionp.model("feeTypes", FeeTypeSchema);
  let guardianSchema = dbConnectionp.model("guardian", GuardianSchema);
  let transactionModel = dbConnectionp.model(
    "transactions",
    transactionsSchema
  );
  // await studentModel.deleteMany({regId: {$in:["JBN64221","JBN39119","JBN64121","JBN64421","JBN25618","JBN64921","JBN65021","JBN64821","JBN63921","JBN64321","JBN64021","JBN64721","JBN63721","JBN63621","JBN63821","JBN44019","JBN41919","JBN64521"]}})
  // console.log(sdfds)
  let feeLedgerModel = dbConnectionp.model("feeledgers", feesLedgerSchema);
  let campusModel = dbConnectionp.model("campuses", campusSchema);
  let transData = await transactionModel.find({});
  let tcount = transData.length;
  return new Promise(async function (resolve, reject) {
    doc = [newMasterUpload];
    if (doc) {
      //   return res.status(200).json({ status: "success", data: doc });
      let pubnubConfig = {
        channel: inputData.orgId.toString(),
        message: {
          description: { message: "Setup Initiated", data: 0 },
          status: 0,
        },
      };
      let feeTypeDetails = await feeTypeModel.find({});
      let feeStructure = await feeStructureModel.find({});
      let paymentSchedule = await paymentScheduleModel.find({});
      let reminderPlan = await reminderModel.find({});
      let lateFeePlan = await lateFeeModel.find({});
      let installmentPlan = await installmentModel.find({});
      let categoryPlan = await categoryModel.find({});
      let cencessionPlan = await concessionModel.find({});
      let programPlanDatas = doc[0]["data"]["programPlans"];
      let feeManagerDatas = await feeManagerSchema.find({});
      let studentDetails = doc[0]["data"]["studentDetails"];
      let stdfeeMaps = doc[0]["data"]["studentFeeMaps"];
      let allexiststds = await studentModel.find({});
      //   let displayId = await getDisplayId("feeTypes", dbName, dbUrl);
      pubnubConfig.message.description = {
        message: `Institute Details has been added successfully.`,
        current: "Institute Details",
        next: "Fee Type",
      };
      pubnubConfig.message.status = 2;
      // await pubnub.publish(pubnubConfig);
      // var feeTypeDetails = []
      let i = 0;
      //Fee Structure Add
      let allFeeStructure;

      //Program Plan Add
      var allProgramPlan = [];
      var allPPlan = [];
      for (let j = 0; j < programPlanDatas.length; j++) {
        var ppInputData = programPlanDatas[j];
        let campid1 = await campuses.find(
          (item) => item.campusId == ppInputData["Campus ID"]
        );
        let campid = campid1._doc["_id"];
        let splitfromdate = ppInputData["From Date"].split("-");
        let splittodate = ppInputData["To Date"].split("-");
        let frdata = new Date(ppInputData["From Date"]);
        let trdata = new Date(ppInputData["To Date"]);
        let academicyear = `${frdata.getFullYear()}-${trdata
          .getFullYear()
          .toString()
          .slice(2, 4)}`;
        var ppData = {
          _id: mongoose.Types.ObjectId(),
          displayName: `PP_${finYear}_${(Number(j) + 1).toString().length == 1
            ? "00"
            : (Number(j) + 1).toString().length == 2
              ? "0"
              : ""
            }${Number(j) + 1}`,
          refid: ppInputData["Program Code *"],
          title: ppInputData["Program Name *"],
          fromDate: ppInputData["From Date"],
          toDate: ppInputData["To Date"],
          academicYear: academicyear,
          description: ppInputData["Description"],
          campusId: campid,
          status: ppInputData["Status"].toLowerCase() == "active" ? 1 : 0,
          createdBy: instName,
        };
        let existPP = await programPlanSchema.findOne({
          title: ppInputData["Program Name *"],
        });
        if (!existPP) {
          allProgramPlan.push(ppData);
        }
        allPPlan.push(ppData);
      }
      // inserting new Program plan
      if (allProgramPlan.length > 0) {
        await programPlanSchema.insertMany(allProgramPlan);
        response.pp = allProgramPlan;
        pubnubConfig.message.description = {
          message: `Program Plan has been added successfully.`,
          current: "Program Plans",
          next: "Payment Schedules",
        };
        pubnubConfig.message.status = 24;
        // await pubnub.publish(pubnubConfig);
      }
      console.log("pp", allProgramPlan);

      //Payment Schdule Add
      var allPaymentSchedule = [];

      //ReminderPlan Add
      console.log("rr");
      var allReminderPlam = [];

      //LateFee Add
      var allLateFee = [];
      console.log("cc");
      //Category Add
      var allCategory = [];
      console.log("inst");
      //InstallmentPlan Add
      var allInstallment = [];
      console.log("con");
      var allConcession = [];
      console.log("std");
      var allStudents = [];
      for (let j = 0; j < studentDetails.length; j++) {
        // let existStd = await studentModel.findOne({ regId: studentDetails[j]["Reg ID *"] })
        // if(existStd){
        existStd = await studentModel.findOne({
          rollNumber: studentDetails[j]["HEDA ID"],
        });
        // }
        var ppInputData = studentDetails[j];
        let campid1 = await campuses.find(
          (item) => item.campusId == ppInputData["Campus ID"]
        );
        if (!campid1) {
          console.log(ppInputData["Campus ID"], campuses);
        }
        let campid = campid1._doc["_id"];
        if (!campid) {
          ppInputData;
        }
        let cipherfatherDetails = await CryptoJS.AES.encrypt(JSON.stringify({}), req.orgId).toString();
        var guardianDetails = {
          isPrimary: true,
          firstName:
            ppInputData["Parent Name"] == !""
              ? ppInputData["Parent Name"]
              : "-",
          lastName:
            ppInputData["Parent Name"] == !""
              ? ppInputData["Parent Name"]
              : " ",
          fullName:
            ppInputData["Parent Name"] == !""
              ? ppInputData["Parent Name"]
              : "-",
          mobile:
            ppInputData["Parent Phone Number"] == !""
              ? ppInputData["Parent Phone Number"]
              : "-",
          email:
            ppInputData["Parent Email Address"] == !""
              ? ppInputData["Parent Email Address"]
              : "-",
          PIIUsageFlag: true,
          PIIUsageFlagUpdated: new Date(),
          fatherDetails: cipherfatherDetails,
          motherDetails: cipherfatherDetails,
          guardianDetails: cipherfatherDetails,
          relation: "Parent",
          createdBy: instName,
        };
        if (!existStd || existStd == null) {
          let guardianData = new guardianSchema(guardianDetails);
          await guardianData.save();
          let programPlanData = await allPPlan.find(
            (item) => item.refid.trim() == ppInputData["Program Plan ID"]
          );
          if (!programPlanData) {
            let programPlanData1 = await allPPlan.find(
              (item) => item.refid.trim() == ppInputData["Program Plan ID"]
            );
            programPlanData = await programPlanSchema.findOne({
              title: programPlanData1.title,
            });
          }
          // console.log("prorgamplan", programPlanData);
          let feeStructureData = await feeStructureModel.findOne({
            campusId: campid.toString(),
          });
          // console.log(feeStructureData,programPlanData)
          // console.log(ppInputData["Reg ID *"] , ppInputData["First Name *"],ppInputData["Last Name *"])
          var ppData = {
            _id: mongoose.Types.ObjectId(),
            displayName: `STU_${finYear}_${(Number(j) + allexiststds.length).toString().length == 1
              ? "00"
              : (Number(j) + allexiststds.length).toString().length == 2
                ? "0"
                : ""
              }${Number(j) + allexiststds.length}`,
            regId:
              ppInputData["Reg ID *"] == "-"
                ? ppInputData["HEDA ID"]
                : ppInputData["Reg ID *"],
            rollNumber:
              ppInputData["HEDA ID"] == "-"
                ? ppInputData["Reg ID *"]
                : ppInputData["HEDA ID"],
            salutation:
              ppInputData["Salutation"] != undefined
                ? ppInputData["Salutation"]
                : null, // salutation
            category: ppInputData["Category"], // Category
            section: ppInputData["Section"] ? ppInputData["Section"] : "A",
            firstName: ppInputData["First Name *"], //First Name *
            middleName: ppInputData["Middle Name"], //
            lastName: ppInputData["Last Name *"], //Last Name *
            guardianDetails: [guardianData._id],
            gender: ppInputData["Gender"], //Gender
            dob: null,
            citizenship: ppInputData["Citizenship"], //
            currency: ppInputData["Currency"], //
            FOREX: ppInputData["FOREX"], //
            admittedOn: null,
            // admittedOn: new Date(ppInputData["Admitted Date"]) instanceof Date ? new Date(ppInputData["Admitted Date"]) : null, //Admitted Date *
            programPlanId: programPlanData._id,
            feeStructureId: feeStructureData._doc._id,
            phoneNo: ppInputData["Phone Number *"], //Phone Number *
            email: ppInputData["Email Address *"], // Email Address *
            alternateEmail:
              ppInputData["alterEmail"] != undefined
                ? ppInputData["alterEmail"]
                : null,
            parentName: ppInputData["Parent Name"],
            parentPhone: ppInputData["Parent Phone Number"],
            parentEmail: ppInputData["Parent Email Address"],
            relation: "parent",
            addressDetails: {
              address1: ppInputData["Address 1"],
              address2: ppInputData["Address 2"],
              address3: ppInputData["Address 3"],
              city: ppInputData["City/Town"],
              state: ppInputData["State"],
              country: ppInputData["Country"], //Country
              pincode: ppInputData["PIN Code"], //PIN Code
            },
            isFinalYear:
              ppInputData["Is Final Year"].toLowerCase() == "yes"
                ? true
                : false,
            final: ppInputData["Final"],
            campusId: campid,
            status: ppInputData["Status"].toLowerCase() == "active" ? 1 : 0,
            createdBy: instName,
          };
          allStudents.push(ppData);
          response.stdsnew.push(ppData);
          let newstd = new studentModel(ppData);
          await newstd.save();
        }
        else {
          console.log(j, studentDetails[j]["HEDA ID"], studentDetails[j]["Reg ID *"])
        }
      }
      if (allStudents.length > 0) {
        // await studentModel.insertMany(allStudents);
        pubnubConfig.message.description = {
          message: `Students has been added successfully.`,
          current: "Student Details",
          next: "Fee Manager",
        };
        pubnubConfig.message.status = 88;
        // await pubnub.publish(pubnubConfig);
        console.log("students added successfully");
      }

      // Fee Manager added
      var allFeeManager = [];

      // console.log("student fee map started")
      var allStudentMap = [];
      let feetypesd = await feeTypeModel.findOne({ displayName: "FT001" });
      let allstdmap = await feeMapModel.find({});
      let lastid = allstdmap[allstdmap.length - 1]
      let lastindex = lastid._doc.displayName.split("_")
      console.log(lastid, lastindex)
      for (let j = 0; j < stdfeeMaps.length; j++) {
        // console.log(j)
        let existStdmaps;
        existStdmaps = await response.stdsnew.find(
          (item) => item.regId.toString() == stdfeeMaps[j]["USN"].toString()
        );
        if (existStdmaps) {
          // console.log(stdfeeMaps[j]["USN"],existStdmaps!==null, existStdmaps!==undefined )
          let transdata = await transactionModel.find({});
          let transcount = transdata.length;
          var ppInputData = stdfeeMaps[j];

          let studentData = await studentModel.findOne({
            rollNumber: ppInputData["Student ID"],
          });

          if (studentData === null) {
            studentData = await studentModel.findOne({
              regId: ppInputData["USN"],
            });
          }
          if (studentData === null) {
            studentData = await studentModel.findOne({
              regId: ppInputData["Reg ID *"],
            });
          }
          if (studentData === null) {
            studentData = await studentModel.findOne({
              regId: ppInputData["HEDA ID"],
            });
          }
          if (studentData === null) {
            studentData = await response.stdsnew.find(
              (item) => item["regId"] == ppInputData["USN"]
            );
          }
          let campid = studentData._doc["campusId"];
          // if (studentData._doc) {
          //     campid = studentData._doc["campusId"];
          //     existStdmaps = await feeMapModel.findOne({ studentId: studentData._doc._id })
          // }
          // else {
          //     campid = studentData["campusId"];
          //     existStdmaps = await feeMapModel.findOne({ studentId: studentData._id })
          // }
          // console.log(existStdmaps)
          let months = [
            "First",
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          let duemonths = {
            Year: 12,
            "Half-Year": 6,
            Quarter: 3,
            Month: 1,
            "One time date": 0,
            "One time date range": 0,
          };
          let dueDates = {
            Second: 2,
            Third: 3,
            Fourth: 4,
            Fifth: 5,
            Last: 30,
            "Second Last": 28,
            "Third last": 27,
            "Fourth last": 2,
          };
          if (!studentData) {
            console.log(stdfeeMaps[j]);
          }
          let prplan = await programPlanSchema.findOne({
            _id: studentData.programPlanId,
          });

          if (!prplan) {
            stdfeeMaps[j];
          }
          var d = new Date("2021-04-01");
          var d2 = new Date("2021-04-01");
          let amountp = stdfeeMaps[j]["Amount"]
            ? stdfeeMaps[j]["Amount"].replace(",", "")
            : "0";
          amountp = amountp.replace(/ +/g, "");
          let amountr = isNaN(Number(stdfeeMaps[j]["Amount Received"]))
            ? "0"
            : stdfeeMaps[j]["Amount Received"].replace(",", "");
          amountr = amountr.replace(/ +/g, "");
          let pend = parseFloat(amountp) - parseFloat(amountr);
          if (isNaN(pend) && !isNaN(amountp)) {
            pend = amountp;
          } else if (isNaN(amountp)) {
            pend = 0.0;
          }
          let paidamt = isNaN(amountr) ? "0" : amountr;
          let rid = 0;
          trdate = null;
          let feesbkp = [];
          let paidamts = [];
          for (ll = 0; ll < feeTypeDetails.length; ll++) {
            if (
              feeTypeDetails[ll]._doc.title
                .trim()
                .toLowerCase()
                .includes("term") &&
              campid.toString() ==
              feeTypeDetails[ll]._doc["campusId"].toString()
            ) {
              feesbkp.push({
                amount: isNaN(Number(amountp)) ? 0.0 : amountp,
                paid: 0.0,
                pending: isNaN(Number(amountp)) ? 0.0 : amountp,
                feeTypeCode: feeTypeDetails[ll]._doc["displayName"],
                title: feeTypeDetails[ll]._doc["title"],
              });
              paidamts.push(0);
            }
          }
          var ppData;
          ppData = {
            displayName: `SFM_${finYear}_${(Number(j + 2) + Number(lastindex[2])).toString().length == 1
              ? "00"
              : (Number(j + 2) + Number(lastindex[2])).toString().length == 2
                ? "0"
                : ""
              }${Number(j + 2) + Number(lastindex[2])}`,
            studentId: studentData._id,
            usn: stdfeeMaps[j]["USN"],
            programPlanId: studentData.programPlanId,
            feeStructureId: studentData.feeStructureId,
            feeManagerId: undefined,
            dueDate: d2.toISOString(),
            amount: isNaN(Number(amountp)) ? 0.0 : amountp,
            paid: 0.0,
            receivedDate: trdate,
            receiptNumbers: stdfeeMaps[j]["Receipt Number"],
            concession: 0,
            fine: 0,
            pending: isNaN(Number(amountp)) ? 0.0 : amountp,
            transactionPlan: {
              feesBreakUp: feesbkp,
              totalAmount: isNaN(amountp) ? 0.0 : amountp,
              paidAmount: paidamts,
              totalPaid: 0.0,
              totalPending: isNaN(amountp) ? 0.0 : amountp,
            },
            campusId: campid,
            status: 1,
            createdBy: req.orgId,
          };
          allStudentMap.push(ppData);
          response.stdfmaps.push(ppData);
          let newstmaps = new feeMapModel(ppData);
          let savefm = await newstmaps.save();
          // if(stdfeeMaps[j]["USN"].toString()=="4854" || stdfeeMaps[j]["USN"].toString()=="2275" ){
          //   console.log(savefm, newstmaps)
          // }
          // console.log(savefm)
        }
      }
      // console.log(allStudentMap)
      // if (allStudentMap.length > 0) {
      // feeMapModel.insertMany(allStudentMap, async function (err2, fmp) {
      //   if (err2) {
      //     if (err2) {
      //       console.log(err2)
      //       res.send(err2.toString())
      //     }
      //   } else {
      console.log("resolving");
      createFeePlansN(
        req,
        dbConnectionp,
        feeManagerDatas,
        feeTypeDetails,
        studentDetails,
        feeManagerSchema,
        feeStructureModel,
        studentModel,
        stdfeeMaps,
        campuses,
        allProgramPlan,
        finYear,
        allStudentMap,
        response.stdsnew
      ).then((ctresult) => {
        // resolve({ status: "success", message: "Excel Uploaded Successfully", data: newMasterUpload })
        resolve({ message: "feeplans updated successfully" });
      });
      // }
      // })
      // }
    } else {
      return res.status(400).json({
        status: "failure",
        message: "Upload file does not exist",
        Error: err,
      });
    }
  });
}
async function createFeePlansN(
  req,
  dbConnectionp,
  feeManagerDatas,
  feeTypeDetails,
  studentDetails,
  feeManagerSchema,
  feeStructureModel,
  studentModel,
  stdfeeMaps,
  campuses,
  allProgramPlan,
  finYear,
  allStudentMap1,
  allstdss
) {
  return new Promise(async function (resolve, reject) {
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let allStudentMap = dbConnectionp.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let paymentScheduleModel = dbConnectionp.model(
      "paymentschedules",
      paymentScheduleSchema
    );

    var allStudentsFeePlans = [];
    var allStudentsInstallmentPlans = [];
    let allPaymentSchedule = await paymentScheduleModel.find({});
    let count = 0;
    let dcount = 0;
    let count1 = 0;
    let allstddata = await studentModel.find({});
    let allfeeplan = await feePlanModel.find({});
    let lastid = allfeeplan[allfeeplan.length - 1]
    let lastindex = lastid._doc.applicationId.split("_")
    console.log(lastindex)
    for (let j = 0; j < studentDetails.length; j++) {
      let existStdmaps;
      existStdmaps = await allstdss.find(
        (item) => item.regId == studentDetails[j]["Reg ID *"]
      );
      if (existStdmaps) {
        count1++;
        console.log(j);
        let ppInputData = studentDetails[j];
        // regId = ppInputData["Reg ID *"] == "-" ? ppInputData["HEDA ID"] : ppInputData["Reg ID *"]
        let regId = ppInputData["Reg ID *"];
        let stddata = await studentModel.findOne({ regId: regId });
        // let ppdata = await allProgramPlan.find(item => item._id.toString() == stddata._doc.programPlanId);
        // let yearsplit = ppdata.academicYear.split("-")
        // let year = yearsplit[0]
        let feestrData = await feeStructureModel.findOne({
          _id: stddata._doc.feeStructureId,
          campusId: stddata._doc.campusId,
        });
        let feeData = await allStudentMap.findOne({
          studentId: stddata._doc._id,
        });
        if (feeData || feeData !== null) {
          let stuFeeplan = {
            _id: mongoose.Types.ObjectId(),
            applicationId: `FPLAN_${finYear}_${(Number(count1) + Number(lastindex[2]) + 1).toString().length == 1
              ? "00"
              : (Number(count1) + Number(lastindex[2]) + 1).toString().length == 2
                ? "0"
                : ""
              }${Number(count1) + Number(lastindex[2]) + 1}`,
            studentRegId:
              ppInputData["Reg ID *"] == "-"
                ? ppInputData["HEDA ID"]
                : ppInputData["Reg ID *"],
            studentId: stddata._id,
            programPlanHEDAId: ppInputData["Program Plan ID"],
            plannedAmount: 0,
            plannedAmountBreakup: [],
            paidAmount: 0,
            paidAmountBreakup: [],
            pendingAmount: 0,
            pendingAmountBreakup: [],
            currency: stddata._doc.currency,
            forex: stddata._doc.FOREX,
            discountType: "",
            discountPercentage: 0,
            discountAmount: 0,
            dueDate: "",
            penaltyStartDate: "",
            percentageBreakup: [],
            installmentPlan: {},
            discountAmountBreakup: [],
            campusId: stddata._doc.campusId,
            remarks: {
              seller: "",
              finance: "",
              headseller: "",
            },
          };
          let stdFeeInPlan = {
            feePlanId: stuFeeplan._id,
            label: "",
            description: "",
            dueDate: "",
            lateFeeStartDate: "",
            percentage: "",
            totalAmount: 0,
            plannedAmount: 0,
            plannedAmountBreakup: [],
            paidAmount: 0,
            paidAmountBreakup: [],
            pendingAmount: 0,
            pendingAmountBreakup: [],
            discountType: "",
            discountPercentage: 0,
            discountAmount: 0,
            discountAmountBreakup: [],
            status: "",
            transactionId: "",
            campusId: stddata._doc.campusId,
            remarks: {
              seller: "",
              finance: "",
              headseller: "",
            },
          };
          let feeAmount = 0;
          let plannedAmount = 0;
          let pendingAmount = 0;
          let paidAmount = 0;
          let plannedAmountBreakup = [];
          let paidAmountBreakup = [];
          let pendingAmountBreakup = [];
          let discountAmountBreakup = [];
          let instplannedAmountBreakup = [];
          let instpaidAmountBreakup = [];
          let instpendingAmountBreakup = [];
          let duedates = [
            new Date(`2021-April-10`),
            new Date(`2021-June-10`),
            new Date(`2021-September-10`),
            new Date(`2021-November-10`),
          ];
          let latefeesdates = [
            new Date(`2021-April-30`),
            new Date(`2021-June-30`),
            new Date(`2021-September-30`),
            new Date(`2021-November-30`),
          ];
          for (let i = 0; i < feestrData._doc.feeTypeIds.length; i++) {
            let feetyped = feeTypeDetails.find(
              (item) => item._id.toString() == feestrData._doc.feeTypeIds[i]
            );

            let feeBreakup = [];
            let pshedule = allPaymentSchedule[0]._doc;
            if (
              feetyped.title.toLowerCase().includes("tuition") ||
              feetyped.title.includes("Term")
            ) {
              plannedAmountBreakup.push({
                amount: Number(feeData["amount"]),
                feeTypeCode: feetyped.displayName,
                title: feetyped.title,
              });
              plannedAmount = plannedAmount + Number(feeData["amount"]);
              pendingAmount = pendingAmount + Number(feeData["pending"]);
              paidAmount = paidAmount + Number(feeData["paid"]);
              pendingAmountBreakup.push({
                amount: Number(feeData["pending"]),
                feeTypeCode: feetyped.displayName,
                title: feetyped.title,
              });
              paidAmountBreakup.push({
                amount: Number(feeData["paid"]),
                feeTypeCode: feetyped.displayName,
                title: feetyped.title,
              });
            } else {
              plannedAmountBreakup.push({
                amount: 0.0,
                feeTypeCode: feetyped.displayName,
                title: feetyped.title,
              });
              plannedAmount = plannedAmount + 0;
              pendingAmount = pendingAmount + 0;
              paidAmount = paidAmount + 0;
              pendingAmountBreakup.push({
                amount: 0.0,
                feeTypeCode: feetyped.displayName,
                title: feetyped.title,
              });
              paidAmountBreakup.push({
                amount: 0.0,
                feeTypeCode: feetyped.displayName,
                title: feetyped.title,
              });
            }
            discountAmountBreakup.push({
              amount: 0.0,
              feeTypeCode: feetyped.displayName,
              title: feetyped.title,
            });
            if (i + 1 == feestrData._doc.feeTypeIds.length) {
              for (l = 0; l < pshedule.feesBreakUp.length; l++) {
                count = l + 1;
                let plannedAmountBreakupinst = [];
                let pendingAmountBreakupinst = [];
                let paidAmountBreakupinst = [];
                for (n = 0; n < plannedAmountBreakup.length; n++) {
                  plannedAmountBreakupinst.push({
                    amount: isNaN(
                      Number(
                        (parseFloat(pshedule.feesBreakUp[l]) *
                          parseFloat(plannedAmountBreakup[n].amount)) /
                        100
                      )
                    )
                      ? 0
                      : (parseFloat(pshedule.feesBreakUp[l]) *
                        parseFloat(plannedAmountBreakup[n].amount)) /
                      100,
                    feeTypeCode: plannedAmountBreakup[n].feeTypeCode,
                    title: `Term ${count < 3 ? 1 : 2} Fees`,
                    // title: plannedAmountBreakup[n].title,
                  });
                  pendingAmountBreakupinst.push({
                    amount: isNaN(
                      Number(
                        (parseFloat(pshedule.feesBreakUp[l]) *
                          parseFloat(pendingAmountBreakup[n].amount)) /
                        100
                      )
                    )
                      ? 0
                      : (parseFloat(pshedule.feesBreakUp[l]) *
                        parseFloat(pendingAmountBreakup[n].amount)) /
                      100,
                    feeTypeCode: pendingAmountBreakup[n].feeTypeCode,
                    title: `Term ${count < 3 ? 1 : 2} Fees`,
                    // title: pendingAmountBreakup[n].title,
                  });
                  paidAmountBreakupinst.push({
                    amount: isNaN(
                      Number(
                        (parseFloat(pshedule.feesBreakUp[l]) *
                          parseFloat(paidAmountBreakup[n].amount)) /
                        100
                      )
                    )
                      ? 0
                      : (parseFloat(pshedule.feesBreakUp[l]) *
                        parseFloat(paidAmountBreakup[n].amount)) /
                      100,
                    feeTypeCode: paidAmountBreakup[n].feeTypeCode,
                    title: `Term ${count < 3 ? 1 : 2} Fees`,
                    // title: paidAmountBreakup[n].title,
                  });
                }
                dcount++;
                let stuinstallplans = new feeInstallmentPlanModel({
                  feePlanId: stuFeeplan._id,
                  label: `Installment${Number(count).toString().length == 1
                    ? "00"
                    : Number(count).toString().length == 2
                      ? "0"
                      : ""
                    }${Number(count)}`,
                  displayName: `INST_${finYear}_${(Number(dcount) + allstddata.length).toString().length == 1
                    ? "00"
                    : (Number(dcount) + allstddata.length).toString()
                      .length == 2
                      ? "0"
                      : ""
                    }${Number(dcount) + allstddata.length}`,
                  description: `Installment${Number(count).toString().length == 1
                    ? "00"
                    : Number(count).toString().length == 2
                      ? "0"
                      : ""
                    }${Number(count)}`,
                  dueDate: duedates[l],
                  lateFeeStartDate: latefeesdates[l],
                  percentage: pshedule.feesBreakUp[l],
                  totalAmount: isNaN(Number(plannedAmount)) ? 0 : plannedAmount,
                  // plannedAmount: parseFloat(pshedule.feesBreakUp[l]) * parseFloat(pendingAmount) / 100,
                  plannedAmount: isNaN(
                    Number(
                      (parseFloat(pshedule.feesBreakUp[l]) *
                        parseFloat(plannedAmount)) /
                      100
                    )
                  )
                    ? 0
                    : (parseFloat(pshedule.feesBreakUp[l]) *
                      parseFloat(plannedAmount)) /
                    100,
                  plannedAmountBreakup: pendingAmountBreakupinst,
                  paidAmount: isNaN(Number(paidAmount)) ? 0 : paidAmount,
                  paidAmountBreakup: paidAmountBreakupinst,
                  pendingAmount: isNaN(
                    Number(
                      (parseFloat(pshedule.feesBreakUp[l]) *
                        parseFloat(pendingAmount)) /
                      100
                    )
                  )
                    ? 0
                    : (parseFloat(pshedule.feesBreakUp[l]) *
                      parseFloat(pendingAmount)) /
                    100,
                  pendingAmountBreakup: pendingAmountBreakupinst,
                  discountType: "",
                  discountPercentage: 0,
                  discountAmount: 0,
                  discountAmountBreakup: discountAmountBreakup,
                  status: "Planned",
                  transactionId: "",
                  campusId: stddata._doc.campusId,
                  remarks: {
                    seller: "",
                    finance: "",
                    headseller: "",
                  },
                });
                await stuinstallplans.save();
                allStudentsInstallmentPlans.push(stuinstallplans);
              }
            }
          }
          stuFeeplan.plannedAmount = isNaN(Number(plannedAmount))
            ? 0
            : plannedAmount;
          stuFeeplan.pendingAmount = isNaN(Number(pendingAmount))
            ? 0
            : pendingAmount;
          stuFeeplan.paidAmount = isNaN(Number(paidAmount)) ? 0 : paidAmount;
          stuFeeplan.plannedAmountBreakup = plannedAmountBreakup;
          stuFeeplan.paidAmountBreakup = paidAmountBreakup;
          stuFeeplan.pendingAmountBreakup = pendingAmountBreakup;
          stuFeeplan.discountAmountBreakup = discountAmountBreakup;
          let stuFeePlans = new feePlanModel(stuFeeplan);
          await stuFeePlans.save();
          allStudentsFeePlans.push(stuFeePlans);
          if (j + 1 == studentDetails.length) {
            console.log("s");
            resolve({
              status: "success",
              message: "fee plan created successfully",
            });
          }
        } else {
          console.log(stddata);
        }
      }
    }
  });
}

async function createOtcPayment(req, orgData, dbConnection) {
  let inputData = req.body;
  orgData = orgData._doc;
  console.log("orgData", orgData);
  var receiptN = ("" + Math.random()).substring(2, 7);
  var year2 = moment().year();
  var transactionDate = moment
    .utc(inputData.transactionDate)
    .tz("Asia/Kolkata");

  // let transactionDate = moment(inputData.transactionDate).format();

  var transID = `TXN/${year2}/${receiptN + 1}`;
  let imode = inputData.data.method;
  let mode = imode.toLowerCase();
  let transactId;
  if (mode == "cash") {
    transactId = transID;
  } else {
    transactId = inputData.paymentTransactionId;
  }

  if (!orgData || orgData == null) {
    return false;
  } else {
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );

    let guardianModel = dbConnection.model("guardians", GuardianSchema);

    let programPlanModel = dbConnection.model(
      "programplans",
      programPlanSchema
    );
    let feeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let settingsModel = dbConnection.model("settings", settingsSchema);
    let studentModel = dbConnection.model("students", StudentSchema);
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
    let installFeePlanModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );

    let studentDetails = await studentModel.findOne({
      regId: inputData.studentRegId,
    });
    const orgSettings = await settingsModel.findOne({});
    if (studentDetails) {
      let studentFeeMapDetails = await feeMapModel.findOne({
        studentId: studentDetails._id,
      });
      let programPlanDetails = await programPlanModel.findOne({
        _id: studentDetails.programPlanId,
      });
      let feePlanData = await feePlanModel.findOne({
        studentRegId: studentDetails.regId,
      });
      if (
        Number(feePlanData.pendingAmount) == 0 ||
        Number(feePlanData.pendingAmount) < 0
      ) {
        res.status(400).json({
          success: false,
          Message: `Already Paid Full Payment for the student registration ID : ${studentDetails.regId}`,
        });
      } else {
        var transactionDetails = await transactionModel.find({
          $or: [{ status: "Pending" }, { status: "Partial" }],
          studentRegId: studentDetails.regId,
          transactionSubType: "demandNote",
        });
        let demandNoteId;
        if (transactionDetails.length == 0) {
          demandNoteId = [];
        } else {
          demandNoteId = transactionDetails.displayName;
        }
        let installmentPlanData = await installFeePlanModel.find({
          feePlanId: feePlanData._id,
        });
        let feesBreak = [];
        var totalLoan = Number(inputData.amount);
        for (oneInsta of installmentPlanData) {
          if (oneInsta.status.toLowerCase() !== "paid") {
            let payAmnt;
            if (Number(oneInsta.plannedAmount) <= Number(totalLoan)) {
              payAmnt = oneInsta.plannedAmount;
            } else {
              payAmnt = Number(totalLoan);
            }
            totalLoan = Number(totalLoan) - Number(payAmnt);
            let paid = Number(oneInsta.paidAmount) + Number(payAmnt);
            let pending = Number(oneInsta.pendingAmount) - Number(payAmnt);
            let allPending;
            if (Number(pending) < 0) {
              allPending = 0;
            } else {
              allPending = pending;
            }
            if (Number(payAmnt) !== 0 || Number(payAmnt) > 0) {
              let feesBreakup = {
                amount: payAmnt,
                paid: paid,
                pending: allPending,
                feeTypeCode: oneInsta.plannedAmountBreakup[0].feeTypeCode,
                title: oneInsta.plannedAmountBreakup[0].title,
                installment: oneInsta.label,
                dueDate: oneInsta.dueDate,
              };
              feesBreak.push(feesBreakup);
            }
          }
        }
        var rcptId = await getDisplayId(dbConnection);
        let passData = {
          displayName: rcptId,
          transactionDate: transactionDate,
          relatedTransactions: [],
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          studentId: studentDetails._id,
          emailCommunicationRefIds: studentDetails.email,
          studentName: studentDetails.firstName + " " + studentDetails.lastName,
          class: inputData.class,
          academicYear: inputData.academicYear,
          amount: inputData.amount,
          studentRegId: studentDetails.regId,
          receiptNo: rcptId,
          programPlan: studentDetails.programPlanId,
          data: {
            orgId: inputData.data.orgId,
            displayName: rcptId,
            transactionType: "eduFees",
            transactionSubType: "feePayment",
            mode: "OTC",
            method: inputData.data.method,
            modeDetails: inputData.data.modeDetails,
            feesBreakUp: feesBreak,
          },
          paymentTransactionId: transactId,
          receiptStatus: "",
          currency: "INR",
          currencyAmount: totalLoan,
          exchangeRate: totalLoan,
          userName: studentDetails.firstName + " " + studentDetails.lastName,
          createdBy: studentDetails.createdBy,
          updatedBy: studentDetails.createdBy,
          campusId: studentDetails.campusId,
          status: "",
          type: orgSettings._doc.fees.sendReceipt,
        };
        let createDemand = await ledgerEntry({ body: passData }, dbConnection);
        if (createDemand.status == "success") {
          let feMapDe = await feeMapModel.findOne({
            studentId: studentDetails._id,
          });
          let feePlanData = await feePlanModel.findOne({
            studentRegId: studentDetails.regId,
          });
          let updateFeeMap = await feeMapModel.updateOne(
            { displayName: feMapDe.displayName },
            {
              $set: {
                paid: Number(feePlanData.paidAmount),
                pending: Number(feePlanData.pendingAmount),
              },
            }
          );
          if (updateFeeMap.nModified) {
            return {
              status: "success",
              message: "Transaction Created Successfully",
              data: createDemand,
            };
          } else {
            return {
              success: false,
              message: "Unable to update the student fees mapping",
            };
          }
        } else {
          return {
            success: false,
            Message: `Unable to make the payment for the student registration ID ${studentDetails.regId}`,
            // Error: createDemand,
          };
        }
      }
    } else {
      return { success: false, message: "Invalid Registration ID" };
    }
  }
}

async function createOtcPaymentTrial(req, orgData, dbConnection) {
  let inputData = req.body;
  orgData = orgData._doc;
  console.log("orgData", orgData);
  var receiptN = ("" + Math.random()).substring(2, 7);
  var year2 = moment().year();
  var transactionDate = moment
    .utc(inputData.transactionDate)
    .tz("Asia/Kolkata");

  // let transactionDate = moment(inputData.transactionDate).format();

  var transID = `TXN/${year2}/${receiptN + 1}`;
  let imode = inputData.data.method;
  let mode = imode.toLowerCase();
  let transactId;
  if (mode == "cash") {
    transactId = transID;
  } else {
    transactId = inputData.paymentTransactionId;
  }

  if (!orgData || orgData == null) {
    return false;
  } else {
    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );

    let guardianModel = dbConnection.model("guardians", GuardianSchema);

    let programPlanModel = dbConnection.model(
      "programplans",
      programPlanSchema
    );
    let feeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let settingsModel = dbConnection.model("settings", settingsSchema);
    let studentModel = dbConnection.model("students", StudentSchema);
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
    let installFeePlanModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );

    let studentDetails = await studentModel.findOne({
      regId: inputData.studentRegId,
    });
    const orgSettings = await settingsModel.findOne({});
    if (studentDetails) {
      let studentFeeMapDetails = await feeMapModel.findOne({
        studentId: studentDetails._id,
      });
      let programPlanDetails = await programPlanModel.findOne({
        _id: studentDetails.programPlanId,
      });
      let feePlanData = await feePlanModel.findOne({
        studentRegId: studentDetails.regId,
      });
      var transactionDetails = await transactionModel.find({
        $or: [{ status: "Pending" }, { status: "Partial" }],
        studentRegId: studentDetails.regId,
        transactionSubType: "demandNote",
      });
      let demandNoteId;
      if (transactionDetails.length == 0) {
        demandNoteId = [];
      } else {
        demandNoteId = transactionDetails.displayName;
      }
      // let installmentPlanData = await installFeePlanModel.find({
      //   feePlanId: feePlanData._id,
      // });
      let feesBreak = [];
      var totalLoan = Number(inputData.amount);
      let payAmnt = Number(totalLoan);
      totalLoan = Number(totalLoan) - Number(payAmnt);
      let paid = Number(payAmnt);
      let pending = 0;
      let allPending;
      if (Number(pending) < 0) {
        allPending = 0;
      } else {
        allPending = pending;
      }
      if (Number(payAmnt) !== 0 || Number(payAmnt) > 0) {
        let feesBreakup = {
          amount: payAmnt,
          paid: paid,
          pending: allPending,
          feeTypeCode: "FT_2021-22_001",
          title: "Tuition Fee",
          installment: "Installment001",
          dueDate: new Date(),
        };
        feesBreak.push(feesBreakup);
      }

      var rcptId = await getDisplayId(dbConnection);
      let passData = {
        displayName: rcptId,
        transactionDate: transactionDate,
        relatedTransactions: [],
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        studentId: studentDetails._id,
        emailCommunicationRefIds: studentDetails.email,
        studentName: studentDetails.firstName + " " + studentDetails.lastName,
        class: inputData.class,
        academicYear: inputData.academicYear,
        amount: inputData.amount,
        studentRegId: studentDetails.regId,
        receiptNo: rcptId,
        programPlan: studentDetails.programPlanId,
        data: {
          orgId: inputData.data.orgId,
          displayName: rcptId,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          mode: "OTC",
          method: inputData.data.method,
          modeDetails: inputData.data.modeDetails,
          feesBreakUp: feesBreak,
        },
        paymentTransactionId: transactId,
        receiptStatus: "",
        currency: "INR",
        currencyAmount: totalLoan,
        exchangeRate: totalLoan,
        userName: studentDetails.firstName + " " + studentDetails.lastName,
        createdBy: studentDetails.createdBy,
        updatedBy: studentDetails.createdBy,
        campusId: studentDetails.campusId,
        status: "",
        type: orgSettings._doc.fees.sendReceipt,
      };
      let createDemand = await ledgerEntryTrial({ body: passData }, dbConnection);
      if (createDemand.status == "success") {
        return {
          status: "success",
          message: "Transaction Created Successfully",
          data: createDemand,
        };
      } else {
        return {
          success: false,
          Message: `Unable to make the payment for the student registration ID ${studentDetails.regId}`,
          // Error: createDemand,
        };
      }

    } else {
      return { success: false, message: "Invalid Registration ID" };
    }
  }
}
async function ledgerEntry(req, dbConnection) {
  let txnData = req.body;
  checkTransactionPayload(txnData);
  transactionSubType = txnData.transactionSubType;
  let TxnModel = dbConnection.model("transactions", transactionsSchema);
  let FeesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
  let journeyModel = dbConnection.model("journeys", journeysSchema);
  let reconciliationTransactionsModel = dbConnection.model(
    "reconciliationTransactions",
    reconciliationTransactionsSchema
  );
  let studentModel = dbConnection.model("students", StudentSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
  let installFeePlan = dbConnection.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );
  let studentData = await studentModel.findOne({ _id: txnData.studentId });
  var savedTxnData;
  var ledgerIds;
  var status = "Pending";
  var journeysData;
  var feePlanData;
  var installmentFeePlan;
  try {
    let studentFeesDetails = await feePlanModel.findOne({
      studentRegId: txnData.studentRegId,
    });
    savedTxnData = await insertTransaction(txnData, TxnModel);
    ledgerIds = await insertFeesPaymentLedgerEntries(
      savedTxnData,
      FeesLedgerModel,
      studentFeesDetails
    );
    journeysData = await journeyEntry(
      txnData,
      savedTxnData,
      ledgerIds,
      journeyModel,
      studentFeesDetails.pendingAmount
    );

    feePlanData = await updateFeePlan(
      txnData,
      savedTxnData,
      ledgerIds,
      feePlanModel
    );

    installmentFeePlan = await updateInstallmentFeePlan(
      savedTxnData,
      installFeePlan,
      feePlanData
    );
    let studentFeesDetails1 = await feePlanModel.findOne({
      studentRegId: txnData.studentRegId,
    });
    if (Number(studentFeesDetails1.pendingAmount) == 0) {
      status = "Paid";
    } else {
      status = "Partial";
    }
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: status }
    );
    msg =
      "feesTransactionsController: Created " +
      ledgerIds.length +
      " ledger entries for transaction: " +
      txnData.displayName;
    return { status: "success", message: msg, data: savedTxnData };
  } catch (err) {
    msg = "feesTransactionsController: Error: " + err.message;
    // need to do cleanup in case transaction (and some ledger entries) were inserted
    if (savedTxnData) {
      msg =
        "feesTransactionsController: Error: " +
        err.message +
        " Rolling back transaction " +
        savedTxnData._id +
        " and ledgerIds: " +
        ledgerIds;

      if (TxnModel) {
        await TxnModel.deleteOne({ _id: savedTxnData._id });
      }
      if (FeesLedgerModel && ledgerIds) {
        await FeesLedgerModel.deleteMany({ _id: { $in: ledgerIds } });
      }
    }
    return { status: "failure", message: msg, data: txnData };
  } finally {
    // dbConnection.close();
  }
}

async function ledgerEntryTrial(req, dbConnection) {
  let txnData = req.body;
  checkTransactionPayload(txnData);
  transactionSubType = txnData.transactionSubType;
  let TxnModel = dbConnection.model("transactions", transactionsSchema);
  let FeesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
  let journeyModel = dbConnection.model("journeys", journeysSchema);
  let reconciliationTransactionsModel = dbConnection.model(
    "reconciliationTransactions",
    reconciliationTransactionsSchema
  );
  let studentModel = dbConnection.model("students", StudentSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
  let installFeePlan = dbConnection.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );
  let studentData = await studentModel.findOne({ _id: txnData.studentId });
  var savedTxnData;
  var ledgerIds;
  var status = "Paid";
  var journeysData;
  var feePlanData;
  var installmentFeePlan;
  try {
    let studentFeesDetails = {
      paidAmount: txnData.amount,
      pendingAmount: 0

    }
    savedTxnData = await insertTransaction(txnData, TxnModel);
    ledgerIds = await insertFeesPaymentLedgerEntriesTrial(
      savedTxnData,
      FeesLedgerModel,
      studentFeesDetails
    );
    journeysData = await journeyEntry(
      txnData,
      savedTxnData,
      ledgerIds,
      journeyModel,
      0
    );

    // let studentFeesDetails1 = await feePlanModel.findOne({
    //   studentRegId: txnData.studentRegId,
    // });
    // if (Number(studentFeesDetails1.pendingAmount) == 0) {
    status = "Paid";
    // } else {
    //   status = "Partial";
    // }
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: status }
    );
    msg =
      "feesTransactionsController: Created " +
      ledgerIds.length +
      " ledger entries for transaction: " +
      txnData.displayName;
    return { status: "success", message: msg, data: savedTxnData };
  } catch (err) {
    msg = "feesTransactionsController: Error: " + err.message;
    // need to do cleanup in case transaction (and some ledger entries) were inserted
    if (savedTxnData) {
      msg =
        "feesTransactionsController: Error: " +
        err.message +
        " Rolling back transaction " +
        savedTxnData._id +
        " and ledgerIds: " +
        ledgerIds;

      if (TxnModel) {
        await TxnModel.deleteOne({ _id: savedTxnData._id });
      }
      if (FeesLedgerModel && ledgerIds) {
        await FeesLedgerModel.deleteMany({ _id: { $in: ledgerIds } });
      }
    }
    return { status: "failure", message: msg, data: txnData };
  } finally {
    // dbConnection.close();
  }
}

async function getDisplayId(dbConnection) {
  var getDatas = [];
  var transType = "";
  const rcptSchema = dbConnection.model(
    "transactions",
    transactionsSchema,
    "transactions"
  );
  //   let rcptSchema = await dbConnection.model(
  //     "transactions",
  //     rcptModel,
  //     "transactions"
  //   );
  getDatas = await rcptSchema.find({});
  transType = "RCPT";
  var date = new Date();
  var month = date.getMonth();
  var finYear = "";
  // if (month >= 2) {

  // } else {
  //   var current = date.getFullYear();
  //   current = String(current).substr(String(current).length - 2);
  //   var prev = Number(date.getFullYear()) - 1;
  //   finYear = `${prev}-${current}`;
  // }
  var current = date.getFullYear();
  var prev = Number(date.getFullYear()) + 1;
  prev = String(prev).substr(String(prev).length - 2);
  finYear = `${current}-${prev}`;

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

/**
 * This function performs all sanity checks on input payload
 * req.body should have payload for transaction and corresponding ledger entries
 * @param {*} txnData - from httpRequest object - txnData = req.body
 */
function checkTransactionPayload(txnData) {
  let displayName = txnData.displayName;
  let txnType = txnData.transactionType;
  let txnSubType = txnData.transactionSubType;
  // check for null or empty fields in the httprequest payload
  if (!displayName || displayName == "") {
    errMsg =
      "transactionController: displayName is null in the Transaction payload";
    throw new Error(errMsg);
  }
  if (!txnType || txnType == "") {
    errMsg =
      "transactionController: transactionType is null in the Transaction payload";
    throw new Error(errMsg);
  }
  if (!txnSubType || txnSubType == "") {
    errMsg =
      "transactionController: transactionSubType is null in the Transaction payload";
    throw new Error(errMsg);
  }
} // checkTransactionPayload

async function insertTransaction(txnData, TxnModel) {
  try {
    let txnModel = new TxnModel(txnData);
    var savedTxnData = await txnModel.save();
    msg =
      "feesTransactionsController: Created: " +
      "_id: " +
      savedTxnData._id +
      ", '" +
      savedTxnData.displayName +
      "', type: " +
      savedTxnData.transactionType +
      "/" +
      savedTxnData.transactionSubType;
    return savedTxnData;
  } catch (err) {
    throw err;
  }
} // insertTransaction

async function insertFeesPaymentLedgerEntries(
  savedTxnData,
  FeesLedgerModel,
  studentFeeDetails
) {
  let totalPendingAmount = studentFeeDetails.pendingAmount;
  var status = "Paid";
  let pada = Number(studentFeeDetails.paidAmount) + Number(savedTxnData.amount);
  if (pada < totalPendingAmount) {
    status = "Partial";
  }

  var ledgerIds = [];
  var pending = totalPendingAmount;
  for (feeItem of savedTxnData.data.feesBreakUp) {
    let ans = Number(pending) - Number(feeItem.amount);
    if (Number(feeItem.amount) !== 0) {
      let primary;
      if (savedTxnData.relatedTransactions.length == 0) {
        primary = "";
      } else {
        primary = savedTxnData.relatedTransactions[0];
      }
      feesLedgerData = {
        transactionId: savedTxnData._id,
        transactionDate: savedTxnData.transactionDate,
        transactionDisplayName: savedTxnData.displayName,
        primaryTransaction: primary,
        feeTypeCode: feeItem.feeTypeCode,
        paidAmount: Number(feeItem.amount),
        pendingAmount: ans,
        transactionType: savedTxnData.transactionType,
        transactionSubType: savedTxnData.transactionSubType,
        studentId: savedTxnData.studentId,
        studentRegId: savedTxnData.studentRegId,
        studentName: savedTxnData.studentName,
        academicYear: savedTxnData.academicYear,
        class: savedTxnData.class,
        programPlan: savedTxnData.programPlan,
        campusId: savedTxnData.campusId,
        status: status,
      };
      let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
      ledgerResponse = await feesLedgerModel.save();
      ledgerIds.push(ledgerResponse._id);
    }
  } // for
  return ledgerIds;
} // insertFeesPaymentLedgerEntries

async function insertFeesPaymentLedgerEntriesTrial(
  savedTxnData,
  FeesLedgerModel,
  studentFeeDetails
) {
  let totalPendingAmount = studentFeeDetails.pendingAmount;
  var status = "Paid";
  let pada = Number(studentFeeDetails.paidAmount) + Number(savedTxnData.amount);
  if (pada < totalPendingAmount) {
    status = "Partial";
  }

  var ledgerIds = [];
  var pending = totalPendingAmount;
  for (feeItem of savedTxnData.data.feesBreakUp) {
    let ans = 0;
    if (Number(feeItem.amount) !== 0) {
      let primary;
      if (savedTxnData.relatedTransactions.length == 0) {
        primary = "";
      } else {
        primary = savedTxnData.relatedTransactions[0];
      }
      feesLedgerData = {
        transactionId: savedTxnData._id,
        transactionDate: savedTxnData.transactionDate,
        transactionDisplayName: savedTxnData.displayName,
        primaryTransaction: primary,
        feeTypeCode: feeItem.feeTypeCode,
        paidAmount: Number(feeItem.amount),
        pendingAmount: ans,
        transactionType: savedTxnData.transactionType,
        transactionSubType: savedTxnData.transactionSubType,
        studentId: savedTxnData.studentId,
        studentRegId: savedTxnData.studentRegId,
        studentName: savedTxnData.studentName,
        academicYear: savedTxnData.academicYear,
        class: savedTxnData.class,
        programPlan: savedTxnData.programPlan,
        campusId: savedTxnData.campusId,
        status: status,
      };
      let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
      ledgerResponse = await feesLedgerModel.save();
      ledgerIds.push(ledgerResponse._id);
    }
  } // for
  return ledgerIds;
} // insertFeesPaymentLedgerEntriestrial
//jounrey entry
async function journeyEntry(
  inputData,
  txnData,
  ledgerData,
  journeyModel,
  totalPendingAmount
) {
  let primary;
  if (txnData.relatedTransactions.length == 0) {
    primary = "";
  } else {
    primary = txnData.relatedTransactions[0];
  }
  let journeyData = {
    primaryCoaCode: inputData.studentId,
    primaryTransaction: primary,
    transaction: txnData.displayName,
    transactionDate: txnData.transactionDate,
    ledgerId: ledgerData,
    creditAmount: 0,
    debitAmount: inputData.amount,
    campusId: inputData.campusId,
    pendingAmount: totalPendingAmount,
  };
  let journeyLedgerData = new journeyModel(journeyData);
  journeyResponse = await journeyLedgerData.save();
  return journeyResponse;
}

//updateFeeplan
async function updateFeePlan(inputData, txnData, ledgerData, feePlanModel) {
  let studentFeesDetails = await feePlanModel.findOne({
    studentRegId: txnData.studentRegId,
  });
  if (studentFeesDetails == null || studentFeesDetails == undefined) {
    console.log("no student fee plan");
    return;
  }

  let pendingAmount =
    Number(studentFeesDetails.pendingAmount) - Number(txnData.amount);
  let totalPaid =
    Number(studentFeesDetails.paidAmount) + Number(txnData.amount);

  for (oneFees of txnData.data.feesBreakUp) {
    // Find item index using _.findIndex (thanks @Muniyaraj for comment)
    var index = _.findIndex(studentFeesDetails.paidAmountBreakup, {
      feeTypeCode: oneFees.feeTypeCode,
    });

    let indexData = studentFeesDetails.paidAmountBreakup[index];

    // Replace item at index using native splice
    studentFeesDetails.paidAmountBreakup.splice(index, 1, {
      amount: Number(indexData.amount) + Number(oneFees.amount),
      feeTypeCode: indexData.feeTypeCode,
      title: indexData.title,
    });
  }

  for (onePending of txnData.data.feesBreakUp) {
    // Find item index using _.findIndex (thanks @Muniyaraj for comment)
    var index = _.findIndex(studentFeesDetails.pendingAmountBreakup, {
      feeTypeCode: onePending.feeTypeCode,
    });

    let indexData = studentFeesDetails.pendingAmountBreakup[index];

    let pendingAm = Number(indexData.amount) - Number(onePending.amount);

    let tot;
    if (Number(pendingAm) < 0) {
      tot = 0;
    } else {
      tot = Number(pendingAm);
    }
    // Replace item at index using native splice
    studentFeesDetails.pendingAmountBreakup.splice(index, 1, {
      amount: tot,
      feeTypeCode: indexData.feeTypeCode,
      title: indexData.title,
    });
  }

  let totalPending;
  if (Number(pendingAmount) < 0) {
    totalPending = 0;
  } else {
    totalPending = pendingAmount;
  }

  let feePlanId = await feePlanModel.findOne({
    studentRegId: txnData.studentRegId,
  });

  let datum = await feePlanModel.updateOne(
    { studentRegId: txnData.studentRegId },
    {
      $set: {
        paidAmount: totalPaid,
        paidAmountBreakup: studentFeesDetails.paidAmountBreakup,
        pendingAmount: totalPending,
        pendingAmountBreakup: studentFeesDetails.pendingAmountBreakup,
      },
    },
    async function (err, resultData) {
      if (resultData.nModified) {
        console.log("updated successfully", feePlanId._id);
        return feePlanId._id;
      } else {
        return err;
      }
    }
  );

  return feePlanId._id;
}

async function updateInstallmentFeePlan(
  txnData,
  installmentFeePlanModel,
  feePlanId
) {
  //transaction loop
  for (oneBreakUp of txnData.data.feesBreakUp) {
    let oneInstallment = await installmentFeePlanModel.findOne({
      label: String(oneBreakUp.installment),
      feePlanId: feePlanId,
    });
    let oneInstallmentPaid = Number(oneInstallment.paidAmount);
    let oneInstallmentPending = Number(oneInstallment.pendingAmount);
    if (
      Number(oneInstallmentPending) < 0 ||
      Number(oneInstallmentPending) == 0
    ) {
      return { status: "Fee Installment Already Paid" };
    } else {
      let newPaid = Number(oneInstallmentPaid) + Number(oneBreakUp.amount);
      let newPending =
        Number(oneInstallmentPending) - Number(oneBreakUp.amount);
      let status;
      if (Number(newPending) == 0 || Number(newPending) < 0) {
        status = "Paid";
      } else {
        status = "Planned";
      }

      // Find item index using _.findIndex (thanks @Muniyaraj for comment)
      var index = _.findIndex(oneInstallment.paidAmountBreakup, {
        feeTypeCode: oneBreakUp.feeTypeCode,
      });

      let indexData = oneInstallment.paidAmountBreakup[index];

      // Replace item at index using native splice
      oneInstallment.paidAmountBreakup.splice(index, 1, {
        amount: Number(indexData.amount) + Number(oneBreakUp.amount),
        feeTypeCode: indexData.feeTypeCode,
        title: indexData.title,
      });

      // Find item index using _.findIndex (thanks @Muniyaraj for comment)
      var index1 = _.findIndex(oneInstallment.pendingAmountBreakup, {
        feeTypeCode: oneBreakUp.feeTypeCode,
      });

      let indexData1 = oneInstallment.pendingAmountBreakup[index1];

      // Replace item at index using native splice
      oneInstallment.pendingAmountBreakup.splice(index, 1, {
        amount: Number(indexData1.amount) - Number(oneBreakUp.amount),
        feeTypeCode: indexData1.feeTypeCode,
        title: indexData1.title,
      });

      installmentFeePlanModel.updateOne(
        { _id: oneInstallment._id },
        {
          $set: {
            paidAmount: newPaid,
            pendingAmount: newPending,
            status: status,
            paidAmountBreakup: oneInstallment.paidAmountBreakup,
            pendingAmountBreakup: oneInstallment.pendingAmountBreakup,
          },
        },
        async function (err, resultData) {
          if (resultData.nModified) {
            console.log("updated installment successfully", resultData);
          } else {
            console.log("nothing updated", err);
          }
        }
      );
    }
  }
}

module.exports.getLeadsInfo = async (req, res) => {
  let centralDbConnection;
  let orgId = req.query.orgId;
  let leadId = req.query.leadId;

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
    _id: mongoose.Types.ObjectId(orgId),
  });
  // let dbConnection = await createDatabase( `usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  // const instituteModel = dbConnection.model("orglists", OrgListSchema);
  console.log(req.body.organizationId);
  let dbConnectionp = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  const leadsSchema = mongoose.Schema({}, { strict: false });
  let leadsModel = dbConnectionp.model("leads", leadsSchema);
  let settingsModel = dbConnectionp.model("settings", leadsSchema);

  // try {
  let programPlanSchema = dbConnectionp.model(
    "programplans",
    ProgramPlanSchema
  );
  let feeStructureModel = dbConnectionp.model(
    "feestructures",
    FeeStructureSchema
  );
  let paymentScheduleModel = dbConnectionp.model(
    "paymentschedules",
    paymentScheduleSchema
  );
  let reminderModel = dbConnectionp.model(
    "reminderplans",
    ReminderScheduleSchema
  );
  let lateFeeModel = dbConnectionp.model("latefees", LateFeesSchema);
  let updatelead = await leadsModel.updateOne(
    { leadId: req.query.leadId },
    { $set: { accountStatus: "Application Created" } }
  );
  let leaddata = await leadsModel.find({});
  let settingsdata = await settingsModel.find({});
  let installmentModel = dbConnectionp.model("installments", InstallmentSchema);
  let categoryModel = dbConnectionp.model("categoryplans", CategorySchema);
  let concessionModel = dbConnectionp.model(
    "concessionplans",
    ConcessionSchema
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let feeManagerSchema = dbConnectionp.model("feemanagers", FeeManagerSchema);
  let feeMapModel = dbConnectionp.model("studentFeesMap", StudentFeeMapSchema);
  let feeTypeModel = dbConnectionp.model("feeTypes", FeeTypeSchema);
  let guardianSchema = dbConnectionp.model("guardian", GuardianSchema);
  let transactionModel = dbConnectionp.model(
    "transactions",
    transactionsSchema
  );
  let feeLedgerModel = dbConnectionp.model("feeledgers", feesLedgerSchema);
  let campusModel = dbConnectionp.model("campuses", campusSchema);
  let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
  let feeInstallmentPlanModel = dbConnectionp.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );
  let allpp = await programPlanSchema.find({});
  let pysh = await paymentScheduleModel.find({});
  let inst = await installmentModel.find({});
  if (req.query.delete == "yes") {
    await feePlanModel.deleteMany({});
    await feeLedgerModel.deleteMany({});
    await feeInstallmentPlanModel.deleteMany({});
    await transactionModel.deleteMany({});
    await guardianSchema.deleteMany({});
    await feeMapModel.deleteMany({});
    await studentModel.deleteMany({});
    await paymentScheduleModel.deleteMany({});
    await installmentModel.deleteMany({});
    await feeTypeModel.deleteMany({});
    await feeStructureModel.deleteMany({});
    await programPlanSchema.deleteMany({});
  }
  if (req.query.deletelead == "yes") {
    await leadsModel.deleteMany({});
  }
  res.send({
    leads: leaddata,
    settings: settingsdata,
    updateled: updatelead,
    instllment: inst,
    paymentschedule: pysh,
    programplans: allpp,
  });
};

module.exports.updateDiscountFees2 = async (req, res) => {
  let input = req.body;
  let keys = ["NCFE CVR", "NCFE CVR PP", "NCFE JBN"];
  let orgId = req.query.orgId;
  let dbConnectionp
  let centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: mongoose.Types.ObjectId(orgId),
  });
  if (process.env.stage == "local") {
    dbConnectionp = await createDatabase(
      req.query.orgId,
      req.query.resource
    );
  } else {
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
  }
  try {
    let campusModel = dbConnectionp.model("campuses", campusSchema);
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
    let count = 0
    let nofeeplanscount = 0
    let morediscountthaninst = 0
    for (let j = 0; j < keys.length; j++) {
      console.log(input[keys[j]].length)
      let input2 = input[keys[j]]
      let campusId = input2[0].campusId
      console.log(campusId)
      for (let i = 0; i < input2.length; i++) {
        let feePlanData = await feePlanModel.findOne({ studentRegId: input2[i].regId, campusId: campusId })
        let feeInstdata
        if (!feePlanData) {
          nofeeplanscount++
        } else {
          feeInstdata = await feeInstallmentPlanModel.find({ feePlanId: feePlanData._doc._id })
        }
        if (feePlanData && Number(feePlanData._doc.pendingAmount) > 0 && !isNaN(Number(input2[i].discount.replace(",", ""))) && Number(feePlanData._doc.pendingAmount) > Number(input2[i].discount.replace(",", ""))) {
          count++
          let newPlanned = Number(feePlanData._doc.plannedAmount) - Number(input2[i].discount.replace(",", ""));
          let newPending = Number(feePlanData._doc.pendingAmount) - Number(input2[i].discount.replace(",", ""));
          let updatefeePlan = await feePlanModel.updateOne({ studentRegId: input2[i].regId }, { $set: { plannedAmount: newPlanned, "plannedAmountBreakup.0.amount": newPlanned, pendingAmount: newPending, "pendingAmountBreakup.0.amount": newPending, discountAmount: Number(input2[i].discount.replace(",", "")), "discountAmountBreakup.0.amount": Number(input2[i].discount.replace(",", "")) } });
          if (feeInstdata.length == 2) {
            if (Number(feeInstdata[1]._doc.pendingAmount) < Number(input2[i].discount.replace(",", ""))) {
              morediscountthaninst++
              console.log("not paid")
              }
          } else if (feeInstdata.length == 3) {
            let newbreakup = [(Number(newPlanned) * 0.6),(Number(newPlanned) * 0.2),(Number(newPlanned) * 0.2) ]
            let extrapaid = (Number(feeInstdata[0]._doc.paidAmount)) - (Number(newPlanned) * 0.6);
            let newpaidbreakup = [ (Number(newPlanned) * 0.6), extrapaid, 0]
            let newpendingbreakup = [ 0, ((Number(newPlanned) * 0.2)-extrapaid), (Number(newPlanned) * 0.2)]
            let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[0]._doc._id, }, {$set:{plannedAmount: newbreakup[0], "plannedAmountBreakup.0.amount": newbreakup[0],paidAmount: newpaidbreakup[0], "paidAmountBreakup.0.amount": newpaidbreakup[0], pendingAmount: newpendingbreakup[0], "pendingAmountBreakup.0.amount": newpendingbreakup[0]}});
            let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[1]._doc._id, }, {$set:{plannedAmount: newbreakup[1], "plannedAmountBreakup.0.amount": newbreakup[1],paidAmount: newpaidbreakup[1], "paidAmountBreakup.0.amount": newpaidbreakup[1], pendingAmount: newpendingbreakup[1], "pendingAmountBreakup.0.amount": newpendingbreakup[1]}});
            let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[2]._doc._id, }, {$set:{plannedAmount: newbreakup[2], "plannedAmountBreakup.0.amount": newbreakup[2],paidAmount: newpaidbreakup[2], "paidAmountBreakup.0.amount": newpaidbreakup[2], pendingAmount: newpendingbreakup[2], "pendingAmountBreakup.0.amount": newpendingbreakup[2]}});
          } else if (feeInstdata.length == 4) {
            let newbreakup = [(Number(newPlanned) * 0.4), (Number(newPlanned) * 0.2),(Number(newPlanned) * 0.2),((Number(newPlanned) * 0.2))];
            let extrapaid1 = (Number(feeInstdata[0]._doc.paidAmount)) - (Number(newPlanned) * 0.4);
            let extrapaid2 = 0
            if(Number(feeInstdata[1]._doc.paidAmount)>0){
              extrapaid2 = (Number(feeInstdata[1]._doc.paidAmount)) - (Number(newPlanned) * 0.4);
              let totextra = extrapaid1+extrapaid2
            let newpaidbreakup = [(Number(newPlanned) * 0.4), (Number(newPlanned) * 0.2),totextra, 0]
            let newpendingbreakup = [ 0, 0, (((Number(newPlanned) * 0.2))-totextra), Number(newPlanned) * 0.2]
            let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[0]._doc._id, }, {$set:{plannedAmount: newbreakup[0], "plannedAmountBreakup.0.amount": newbreakup[0],paidAmount: newpaidbreakup[0], "paidAmountBreakup.0.amount": newpaidbreakup[0], pendingAmount: newpendingbreakup[0], "pendingAmountBreakup.0.amount": newpendingbreakup[0]}});
            let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[1]._doc._id, }, {$set:{plannedAmount: newbreakup[1], "plannedAmountBreakup.0.amount": newbreakup[1],paidAmount: newpaidbreakup[1], "paidAmountBreakup.0.amount": newpaidbreakup[1], pendingAmount: newpendingbreakup[1], "pendingAmountBreakup.0.amount": newpendingbreakup[1]}});
            let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[2]._doc._id, }, {$set:{plannedAmount: newbreakup[2], "plannedAmountBreakup.0.amount": newbreakup[2],paidAmount: newpaidbreakup[2], "paidAmountBreakup.0.amount": newpaidbreakup[2], pendingAmount: newpendingbreakup[2], "pendingAmountBreakup.0.amount": newpendingbreakup[2]}});
            let updatefeePlaninst4 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[3]._doc._id, }, {$set:{plannedAmount: newbreakup[2], "plannedAmountBreakup.0.amount": newbreakup[3],paidAmount: newpaidbreakup[3], "paidAmountBreakup.0.amount": newpaidbreakup[3], pendingAmount: newpendingbreakup[3], "pendingAmountBreakup.0.amount": newpendingbreakup[3]}});
            }
            else{
              let totextra = extrapaid1+extrapaid2
              let newpaidbreakup = [(Number(newPlanned) * 0.4), totextra,0, 0]
              let newpendingbreakup = [ 0, (((Number(newPlanned) * 0.2))-totextra), Number(newPlanned) * 0.2, Number(newPlanned) * 0.2]
              let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[0]._doc._id, }, {$set:{plannedAmount: newbreakup[0], "plannedAmountBreakup.0.amount": newbreakup[0],paidAmount: newpaidbreakup[0], "paidAmountBreakup.0.amount": newpaidbreakup[0], pendingAmount: newpendingbreakup[0], "pendingAmountBreakup.0.amount": newpendingbreakup[0]}});
              let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[1]._doc._id, }, {$set:{plannedAmount: newbreakup[1], "plannedAmountBreakup.0.amount": newbreakup[1],paidAmount: newpaidbreakup[1], "paidAmountBreakup.0.amount": newpaidbreakup[1], pendingAmount: newpendingbreakup[1], "pendingAmountBreakup.0.amount": newpendingbreakup[1]}});
              let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[2]._doc._id, }, {$set:{plannedAmount: newbreakup[2], "plannedAmountBreakup.0.amount": newbreakup[2],paidAmount: newpaidbreakup[2], "paidAmountBreakup.0.amount": newpaidbreakup[2], pendingAmount: newpendingbreakup[2], "pendingAmountBreakup.0.amount": newpendingbreakup[2]}});
              let updatefeePlaninst4 = await feeInstallmentPlanModel.updateOne({_id: feeInstdata[3]._doc._id, }, {$set:{plannedAmount: newbreakup[2], "plannedAmountBreakup.0.amount": newbreakup[3],paidAmount: newpaidbreakup[3], "paidAmountBreakup.0.amount": newpaidbreakup[3], pendingAmount: newpendingbreakup[3], "pendingAmountBreakup.0.amount": newpendingbreakup[3]}});
            }
            
            if (Number(feeInstdata[2]._doc.pendingAmount) < Number(input2[i].discount.replace(",", ""))) {
              morediscountthaninst++
            }
          }
          if (j + 1 == keys.length && i + 1 == input2.length) {
            res.send({ message: "all iterations executed", count: count, nofeeplanscount: nofeeplanscount, morediscountthaninst: morediscountthaninst })
          }
        } else {
          if (j + 1 == keys.length && i + 1 == input2.length) {
            res.send({ message: "all iterations executed", count: count, nofeeplanscount: nofeeplanscount, morediscountthaninst: morediscountthaninst })
          }
        }
      }
    }
  } catch (err) {
    res.json({
      status: "failure",
      message: "discount update: " + err.stack,
    });
  }
  finally {
    dbConnectionp.close();
    centralDbConnection.close();
  }

}
module.exports.updateDiscountInstallment2 = async (req, res) => {
  let input = req.body;
  let keys = ["NCFE CVR", "NCFE CVR PP", "NCFE JBN"];
  let orgId = req.query.orgId;
  let dbConnectionp
  let centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: mongoose.Types.ObjectId(orgId),
  });
  if (process.env.stage == "local") {
    dbConnectionp = await createDatabase(
      req.query.orgId,
      req.query.resource
    );
  } else {
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
  }
  try {
    let campusModel = dbConnectionp.model("campuses", campusSchema);
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
    let count = 0
    let nofeeplanscount = 0
    let studentfeePlans = await feeInstallmentPlanModel.find({paidAmount: {$lt:0}});
    let morediscountthaninst = 0
    let zeropaid= 0
    let stdplansids = []
    console.log(studentfeePlans.length)
    for (let j = 0; j < studentfeePlans.length; j++) {
      if(!stdplansids.includes(studentfeePlans[j]._doc.feePlanId.toString())){
        stdplansids.push(studentfeePlans[j]._doc.feePlanId.toString())
      }
    }
    res.send(stdplansids)
  } catch (err) {
    res.json({
      status: "failure",
      message: "discount update: " + err.stack,
    });
  }
  finally {
    dbConnectionp.close();
    centralDbConnection.close();
  }

}
module.exports.updateDiscountInstallment1 = async (req, res) => {
  let input = req.body;
  let keys = ["NCFE CVR", "NCFE CVR PP", "NCFE JBN"];
  let orgId = req.query.orgId;
  let dbConnectionp
  let centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: mongoose.Types.ObjectId(orgId),
  });
  // if (process.env.stage == "local") {
  //   dbConnectionp = await createDatabase(
  //     req.query.orgId,
  //     req.query.resource
  //   );
  // } else {
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
  // }
  try {
    let campusModel = dbConnectionp.model("campuses", campusSchema);
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
    let count = 0
    let nofeeplanscount = 0
    let studentfeePlans = await feePlanModel.find({ _id: { $in: req.body } });
    let morediscountthaninst = 0
    let zeropaid = 0
    console.log(studentfeePlans.length)
    for (let j = 0; j < studentfeePlans.length; j++) {
      let input2 = studentfeePlans[j]._doc
      let feeplanned = Number(input2.plannedAmount);
      let feePaid = Number(input2.paidAmount);
      let feePlanforty = Number(input2.plannedAmount)* 0.4;
      let feePlansixty = Number(input2.plannedAmount)* 0.6;
      let feeInstdata = await feeInstallmentPlanModel.find({ feePlanId: input2._id });
      if (feeInstdata.length == 3) {
        count++
        if(feeplanned==feePaid){
          let extrapaid = Number(feePaid) - Number(feeInstdata[0]._doc.plannedAmount)
          let extrapaid2 = Number(extrapaid) - Number(feeInstdata[1]._doc.plannedAmount)
          let oldplan = (Number(feeplanned) + Number(input2.discountAmount))
          if (extrapaid > 0) {
            let inst1paid = Number(feeInstdata[0]._doc.plannedAmount);
            let inst2paid = Number(feeInstdata[1]._doc.plannedAmount);
            let inst3paid = Number(feeInstdata[2]._doc.plannedAmount)
            let inst1pending = 0;
            let inst2pending = 0;
            let inst3pending = 0;
            // console.log("3",inst1paid, inst1paid, inst3paid,inst1pending,inst2pending,inst3pending)
            let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[0]._doc._id, }, { $set: { paidAmount: inst1paid, "paidAmountBreakup.0.amount": inst1paid, pendingAmount: inst1pending, "pendingAmountBreakup.0.amount": inst1pending } });
            let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[1]._doc._id, }, { $set: { paidAmount: inst2paid, "paidAmountBreakup.0.amount": inst2paid, pendingAmount: inst2pending, "pendingAmountBreakup.0.amount": inst2pending } });
            let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[2]._doc._id, }, { $set: { paidAmount: inst3paid, "paidAmountBreakup.0.amount": inst3paid, pendingAmount: inst3pending, "pendingAmountBreakup.0.amount": inst3pending } });
        }
      } else if(feePaid<Number(feePlansixty) || feePaid<Number(feePlanforty)){
        console.log("sdfdsf")
        let inst1paid = feePaid
        let inst2paid = 0
        let inst3paid = 0
        let inst1pending = Number(feeInstdata[0]._doc.plannedAmount) - Number(feePaid);
        let inst2pending = Number(feeInstdata[1]._doc.plannedAmount);
        let inst3pending = Number(feeInstdata[2]._doc.plannedAmount);
        // console.log("3",inst1paid, inst1paid, inst3paid,inst1pending,inst2pending,inst3pending)
        let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[0]._doc._id, }, { $set: { paidAmount: inst1paid, "paidAmountBreakup.0.amount": inst1paid, pendingAmount: inst1pending, "pendingAmountBreakup.0.amount": inst1pending } });
        let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[1]._doc._id, }, { $set: { paidAmount: inst2paid, "paidAmountBreakup.0.amount": inst2paid, pendingAmount: inst2pending, "pendingAmountBreakup.0.amount": inst2pending } });
        let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[2]._doc._id, }, { $set: { paidAmount: inst3paid, "paidAmountBreakup.0.amount": inst3paid, pendingAmount: inst3pending, "pendingAmountBreakup.0.amount": inst3pending } });
      }else if(feePaid==Number(feePlansixty)){
        console.log("sdfdsf")
        let inst1paid = Number(feeInstdata[0]._doc.plannedAmount)
        let inst2paid = 0
        let inst3paid = 0
        let inst1pending = 0;
        let inst2pending = Number(feeInstdata[1]._doc.plannedAmount);
        let inst3pending = Number(feeInstdata[2]._doc.plannedAmount);
        // console.log("3",inst1paid, inst1paid, inst3paid,inst1pending,inst2pending,inst3pending)
        let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[0]._doc._id, }, { $set: { paidAmount: inst1paid, "paidAmountBreakup.0.amount": inst1paid, pendingAmount: inst1pending, "pendingAmountBreakup.0.amount": inst1pending } });
        let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[1]._doc._id, }, { $set: { paidAmount: inst2paid, "paidAmountBreakup.0.amount": inst2paid, pendingAmount: inst2pending, "pendingAmountBreakup.0.amount": inst2pending } });
        let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[2]._doc._id, }, { $set: { paidAmount: inst3paid, "paidAmountBreakup.0.amount": inst3paid, pendingAmount: inst3pending, "pendingAmountBreakup.0.amount": inst3pending } });
      }else{
        let extrapaid = Number(feePaid) - Number(feeInstdata[0]._doc.plannedAmount)
        let extrapaid2 = Number(extrapaid) - Number(feeInstdata[1]._doc.plannedAmount)
        let oldplan = (Number(feeplanned) + Number(input2.discountAmount))
        if (extrapaid > 0) {
          let inst1paid = Number(feePaid)>0 ? Number(feeInstdata[0]._doc.plannedAmount) : 0;
          let inst2paid = Number(feeInstdata[1]._doc.paidAmount)>0? Number(feeInstdata[1]._doc.plannedAmount) : 0;
          let inst3paid = extrapaid2>0 ? extrapaid2 : 0
          let inst1pending = Number(feePaid)>= Number(feeInstdata[0]._doc.plannedAmount) ? 0 : Number(feeInstdata[0]._doc.plannedAmount)
          let inst2pending = inst2paid == Number(feeInstdata[0]._doc.plannedAmount) ? 0 : extrapaid>0 && extrapaid < Number(feeInstdata[0]._doc.plannedAmount) && inst2paid !== Number(feeInstdata[0]._doc.plannedAmount) ? Number(feeInstdata[1]._doc.plannedAmount) - extrapaid : Number(feeInstdata[1]._doc.plannedAmount) - inst2paid
          if(inst2pending<0){
            inst2pending = 0
          }
          let inst3pending = Number(feeInstdata[2]._doc.plannedAmount) - extrapaid2
          // console.log("3",inst1paid, inst1paid, inst3paid,inst1pending,inst2pending,inst3pending)
          let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[0]._doc._id, }, { $set: { paidAmount: inst1paid, "paidAmountBreakup.0.amount": inst1paid, pendingAmount: inst1pending, "pendingAmountBreakup.0.amount": inst1pending } });
          let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[1]._doc._id, }, { $set: { paidAmount: inst2paid, "paidAmountBreakup.0.amount": inst2paid, pendingAmount: inst2pending, "pendingAmountBreakup.0.amount": inst2pending } });
          let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[2]._doc._id, }, { $set: { paidAmount: inst3paid, "paidAmountBreakup.0.amount": inst3paid, pendingAmount: inst3pending, "pendingAmountBreakup.0.amount": inst3pending } });
      }
      }
      } else if (feeInstdata.length == 4) {
        nofeeplanscount++
        if(feeplanned==feePaid){
          console.log("full paid")
          let inst1paid = Number(feeInstdata[0]._doc.plannedAmount)
          let inst2paid = Number(feeInstdata[1]._doc.plannedAmount)
          let inst3paid = Number(feeInstdata[2]._doc.plannedAmount)
          let inst4paid = Number(feeInstdata[3]._doc.plannedAmount)
          let inst1pending = 0
          let inst2pending = 0
          let inst3pending = 0
          let inst4pending = 0
          let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[0]._doc._id, }, { $set: { paidAmount: inst1paid, "paidAmountBreakup.0.amount": inst1paid, pendingAmount: inst1pending, "pendingAmountBreakup.0.amount": inst1pending } });
          let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[1]._doc._id, }, { $set: { paidAmount: inst2paid, "paidAmountBreakup.0.amount": inst2paid, pendingAmount: inst2pending, "pendingAmountBreakup.0.amount": inst2pending } });
          let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[2]._doc._id, }, { $set: { paidAmount: inst3paid, "paidAmountBreakup.0.amount": inst3paid, pendingAmount: inst3pending, "pendingAmountBreakup.0.amount": inst3pending } });
          let updatefeePlaninst4 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[3]._doc._id, }, { $set: { paidAmount: inst4paid, "paidAmountBreakup.0.amount": inst4paid, pendingAmount: inst4pending, "pendingAmountBreakup.0.amount": inst4pending } });
        }else if(Number(feePlanforty)>Number(feePaid)){
          console.log(Number(feeInstdata[0]._doc.plannedAmount) > Number(feePaid),input2._id)
          let inst1paid = Number(feePaid)
          let inst2paid = 0
          let inst3paid =0
          let inst4paid = 0
          let inst1pending = Number(feeInstdata[0]._doc.plannedAmount) - Number(feePaid);
          let inst2pending = Number(feeInstdata[1]._doc.plannedAmount)
          let inst3pending = Number(feeInstdata[2]._doc.plannedAmount)
          let inst4pending = Number(feeInstdata[3]._doc.plannedAmount)
          let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[0]._doc._id, }, { $set: { paidAmount: inst1paid, "paidAmountBreakup.0.amount": inst1paid, pendingAmount: inst1pending, "pendingAmountBreakup.0.amount": inst1pending } });
          let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[1]._doc._id, }, { $set: { paidAmount: inst2paid, "paidAmountBreakup.0.amount": inst2paid, pendingAmount: inst2pending, "pendingAmountBreakup.0.amount": inst2pending } });
          let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[2]._doc._id, }, { $set: { paidAmount: inst3paid, "paidAmountBreakup.0.amount": inst3paid, pendingAmount: inst3pending, "pendingAmountBreakup.0.amount": inst3pending } });
          let updatefeePlaninst4 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[3]._doc._id, }, { $set: { paidAmount: inst4paid, "paidAmountBreakup.0.amount": inst4paid, pendingAmount: inst4pending, "pendingAmountBreakup.0.amount": inst4pending } });
        }
        else{
        let oldplannedsixty = (Number(feeplanned) + Number(input2.discountAmount)) * 0.6
        let oldplannedforty = (Number(feeplanned) + Number(input2.discountAmount)) * 0.4
        let extrapaid1 = Number(feePaid) - Number(feeInstdata[0]._doc.plannedAmount)
        let extrapaid2 = Number(extrapaid1) - Number(feeInstdata[1]._doc.plannedAmount)
        let extrapaid3 = Number(extrapaid2) - Number(feeInstdata[2]._doc.plannedAmount)
        let extrapaid4 = Number(extrapaid3) - Number(feeInstdata[3]._doc.plannedAmount)
          let inst1paid = Number(feePaid) > 0 && Number(feePaid) > Number(feeInstdata[0]._doc.plannedAmount) ? Number(feeInstdata[0]._doc.plannedAmount) : 0;
          let inst2paid = extrapaid1 > Number(feeInstdata[1]._doc.plannedAmount) ? Number(feeInstdata[1]._doc.plannedAmount) : extrapaid1>0 && extrapaid1< Number(feeInstdata[1]._doc.plannedAmount) ? extrapaid1 : 0;
          let inst3paid = extrapaid2 > Number(feeInstdata[2]._doc.plannedAmount) ? Number(feeInstdata[2]._doc.plannedAmount) : extrapaid2>0 && extrapaid2< Number(feeInstdata[2]._doc.plannedAmount) ? extrapaid2 : 0;
          let inst4paid = extrapaid3 > 0 ? extrapaid3 : 0
          let inst1pending = inst1paid==Number(feeInstdata[0]._doc.plannedAmount) ? 0 : Number(feeInstdata[0]._doc.plannedAmount)
          let inst2pending = extrapaid1>Number(feeInstdata[1]._doc.plannedAmount) ? 0 :extrapaid1>0 && extrapaid1 < Number(feeInstdata[1]._doc.plannedAmount) ? Number(feeInstdata[1]._doc.plannedAmount) - Number(extrapaid1) : Number(feeInstdata[1]._doc.plannedAmount) - inst2paid 
          let inst3pending = extrapaid2>Number(feeInstdata[2]._doc.plannedAmount) ? 0 :extrapaid2>0 && extrapaid2 < Number(feeInstdata[2]._doc.plannedAmount) ? Number(feeInstdata[2]._doc.plannedAmount) - Number(extrapaid2) : Number(feeInstdata[2]._doc.plannedAmount) - inst3paid
          let inst4pending = extrapaid3>0 ? Number(feeInstdata[3]._doc.plannedAmount) - Number(extrapaid3) : Number(feeInstdata[3]._doc.plannedAmount)
          // console.log("4",inst1paid, inst1paid, inst3paid,inst4paid,inst1pending,inst2pending,inst3pending,inst4pending )
          let updatefeePlaninst1 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[0]._doc._id, }, { $set: { paidAmount: inst1paid, "paidAmountBreakup.0.amount": inst1paid, pendingAmount: inst1pending, "pendingAmountBreakup.0.amount": inst1pending } });
          let updatefeePlaninst2 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[1]._doc._id, }, { $set: { paidAmount: inst2paid, "paidAmountBreakup.0.amount": inst2paid, pendingAmount: inst2pending, "pendingAmountBreakup.0.amount": inst2pending } });
          let updatefeePlaninst3 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[2]._doc._id, }, { $set: { paidAmount: inst3paid, "paidAmountBreakup.0.amount": inst3paid, pendingAmount: inst3pending, "pendingAmountBreakup.0.amount": inst3pending } });
          let updatefeePlaninst4 = await feeInstallmentPlanModel.updateOne({ _id: feeInstdata[3]._doc._id, }, { $set: { paidAmount: inst4paid, "paidAmountBreakup.0.amount": inst4paid, pendingAmount: inst4pending, "pendingAmountBreakup.0.amount": inst4pending } });
        }
      }
      if (j + 1 == studentfeePlans.length) {
        res.send({ message: "all iterations executed", count: count, nofeeplanscount: nofeeplanscount, zeropaid: zeropaid })
        ;
        
      }
    }
  } catch (err) {
    res.json({
      status: "failure",
      message: "discount update: " + err.stack,
    });
  }
  finally {
    ;
    ;
  }

}
module.exports.updateDiscountInstallment = async (req, res) => {
  let input = req.body;
  let keys = ["NCFE CVR", "NCFE CVR PP", "NCFE JBN"];
  let orgId = req.query.orgId;
  let dbConnectionp
  let centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: mongoose.Types.ObjectId(orgId),
  });
  if (process.env.stage == "local") {
    dbConnectionp = await createDatabase(
      req.query.orgId,
      req.query.resource
    );
  } else {
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
  }
  try {
    let campusModel = dbConnectionp.model("campuses", campusSchema);
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
    let count = 0
    let nofeeplanscount = 0
    let studentfeePlans = await feePlanModel.find({ studentRegId: { $in: req.body.regids } });
    // let studentfeePlans = await feePlanModel.find({});

    let morediscountthaninst = 0
    let zeropaid = 0
    let stdplansids = []
    console.log(studentfeePlans.length)
    let mismatch = { regids: [], feeplanid: [] }
    for (let j = 0; j < studentfeePlans.length; j++) {
      let feeinstplan = await feeInstallmentPlanModel.find({ feePlanId: studentfeePlans[j]._doc._id })
      let totalinstpending = 0
      let totalinstpaid = 0
      let totalinstplanned = 0
      let insttotalAmount = studentfeePlans[j]._doc.totalAmount
      let instobj = {}
      // if(feeinstplan.length==3){
      //   for (let i = 0; i < feeinstplan.length; i++) {
      //     totalinstpending = totalinstpending + feeinstplan[i]._doc.pendingAmount
      //     totalinstpaid = totalinstpaid + feeinstplan[i]._doc.paidAmount
      //     totalinstplanned = totalinstplanned + feeinstplan[i]._doc.plannedAmount

      //     Object.assign(instobj, {
      //       [feeinstplan[i].percentage]: {
      //         plannedAmount: feeinstplan[i].plannedAmount,
      //         paidAmount: feeinstplan[i].paidAmount,
      //         pendingAmount: feeinstplan[i].pendingAmount,
      //         label: feeinstplan[i].pendingAmount
      //       }
      //     });

      //   }
      // }else if(feeinstplan.length==4){
      //   for (let i = 0; i < feeinstplan.length; i++) {
      //     totalinstpending = totalinstpending + feeinstplan[i]._doc.pendingAmount
      //     totalinstpaid = totalinstpaid + feeinstplan[i]._doc.paidAmount
      //     totalinstplanned = totalinstplanned + feeinstplan[i]._doc.plannedAmount

      //     Object.assign(instobj, {
      //       [feeinstplan[i].percentage]: {
      //         plannedAmount: feeinstplan[i].plannedAmount,
      //         paidAmount: feeinstplan[i].paidAmount,
      //         pendingAmount: feeinstplan[i].pendingAmount,
      //         label: feeinstplan[i].pendingAmount
      //       }
      //     });

      //   }
      // }
      if (feeinstplan.length == 3) {
        for (let i = 0; i < feeinstplan.length; i++) {
          let percentamount = studentfeePlans[j]._doc.plannedAmount * (Number(feeinstplan[i].percentage) / 100)
          // if(percentamount!=feeinstplan[i]._doc.plannedAmount == studentfeePlans[j]._doc.plannedAmount * (Number(feeinstplan[i].percentage)/100)){
          if (Number(feeinstplan[i]._doc.plannedAmount) == Number(Number(studentfeePlans[j]._doc.plannedAmount) * 0.6)) {
            await feeInstallmentPlanModel.updateOne({ _id: feeinstplan[i]._doc._id }, { $set: { term: 1,label:"Installment001",description:"Installment001",percentage:60 } })
          }
          if (Number(feeinstplan[i]._doc.plannedAmount) <= Number(studentfeePlans[j]._doc.plannedAmount) * 0.2 && Number(feeinstplan[i]._doc.pendingAmount) >= 0) {
            await feeInstallmentPlanModel.updateOne({ _id: feeinstplan[i]._doc._id }, { $set: { term: 2,label:"Installment003",description:"Installment003",percentage:20 } })
          }
          // if (!mismatch.regids.includes(studentfeePlans[j]._doc.studentRegId)) {
            mismatch.regids.push(studentfeePlans[j]._doc.studentRegId)
            mismatch.feeplanid.push(studentfeePlans[j]._doc._id)
          // }
          // }
        }
      } else if (feeinstplan.length == 4) {
        console.log(studentfeePlans[j]._doc.studentRegId)
        for (let i = 0; i < feeinstplan.length; i++) {
          let percentamount = studentfeePlans[j]._doc.plannedAmount * (Number(feeinstplan[i].percentage) / 100)
          // if(percentamount!=feeinstplan[i]._doc.plannedAmount == studentfeePlans[j]._doc.plannedAmount * (Number(feeinstplan[i].percentage)/100)){
            if (Number(feeinstplan[i]._doc.plannedAmount) <= Number(Number(studentfeePlans[j]._doc.plannedAmount) * 0.6) && Number(feeinstplan[i]._doc.plannedAmount) > Number(Number(studentfeePlans[j]._doc.plannedAmount)) * 0.3 ) {
              await feeInstallmentPlanModel.updateOne({ _id: feeinstplan[i]._doc._id }, { $set: { term: 1,label:"Installment001",description:"Installment001",percentage:60 } })
            }
            else if (Number(feeinstplan[i]._doc.plannedAmount) <= Number(studentfeePlans[j]._doc.plannedAmount) * 0.2 && Number(feeinstplan[i]._doc.pendingAmount) >= 0) {
              await feeInstallmentPlanModel.updateOne({ _id: feeinstplan[i]._doc._id }, { $set: { term: 2,label:"Installment003",description:"Installment003",percentage:20 } })
            }else{
              await feeInstallmentPlanModel.updateOne({ _id: feeinstplan[i]._doc._id }, { $set: { term: 2 } })
            }
          // if (!mismatch.regids.includes(studentfeePlans[j]._doc.studentRegId)) {
            mismatch.regids.push(studentfeePlans[j]._doc.studentRegId)
            mismatch.feeplanid.push(studentfeePlans[j]._doc._id)
          // }
          // }
        }
      }
      if (j + 1 == studentfeePlans.length) {
        console.log(mismatch.regids.length)
        res.send(mismatch)
      }
    }
  } catch (err) {
    res.json({
      status: "failure",
      message: "discount update: " + err.stack,
    });
  }
  finally {
    dbConnectionp.close();
    centralDbConnection.close();
  }

}

module.exports.updateDiscountFees = async (req, res) => {
  let input = req.body;
  let keys = ["NCFE CVR", "NCFE CVR PP", "NCFE JBN"];
  let orgId = req.query.orgId;
  let dbConnectionp
  let centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: mongoose.Types.ObjectId(orgId),
  });
  if (process.env.stage == "local") {
    dbConnectionp = await createDatabase(
      req.query.orgId,
      req.query.resource
    );
  } else {
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
  }
  try {
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let feePlanData = await feePlanModel.find({})
    for (let j = 0; j < feePlanData.length; j++) {
      let totamount = !isNaN(Number(feePlanData[j]._doc.discountAmount)) ? Number(feePlanData[j]._doc.plannedAmount)+Number(feePlanData[j]._doc.discountAmount) : Number(feePlanData[j]._doc.plannedAmount)+0
      await feePlanModel.updateOne({_id: feePlanData[j]._doc._id},{$set:{totalAmount:Number(totamount)}})
      if (j + 1 == feePlanData.length) {
        res.send({ message: "all iterations executed" })
      }
    }
  } catch (err) {
    res.json({
      status: "failure",
      message: "discount update: " + err.stack,
    });
  }
  finally {
    dbConnectionp.close();
    centralDbConnection.close();
  }

}

module.exports.testDFCRCRON = async (req, res) => {
try{
//   let sgKey =
//   "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";
// sgMail.setApiKey(sgKey);
//   let msg = {
//     to: "naveen.p@zenqore.com", // Change to your recipient
//     from: "noreply@ncfe.ac.in", // Change to your verified sender
//     subject: "test",
//     html: "sample",
//   };
//   sgMail
//   .send(msg)
//   .then((data) => {
//     console.log(data)
//     res.send({success:"sucess", data:data});
//   })
//   .catch((error) => {
//     console.log(error)
//     res.send({failure: "failure", error:error})
//   });

  processDFCR(req.query.orgId).then(async (studentinitialize) => {
    res.json({
      status: "success",
      message: "DFCR sent: ",
    });
  })
}catch (err) {
  res.json({
    status: "failure",
    message: "DFCR CRON TEST: " + err.stack,
  });
}

}

module.exports.defaulterMailSend = async (req, res) => {
  let dbConnectionp;
  let centralDbConnection;
  try {
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
      _id: mongoose.Types.ObjectId(req.params.id),
    });
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let feeInstallments1 = await feeInstallmentPlanModel.find({});
    let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
    let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
    let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
    let studata = await studentModel.find({});
    const settingsSchema = mongoose.Schema({}, { strict: false });
    const settingsModel = dbConnectionp.model(
      "settings",
      settingsSchema,
      "settings"
    );

    const orgSettings = await settingsModel.find({});
    let orgDetails = orgSettings[0]._doc;
    console.log("email", orgDetails.emailServer[0].emailAddress);
    let remindercount = 0;
    let failurecount = 0;
    let successdata = [];
    let failuredata = [];
    res.send({
      message: "Reminders are sending",
    });
    let studentnames = `<table style="border: 2px solid #000000; border-collapse: collapse"><tr><td style="border: 1px solid #000000; border-collapse: collapse">Name</td><td style="border: 1px solid #000000; border-collapse: collapse">Reg ID</td><td style="border: 1px solid #000000; border-collapse: collapse">Class</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 1 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 2 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Total Amount</td></tr>`;
    for (let i = 0; i < studata.length; i++) {
      let guardianData = await guardianModel.findOne({
        _id: studata[i]._doc.guardianDetails[0],
      });
      let ppdata = await ppmodel.findOne({
        _id: studata[i]._doc.programPlanId,
      });
      let feePlandata = await feePlanModel.findOne({
        studentRegId: studata[i]._doc.regId,
      });
      if (feePlandata) {
        let feeInstallments = await feeInstallmentPlanModel.find({
          feePlanId: feePlandata._doc._id,
        });
        // let email =
        //   guardianData._doc.email == ""
        //     ? studata[i]._doc.email
        //     : guardianData._doc.email;
        let email = "naveen.p@zenqore.com";
        if (
          feeInstallments[0]._doc.status.toLowerCase() == "planned" &&
          feeInstallments[0]._doc.status.toLowerCase() !== "paid" &&
          Number(feeInstallments[0]._doc.totalAmount) > 0 &&
          ppdata &&
          ppdata._doc.academicYear == "2021-22" &&
          Number(studata[i]._doc.status) == 1
        ) {
          studentnames =
            studentnames +
            `<tr style="border: 2px solid #000000; border-collapse: collapse"><td style="border: 1px solid #000000; border-collapse: collapse">${studata[i]._doc.firstName.includes(".")
              ? studata[i]._doc.firstName.replace(".", "")
              : studata[i]._doc.firstName
            } ${studata[i]._doc.lastName.includes(".")
              ? studata[i]._doc.lastName.replace(".", "")
              : studata[i]._doc.lastName
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${studata[i]._doc.regId
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${ppdata._doc.title
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${parseFloat(feeInstallments[0]._doc.plannedAmount.toFixed(2)) +
            parseFloat(feeInstallments[1]._doc.plannedAmount.toFixed(2))
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${parseFloat(feeInstallments[2]._doc.plannedAmount.toFixed(2)) +
            parseFloat(feeInstallments[3]._doc.plannedAmount.toFixed(2))
            }</td><td style="border: 1px solid #000000; border-collapse: collapse">${feeInstallments[0]._doc.totalAmount.toFixed(
              2
            )}</td></tr>`;

          let message = `<div style="display:flex;justify-content:flex-start;text-align:center"><img  title="logo.jpg" alt="" width="148" height="148" text-align="center" src="https://supportings.blob.core.windows.net/zenqore-supportings/ncef.png"/><p style="margin-left:20px">
          </div>
              <br>
              <hr/>
              <br>
              <p><strong>Dear Parent,</strong></p>
              <p><strong>This is a gentle reminder for you to initiate the fee payment of your ward ${studata[i]._doc.firstName.includes(".")
              ? studata[i]._doc.firstName.replace(".", "")
              : studata[i]._doc.firstName
            } ${studata[i]._doc.lastName.includes(".")
              ? studata[i]._doc.lastName.replace(".", "")
              : studata[i]._doc.lastName
            }.</strong></p>
              <p><strong>Please ignore this message if you have already paid.</strong></p>
              <p><strong>If you have applied for loan and you are seeing this reminder, you  may ignore the same. This reminder may have been sent due to a gap of few days between the loan application, payment and reconciliation.</p>
              <p><strong>To pay the fees, please login to our Parent Portal by clicking the following button:</strong></p>
              <p><a href="https://vkgi-parentportal.ken42.com/home" <button class="button button1" style="background-color: #00218d;border: none;
              color: white;
              padding: 15px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              margin: 4px 2px;
              cursor: pointer;font-size: 20px;" >Login</button></a></p>
              <p>Regards,</p>
              <p><strong>NCFE Accounts Team</strong></p>
              <p>&nbsp;</p>`;
          sendEmail(
            orgDetails.emailServer[0].emailServer,
            [email],
            process.env.sendgridEmail,
            "NCFE - Reminder for Fee Payment",
            message,
            [],
            "vkgi"
          )
            .then(async (data) => {
              // successdata.push(data)
              remindercount++;
              if (i + 1 == studata.length) {
                // if (i + 1 == 10) {
                studentnames = studentnames + `</table>`;
                res.send(studentnames);
                await dbConnectionp.close();
                await centralDbConnection.close();
                sendEmail(
                  orgDetails.emailServer[0].emailServer,
                  [
                    "mehul.patel@zenqore.com",
                    "fajo.joy@zenqore.com",
                    "naveen.p@zenqore.com",
                  ],
                  // ["naveen.p@zenqore.com"],
                  "noreply@ncfe.ac.in",
                  `NCFE - Reminder Mail Sent Status ${process.env.stage
                    .toString()
                    .toUpperCase()}-${orgData._doc.nameSpace
                      .toString()
                      .toUpperCase()}`,
                  `<body><p><strong>reminder mail sent to ${remindercount} students. </strong></p>
                    <div>${studentnames}</div>
                    </body>`,
                  [],
                  "vkgi"
                )
                  .then(async (data2) => {
                    console.log({
                      status: "success",
                      message: `reminder mail sent to ${remindercount} students: `,
                      data: data2,
                    });
                    // res.status(200).send({ status: "success", message: `reminder mail sent to ${remindercount} students: `, data: data2, successData: successdata, failureData: failurecount });
                  })
                  .catch((error1) => {
                    console.log("error", error1);
                  });
              }
            })
            .catch((error1) => {
              failurecount++;
              console.log("error", error1);
            });
        } else {
          // if (i + 1 == 10) {
          if (i + 1 == studata.length) {
            await dbConnectionp.close();
            await centralDbConnection.close();
            sendEmail(
              orgDetails.emailServer[0].emailServer,
              [
                "mehul.patel@zenqore.com",
                "fajo.joy@zenqore.com",
                "naveen.p@zenqore.com",
              ],
              // ["naveen.p@zenqore.com"],
              "noreply@ncfe.ac.in",
              `NCFE - Reminder Mail Sent Status ${process.env.stage
                .toString()
                .toUpperCase()}-${orgData._doc.nameSpace
                  .toString()
                  .toUpperCase()}`,
              `<body><p><strong>reminder mail sent to ${remindercount} students </strong></p>
              <div>${studentnames}</div></body>`,
              [],
              "vkgi"
            )
              .then(async (data2) => {
                console.log({
                  status: "success",
                  message: `reminder mail sent to ${remindercount} students: `,
                  data: data2,
                });
                // res.status(200).send({ status: "success", message: `reminder mail sent to ${remindercount} students: `, data: data2 });
              })
              .catch((error) => {
                console.log("error", error);
                var obj = {
                  success: false,
                };
                return obj;
              });
          }
        }
      } else if (!feePlandata || !ppdata) {
        if (!ppdata) {
          console.log("prplan", studata[i]._doc);
        } else {
          console.log("feeplan", studata[i]._doc);
        }
      }
    }
  } catch (err) {
    console.log("err", err.stack);
    res.status(404).send({ status: "failure", message: "defaulter mail details: ", data: err.stack });
  } finally {
  }
};