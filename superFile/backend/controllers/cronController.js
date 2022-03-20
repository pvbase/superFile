const orgListSchema = require("../models/orglists-schema");
const { createDatabase, createConnection } = require("../utils/db_creation");
const feeplanschema = require("../models/feeplanModel");
const StudentSchema = require("../models/studentModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const sgMail = require("@sendgrid/mail");
const mongoose = require("mongoose");
const GuardianSchema = require("../models/guardianModel");
const ReminderSchema = require("../models/reminderModel");
const transactionCollectionName = "transactions";
const feeLedgerCollectionName = "feesledgers";
// const feeplanschema = require("../models/feeplanModel");
const feeplanInstallmentschema = require("../models/feeplanInstallment");
var moment = require("moment");
const axios = require("axios");
const xlsx = require("xlsx");
var campusSchema = require("../models/campusModel");
const FeeTypeSchema = require("../models/feeTypeModel");
const FeeManagerSchema = require("../models/feesManagerModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
const transactionsSchema = require("../models/transactionsModel");
const ApplicationSchema = require("../models/ken42/applicationModel");
const settingsSchema = require("../models/settings/settings");
const {
  dailyReportTemplate,
} = require("../utils/helper_functions/templates/daily-report-template");
const { sendEmail } = require("./emailController");
const PaymentScheduleSchema = require("../models/paymentScheduleModel");

const PubNub = require("pubnub");
async function createCron(today) {
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
    _id: "5fa8daece3eb1f18d4250e98",
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    let installFeePlan = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    var now = moment().toDate();
    var isodate = new Date().toISOString();
    const installmentData = await installFeePlan.find({});

    installmentData.map(async (data) => {
      var ts = new Date(data.dueDate);
      // var tss = await new Date(ts.replace(/-/g, '\/').replace(/T.+/, ''));
      // console.log(tss.getDate())
    });

    // console.log(isodate)

    return installmentData[0].dueDate;

    for (oneInstallmentPlan of installmentData) {
      var date = moment(oneInstallmentPlan.dueDate)
        .tz("Asia/Calcutta|Asia/Kolkata")
        .format("DD/MM/YYYY");
      // var date = moment(oneInstallmentPlan.dueDate).format("MM/DD/YY");
      console.log("dueDate", date);
      // var now = moment().format("MM/DD/YY");
      // console.log("now", now);
      // const dateIsSame = moment(now).isSame(moment(date));
      // console.log(`Date is Same: ${dateIsSame}`);

      // var comparision = await compare();
      // var date = moment(oneInstallmentPlan.dueDate).format("L");
      // var now = moment().format("L");

      // if (now == date) {
      //   console.log("today");
      //   let sgKey = process.env.sendgridKey;
      //   sgMail.setApiKey(sgKey);
      //   let msg = {
      //     to: "jarayinum18@gmail.com", // Change to your recipient
      //     from: process.env.sendgridEmail, // Change to your verified sender
      //     subject: "Reminder",
      //     html: "<div>muni<div>",
      //   };
      //   sgMail
      //     .send(msg)
      //     .then(() => {
      //       console.log("Sent Email");
      //       var obj = {
      //         success: true,
      //       };
      //       return obj;
      //     })
      //     .catch((error) => {
      //       console.log("error", error);
      //       var obj = {
      //         success: false,
      //       };
      //       return obj;
      //     });
      // } else {
      //   return "not today";
      // }
    }
  }
}

async function reminderCron(orgId) {
  console.log(orgId);
  let dbConnectionp;
  let centralDbConnection;
  try {
    const centralDbConnection = await createDatabase(
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
      _id: mongoose.Types.ObjectId(orgId),
    });
    // console.log(orgData)
    dbConnectionp = await createDatabase(
      orgData._doc._id.toString(),
      orgData._doc.connUri
    );
    let studentModel = dbConnectionp.model("students", StudentSchema);
    let PaymentScheduleModel = dbConnectionp.model("paymentschedules", PaymentScheduleSchema);
    let reminderModel = dbConnectionp.model("reminderplans", ReminderSchema);
    let paymentSchdata = await PaymentScheduleModel.find({});
    let reminderplan = await reminderModel.find({});
    let dates = { "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "fifteenth": 15, "fifteen": 15, "sixteenth": 16, "sixteen": 16, "sixth": 6, "last": 30, "second last": 29, "third last": 28, "twenty four": 24, "twenty five": 25, "fifth last": 26 }
    const monthNames = { "january": "01", "february": "02", "march": "03", "april": "04", "may": "05", "june": "06", "july": "07", "august": "08", "september": "09", "october": "10", "november": "11", "december": "12" };
    let ccdate = new Date()
    let dueDate = new Date(`${ccdate.getFullYear()}/${monthNames[paymentSchdata[0]._doc.scheduleDetails.startMonth.toLowerCase()]}/${isNaN(paymentSchdata[0]._doc.scheduleDetails.dueDate) ? Number(dates[paymentSchdata[0]._doc.scheduleDetails.dueDate.toLowerCase()]) : Number(paymentSchdata[0]._doc.scheduleDetails.dueDate)}`);
    let remschdates = reminderplan[0]._doc.scheduleDetails
    let demandNoteDate = new Date(dueDate)
    demandNoteDate.setDate(demandNoteDate.getDate()-Number(remschdates[0].days))
    let reminderDates = []
    let remDate = new Date(demandNoteDate)
    for(let m=1; m<remschdates.length; m++){
      let mremdate = remDate.setDate(remDate.getDate()+remschdates[m].days)
      let tempDate = new Date(mremdate);
      reminderDates.push(tempDate)
    }

    // let reminderplan = [6, 4, 5, 3]
    let feeInstallmentPlanModel = dbConnectionp.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    // let count = 0
    // let reminderstartdate = 6;
    // for (j = 0; j < reminderplan[0]._doc.otherReminders.length; j++) {

    let cdate = new Date();
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
    let remindercount = 0;
    let failurecount = 0;
    let successdata = [];
    let failuredata = [];
    let studentnames = `<table style="border: 2px solid #000000; border-collapse: collapse"><tr><td style="border: 1px solid #000000; border-collapse: collapse">Name</td><td style="border: 1px solid #000000; border-collapse: collapse">Reg ID</td><td style="border: 1px solid #000000; border-collapse: collapse">Class</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 1 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 2 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Total Amount</td></tr>`;
    for (let i = 0; i < 40; i++) {
      let guardianData = await guardianModel.findOne({
        _id: studata[i]._doc.guardianDetails[0],
      });
      let ppdata = await ppmodel.findOne({
        _id: studata[i]._doc.programPlanId,
      });
      let feePlandata = await feePlanModel.findOne({
        studentRegId: studata[i]._doc.regId,
      });
      let feeInstallments = await feeInstallmentPlanModel.find({
        feePlanId: feePlandata._doc._id,
      });
      // console.log(
      //   {
      //     studentName: `${studata[i]._doc.firstName} ${studata[i]._doc.lastName}`,
      //     studentId: studata[i]._doc.regId,
      //     class: ppdata._doc.title,
      // let email = guardianData._doc.email;
      // let email =
      //   guardianData._doc.email == ""
      //     ? studata[i]._doc.email
      //     : guardianData._doc.email;
      let email = "naveenacharbp@gmail.com";
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
        reminderDates.includes(
          cdate.toString().split(" ").slice(0, 4).join("")
        ) &&
        Number(feeInstallments[0]._doc.totalAmount) > 0 &&
        ppdata._doc.academicYear == "2021-22"
      ) {
        studentnames =
          studentnames +
          `<tr style="border: 2px solid #000000; border-collapse: collapse"><td style="border: 1px solid #000000; border-collapse: collapse">${
            studata[i]._doc.firstName.includes(".")
              ? studata[i]._doc.firstName.replace(".", "")
              : studata[i]._doc.firstName
          } ${
            studata[i]._doc.lastName.includes(".")
              ? studata[i]._doc.lastName.replace(".", "")
              : studata[i]._doc.lastName
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${
            studata[i]._doc.regId
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${
            ppdata._doc.title
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${
            parseFloat(feeInstallments[0]._doc.plannedAmount.toFixed(2)) +
            parseFloat(feeInstallments[1]._doc.plannedAmount.toFixed(2))
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${
            parseFloat(feeInstallments[2]._doc.plannedAmount.toFixed(2)) +
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
            <p><strong>This is a gentle reminder for you to initiate the fee payment of your ward ${
              studata[i]._doc.firstName.includes(".")
                ? studata[i]._doc.firstName.replace(".", "")
                : studata[i]._doc.firstName
            } ${
          studata[i]._doc.lastName.includes(".")
            ? studata[i]._doc.lastName.replace(".", "")
            : studata[i]._doc.lastName
        }.</strong></p>
            <p><strong>Please ignore this message if you have already paid.</strong></p>
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
            successdata.push(data);
            remindercount++;
            // if (i + 1 == studata.length) {
            if (i + 1 == 40) {
              studentnames = studentnames + `</table>`;
              // res.send(studentnames);
              await dbConnectionp.close();
              await centralDbConnection.close();
              sendEmail(
                orgDetails.emailServer[0].emailServer,
                [
                  // "mehul.patel@zenqore.com",
                  // "fajo.joy@zenqore.com",
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
                    successData: successdata,
                    failureData: failurecount,
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
        if (i + 1 == 40) {
          // if (i + 1 == studata.length) {
          await dbConnectionp.close();
          await centralDbConnection.close();
          sendEmail(
            orgDetails.emailServer[0].emailServer,
            ["naveen.p@zenqore.com"],
            // ["mehul.patel@zenqore.com","fajo.joy@zenqore.com"],
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
                successData: successdata,
                failureData: failurecount,
              });
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
    }
  } catch (err) {
    // console.log("err", err)
    // res.status(404).send({ status: "failure", message: "parent details: ", data: err.message });
  } finally {
    // await dbConnectionp.close()
    // await centralDbConnection.close();
  }
}

async function reminderCronJob(req, res) {
  let dbConnectionp;
  let centralDbConnection;
  try {
    const centralDbConnection = await createDatabase(
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
    let studentnames = `<table style="border: 2px solid #000000; border-collapse: collapse"><tr><td style="border: 1px solid #000000; border-collapse: collapse">Name</td><td style="border: 1px solid #000000; border-collapse: collapse">Reg ID</td><td style="border: 1px solid #000000; border-collapse: collapse">Class</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 1 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Term 2 Amount</td><td style="border: 1px solid #000000; border-collapse: collapse">Total Amount</td></tr>`;
    for (let i = 0; i < 40; i++) {
      // for (let i = 0; i < studata.length; i++) {

      let guardianData = await guardianModel.findOne({
        _id: studata[i]._doc.guardianDetails[0],
      });
      let ppdata = await ppmodel.findOne({
        _id: studata[i]._doc.programPlanId,
      });
      let feePlandata = await feePlanModel.findOne({
        studentRegId: studata[i]._doc.regId,
      });
      let feeInstallments = await feeInstallmentPlanModel.find({
        feePlanId: feePlandata._doc._id,
      });
      // console.log(
      //   {
      //     studentName: `${studata[i]._doc.firstName} ${studata[i]._doc.lastName}`,
      //     studentId: studata[i]._doc.regId,
      //     class: ppdata._doc.title,
      // let email = guardianData._doc.email;
      // let email =
      //   guardianData._doc.email == ""
      //     ? studata[i]._doc.email
      //     : guardianData._doc.email;
      let email = "naveenacharbp@gmail.com";
      console.log(email);
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
        ppdata._doc.academicYear == "2021-22"
      ) {
        studentnames =
          studentnames +
          `<tr style="border: 2px solid #000000; border-collapse: collapse"><td style="border: 1px solid #000000; border-collapse: collapse">${
            studata[i]._doc.firstName.includes(".")
              ? studata[i]._doc.firstName.replace(".", "")
              : studata[i]._doc.firstName
          } ${
            studata[i]._doc.lastName.includes(".")
              ? studata[i]._doc.lastName.replace(".", "")
              : studata[i]._doc.lastName
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${
            studata[i]._doc.regId
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${
            ppdata._doc.title
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${
            parseFloat(feeInstallments[0]._doc.plannedAmount.toFixed(2)) +
            parseFloat(feeInstallments[1]._doc.plannedAmount.toFixed(2))
          }</td><td style="border: 1px solid #000000; border-collapse: collapse">${
            parseFloat(feeInstallments[2]._doc.plannedAmount.toFixed(2)) +
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
            <p><strong>This is a gentle reminder for you to initiate the fee payment of your ward ${
              studata[i]._doc.firstName.includes(".")
                ? studata[i]._doc.firstName.replace(".", "")
                : studata[i]._doc.firstName
            } ${
          studata[i]._doc.lastName.includes(".")
            ? studata[i]._doc.lastName.replace(".", "")
            : studata[i]._doc.lastName
        }.</strong></p>
            <p><strong>Please ignore this message if you have already paid.</strong></p>
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
            successdata.push(data);
            remindercount++;
            // if (i + 1 == studata.length) {
            if (i + 1 == 100) {
              studentnames = studentnames + `</table>`;
              res.send(studentnames);
              await dbConnectionp.close();
              await centralDbConnection.close();
              sendEmail(
                orgDetails.emailServer[0].emailServer,
                // [
                //   "mehul.patel@zenqore.com",
                //   "fajo.joy@zenqore.com",
                //   "naveen.p@zenqore.com",
                // ],
                ["naveenacharbp@gmail.com"],
                "noreply@ncfe.ac.in",
                "NCFE - Reminder Mail Sent Status",
                `<body><p><strong>reminder mail sent to ${remindercount} students. </strong></p>
                  <div>${studentnames}</div>
                  </body>`,
                [],
                "vkgi"
              )
                .then(async (data2) => {
                  res.status(200).send({
                    status: "success",
                    message: `reminder mail sent to ${remindercount} students: `,
                    data: data2,
                    successData: successdata,
                    failureData: failurecount,
                  });
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
        if (i + 1 == 100) {
          // if (i + 1 == studata.length) {
          await dbConnectionp.close();
          await centralDbConnection.close();
          sendEmail(
            orgDetails.emailServer[0].emailServer,
            // ["mehul.patel@zenqore.com", "fajo.joy@zenqore.com"],
            ["naveenacharbp@gmail.com"],
            "noreply@ncfe.ac.in",
            "NCFE - Reminder Mail Sent Status",
            `<body><p><strong>reminder mail sent to ${remindercount} students </strong></p>
            <div>${studentnames}</div></body>`,
            [],
            "vkgi"
          )
            .then(async (data2) => {
              res.status(200).send({
                status: "success",
                message: `reminder mail sent to ${remindercount} students: `,
                data: data,
              });
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
    }
  } catch (err) {
    // console.log("err", err)
    // res.status(404).send({ status: "failure", message: "parent details: ", data: err.message });
  } finally {
  }
}

async function compare(dateTimeA, dateTimeB) {
  var momentA = moment(dateTimeA, "DD/MM/YYYY");
  var momentB = moment(dateTimeB, "DD/MM/YYYY");
  if (momentA > momentB) return 1;
  else if (momentA < momentB) return -1;
  else return 0;
}
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

async function onDateFormat(d) {
  let dateField = new Date(String(d));
  let month = dateField.getMonth() + 1;
  month = String(month).length == 1 ? `0${String(month)}` : String(month);
  let date = dateField.getDate();
  date = String(date).length == 1 ? `0${String(date)}` : String(date);
  let year = dateField.getFullYear();
  return `${date}/${month}/${year}`;
}

module.exports = {
  createCron,
  reminderCron,
  reminderCronJob,
};
