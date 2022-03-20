const orgListSchema = require("../../models/orglists-schema");
const { createDatabase } = require("../../utils/db_creation");
const moment = require("moment-timezone");
const PubNub = require("pubnub");
const { processCronJob } = require("../cron/cronJob");
// const { cronConfig } = require("../cron/cronjob_config");

var CronJob = require("cron").CronJob;
const cronConfig = {
  flag: true,
  orgId: "5fa8daece3eb1f18d4250e98", //Change the VKGI orgId if it changes
  orgName: "vkgi",
};
var pubnub = new PubNub({
  subscribeKey: "sub-c-40815e58-bc97-11eb-9c3c-fe487e55b6a4",
  publishKey: "pub-c-2d5b6cbe-9af0-4733-be3e-90aad2cd9485",
  secretKey: "sec-c-ZDQ2OTI0MzAtMDllMS00NTQ2LTg5NmQtMDM4YzU3OTAxZDhj",
  ssl: false,
});
async function vkgiCron() {
  if (process.env.stage == "prod") {
    let orgData = cronConfig;
    startCron();
    async function startCron() {
      console.log("Starting Cron function again");
      let pubnubConfig = {
        channel: `zenqore-${orgData.orgName}`,
        message: {
          description: {
            "Current Time": moment().utcOffset("GMT+0530").toLocaleString(),
            Status: "Initiated",
            env: process.env.stage,
          },
        },
      };
      // Run cronjob every hour from cronjob configuration file
      //try block
      try {
        let item = orgData;
        if (item.flag) {
          let orgId = item.orgId;
          const centralDbConnection = await createDatabase(
            `usermanagement-${process.env.stage}`,
            process.env.central_mongoDbUrl
          );
          const orgListModel = await centralDbConnection.model(
            "orglists",
            orgListSchema,
            "orglists"
          );
          const orgData = await orgListModel.findOne({ _id: orgId });
          if (!orgData || orgData == null) {
            centralDbConnection.close();
            console.log("Organization not found");
            throw {
              message: "Organization not found",
              status: "failure",
            };
          } else {
            var cronSchedule = new CronJob({
              cronTime: "0 0 * * * *",
              onTick: async () => {
                console.log("Running every one hour", orgId);
                processCronJob(orgId, orgData);
                //Send successful notification through PubNub
                pubnubConfig.message.description = {
                  "Cron SpotTime": moment().utcOffset("GMT+0530").toLocaleString(),
                  Status: "Running Spot",
                  orgId: orgId,
                  env: process.env.stage,
                };
                await pubnub.publish(pubnubConfig);
              },
              timeZone: "Asia/Calcutta",
            });
            cronSchedule.start();

            //Send the next 5 timings of cron
            pubnubConfig.message.description = {
              "Is job running? ": cronSchedule.running,
              "Next 5 Timings?": cronSchedule.nextDates(5),
              orgId: orgId,
            };
            await pubnub.publish(pubnubConfig);
          }
        }
      } catch (err) {
        //Throw Errors if any
        pubnubConfig.message.description = {
          Status: "failure",
          error: err,
        };
        console.log(err);
        await pubnub.publish(pubnubConfig);
        startCron();
      }
    }
  }
}

module.exports = { vkgiCron };
