const StudentSchema = require("../models/studentModel");
const { decryption } = require("./cryptoController");
const { createDatabase } = require("../utils/db_creation");
const masterUploadSchema = require("../models/masterUploadModel");
const settingsSchema = require("../models/settings/feesetting");
const settingsSchemawithversion = require("../models/settings-model");
var _ = require("lodash");
const moment = require('moment-timezone')
const CryptoJS = require('crypto-js');

const csvtojson = require("csvtojson");
const instituteDetailsSchema = require("../models/instituteDetailsModel");
const FeeTypeSchema = require("../models/feeTypeModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const statecodes = require("../helper_jsons/stateCodes");
const FeeManagerSchema = require("../models/feesManagerModel");
const FeeStructureSchema = require("../models/feeStructureModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
const paymentScheduleSchema = require("../models/paymentScheduleModel");
const PaymentScheduleSchema = require("../models/paymentScheduleModel");
const ReminderScheduleSchema = require("../models/reminderModel");
const GuardianSchema = require("../models/guardianModel");
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
let axios = require("axios");
const PubNub = require("pubnub");
var jsonDiff = require("json-diff");
var url = require("url");
const { sendEmail } = require("./emailController");

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

const fs = require("fs");
var pubnub = new PubNub({
    subscribeKey: "sub-c-40815e58-bc97-11eb-9c3c-fe487e55b6a4",
    publishKey: "pub-c-2d5b6cbe-9af0-4733-be3e-90aad2cd9485",
    secretKey: "sec-c-ZDQ2OTI0MzAtMDllMS00NTQ2LTg5NmQtMDM4YzU3OTAxZDhj",
    ssl: false,
});
var multer = require('multer');
const upload = multer().single("file");
// const adjustmentSchema = require("../models/otherFeesModel")

module.exports.examFeesNotification = async (req, res) => {
    let centralDbConnection;
    let orgId = req.body.orgId;
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
    console.log(req.body.orgId);
    let dbConnection = await createDatabase(
        orgData._doc._id.toString(),
        orgData._doc.connUri
    );
    try {
        const settingsSchema = mongoose.Schema({}, { strict: false });
        let studentModel = dbConnection.model("students", StudentSchema);
        let campusModel = dbConnection.model("campuses", settingsSchema, "campuses");
        let count = 0
        const settingsModel = dbConnection.model(
            "settings",
            settingsSchema,
            "settings"
        );
        const orgSettings = await settingsModel.find({});
        let orgDetails = orgSettings[0]._doc;
        for (let i = 0; i < req.body.regIds.length; i++) {
            count++
            let studata = await studentModel.findOne({ regId: req.body.regIds[i] });
            if (studata) {
                let campusdata = await campusModel.findOne({ _id: studata._doc.campusId })
                let comEmail = studata._doc.email
                let firstname = studata._doc.firstName.replace(" ","_");
                let lastname = studata._doc.lastName.replace(" ","_")
                let url = `https://extract-uat-hkbk.zenqore.com/studentExamFeeCollection?orgId=${req.body.orgId}&studentRegId=${studata._doc.regId}&email=${studata._doc.email}&name=${firstname.includes(".")
                ? firstname.replace(".", "_")
                : firstname}_${lastname.includes(".")
                ? lastname.replace(".", "")
                : lastname}&mobile=${studata._doc.phoneNo}&miscellaneous=0&orgName=hkbk`
                console.log(url)
                let message = `<div style="display:flex;justify-content:flex-start;text-align:center"><img  title="logo.jpg" alt="" width="148" height="148" src="https://supportings.blob.core.windows.net/zenqore-supportings/5fd080be1e5c6245ccf50d5aprod.png">
                <p style="margin-left:20px" align="left"><strong>${campusdata._doc.name}</strong>
    <br />${campusdata._doc.legalAddress.address1}${campusdata._doc.legalAddress.address2?campusdata._doc.legalAddress.address2:""}${campusdata._doc.legalAddress.address3?campusdata._doc.legalAddress.address3:""}<br /> ${campusdata._doc.legalAddress.city}-${campusdata._doc.legalAddress.pincode}|${campusdata._doc.legalAddress.state}
    <br />Contact: 090350 22250</p></div>
                <p style="margin-left:20px">
                </div>
                    <br>
                    <hr/>
                    <br>
                    <p><strong>Dear Student,</strong></p>
                    <p><strong>Please click below Pay Now button to complete your Exam fee payment.</strong></p>
                    <p><a href=${url} <button class="button button1" style="background-color: #00218d;border: none;
                    color: white;
                    padding: 15px 32px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    margin: 4px 2px;
                    cursor: pointer;font-size: 20px;" >Pay Now</button></a></p>
                    <p>Regards,</p>
                    <p><strong>HKBK Accounts</strong></p>
                    <p>&nbsp;</p>`;
                sendEmail(
                    orgDetails.emailServer[0].emailServer,
                    comEmail,
                    orgDetails.emailServer[0].emailAddress,
                    "HKBK - Exam fee Payment",
                    message,
                    []
                )
                    .then(async data => {
                        if (i + 1 == req.body.regIds.length) {
                            res.header("Access-Control-Allow-Origin", "*");
                            res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
                            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
                            res.send({ status: "success", message: "Successfully sent mail to all students", data: "data" });
                        }
                    })
                    .catch((err) => {
                        res.status(500).send({
                            status: "failure",
                            message: "failed to send Exam fee email",
                            data: err.stack,
                        });
                    });
            }
            else {
                if (i + 1 == req.body.emails.length) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
                    res.send({ status: "success", message: "Successfully sent mail to all students", data: "data" });
                }
            }
        }

    } catch (err) {
        res.json({
            status: "failure",
            message: "student master creation: " + err.stack,
        });
    }
    finally {
        dbConnection.close();
        centralDbConnection.close();
    }
}
