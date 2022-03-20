const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const dbName = "admin"
const msaterCollectionName = "masteruploads"
const StudentSchema = require("../models/studentModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const FeeManagerSchema = require("../models/feesManagerModel");
const FeeStructureSchema = require("../models/feeStructureModel");


const PubNub = require("pubnub");
var pubnub = new PubNub({
    subscribeKey: "sub-c-982dbaba-1d98-11ea-8c76-2e065dbe5941",
    publishKey: "pub-c-87ae3cc8-8d0a-40e0-8e0f-dbb286306b21",
    secretKey: "sec-c-ODRhYWJjZmYtZGQ0MS00ZjY2LTkzMGMtY2VhNGZhYjYzOWRi",
    ssl: false,
});

async function createMasters(req, res) {
    var dbUrl = req.headers.resource
    let inputData = req.body
    let dbConnection = await createDatabase(inputData.orgId, dbUrl);
    const masterDataSchema = mongoose.Schema({}, { strict: false });
    let mesterDataCollection = await dbConnection.model(msaterCollectionName, masterDataSchema, msaterCollectionName);
    let details = await mesterDataCollection.find({})
    var mastersData = details['0']._doc['data']
    var masterKeys = Object.keys(mastersData)
    let pubnubConfig = {
        channel: inputData.orgId.toString(),
        message: {
            description: { "message": "Setup Initiated", data: {} },
            status: 0
        }
    }

    let programPlanSchema = dbConnection.model("programplans", ProgramPlanSchema);
    let feeStructureSchema = dbConnection.model("feestructures", FeeStructureSchema);
    let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
    for (let i = 0; i < masterKeys.length; i++) {
        if (String(masterKeys[i]).toLowerCase().replace(/ /g, '') == "programplans") {
            var allProgramPlan = []
            for (let j = 0; j < mastersData[masterKeys[i]].length; j++) {
                var ppInputData = mastersData[masterKeys[i]][j]
                var ppData = {
                    displayName: `PRGPLN-${String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""}${(Number(j) + 1)}`,
                    programCode: ppInputData['Program Id *'],
                    title: ppInputData['Program Name *'],
                    description: ppInputData['Description '],
                    createdBy: inputData.orgId,
                    status: ppInputData['Status']
                }
                allProgramPlan.push(ppData)
            }
            await programPlanSchema.insertMany(allProgramPlan)
            pubnubConfig.message.description = { "message": `Program Plan has been added successfully.` }
            await pubnub.publish(pubnubConfig)
        }
        if (String(masterKeys[i]).toLowerCase().replace(/ /g, '') == "feemanagers") {
            var allFeeManager = []
            for (let j = 0; j < mastersData[masterKeys[i]].length; j++) {
                var pfmInputData = mastersData[masterKeys[i]][j]
                var ppDetails = await programPlanSchema.findOne({ "programCode": pfmInputData['Program Plan Id *']['0'] })
                var feeStrtDetails = await feeStructureSchema.findOne({ "refId": pfmInputData['Fee Structure Id *']['0'] })
                if (ppDetails != null) {
                    var pfmData = {
                        id: pfmInputData['id *'],
                        displayName: `FEEMNGT-${String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""}${(Number(j) + 1)}`,
                        title: pfmInputData['Title *'],
                        description: pfmInputData['Description'],
                        feeStructureId: feeStrtDetails._id,
                        programPlanId: ppDetails._id,
                        feeDetails: {
                            paymentSchedule: null,
                            reminderPlan: null,
                            lateFeePlan: null,
                            installmentPlan: null,
                            concessionPlan: null,
                            refundPlan: null,
                            units: null,
                            perUnitAmount: null,
                            annualAmount: pfmInputData['Total Fees *'],
                        },
                        createdBy: inputData.orgId
                    }
                    allFeeManager.push(pfmData)
                }
            }
            if (allFeeManager.length > 0) {
                await feeManagerSchema.insertMany(allFeeManager)
            }
            pubnubConfig.message.description = { "message": `Program Plan has been added successfully.` }
            await pubnub.publish(pubnubConfig)

        }
        if (String(masterKeys[i]).toLowerCase().replace(/ /g, '') == "studentdetails") {
            var allStudentData = []
            let studentModel = dbConnection.model("students", StudentSchema);
            for (let j = 0; j < mastersData[masterKeys[i]].length; j++) {
                var studentInputData = mastersData[masterKeys[i]][j]
                var feeManagerDetails = []
                if (studentInputData['FeeManager'] != undefined) {
                    for (let k = 0; k < studentInputData['FeeManager'].length; k++) {
                        console.log('fee manager',studentInputData['FeeManager'][k])
                        var feeMngtDetails = await feeManagerSchema.findOne({ "id": studentInputData['FeeManager'][k] })
                        feeManagerDetails.push(feeMngtDetails._id)
                    }
                }
                var studentData = {
                    displayName: `STUD-${String(j).length == 1 ? "00" : String(j).length == 2 ? "0" : ""}${(Number(j) + 1)}`,
                    regId: studentInputData['Reg No *'],
                    salutation: studentInputData['salutation'] == undefined ? null : studentInputData['salutation'], // salutation
                    category: studentInputData['Category'], // Category
                    firstName: studentInputData['First Name *'], //First Name *
                    middleName: studentInputData['Middle Name *'] == undefined ? null : studentInputData['Middle Name *'], // 
                    lastName: studentInputData['Last Name *'], //Last Name *
                    guardianDetails: [
                        {
                            isPrimary: true,
                            firstName: studentInputData['Parent Name'],
                            lastName: studentInputData['Parent Name'],
                            mobile: studentInputData['Phone Number'],
                            email: studentInputData['Parent Email Address'],
                            relation: "Parent",
                        },
                    ],
                    gender: studentInputData['Gender'],
                    dob: studentInputData['DOB'],
                    admittedOn: studentInputData['Admitted Date *'],
                    classOrBatch: null,
                    feeManager: null,
                    phoneNo: studentInputData['Phone Number *'],
                    email: studentInputData['Email Address *'],
                    alternateEmail: null,
                    createdBy: inputData.orgId,
                    addressDetails: {
                        address1: studentInputData['Address 1'],
                        address2: studentInputData['Address 2'],
                        address3: studentInputData['Address 3'],
                        city: studentInputData['City/Town'],
                        state: null,
                        country: studentInputData['Country'],
                        pincode: studentInputData['PIN Code']
                    }
                }
                allStudentData.push(studentData)
            }
            await studentModel.insertMany(allStudentData)
            pubnubConfig.message.description = { "message": `Student has been added successfully.` }
            await pubnub.publish(pubnubConfig)
        }

    }
    res.status(201).send({
        "status": "success",
        "message": "master has been added successfully.",
        "data": mastersData
    })

}

module.exports = {
    createMasters: createMasters
}