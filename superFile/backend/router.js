const express = require("express");
const router = express.Router();
var multer = require("multer");
var multerS3 = require("multer-s3");
var AWS = require("aws-sdk");
var storage = multer.memoryStorage();
var upload = multer({ storage: storage });

// var inMemoryStorage = multer.diskStorage({ //multers disk storage settings
//   destination: function (req, file, cb) {
//       cb(null, './uploads/')
//   },
//   filename: function (req, file, cb) {
//       var datetimestamp = Date.now();
//       cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
//   }
// });

const uploadStrategy = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    //file filter
    if (
      ["xls", "xlsx"].indexOf(
        file.originalname.split(".")[file.originalname.split(".").length - 1]
      ) === -1
    ) {
      return callback("Wrong extension type");
    }
    callback(null, true);
  },
}).single("file");

const uploadImage = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    //file filter
    if (
      ["jpeg", "jpg", "png", "svg"].indexOf(
        file.originalname.split(".")[file.originalname.split(".").length - 1]
      ) === -1
    ) {
      return callback("Wrong extension type");
    }
    callback(null, true);
  },
}).single("file");

//Registration
const { createRegistration, showAllRegistration, getStudentForRegistration } = require("./controllers/transactions/registrationController")
//Import loan Controller
const {
  createLoanLedger,
  createSingleLoan,
} = require("./controllers/transactions/loanTransactionController");
//Import calculation controller
const {
  calculateReports,
  DRFC,
} = require("./controllers/calculationController");
//Import OTC Controller
const {
  createOtcPayment,
  getStudentFeesDetails,
  removeStudents,
} = require("./controllers/transactions/otcController");

//QrCode Controller
const { generateQrCode } = require("./controllers/qrCodeController");
//paymentController
const {
  createPaymentKen,
  getStudentFee,
  addPayment,
} = require("./controllers/ken42/paymentController");

const {
  createDeposit,
} = require("./controllers/transactions/depositController");

///others
const { getSignerWebhook } = require("./controllers/webhookController");
const {
  uploadFiles,
  uploadAllImages,
} = require("./controllers/azureBlobController");
const { showAllBank } = require("./controllers/bankController");
const {
  createScholarshipLedger,
  getAllDemandNoteDetails,
  getAllScholarshipTransactions,
  createBulkScholarships,
  getStudentStatus,
  getOneScholarship,
} = require("./controllers/transactions/scholarshipLedgerController");
const {
  createLoan,
  getLoanDetails,
  showAllLoan,
  updateLoanDetails,
} = require("./controllers/loanController");
const {
  createScholarship,
  getScholarshipDetails,
  showAllScholarship,
  updateScholarshipDetails,
} = require("./controllers/scholarshipController");
const {
  createApplication,
  sendReceipt,
  razorpayPaymentStatus,
  getRegistrationList,
  getApplicationList
} = require("./controllers/ken42/applicationController");
const {
  applicationReceipt,
} = require("./controllers/parentPortal/createPdfController");
const {
  getPaymentScheduleById,
  getPaymentHistoryById,
} = require("./controllers/ken42/feePaymentController");
const {
  getStudentDetails,
  getStudentDetailsForPayment,
} = require("./controllers/studentMapController");
const { getPaidDetails, inwords, adjustAmount, updateInstallment,discountRevert,checkRazorpay } = require("./controllers/dataController");
const {
  createFeesManager,
  showAllFeeManager,
  getFeeManagerDetails,
  updatefeeManagerDetails,
  getDisplayname,
} = require("./controllers/feesManageController");
const {
  getUserProfile,
} = require("./controllers/profileManagement/userprofile");
const {
  createRefund,
  updateRefund,
  getRefund,
  transactionsListForRefund
} = require("./controllers/transactions/refundController");
const {
  createFeeCollection,
  createFeeCollectionWithReceipt,
  getReceipt,
  getReceiptBlob,
} = require("./controllers/transactions/feeCollectController");
const { getBlobData } = require("./controllers/azureController");
const {
  createTransaction,
  createPayment,
} = require("./controllers/transactions/testController");
const {
  makePayment,
  getPaymentStatus,
  gatewayCallback,
  createPaytm,
} = require("./controllers/paymentGatewayController.js");
const {
  webhookHandler,
  receiptSend,
} = require("./controllers/transactions/web-hooks.js");

//Upload Student Portal
const {
  uploadMaster,
  getFileRecords,
  getUserProfileInfo,
  nodeCleanup,
  parentDetails,
  getparentDetails,
  getPendingStudents,
  reminderCronJob,
  updateInstallmentPlan,
  updateMasterData,
  addStudentMaster,
  encryptGuardianDetails,
  updateDiscountFees,
  updateDiscountInstallment,
  testDFCRCRON
} = require("./controllers/studentPortalController");
//ken42 Upload Student portal
const {
  uploadMasterken42,
  createMasterken42,
  showAllMaster,
  getMasterDetails,
  updateMasterDetails,
  mergeAllData,
  uploadMasterLink,
  addinsttutePplans,
} = require("./controllers/studentPortalken42Controller");

// Demand Note
const {
  createDemandNote,
  multipleDemandNote,
  getDemandNoteDetails,
  getDemandById,
} = require("./controllers/transactions/demand-note");

//cron controller

//concession controller
const {
  uploadConcession,
  getConcesionsData,
} = require("./controllers/concessions/concessionController");

router.get("/check", (req, res) => {
  const sgMail = require("@sendgrid/mail");
  // let sgKey = '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' // noreply@zenqore.com
  // let sgKey =  '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'
  // let sgKey =  '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' // email2@zenqore.com
  let sgKey = "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"; // noreply@zenqore.com / azure
  // let vkgiKey = "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"; // ncfe
  // let newKey = "SendBestGriD@768@NcFe"
  sgMail.setApiKey(sgKey);
  const msg = {
    // to: "muniyaraj.neelamegam@zenqore.com", // Change to your recipient
    to: ["jayanthinathan.c@zenqore.com","muniyaraj.neelamegam@zenqore.com"], // Change to your recipient
    from: 'noreply@zenqore.com',
    // from: "sendgrid@ncfe.ac.in",
    // from: "noreply@ncfe.ac.in", // Change to your verified sender
    // from: 'noreply@vijaykiran.co.in',
    subject: "Sending with SendGrid",
    text: "Test Mail",
    html: "<strong> Test Mail</strong>",
  };
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
      res.status(200).send({
        status: "success",
        message: "working",
        resource: req.headers.resource,
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(400).send({
        status: "failure",
        message: "failed",
        error: error.response.body.errors,
      });
    });
});

router.get("/getsystemIP", (req, res) => {
  let platform = "";
  let addr = "";
  let externalIp = "";

  require("dns").lookup(require("os").hostname(), function (err, add, fam) {
    let extIP = require("ext-ip")();
    console.log("ip addr: " + add);
    console.log(require("os").platform());
    addr = add;
    platform = require("os").platform();

    extIP
      .get()
      .then((ip) => {
        externalIp = ip;
        console.log("external ip", ip);
        res.send({
          message: "Success",
          "Public IP": addr,
          "External IP": externalIp,
          platform: platform,
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });
});
router.get("/getpublicIP", (req, res) => {
  console.log("gee");

  // const publicIp = require('public-ip');

  // (async () => {
  //   let ipv4 = await publicIp.v4()
  //   let ipv6 = await publicIp.v6()

  //   console.log('IPv4',ipv4)
  //   console.log('IPv6',ipv6)
  //   res.send({
  //     message: "Success",
  //     "Public IPv4": ipv4,
  //     "Public IPv6": ipv6,
  //   })
  //=> 'fe80::200:f8ff:fe21:67cf'
  // })();

  // const { networkInterfaces } = require('os');

  // const nets = networkInterfaces();
  // const results = Object.create(null); // Or just '{}', an empty object

  // for (const name of Object.keys(nets)) {
  //   for (const net of nets[name]) {
  //     // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
  //     if (net.family === 'IPv4' && !net.internal) {
  //       if (!results[name]) {
  //         results[name] = [];
  //       }
  //       results[name].push(net.address);
  //     }
  //   }
  // }
  const shell = require("shelljs");
  let results = shell.exec(
    `dig +short myip.opendns.com @resolver1.opendns.com`
  );
  res.send({ msg: "hi", data: results });
  // My IP address is 10.4.4.137
  // });
});
const {
  createMaster,
  getMaster,
  updateMaster,
  getDisplayId,
  dueDateCalculation,
  installmentDueDateCalculation,
} = require("./controllers/masterManagementController");
const {
  createMasters,
} = require("./controllers/autoMasterManagementController");
const { createReports } = require("./controllers/reportsController");

const { init, initLedger, initCheck } = require("./controllers/InitController");
const { getDashboardData } = require("./controllers/dashboardController");

const {
  uploadExamFees,
  examFeeDemandNote,
  checkPaymentStatus,
} = require("./controllers/examFeesManagementController");

//termsandConditions

const {
  termsAndConditions,
} = require("./controllers/termsandConditionsController");

const { eduvanzWrapperAPI } = require("./controllers/eduvanz-loan-controller");

//Loan Controller
router.post("/bulkLoans", createLoanLedger);
router.post("/createLoan", createSingleLoan);
//Payemnt COntroler
router.post("/paynow", createPaymentKen);
router.post("/addPayment", addPayment);
router.get("/getStudentFee/:id", getStudentFee);

//ken42Lead
const ken42lead = require("./controllers/headseller");
router.post("/leads", ken42lead.headseller);
router.get("/leadId", ken42lead.leadID);
router.get("/leads", ken42lead.getheadseller);
router.put("/leads/:id", ken42lead.updateleads);
router.post("/application", ken42lead.Application);
// feePlan
const feeplan = require("./controllers/feeplan");
router.post("/stufeeplan", feeplan.feeplancreate);
router.put("/stufeeplan", feeplan.feeplanupdate);
router.get("/stufeeplan", feeplan.feeplanget);
//hkbk lead
const hkbklead = require("./controllers/hkbklead");
router.get("/leads2/:id", hkbklead.getleads);
router.post("/leads2/:id", hkbklead.postleads);

//Master COntroller

router.post("/master/:type", createMaster);
router.get("/master/:type", getMaster);
router.put("/master/:type", updateMaster);
router.get("/master/getDisplayId/:type", getDisplayId);
router.get("/master/paymentSchedule/dueDateCalculation", dueDateCalculation);
router.get(
  "/master/paymentSchedule/installmentDueDateCalculation",
  installmentDueDateCalculation
);
const stuMasterUpdate = require("./controllers/studentMasterUpdate");
router.put("/stumaster", stuMasterUpdate.stupdate);

// Fees Ledger - added by rahul.jain
const {
  // insertIntoGenLedger,
  listAllFeesLedger,
  listOneFeesLedger,
  countFeesLedger,
} = require("./controllers/transactions/feesLedgerController");
const {
  receivePayment,
} = require("./controllers/transactions/nonReconciledPaymentController");
const {
  addStatement,
} = require("./controllers/transactions/statement-entries-controller");
const {
  addBankStatements,
  getBankStatements,
} = require("./controllers/reconciliation/bankStatementController");

const {
  getReconciliationList,
  getReconciliationByID,
  systemreconciliation,
  manualreconciliation,
  getRecieptList,
  sendFeesReceipt,
  confirmSoftwareReconciliation,
  createMockTransactions,
  systemreconciliationPOS,
  getReconciliationListPreview,
} = require("./controllers/reconciliation/rconciliationController");

const {
  cancelTransaction,
  getCancelTransaction,
  getActiveTransaction,
} = require("./controllers/transactions/transactionCancelController");

const {
  getPeriodicFeeCollection,
  getCheckTransactions,
} = require("./controllers/transactions/feeCollectionReportsController");
const {
  getPeriodicRefunds,
} = require("./controllers/transactions/RefundReportsController");

const {
  createShortCourseReports,
  applicationSearchReport,
} = require("./controllers/scPlanReportsController");

const {
  // getShortCoursePlan,
  nextPayment,
  getSingleCoursePlan,
  getDemandNoteShortCourse,
  storePaymentData,
  getRazorpaylink,
} = require("./controllers/shortCoursePlanController");
//Multer configuration

//Exam Fee controller
const {
  examFeesNotification
} = require("./controllers/examFeeController");

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

let uploads = multer({
  limits: {
    fileSize: 20000000,
    fieldSize: 20000000,
  },
  storage: multerS3({
    s3: S3,
    bucket: process.env.S3_BUCKET,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      if (file.mimetype == "application/json")
        cb(null, "masterken42" + Date.now() + ".json");
      else cb(null, false);
    },
  }),
});

let uploadsken42 = multer({
  limits: {
    fileSize: 20000000,
    fieldSize: 20000000,
  },
  storage: multerS3({
    s3: S3,
    bucket: process.env.S3_BUCKET,
    metadata: function (req, file, cb) {
      console.log("file", file.mimetype);
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      if (file.mimetype == "application/json")
        cb(null, "masterken42" + Date.now() + ".json");
      else if (file.mimetype == "text/csv")
        cb(null, "masterken42" + Date.now() + ".csv");
      else if (file.mimetype == "application/vnd.ms-excel")
        cb(null, "masterken42" + Date.now() + ".csv");
      else cb(null, false);
    },
  }),
});

//Bank Controller
router.get("/banks", showAllBank);
//Ledger controller
router.post("/transactions/scholarships", createScholarshipLedger);
router.get("/transactions/scholarships/:id", getAllDemandNoteDetails);
router.get("/transactions/scholarships", getAllScholarshipTransactions);
router.post("/transactions/bulkScholarships", createBulkScholarships);
router.post("/transactions/getStudentStatus", getStudentStatus);
router.get("/scholarshipDetails/:id", getOneScholarship);

//Scholarship Controllers
router.post("/scholarships", createScholarship);
router.get("/scholarships/:id", getScholarshipDetails);
router.get("/scholarships", showAllScholarship);
router.put("/scholarships/:id", updateScholarshipDetails);

// Loan Controller
router.post("/loans", createLoan);
router.get("/loans/:id", getLoanDetails);
router.get("/loans", showAllLoan);
router.put("/loans/:id", updateLoanDetails);

//Fees Manager
router.post("/feesManager", createFeesManager);
router.get("/feesManager", showAllFeeManager);
router.get("/feesManager/displayname", getDisplayname);
router.get("/feesManager/:id", getFeeManagerDetails);
router.put("/feesManager/:id", updatefeeManagerDetails);

//Daily Report
const dailyreports = require("./controllers/dailyReport");
router.post("/sendDFCR", dailyreports.DFCRApi);
router.post("/sendNotification", dailyreports.SendNodification);
router.post("/sendTestNotification", dailyreports.SendNodificationEmail);

router.post("/master/:type", createMaster);
router.get("/master/:type", getMaster);
router.put("/master/:type", updateMaster);
// router.get("/master/getDisplayId/:type", getDisplayId);
router.get("/master/paymentSchedule/dueDateCalculation", dueDateCalculation);
router.get(
  "/master/installments/installmentDueDateCalculation",
  installmentDueDateCalculation
);

//
router.post("/setup", init);

//Profile Management
router.get("/getUserProfile", getUserProfile);
//Student Portal
router.post("/nodeCleanup", nodeCleanup);
router.put("/masters/parentDetails/:studentId", parentDetails);
router.get("/masters/parentDetails/:studentId", getparentDetails);
router.post("/getFeePendingStudents/:id", getPendingStudents);
router.put("/updateInstallmentPlan", updateInstallmentPlan);
router.post("/updateMasterData", upload.single("file"), updateMasterData);
router.get("/addStudentMaster", addStudentMaster);
router.post("/encryptGuardianDetails", encryptGuardianDetails);
router.post("/updateDiscountFees", updateDiscountFees);
router.post("/updateDiscountInstallment", updateDiscountInstallment)
router.post("/testDFCRCRON",testDFCRCRON)

//ken42 Student Portal
//Master Controller
router.post(
  "/uploadMasterken42",
  uploadsken42.fields([{ name: "file" }]),
  uploadMasterken42
);
router.post("/mastersken42", createMasterken42);
router.get("/mastersken42", showAllMaster);
router.get("/mastersken42/:id", getMasterDetails);
router.put("/mastersken42/:id", updateMasterDetails);
router.get("/mergemaster", mergeAllData);
router.get("/ken42datafetch", uploadMasterLink);
router.get("/mergeIPP", addinsttutePplans);

//Transactions
router.post("/transaction", createTransaction);
router.post("/payment", createPayment);
router.post("/callback", gatewayCallback);
router.post("/webhook", webhookHandler);
router.post("/receiptSend", receiptSend);

//demand note
router.post("/demandNote", createDemandNote);
router.post("/multipleDemand", multipleDemandNote);
router.get("/demandNote", getDemandNoteDetails);
router.get("/getStudentFeesById/:id", getDemandById);

// added by rahul.jain - transactions and feesLedger
const {
  processTransaction,
  listAllTransactions,
  listOneTransaction,
  countTransactions,
} = require("./controllers/transactions/transactionsController");
const {
  getTasks,
  createTasks,
  updateTasks,
  getTaskDisplayId,
} = require("./controllers/taskController");

router.post("/transactions", processTransaction);
router.get("/transactions", listAllTransactions);
router.get("/transactions/count", countTransactions);
router.get("/transactions/:id", listOneTransaction);

// router.post("/generalledger", insertIntoGenLedger);
router.get("/feesledger", listAllFeesLedger);
router.get("/feesledger/count", countFeesLedger);
router.get("/feesledger/:id", listOneFeesLedger);

//Fees Collection
router.post("/feepayment", createFeeCollection);
router.post("/feePaymentWithReceipt", createFeeCollectionWithReceipt);
router.post("/getReceipt", getReceipt);
router.post("/getReceiptBlob", getReceiptBlob);
router.get("/getPaymentStatus/:id", razorpayPaymentStatus);

//Reports
// router.get("/reports/:type", createReports);
// router.get("/dashboard", getDashboardData);

//FeePayment
router.get("/studentFeeDetails/:id", getStudentDetails);
router.get("/getDemandNoteDetails/:id", getStudentDetailsForPayment);

//Data Controller
router.get("/getPaidDetails/:id", getPaidDetails);
router.post("/inwords", inwords);
router.get("/adjustAmount", adjustAmount) 
router.get("/discountRevert", discountRevert)
router.get("/updateInstallment", updateInstallment)
router.post("/checkPayments",checkRazorpay)

//Refund Controller
router.post("/refund", createRefund);
router.put("/refund/:id", updateRefund);
router.get("/refund", getRefund);
router.get("/transactionsListForRefund", transactionsListForRefund)

//Azure Controller
router.get("/azure", getBlobData);

//Ken42 APIs
router.get("/pendingFees/:id", getPaymentScheduleById);
router.get("/paymentHistory/:id", getPaymentHistoryById);
router.post("/createApplication", createApplication);
router.post("/sendReceipt", sendReceipt);
router.get("/getPaymentStatus/:id", razorpayPaymentStatus);

router.get("/getRegistrationList", getRegistrationList);
router.get("/getApplicationList", getApplicationList)

//Reconciliation
// router.post("/makePayment/:orgId", receivePayment);
router.post("/statementEntry/:orgId", addStatement);
router.post("/bankStatement/:orgId", addBankStatements);
router.get("/bankStatement/:orgId", getBankStatements);
// Exam Fees Controller
router.post("/uploadExamFees", upload.single("file"), uploadExamFees);
router.post("/examFeesDemandNote", examFeeDemandNote);
router.get("/getTransactionStatus", checkPaymentStatus);

//Azure Blob Controller
router.post("/uploadScholarships", uploadStrategy, uploadFiles);
router.post("/uploadImage", uploadImage, uploadAllImages);

//Webhook Controller
router.post("/zenWebhook", getSignerWebhook);

// reconciliation Controller
router.get("/reconcileList", getReconciliationList);
router.get("/reconcileListPreview", getReconciliationListPreview);
router.get("/reconciliationbyid", getReconciliationByID);
router.post("/systemReconciliation", systemreconciliation);
router.post("/manualReconciliation", manualreconciliation);
router.get("/getRecieptList", getRecieptList);
router.post("/sendFeesReceipt", sendFeesReceipt);
router.post("/confirmReconciliation", confirmSoftwareReconciliation);
router.post("/createMockTransactions", createMockTransactions);
router.post("/systemreconciliationPOS", systemreconciliationPOS);

//Task controller
router.get("/tasks", getTasks);
router.post("/tasks", createTasks);
router.put("/tasks/:id", updateTasks);
router.get("/tasks/displayName", getTaskDisplayId);

//OTC Controller
//Payment
router.post("/otcPayments", createOtcPayment);
router.get("/feesDetails/:id", getStudentFeesDetails);
router.post("/removeStudents", removeStudents);

//Transaction Cancel Controller
router.post("/cancelTransaction", cancelTransaction);
router.get("/getCancelTransaction", getCancelTransaction);
router.get("/getActiveTransaction", getActiveTransaction);

//QrCode Controller
router.post("/qrcode", generateQrCode);

//FeeCollection Reports Controller
router.get("/getPeriodicFeeCollection", getPeriodicFeeCollection);
router.get("/getCheckTransactions", getCheckTransactions);
//Refund Reports Controller
router.get("/getPeriodicRefunds", getPeriodicRefunds);

//Short Course Reports Controller for SNMA
router.get("/getShortCoursePlan/:id", getSingleCoursePlan);
router.get("/getShortCourseDN", getDemandNoteShortCourse);
router.post("/paymentDetails", nextPayment);
router.put("/shortcoursepayment/:applicationId", storePaymentData);
router.post("/getRazorpaylink", getRazorpaylink);
router.get("/screports/:type", createShortCourseReports);
router.get("/searchApplication", applicationSearchReport);

// const { testVKGI } = require("./controllers/shortCoursePlanController");
// router.get('/testVKGIreceipt', testVKGI)  // Only for testing NCFE (VKGI) Receipt template.

router.post("/loan/eduvanz", eduvanzWrapperAPI);

//Deposit Controller
router.post("/deposits", createDeposit);

//ParentPortal
router.post("/createPdf", applicationReceipt);

// notifications
const {
  getNotifications,
  postNotifications,
  putNotifications,
  getPdfData,
} = require("./controllers/notifications/notifications");
const {
  createCampus,
  getCampus,
  getCampusDetails,
  updateCampus,
  getCampusDisplayId,
} = require("./controllers/campusController");
router.get("/notifications", getNotifications);
router.post("/notifications", postNotifications);
router.put("/notifications", putNotifications);

// Setup-Master-Franchises

const {
  getFranchisesData,
  postFranchisesData,
  putFranchisesData,
  generateFranchisesId,
} = require("./controllers/franchises/franchises");
router.get("/franchises", getFranchisesData);
router.post("/franchises", postFranchisesData);
router.put("/franchises", putFranchisesData);
router.get("/franchisesDisplayName", generateFranchisesId);

// Cheque-dd - reports - controller
const { getChequeDetails } = require("./controllers/cheque-dd/cheque-dd");
router.get("/cheque", getChequeDetails);

//Campus Controller
router.post("/campus", createCampus);
router.get("/campus", getCampus);
router.get("/campus/:id", getCampusDetails);
router.put("/campus/:id", updateCampus);
router.get("/campusdisplayName", getCampusDisplayId);

//Eduvanz Loan Controller
const {
  sendEduvanzLoanMail,
  sendLoanProcessAPI,
} = require("./controllers/eduvanz-loan-controller");
const {
  createStructure,
  createProgramPlan,
  createFeeTypes,
  createFeeStructure,
} = require("./controllers/structureController");
router.post("/eduvanzLoanProcess", sendEduvanzLoanMail);
router.get("/getStudentInfo", sendLoanProcessAPI);

//New Strcutre APIS

// New strucuture
router.post("/structure", createStructure);

//New Program Plan
router.post("/programPlans", createProgramPlan);

//New Fee Types
router.post("/feeTypes", createFeeTypes);

//New Fee Structure
router.post("feeStructures", createFeeStructure);

//terms n conditions
router.get("/feesinfo/:contactId", termsAndConditions);

//cron job controllers
router.post("/reminderCronJob/:id", reminderCronJob);

// DASHBOARD NEW CONTROLLER
const { getDashboardNewDetails } = require("./controllers/dashboard-new-controller");
router.get("/getDashboard", getDashboardNewDetails); // --> get dashboard details

// ----- REPORTS NEW CONTROLLER (old collection) -----

// (1) TRANSACTIONS
const { getFeeCollectionChart, getFeeCollectionData } = require("./controllers/reports-revamp/transactions");
router.get("/feeCollectionChart", getFeeCollectionChart); // --> get fee collection chart
router.get("/feeCollectionData", getFeeCollectionData); // --> get fee collection data

// (2) FEE PENDING
const {
  getFeePendingCharts,
  getFeePendingData,
} = require("./controllers/reports-revamp/fee-pending");
router.get("/feePendingChart", getFeePendingCharts); // --> get fee pending charts
router.get("/pendingStudents", getFeePendingData); // --> get fee pending data

// (3) FEE REFUND
const {
  getReportsRefund,
} = require("./controllers/reports-revamp/refund-reports");
router.get("/getRefundReport", getReportsRefund); // --> get fee refund data

// (4) STUDENT STATEMENT
const {
  getStudentStatement,
  downloadStudentStatement,
} = require("./controllers/reports-revamp/student-statement");
router.get("/getStudentStatement", getStudentStatement); // --> get student statement data
router.get("/downloadStatement", downloadStudentStatement); // --> download all student statement

// (5) LOANS
const {
  getLoanReports,
} = require("./controllers/reports-revamp/reports-loans");
router.get("/getLoanData", getLoanReports); // --> get loan report data
// (get api for both reports and transactions)

// (6) RECEIVABLES
const {
  getReportReceivables,
} = require("./controllers/reports-revamp/reports-receivables");
router.get("/getReceivables", getReportReceivables); // --> get receivable reports (chart + data)

// (7) DEMAND NOTE
const {
  getDemandNoteData,
} = require("./controllers/reports-revamp/demand-note");
router.get("/getDemandNote", getDemandNoteData); // --> get demand note data
// (get api for both reports and transactions)

// (8) FEE COLLECTION
const { getAllFeeCollectionDetails } = require("./controllers/reports-revamp/fee-collection-students");
router.get("/studentFeeCollection", getAllFeeCollectionDetails); // --> get installment wise fee collection data

// (9) APPLICATION DATA
const { getApplicationData } = require("./controllers/reports-revamp/application");
router.get("/getApplication", getApplicationData); // --> get application report data

// (10) FEE TYPE
const { getFeeTypeReport, getFeeTypeTransaction } = require("./controllers/reports-revamp/fee-type");
router.get("/getFeeType", getFeeTypeReport); // --> get list of fee types with total paid
router.get("/getFeeTypeTransaction", getFeeTypeTransaction); // --> get list of transaction with feetypes

//calculation controler
router.get("/calculate", calculateReports);
router.get("/DRFC", DRFC);

// const { getAnnualReport } = require("./controllers/dailyReport");
// router.get("/getAnnualreport", getAnnualReport);
const { getData, checkCampusData } = require('./controllers/vkgi-excel-template-code');
router.post('/getExcelData', getData)
router.get('/checkData', checkCampusData)

//concession controllers
router.post("/uploadConcession", uploadConcession);
router.get("/getConcesionsData", getConcesionsData);

// const { runScript } = require('./controllers/puppeteer/vkgi-dashboard-img')
// router.get('/getDashboardImg', runScript)

//exam fee controller
router.post("/examFeesNotification", examFeesNotification)

const {
  whatsapp,
  messageSentCallback,
} = require("./controllers/twilioController");
router.post("/whatsapp", whatsapp);
router.post("/messageSent", messageSentCallback);
module.exports = router;


// --------------- New Report collection updated api's ----------------

// UPDATED DASHBOARD CONTROLLER
const { getUpdatedDashboard } = require("./controllers/dashboard/dashboard-new");
router.get("/dashboard", getUpdatedDashboard); // --> get dashboard data

// NEW REPORT DATA 
const { getReports } = require("./controllers/flatten-reports/get-all-reports");
router.get("/reports/data", getReports); // --> get all type of reports data in one file

// NEW REPORT CHART
const { getReportCharts } = require("./controllers/flatten-reports/get-all-reports-chart");
router.get("/reports/chart", getReportCharts); // get all type of reports chart in one file

// ------------------ SUPPORTING REPORT CONTROLLERS -------------------

// GET PROGRAM PLAN DETAILS
const { getProgramPlanId } = require("./controllers/flatten-reports/reports-support");
router.get("/programPlanData", getProgramPlanId); // --> for reports dropdown filter programPlan data

// GET CAMPUS DETAILS
const { getCampusId } = require("./controllers/flatten-reports/reports-support");
router.get("/campusData", getCampusId); // --> for reports dropdown filter campus data

// REPORT CREATION, READ AND DELETE
const { createNewReportCollection, getReportDetails, deleteCollection } = require("./controllers/flatten-reports/report-creation");
router.get("/createReport", createNewReportCollection); // combine multiple collections into one for report (reportDetails)
router.get("/getFlatReport", getReportDetails);  //Get 'reportdetails' collection data 
router.get('/deleteReport', deleteCollection) // ---> Completely delete all the collection


// -------------------- TESTING REPORT DATA --------------------------
// REPORTS CHECK
const { checkReportData } = require("./controllers/flatten-reports/report-data-check");
router.get("/reportCheck", checkReportData); // --> check reports data mis-match _id's


//Registration APIS

router.post("/registrations", createRegistration)
router.get("/registrations", showAllRegistration)
router.get("/registrations/:id", getStudentForRegistration)
// STUDENT FEE MAPPING
const { getFeeMappingData } = require("./controllers/fee-mapping");
router.get("/studentFeeMapping", getFeeMappingData);

// ADD NEW STUDENT
const { createNewStudent, getStudentFeeStructure, updateFeeStructure } = require("./controllers/createStudentController");

router.post("/students", createNewStudent);
router.get("/students/:id", getStudentFeeStructure)
router.put("/students/:id", updateFeeStructure)


// ProgramPlan Update Controller
const { editProgramPlan } = require("./controllers/program-plan");
router.put("/updateProgramPlan", editProgramPlan);





