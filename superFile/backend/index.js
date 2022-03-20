const express = require("express");
require("dotenv-flow").config();
const bodyParser = require("body-parser");
const cron = require("node-cron");
const serverless = require("serverless-http");
const options = {
  explorer: false,
  // customCss: '.topbar { display: none }',
  // customSiteTitle: 'Test API'
  // customfavIcon:''
};
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger/swagger.json");
const app = express();
const cors = require("cors");
const router = require("./router");
const masterRouter = require("./master-router");
const configRouter = require("./configRouter");
const setuproute = require("./settingsrouter");
const jwtMiddleWare = require("./jwt-middleware");
const { checkResource } = require("./resources/check-resource");
const fs = require("fs");
const https = require("https");
// const { DRFC_Cronjob, reminderCron } = require("./controllers/cronController");
// const { reminder } = require("./controllers/cron/cronJob");

const { createDatabase, createConnection } = require("./utils/db_creation");
const orgListSchema = require("./models/orglists-schema");
const settingsSchema = require("./models/settings/settings");

// Middleware for body parsing
const parseUrl = express.urlencoded({ extended: false });
const parseJson = express.urlencoded({ extended: false });
const moment = require('moment');
app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb", extended: true }));
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, options)
);
const { vkgiCron } = require("./controllers/cronOrgs/vkgi");

const unauthorizedFailureStatus = {
  status: "failure",
  message: "Unauthorized",
};
app.get("/", (req, res) => {
  res.send({
    response: "server is working",
    env: process.env.central_mongoDbUrl,
  });
});
app.use(async (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,x-auth-token,authorization, X-Requested-With, Content-Type, Accept"
  );
  // next();
  // return
  const authHeader = req.headers.authorization;
  console.log(req.originalUrl, "original url");
  if (
    req.originalUrl === "/edu/webhook" ||
    req.originalUrl === "/edu/whatsapp" ||
    req.originalUrl === "/edu/messageSent" ||
    req.originalUrl === "/edu/demandNote" ||
    req.originalUrl === "/edu/receiptSend" ||
    req.originalUrl.includes("/edu/sendDFCR") ||
    // req.originalUrl.includes('/edu/getDashboardImg') ||
    req.originalUrl.includes("/edu/createApplication") ||
    req.originalUrl.includes("/edu/sendReceipt?institute=") ||
    req.originalUrl.includes("/edu/getPaymentStatus") ||
    req.originalUrl.includes("/edu/pendingFees") ||
    req.originalUrl.includes("/edu/paymentHistory") ||
    req.originalUrl.includes("/config/institute") ||
    req.originalUrl.includes("/edu/makePayment") ||
    req.originalUrl.includes("/edu/statementEntry") ||
    req.originalUrl.includes("/edu/bankStatement") ||
    req.originalUrl.includes("/edu/feepayment") ||
    req.originalUrl.includes("/edu/callback") ||
    req.originalUrl.includes("/edu/getTransactionStatus") ||
    req.originalUrl.includes("/edu/feePaymentWithReceipt") ||
    req.originalUrl.includes("/edu/paynow") ||
    req.originalUrl.includes("/edu/tasks") ||
    req.originalUrl.includes("/edu/transactions/getStudentStatus") ||
    req.originalUrl.includes("/edu/getStudentFee") ||
    req.originalUrl.includes("/edu/addPayment") ||
    req.originalUrl.includes("/edu/scholarshipDetails") ||
    req.originalUrl.includes("/edu/createPdf") ||
    req.originalUrl.includes("/edu/nodeCleanup") ||
    req.originalUrl.includes("/edu/getRazorpaylink") ||
    req.originalUrl.includes("/edu/shortcoursepayment") ||
    req.originalUrl.includes("/edu/paymentDetails") ||
    req.originalUrl.includes("/edu/getStudentInfo") ||
    req.originalUrl.includes("/edu/masters/parentDetails") ||
    req.originalUrl.includes("/edu/feesinfo") ||
    req.originalUrl.includes("/edu/reminderCronJob") ||
    req.originalUrl.includes("/edu/getFeePendingStudents") ||
    req.originalUrl.includes("/edu/senddailyreportexcel") ||
    req.originalUrl.includes("/edu/getdailyreportexcel") ||
    req.originalUrl.includes("/edu/sendTandCMail") ||
    req.originalUrl.includes("/edu/updateInstallmentPlan") ||
    req.originalUrl.includes("/edu/zenWebhook") ||
    req.originalUrl.includes("/edu/updateMasterData") ||
    req.originalUrl.includes("/edu/addStudentMaster") ||
    req.originalUrl.includes("/edu/encryptGuardianDetails") ||
    req.originalUrl.includes("/edu/systemReconciliation") ||
    req.originalUrl.includes("/edu/reconcileList") ||
    req.originalUrl.includes("/edu/reconcileListPreview") ||
    req.originalUrl.includes("/edu/sendFeesReceipt") ||
    req.originalUrl.includes("/edu/refund") ||
    req.originalUrl.includes("/edu/transactionsListForRefund") ||
    req.originalUrl.includes("/edu/examFeesNotification") ||
    req.originalUrl.includes("/edu/students") ||
    req.originalUrl.includes("/edu/updateDiscountFees") ||
    req.originalUrl.includes("/edu/updateDiscountInstallment") ||
    req.originalUrl.includes("/edu/testDFCRCRON") ||
    req.originalUrl.includes("/edu/sendNotification") ||
    req.originalUrl.includes("/edu/sendTestNotification") ||
    req.originalUrl.includes("/edu/checkPayments")
  ) {
    next();
  } else if (!authHeader) {
    res.status(401).send(unauthorizedFailureStatus);
    return;
  } else {
    const tokenResponse = jwtMiddleWare.checkToken(req, res, next);
    if (!tokenResponse.response) {
      res.status(401).send({ msg: "Token is not valid" });
      return;
    } else {
      // const user = tokenResponse.decoded.user
      //   ? tokenResponse.decoded.user
      //   : tokenResponse.decoded.email;
      const user =
        tokenResponse.decoded.orgId == undefined
          ? tokenResponse.decoded.user
            ? tokenResponse.decoded.user
            : tokenResponse.decoded.email
          : tokenResponse.decoded.orgId;
      const resource = await checkResource({
        user,
        ...tokenResponse.decoded,
      });
      if (resource.connUri) {
        req.headers.resource = resource.connUri;
        req.headers.orgId =
          tokenResponse.decoded.orgId == undefined
            ? resource._id
            : tokenResponse.decoded.orgId;
        req.headers.user = tokenResponse.decoded.user;
        next();
      } else {
        res.status(401).send({ msg: "Requested resource not found" });
      }
    }
  }
});

//Initiating CRONJOB for VKGI
if (process.env.stage == "prod") {
  vkgiCron();
}

app.use("/config", configRouter);
app.use("/edu", router);
app.use("/master", masterRouter);
app.use("/setup", setuproute);

// console.log(process.env.stage);
// const options = {
//   ca: fs.readFileSync("bundle1.crt"),
//   key: fs.readFileSync("server.key"),
//   cert: fs.readFileSync("cert.crt"),
//   // key: fs.readFileSync("key.pem"),
//   // cert: fs.readFileSync("server.crt"),
//   // ca: fs.readFileSync("bundle1.crt", 'utf8'),
//   // ca: [fs.readFileSync("bundle1.crt"), fs.readFileSync("bundle2.crt"), fs.readFileSync("bundle2.crt")],
//   // passphrase: "Zenqore@123"
// };
// let server = https.createServer(options, app);
// Schedule tasks to be run on the server.
// cron.schedule("* * * * *", async function () {
//   let muni = await createCron("muni");
//   console.log(muni);
// });
let port = process.env.PORT;
if (process.env.stage == "prod" || process.env.stage == "uat") {
  app.listen(port, () => {
    console.log(`https server is listening at port ${port}`);
  });
} else {
  app.listen(port, () => {
    // winston.log('info',`server is listening at port ${port}`);
    console.log(`server is listening at port ${port}`);
  });
}
//
