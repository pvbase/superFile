const orgListSchema = require("../../models/orglists-schema");
const { createDatabase, createConnection } = require("../../utils/db_creation");
const feeplanschema = require("../../models/feeplanModel");
const StudentSchema = require("../../models/studentModel");
const ProgramPlanSchema = require("../../models/programPlanModel");
const mongoose = require("mongoose");
const GuardianSchema = require("../../models/guardianModel");
const ReminderSchema = require("../../models/reminderModel");
const transactionCollectionName = "transactions";
const feeLedgerCollectionName = "feesledgers";
const sgMail = require("@sendgrid/mail");

// const feeplanschema = require("../../models/feeplanModel");
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
var moment = require("moment");
const axios = require("axios");
const xlsx = require("xlsx");
var campusSchema = require("../../models/campusModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
var studentInstallmentModel = require("../../models/feeplanInstallment");
var campusModel = require("../../models/campusModel");
var orgSchema = require("../../models/settings/modelorg");
const transactionsSchema = require("../../models/transactionsModel");
const ApplicationSchema = require("../../models/ken42/applicationModel");
const studentConcessionSchema = require("../../models/studentConcessionModel");
const excelToJson = require('convert-excel-to-json');
let sgKey = "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";

sgMail.setApiKey(sgKey);
async function uploadConcessionold(req, res) {
    return new Promise(async function (resolve, reject) {
        let response = req.file;
        if (response == undefined) {
            reject(res.status(400).send({ Message: "Please Upload file" }))
        } else {
            const result = excelToJson({
                source: req.file.buffer,
                sheet: "Concessions"
            });
            // let input = JSON.parse(req.file.buffer.toString());
            let input = result.Concessions
            let dbConnectionp = await createDatabase(req.headers.orgId,
                req.headers.resource
            );
            let studentConcessionModel = await dbConnectionp.model("studentsConcessions", studentConcessionSchema);
            const StudentModel = await dbConnectionp.model("students", StudentSchema);
            let resp = []
            for (i = 1; i < input.length; i++) {
                let student = await StudentModel.findOne({ regId: input[i]["B"] });

                let newconc = new studentConcessionModel({
                    studentRegId: input[i]["B"],
                    studentName: input[i]["C"],
                    class: input[i]["D"],
                    description: input[i]["F"],
                    categoryId: input[i]["E"],
                    concessionType: input[i]["F"],
                    concessionId: null,
                    concessionValueType: input[i]["G"],
                    campusId: student._doc.campusId,
                    concessionValue: input[i]["H"],
                    concessionAmount: input[i]["I"],
                    status: input[i]["J"],
                })
                resp.push(newconc)
                await newconc.save();
                if (i + 1 == input.length) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
                    res.send({ status: "success", message: "concessions added successfully", data: resp })
                }
            }
        }
    })
}
async function uploadConcession(req, res) {
    return new Promise(async function (resolve, reject) {
        if (!req.body) {
            reject(res.status(400).send({ Message: "Please Upload file" }))
        } else {
            // let input = JSON.parse(req.file.buffer.toString());
            let input = req.body
            let dbConnectionp = await createDatabase(req.headers.orgId,
                req.headers.resource
            );
            let studentConcessionModel = await dbConnectionp.model("studentsconcessions", studentConcessionSchema);
            const StudentModel = await dbConnectionp.model("students", StudentSchema);
            const ProgramPlanmodel = await dbConnectionp.model("programplans", ProgramPlanSchema)
            let resp = []
            for (i = 0; i < input.length; i++) {
                let student = await StudentModel.findOne({ regId: input[i]["student registration id"] });
                let ppdata = await ProgramPlanmodel.findOne({ _id: student._doc.programPlanId })
                let condata = await studentConcessionModel.find({ studentRegId: input[i]["student registration id"], concessionType: input[i]["concession type"] })
                if (condata.length == 0) {
                    let newconc = new studentConcessionModel({
                        studentRegId: input[i]["student registration id"],
                        studentName: input[i]["student name"],
                        class: input[i]["class"],
                        academicYear: ppdata._doc.academicYear,
                        description: input[i]["concession type"],
                        categoryId: input[i]["category id"],
                        concessionType: input[i]["concession type"],
                        concessionId: null,
                        concessionValueType: input[i]["concession value type"],
                        campusId: student._doc.campusId,
                        concessionValue: input[i]["concession value"],
                        concessionAmount: input[i]["concession amount"],
                        status: input[i]["status"],
                    })
                    resp.push(newconc)
                    await newconc.save();
                    let email = student._doc.parentEmail == null ? student._doc.email : student._doc.parentEmail == "" ? student._doc.email: student._doc.parentEmail;
                    message = {
                        to: [email], // Change to your recipient
                        from: "noreply@ncfe.ac.in", // Change to your verified sender
                        subject: `NCFE - Fee Concessions`,
                        html: `<div style="display:flex;justify-content:flex-start;text-align:center"><img  title="logo.jpg" alt="" width="148" height="148" src="https://supportings.blob.core.windows.net/zenqore-supportings/ncef.png" style="display: block; margin-left: auto;
                        margin-right: auto;
                        width: 148;" />  
                        </div>
                            <br>
                            <hr/>
                            <br>
                            <p><strong>Dear Parent/Student,</strong></p>
                            <p><strong>This is to inform you that the concession of ₹${Number(input[i]["concession amount"]).toFixed(2)} for the student ${input[i]["student name"]} with ID ${input[i]["student registration id"]} has been approved and applied in the fees system.</strong></p>
                            <p>Regards,</p>
                            <p><strong>NCFE Accounts Team</strong></p>
                            <p>&nbsp;</p>`,
                        attachments: [
                        ],
                    };


                    sgMail
                        .send(message)
                        .then(() => {
                            console.log("Sent Email");
                            var obj = {
                                success: true,
                            };
                        })

                }
                else {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
                    res.send({ status: "failure", message: "concessions already exists", data: input[i] })
                }
                if (i + 1 == input.length) {
                    res.header("Access-Control-Allow-Origin", "*");
                    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
                    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
                    res.send({ status: "success", message: "concessions added successfully", data: resp })
                }
            }
        }
    })
}


async function getConcesionsData(req, res) {
    let dbConnectionp = await createDatabase(req.headers.orgId,
        req.headers.resource
    );
    let studentConcessionModel = await dbConnectionp.model("studentsConcessions", studentConcessionSchema);
    const StudentModel = await dbConnectionp.model("students", StudentSchema);
    const consData = await studentConcessionModel.find({});
    let paginatedData
    if (req.query.limit && req.query.page) {
        paginatedData = await Paginator(consData, req.query.page, req.query.limit)
    } else {
        paginatedData = await Paginator(consData, 1, consData.length)
    }

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.send(paginatedData)
    dbConnectionp.close();
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

module.exports = { uploadConcession, getConcesionsData };

