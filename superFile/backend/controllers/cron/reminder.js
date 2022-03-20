const orgListSchema = require("../../models/orglists-schema");
const { createDatabase, createConnection } = require("../../utils/db_creation");
const feeplanschema = require("../../models/feeplanModel");
const StudentSchema = require("../../models/studentModel");
const ProgramPlanSchema = require("../../models/programPlanModel");
const sgMail = require("@sendgrid/mail");
const transactionsSchema = require("../../models/transactionsModel");
const mongoose = require("mongoose");
const GuardianSchema = require("../../models/guardianModel");
const ReminderSchema = require("../../models/reminderModel");
const transactionCollectionName = "transactions";
const feeLedgerCollectionName = "feesledgers";
// const feeplanschema = require("../models/feeplanModel");
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
var moment = require("moment");
const axios = require("axios");
const xlsx = require("xlsx");
var campusSchema = require("../../models/campusModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
// const transactionsSchema = require("../models/transactionsModel");
const ApplicationSchema = require("../../models/ken42/applicationModel");
const settingsSchema = require("../../models/settings/settings");
const { dailyReportTemplate } = require("../../utils/helper_functions/templates/daily-report-template");
const { sendEmail } = require("./../emailController");
const PaymentScheduleSchema = require("../../models/paymentScheduleModel");

// const { processTransaction } = require("../transactions/transactionTestController");
// const { demandNoteTemplate } = require("../../utils/helper_functions/templates/demand-note-email-template");


async function processReminder(orgId) {
    console.log(orgId);
    if(!orgId){
    orgId = "5fa8daece3eb1f18d4250e98"
    }
    let dbConnectionp;
    let centralDbConnection;
    try {
        centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
        // console.log(centralDbConnection)
        const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
        const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
        console.log(orgId)
        if (process.env.stage == "local") {
            dbConnectionp = await createDatabase(orgId, "mongodb://localhost:27017");
        } else {
            dbConnectionp = await createDatabase(orgData._doc._id.toString(), orgData._doc.connUri);
        }
        let studentModel = dbConnectionp.model("students", StudentSchema);
        let PaymentScheduleModel = dbConnectionp.model("paymentschedules", PaymentScheduleSchema);
        let reminderModel = dbConnectionp.model("reminderplans", ReminderSchema);
        // let paymentSchdata = await PaymentScheduleModel.find({});
        let reminderplan = await reminderModel.find({});
        let dates = { "first": 1, "second": 2, "third": 3, "fourth": 4, "fifth": 5, "fifteenth": 15, "fifteen": 15, "sixteenth": 16, "sixteen": 16, "sixth": 6, "last": 30, "second last": 29, "third last": 28, "twenty four": 24, "twenty five": 25, "fifth last": 26 }
        const monthNames = { "january": "01", "february": "02", "march": "03", "april": "04", "may": "05", "june": "06", "july": "07", "august": "08", "september": "09", "october": "10", "november": "11", "december": "12" };
        // let dueDate = new Date(`${ccdate.getFullYear()}/${monthNames[paymentSchdata[0]._doc.scheduleDetails.startMonth.toLowerCase()]}/${isNaN(paymentSchdata[0]._doc.scheduleDetails.dueDate) ? Number(dates[paymentSchdata[0]._doc.scheduleDetails.dueDate.toLowerCase()]) : Number(paymentSchdata[0]._doc.scheduleDetails.dueDate)}`);
        console.log(reminderplan)
        let remschdates = reminderplan[0]._doc.scheduleDetails
        // for (let m = 1; m < remschdates.length; m++) {
        //   let mremdate = remDate.setDate(remDate.getDate() + remschdates[m].days)
        //   let tempDate = new Date(mremdate);
        //   reminderDates.push(tempDate)
        // }

        // let reminderplan = [6, 4, 5, 3]
        let feeInstallmentPlanModel = dbConnectionp.model("studentfeeinstallmentplans", feeplanInstallmentschema);
        // let count = 0
        // let reminderstartdate = 6;
        // for (j = 0; j < reminderplan[0]._doc.otherReminders.length; j++) {
        let ccdate = new Date();
        let cdate = new Date();
        cdate = await onDateFormat(cdate)
        let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
        let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
        let feeMapModel = dbConnectionp.model('studentfeesmaps', StudentFeeMapSchema)
        let guardianModel = dbConnectionp.model("guardians", GuardianSchema);
        let transactionModel = dbConnectionp.model("transactions", transactionsSchema);
        let studata = await studentModel.find({});
        const settingsSchema = mongoose.Schema({}, { strict: false });
        const settingsModel = dbConnectionp.model("settings", settingsSchema, "settings");
        // console.log("reminderDates", reminderDates)
        const orgSettings = await settingsModel.find({});
        let orgDetails = orgSettings[0]._doc;
        let remindercount = 0;
        let failurecount = 0;
        let successdata = [];
        let failuredata = [];
        let studentnames = `<table style="border: 2px solid #000000; border-collapse: collapse"><tr><td style="border: 1px solid #000000; border-collapse: collapse">Name</td><td style="border: 1px solid #000000; border-collapse: collapse">Reg ID</td><td style="border: 1px solid #000000; border-collapse: collapse">Class</td>
        <td style="border: 1px solid #000000; border-collapse: collapse">Installment 1 Amount</td>
        <td style="border: 1px solid #000000; border-collapse: collapse">Installment 2 Amount</td>
        <td style="border: 1px solid #000000; border-collapse: collapse">Installment 3 Amount</td>
        <td style="border: 1px solid #000000; border-collapse: collapse">Installment 4 Amount</td>
        <td style="border: 1px solid #000000; border-collapse: collapse">Total Amount</td></tr>`;
        for (let i = 0; i < studata.length; i++) {
            let guardianData = await guardianModel.findOne({ _id: studata[i]._doc.guardianDetails[0], });
            let ppdata = await ppmodel.findOne({ _id: studata[i]._doc.programPlanId, });
            let feePlandata = await feePlanModel.findOne({ studentRegId: studata[i]._doc.regId, });
            let feeInstallments = await feeInstallmentPlanModel.find({ feePlanId: feePlandata._doc._id, });
            let feeMapData = await feeMapModel.findOne({ studentId: studata[i]._doc._id })

            // let transactionData = await transactionModel.findOne({
            //     studentRegId: studata[i]._doc.regId,
            //     transactionSubType: "demandNote",
            // });

            const aggregateData = [
                { $match: { _id: mongoose.Types.ObjectId(studata[i]._id) } },
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
            let studentAggregate = studentAggregateData[0].guardian ? studentAggregateData[0].guardian[0] : {};

            let email = guardianData._doc.email == "" ? studata[i]._doc.email : guardianData._doc.email;
            // let email = "naveen.p@zenqore.com"
            let paymentLink
            // let demandnoteID = transactionData.displayName
            // let parentMobile = studentAggregate.mobile
            // let studentFeeMapId = feeMapData.displayName
            // let gateway = orgDetails.paymentGateway.paymentGateway

            // paymentLink = `${process.env.dnPaymentLink}?orgId=${orgId}&demanNote=${demandnoteID}&parent=${parentMobile}&studentFeeMapId=${studentFeeMapId}&gatewayType=${gateway}`
            // // let email = "naveen.p@zenqore.com";
            // console.log(orgDetails.logo.logo, "paymentlink", paymentLink)

            for (let j = 0; j < feeInstallments.length; j++) {
                let dueDate = feeInstallments[j]._doc.dueDate;
                let demandNoteDate = new Date(dueDate);
                demandNoteDate.setDate(demandNoteDate.getDate() - Number(remschdates[0].days))
                let reminderDates = []
                let remDate = new Date(demandNoteDate)
                for (let m = 1; m < remschdates.length; m++) {
                    let mremdate = remDate.setDate(remDate.getDate() + remschdates[m].days)
                    let tempDate = new Date(mremdate);
                    tempDate = await onDateFormat(tempDate)
                    reminderDates.push(tempDate);
                }
                // console.log("dueDate", reminderDates, cdate)
                // console.log(feeInstallments[j]._doc.status.toLowerCase() == "planned",
                //     feeInstallments[j]._doc.status.toLowerCase() !== "paid",
                //     reminderDates.includes(cdate),
                //     ppdata._doc.academicYear.includes(ccdate.getFullYear().toString()))
                if (
                    Number(studata[i]._doc.status) >0 && 
                    feeInstallments[j]._doc.status.toLowerCase() == "planned" &&
                    feeInstallments[j]._doc.status.toLowerCase() !== "paid" &&
                    reminderDates.includes(cdate) &&
                    ppdata._doc.academicYear.includes(ccdate.getFullYear().toString())
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
                        }</td><td style="border: 1px solid #000000; border-collapse: collapse">${ppdata._doc.title}
                        </td><td style="border: 1px solid #000000; border-collapse: collapse">${parseFloat(feeInstallments[0]._doc.plannedAmount.toFixed(2))}
                        </td><td style="border: 1px solid #000000; border-collapse: collapse">${parseFloat(feeInstallments[1]._doc.plannedAmount.toFixed(2))}
                        </td><td style="border: 1px solid #000000; border-collapse: collapse">${parseFloat(feeInstallments[2]._doc.plannedAmount.toFixed(2))}
                        </td><td style="border: 1px solid #000000; border-collapse: collapse">${feeInstallments[3] ? parseFloat(feeInstallments[3]._doc.plannedAmount.toFixed(2)) : 0.00}
                        </td><td style="border: 1px solid #000000; border-collapse: collapse">${parseFloat(feePlandata._doc.plannedAmount.toFixed(2))}
                          </td></tr>`;

                    // let message = `<div style="display:flex;justify-content:flex-start;text-align:center"><img  title="logo.png" alt="" width="148" height="148" text-align="center" src=${orgDetails.logo.logo.toString()}/><p style="margin-left:20px">
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
                            successdata.push(data);
                            remindercount++;
                            if (i + 1 == studata.length && j + 1 == feeInstallments.length) {
                                // if (i + 1 == 100) {
                                studentnames = studentnames + `</table>`;
                                // res.send(studentnames);
                                // await dbConnectionp.close();
                                // await centralDbConnection.close();
                                sendEmail(
                                    orgDetails.emailServer[0].emailServer,
                                    // [
                                    //   "mehul.patel@zenqore.com",
                                    //   "fajo.joy@zenqore.com",
                                    //   "naveen.p@zenqore.com",
                                    // ],
                                    ["naveen.p@zenqore.com", "jayanthinathan.c@zenqore.com", "mehul.patel@zenqore.com", "fajo.joy@zenqore.com", "zenqoretester19@gmail.com"],
                                    "noreply@ncfe.ac.in",
                                    "NCFE - Reminder Mail Sent Status",
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
                }
                else {
                    // if (i + 1 == 100) {
                    if (i + 1 == studata.length && j + 1 == feeInstallments.length) {
                        console.log("else condition")
                        // await dbConnectionp.close();
                        // await centralDbConnection.close();
                        sendEmail(
                            orgDetails.emailServer[0].emailServer,
                            // ["mehul.patel@zenqore.com", "fajo.joy@zenqore.com"],
                            ["naveen.p@zenqore.com", "jayanthinathan.c@zenqore.com", "mehul.patel@zenqore.com", "fajo.joy@zenqore.com", "zenqoretester19@gmail.com"],
                            "noreply@ncfe.ac.in",
                            "NCFE - Reminder Mail Sent Status",
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

        }
    } catch (err) {
        console.log("err", err)
        return ({ status: "failure", message: "reminder cron: ", data: err.stack });
    } finally {
        await dbConnectionp.close()
        await centralDbConnection.close();
    }

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
    processReminder: processReminder,
};
