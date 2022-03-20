const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const settingsSchema = require("../../models/settings/settings");
const moment = require('moment-timezone')

const { processDFCR } = require('../cron/dfcr')
const { processReminder } = require('../cron/reminder')

async function processCronJob(orgId, orgData) {

    let currentTime = moment().utcOffset("GMT+0530").format('ha')
    console.log('Processing time', currentTime)
    switch (currentTime) {
        case '1am':
            processReminder();
            // processDemandNote(orgId);
            break;
        case await dfcrTime(orgId, orgData, 1):
        case await dfcrTime(orgId, orgData, 2):
            console.log('DFCR is processing')
            processDFCR(orgId);
            break;
        default:
            break;
    }
}
async function dfcrTime(orgId, orgData, num) {
    //Based on num get the settings

    let dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);
    let settingsModel = await dbConnection.model("settings", settingsSchema);
    let settingsData = await settingsModel.find({})

    let DFCR = settingsData[0]._doc.dfcr ? settingsData[0]._doc.dfcr : {}
    if (DFCR.timing1.length !== 0 && num == 1) {
        console.log('timing 1', await DFCR.timing1)
        return await DFCR.timing1;
    }
    if (DFCR.timing2.length !== 0 && num == 2) {
        console.log('timing 2', await DFCR.timing2)
        return await DFCR.timing2;
    }
}

module.exports = {
    processCronJob: processCronJob
}