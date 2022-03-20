const generalLedgerSchema = require("../../models/generalLedgerModel");
const demandNoteSchema = require("../../models/demandNoteModel");
const studentSchema = require("../../models/studentModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const feeplanschema = require("../../models/feeplanModel");
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
const ProgramPlanSchema = require("../../models/programPlanModel");
const FeeStructureSchema = require("../../models/feeStructureModel");
const GuardianSchema = require("../../models/guardianModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
var nodemailer = require("nodemailer");
const { sendEmail } = require("../emailController");
const {
  demandNoteTemplate,
} = require("../../utils/helper_functions/templates/demand-note-email-template");
// const orgDetails = require("../../utils/helper_jsons/orgDetails");
const { processTransaction } = require("./transactionTestController");
const transactionSchema = require("../../models/transactionsModel");
const orgListSchema = require("../../models/orglists-schema");
const tinyUrl =
  "https://cwpjc8rnb2.execute-api.ap-south-1.amazonaws.com/prod/tiny/shorturl";
const axios = require("axios");
const feesLedgerCollectionName = "feesledgers";
const feesLedgerSchema = require("../../models/feesLedgerModel");
const { all } = require("../../router");
// const { vkgiTemplate } = require("../../utils/helper_functions/templates/vkgi-demand-note-email-template");
// module.exports.createDemandNote = async (req, res) => {
//     let dbConnection = await createDatabase(req.query.orgId, process.env.profilewise_mongoDbUrl);
//     let demandNotemodel = dbConnection.model("transactions", demandNoteSchema, "transactions");
//     let studentModel = dbConnection.model("students", studentSchema, "students");
//     let guardianModel = dbConnection.model("guardians", GuardianSchema, "guardians");
//     let dmnotes = await demandNotemodel.find({ transactionSubType: "demandNote" })
//     let stddata = await studentModel.findOne({displayName: req.body.displayName})
//     let parentDetails = await guardianModel.findOne({_id:stddata.guardianDetails[0]})
//     let demandNoteId
//     if (dmnotes.length < 10) {
//         demandNoteId = `DN/2020-21/00${dmnotes.length + 1}`
//     } else if (dmnotes.length >= 9 && dmnotes.length < 100) {
//         demandNoteId = `DN/2020-21/00${dmnotes.length + 1}`
//     } else {
//         demandNoteId = `DN/2020-21/00${dmnotes.length + 1}`
//     }
//     let ftypes = []
//     req.body.feeTypes.forEach(function (item) {
//         let ftype = { type: item.title, feeType: item._id, amount: req.body.total }
//         ftypes.push(ftype)
//     })
//     let date = new Date()
//     let newdemandNote = new demandNotemodel({
//         "displayName": demandNoteId,
//         "transactionType": "eduFees",
//         "transactionSubType": "demandNote",
//         "emailCommunicationRefIds": [
//             parentDetails.email
//         ],
//         "smsCommunicationRefIds": [
//             parentDetails.mobile
//         ],
//         "relatedTransactions": [
//         ],
//         transactionDate: date.toISOString(),
//         studentRegId: req.body.displayName,
//         studentName: req.body.studentName,
//         academicYear: "2020-21",
//         class: stddata.class,
//         programPlan: stddata.programPlanId,
//         "amount": req.body.total,
//         "status": "pending",
//         "studentId": stddata._id,
//         "dueDate": "10/12/2020",
//         feesBreakup: ftypes,
//         "pendingAmount": req.body.total
//     })
//     let emailpayload = {
//         "id": demandNoteId,
//         "studentName": req.body.studentName,
//         "email": newdemandNote.emailCommunicationRefIds[0],
//         "feesBreakUp": ftypes,
//         "amount": req.body.total,
//         "class": newdemandNote.class,
//         "regId": newdemandNote.studentRegId,
//         "dueDate": newdemandNote.dueDate,
//     }
//     let parentEmail = parentDetails.email
//     console.log("email payload", emailpayload, process.env.url)
//     let message = await sendDemandNote(emailpayload)
//     newdemandNote.save(async function (err, data) {
//         console.log("err", err, "data", data)
//         if (err) {
//             return res.status(500).send({
//                 message: "Mongoose error",
//                 type: "error",
//                 cause: err.toString(),
//             });
//         } else {
//             console.log("message",message)
//             let subject = `Demand Note Towards ${req.body.studentName}`
//             let attachmentsPaths = ""
//             let provider = "gmail"
//             let emailsend = await sendEmail(provider, "naveen.p@zenqore.com", "ken42.acc@gmail.com", subject, message, attachmentsPaths)
//             console.log("email",emailsend)
//             res.send({ status: "success", message: "Demand Note Generate Successfully", data: newdemandNote })

//         }
//     })
// };

// async function sendDemandNote(inputData) {
//     let collectionUrl =
//         process.env.feeCollectionURL +
//         "feeCollection?parentId=57b40595866ffab90268321e&demandId=" +
//         inputData.id +
//         "&name=" +
//         inputData.studentName;
//     var htmlContent;

//     var feesBreakup = inputData.feesBreakUp;
//     let feebreak = ""
//     feesBreakup.forEach(function(item){
//                 feebreak = feebreak + `<p><b>${item.type}: </b> Rs.
//                 ${item["amount"]}
//                 </p>`
//     })

//     htmlContent =
//         `  ${feebreak}
//                   <h3><b>Total Fees : </b>Rs.` +
//         inputData["amount"] +
//         `</h3>`;
//     var mailOptions =
//             `<html>
//                     <body>
//                     <p style=" font-size: 20px; font-weight:bold">Dear Parent,</p>
//                     <p style="margin-top: -60px; font-size: 10px;">(Demand Note ID: ` +
//             inputData.id +
//             `)</p>
//                     <p>
//                     Your ward ` +
//             inputData.studentName +
//             ` in class ` +
//             inputData.class +
//             ` with roll number: ` +
//             inputData.regId +
//             ` has fees due by ` +
//             inputData.dueDate +
//             `. The details are as follows:
//                     </p>
//                     <h3>Fees Details</h3>
//                     ` +
//             htmlContent +
//             `
//                     <p>
//                     <p><b>Regards,</b></p>
//                     <p><b>EDU Accounts Team</b></p>
//                     <p>
//   Please click the button to initiate the payment:<br><br>
//                     <a href=` +
//             collectionUrl +
//             `> <button class="button button1" style="background-color: #00218d;border: none;
//           color: white;
//           padding: 15px 32px;
//           text-align: center;
//           text-decoration: none;
//           display: inline-block;
//           margin: 4px 2px;
//           cursor: pointer;font-size: 20px;">Pay Now</button></a>
//                     </p>
//   ​

//                     </body>
//                     </html>`
//     return mailOptions
// }

module.exports.createDemandNote = async (req, res) => {
  let inputData = req.body;
  let transactionType = "eduFees";
  let transactionSubType = "demandNote";
  inputData.transactionType = transactionType;
  inputData.transactionSubType = transactionSubType;
  if (!inputData.data.orgId) {
    res
      .status(404)
      .json({ success: false, message: "Invalid Organisation ID" });
    return;
  } else if (inputData.amount == 0) {
    res
      .status(400)
      .json({ success: false, message: "Already paid for this Demand Note" });
    return;
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
      _id: inputData.data.orgId,
    });

    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res
        .status(400)
        .json({ success: false, message: "Organization data not found" });
      return;
    } else {
      let dbConnection = await createDatabase(
        inputData.data.orgId,
        orgData.connUri
      );
      centralDbConnection.close();
      const orgNameSpace = orgData._doc.nameSpace;
      const transactionModel = dbConnection.model(
        "transactions",
        transactionSchema,
        "transactions"
      );
      const feesLedgersModel = dbConnection.model(
        "feesledgers",
        feesLedgerSchema,
        "feesledgers"
      );
      const studentModel = dbConnection.model(
        "students",
        studentSchema,
        "students"
      );
      const demandNoteSentData = await feesLedgersModel.findOne({
        studentId: inputData.studentId,
        programPlan: inputData.programPlan,
      });
      let transactionData;
      if (demandNoteSentData) {
        transactionData = await transactionModel.findOne({
          displayName: demandNoteSentData.primaryTransaction,
        });
      }

      const aggregateData = [
        { $match: { _id: mongoose.Types.ObjectId(inputData.studentId) } },
        {
          $lookup: {
            from: "guardians",
            localField: "guardianDetails",
            foreignField: "_id",
            as: "guardian",
          },
        },
      ];
      let studentAggregateData = await studentModel.aggregate(aggregateData);
      let studentAggregate = studentAggregateData[0].guardian
        ? studentAggregateData[0].guardian[0]
        : {};
      inputData.studentName = `${studentAggregateData[0].firstName} ${studentAggregateData[0].lastName}`;
      if (!inputData.emailCommunicationRefIds)
        inputData.emailCommunicationRefIds = studentAggregate.email;
      if (!inputData.smsCommunicationRefIds)
        inputData.smsCommunicationRefIds = studentAggregate.mobile;
      const findQuery = await transactionModel.find({
        transactionType,
        transactionSubType,
      });
      const nextId = await getNextId(findQuery);
      inputData.displayName = nextId;
      inputData.data.displayName = nextId;
      inputData.transactionDate = new Date().toISOString();
      inputData.data.issueDate = new Date().toISOString();
      inputData.data.parentId = studentAggregate._id;
      inputData.status = "Pending";
      const settingsSchema = mongoose.Schema({}, { strict: false });
      const settingsModel = dbConnection.model(
        "settings",
        settingsSchema,
        "settings"
      );
      const orgSettings = await settingsModel.find({});
      let orgDetails = orgSettings[0]._doc;
      const { emailCommunicationRefIds } = inputData;
      let tinyUri;
      if (transactionData) {
        const tinyUrlPayload2 = {
          Url: `${process.env.feeCollectionURL}${orgNameSpace}/feeCollection?orgId=${inputData.data.orgId}&demanNote=${transactionData.displayName}&parent=${inputData.smsCommunicationRefIds}&studentFeeMapId=${inputData.studentFeeMapId}&gatewayType=${orgDetails.paymentGateway.paymentGateway}`,
        };
        tinyUri = await axios.post(tinyUrl, tinyUrlPayload);
      } else {
        const tinyUrlPayload = {
          Url: `${process.env.feeCollectionURL}${orgNameSpace}/feeCollection?orgId=${inputData.data.orgId}&demanNote=${nextId}&parent=${inputData.smsCommunicationRefIds}&studentFeeMapId=${inputData.studentFeeMapId}&gatewayType=${orgDetails.paymentGateway.paymentGateway}`,
        };
        tinyUri = await axios.post(tinyUrl, tinyUrlPayload);
      }

      const demandNoteLink = tinyUri.data
        ? tinyUri.data.ShortUrl
        : tinyUrlPayload.Url;
      let emailTemplate = demandNoteTemplate(
        orgDetails,
        [inputData],
        demandNoteLink
      );
      if (transactionData) {
        emailTemplate = demandNoteTemplate(
          orgDetails,
          [transactionData],
          demandNoteLink
        );
      }

      if (!transactionData) {
        let demandNoteData = await processTransaction(
          { body: inputData },
          dbConnection
        );
        let sentMail = await sendEmail(
          orgDetails.emailServer[0].emailServer,
          emailCommunicationRefIds,
          orgDetails.emailServer[0].emailAddress,
          "ZQ EDU-Demand Note",
          emailTemplate,
          []
        );
        dbConnection.close();
        res.status(200).json({ success: true, demandNoteData });
        return;
      } else {
        let sentMail = await sendEmail(
          orgDetails.emailServer[0].emailServer,
          emailCommunicationRefIds,
          orgDetails.emailServer[0].emailAddress,
          "ZQ EDU-Demand Note",
          emailTemplate,
          []
        );
        dbConnection.close();
        res
          .status(200)
          .json({ success: true, message: "Demand Note Email Sent" });
        return;
      }
    }
  }
};

module.exports.singleCreateDemandNote = async (inputData) => {
  let transactionType = "eduFees";
  let transactionSubType = "demandNote";
  inputData.transactionType = transactionType;
  inputData.transactionSubType = transactionSubType;
  if (!inputData.data.orgId) {
    let Response = {
      status: "failure",
      message: "Organization not found",
    };
    return Response;
  } else if (inputData.amount == 0) {
    let Response = {
      status: "failure",
      message: "Already paid for this Demand Note",
    };
    return Response;
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
      _id: inputData.data.orgId,
    });

    if (!orgData || orgData == null) {
      centralDbConnection.close();
      let Response = {
        status: "failure",
        message: "Organization data not found",
      };
      return Response;
    } else {
      let dbConnection = await createDatabase(
        inputData.data.orgId,
        orgData.connUri
      );
      centralDbConnection.close();
      const orgNameSpace = orgData._doc.nameSpace;
      const transactionModel = dbConnection.model(
        "transactions",
        transactionSchema,
        "transactions"
      );
      const feesLedgersModel = dbConnection.model(
        "feesledgers",
        feesLedgerSchema,
        "feesledgers"
      );
      const studentModel = dbConnection.model(
        "students",
        studentSchema,
        "students"
      );
      const demandNoteSentData = await feesLedgersModel.findOne({
        studentId: inputData.studentId,
        programPlan: inputData.programPlan,
      });
      let transactionData;
      if (demandNoteSentData) {
        transactionData = await transactionModel.findOne({
          displayName: demandNoteSentData.primaryTransaction,
        });
      }

      const aggregateData = [
        { $match: { _id: mongoose.Types.ObjectId(inputData.studentId) } },
        {
          $lookup: {
            from: "guardians",
            localField: "guardianDetails",
            foreignField: "_id",
            as: "guardian",
          },
        },
      ];
      let studentAggregateData = await studentModel.aggregate(aggregateData);
      let studentAggregate = studentAggregateData[0].guardian
        ? studentAggregateData[0].guardian[0]
        : {};
      inputData.studentName = `${studentAggregateData[0].firstName} ${studentAggregateData[0].lastName}`;
      if (!inputData.emailCommunicationRefIds)
        inputData.emailCommunicationRefIds = studentAggregate.email;
      if (!inputData.smsCommunicationRefIds)
        inputData.smsCommunicationRefIds = studentAggregate.mobile;
      const findQuery = await transactionModel.find({
        transactionType,
        transactionSubType,
      });
      const nextId = await getNextId(findQuery);
      inputData.displayName = nextId;
      inputData.data.displayName = nextId;
      inputData.transactionDate = new Date().toISOString();
      inputData.data.issueDate = new Date().toISOString();
      inputData.data.parentId = studentAggregate._id;
      inputData.status = "Pending";
      const settingsSchema = mongoose.Schema({}, { strict: false });
      const settingsModel = dbConnection.model(
        "settings",
        settingsSchema,
        "settings"
      );
      const orgSettings = await settingsModel.find({});
      let orgDetails = orgSettings[0]._doc;
      const { emailCommunicationRefIds } = inputData;
      let tinyUri;
      if (transactionData) {
        const tinyUrlPayload = {
          Url: `${process.env.feeCollectionURL}${orgNameSpace}/feeCollection?orgId=${inputData.data.orgId}&demanNote=${transactionData.displayName}&parent=${inputData.smsCommunicationRefIds}&studentFeeMapId=${inputData.studentFeeMapId}`,
        };
        tinyUri = await axios.post(tinyUrl, tinyUrlPayload);
      } else {
        const tinyUrlPayload = {
          Url: `${process.env.feeCollectionURL}${orgNameSpace}/feeCollection?orgId=${inputData.data.orgId}&demanNote=${nextId}&parent=${inputData.smsCommunicationRefIds}&studentFeeMapId=${inputData.studentFeeMapId}`,
        };
        tinyUri = await axios.post(tinyUrl, tinyUrlPayload);
      }

      const demandNoteLink = tinyUri.data
        ? tinyUri.data.ShortUrl
        : tinyUrlPayload.Url;
      let emailTemplate = demandNoteTemplate(
        orgDetails,
        [inputData],
        demandNoteLink
      );
      if (transactionData) {
        emailTemplate = demandNoteTemplate(
          orgDetails,
          [transactionData],
          demandNoteLink
        );
      }

      if (!transactionData) {
        let demandNoteData = await processTransaction(
          { body: inputData },
          dbConnection
        );
        let sentMail = await sendEmail(
          orgDetails.emailServer[0].emailServer,
          emailCommunicationRefIds,
          orgDetails.emailServer[0].emailAddress,
          "ZQ EDU-Demand Note",
          emailTemplate,
          []
        );
        dbConnection.close();
        let Response = { success: true, type: "ledger", demandNoteData };
        return Response;
      } else {
        let sentMail = await sendEmail(
          orgDetails.emailServer[0].emailServer,
          emailCommunicationRefIds,
          orgDetails.emailServer[0].emailAddress,
          "ZQ EDU-Demand Note",
          emailTemplate,
          []
        );
        dbConnection.close();

        let Response = { success: true, message: "Demand Note Email Sent" };
        return Response;
      }
    }
  }

  // if (allRes[0].type === "ledger") {
  //   res.status(200).json({
  //     status: "success",
  //     message: allRes.length + " ledger entries added",
  //   });
  // } else if (allRes[0].success === true) {
  //   res.status(200).json({
  //     status: "success",
  //     message: allRes[0].message,
  //   });
  // } else {
  //   res.status(400).json({
  //     status: "failed",
  //     Error: allRes,
  //   });
  // }

  // if (successMsg[0]) {
  //   res.status(201).send(successMsg);
  // } else {
  //   res.status(400).send(failedMsg);
  // }
};

module.exports.multipleDemandNote = async (req, res) => {
  let transactionType = "eduFees";
  let transactionSubType = "demandNote";
  let inputData = req.body;
  var allRes = [];

  for (singleDemand of inputData) {
    singleDemand.transactionType = transactionType;
    singleDemand.transactionSubType = transactionSubType;
    var Response;
    if (!singleDemand.data.orgId) {
      Response = {
        status: "failure",
        message: "Organization not found",
      };
    } else if (singleDemand.amount == 0) {
      Response = {
        status: "failure",
        message: "Already paid for this Demand Note",
      };
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
        _id: singleDemand.data.orgId,
      });

      if (!orgData || orgData == null) {
        centralDbConnection.close();
        Response = {
          status: "failure",
          message: "Organization data not found",
        };
      } else {
        let dbConnection = await createDatabase(
          singleDemand.data.orgId,
          orgData.connUri
        );
        centralDbConnection.close();
        const orgNameSpace = orgData._doc.nameSpace;
        const transactionModel = dbConnection.model(
          "transactions",
          transactionSchema,
          "transactions"
        );
        const feesLedgersModel = dbConnection.model(
          "feesledgers",
          feesLedgerSchema,
          "feesledgers"
        );
        const studentModel = dbConnection.model(
          "students",
          studentSchema,
          "students"
        );
        let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
        let feePlanData = await feePlanModel.findOne({
          studentRegId: singleDemand.studentRegId,
        });
        let transactionData = await transactionModel.findOne({
          studentRegId: singleDemand.studentRegId,
          transactionSubType: "demandNote",
        });

        const aggregateData = [
          { $match: { _id: mongoose.Types.ObjectId(singleDemand.studentId) } },
          {
            $lookup: {
              from: "guardians",
              localField: "guardianDetails",
              foreignField: "_id",
              as: "guardian",
            },
          },
        ];
        let studentAggregateData = await studentModel.aggregate(aggregateData);
        let studentAggregate = studentAggregateData[0].guardian
          ? studentAggregateData[0].guardian[0]
          : {};
        singleDemand.studentName = `${studentAggregateData[0].firstName} ${studentAggregateData[0].lastName}`;
        if (!singleDemand.emailCommunicationRefIds)
          singleDemand.emailCommunicationRefIds = studentAggregate.email;
        if (!singleDemand.smsCommunicationRefIds)
          singleDemand.smsCommunicationRefIds = studentAggregate.mobile;
        const findQuery = await transactionModel.find({
          transactionType,
          transactionSubType,
        });
        const nextId = await getNextId(findQuery);
        singleDemand.displayName = nextId;
        singleDemand.data.displayName = nextId;
        singleDemand.transactionDate = new Date().toISOString();
        singleDemand.data.issueDate = new Date().toISOString();
        singleDemand.data.parentId = studentAggregate._id;
        singleDemand.status = "Pending";

        const settingsSchema = mongoose.Schema({}, { strict: false });
        const settingsModel = dbConnection.model(
          "settings",
          settingsSchema,
          "settings"
        );

        const orgSettings = await settingsModel.find({});
        let orgDetails = orgSettings[0]._doc;
        const { emailCommunicationRefIds } = singleDemand;
        console.log("gatewayty", orgDetails.paymentGateway.paymentGateway);
        let tinyUri;
        if (transactionData) {
          const tinyUrlPayload = {
            Url: `${process.env.feeCollectionURL}${orgNameSpace}/feeCollection?orgId=${singleDemand.data.orgId}&demanNote=${transactionData.displayName}&parent=${singleDemand.smsCommunicationRefIds}&studentFeeMapId=${singleDemand.studentFeeMapId}&gatewayType=${orgDetails.paymentGateway.paymentGateway}`,
          };
          tinyUri = tinyUrlPayload.Url;
        } else {
          const tinyUrlPayload = {
            Url: `${process.env.feeCollectionURL}${orgNameSpace}/feeCollection?orgId=${singleDemand.data.orgId}&demanNote=${nextId}&parent=${singleDemand.smsCommunicationRefIds}&studentFeeMapId=${singleDemand.studentFeeMapId}&gatewayType=${orgDetails.paymentGateway.paymentGateway}`,
          };
          tinyUri = tinyUrlPayload.Url;
        }

        const demandNoteLink = tinyUri;
        console.log("link", demandNoteLink);
        let emailTemplate = demandNoteTemplate(
          orgDetails,
          [singleDemand],
          demandNoteLink,
          "",
          feePlanData.paidAmount,
          orgNameSpace
        );
        if (transactionData) {
          emailTemplate = demandNoteTemplate(
            orgDetails,
            [transactionData],
            demandNoteLink,
            "",
            feePlanData.paidAmount,
            orgNameSpace
          );
        }

        if (!transactionData) {
          let demandNoteData = await processTransaction(
            { body: singleDemand },
            dbConnection
          );
          let sentMail = await sendEmail(
            orgDetails.emailServer[0].emailServer,
            emailCommunicationRefIds,
            orgDetails.emailServer[0].emailAddress,
            "ZQ EDU-Demand Note",
            emailTemplate,
            []
          );
          dbConnection.close();
          Response = { success: true, type: "ledger", demandNoteData };
        } else {
          let sentMail = await sendEmail(
            orgDetails.emailServer[0].emailServer,
            emailCommunicationRefIds,
            orgDetails.emailServer[0].emailAddress,
            "ZQ EDU-Demand Note",
            emailTemplate,
            []
          );
          dbConnection.close();
          Response = { success: true, message: "Demand Note Email Sent" };
          // commonPostNotification(
          //   `${singleDemand.data.orgId}`,
          //   "success",
          //   "transaction_demandNote",
          //   `Demand note send successfully for the student ${studentAggregateData[0].firstName} ${studentAggregateData[0].lastName}`
          // );
        }
      }
    }
    allRes.push(Response);
  }

  if (allRes[0].type === "ledger") {
    res.status(200).json({
      status: "success",
      message: allRes.length + " ledger entries added",
    });
  } else if (allRes[0].success === true) {
    res.status(200).json({
      status: "success",
      message: allRes[0].message,
    });
  } else {
    res.status(400).json({
      status: "failed",
      Error: allRes,
    });
  }

  // if (successMsg[0]) {
  //   res.status(201).send(successMsg);
  // } else {
  //   res.status(400).send(failedMsg);
  // }
};
module.exports.getDemandNoteDetails = async (req, res) => {
  const { orgId, demandNote } = req.query;
  if (!orgId || !demandNote) {
    res.status(500).send({
      status: "failure",
      message: "Please provide valid details",
    });
    return;
  }
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({ _id: orgId });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  }
  centralDbConnection.close();
  let dbConnection = await createDatabase(orgId, orgData.connUri);
  const transactionModel = dbConnection.model(
    "transactions",
    transactionSchema,
    "transactions"
  );
  const studentModel = dbConnection.model(
    "students",
    studentSchema,
    "students"
  );
  let feePlanModel = dbConnection.model("studentfeeplans", feeplanschema);
  let guardianModel = dbConnection.model(
    "guardians",
    GuardianSchema,
    "guardians"
  );
  transactionModel
    .findOne({ displayName: demandNote })
    .then(async (demandNoteData) => {
      console.log("demand", demandNoteData);
      let studentDetails = await studentModel.findOne({
        rollNumber: demandNoteData.studentRegId,
      });
      let feePlanData = await feePlanModel.findOne({
        studentRegId: demandNoteData.studentRegId,
      });
      let guardianDetails = await guardianModel.findOne({
        _id: studentDetails.guardianDetails[0],
      });
      res.send({
        demandNoteDetails: demandNoteData,
        studentDetails: studentDetails,
        totalAmount: feePlanData.plannedAmount,
        amountToBePaid: feePlanData.pendingAmount,
        paidAmount: feePlanData.paidAmount,
        guardianDetails: guardianDetails,
      });
    })
    .catch((err) => {
      res.status(500).send({
        status: "failure",
        message: "failed to get demand note",
        data: err,
      });
    })
    .finally((res) => {
      dbConnection.close();
    });
};

module.exports.getDemandById = async (req, res) => {
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
  var stuId = req.params.id;
  let studentModel = dbConnection.model("students", studentSchema);
  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  let feeStructureModel = dbConnection.model(
    "feestructures",
    FeeStructureSchema
  );
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
  let guardianModel = dbConnection.model("guardian", GuardianSchema);
  let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);

  var stuFeeDetails = await studentModel.findOne({
    regId: { $regex: new RegExp(stuId, "i") },
  });
  if (!stuFeeDetails) {
    res
      .status(404)
      .json({ status: "failed", message: "Invalid Student Reg ID" });
  } else {
    let feePlanData = await feePlanModel.findOne({
      studentRegId: stuFeeDetails.regId,
    });

    var feeMapdetails = await feeMapModel.findOne({
      studentId: stuFeeDetails._id,
    });
    if (!feePlanData) {
      res
        .status(404)
        .json({ status: "failed", message: "Invalid Student Fees Plan" });
    } else {
      let programPlanData = await programPlanModel.findOne({
        _id: stuFeeDetails.programPlanId,
      });
      if (!programPlanData) {
        res
          .status(404)
          .json({ status: "failed", message: "Invalid ProgramPlan" });
      } else {
        let guardianData = await guardianModel.findOne({
          _id: stuFeeDetails.guardianDetails[0],
        });
        if (!guardianData) {
          res
            .status(404)
            .json({ status: "failed", message: "Invalid Guardian" });
        } else {
          let feesStructureData = await feeStructureModel.findOne({
            _id: stuFeeDetails.feeStructureId,
          });
          if (!feesStructureData) {
            res
              .status(404)
              .json({ status: "failed", message: "Invalid Fees Structure" });
          } else {
            let allFeetypes = [];
            let allFeesTy = feesStructureData.feeTypeIds;
            for (oneFeeType of allFeesTy) {
              let feeT = await feeTypeModel.findOne({
                _id: oneFeeType,
              });
              allFeetypes.push(feeT);
            }

            let response = {
              displayName: feeMapdetails.displayName,
              studentId: stuFeeDetails._id,
              programPlanDetails: programPlanData,
              dueDate: feeMapdetails.dueDate,
              studentDetails: stuFeeDetails,
              guardianDetails: [guardianData],
              studentName:
                stuFeeDetails.firstName + " " + stuFeeDetails.lastName,
              feeStructureId: feesStructureData.displayName,
              feeStructure: feesStructureData.title,
              feeStructureDescription: feesStructureData.description,
              feeDetails: allFeetypes,
              totalAmount: feePlanData.plannedAmount,
              paidAmount: feePlanData.paidAmount,
              pendingAmount: feePlanData.pendingAmount,
              createdBy: stuFeeDetails.createdBy,
              createdAt: feeMapdetails.createdAt,
            };
            res.status(200).json({ success: true, data: response });
          }
        }
      }
    }
  }
};

async function getNextId(result) {
  let txnData = {
    transactionType: "eduFees",
    transactionSubType: "demandNote",
    transactionPattern: {
      txnCode: "DN",
      txnCodePeriodSeparator: "_",
      period: "YYYY-YY",
      periodDigitSeparator: "_",
      noOfDigits: 3,
    },
  };
  const {
    transactionType,
    transactionSubType,
    transactionPattern: {
      txnCode,
      txnCodePeriodSeparator,
      period,
      periodDigitSeparator,
      noOfDigits,
    },
  } = txnData;
  const type = txnCode;
  var date = new Date();
  let financialYear = getDates(period, date);
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
  let initial = `${type}${txnCodePeriodSeparator}${financialYear}${periodDigitSeparator}${padLeft(
    1,
    noOfDigits
  )}`;
  let dataArr = [];
  let check;
  let finalVal;
  const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
  let regexVariable =
    txnCodePeriodSeparator === periodDigitSeparator
      ? txnCodePeriodSeparator
      : `${txnCodePeriodSeparator}${periodDigitSeparator}`;
  let regex = new RegExp(regexVariable);
  if (!result || !result.length) {
    return initial;
  } else {
    result.forEach((el) => {
      if (el["displayName"]) {
        let filStr = el["displayName"].split(regex);
        let typeStr = filStr[0];
        let typeYear = filStr[1];
        if (typeStr === type && typeYear == financialYear) {
          check = true;
          dataArr.push(el["displayName"]);
        }
      }
    });
    if (!check) {
      const perviousPattern = await getPatternFromChangeHistory();
      return initial;
    }
    let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split(regex);
    let lastCountNo = Number(lastCount[2]) + 1;
    lastCountNo = padLeft(lastCountNo, noOfDigits);
    lastCount[2] = lastCountNo;
    finalVal = `${type}${txnCodePeriodSeparator}${financialYear}${periodDigitSeparator}${lastCount[2]}`;
    return finalVal;
  }
}
function getDates(dateFormat, date) {
  let parsedDate;
  const dateFormats = [
    "YYYY-YY",
    "YY-YY",
    "YYYY",
    "YY",
    "MM-YY",
    "Mmm-YY",
    "ddmmyyyy",
    "ddmmyy",
    "ddMmmyyyy",
  ];
  var mL = [
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
  var mS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];
  switch (dateFormat) {
    case dateFormats[0]:
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
      parsedDate = finYear;
      break;
    case dateFormats[1]:
      var date = new Date();
      var month = date.getMonth();
      var finYear = "";
      if (month > 2) {
        var current = date.getFullYear();
        current = String(current).substr(String(current).length - 2);
        var prev = Number(date.getFullYear()) + 1;
        prev = String(prev).substr(String(prev).length - 2);
        finYear = `${current}-${prev}`;
      } else {
        var current = date.getFullYear();
        current = String(current).substr(String(current).length - 2);
        var prev = Number(date.getFullYear()) - 1;
        prev = String(prev).substr(String(prev).length - 2);
        finYear = `${prev}-${current}`;
      }
      parsedDate = finYear;
      break;
    case dateFormats[2]:
      var date = new Date();
      var current = date.getFullYear();
      parsedDate = current;
      break;
    case dateFormats[3]:
      var date = new Date();
      var current = date.getFullYear();
      current = String(current).substr(String(current).length - 2);
      parsedDate = current;
      break;
    case dateFormats[4]:
      var date = new Date();
      var current = date.getFullYear();
      current = String(current).substr(String(current).length - 2);
      var month = date.getMonth() + 1;
      month = month < 10 ? `0${month}` : month;
      parsedDate = `${month}-${current}`;
      break;
    case dateFormats[5]:
      var date = new Date();
      var current = date.getFullYear();
      current = String(current).substr(String(current).length - 2);
      var month = date.getMonth();
      month = mS[month];
      parsedDate = `${month}-${current}`;
      break;
    case dateFormats[6]:
      var date = new Date();
      var current = date.getFullYear();
      var month = date.getMonth() + 1;
      month = month < 10 ? `0${month}` : month;
      parsedDate = `${date.getDate()}${month}${current}`;
      break;
    case dateFormats[7]:
      var date = new Date();
      var current = date.getFullYear();
      current = String(current).substr(String(current).length - 2);
      var month = date.getMonth() + 1;
      month = month < 10 ? `0${month}` : month;
      parsedDate = `${date.getDate()}${month}${current}`;
      break;
    case dateFormats[8]:
      var date = new Date();
      var current = date.getFullYear();
      var month = date.getMonth();
      month = mS[month];
      parsedDate = `${date.getDate()}${month}${current}`;
      break;
  }
  return parsedDate;
}
function padLeft(nr, n, str) {
  return Array(n - String(nr).length + 1).join(str || "0") + nr;
}
async function getPatternFromChangeHistory(connection) {}
