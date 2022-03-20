const StudentSchema = require("../models/studentModel");
const { createDatabase } = require("../utils/db_creation");
const examFeesUploadSchema = require("../models/examFeesUploadModel");
const examFeesSchema = require("../models/examFeesModel");
const orgListSchema = require("../models/orglists-schema");

const { createDemandNote } = require("./transactions/demand-note");
const {
  processTransaction,
} = require("./transactions/transactionTestController");
const ProgramPlanSchema = require("../models/programPlanModel");
const generalLedgerSchema = require("../models/generalLedgerModel");
const demandNoteSchema = require("../models/demandNoteModel");
const tinyUrl =
  "https://cwpjc8rnb2.execute-api.ap-south-1.amazonaws.com/prod/tiny/shorturl";
const feesLedgerCollectionName = "feesledgers";
const feesLedgerSchema = require("../models/feesLedgerModel");
var nodemailer = require("nodemailer");
const { sendEmail } = require("./emailController");
const transactionSchema = require("../models/transactionsModel");

const {
  demandNoteTemplate,
} = require("../utils/helper_functions/templates/demandNoteFeesTemplate");

// const { all } = require("../../router");
// module.exports.createDemandNote = async (req, res) => {
var _ = require("lodash");
var moment = require("moment");
const csvtojson = require("csvtojson");

const statecodes = require("../helper_jsons/stateCodes");

const mongoose = require("mongoose");
var AWS = require("aws-sdk");
let axios = require("axios");
const PubNub = require("pubnub");
var jsonDiff = require("json-diff");
const fs = require("fs");
var pubnub = new PubNub({
  subscribeKey: "sub-c-982dbaba-1d98-11ea-8c76-2e065dbe5941",
  publishKey: "pub-c-87ae3cc8-8d0a-40e0-8e0f-dbb286306b21",
  secretKey: "sec-c-ODRhYWJjZmYtZGQ0MS00ZjY2LTkzMGMtY2VhNGZhYjYzOWRi",
  ssl: false,
});
//Multer configuration
AWS.config.update({
  region: process.env.region,
  aws_access_key_id: process.env.accessKeyId,
  aws_secret_access_key: process.env.secretAccessKey,
});

const S3 = new AWS.S3({
  region: process.env.region,
  aws_access_key_id: process.env.accessKeyId,
  aws_secret_access_key: process.env.secretAccessKey,
});
module.exports.uploadExamFees = async (req, res) => {
  // console.log(req.headers)
  let dbConnectionp = await createDatabase(
    req.headers.orgId,
    req.headers.resource
  );
  let examFeesUploadModel = dbConnectionp.model(
    "examfeesuploads",
    examFeesUploadSchema
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let examFeesModel = dbConnectionp.model("examfees", examFeesSchema);
  let response = req.file;
  let filedata = JSON.parse(req.file.buffer.toString());
  let input = filedata["Exam Fees"];
  // console.log(input)
  let examFeesUpload = {
    fileName: req.query.filename,
    uploadedFileName: req.file.originalname,
    fileSize: `${req.file.buffer.length * 0.001} KB`,
    totalRecords: input.length,
    data: input,
    version: 1,
  };
  let newexamFeesuploads = new examFeesUploadModel(examFeesUpload);
  await newexamFeesuploads.save();
  let examFeedata = await examFeesModel.find({});
  let count = examFeedata.length;
  let examFeesD = [];
  for (let i = 0; i < input.length; i++) {
    count++;
    let stddata = await studentModel.findOne({ email: input[i]["Email"] });
    let newexamdata = new examFeesModel({
      displayName: `EXAMFEE${
        count.toString().length == 1
          ? "00"
          : count.toString().length == 2
          ? "0"
          : ""
      }${Number(count)}`,
      USN: input[i]["USN"],
      studentName: input[i]["Student Name"],
      studentID: stddata == null ? undefined : stddata._doc._id,
      branchCode: input[i]["Branch Code"],
      semester: input[i]["Semester"],
      email: input[i]["Email"],
      mobile: input[i]["Mobile"],
      examFees: input[i]["Exam Fee"],
      excemption: input[i]["Excemption"],
      miscellaneous: input[i]["Miscellaneous"],
      version: 1,
    });
    examFeesD.push(newexamdata);
    await newexamdata.save();
    if (i == input.length - 1) {
      dbConnectionp.close();
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res
        .status(200)
        .send({
          status: "success",
          Message: "Exam Fees Data Uplaoded Successfully",
          data: examFeesD,
        });
    }
  }
};

module.exports.examFeeDemandNote = async (req, res) => {
  if (req.body[0].examFees == 0) {
    res
      .status(400)
      .json({ success: false, message: "Already paid for this Demand Note" });
    return;
  } else {
    let input = req.body;
    let inputData = req.body;
    let dbConnectionp = await createDatabase(
      req.headers.orgId,
      req.headers.resource
    );
    let examFeesUploadModel = dbConnectionp.model(
      "examfeesuploads",
      examFeesUploadSchema
    );
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let examFeesModel = dbConnectionp.model("examfees", examFeesSchema);
    let programPlanSchema = dbConnectionp.model(
      "programplans",
      ProgramPlanSchema
    );
    const transactionModel = dbConnectionp.model(
      "transactions",
      transactionSchema,
      "transactions"
    );
    const feesLedgersModel = dbConnectionp.model(
      "feesledgers",
      feesLedgerSchema,
      "feesledgers"
    );
    const settingsSchema = mongoose.Schema({}, { strict: false });
    const settingsModel = dbConnectionp.model(
      "settings",
      settingsSchema,
      "settings"
    );
    const orgSettings = await settingsModel.find({});
    const transactionsData = await transactionModel.find({});
    let orgDetails = orgSettings[0]._doc;
    let tcount = transactionsData.length;

    for (let i = 0; i < input.length; i++) {
      tcount++;
      let dispName = `DN_2020-21_${
        tcount.toString().length == 1
          ? "00"
          : tcount.toString().length == 2
          ? "0"
          : ""
      }${Number(tcount)}`;
      let std = await studentModel.findOne({ _id: input[i].studentID });
      let plan = await programPlanSchema.findOne({ _id: std.programPlanId });
      const demandNoteSentData = await feesLedgersModel.findOne({
        studentId: input[i].studentID,
        programPlan: std.programPlanId,
        feeTypeCode: "EXAMFEE001",
      });
      console.log(
        "demandnote sent",
        demandNoteSentData,
        input[i].studentID,
        std.programPlanId
      );
      let transactionData;
      if (demandNoteSentData) {
        transactionData = await transactionModel.findOne({
          displayName: demandNoteSentData.primaryTransaction,
        });
      }
      let tinyUrlPayload;
      let tinyUri;
      if (transactionData) {
        tinyUrlPayload = {
          Url: `${process.env.feeCollectionURL}hkbk/studentExamFeeCollection?orgId=${req.headers.orgId}&demanNote=${transactionData.displayName}&email=${input[i].email}&fullname=${input[i].studentName}&parent=${input[i].mobile}&studentFeeMapId=${input[i].studentFeeMapId}&studentId=${input[i].studentID}&excemption=${input[i].excemption}&miscellaneous=${input[i].miscellaneous}&regId=${input[i].USN}&gatewayType=${orgDetails.paymentGateway.paymentGateway}`,
        };
        tinyUri = await axios.post(tinyUrl, tinyUrlPayload);
      } else {
        tinyUrlPayload = {
          Url: `${process.env.feeCollectionURL}hkbk/studentExamFeeCollection?orgId=${req.headers.orgId}&demanNote=${dispName}&email=${input[i].email}&fullname=${input[i].studentName}&parent=${input[i].mobile}&studentFeeMapId=${input[i].studentFeeMapId}&studentId=${input[i].studentID}&excemption=${input[i].excemption}&miscellaneous=${input[i].miscellaneous}&regId=${input[i].USN}&gatewayType=${orgDetails.paymentGateway.paymentGateway}`,
        };
        tinyUri = await axios.post(tinyUrl, tinyUrlPayload);
      }
      const demandNoteLink = tinyUri.data
        ? tinyUri.data.ShortUrl
        : tinyUrlPayload.Url;
      let totamount = `${
        Number(input[i].excemption) + Number(input[i].miscellaneous)
      }`;
      let payload = {
        displayName: dispName,
        transactionType: "eduFees",
        transactionSubType: "demandNote",
        transactionDate: "2021-04-01T11:43:54.718Z",
        studentId: input[i].studentID,
        demandNoteUrl: tinyUrlPayload.Url,
        studentRegId: std.regId,
        studentName: input[i].studentName,
        class: plan.title,
        semester: input[i]["year/semester"],
        academicYear: plan.academicYear,
        orgId: req.headers.orgId,
        programPlan: std.programPlanId,
        amount: Number(totamount),
        dueDate: "2021-04-01T11:43:54.718Z",
        emailCommunicationRefIds: input[i].email,
        smsCommunicationRefIds: input[i].mobile,
        status: "",
        relatedTransactions: [],
        data: {
          orgId: req.headers.orgId,
          displayName: "",
          studentId: input[i].studentID,
          studentRegId: std.regId,
          class: plan.title,
          academicYear: plan.academicYear,
          issueDate: "",
          dueDate: "",
          feesBreakUp: [
            {
              feeTypeId: "5ff5c0ae761664386c08b4ec",
              feeTypeCode: "EXAMFEE001",
              amount: Number(totamount),
              examFeeamount: input[i].examFees,
              feeType: "Exam Fee",
              excemptionamount: input[i].excemption,
              miscamount: input[i].miscellaneous,
            },
          ],
        },
        createdBy: req.headers.orgId,
        studentFeeMapId: "",
      };
      let emailTemplate = demandNoteTemplate(
        orgDetails,
        [payload],
        demandNoteLink
      );
      let demandNoteData;

      if (!transactionData) {
        demandNoteData = await processTransaction(
          { body: payload },
          dbConnectionp
        );
      }
      let sentMail = await sendEmail(
        orgDetails.emailServer.emailServer,
        input[i].email,
        orgDetails.emailServer.emailAddress,
        `${orgDetails.instituteDetails.instituteName}: Demand Note for Exam Fees`,
        emailTemplate,
        []
      );
      dbConnectionp.close();
      res.status(200).json({ success: true, demandNoteData });
    }
  }
};

module.exports.checkPaymentStatus = async (req, res) => {
  const dbConnectionc = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = dbConnectionc.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  let orgdata = await orgListModel.findOne({ _id: req.query.orgId });
  dbConnectionc.close();
  if (orgdata) {
    // console.log(orgdata)
    let dbConnectionp = await createDatabase(
      req.query.orgId,
      orgdata._doc.connUri
    );
    const transactionModel = dbConnectionp.model(
      "transactions",
      transactionSchema,
      "transactions"
    );
    let transactiond = await transactionModel.findOne({
      displayName: req.query.demandNote,
    });
    console.log("ww", transactiond, req.query.demandNote);
    if (transactiond) {
      console.log("ss", transactiond._doc.status);

      if (transactiond._doc.status.toLowerCase() == "paid") {
        dbConnectionp.close();
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res
          .status(200)
          .send({
            status: "paid",
            Message: "transaction paid",
            data: transactiond,
          });
      } else if (
        transactiond._doc.status.toLowerCase() == "pending" ||
        transactiond._doc.status.toLowerCase() == "partial" ||
        transactiond._doc.status.toLowerCase() == ""
      ) {
        dbConnectionp.close();
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
        res.header(
          "Access-Control-Allow-Headers",
          "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        );
        res
          .status(200)
          .send({
            status: "pending",
            Message: "transaction pending",
            data: transactiond,
          });
      }
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res
        .status(404)
        .send({
          status: "falure",
          Message: "Transaction not found",
          data: transactiond,
        });
    }
  } else {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res
      .status(404)
      .send({
        status: "falure",
        Message: "Organization not found",
        data: null,
      });
  }
};
