const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const collectionName = "shortcourseplan";
const shortCoursePlanSchema = require("../models/shortCoursePlanModel");
const axios = require("axios");
const orgListSchema = require("../models/orglists-schema");
const ApplicationSchema = require("../models/ken42/applicationModel");
const { sendEmail } = require("../controllers/emailController");
const settingsSchema = require("../models/settings-model");
const {
  demandNoteTemplate,
} = require("../utils/helper_functions/templates/demand-note-email-template");
const tinyUrl =
  "https://cwpjc8rnb2.execute-api.ap-south-1.amazonaws.com/prod/tiny/shorturl";
var _ = require("lodash");
var moment = require("moment");
const { map } = require("lodash");
const rq = require("request-promise");
var uuid = require("uuid");
const {
  receiptPdf,
} = require("../utils/helper_functions/templates/vkgi-receipt-template");

var config = {
  dateRange: 7,
  reminder: 1,
};

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
async function getSingleCoursePlan(req, res) {
  var dbUrl = req.headers.resource;
  console.log("dburl", dbUrl, req.params);
  const { orgId, page, limit } = req.query;
  let dbConnection = await createDatabase(orgId, dbUrl);
  var shortCoursePlanModel = await dbConnection.model(
    collectionName,
    shortCoursePlanSchema,
    collectionName
  );
  const getData = await shortCoursePlanModel.findOne({ _id: req.params.id });
  res.status(200).json({
    message: "success",
    data: getData,
  });
}

// async function getShortCoursePlan2(req, res) {
//     var dbUrl = req.headers.resource;
//     console.log("dburl", dbUrl);
//     const { orgId, page, limit } = req.query;
//     const { type } = req.params;
//     let dbConnection = await createDatabase(orgId, dbUrl);
//     var shortCoursePlanModel = await dbConnection.model(collectionName, shortCoursePlanSchema, collectionName);
//     // var applicationModel = await dbConnection.model('applications', ApplicationSchema, 'applications')

//     const getData = await shortCoursePlanModel.find({});
//     let finalData = await Paginator(getData, page, limit)
//     res.status(200).json({
//         "message": 'success',
//         data: finalData.data,
//         currentPage: finalData.page,
//         perPage: finalData.perPage,
//         nextPage: finalData.nextPage,
//         totalRecord: finalData.totalRecord,
//         totalPages: finalData.totalPages,
//     })
// }
async function getDemandNoteShortCourse(req, res) {
  var dbUrl = req.headers.resource;
  console.log("dburl", dbUrl);
  const { orgId, page, limit, applicationId } = req.query;
  const { type } = req.params;
  let dbConnection = await createDatabase(orgId, dbUrl);
  var shortCoursePlanModel = await dbConnection.model(
    collectionName,
    shortCoursePlanSchema,
    collectionName
  );

  const getData = await shortCoursePlanModel.findOne({
    applicationId: applicationId,
  });
  var applicationModel = await dbConnection.model(
    "applications",
    ApplicationSchema,
    "applications"
  );
  const getapplicationData = await applicationModel.findOne({
    applicationId: applicationId,
  });
  // let finalData = await Paginator(getData, page, limit)
  let result = {};
  let demandNoteDetails = [];
  let studentDetails = {};
  // let address = String(getData.permanentAddress).split[',']
  if (getData !== null) {
    studentDetails = {
      _id: getData._id,
      category: "-",
      guardianDetails: null,
      gender: "NA",
      citizenship: "India",
      currency: "INR",
      FOREX: 1,
      admittedOn: null,
      status: 1,
      displayName: getData.applicationId,
      regId: getData.regId,
      rollNumber: getData.regId,
      salutation: null,
      firstName: getData.name,
      lastName: null,
      dob: null,
      programPlanId: null,
      feeStructureId: null,
      phoneNo: getData.mobileNumber,
      email: getData.emailAddress,
      alternateEmail: null,
      parentName: "NA",
      parentPhone: "NA",
      parentEmail: "NA",
      relation: "parent",
      addressDetails: {
        address1: getData.permanentAddress,
        address2: "NA",
        address3: "NA",
        city: "NA",
        state: "NA",
        country: "NA",
        pincode: "NA",
      },
      isFinalYear: null,
    };
    let amountToBePaid =
      getData.demandNoteDetails.status.toLowerCase() == "paid"
        ? 0
        : getData.demandNoteDetails.data.feesBreakUp.reduce(
            (a, b) => a + b.feeAmount,
            0
          );
    getData["totalAmount"] = getData.demandNoteDetails.amount;
    getData["paidAmount"] = getData.demandNoteDetails.paidAmount;
    getData["totalAmountDue"] = amountToBePaid;

    demandNoteDetails.push({
      applicationDetails: getapplicationData,
      demandNoteData: getData,
      studentDetails: studentDetails,
    });
    result.demandNoteDetails = demandNoteDetails;
    result.totalAmount = getData.demandNoteDetails.amount;
    result.amountToBePaid = amountToBePaid;
    res.status(200).json(result);
  } else {
    res.status(400).json({
      message: "Demand note is not found",
      status: "failure",
    });
  }
}
async function getRazorpaylink(req, res) {
  let inputData = req.body;
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({ _id: req.query.orgId });

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
    const applicationModel = await dbConnection.model(
      "applications",
      ApplicationSchema
    );
    const shortCoursePlanModel = await dbConnection.model(
      collectionName,
      shortCoursePlanSchema,
      collectionName
    );

    const applicationDetails = await applicationModel.findOne({
      applicationId: inputData.applicationId,
    });
    const shortCourseDetails = await shortCoursePlanModel.findOne({
      applicationId: inputData.applicationId,
    });
    const credentials = mongoose.Schema({}, { strict: false });

    const credentialsModel = dbConnection.model(
      "credentials",
      credentials,
      "credentials"
    );
    const credentialData = await credentialsModel.findOne({ type: "payment" });

    var username = credentialData._doc.userName;
    var password = credentialData._doc.password;
    var auth =
      "Basic " + Buffer.from(username + ":" + password).toString("base64");
    let amount =
      inputData.amount +
      inputData.paisa +
      (inputData.paisa.length == 1 ? "0" : "");
    console.log("payload amount***", amount);
    let today = Date.now();
    var obj;
    let uniqueId = uuid.v1();
    obj = {
      amount: parseInt(amount),
      currency: inputData.currencyCode,
      accept_partial: inputData.accept_partial,
      expire_by: today,
      reference_id: uniqueId,
      description: "Payment for " + inputData.applicationId,
      customer: {
        name: applicationDetails.name,
        contact: applicationDetails.mobile,
        email: applicationDetails.email,
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: false,
      notes: {
        policy_name: applicationDetails.name,
      },
      callback_url:
        inputData.callBackUrl + "?applicationId=" + inputData.applicationId,
      callback_method: "get",
    };

    console.log("payload", obj);
    var options = {
      method: "POST",
      uri: "https://api.razorpay.com/v1/payment_links",
      body: obj,
      json: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
    };
    rq(options).then(async (success) => {
      var shortCourseIndex = shortCourseDetails._id;
      let razorpay = {
        name: applicationDetails.name,
        mobileNumber: applicationDetails.mobile,
        emailAddress: applicationDetails.email,
        applicationId: inputData.applicationId,
        amount: Number(inputData.amount),
        paisa: Number(inputData.paisa),
        partial: inputData.accept_partial,
        programPlan: applicationDetails.programPlan,
        batch: applicationDetails.batch,
        paymentId: "",
        callBackUrl: inputData.callBackUrl,
        currencyCode: inputData.currencyCode,
        razorpay: "",
        gatewayType: "razorpay",
        webhookStatus: "initiated",
        razorpayUnique: uniqueId,
      };
      await shortCoursePlanModel.updateOne(
        { _id: shortCourseIndex._id },
        {
          $set: {
            razorpayDetails: razorpay,
          },
        },
        async function (err, doc) {
          if (doc.nModified) {
            dbConnection.close();
            return res.status(200).json({
              success: true,
              Data: success,
            });
          } else {
            dbConnection.close();
            return res.status(400).json({
              status: "failure",
              message: "failed to create link ",
              data: err,
            });
          }
        }
      );
    });
  }
}
async function addShortCoursePlan(req, res) {
  try {
    let inputData = req.body;
    const { type } = req.params;
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
      _id: inputData.orgId,
    });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(404).send({
        status: "failure",
        message: "Organization not found",
      });
    } else {
      console.log("dbUrl", orgData.connUri);
      let dbName = inputData.orgId;
      let dbConnection = await createDatabase(String(dbName), orgData.connUri);
      var responseReturn = {};
      let totalDue =
        inputData.feeDetails &&
        inputData.feeDetails.reduce((a, b) => a + b.feeAmount, 0);
      if (inputData.feeDetails.length !== 0 && totalDue !== 0) {
        // let dbConnection = await createDatabase(dbName, dbUrl);
        // console.log('**Input Data**', inputData)
        var modelData = await dbConnection.model(
          "shortcourseplan",
          shortCoursePlanSchema,
          "shortcourseplan"
        );
        const findApplication = await modelData.findOne({
          applicationId: inputData.applicationId,
        });
        if (findApplication == null || findApplication == {}) {
          let addDetails = new modelData({ ...inputData });
          await addDetails
            .save()
            .then(async (data) => {
              if (data) {
                var courseDate = moment(
                  inputData.courseStartDate,
                  "DD-MM-YYYY"
                );
                var today1 = moment().format("DD-MM-YYYY");
                var today = moment(today1, "DD-MM-YYYY");
                var dueDate = "";
                var diffDays = courseDate.diff(today, "days");
                // console.log('difference Days', diffDays);
                // console.log('condition 1', diffDays < config.dateRange);
                // console.log('condition 2', diffDays > config.dateRange);
                if (diffDays < config.dateRange) {
                  var tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  dueDate = tomorrow;
                  //if difference is less than 7
                  responseReturn = await updateDBDemandNoteData(
                    data,
                    inputData,
                    dueDate,
                    modelData,
                    dbConnection
                  );
                } else if (diffDays >= config.dateRange) {
                  // console.log(diffDays >= config.dateRange)
                  // dueDate= start date - 7
                  dueDate = courseDate.subtract(config.dateRange, "days");
                  responseReturn = await updateDBDemandNoteData(
                    data,
                    inputData,
                    dueDate,
                    modelData,
                    dbConnection
                  );
                }

                console.log(
                  "**Demand Note Email Sent and added in Short Course plan**"
                );
              } else
                throw {
                  message: "Database error",
                  status: "error",
                  // data: data,
                };
            })
            .catch((err) => {
              console.log(err);
              throw {
                message: "Database error",
                status: "error",
                data: err,
              };
            });
        } else {
          throw {
            message: `Application ID already exists`,
            status: "failure",
          };
        }
      } else {
        throw {
          message: "There is no pending amount to be paid",
          status: "failure",
        };
      }
      res.send(responseReturn);
      centralDbConnection.close() // new
      dbConnection.close() // new
    }
  } catch (e) {
    res.status(400);
    res.send({ Err: e });
    centralDbConnection.close() // new
    dbConnection.close() // new
  }
}
async function updateDBDemandNoteData(
  addedData,
  inputData,
  dueDate,
  modelData,
  dbConnection
) {
  const findQuery = await modelData.find({});
  const nextId = await getNextId(findQuery);
  const applicationModel = await dbConnection.model(
    "applications",
    ApplicationSchema,
    "applications"
  );
  const getPaidDetails = await applicationModel.findOne({
    applicationId: inputData.applicationId,
  });
  const paidAmount = parseFloat(
    getPaidDetails.amount + "." + getPaidDetails.paisa
  );

  let transactionType = "eduFees";
  let transactionSubType = "demandNote";
  let demandNoteDetails = {};
  demandNoteDetails.applicationId = inputData.applicationId;
  demandNoteDetails.displayName = nextId;
  demandNoteDetails.transactionType = transactionType;
  demandNoteDetails.transactionSubType = transactionSubType;
  demandNoteDetails.transactionDate = moment().toISOString();
  demandNoteDetails.courseStartDate = inputData.courseStartDate;
  demandNoteDetails.studentRegId = inputData.regId;
  demandNoteDetails.studentName = inputData.name;
  demandNoteDetails.class = inputData.courseName;
  demandNoteDetails.orgId = inputData.orgId;
  demandNoteDetails.dueDate = moment(dueDate).toISOString();
  demandNoteDetails.emailAddress = inputData.emailAddress;
  demandNoteDetails.mobileNumber = inputData.mobileNumber;
  demandNoteDetails.amount = parseFloat(inputData.courseFee);
  demandNoteDetails.paidAmount = paidAmount;
  demandNoteDetails.status = "Partial";
  demandNoteDetails.data = {
    orgId: inputData.orgId,
    displayName: nextId,
    studentRegId: inputData.regId,
    courseName: inputData.courseName,
    dueDate: moment(dueDate).toISOString(),
    feesBreakUp: [],
  };
  if (inputData.feeDetails.length > 0) {
    inputData.feeDetails.map((item, index) => {
      return demandNoteDetails.data.feesBreakUp.push({
        feeAmount: parseFloat(item.feeAmount),
        feeType: item.feeType,
        amountType: item.amountType,
        status: "Pending",
      });
    });
  }
  await modelData.updateOne(
    { _id: addedData._id },
    {
      $set: {
        demandNoteDisplayName: nextId,
        demandNoteDetails: demandNoteDetails,
      },
    }
  );
  return (responseReturn = await singleCreateDemandNote(demandNoteDetails));
}
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
      if (el.demandNoteDetails && el.demandNoteDetails["displayName"]) {
        let filStr = el.demandNoteDetails["displayName"].split(regex);
        let typeStr = filStr[0];
        let typeYear = filStr[1];
        if (typeStr === type && typeYear == financialYear) {
          check = true;
          dataArr.push(el.demandNoteDetails["displayName"]);
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
async function singleCreateDemandNote(inputData) {
  // console.log('demand note ', inputData)
  if (!inputData.data.orgId) {
    let Response = {
      status: "failure",
      message: "Organization not found",
    };
    return Response;
  }
  //  else if (inputData.amount == 0) {
  //     let Response = {
  //         status: "failure",
  //         message: "Already paid for this Demand Note",
  //     };
  //     return Response;
  // }
  else {
    const centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({ _id: inputData.data.orgId });
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
      const applicationModel = await dbConnection.model(
        "applications",
        ApplicationSchema,
        "applications"
      );
      const getPaidDetails = await applicationModel.findOne({
        applicationId: inputData.applicationId,
      });
      const paidAmount = parseFloat(
        getPaidDetails.amount + "." + getPaidDetails.paisa
      );
      let totalDueAmt = inputData.data.feesBreakUp.reduce(
        (a, b) => a + b.feeAmount,
        0
      );
      inputData.totalDueAmt = totalDueAmt;
      const settingsSchema = mongoose.Schema({}, { strict: false });
      const settingsModel = dbConnection.model(
        "settings",
        settingsSchema,
        "settings"
      );
      const orgSettings = await settingsModel.find({});

      let orgDetails = orgSettings[0]._doc;
      const { mobileNumber, emailAddress, data, applicationId } = inputData;
      let tinyUri;

      const tinyUrlPayload = {
        Url: `${
          process.env.feeCollectionURL
        }${orgNameSpace}/getRazorpayLink?orgId=${inputData.orgId}&demanNote=${
          data.displayName
        }&applicationId=${applicationId}&shortCourse=true&dueAmount=${Number(
          totalDueAmt
        ).toFixed(2)}`,
      };
      tinyUri = await axios.post(tinyUrl, tinyUrlPayload);

      const demandNoteLink = tinyUri.data
        ? tinyUri.data.ShortUrl
        : tinyUrlPayload.Url;
      let openingLine = "Please find your fee details as follows:";
      let emailTemplate = demandNoteTemplate(
        orgDetails,
        [inputData],
        demandNoteLink,
        openingLine,
        paidAmount,
        "shortCourseDN"
      );

      let sentMail = await sendEmail(
        orgDetails.emailServer[0].emailServer,
        emailAddress,
        orgDetails.emailServer[0].emailAddress,
        "ZQ EDU-Demand Note",
        emailTemplate,
        []
      );
      dbConnection.close();

      let Response = { success: true, message: "Demand Note Email Sent" };
      return Response;
      // }
    }
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
async function storePaymentData(req, res) {
  try {
    let inputData = req.body;
    const { applicationId } = req.params;
    const centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({ _id: inputData.orgId });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(404).send({
        status: "failure",
        message: "Organization not found",
      });
    } else {
      let dbName = inputData.orgId;
      let dbConnection = await createDatabase(String(dbName), orgData.connUri);
      console.log("put api dburl", orgData.connUri);
      var responseReturn = {};
      var modelData = await dbConnection.model(
        "shortcourseplan",
        shortCoursePlanSchema,
        "shortcourseplan"
      );
      const applicationData = await modelData.findOne({
        applicationId: applicationId,
      });
      const applicationModel = await dbConnection.model(
        "applications",
        ApplicationSchema,
        "applications"
      );
      const getPaidDetails = await applicationModel.findOne({
        applicationId: applicationId,
      });
      // console.log("getPaidDetails :", getPaidDetails)
      const previousPaid = parseFloat(
        Number(getPaidDetails.amount) + "." + Number(getPaidDetails.paisa)
      );

      let instituteName = orgData.nameSpace;
      // console.log(instituteName)
      if (applicationData !== null) {
        // const applicationModel = await dbConnection.model("applications", ApplicationSchema, "applications");
        // const getPaidDetails = await applicationModel.findOne({ applicationId: applicationId })
        const initialPaid = parseFloat(
          applicationData.demandNoteDetails.paidAmount
        );
        // console.log('paidAmount', initialPaid)
        let modeDetails = inputData.modeDetails;
        let paidMode = inputData.mode;
        let paidAmount = Number(inputData.amount);
        let status = "Paid";
        // if (parseFloat(applicationData.courseFee) == parseFloat(paidAmount)) { status = "Paid" }
        // else { status = status }

        let feesDetails = {
          ...applicationData.feesDetails,
          demandNoteDate: applicationData.demandNoteDetails.transactionDate,
          modeDetails: modeDetails,
          paidMode: paidMode,
          amountPaid: Number(inputData.amount),
          status: status,
        };
        modelData.updateOne(
          { _id: applicationData._id },
          {
            $set: {
              feeDetails: [feesDetails],
              demandNoteDetails: {
                ...applicationData.demandNoteDetails,
                paidAmount: paidAmount + previousPaid,
                status: status,
              },
            },
          },
          async function (err, doc) {
            let feeStatement = [];
            let receivedAmount =
              getPaidDetails.amount + "." + getPaidDetails.paisa;
            // console.log('batch is',getPaidDetails)
            let paidAtApplication = {
              date: moment(new Date(getPaidDetails.createdAt)).format(
                "DD/MM/YYYY"
              ),
              name: getPaidDetails.name,
              applicationId: getPaidDetails.applicationId,
              course: getPaidDetails.programPlan,
              batch: getPaidDetails.batch,
              receivedAmount: parseFloat(receivedAmount),
              refundAmount: 0.0,
              totalAmount: parseFloat(receivedAmount),
            };
            feeStatement.push(paidAtApplication, {
              date: moment(new Date(modeDetails.transactionDate)).format(
                "DD/MM/YYYY"
              ),
              name: applicationData.name,
              applicationId: applicationData.applicationId,
              course: applicationData.courseName,
              batch:
                applicationData.courseStartDate == null
                  ? "-"
                  : applicationData.courseStartDate,
              receivedAmount: parseFloat(Number(inputData.amount)),
              refundAmount: 0.0,
              totalAmount: parseFloat(Number(inputData.amount)),
            });
            if (doc.nModified) {
              let moneyString = inputData.amount;
              let newMoney = "";
              if (!String(moneyString).includes(".")) {
                newMoney = Number(moneyString) * 100;
              } else {
                let moneyArr = String(moneyString).split(".");
                newMoney =
                  moneyArr[0] +
                  moneyArr[1] +
                  (moneyArr[1] != null && moneyArr[1].length == 1 ? "0" : "");
              }
              let payloads = {
                email: applicationData.emailAddress,
                academicYear: new Date().getFullYear(),
                applicationId: applicationId,
                transactionId: modeDetails.transactionId,
                studentName: applicationData.name,
                class: `${applicationData.courseStartDate}`,
                applicationFees: parseInt(newMoney),
                mode: String(paidMode).toUpperCase(),
                currencyCode: "INR",
                programPlan: applicationData.courseName,
                feeStatement: feeStatement,
              };
              // console.log('receipt payload', payloads)
              sendReceipt(payloads, instituteName);
              centralDbConnection.close() // new
              dbConnection.close() // new
              return res.status(200).json({
                status: "success",
                message:
                  "Payment updated and receipt has been sent successfully",
              });
            } else {
              return res
                .status(400)
                .json({ status: "failure", message: "Nothing updated" });
            }
          }
        );
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400);
    res.send({ Err: e });
    centralDbConnection.close() // new
    dbConnection.close() // new
  }
}
function sendReceipt(inputData, institute) {
  axios
    .post(process.env.receiptAPI + "?institute=" + institute, inputData)
    .then(function (response) {
      res.status(200).json(response.data);
    })
    .catch(function (error) {
      return { Message: "Failed", Error: error };
    });
}
function padLeft(nr, n, str) {
  return Array(n - String(nr).length + 1).join(str || "0") + nr;
}
async function getPatternFromChangeHistory(connection) {}

// async function testVKGI(req, res) {
//     const successReceipt = await receiptPdf('jbn');

//     let payload = {
//         html: successReceipt,
//     };
//     let createPdf = await axios.post(
//         process.env.externalServer,
//         payload
//     );

//     let sentMail = await sendEmail(
//         "sendgrid",
//         ["jayanthinathan.c@zenqore.com","prashanth.p@zenqore.com"],
//         "noreply@zenqore.com",
//         "ZQ EDU-RECEIPT",
//         'PFA',
//         createPdf.data.file);
//     res.send({ success: true, message: "Receipt Email Sent" });
// }

module.exports = {
  // getShortCoursePlan: getShortCoursePlan,
  nextPayment: addShortCoursePlan,
  getSingleCoursePlan: getSingleCoursePlan,
  getDemandNoteShortCourse: getDemandNoteShortCourse,
  storePaymentData: storePaymentData,
  getRazorpaylink: getRazorpaylink,
  // testVKGI: testVKGI
};
