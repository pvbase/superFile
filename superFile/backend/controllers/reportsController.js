const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const transactionCollectionName = "transactions";
const feeLedgerCollectionName = "feesledgers";
const StudentSchema = require("../models/studentModel");
const FeeTypeSchema = require("../models/feeTypeModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const GuardianSchema = require("../models/guardianModel");
const FeeManagerSchema = require("../models/feesManagerModel");
const feesLedgerSchema = require("../models/feesLedgerModel");
const StudentFeeMapSchema = require("../models/studentFeeMapModel");
const transactionsSchema = require("../models/transactionsModel");
const ApplicationSchema = require("../models/ken42/applicationModel");
const feeplanInstallmentschema = require("../models/feeplanInstallment");
const feeplanschema = require("../models/feeplanModel");

var _ = require("lodash");
var moment = require("moment");
const { map } = require("lodash");

async function createReports(req, res) {
  var dbUrl = req.headers.resource;

  console.log("dburl", dbUrl);
  const { type } = req.params;
  const {
    orgId,
    page,
    limit,
    sortType,
    sortKey,
    campusId,
    userId,
    filterKey,
    fromDate,
    toDate,
  } = req.query;
  var classbatchName =
    req.query.classbatchName == undefined
      ? undefined
      : String(req.query.classbatchName).toLowerCase();
  var searchKey =
    req.query.searchKey == undefined
      ? undefined
      : String(req.query.searchKey).toLowerCase();
  let dbConnection = await createDatabase(orgId, dbUrl);
  var withoutSchema = mongoose.Schema({}, { strict: false });

  transactionsSchema.index({
    studentName: "text",
    class: "text",
    studentRegId: "text",
    amount: "text",
    currency: "text",
    academicYear: "text",
    "data.mode": "text",
    "data.method": "text",
    paymentTransactionId: "text",
  });

  var transactionModel = await dbConnection.model(
    transactionCollectionName,
    transactionsSchema,
    transactionCollectionName
  );

  var feeledgerModel = await dbConnection.model(
    feeLedgerCollectionName,
    feesLedgerSchema,
    feeLedgerCollectionName
  );
  let trparams;
  // searchKey = "/" + searchKey + '/i'

  if (
    campusId == "undefined" ||
    campusId == undefined ||
    campusId == "null" ||
    campusId.toLowerCase() == "all"
  ) {
    console.log("success");
    if (userId == "undefined") {
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = { transactionSubType: type };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = { transactionSubType: type, $text: { $search: searchKey } };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
        };
      } else {
        trparams = { transactionSubType: type };
      }
    } else if (userId && userId.toLowerCase() == "all") {
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = { transactionSubType: type };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = { transactionSubType: type, $text: { $search: searchKey } };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
        };
      } else {
        trparams = { transactionSubType: type };
      }
    } else {
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = { transactionSubType: type, createdBy: userId };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = {
          transactionSubType: type,
          $text: { $search: searchKey },
          createdBy: userId,
        };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          createdBy: userId,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
          createdBy: userId,
        };
      } else {
        trparams = { transactionSubType: type, createdBy: userId };
      }
    }
  } else if (campusId.toLowerCase() !== "all") {
    if (userId == "undefined") {
      var campid = campusId;
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = { transactionSubType: type, campusId: campid };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = {
          transactionSubType: type,
          $text: { $search: searchKey },
          campusId: campid,
        };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          campusId: campid,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
          campusId: campid,
        };
      } else {
        trparams = { transactionSubType: type, campusId: campid };
      }
    } else if (userId.toLowerCase() == "all") {
      var campid = campusId;
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = { transactionSubType: type, campusId: campid };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = {
          transactionSubType: type,
          $text: { $search: searchKey },
          campusId: campid,
        };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          campusId: campid,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
          campusId: campid,
        };
      } else {
        trparams = { transactionSubType: type, campusId: campid };
      }
    } else {
      var campid = campusId;
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = {
          transactionSubType: type,
          campusId: campid,
          createdBy: userId,
        };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = {
          transactionSubType: type,
          $text: { $search: searchKey },
          campusId: campid,
          createdBy: userId,
        };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          campusId: campid,
          createdBy: userId,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
          campusId: campid,
          createdBy: userId,
        };
      } else {
        trparams = {
          transactionSubType: type,
          campusId: campid,
          createdBy: userId,
        };
      }
    }
  } else {
    if (userId == "undefined") {
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = { transactionSubType: type };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = { transactionSubType: type, $text: { $search: searchKey } };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
        };
      } else {
        trparams = { transactionSubType: type };
      }
    } else if (userId.toLowerCase() == "all") {
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = { transactionSubType: type };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = { transactionSubType: type, $text: { $search: searchKey } };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
        };
      } else {
        trparams = { transactionSubType: type };
      }
    } else {
      if (classbatchName && classbatchName == "all" && !req.query.searchKey) {
        trparams = { transactionSubType: type, createdBy: userId };
      } else if (
        classbatchName &&
        classbatchName == "all" &&
        req.query.searchKey
      ) {
        trparams = {
          transactionSubType: type,
          $text: { $search: searchKey },
          createdBy: userId,
        };
      } else if (classbatchName && classbatchName !== "all" && !searchKey) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          createdBy: userId,
        };
      } else if (
        classbatchName &&
        classbatchName !== "all" &&
        req.query.searchKey != undefined
      ) {
        trparams = {
          transactionSubType: type,
          class: req.query.classbatchName,
          $text: { $search: searchKey },
          createdBy: userId,
        };
      } else {
        trparams = { transactionSubType: type, createdBy: userId };
      }
    }
  }
  if (
    req.query.section &&
    req.query.section != undefined &&
    req.query.section.toLowerCase() != "all" &&
    req.query.section != null
  ) {
    trparams = [
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "students",
        },
      },
      {
        $match: trparams,
      },
    ];
    trparams[1].$match["students.section"] = req.query.section;
  } else {
    trparams = [
      {
        $match: trparams,
      },
    ];
  }
  // console.log(trparams)
  let trparams2 = [
    {
      $lookup: {},
    },
    {
      $match: {
        transactionSubType: type,
      },
    },
  ];
  if (classbatchName && classbatchName !== "all") {
    trparams2[1].$match.programPlan = mongoose.Types.ObjectId(req.query.classbatchName);
  }
  if (req.query.searchKey) {
    trparams2[1].$match.$or = [
      { studentName: { $regex: searchKey, $options: "i" } },
      { studentRegId: { $regex: searchKey, $options: "i" } },
      { class: { $regex: searchKey, $options: "i" } },
      { amount: { $regex: searchKey, $options: "i" } },
      { currency: { $regex: searchKey, $options: "i" } },
      { academicYear: { $regex: searchKey, $options: "i" } },
      { "data.mode": { $regex: searchKey, $options: "i" } },
      { "data.method": { $regex: searchKey, $options: "i" } },
      { paymentTransactionId: { $regex: searchKey, $options: "i" } },
    ];
  }
  // if (req.query.searchKey && !isNaN(Number(searchKey))) {
  //   trparams2[1].$match.$or = [
  //     { amount: { $gte: Number(searchKey), $lte: Number(searchKey) } },
  //   ];
  // }
  if (req.query.fromDate && req.query.toDate) {
    console.log("date range ");
    let toDate1 = new Date(req.query.toDate);
    toDate1.setDate(toDate1.getDate() + 1);
    trparams2[1].$match.createdAt = {
      $gte: new Date(fromDate),
      $lt: new Date(toDate1),
    };
  }
  if (
    campusId !== undefined &&
    campusId !== null &&
    campusId !== "" &&
    campusId.toLowerCase() !== "all"
  ) {
    trparams2[1].$match.campusId = campusId;
  }
  if (
    userId &&
    userId !== undefined &&
    userId !== null &&
    userId !== "" &&
    userId.toLowerCase() !== "all"
  ) {
    trparams2[1].$match.createdBy = userId;
  }
  if (
    req.query.section &&
    req.query.section !== undefined &&
    req.query.section.toLowerCase() !== "all"
  ) {
    trparams2[0].$lookup = {
      from: "students",
      localField: "studentId",
      foreignField: "_id",
      as: "students",
    };
    trparams2[1].$match["students.section"] = req.query.section;
  }
  if (!req.query.section || req.query.section.toLowerCase() == "all") {
    trparams2 = [{ $match: trparams2[1].$match }];
  }
  // console.log(trparams2)
  var getDatasDetailsfp;
  var getDatasDetails;
  if (type == "feePayment") {
    getDatasDetailsfp = await transactionModel
      .aggregate(trparams2)
      .sort({ _id: -1 });
  } else {
    getDatasDetails = await transactionModel
      .aggregate(trparams)
      .sort({ _id: -1 });
  }
  var paginationDatas = {};
  let feeTypeModel = await dbConnection.model("feeTypes", FeeTypeSchema);
  let studentModel = await dbConnection.model("students", StudentSchema);
  let programPlanSchema = await dbConnection.model(
    "programplans",
    ProgramPlanSchema
  );
  let feeManagerSchema = dbConnection.model("feemanagers", FeeManagerSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let guardianModel = dbConnection.model("guardian", GuardianSchema);
  var responseData = [];
  var modifiedType = type.toLowerCase();
  if (modifiedType == "demandnote") {
    //modified
    let { page, limit } = req.query;
    console.log(
      "1",
      page != undefined &&
      limit != undefined &&
      searchKey == undefined &&
      String(classbatchName).toLowerCase() == "all"
    );

    if (
      page != undefined &&
      limit != undefined &&
      searchKey == undefined &&
      String(classbatchName).toLowerCase() == "all"
    ) {
      page = Number(page);
      limit = Number(limit);
      const demandNoteReport = await createDemandNoteReport(
        dbConnection,
        limit,
        page,
        searchKey,
        campusId,
        userId
      );
      responseData = demandNoteReport;
    } else if (searchKey != undefined || classbatchName != undefined) {
      const demandNoteReport = await createDemandNoteReport(
        dbConnection,
        undefined,
        undefined,
        searchKey,
        campusId,
        userId
      );
      let searchData = [];
      demandNoteReport.map((item) => {
        let feeSearch = false;
        item.data.students[0].feesBreakup.map((fb) => {
          if (String(fb.description).toLowerCase().includes(searchKey)) {
            feeSearch = true;
          }
        });
        if (
          classbatchName != undefined &&
          String(classbatchName).toLowerCase() != "all" &&
          searchKey != undefined
        ) {
          console.log("if");
          if (
            (String(item.displayName).toLowerCase().includes(searchKey) ||
              String(item.data.students[0].academicYear)
                .toLowerCase()
                .includes(searchKey) ||
              String(item.data.students[0].class)
                .toLowerCase()
                .includes(searchKey) ||
              String(item.data.students[0].dueDate)
                .toLowerCase()
                .includes(searchKey) ||
              String(item.data.students[0].regId)
                .toLowerCase()
                .includes(searchKey) ||
              String(item.data.students[0].studentName)
                .toLowerCase()
                .includes(searchKey) ||
              String(item.todayDate).toLowerCase().includes(searchKey) ||
              String(item.paymentStatus).toLowerCase().includes(searchKey) ||
              String(item.data.totalFees).toLowerCase().includes(searchKey) ||
              String(item.status).toLowerCase().includes(searchKey) ||
              feeSearch) &&
            String(classbatchName).toLowerCase() ==
            String(item.data.students[0].class).toLowerCase()
          ) {
            searchData.push(item);
          }
        } else if (classbatchName != undefined && searchKey == undefined) {
          console.log("else if");
          if (String(classbatchName).toLowerCase() != "all") {
            if (
              String(classbatchName).toLowerCase() ==
              String(item.data.students[0].class).toLowerCase()
            ) {
              searchData.push(item);
            }
          } else {
            searchData.push(item);
          }
        } else {
          console.log("else");
          if (
            String(item.displayName).toLowerCase().includes(searchKey) ||
            String(item.data.students[0].academicYear)
              .toLowerCase()
              .includes(searchKey) ||
            String(item.data.students[0].class)
              .toLowerCase()
              .includes(searchKey) ||
            String(item.data.students[0].dueDate)
              .toLowerCase()
              .includes(searchKey) ||
            String(item.data.students[0].regId)
              .toLowerCase()
              .includes(searchKey) ||
            String(item.data.students[0].studentName)
              .toLowerCase()
              .includes(searchKey) ||
            String(item.todayDate).toLowerCase().includes(searchKey) ||
            String(item.paymentStatus).toLowerCase().includes(searchKey) ||
            String(item.data.totalFees).toLowerCase().includes(searchKey) ||
            String(item.status).toLowerCase().includes(searchKey) ||
            feeSearch
          ) {
            searchData.push(item);
          }
        }
      });
      let paginated = await Paginator(
        (searchKey == undefined &&
          String(classbatchName).toLowerCase() == "all") ||
          (searchKey == undefined && classbatchName == undefined)
          ? demandNoteReport
          : searchData,
        req.query.page,
        req.query.limit
      );
      console.log("paginated", paginated);
      responseData.push({
        data: paginated.data,
        metadata: [
          {
            page: paginated.page,
            nextPage: paginated.nextPage,
            total: paginated.totalRecord,
            totalPages: paginated.totalPages,
          },
        ],
      });
    } else if (searchKey == undefined && classbatchName == undefined) {
      const demandNoteReport = await createDemandNoteReport(
        dbConnection,
        undefined,
        undefined,
        searchKey,
        campusId,
        userId
      );
      let paginated = await Paginator(
        demandNoteReport,
        req.query.page,
        req.query.limit
      );
      responseData.push({
        data: paginated.data,
        metadata: [
          {
            page: paginated.page,
            nextPage: paginated.nextPage,
            total: paginated.totalRecord,
            totalPages: paginated.totalPages,
          },
        ],
      });
    }
    // else {

    //   return res.status(400).json({
    //     status: 'failure',
    //     message: "Please check the parameters"
    //   })
    // }
  } else if (modifiedType == "feepayment") {
    // if (classbatchName != null || page != undefined || limit != undefined) {
    //   console.log("here if")
    //   paginationDatas = await Paginator(getDatasDetails, page, limit);
    // }  else
    // if (
    //   classbatchName != undefined ||
    //   page != undefined ||
    //   limit != undefined
    // ) {
    // if (classbatchName != null) {
    let totalAmount = 0;
    let totalPending = 0;
    let totalPaidAmount = 0;
    let totalCash = 0;
    let totalCheque = 0;
    let totalCard = 0;
    let totalNetbanking = 0;
    let totalWallet = 0;
    let totalUpi = 0;
    let totalPaidFeePlan = 0;
    var searchData = [];
    var getDatasDetails2 = [];

    var getDatasDetails2 =
      searchData.length > 0 ? searchData : getDatasDetailsfp;
    if (req.query.page && req.query.limit) {
      feepaymentData = await Paginator(
        getDatasDetails2,
        Number(req.query.page),
        Number(req.query.limit)
      );
    } else {
      feepaymentData = await Paginator(
        getDatasDetails2,
        1,
        getDatasDetails2.length
      );
    }

    console.log(
      "feepaymentdata",
      feepaymentData.totalRecord,
      feepaymentData.totalPages,
      feepaymentData.data.length
    );

    var transactionDetails = feepaymentData.data;
    var fpData = [];
    let dueAmt;
    let totAmt;
    let feePlanModel = dbConnection.model("studentfeeplans", feeplanschema);
    let feeInstallmentPlanModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let feePlanPending = 0;
    for (let i = 0; i < getDatasDetails2.length; i++) {
      // console.log(i)
      const element = getDatasDetails2[i];
      let feePlanData = await feePlanModel.findOne({
        studentRegId: element["studentRegId"].toUpperCase(),
      });
      if (!feePlanData) {
        console.log("reg", element["studentRegId"]);
        feePlanData = await feePlanModel.findOne({
          studentRegId: element["studentRegId"],
        });
      }
      // totalDue = parseFloat(fesMapData._doc["amount"]);
      // totalPaid = totalPaid + parseFloat(element["amount"]);
      totalAmount = isNaN(parseFloat(feePlanData._doc.plannedAmount))
        ? 0
        : totalAmount + parseFloat(feePlanData._doc.plannedAmount);

      if (element.data.mode == "cash" || element.data.method == "cash") {
        totalCash = totalCash + parseFloat(element["amount"]);
      }
      else if (element.data.mode == "cheque" || element.data.method == "cheque") {
        totalCheque = totalCheque + parseFloat(element["amount"]);
      }
      else if (
        element.data.mode == "netbanking" || element.data.method == "netbanking"
      ) {
        totalNetbanking = totalNetbanking + parseFloat(element["amount"]);
      }
      else if (
        element.data.mode == "wallet" || element.data.method == "wallet"
      ) {
        totalWallet = totalWallet + parseFloat(element["amount"]);
      }
      else if (element.data.mode == "card" || element.data.method == "card") {
        totalCard = totalCard + parseFloat(element["amount"]);
      }
      else if (element.data.mode == "upi" || element.data.method == "upi") {
        totalUpi = totalUpi + parseFloat(element["amount"]);
      }
      totalPaidAmount = totalPaidAmount + parseFloat(element["amount"]);
      totalPaidFeePlan =
        Number(totalPaidFeePlan) + Number(feePlanData._doc.paidAmount);
      totalPending = Number(totalAmount) - Number(totalPaidAmount);
      feePlanPending =
        Number(feePlanPending) + Number(feePlanData._doc.pendingAmount);
    }

    for (let i = 0; i < transactionDetails.length; i++) {
      const element = transactionDetails[i];
      var fbBreakUp = [];
      let fpElt = {};
      let feePlandata = await feePlanModel.findOne({
        studentRegId: element.studentRegId,
      });

      let dummyObj = {};
      dummyObj.title = "Total",
        dummyObj.totalAmount = feePlandata._doc.plannedAmount;
      dummyObj.paidAmount = feePlandata._doc.paidAmount;
      dummyObj.pendingAmount = feePlandata._doc.pendingAmount;
      fpElt['totalDetail'] = dummyObj;

      let feeinstdata = await feeInstallmentPlanModel.find({
        feePlanId: feePlandata._doc._id,
      });
      var refundDet = (refundDet = await transactionModel.findOne({
        paymentRefId: element["displayName"],
        transactionSubType: "refund",
      }));
      // let fesMapData = await feeMapModel.findOne({
      //   studentId: element["studentId"],
      // });
      let feeLedger = element["feesLedgerIds"];
      var totalDue = 0;
      var totalPaid = 0;
      var totalBalance = 0;
      var stat;
      fpElt["displayName"] = element["displayName"];
      fpElt["studentName"] = element["studentName"];
      fpElt["regId"] = element["studentRegId"];
      fpElt["academicYear"] = element["academicYear"];
      fpElt["classBatch"] = element["class"];
      fpElt["DemandId"] = element.relatedTransactions[0];
      fpElt["refundAmount"] = refundDet != null ? refundDet._doc["amount"] : 0;
      fpElt["description"] = [];
      fpElt["paymentDetails"] = element;
      for (let j = 0; j < feeinstdata.length; j++) {
        const fbEltss = element["feesLedgerIds"][j];
        // const fbElts = console.log(mongoose.Types.ObjectId(fbEltss));
        // var feeLedgerDet = await feeledgerModel.findOne({
        //   _id: fbEltss,
        // });
        // if (feeLedgerDet != null) {
        // var ftDet;
        // if (
        //   (req.query.campusId == undefined || req.query.campusId.toLowerCase() == "all") ||
        //   req.query.campusId == "undefined"
        // ) {
        //   ftDet = await feeTypeModel.findOne({
        //     displayName: feeLedgerDet._doc["feeTypeCode"],
        //   });
        // } else {
        //   ftDet = await feeTypeModel.findOne({
        //     displayName: feeLedgerDet._doc["feeTypeCode"],
        //     campusId: req.query.campusId,
        //   });
        // }

        // const proplanDet = await programPlanSchema.findOne({
        //   _id: element["programPlan"],
        // });
        totAmt = feePlandata._doc.amount;
        dueAmt = feePlandata._doc.pending;
        var feeManDet = {};
        // if (proplanDet != null) {
        //   feeManDet = await feeManagerSchema.findOne({
        //     programPlanId: proplanDet["_id"],
        //   });
        // }
        // var paymentDet = await transactionModel.findOne({
        //   _id: feeLedgerDet._doc["transactionId"],
        // });

        // let allFeeStr = fesMapData.transactionPlan.feesBreakUp;
        // for (oneL of allFeeStr) {
        // console.log("feetype", oneL);
        // let str1 = String(ftDet.displayName.trim());
        // let str2 = String(oneL.feeTypeCode.trim());
        // if (str1 == str2) {
        // let allPend =
        //   Number(oneL.amount) - Number(feePlandata._doc.pending);
        let pen;
        // if (Number(allPend) < 0) {
        //   pen = 0;
        // } else {
        // totalBalance = parseFloat(feePlandata._doc.pending);
        pen =
          feeinstdata[j + 1] &&
            Number(feeinstdata[j + 1]._doc["paidAmount"]) == 0
            ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
            : feeinstdata[j + 1] &&
              Number(feeinstdata[j + 1]._doc["paidAmount"]) > 0
              ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
              : Number(feeinstdata[j]._doc["pendingAmount"]);
        // }
        if (
          Number(feeinstdata[j]._doc["paidAmount"]) > 0 &&
          Number(element["amount"]) == Number(feePlandata._doc["plannedAmount"])
        ) {
          totalBalance =
            feeinstdata[j + 1] &&
              Number(feeinstdata[j + 1]._doc["paidAmount"]) == 0
              ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
              : feeinstdata[j + 1] &&
                Number(feeinstdata[j + 1]._doc["paidAmount"]) > 0
                ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
                : Number(feeinstdata[j]._doc["pendingAmount"]);

          await fpElt["description"].push({
            name: feePlandata._doc.plannedAmountBreakup[0].title,
            due: feeinstdata[j]._doc.plannedAmount,
            paid:
              Number(element["amount"]) ==
                Number(feePlandata._doc["plannedAmount"])
                ? Number(feeinstdata[j]._doc["paidAmount"])
                : Number(element["amount"]),
            paidDate: await onDateFormat(element["transactionDate"]),
            balance:
              Number(element["amount"]) ==
                Number(feePlandata._doc["plannedAmount"])
                ? 0
                : pen,
            status: feeinstdata[j]._doc["status"],
            txnId: element.paymentTransactionId,
          });
        } else if (
          Number(element["amount"]) ==
          Number(feeinstdata[j]._doc["plannedAmount"])
        ) {
          totalBalance =
            feeinstdata[j + 1] &&
              Number(feeinstdata[j + 1]._doc["paidAmount"]) == 0
              ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
              : feeinstdata[j + 1] &&
                Number(feeinstdata[j + 1]._doc["paidAmount"]) > 0
                ? Number(feeinstdata[j + 1]._doc["plannedAmount"])
                : Number(feeinstdata[j]._doc["pendingAmount"]);
          await fpElt["description"].push({
            name: feePlandata._doc.plannedAmountBreakup[0].title,
            due: feeinstdata[j]._doc.plannedAmount,
            paid:
              Number(element["amount"]) ==
                Number(feePlandata._doc["plannedAmount"])
                ? Number(feeinstdata[j]._doc["paidAmount"])
                : Number(element["amount"]),
            paidDate: await onDateFormat(element["transactionDate"]),
            balance:
              Number(element["amount"]) ==
                Number(feePlandata._doc["plannedAmount"])
                ? 0
                : pen,
            status: element["status"],
            txnId: element.paymentTransactionId,
          });
        }
        if (feeinstdata.length == 1) {
          pen = Number(feeinstdata[j]._doc["pendingAmount"]);
          totalBalance = Number(feeinstdata[j]._doc["pendingAmount"]);
          await fpElt["description"].push({
            name: feePlandata._doc.plannedAmountBreakup[0].title,
            due: feeinstdata[j]._doc.plannedAmount,
            paid: Number(parseFloat(element["amount"])),
            paidDate: await onDateFormat(element["transactionDate"]),
            balance: pen,
            status: element["status"],
            txnId: element.paymentTransactionId,
          });
          totalDue = parseFloat(feePlandata._doc["plannedAmount"]);
          // totalPaid = totalPaid + parseFloat(feeinstdata[j]._doc["paidAmount"]);
          totalPaid = parseFloat(feeinstdata[j]._doc["paidAmount"]);
        } else {
          totalDue = parseFloat(feePlandata._doc["plannedAmount"]);
          // totalPaid = totalPaid + parseFloat(feeinstdata[j]._doc["paidAmount"]);
          totalPaid = parseFloat(element["amount"]);
        }
        // }
        // }

        // totbal  =  pen;
        // if (element.data.mode == "cash") {
        //   totalCash = totalCash + parseFloat(feeLedgerDet._doc["paidAmount"]);
        // } else if (element.data.mode == "cheque") {
        //   totalCheque =
        //     totalCheque + parseFloat(feeLedgerDet._doc["paidAmount"]);
        // } else if (element.data.mode == "netbanking" || element.data.method == "netbanking") {
        //   totalNetbanking =
        //     totalNetbanking + parseFloat(feeLedgerDet._doc["paidAmount"]);
        // } else if (element.data.mode == "wallet" || element.data.method == "wallet") {
        //   totalWallet =
        //     totalWallet + parseFloat(feeLedgerDet._doc["paidAmount"]);
        // } else if (element.data.mode == "card" || element.data.method == "card") {
        //   totalCard = totalCard + parseFloat(feeLedgerDet._doc["paidAmount"]);
        // } else if (element.data.mode == "upi" || element.data.mode == "upi") {
        //   totalUpi = totalUpi + parseFloat(feeLedgerDet._doc["paidAmount"]);
        // }
        // totalPaidAmount = totalPaidAmount + parseFloat(totalPaid);
        // if(feeLedger.length==j+1){
        // console.log("feesPaid", totalDue ,fesMapData._doc.pending, fesMapData._doc.paid, totalBalance, parseFloat(feeLedgerDet._doc["paidAmount"]),parseFloat(feeLedgerDet._doc["pendingAmount"]));
        // }
        // }
      }
      // console.log("descr", fpElt["description"])
      // let totBal;
      // if (Number(totalBalance) < 0) {
      //   totBal = 0;
      // } else {
      //   totBal = totalBalance;
      // }
      if (fpElt["description"]) {
        // await fpElt["description"].push({
        //   name: "Total",
        //   due: totalDue,
        //   paid: totalPaid,
        //   paidDate: "-",
        //   balance:
        //     Number(element["amount"]) == Number(totalDue) ? 0 : totalBalance,
        //   status: Number(totalDue) > 0 ? "Partial" : "Paid",
        //   mode: element.data.mode,
        //   txnId: element.paymentTransactionId,
        // });
        fpElt["totalPlannedAmount"] = feePlandata._doc["plannedAmount"];
        fpElt["totalPaidAmount"] = feePlandata._doc["paidAmount"];
        fpElt["totalPendingAmount"] = feePlandata._doc["pendingAmount"];
        fpElt["previousPaidAmount"] = 0;
        fpElt["ledgerPendingAmount"] = 0;
        await feeledgerModel.find({ transactionDisplayName: String(element["displayName"]) }, (legErr, legResp) => {
          if (legResp.length == 0) { }
          else {
            fpElt["previousPaidAmount"] = legResp[0]._doc.pendingAmount;
          }
        })
        var getLedgerIds = element.feesLedgerIds;
        await feeledgerModel.find({ _id: mongoose.Types.ObjectId(getLedgerIds[getLedgerIds.length - 1]) }, (ledErr, ledResp) => {
          if (ledResp.length == 0) { }
          else {
            // console.log(ledResp[0]._doc.pendingAmount, ledResp[0]._doc.transactionDisplayName);
            fpElt["ledgerPendingAmount"] = ledResp[0]._doc.pendingAmount
          }
        })
        await fpElt["description"].push({
          name: "Total",
          due: totalDue,
          paid: totalPaid,
          paidDate: "-",
          balance: Number(totalDue) - Number(totalPaid),
          status: Number(totalDue) > 0 ? "Partial" : "Paid",
          mode: element.data.mode,
          txnId: element.paymentTransactionId,
        });
      }
      await fpData.push(fpElt);
      // totalPending = totalPending + parseFloat(fesMapData._doc["pending"]);
      // totalAmount = isNaN(parseFloat(fesMapData._doc.amount))
      //   ? 0
      //   : totalAmount + parseFloat(fesMapData._doc.amount);
    }
    // if(req.query.searchKey){
    //   getDatasDetails.map((item1) => {
    //     let item = item1._doc
    //     let feeSearch = false;
    //     item.description.map((fb) => {
    //       if (
    //         String(fb.name).toLowerCase().includes(searchKey) ||
    //         String(fb.balance).toLowerCase().includes(searchKey) ||
    //         String(fb.due).toLowerCase().includes(searchKey) ||
    //         String(fb.paid).toLowerCase().includes(searchKey) ||
    //         String(fb.paidDate).toLowerCase().includes(searchKey) ||
    //         String(fb.status).toLowerCase().includes(searchKey) ||
    //         String(fb.txnId).toLowerCase().includes(searchKey)
    //       ) {
    //         feeSearch = true;
    //       }
    //     });
    //     if (
    //       classbatchName != undefined &&
    //       String(classbatchName).toLowerCase() != "all" &&
    //       searchKey != undefined
    //     ) {
    //       if (
    //         (String(item.displayName).toLowerCase().includes(searchKey) ||
    //           String(item.DemandId).toLowerCase().includes(searchKey) ||
    //           String(item.regId).toLowerCase().includes(searchKey) ||
    //           String(item.studentName).toLowerCase().includes(searchKey) ||
    //           String(item.academicYear).toLowerCase().includes(searchKey) ||
    //           String(item.classBatch).toLowerCase().includes(searchKey) ||
    //           feeSearch) &&
    //         String(classbatchName).toLowerCase() ==
    //         String(item.classBatch).toLowerCase()
    //       ) {
    //         searchData.push(item);
    //       }
    //     } else if (classbatchName != undefined && searchKey == undefined) {
    //       if (String(classbatchName).toLowerCase() != "all") {
    //         if (
    //           String(classbatchName).toLowerCase() ==
    //           String(item.classBatch).toLowerCase()
    //         ) {
    //           searchData.push(item);
    //         }
    //       } else {
    //         searchData.push(item);
    //       }
    //     } else {
    //       if (
    //         String(item.displayName).toLowerCase().includes(searchKey) ||
    //         String(item.DemandId).toLowerCase().includes(searchKey) ||
    //         String(item.regId).toLowerCase().includes(searchKey) ||
    //         String(item.studentName).toLowerCase().includes(searchKey) ||
    //         String(item.academicYear).toLowerCase().includes(searchKey) ||
    //         String(item.classBatch).toLowerCase().includes(searchKey) ||
    //         feeSearch
    //       ) {
    //         searchData.push(item);
    //       }
    //     }
    //   });
    // }

    // console.log("search condition", searchKey == undefined, String(classbatchName).toLowerCase() == "all", searchKey == undefined, classbatchName == undefined);
    let paginated = {};

    // await Paginator(
    //   (searchKey == undefined &&
    //     String(classbatchName).toLowerCase() == "all") ||
    //     (searchKey == undefined && classbatchName == undefined)
    //     ? fpData
    //     : searchData,
    //   req.query.page,
    //   req.query.limit
    // );
    // console.log(paginated)
    // console.log(fpData)
    paginated.totalAmount = totalAmount;
    paginated.totalPending = totalPending;
    paginated.totalPaid = totalPaid;
    await responseData.push({
      data: fpData,
      totalAmount: totalAmount,
      totalPending: totalPending,
      totalPaid: totalPaidAmount,
      totalCash: totalCash,
      totalCheque: totalCheque,
      totalCard: totalCard,
      totalNetbanking: totalNetbanking,
      totalWallet: totalWallet,
      totalUpi: totalUpi,
      metadata: [
        {
          page: feepaymentData.page,
          nextPage: feepaymentData.nextPage,
          total: feepaymentData.totalRecord,
          totalPages: feepaymentData.totalPages,
        },
      ],
    });
    // } else if (page != undefined || limit != undefined) {
    //   paginationDatas = await Paginator(getDatasDetails, page, limit);
    // }
    // } else {
    //   paginationDatas = await Paginator(
    //     getDatasDetails,
    //     1,
    //     getDatasDetails.length
    //   );
    // }

    // if (paginationDatas.page != undefined) {
    //   var transactionDetails = paginationDatas.data;
    //   var fpData = [];
    //   for (let i = 0; i < transactionDetails.length; i++) {
    //     const element = transactionDetails[i]._doc;
    //     var fbBreakUp = [];
    //     let fpElt = {};
    //     var refundDet = (refundDet = await transactionModel.findOne({
    //       paymentRefId: element["displayName"],
    //       transactionSubType: "refund",
    //     }));
    //     for (let j = 0; j < element["feesLedgerIds"].length; j++) {
    //       const fbElts = element["feesLedgerIds"][j];
    //       var feeLedgerDet = await feeledgerModel.findOne({ _id: fbElts });
    //       if (feeLedgerDet != null) {
    //         if (j == 0) {
    //           fpElt["displayName"] = element["displayName"];
    //           fpElt["studentName"] = feeLedgerDet._doc["studentName"];
    //           fpElt["regId"] = feeLedgerDet._doc["studentRegId"];
    //           fpElt["academicYear"] = feeLedgerDet._doc["academicYear"];
    //           fpElt["classBatch"] = feeLedgerDet._doc["class"];
    //           fpElt["DemandId"] = feeLedgerDet._doc["primaryTransaction"];
    //           fpElt["refundAmount"] =
    //             refundDet != null ? refundDet._doc["amount"] : 0;
    //           fpElt["description"] = [];
    //         }
    //         const ftDet = await feeTypeModel.findOne({
    //           displayName: feeLedgerDet._doc["feeTypeCode"],
    //         });
    //         let fesMapData = await feeMapModel.findOne({
    //           studentId: feeLedgerDet._doc["studentId"],
    //         });

    //         const proplanDet = await programPlanSchema.findOne({
    //           _id: fesMapData._doc["programPlanId"],
    //         });
    //         var feeManDet = {};
    //         if (proplanDet != null) {
    //           feeManDet = await feeManagerSchema.findOne({
    //             programPlanId: proplanDet["_id"],
    //           });
    //         }
    //         var paymentDet = await transactionModel.findOne({
    //           _id: feeLedgerDet._doc["transactionId"],
    //         });
    //         if (!feeManDet) {
    //           res.status(404).json({
    //             success: false,
    //             message: "Unable to find Fee manager data",
    //           });
    //         }

    //         fpElt["description"].push({
    //           name: ftDet != null ? ftDet["title"] : null,
    //           due:
    //             feeManDet.feeDetails != undefined
    //               ? feeManDet.feeDetails.totalAmount
    //               : null,
    //           paid: feeLedgerDet._doc["paidAmount"],
    //           paidDate: await onDateFormat(element["transactionDate"]),
    //           balance: feeLedgerDet._doc["pendingAmount"],
    //           status: feeLedgerDet._doc["status"],
    //           txnId:
    //             paymentDet != null ? paymentDet._doc.paymentTransactionId : "-",
    //         });
    //       }
    //     }
    //     var totalDue = 0;
    //     var totalPaid = 0;
    //     var totalBalance = 0;
    //     if (fpElt.description != undefined) {
    //       for (
    //         let totalDN = 0;
    //         totalDN < fpElt["description"].length;
    //         totalDN++
    //       ) {
    //         const fbBreakUpElt = fpElt["description"][totalDN];
    //         totalDue = totalDue + Number(fbBreakUpElt["due"]);
    //         totalPaid = totalPaid + Number(fbBreakUpElt["paid"]);
    //         totalBalance = totalBalance + Number(fbBreakUpElt["balance"]);
    //       }
    //       fpElt["description"].push({
    //         name: "Total",
    //         due: totalDue,
    //         paid: totalPaid,
    //         paidDate: "-",
    //         balance: totalBalance,
    //         status:
    //           String(element["status"]).toLowerCase() == "partial"
    //             ? "Pending"
    //             : element["status"],
    //         txnId: "-",
    //       });
    //       fpData.push(fpElt);
    //     }
    //   }

    //   responseData.push({
    //     data: fpData,
    //     metadata: [
    //       {
    //         page: paginationDatas.page,
    //         nextPage: paginationDatas.nextPage,
    //         total: paginationDatas.totalRecord,
    //         totalPages: paginationDatas.totalPages,
    //       },
    //     ],
    //   });
    // }
  } else if (modifiedType == "feependingold") {
    const aggregatePipeline = [
      // { $match: { primaryTransaction: { $in: txnData.relatedTransactions } } },
      { $sort: { updatedAt: 1 } },
      {
        $group: {
          _id: { programPlan: "$programPlan", studentRegId: "$studentRegId" },
          totalDue: { $sum: "$dueAmount" },
          totalPaid: { $sum: "$paidAmount" },
          studentName: { $first: "$studentName" },
          feeLedgerCount: { $sum: 1 },
          details: {
            $push: {
              studentRegId: "$studentRegId",
              studentName: "$studentName",
              feeTypeCode: "$feeTypeCode",
              dueAmount: "$dueAmount",
              paidAmount: "$paidAmount",
            },
          },
        },
      },
      {
        $project: {
          // projection
          _id: 0,
          programPlan: "$_id.programPlan",
          studentRegId: "$_id.studentRegId",
          studentName: "$studentName",
          totalDue: { $round: ["$totalDue", 2] },
          totalPaid: { $round: ["$totalPaid", 2] },
          pendingAmount: { $subtract: ["$totalDue", "$totalPaid"] },
          feeLedgerCount: "$feeLedgerCount",
          details: "$details",
        },
      },
    ]; // aggregatePipeline
    const studPendingFeePipeline = [
      { $sort: { updatedAt: 1 } },
      {
        $group: {
          _id: { studentRegId: "$studentRegId" },
          totalDue: { $sum: "$dueAmount" },
          totalPaid: { $sum: "$paidAmount" },
          studentName: { $first: "$studentName" },
          feeLedgerCount: { $sum: 1 },
          details: {
            $push: {
              studentRegId: "$studentRegId",
              studentName: "$studentName",
              feeTypeCode: "$feeTypeCode",
              dueAmount: "$dueAmount",
              paidAmount: "$paidAmount",
            },
          },
        },
      },
      {
        $project: {
          // projection
          _id: 0,
          studentRegId: "$_id.studentRegId",
          studentName: "$studentName",
          totalDue: { $round: ["$totalDue", 2] },
          totalPaid: { $round: ["$totalPaid", 2] },
          pendingAmount: { $subtract: ["$totalDue", "$totalPaid"] },
          feeLedgerCount: "$feeLedgerCount",
          details: "$details",
        },
      },
      { $match: { pendingAmount: { $gt: 0 } } },
    ]; // aggregatePipeline
    let getDatasDetails = await feeledgerModel.aggregate(aggregatePipeline);
    let getPendingStudentDetails = await feeledgerModel.aggregate(
      studPendingFeePipeline
    );
    if (page != undefined || limit != undefined) {
      paginationDatas = await Paginator(getDatasDetails, page, limit);
    } else {
      paginationDatas = await Paginator(
        getDatasDetails,
        1,
        getDatasDetails.length
      );
    }
    var feePendingReport = paginationDatas.data;
    let fpr = {};
    for (let i = 0; i < feePendingReport.length; i++) {
      const element = feePendingReport[i];
      fpr[element.programPlan] =
        fpr[element.programPlan] == undefined ? [] : fpr[element.programPlan];
      fpr[element.programPlan].push(element);
    }
    var fprObjKey = Object.keys(fpr);
    var fprDet = [];
    for (let i = 0; i < fprObjKey.length; i++) {
      var ppDetails = await programPlanSchema.findOne({
        programCode: fprObjKey[i],
      });
      // const studentTotal = await studentModel.find({})
      //   if(i == 0) {
      var fprDetBasic = {
        programPlanId: fprObjKey[i],
        programPlanDisplayName:
          ppDetails == null ? fprObjKey[i] : ppDetails["displayName"],
        programPlanName: ppDetails == null ? null : ppDetails["title"],
        numberOfStudents: getDatasDetails.length,
        pendingStudents: getPendingStudentDetails.length,
        items: [],
      };
      //   }
      for (let j = 0; j < fpr[fprObjKey[i]].length; j++) {
        const fprInside = fpr[fprObjKey[i]][j];
        fprDetBasic["totalFees"] =
          fprDetBasic["totalFees"] == undefined
            ? fprInside["totalDue"]
            : Number(fprDetBasic["totalFees"]) + Number(fprInside["totalDue"]);
        fprDetBasic["totalFeesCollected"] =
          fprDetBasic["totalFeesCollected"] == undefined
            ? fprInside["totalPaid"]
            : Number(fprDetBasic["totalFeesCollected"]) +
            Number(fprInside["totalPaid"]);
        fprDetBasic["totalPending"] =
          fprDetBasic["totalPending"] == undefined
            ? fprInside["pendingAmount"]
            : Number(fprDetBasic["totalPending"]) +
            Number(fprInside["pendingAmount"]);
        fprDetBasic["items"].push({
          regId: fprInside["studentRegId"],
          studentName: fprInside["studentName"],
          programPlanName: ppDetails == null ? null : ppDetails._doc["title"],
          totalFees: fprInside["totalDue"],
          totalPaid: fprInside["totalPaid"],
          totalPending: fprInside["pendingAmount"],
        });
      }
      fprDet.push(fprDetBasic);
    }
    responseData = fprDet;
    // feeledgerModel
  } else if (modifiedType == "feepending") {
    const ppDatas = await programPlanSchema.find({}).sort({ _id: -1 });
    var getDatasDetails = [];
    const studentDetails = await studentModel.find({});
    for (let ppIndex = 0; ppIndex < ppDatas.length; ppIndex++) {
      const ppDatasElt = ppDatas[ppIndex];
      const ST = studentDetails.filter(
        (item) =>
          item._doc.programPlanId.toString() == ppDatasElt["_id"].toString()
      );
      if (ST.length > 0) {
        getDatasDetails.push(ppDatasElt);
      }
    }
    // if (page != undefined || limit != undefined) {
    //   paginationDatas = await Paginator(getDatasDetails, page, limit);
    // } else {
    paginationDatas = await Paginator(
      getDatasDetails,
      1,
      getDatasDetails.length
    );
    // }
    var ppDetails = getDatasDetails;
    var statementDetails = [];
    const feeLedgerDetails = await feeledgerModel.find({});
    const fmDetails = await feeManagerSchema.find({});
    for (let i = 0; i < ppDetails.length; i++) {
      const element = ppDetails[i]._doc;
      const fmDet = fmDetails.filter(
        (item) =>
          item._doc.programPlanId.toString() == element["_id"].toString()
      );
      const feeLedgerDet = feeLedgerDetails.filter(
        (item) => item._doc.programPlan.toString() == element["_id"].toString()
      );
      const feeLedgerDNDetails = await feeledgerModel.find({
        programPlan: element["programCode"],
        transactionSubType: "demandNote",
      });
      const feeLedgerFPDetails = await feeledgerModel.find({
        programPlan: element["programCode"],
        transactionSubType: "feePayment",
        pendingAmount: 0,
      });
      const studentTotal = studentDetails.filter(
        (item) =>
          item._doc.programPlanId.toString() == element["_id"].toString()
      );
      var statementRecord = {
        programPlanDisplayName: element["displayName"],
        programPlanId: element["programCode"],
        programPlanName: element["title"],
        numberOfStudents: studentTotal.length,
        pendingStudents:
          Number(studentTotal.length) -
          Number(feeLedgerFPDetails == null ? 0 : feeLedgerFPDetails.length),
        "PROGRAM FEE": 0,
        totalFees: 0,
        totalFeesCollected: 0,
        totalPending: 0,
        items: [],
      };
      for (let k = 0; k < fmDet.length; k++) {
        const fmDatas = fmDet[k]._doc;
        statementRecord["PROGRAM FEE"] =
          Number(statementRecord["PROGRAM FEE"]) +
          Number(fmDatas.feeDetails.totalAmount);
        statementRecord["totalFees"] =
          statementRecord["PROGRAM FEE"] * studentTotal.length;
      }
      if (feeLedgerDet.length == 0) {
        statementRecord["totalPending"] =
          statementRecord["PROGRAM FEE"] * studentTotal.length;
      }
      var feeAmtObj = {};
      for (let j = 0; j < feeLedgerDet.length; j++) {
        const ledgerElt = feeLedgerDet[j]._doc;
        var feeLedgerDNDet;
        if (ledgerElt["transactionSubType"] == "feePayment") {
          feeLedgerDNDet = feeLedgerDetails.find(
            (item) =>
              item._doc.transactionDisplayName ===
              ledgerElt["primaryTransaction"]
          );
        }

        var dueAmt =
          feeLedgerDNDet != undefined
            ? feeLedgerDNDet._doc["dueAmount"]
            : ledgerElt["dueAmount"];
        var paidAmt =
          ledgerElt["paidAmount"] != undefined ? ledgerElt["paidAmount"] : 0;
        statementRecord["totalFeesCollected"] =
          statementRecord["totalFeesCollected"] + Number(paidAmt);
        statementRecord["totalPending"] =
          Number(statementRecord["totalFees"]) -
          Number(statementRecord["totalFeesCollected"]);
        let fesMapData = await feeMapModel.findOne({
          studentId: ledgerElt["studentId"],
        });
        if (fesMapData != null) {
          const proplanDet = await programPlanSchema.findOne({
            _id: fesMapData["programPlanId"],
          });
          var feeManDet = {};
          if (proplanDet != null) {
            feeManDet = await feeManagerSchema.findOne({
              programPlanId: proplanDet["_id"],
            });
          }
          var tltAmt =
            ledgerElt["transactionSubType"] == "feePayment"
              ? 0
              : Number(feeManDet.feeDetails.totalAmount);
          feeAmtObj[ledgerElt["studentId"]] = {
            totalFees:
              feeAmtObj[ledgerElt["studentId"]] != undefined
                ? Number(
                  Number(feeAmtObj[ledgerElt["studentId"]]["totalFees"]) +
                  Number(tltAmt)
                )
                : Number(tltAmt),
            totalPaid:
              feeAmtObj[ledgerElt["studentId"]] != undefined
                ? Number(feeAmtObj[ledgerElt["studentId"]]["totalPaid"]) +
                Number(paidAmt)
                : paidAmt,
            totalFeesCollected:
              feeAmtObj[ledgerElt["studentId"]] != undefined
                ? statementRecord["totalFeesCollected"]
                : Number(statementRecord["totalFeesCollected"]),
          };
        }
      }
      for (let stj = 0; stj < studentTotal.length; stj++) {
        var studDet = studentTotal[stj]._doc;

        statementRecord["items"].push({
          studentName: `${studDet["firstName"]}${studDet["middleName"] == null ? "" : " " + studDet["middleName"]
            } ${studDet["lastName"]}`,
          regId: studDet["regId"],
          programPlanName: element["title"],
          totalFees:
            feeAmtObj[studDet["_id"]] != undefined
              ? feeAmtObj[studDet["_id"]]["totalFees"]
              : 0,
          totalPaid:
            feeAmtObj[studDet["_id"]] != undefined
              ? feeAmtObj[studDet["_id"]]["totalPaid"]
              : 0,
          totalPending:
            feeAmtObj[studDet["_id"]] != undefined
              ? Number(
                Number(feeAmtObj[studDet["_id"]]["totalFees"]) -
                Number(feeAmtObj[studDet["_id"]]["totalPaid"])
              )
              : 0,
        });
      }
      statementDetails.push(statementRecord);
    }
    var searchData = [];
    statementDetails.map((item) => {
      if (
        classbatchName != undefined &&
        String(classbatchName).toLowerCase() != "all" &&
        searchKey != undefined
      ) {
        if (
          (String(item["programPlanDisplayName"])
            .toLowerCase()
            .includes(searchKey) ||
            String(item["programPlanId"]).toLowerCase().includes(searchKey) ||
            String(item["programPlanName"]).toLowerCase().includes(searchKey) ||
            String(item["numberOfStudents"])
              .toLowerCase()
              .includes(searchKey) ||
            String(item["pendingStudents"]).toLowerCase().includes(searchKey) ||
            String(item["PROGRAM FEE"]).toLowerCase().includes(searchKey) ||
            String(item["totalFees"]).toLowerCase().includes(searchKey) ||
            String(item["totalFeesCollected"])
              .toLowerCase()
              .includes(searchKey) ||
            String(item["totalPending"]).toLowerCase().includes(searchKey)) &&
          String(classbatchName).toLowerCase() ==
          String(item.classBatch).toLowerCase()
        ) {
          searchData.push(item);
        }
      } else if (classbatchName != undefined && searchKey == undefined) {
        if (String(classbatchName).toLowerCase() != "all") {
          if (
            String(classbatchName).toLowerCase() ==
            String(item.programPlanName).toLowerCase()
          ) {
            searchData.push(item);
          }
        } else {
          searchData.push(item);
        }
      } else {
        if (
          String(item["programPlanDisplayName"])
            .toLowerCase()
            .includes(searchKey) ||
          String(item["programPlanId"]).toLowerCase().includes(searchKey) ||
          String(item["programPlanName"]).toLowerCase().includes(searchKey) ||
          String(item["numberOfStudents"]).toLowerCase().includes(searchKey) ||
          String(item["pendingStudents"]).toLowerCase().includes(searchKey) ||
          String(item["PROGRAM FEE"]).toLowerCase().includes(searchKey) ||
          String(item["totalFees"]).toLowerCase().includes(searchKey) ||
          String(item["totalFeesCollected"])
            .toLowerCase()
            .includes(searchKey) ||
          String(item["totalPending"]).toLowerCase().includes(searchKey)
        ) {
          searchData.push(item);
        }
      }
    });
    let paginated = await Paginator(
      (searchKey == undefined &&
        String(classbatchName).toLowerCase() == "all") ||
        (searchKey == undefined && classbatchName == undefined)
        ? statementDetails
        : searchData,
      req.query.page,
      req.query.limit
    );
    responseData.push({
      data: paginated.data,
      metadata: [
        {
          page: paginated.page,
          nextPage: paginated.nextPage,
          total: paginated.totalRecord,
          totalPages: paginated.totalPages,
        },
      ],
    });
  } else if (modifiedType == "feependingwithagg") {
    let { page, limit } = req.query;
    page = Number(page);
    limit = Number(limit);
    if (!page || !limit || isNaN(page) || isNaN(limit)) {
      return res.status(400).send({
        status: "failure",
        message: "Please provide limits",
      });
    }
    const feePendingReport = await createFeePendingReportReport(
      dbConnection,
      limit,
      page
    );
    responseData = feePendingReport;
  } else if (modifiedType == "studentstatement") {
    // const getDatasDetails = await studentModel.find({}).sort({ _id: -1 });
    const getDatasDetails = await studentModel.find({});
    // if (page != undefined || limit != undefined) {
    //   paginationDatas = await Paginator(getDatasDetails, page, limit);
    // } else {
    paginationDatas = await Paginator(
      getDatasDetails,
      1,
      getDatasDetails.length
    );
    // }
    var studentDet = paginationDatas.data;
    var statementDetails = [];
    for (let i = 0; i < studentDet.length; i++) {
      const element = studentDet[i]._doc;
      const feeLedgerDet = await feeledgerModel.find({
        studentId: element["_id"],
        transactionSubType: "feePayment",
      });
      var ppDetails = await programPlanSchema.findOne({
        _id: element["programPlanId"],
      });
      var statementRecord = {
        "REGISTRATION ID": element["regId"],
        "STUDENT NAME": `${element["firstName"]} ${element["lastName"]}`,
        "CLASS/BATCH": ppDetails._doc["title"],
        "ADMISSION DATE":
          element["admittedOn"] != null
            ? await onDateFormat(element["admittedOn"])
            : null,
        items: [],
      };
      for (let j = 0; j < feeLedgerDet.length; j++) {
        const ledgerElt = feeLedgerDet[j]._doc;
        const ftDet = await feeTypeModel.findOne({
          displayName: ledgerElt["feeTypeCode"],
        });

        const feeLedgerDNDet = await feeledgerModel.findOne({
          transactionDisplayName: ledgerElt["primaryTransaction"],
          studentId: element["_id"],
        });
        var transRef = null;
        if (feeLedgerDNDet != null) {
          if (ledgerElt["transactionSubType"] != "demandNote") {
            transRef = await transactionModel.findOne({
              _id: ledgerElt["transactionId"],
            });
          }
          statementRecord["items"].push({
            "DEMAND NOTE DATE":
              feeLedgerDNDet._doc["transactionSubType"] == "demandNote"
                ? await onDateFormat(feeLedgerDNDet._doc["transactionDate"])
                : "NA",
            "PAYMENT DATE":
              ledgerElt["transactionSubType"] == "demandNote"
                ? "NA"
                : await onDateFormat(ledgerElt["transactionDate"]),
            PARTICULARS: ftDet != null ? ftDet["title"] : null,
            "DUE AMOUNT":
              feeLedgerDNDet._doc["dueAmount"] != undefined
                ? feeLedgerDNDet._doc["dueAmount"]
                : null,
            "PAID AMOUNT": ledgerElt["paidAmount"],
            BALANCE: ledgerElt["pendingAmount"],
            "PAYMENT MODE":
              transRef != null
                ? transRef._doc.data.mode != undefined
                  ? transRef._doc.data.mode
                  : "-"
                : "-",
            // "Ledger Id": ledgerElt["_id"],
            // "Demond Note Id": feeLedgerDNDet._doc["_id"]
          });
        }
      }
      statementDetails.push(statementRecord);
    }
    // responseData = statementDetails;
    var searchData = [];
    statementDetails.map((item) => {
      if (
        classbatchName != undefined &&
        String(classbatchName).toLowerCase() != "all" &&
        searchKey != undefined
      ) {
        if (
          (String(item["REGISTRATION ID"]).toLowerCase().includes(searchKey) ||
            String(item["STUDENT NAME"]).toLowerCase().includes(searchKey) ||
            String(item["CLASS/BATCH"]).toLowerCase().includes(searchKey) ||
            String(item["ADMISSION DATE"]).toLowerCase().includes(searchKey)) &&
          String(classbatchName).toLowerCase() ==
          String(item["CLASS/BATCH"]).toLowerCase()
        ) {
          searchData.push(item);
        }
      } else if (classbatchName != undefined && searchKey == undefined) {
        if (String(classbatchName).toLowerCase() != "all") {
          if (
            String(classbatchName).toLowerCase() ==
            String(item["CLASS/BATCH"]).toLowerCase()
          ) {
            searchData.push(item);
          }
        } else {
          searchData.push(item);
        }
      } else {
        if (
          String(item["REGISTRATION ID"]).toLowerCase().includes(searchKey) ||
          String(item["STUDENT NAME"]).toLowerCase().includes(searchKey) ||
          String(item["CLASS/BATCH"]).toLowerCase().includes(searchKey) ||
          String(item["ADMISSION DATE"]).toLowerCase().includes(searchKey)
        ) {
          searchData.push(item);
        }
      }
    });
    let paginated = await Paginator(
      (searchKey == undefined &&
        String(classbatchName).toLowerCase() == "all") ||
        (searchKey == undefined && classbatchName == undefined)
        ? statementDetails
        : searchData,
      req.query.page,
      req.query.limit
    );
    responseData.push({
      data: paginated.data,
      metadata: [
        {
          page: paginated.page,
          nextPage: paginated.nextPage,
          total: paginated.totalRecord,
          totalPages: paginated.totalPages,
        },
      ],
    });
  } else if (modifiedType == "programplanstatement") {
    // const getDatasDetails = await programPlanSchema.find({}).sort({ _id: -1 });
    const getDatasDetails = await programPlanSchema.find({});
    // if (page != undefined || limit != undefined) {
    //   paginationDatas = await Paginator(getDatasDetails, page, limit);
    // } else {
    paginationDatas = await Paginator(
      getDatasDetails,
      1,
      getDatasDetails.length
    );
    // }
    var ppDetails = paginationDatas.data;
    var statementDetails = [];
    const feeLedgerDetails = await feeledgerModel.find({});
    const fmDetails = await feeManagerSchema.find({});
    const studentDetails = await studentModel.find({});
    for (let i = 0; i < ppDetails.length; i++) {
      const element = ppDetails[i]._doc;
      // const fmDet = fmDetails.filter(item => item._doc.programPlanId.toString() == element["_id"].toString())
      const fmDet = await feeManagerSchema.findOne({
        programPlanId: element["_id"].toString(),
      });
      const feeLedgerDet = feeLedgerDetails.filter(
        (item) => item._doc.programPlan.toString() == element["_id"].toString()
      );
      const studentTotal = studentDetails.filter(
        (item) =>
          item._doc.programPlanId.toString() == element["_id"].toString()
      );
      var statementRecord = {
        "PROGRAM ID": element["displayName"],
        "PROGRAM NAME": element["title"],
        "PROGRAM FEE": 0,
        "TOTAL STUDENTS": studentTotal.length,
        "TOTAL FEES": 0,
        "TOTAL FEES COLLECTED": 0,
        BALANCE: 0,
        items: [],
      };
      // for (let k = 0; k < fmDet.length; k++) {
      //     const fmDatas = fmDet[k]._doc;
      if (fmDet != null) {
        statementRecord["PROGRAM FEE"] =
          Number(statementRecord["PROGRAM FEE"]) +
          Number(fmDet.feeDetails.totalAmount);
        statementRecord["TOTAL FEES"] =
          statementRecord["PROGRAM FEE"] * studentTotal.length;
      }
      // }
      if (feeLedgerDet.length == 0) {
        statementRecord["BALANCE"] =
          statementRecord["PROGRAM FEE"] * studentTotal.length;
      }
      for (let j = 0; j < feeLedgerDet.length; j++) {
        const ledgerElt = feeLedgerDet[j]._doc;
        const ftDet = await feeTypeModel.findOne({
          displayName: ledgerElt["feeTypeCode"],
        });
        var feeLedgerDNDet;
        var transRef = null;
        if (ledgerElt["transactionSubType"] == "feePayment") {
          feeLedgerDNDet = feeLedgerDetails.find(
            (item) =>
              item._doc.transactionDisplayName ===
              ledgerElt["primaryTransaction"]
          );
          transRef = await transactionModel.findOne({
            _id: ledgerElt["transactionId"],
          });
        }
        var dueAmt =
          feeLedgerDNDet != undefined
            ? feeLedgerDNDet._doc["dueAmount"]
            : ledgerElt["dueAmount"];
        var addDue =
          ledgerElt["transactionSubType"] == "feePayment" ? dueAmt : 0;
        var paidAmt =
          ledgerElt["paidAmount"] != undefined ? ledgerElt["paidAmount"] : 0;
        // statementRecord["TOTAL FEES"] = Number(statementRecord["TOTAL FEES"]) + Number(addDue)
        // statementRecord["TOTAL FEES"] =
        //   Number(statementRecord["TOTAL FEES"]) * Number(studentTotal.length);
        statementRecord["TOTAL FEES COLLECTED"] =
          statementRecord["TOTAL FEES COLLECTED"] + Number(paidAmt);
        // statementRecord["BALANCE"] = Number(statementRecord["BALANCE"]) + (ledgerElt['transactionSubType'] == "demandNote" ? 0 : (dueAmt - paidAmt))
        statementRecord["BALANCE"] =
          Number(statementRecord["TOTAL FEES"]) -
          Number(statementRecord["TOTAL FEES COLLECTED"]);
        if (ledgerElt["transactionSubType"] == "feePayment") {
          statementRecord["items"].push({
            "TRANSACTION NO":
              transRef != null
                ? transRef._doc.paymentTransactionId != undefined
                  ? transRef._doc.paymentTransactionId
                  : "-"
                : "-",
            "RECEIPT NO":
              ledgerElt["transactionSubType"] == "feePayment"
                ? ledgerElt["transactionDisplayName"]
                : "-",
            "DEMAND NOTE NO": ledgerElt["primaryTransaction"],
            "TRANSACTION DATE": await onDateFormat(
              ledgerElt["transactionDate"]
            ),
            "STUDENT NAME": ledgerElt["studentName"],
            PARTICULARS: ftDet != null ? ftDet["title"] : null,
            "DUE AMOUNT": dueAmt,
            "PAID AMOUNT": paidAmt,
            BALANCE: ledgerElt["pendingAmount"],
          });
        }
      }
      statementDetails.push(statementRecord);
    }
    // responseData = statementDetails;
    var searchData = [];
    statementDetails.map((item) => {
      if (
        classbatchName != undefined &&
        String(classbatchName).toLowerCase() != "all" &&
        searchKey != undefined
      ) {
        if (
          (String(item["PROGRAM ID"]).toLowerCase().includes(searchKey) ||
            String(item["PROGRAM NAME"]).toLowerCase().includes(searchKey) ||
            String(item["PROGRAM FEE"]).toLowerCase().includes(searchKey) ||
            String(item["TOTAL STUDENTS"]).toLowerCase().includes(searchKey) ||
            String(item["TOTAL FEES"]).toLowerCase().includes(searchKey) ||
            String(item["TOTAL FEES COLLECTED"])
              .toLowerCase()
              .includes(searchKey) ||
            String(item["BALANCE"]).toLowerCase().includes(searchKey)) &&
          String(classbatchName).toLowerCase() ==
          String(item["PROGRAM NAME"]).toLowerCase()
        ) {
          searchData.push(item);
        }
      } else if (classbatchName != undefined && searchKey == undefined) {
        console.log("condition 2");
        if (String(classbatchName).toLowerCase() != "all") {
          if (
            String(classbatchName).toLowerCase() ==
            String(item["PROGRAM NAME"]).toLowerCase()
          ) {
            searchData.push(item);
          }
        } else {
          searchData.push(item);
        }
      } else {
        console.log("else", item);
        if (
          String(item["PROGRAM ID"]).toLowerCase().includes(searchKey) ||
          String(item["PROGRAM NAME"]).toLowerCase().includes(searchKey) ||
          String(item["PROGRAM FEE"]).toLowerCase().includes(searchKey) ||
          String(item["TOTAL STUDENTS"]).toLowerCase().includes(searchKey) ||
          String(item["TOTAL FEES"]).toLowerCase().includes(searchKey) ||
          String(item["TOTAL FEES COLLECTED"])
            .toLowerCase()
            .includes(searchKey) ||
          String(item["BALANCE"]).toLowerCase().includes(searchKey)
        ) {
          searchData.push(item);
        }
      }
    });
    let paginated = await Paginator(
      (searchKey == undefined &&
        String(classbatchName).toLowerCase() == "all") ||
        (searchKey == undefined && classbatchName == undefined)
        ? statementDetails
        : searchData,
      req.query.page,
      req.query.limit
    );
    responseData.push({
      data: paginated.data,
      metadata: [
        {
          page: paginated.page,
          nextPage: paginated.nextPage,
          total: paginated.totalRecord,
          totalPages: paginated.totalPages,
        },
      ],
    });
  } else if (modifiedType == "defaulterreport") {
    const sfmDatas = await feeMapModel.find({}).sort({ _id: -1 });
    var getDatasDetails = [];
    for (let sfm = 0; sfm < sfmDatas.length; sfm++) {
      const sfmElts = sfmDatas[sfm]._doc;
      for (let fsElt = 0; fsElt < sfmElts["feeStructureId"].length; fsElt++) {
        const psElt = sfmElts["feeStructureId"][fsElt]["paymentSchedule"];
        for (let psI = 0; psI < psElt.length; psI++) {
          const psEltObj = psElt[psI];
          var todayDate = await momentDateFormate(String(new Date()));
          var scheduleDate = await momentDateFormate(
            String(new Date(psEltObj["dueDate"]))
          );
          if (!moment(scheduleDate).isAfter(todayDate)) {
            getDatasDetails.push({
              ...sfmElts,
              scheduleDate: scheduleDate,
            });
          }
        }
      }
    }
    var statementDetails = [];
    var searchData = [];
    if (getDatasDetails.length > 0) {
      // if (page != undefined || limit != undefined) {
      //   paginationDatas = await Paginator(getDatasDetails, page, limit);
      // } else {
      paginationDatas = await Paginator(
        getDatasDetails,
        1,
        getDatasDetails.length
      );
      // }
      var studentDet = paginationDatas.data;
      for (let i = 0; i < studentDet.length; i++) {
        const element = studentDet[i];
        const feeLedgerDet = await feeledgerModel.findOne({
          studentId: element["_id"],
          transactionSubType: "demandNote",
        });
        if (feeLedgerDet != null) {
          var ppDetails = await programPlanSchema.findOne({
            _id: element["programPlanId"],
          });
          var guardianDetails = [];
          var parentName = undefined;
          for (let j = 0; j < element["guardianDetails"].length; j++) {
            var guardianDet = await guardianModel.findOne({
              _id: element["guardianDetails"][j],
            });
            guardianDetails.push(guardianDet);
            if (String(guardianDet["relation"]).toLowerCase() == "parent") {
              parentName = guardianDet["firstName"];
            }
          }
          const feePaymentLedgerDet = await feeledgerModel.find({
            primaryTransaction: feeLedgerDet._doc["transactionDisplayName"],
            transactionSubType: "feePayment",
          });
          var paidAmt = 0;
          var pendingAmt = 0;
          var paymentRecord = [];
          var dueRed = feeLedgerDet._doc["dueAmount"];
          if (feePaymentLedgerDet != null) {
            for (let k = 0; k < feePaymentLedgerDet.length; k++) {
              const feePaymentData = feePaymentLedgerDet[k]._doc;
              paidAmt = Number(paidAmt) + Number(feePaymentData.paidAmount);
              paymentRecord.push(feePaymentData);
            }
          }
          var year = new Date(String(element["scheduleDate"])).getFullYear();
          var month = new Date(String(element["scheduleDate"])).getMonth();
          var date = new Date(String(element["scheduleDate"])).getDate();
          var daysAgo = moment([year, month, date]).fromNow(true);
          var balance =
            paymentRecord.length > 0
              ? paymentRecord[paymentRecord.length - 1]["pendingAmount"]
              : feeLedgerDet._doc["dueAmount"];
          var statementRecord = {
            "REGISTRATION ID": element["regId"],
            "STUDENT NAME": `${element["firstName"]} ${element["lastName"]}`,
            "CLASS/BATCH": ppDetails._doc["title"],
            "ADMISSION DATE": await onDateFormat(element["admittedOn"]),
            studentName: `${element["firstName"]} ${element["lastName"]}`,
            regId: element["regId"],
            parentName:
              parentName == undefined
                ? guardianDetails["0"]["firstName"]
                : parentName,
            programPlan: ppDetails._doc["programCode"],
            displayName: feeLedgerDet._doc["transactionDisplayName"],
            demandNoteId: feeLedgerDet._doc["transactionDisplayName"],
            demandNoteDate: await onDateFormat(
              feeLedgerDet._doc["transactionDate"]
            ),
            totalFees: feeLedgerDet._doc["dueAmount"],
            feePaid: paidAmt,
            feeBalance: balance,
            pendingSince:
              balance == 0 ? "-" : daysAgo == "a day" ? "1 day" : daysAgo,
          };
          statementDetails.push(statementRecord);
        }
      }
      statementDetails.map((item) => {
        if (
          classbatchName != undefined &&
          String(classbatchName).toLowerCase() != "all" &&
          searchKey != undefined
        ) {
          if (
            (String(item["REGISTRATION ID"])
              .toLowerCase()
              .includes(searchKey) ||
              String(item["STUDENT NAME"]).toLowerCase().includes(searchKey) ||
              String(item["CLASS/BATCH"]).toLowerCase().includes(searchKey) ||
              String(item["ADMISSION DATE"])
                .toLowerCase()
                .includes(searchKey) ||
              String(item["studentName"]).toLowerCase().includes(searchKey) ||
              String(item["regId"]).toLowerCase().includes(searchKey) ||
              String(item["parentName"]).toLowerCase().includes(searchKey) ||
              String(item["programPlan"]).toLowerCase().includes(searchKey) ||
              String(item["displayName"]).toLowerCase().includes(searchKey) ||
              String(item["demandNoteId"]).toLowerCase().includes(searchKey) ||
              String(item["demandNoteDate"])
                .toLowerCase()
                .includes(searchKey) ||
              String(item["feePaid"]).toLowerCase().includes(searchKey) ||
              String(item["feeBalance"]).toLowerCase().includes(searchKey) ||
              String(item["pendingSince"]).toLowerCase().includes(searchKey)) &&
            String(classbatchName).toLowerCase() ==
            String(item["CLASS/BATCH"]).toLowerCase()
          ) {
            searchData.push(item);
          }
        } else if (classbatchName != undefined && searchKey == undefined) {
          if (String(classbatchName).toLowerCase() != "all") {
            if (
              String(classbatchName).toLowerCase() ==
              String(item["CLASS/BATCH"]).toLowerCase()
            ) {
              searchData.push(item);
            }
          } else {
            searchData.push(item);
          }
        } else {
          if (
            String(item["REGISTRATION ID"]).toLowerCase().includes(searchKey) ||
            String(item["STUDENT NAME"]).toLowerCase().includes(searchKey) ||
            String(item["CLASS/BATCH"]).toLowerCase().includes(searchKey) ||
            String(item["ADMISSION DATE"]).toLowerCase().includes(searchKey) ||
            String(item["studentName"]).toLowerCase().includes(searchKey) ||
            String(item["regId"]).toLowerCase().includes(searchKey) ||
            String(item["parentName"]).toLowerCase().includes(searchKey) ||
            String(item["programPlan"]).toLowerCase().includes(searchKey) ||
            String(item["displayName"]).toLowerCase().includes(searchKey) ||
            String(item["demandNoteId"]).toLowerCase().includes(searchKey) ||
            String(item["demandNoteDate"]).toLowerCase().includes(searchKey) ||
            String(item["feePaid"]).toLowerCase().includes(searchKey) ||
            String(item["feeBalance"]).toLowerCase().includes(searchKey) ||
            String(item["pendingSince"]).toLowerCase().includes(searchKey)
          ) {
            searchData.push(item);
          }
        }
      });
    }
    // responseData = statementDetails;
    let paginated = await Paginator(
      (searchKey == undefined &&
        String(classbatchName).toLowerCase() == "all") ||
        (searchKey == undefined && classbatchName == undefined)
        ? statementDetails
        : searchData,
      req.query.page,
      req.query.limit
    );
    responseData.push({
      data: statementDetails.length > 0 ? paginated.data : [],
      metadata: [
        {
          page: paginated.page,
          nextPage: paginated.nextPage,
          total: paginated.totalRecord,
          totalPages: paginated.totalPages,
        },
      ],
    });
  } else if (modifiedType == "refund") {
    let { page, limit } = req.query;
    if (page != undefined && limit != undefined) {
      page = Number(page);
      limit = Number(limit);
      const refundReport = await createRefundReport(dbConnection, limit, page);
      responseData = refundReport;
    } else {
      const refundReport = await createRefundReport(dbConnection, limit, page);
      responseData.push({
        data: refundReport,
        metadata: [
          {
            page: paginationDatas.page,
            nextPage: paginationDatas.next_page,
            totalRecord: paginationDatas.total,
            totalPages: paginationDatas.total_pages,
          },
        ],
      });
    }
  } else if (modifiedType == "application") {
    let { page, limit } = req.query;
    if (page != undefined && limit != undefined && filterKey == "All") {
      page = Number(page);
      limit = Number(limit);
      const applicationReport = await createApplicationReport(
        dbConnection,
        limit,
        page
      );
      responseData = applicationReport;
      dbConnection.close();
      return res.status(200).json({
        ...applicationReport,
      });
    } else if (page != undefined && limit != undefined && filterKey !== "All") {
      console.log("entered filter option available");
      page = undefined;
      limit = undefined;
      const applicationReport = await createApplicationReport(
        dbConnection,
        limit,
        page
      );
      // let ppName = await programPlanSchema.findOne({ displayName: req.query.filterKey })
      let filteredData = applicationReport.data.filter(
        (item) => item.programPlan.toLowerCase() == filterKey.toLowerCase()
      );
      let paginated = await Paginator(
        filteredData,
        req.query.page,
        req.query.limit
      );
      console.log("filtered", filteredData);
      let INRamt = [];
      let USDamt = [];
      let AEDamt = [];
      let INRApp = 0;
      let USDApp = 0;
      let AEDApp = 0;

      filteredData.map((dataTwo, idx) => {
        if (dataTwo.currencyCode == "USD") {
          let payStatus = dataTwo.status.toLowerCase();
          if (payStatus == "paid") {
            USDamt.push(dataTwo.amount);
            USDApp = USDApp + 1;
          } else {
            USDApp = USDApp + 1;
          }
        }
        if (dataTwo.currencyCode == "INR") {
          let payStatus = dataTwo.status.toLowerCase();
          if (payStatus == "paid") {
            INRamt.push(dataTwo.amount);
            INRApp = INRApp + 1;
          } else {
            INRApp = INRApp + 1;
          }
        }
        if (dataTwo.currencyCode == "AED") {
          let payStatus = dataTwo.status.toLowerCase();
          if (payStatus == "paid") {
            AEDamt.push(dataTwo.amount);
            AEDApp = AEDApp + 1;
          } else {
            AEDApp = AEDApp + 1;
          }
        }
      });
      let finalINR = INRamt.reduce((a, b) => a + b, 0);
      let finalUSD = USDamt.reduce((a, b) => a + b, 0);
      let finalAED = AEDamt.reduce((a, b) => a + b, 0);
      return res.status(200).json({
        ...paginated,
        totalINR: finalINR,
        totalUSD: finalUSD,
        totalAED: finalAED,
        domesticApp: INRApp,
        internationalApp: Number(USDApp) + Number(AEDApp),
      });
      // }

      // responseData.push({
      //   data: applicationReport,
      //   metadata: [
      //     {
      //       page: paginationDatas.page,
      //       nextPage: paginationDatas.next_page,
      //       totalRecord: paginationDatas.total,
      //       totalPages: paginationDatas.total_pages,
      //     },
      //   ],
      // });
    } else if (page == undefined && limit == undefined && filterKey !== "All") {
      console.log("entered filter option available");
      page = undefined;
      limit = undefined;
      const applicationReport = await createApplicationReport(
        dbConnection,
        limit,
        page
      );
      // let ppName = await programPlanSchema.findOne({ displayName: req.query.filterKey })
      let filteredData = applicationReport.data.filter(
        (item) => item.programPlan.toLowerCase() == filterKey.toLowerCase()
      );
      let paginated = await Paginator(
        filteredData,
        req.query.page,
        req.query.limit
      );
      console.log("filtered", filteredData);
      let INRamt = [];
      let USDamt = [];
      let AEDamt = [];
      let INRApp = 0;
      let USDApp = 0;
      let AEDApp = 0;

      filteredData.map((dataTwo, idx) => {
        if (dataTwo.currencyCode == "USD") {
          let payStatus = dataTwo.status.toLowerCase();
          if (payStatus == "paid") {
            USDamt.push(dataTwo.amount);
            USDApp = USDApp + 1;
          } else {
            USDApp = USDApp + 1;
          }
        }
        if (dataTwo.currencyCode == "INR") {
          let payStatus = dataTwo.status.toLowerCase();
          if (payStatus == "paid") {
            INRamt.push(dataTwo.amount);
            INRApp = INRApp + 1;
          } else {
            INRApp = INRApp + 1;
          }
        }
        if (dataTwo.currencyCode == "AED") {
          let payStatus = dataTwo.status.toLowerCase();
          if (payStatus == "paid") {
            AEDamt.push(dataTwo.amount);
            AEDApp = AEDApp + 1;
          } else {
            AEDApp = AEDApp + 1;
          }
        }
      });
      let finalINR = INRamt.reduce((a, b) => a + b, 0);
      let finalUSD = USDamt.reduce((a, b) => a + b, 0);
      let finalAED = AEDamt.reduce((a, b) => a + b, 0);
      return res.status(200).json({
        ...paginated,
        totalINR: finalINR,
        totalUSD: finalUSD,
        totalAED: finalAED,
        domesticApp: INRApp,
        internationalApp: Number(USDApp) + Number(AEDApp),
      });
      // }

      // responseData.push({
      //   data: applicationReport,
      //   metadata: [
      //     {
      //       page: paginationDatas.page,
      //       nextPage: paginationDatas.next_page,
      //       totalRecord: paginationDatas.total,
      //       totalPages: paginationDatas.total_pages,
      //     },
      //   ],
      // });
    } else {
      const applicationReport = await createApplicationReport(
        dbConnection,
        limit,
        page
      );
      dbConnection.close();
      return res.status(200).json({
        ...applicationReport,
      });
    }
  } else if (modifiedType == "searchapplication") {
    let { page, limit, searchKey } = req.query;
    if (page != undefined && limit != undefined) {
      page = Number(page);
      limit = Number(limit);
      const applicationReport = await createApplicationSearchReport(
        dbConnection,
        limit,
        page,
        searchKey
      );
      responseData = applicationReport;
      dbConnection.close();
      return res.status(200).json({
        ...applicationReport,
      });
    } else {
      const applicationReport = await createApplicationSearchReport(
        dbConnection,
        limit,
        page,
        searchKey
      );
      dbConnection.close();
      return res.status(200).json({
        ...applicationReport,
      });
    }
  }

  var pageDetails =
    responseData["0"] != undefined
      ? responseData["0"].metadata["0"] != undefined
        ? responseData["0"].metadata["0"]
        : {
          page: null,
          nextPage: null,
          total: null,
          totalPages: null,
        }
      : {
        page: null,
        nextPage: null,
        total: null,
        totalPages: null,
      };
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,x-auth-token,authorization, X-Requested-With, Content-Type, Accept"
  );
  dbConnection.close();
  res.status(200).send({
    status: "success",
    message: `${type} reports`,
    data: responseData["0"] != undefined ? responseData["0"].data : [],
    currentPage: pageDetails.page != undefined ? pageDetails.page : null,
    perPage: Number(limit),
    nextPage: pageDetails.nextPage != undefined ? pageDetails.nextPage : null,
    totalRecord: pageDetails.total != undefined ? pageDetails.total : null,
    totalPages:
      pageDetails.totalPages != undefined ? pageDetails.totalPages : null,
    totalCash:
      responseData["0"] && responseData["0"].totalCash != undefined
        ? responseData["0"].totalCash
        : undefined,
    totalCheque:
      responseData["0"] && responseData["0"].totalCheque != undefined
        ? responseData["0"].totalCheque
        : undefined,
    totalCard:
      responseData["0"] && responseData["0"].totalCard != undefined
        ? responseData["0"].totalCard
        : undefined,
    totalNetbanking:
      responseData["0"] && responseData["0"].totalNetbanking != undefined
        ? responseData["0"].totalNetbanking
        : undefined,
    totalWallet:
      responseData["0"] && responseData["0"].totalWallet != undefined
        ? responseData["0"].totalWallet
        : undefined,
    totalUpi:
      responseData["0"] && responseData["0"].totalUpi != undefined
        ? responseData["0"].totalUpi
        : undefined,
    totalAmount:
      responseData["0"] && responseData["0"].totalAmount != undefined
        ? responseData["0"].totalAmount
        : undefined,
    totalPending:
      responseData["0"] && responseData["0"].totalPending != undefined
        ? responseData["0"].totalPending
        : undefined,
    totalPaid:
      responseData["0"] && responseData["0"].totalPaid != undefined
        ? responseData["0"].totalPaid
        : undefined,
  });
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
async function momentDateFormate(d) {
  return [
    new Date(String(d)).getFullYear(),
    new Date(String(d)).getMonth() + 1,
    new Date(String(d)).getDate(),
  ];
}
async function momentDateFormateTest(d) {
  return [
    new Date(String(d)).getFullYear() - 1,
    new Date(String(d)).getMonth() + 1,
    new Date(String(d)).getDate(),
  ];
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

async function createDemandNoteReport(
  dbConnection,
  itemsPerPage,
  currentPage,
  searchKey,
  campusId,
  userId
) {
  const transactionModel = dbConnection.model(
    transactionCollectionName,
    transactionsSchema,
    transactionCollectionName
  );

  if (campusId == "undefined" || campusId == undefined || campusId == "null") {
    if (userId == "undefined") {
      if (itemsPerPage == undefined && currentPage == undefined) {
        const aggregatePipeline = [
          {
            $match: {
              $and: [{ transactionSubType: "demandNote" }],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          { $match: { transactionSubType: "demandNote" } },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    } else if (userId.toLowerCase() == "all") {
      if (itemsPerPage == undefined && currentPage == undefined) {
        const aggregatePipeline = [
          {
            $match: {
              $and: [{ transactionSubType: "demandNote" }],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          { $match: { transactionSubType: "demandNote" } },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    } else {
      let createdUser = mongoose.Types.ObjectId(userId);
      console.log("createBt", createdUser);
      if (itemsPerPage == undefined && currentPage == undefined) {
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { createdBy: createdUser },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { createdBy: createdUser },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    }
  } else if (campusId.toLowerCase() !== "all") {
    if (userId == "undefined") {
      var campid = campusId;
      if (itemsPerPage == undefined && currentPage == undefined) {
        console.log("Entered");
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { campusId: campid },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { campusId: campid },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    } else if (userId.toLowerCase() == "all") {
      var campid = campusId;
      if (itemsPerPage == undefined && currentPage == undefined) {
        console.log("Entered");
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { campusId: campid },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { campusId: campid },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    } else {
      let createdUser = mongoose.Types.ObjectId(userId);
      var campid = campusId;
      if (itemsPerPage == undefined && currentPage == undefined) {
        console.log("Entered");
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { campusId: campid },
                { createdBy: createdUser },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { campusId: campid },
                { createdBy: createdUser },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    }
  } else {
    if (userId == "undefined") {
      if (itemsPerPage == undefined && currentPage == undefined) {
        const aggregatePipeline = [
          {
            $match: {
              $and: [{ transactionSubType: "demandNote" }],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          { $match: { transactionSubType: "demandNote" } },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    } else if (userId.toLowerCase() == "all") {
      if (itemsPerPage == undefined && currentPage == undefined) {
        const aggregatePipeline = [
          {
            $match: {
              $and: [{ transactionSubType: "demandNote" }],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          { $match: { transactionSubType: "demandNote" } },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    } else {
      let createdUser = mongoose.Types.ObjectId(userId);
      if (itemsPerPage == undefined && currentPage == undefined) {
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { createdBy: createdUser },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        // console.log("aggregatedReport", aggregatedReport);
        return aggregatedReport;
      } else {
        let skipItems =
          Number(itemsPerPage) * Number(currentPage) - Number(itemsPerPage);
        const aggregatePipeline = [
          {
            $match: {
              $and: [
                { transactionSubType: "demandNote" },
                { createdBy: createdUser },
              ],
            },
          },
          {
            $lookup: {
              from: "feesledgers",
              localField: "displayName",
              foreignField: "primaryTransaction",
              as: "feesLedgers",
            },
          },
          {
            $lookup: {
              from: "students",
              localField: "studentId",
              foreignField: "_id",
              as: "students",
            },
          },
          {
            $addFields: {
              pendingAmount: { $slice: ["$feesLedgers.pendingAmount", -1] },
              paidAmount: { $subtract: ["$amount", "$pendingAmount"] },
              status: { $slice: ["$feesLedgers.status", -1] },
              feeStructureId: { $slice: ["$students.feeStructureId", -1] },
              admittedOn: { $slice: ["$students.admittedOn", -1] },
              "data.feesBreakUp": {
                $map: {
                  input: { $range: [0, { $size: "$data.feesBreakUp" }] },
                  as: "ix",
                  in: {
                    $let: {
                      vars: {
                        rec: { $arrayElemAt: ["$data.feesBreakUp", "$$ix"] },
                        sen: { $arrayElemAt: ["$feesLedgers", "$$ix"] },
                      },
                      in: {
                        feeTypeId: "$$rec.feeTypeId",
                        description: "$$rec.feeType",
                        feeTypeCode: "$$rec.feeTypeCode",
                        amount: "$$rec.amount",
                        pendingAmount: "$$sen.pendingAmount",
                        paidAmount: {
                          $subtract: ["$$rec.amount", "$$sen.pendingAmount"],
                        },
                        status: "$$sen.status",
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $project: {
              // projection
              ledgerRefIds: "$feesLedgers",
              displayName: 1,
              pendingAmount: {
                $arrayElemAt: ["$pendingAmount", 0],
              },
              data: {
                leadId: null,
                students: [
                  {
                    studentName: "$studentName",
                    regId: "$studentRegId",
                    class: "$class",
                    academicYear: "$academicYear",
                    // admittedOn: {
                    //     "$arrayElemAt":["$admittedOn",0]
                    // }, // student collection
                    studentFeesMappingId: {
                      $arrayElemAt: ["$feeStructureId", 0],
                    }, // student collection
                    dueDate: {
                      $dateToString: { format: "%d-%m-%Y", date: "$dueDate" },
                    },
                    studentRefId: "$studentRegId",
                    feesBreakup: {
                      $concatArrays: [
                        "$data.feesBreakUp",
                        [
                          {
                            pendingAmount: {
                              $arrayElemAt: ["$pendingAmount", 0],
                            },
                            paidAmount: {
                              $subtract: [
                                "$amount",
                                { $arrayElemAt: ["$pendingAmount", 0] },
                              ],
                            },
                            status: { $arrayElemAt: ["$status", 0] },
                            description: "Total",
                            amount: "$amount",
                          },
                        ],
                      ],
                    },
                  },
                ],
                totalFees: "$amount",
              },
              emailCommunicationRefIds: {
                $arrayElemAt: ["$emailCommunicationRefIds", 0],
              },
              todayDate: {
                $dateToString: { format: "%d-%m-%Y", date: "$transactionDate" },
              },
              fullDate: "$transactionDate",
              status: {
                $arrayElemAt: ["$status", 0],
              },
              paymentStatus: {
                $arrayElemAt: ["$status", 0],
              },
            },
          },
          // {
          //     $group: {
          //         _id: {
          //             totalAmount: "$feesLedgers.dueAmount",
          //             paidAmount: "$feesLedgers.paidAmount",
          //             totalFees: "$feesLedgers.dueAmount",
          //         }
          //     }
          // },
          {
            $facet: {
              metadata: [
                { $count: "total" },
                {
                  $addFields: {
                    page: Number(currentPage),
                    itemsPerPage: Number(itemsPerPage),
                    totalPages: {
                      $ceil: { $divide: ["$total", Number(itemsPerPage)] },
                    },
                    nextPage: {
                      $cond: {
                        if: {
                          $gt: [
                            {
                              $ceil: {
                                $divide: ["$total", Number(itemsPerPage)],
                              },
                            },
                            Number(currentPage),
                          ],
                        },
                        then: Number(currentPage) + 1,
                        else: null,
                      },
                    },
                  },
                },
              ],
              data: [
                { $skip: skipItems < 0 ? 0 : skipItems },
                { $limit: Number(itemsPerPage) },
              ], // add projection here wish you re-shape the docs
            },
          },
        ];
        const aggregatedReport = await transactionModel.aggregate(
          aggregatePipeline
        );
        return aggregatedReport;
      }
    }
  }
}

async function createFeePendingReportReport(
  dbConnection,
  itemsPerPage,
  currentPage
) {
  let skipItems = itemsPerPage * currentPage - itemsPerPage;
  let ppmodel = await dbConnection.model("programplans", ProgramPlanSchema);
  const aggregatePipeline = [
    // { $match: { transactionSubType: 'demandNote' } },
    {
      $lookup: {
        from: "feesledgers",
        localField: "displayName",
        foreignField: "primaryTransaction",
        as: "feesLedgers",
      },
    },
    {
      $lookup: {
        from: "students",
        localField: "_id",
        foreignField: "programPlanId",
        as: "students",
      },
    },
    {
      // "$addFields": {
      //     "pendingAmount": { "$slice": ["$feesLedgers.pendingAmount", -1] },
      //     "paidAmount": { "$subtract": ["$amount", "$pendingAmount"] },
      //     "status": { "$slice": ["$feesLedgers.status", -1] },
      //     "feeStructureId": { "$slice": ["$students.feeStructureId", -1] },
      //     "admittedOn": { "$slice": ["$students.admittedOn", -1] },
      //     "data.feesBreakUp": {
      //         "$map": {
      //             "input": { "$range": [0, { "$size": "$data.feesBreakUp" }] },
      //             "as": "ix",
      //             "in": {
      //                 "$let": {
      //                     "vars": {
      //                         "rec": { "$arrayElemAt": ["$data.feesBreakUp", "$$ix"] },
      //                         "sen": { "$arrayElemAt": ["$feesLedgers", -1] }
      //                     },
      //                     "in": {
      //                         "feeTypeId": "$$rec.feeTypeId",
      //                         "description": "$$rec.feeType",
      //                         "feeTypeCode": "$$rec.feeTypeCode",
      //                         "amount": "$$rec.amount",
      //                         "pendingAmount": "$$sen.pendingAmount",
      //                         "paidAmount": { "$subtract": ["$$rec.amount", "$$sen.pendingAmount"] },
      //                         "status": "$$sen.status",
      //                     }
      //                 }
      //             }
      //         }
      //     }
      // }
    },
    {
      $project: {
        // projection
        programPlanDisplayName: "$displayName",
        programPlanId: "$programCode",
        programPlanName: "$programPlanName",
        numberOfStudents: "$students",
        pendingStudents: "$feesLedgers",
      },
    },
    {
      $facet: {
        metadata: [
          { $count: "total" },
          {
            $addFields: {
              page: currentPage,
              itemsPerPage,
              totalPages: {
                $ceil: { $divide: ["$total", itemsPerPage] },
              },
              nextPage: {
                $cond: {
                  if: {
                    $gt: [
                      { $ceil: { $divide: ["$total", itemsPerPage] } },
                      currentPage,
                    ],
                  },
                  then: currentPage + 1,
                  else: null,
                },
              },
            },
          },
        ],
        data: [
          { $skip: skipItems < 0 ? 0 : skipItems },
          { $limit: itemsPerPage },
        ], // add projection here wish you re-shape the docs
      },
    },
  ];
  const aggregatedReport = await ppmodel.aggregate(aggregatePipeline);
  return aggregatedReport;
}

async function createRefundReport(dbConnection, itemsPerPage, currentPage) {
  const transactionModel = dbConnection.model(
    transactionCollectionName,
    transactionsSchema,
    transactionCollectionName
  );
  if (itemsPerPage == undefined && currentPage == undefined) {
    const aggregatePipeline = [
      { $match: { transactionSubType: "refund" } },
      {
        $lookup: {
          from: "feesledgers",
          localField: "relatedTransactions",
          foreignField: "transactionDisplayName",
          as: "feesLedgers",
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "students",
        },
      },
      {
        $project: {
          refundId: "$displayName",
          demandNoteId: "$feesLedgers",
          regId: "$studentRegId",
          studentName: "$studentName",
          academicYear: "$academicYear",
          "class/Batch": "$class",
          description: "$data.feesBreakUp",
          refundedOn: "$transactionDate",
          refunded: "$amount",
          mode: "$data.mode",
          txnId: "$paymentTransactionId",
          transactionSubType: "$transactionSubType",
          status: "$status",
        },
      },
    ];
    const aggregatedReport = await transactionModel.aggregate(
      aggregatePipeline
    );
    return aggregatedReport;
  } else {
    let skipItems = itemsPerPage * currentPage - itemsPerPage;
    const aggregatePipeline = [
      { $match: { transactionSubType: "refund" } },
      {
        $lookup: {
          from: "feesledgers",
          localField: "relatedTransactions",
          foreignField: "transactionDisplayName",
          as: "feesLedgers",
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "students",
        },
      },
      {
        $project: {
          refundId: "$displayName",
          demandNoteId: "$feesLedgers",
          regId: "$studentRegId",
          studentName: "$studentName",
          academicYear: "$academicYear",
          "class/Batch": "$class",
          description: "$data.feesBreakUp",
          refundedOn: "$transactionDate",
          refunded: "$amount",
          mode: "$data.mode",
          txnId: "$paymentTransactionId",
          transactionSubType: "$transactionSubType",
          status: "$status",
        },
      },
      {
        $facet: {
          metadata: [
            { $count: "total" },
            {
              $addFields: {
                page: currentPage,
                itemsPerPage,
                totalPages: {
                  $ceil: { $divide: ["$total", itemsPerPage] },
                },
                nextPage: {
                  $cond: {
                    if: {
                      $gt: [
                        { $ceil: { $divide: ["$total", itemsPerPage] } },
                        currentPage,
                      ],
                    },
                    then: currentPage + 1,
                    else: null,
                  },
                },
              },
            },
          ],
          data: [
            { $skip: skipItems < 0 ? 0 : skipItems },
            { $limit: itemsPerPage },
          ], // add projection here wish you re-shape the docs
        },
      },
    ];
    const aggregatedReport = await transactionModel.aggregate(
      aggregatePipeline
    );
    return aggregatedReport;
  }
}

async function createApplicationReport(
  dbConnection,
  itemsPerPage,
  currentPage
) {
  const applicationModel = dbConnection.model(
    "applications",
    ApplicationSchema,
    "applications"
  );
  if (itemsPerPage == null && currentPage == null) {
    console.log("currentpage", currentPage);
    const aggregateData = [{ $sort: { _id: -1 } }];
    const getData = await applicationModel.aggregate(aggregateData);
    let INRamt = [];
    let USDamt = [];
    let AEDamt = [];
    let INRApp = 0;
    let USDApp = 0;
    let AEDApp = 0;

    getData.map((dataTwo, idx) => {
      if (dataTwo.currencyCode == "USD") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          USDamt.push(dataTwo.amount);
          USDApp = USDApp + 1;
        } else {
          USDApp = USDApp + 1;
        }
      }
      if (dataTwo.currencyCode == "INR") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          INRamt.push(dataTwo.amount);
          INRApp = INRApp + 1;
        } else {
          INRApp = INRApp + 1;
        }
      }
      if (dataTwo.currencyCode == "AED") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          AEDamt.push(dataTwo.amount);
          AEDApp = AEDApp + 1;
        } else {
          AEDApp = AEDApp + 1;
        }
      }
    });
    let finalINR = INRamt.reduce((a, b) => a + b, 0);
    let finalUSD = USDamt.reduce((a, b) => a + b, 0);
    let finalAED = AEDamt.reduce((a, b) => a + b, 0);

    return (responseReturn = {
      status: "success",
      message: `data`,
      totalINR: finalINR,
      totalUSD: finalUSD,
      totalAED: finalAED,
      domesticApp: INRApp,
      internationalApp: Number(USDApp) + Number(AEDApp),
      data: getData,
      currentPage: null,
      perPage: null,
      nextPage: null,
      totalRecord: null,
      totalPages: null,
    });
  } else {
    const aggregateData1 = [{ $sort: { _id: -1 } }];
    const getData1 = await applicationModel.aggregate(aggregateData1);
    let skipItems = parseInt(itemsPerPage * currentPage - itemsPerPage);
    const aggregateData = [
      { $sort: { _id: -1 } },
      {
        $facet: {
          metadata: [
            { $count: "total" },
            {
              $addFields: {
                page: currentPage,
                itemsPerPage,
                totalPages: {
                  $ceil: { $divide: ["$total", itemsPerPage] },
                },
                nextPage: {
                  $cond: {
                    if: {
                      $gt: [
                        { $ceil: { $divide: ["$total", itemsPerPage] } },
                        currentPage,
                      ],
                    },
                    then: currentPage + 1,
                    else: null,
                  },
                },
              },
            },
          ],
          data: [
            { $skip: skipItems < 0 ? 0 : skipItems },
            { $limit: itemsPerPage },
          ], // add projection here wish you re-shape the docs
        },
      },
    ];
    const getData = await applicationModel.aggregate(aggregateData);
    let INRamt = [];
    let USDamt = [];
    let AEDamt = [];
    let INRApp = 0;
    let USDApp = 0;
    let AEDApp = 0;

    getData1.map((dataTwo, idx) => {
      if (dataTwo.currencyCode == "USD") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          let amount = Number(dataTwo.amount + "." + dataTwo.paisa).toFixed(2);
          USDamt.push(Number(amount));
          USDApp = USDApp + 1;
        } else {
          USDApp = USDApp + 1;
        }
      }
      if (dataTwo.currencyCode == "INR") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          let amount = Number(dataTwo.amount + "." + dataTwo.paisa).toFixed(2);
          INRamt.push(Number(amount));
          INRApp = INRApp + 1;
        } else {
          INRApp = INRApp + 1;
        }
      }
      if (dataTwo.currencyCode == "AED") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          AEDamt.push(dataTwo.amount);
          AEDApp = AEDApp + 1;
        } else {
          AEDApp = AEDApp + 1;
        }
      }
    });
    let finalINR = INRamt.reduce((a, b) => a + b, 0);
    let finalUSD = USDamt.reduce((a, b) => a + b, 0);
    let finalAED = AEDamt.reduce((a, b) => a + b, 0);
    const pageDetails =
      getData["0"]["metadata"]["0"] != undefined
        ? getData["0"]["metadata"]["0"]
        : {
          page: null,
          nextPage: null,
          total: null,
          totalPages: null,
        };
    return (responseReturn = {
      status: "success",
      message: `data`,
      totalINR: finalINR,
      totalUSD: finalUSD,
      totalAED: finalAED,
      domesticApp: INRApp,
      internationalApp: Number(USDApp) + Number(AEDApp),
      data: getData["0"]["data"],
      currentPage: pageDetails.page,
      perPage: itemsPerPage,
      nextPage: pageDetails.nextPage,
      totalRecord: pageDetails.total,
      totalPages: pageDetails.totalPages,
    });
  }
}
async function createApplicationSearchReport(
  dbConnection,
  itemsPerPage,
  currentPage,
  searchKey
) {
  const applicationModel = dbConnection.model(
    "applications",
    ApplicationSchema,
    "applications"
  );

  if (itemsPerPage == undefined && currentPage == undefined) {
    const aggregateData = [{ $sort: { _id: -1 } }];
    const getData = await applicationModel.findOne({});
    let objkeys = Object.keys(getData._doc);
    let searchData = [];
    let queryOptions;
    queryOptions = { $regex: searchKey };
    console.log("queryOptions", queryOptions);
    for (let i = 0; i < objkeys.length; i++) {
      let getd = await applicationModel.find({
        $where: `function() { if(this.${[objkeys[i]]}!==undefined && this.${[
          objkeys[i],
        ]}!==null ){ return this.${[
          objkeys[i],
        ]}.toString().toLowerCase().match(/${searchKey.toLowerCase()}/) != null}}`,
      });
      // console.log("getd", getd)
      searchData = searchData.concat(getd);
    }
    console.log("searchData", searchData);
    let INRamt = [];
    let USDamt = [];
    let INRApp = 0;
    let USDApp = 0;
    searchData.map((dataTwo, idx) => {
      if (dataTwo.currencyCode == "USD") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          let amount = Number(dataTwo.amount + "." + dataTwo.paisa).toFixed(2);
          USDamt.push(Number(amount));
          USDApp = USDApp + 1;
        } else {
          USDApp = USDApp + 1;
        }
      }
      if (dataTwo.currencyCode == "INR") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          let amount = Number(dataTwo.amount + "." + dataTwo.paisa).toFixed(2);
          INRamt.push(Number(amount));
          INRApp = INRApp + 1;
        } else {
          INRApp = INRApp + 1;
        }
      }
    });
    let finalINR = INRamt.reduce((a, b) => a + b, 0);
    let finalUSD = USDamt.reduce((a, b) => a + b, 0);
    return (responseReturn = {
      status: "success",
      message: `data`,
      totalINR: finalINR,
      totalUSD: finalUSD,
      data: searchData,
      currentPage: null,
      perPage: null,
      nextPage: null,
      totalRecord: null,
      totalPages: null,
    });
  } else {
    const getData = await applicationModel.findOne({});
    let objkeys = Object.keys(getData._doc);
    let searchData = [];
    let queryOptions;
    queryOptions = { $regex: searchKey };
    console.log("queryOptions", objkeys);
    for (let i = 0; i < objkeys.length; i++) {
      let getd = await applicationModel.find({
        $where: `function() { if(this.${[objkeys[i]]}!==undefined && this.${[
          objkeys[i],
        ]}!==null ){ return this.${[
          objkeys[i],
        ]}.toString().toLowerCase().match(/${searchKey.toLowerCase()}/) != null}}`,
      });
      // console.log("getd",getd)
      searchData = searchData.concat(getd);
    }
    console.log("searchData", searchData);

    let paginated = await Paginator(searchData, currentPage, itemsPerPage);
    let INRamt = [];
    let USDamt = [];
    let INRApp = 0;
    let USDApp = 0;
    paginated["data"].map((dataTwo, idx) => {
      if (dataTwo.currencyCode == "USD") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          let amount = Number(dataTwo.amount + "." + dataTwo.paisa).toFixed(2);
          USDamt.push(Number(amount));
          USDApp = USDApp + 1;
        } else {
          USDApp = USDApp + 1;
        }
      }
      if (dataTwo.currencyCode == "INR") {
        let payStatus = dataTwo.status.toLowerCase();
        if (payStatus == "paid") {
          let amount = Number(dataTwo.amount + "." + dataTwo.paisa).toFixed(2);
          INRamt.push(Number(amount));
          INRApp = INRApp + 1;
        } else {
          INRApp = INRApp + 1;
        }
      }
    });
    let finalINR = INRamt.reduce((a, b) => a + b, 0);
    let finalUSD = USDamt.reduce((a, b) => a + b, 0);
    return (responseReturn = {
      status: "success",
      message: `data`,
      totalINR: finalINR,
      totalUSD: finalUSD,
      data: paginated["data"],
      currentPage: currentPage,
      perPage: itemsPerPage,
      nextPage: paginated.nextPage,
      totalRecord: paginated.totalRecord,
      totalPages: paginated.totalPages,
    });
  }
}
module.exports = {
  createReports: createReports,
};
