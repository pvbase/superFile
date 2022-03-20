const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../../models/orglists-schema");
const { dataPagination } = require("./reports-support");
const campusSchema = require("../../models/campusModel");
const programPlanSchema = require("../../models/programPlanModel");

// (1) FEE COLLECTION DATA
module.exports.getAllFeeCollectionDetails = async (req, res) => {
  const { orgId, campus, programPlan, page, limit, searchKey } = req.query;
  let dbConnection;
  let centralDbConnection;
  centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
  const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId), });
  dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

  var studentsModel = dbConnection.model("students", allSchema);
  var studentFeePlansModel = dbConnection.model("studentfeeplans", allSchema);
  var studentFeeInstPlansModel = dbConnection.model("studentfeeinstallmentplans", allSchema);

  var studentFeePlanModel = dbConnection.model("studentfeeplans", allSchema);
  var campusModel = dbConnection.model("campuses", campusSchema, "campuses");
  var programPlanModel = dbConnection.model("programplans", programPlanSchema, "programplans");
  const allCampus = await campusModel.find({});
  const allProgramPlan = await programPlanModel.find({});

  try {
    let studAggr = {};
    if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
      studAggr.programPlanId = mongoose.Types.ObjectId(programPlan);
    }
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
      studAggr.campusId = String(campus);
    }
    if (page == undefined || limit == undefined) {
      var calcAllDetails = await getAllDetails();
      var getFinalizedRespVal = calcAllDetails;
      if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
        getFinalizedRespVal = getFinalizedRespVal.filter(function (v, i) {
          return v["programPlanId"] == String(programPlan);
        });
      }
      if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
        getFinalizedRespVal = getFinalizedRespVal.filter(function (v, i) {
          return v["campusId"] == String(campus);
        });
      }
      let sortingFunction = await convertSortArrNew(getFinalizedRespVal);
      res.send({
        status: "success",
        totalRecord: sortingFunction.length,
        data: sortingFunction,
        totalPage: 0,
        currentPage: Number(page),
        perPage: Number(limit),
        nextPage: null,
        message: "Download data",
      });
      centralDbConnection.close();
      dbConnection.close();
    } else {
      if (searchKey != undefined && searchKey != "") {
        let calcAllFilteredDetails = await getAllDetails();
        let searchFields = await findSearchData(calcAllFilteredDetails, searchKey);
        let convertToPaginate = await dataPagination(searchFields, page, limit);
        let calcTotpageVal = Math.ceil(Number(searchFields.length) / Number(limit));
        res.send({
          status: "success",
          totalRecord: searchFields.length,
          data: convertToPaginate,
          totalPage: calcTotpageVal,
          currentPage: Number(page),
          perPage: Number(limit),
          nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
        });
        centralDbConnection.close();
        dbConnection.close();
      } else {
        await studentsModel.find(studAggr, async (studErr, studResp) => {
          if (studResp.length == 0) {
            res.send({
              status: "success",
              totalRecord: 0,
              data: [],
              totalPage: 0,
              currentPage: Number(page),
              perPage: Number(limit),
              nextPage: null,
              message: "No data found",
            });
            centralDbConnection.close();
            dbConnection.close();
          } else {
            let sortingFunction = await convertSortArr(studResp);
            let convertToPaginate = await dataPagination(sortingFunction, page, limit);
            let calcTotpageVal = Math.ceil(Number(sortingFunction.length) / Number(limit));
            var getFinalizedResult = [];
            for (let i = 0; i < convertToPaginate.length; i++) {
              let dummyObj = {};
              var feePlanId = "";
              dummyObj.regId = convertToPaginate[i]._doc.regId;
              dummyObj.studentId = convertToPaginate[i]._doc._id;
              dummyObj.studentName = convertToPaginate[i]._doc.firstName + " " + convertToPaginate[i]._doc.lastName;
              dummyObj.campusId = convertToPaginate[i]._doc.campusId;
              dummyObj.currency = "INR";
              dummyObj.section = convertToPaginate[i]._doc.section;
              dummyObj.displayName = convertToPaginate[i]._doc.displayName;
              dummyObj.studentPhone = convertToPaginate[i]._doc.phoneNo;
              dummyObj.studentEmail = convertToPaginate[i]._doc.email;
              dummyObj.parentName = convertToPaginate[i]._doc.parentName;
              dummyObj.parentPhone = convertToPaginate[i]._doc.parentPhone;
              dummyObj.parentEmail = convertToPaginate[i]._doc.parentEmail;
              dummyObj.category = convertToPaginate[i]._doc.category;
              dummyObj.programPlanId = convertToPaginate[i]._doc.programPlanId;

              dummyObj.installmentData = [];
              await studentFeePlansModel.find(
                { studentRegId: String(convertToPaginate[i]._doc.regId) },
                async (feeErr, feeResp) => {
                  if (feeResp.length == 0) {
                    dummyObj.totalPlannedAmount = "";
                    dummyObj.totalPaidAmount = "";
                    dummyObj.totalPendingAmount = "";
                    dummyObj.totalDiscount = "";
                    dummyObj.totalAmount = "";
                  }
                  else {
                    feePlanId = feeResp[0]._doc._id;
                    // let instTotalAmount = await studentFeeInstPlansModel.findOne({ feePlanId: mongoose.Types.ObjectId(feePlanId) })
                    // dummyObj.totalAmount = feeResp[0]._doc.totalAmount ? feeResp[0]._doc.totalAmount : feeResp[0]._doc.plannedAmount;
                    dummyObj.totalAmount = feeResp[0]._doc.totalAmount ? feeResp[0]._doc.totalAmount : feeResp[0]._doc.plannedAmount;
                    dummyObj.totalPlannedAmount = feeResp[0]._doc.plannedAmount;
                    dummyObj.totalPaidAmount = feeResp[0]._doc.paidAmount;
                    dummyObj.totalPendingAmount = feeResp[0]._doc.pendingAmount;
                    dummyObj.totalDiscount = feeResp[0]._doc.discountAmount;
                  }
                }
              );
              await campusModel.find(
                {
                  _id: mongoose.Types.ObjectId(convertToPaginate[i]._doc.campusId),
                },
                (campErr, campResp) => {
                  if (campResp.length == 0) {
                    dummyObj.campusName = "";
                    dummyObj.campusFullName = "";
                  } else {
                    dummyObj.campusName = campResp[0]._doc.displayName;
                    dummyObj.campusFullName = campResp[0]._doc.legalName;
                  }
                }
              );
              await programPlanModel.find(
                {
                  _id: mongoose.Types.ObjectId(convertToPaginate[i]._doc.programPlanId),
                },
                (pgmErr, pgmResp) => {
                  if (pgmResp.length == 0) {
                    dummyObj.classBatch = "";
                    dummyObj.academicYear = "";
                  } else {
                    dummyObj.classBatch = pgmResp[0]._doc.title;
                    dummyObj.academicYear = pgmResp[0]._doc.academicYear;
                  }
                }
              );
              console.log(feePlanId)
              await studentFeeInstPlansModel.find(
                // { studentRegId: String(convertToPaginate[i]._doc.regId) },
                { feePlanId: mongoose.Types.ObjectId(feePlanId) },
                (instErr, instResp) => {
                  if (instResp.length == 0) {
                    dummyObj.installmentData = [];
                  }
                  else {
                    dummyObj.installmentData = [];
                    for (let y = 0; y < instResp.length; y++) {
                      let dummyInst = {};
                      dummyInst.title = instResp[y]._doc.label;
                      dummyInst.totalAmount = instResp[y]._doc.totalAmount;
                      dummyInst.plannedAmount = instResp[y]._doc.plannedAmount;
                      dummyInst.paidAmount = instResp[y]._doc.paidAmount;
                      dummyInst.pendingAmount = instResp[y]._doc.pendingAmount;
                      dummyInst.discountAmount = instResp[y]._doc.discountAmount;
                      dummyObj.installmentData.push(dummyInst);
                    }
                  }
                }
              );
              getFinalizedResult.push(dummyObj);
            }
            res.send({
              status: "success",
              totalRecord: sortingFunction.length,
              data: getFinalizedResult,
              totalPage: calcTotpageVal,
              currentPage: Number(page),
              perPage: Number(limit),
              nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
              message: "Paginated data",
            });
            centralDbConnection.close();
            dbConnection.close();
          }
        });
      }
    }
    async function convertSortArr(data) {
      if (data.length == 0) {
        return data;
      } else {
        let convertFunc = data.sort(function (a, b) {
          return a._doc.regId - b._doc.regId;
        });
        return convertFunc;
      }
    }
    async function convertSortArrNew(data) {
      if (data.length == 0) {
        return data;
      } else {
        let convertFunc = data.sort(function (a, b) {
          return a.regId - b.regId;
        });
        return convertFunc;
      }
    }
    async function getAllDetails() {
      const studentAggregator = [
        {
          $lookup: {
            from: "students",
            localField: "studentRegId",
            foreignField: "regId",
            as: "students",
          },
        },
        {
          $lookup: {
            from: "studentfeeinstallmentplans",
            localField: "_id",
            foreignField: "feePlanId",
            as: "installmentData",
          },
        },
        {
          $unwind: "$installmentData",
        },
        {
          $unwind: "$students",
        },
        {
          $group: {
            _id: {
              studentRegId: "$students.regId",
              studentId: "$students._id",
              studentName: {
                $concat: ["$students.firstName", " ", "$students.lastName"],
              },
              campusId: "$students.campusId",
              section: "$students.section",
              displayName: "$students.displayName",
              studentPhone: "$students.phoneNo",
              studentEmail: "$students.email",
              parentName: "$students.parentName",
              parentPhone: "$students.parentPhone",
              parentEmail: "$students.parentEmail",
              category: "$students.category",
              programPlanId: "$students.programPlanId",
              totalAmount: "$totalAmount",
              totalPlannedAmount: "$plannedAmount",
              totalPaidAmount: "$paidAmount",
              totalPendingAmount: "$pendingAmount",
              totalDiscount: "$discountAmount"
            },
            installmentData: {
              $push: {
                title: "$installmentData.label",
                totalAmount: "$installmentData.totalAmount",
                plannedAmount: "$installmentData.plannedAmount",
                paidAmount: "$installmentData.paidAmount",
                pendingAmount: "$installmentData.pendingAmount",
                discountAmount: "$installmentData.discountAmount",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            regId: "$_id.studentRegId",
            studentId: "$_id.studentId",
            studentName: "$_id.studentName",
            campusId: "$_id.campusId",
            section: "$_id.section",
            displayName: "$_id.displayName",
            studentPhone: "$_id.studentPhone",
            studentEmail: "$_id.studentEmail",
            parentName: "$_id.parentName",
            parentPhone: "$_id.parentPhone",
            parentEmail: "$_id.parentEmail",
            category: "$_id.category",
            programPlanId: "$_id.programPlanId",
            totalAmount: "$_id.totalAmount",
            totalPlannedAmount: "$_id.totalPlannedAmount",
            totalPaidAmount: "$_id.totalPaidAmount",
            totalPendingAmount: "$_id.totalPendingAmount",
            totalDiscount: "$_id.totalDiscount",
            installmentData: "$installmentData",
          },
        },
      ];
      const totalData = await studentFeePlanModel.aggregate(studentAggregator);
      for (let i = 0; i < totalData.length; i++) {
        let campusDetail = [];
        const item = totalData[i];
        campusDetail = allCampus.filter((CampusItem) => {
          if (item.campusId == CampusItem._id) {
            return CampusItem;
          }
        });
        if (campusDetail.length != 0) {
          item["campusName"] = campusDetail[0].displayName;
        } else {
          item["campusName"] = "";
        }
      }
      for (let i = 0; i < totalData.length; i++) {
        let campusDetail = [];
        const item = totalData[i];
        campusDetail = allProgramPlan.filter((CampusItem) => {
          if (String(item.programPlanId) == String(CampusItem._id)) {
            return CampusItem;
          }
        });
        if (campusDetail.length != 0) {
          item["classBatch"] = campusDetail[0].title;
        } else {
          item["classBatch"] = "";
        }
      }
      for (let i = 0; i < totalData.length; i++) {
        let campusDetail = [];
        campusDetail = totalData.sort(function (a, b) {
          return a.regId - b.regId;
        });
        return campusDetail;
      }
      return totalData;
    }
    async function findSearchData(data, srchVal) {
      let searchedVal = [];
      if (data.length == 0) {
        return searchedVal;
      } else {
        data.map((dataOne, i) => {
          if (
            String(dataOne.regId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.studentName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.section).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.displayName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.studentPhone).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.studentEmail).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.parentName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.parentPhone).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.parentEmail).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.category).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.programPlanId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.totalAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.totalPlannedAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.totalPaidAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.totalPendingAmount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.campusId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.programPlanId).toLowerCase().includes(String(srchVal).toLowerCase()) == true
          ) {
            searchedVal.push(dataOne);
          } else {
          }
        });
        return searchedVal;
      }
    }
  }
  catch (err) {
    console.log(err);
    res.send({
      status: "failed",
      message: err,
    });
    centralDbConnection.close();
    dbConnection.close();
  } finally {
  }
};


// API DETAILS

// (1) FEE COLLECTION DATA
// URL: /edu/studentFeeCollection?orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All&page=4&limit=10&searchKey=100
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId *
// 	-- 5fa8daece3eb1f18d4250e98
// 2) campus 
// 	-- All
// 	-- 60a78345d9da6012d081518a
// 3) programPlan 
// 	-- All
// 	-- program plan id's (Ex: 60a78366d9da6012d0815224)
// 4) fromDate *
// 	-- Format (yyyy-mm-dd)
// 5) toDate *
// 	-- Format (yyyy-mm-dd)
// 6) page 
// 	-- Number(0-9)
// 7)limit 
// 	-- Number(0-9)
// 8) searchKey 
// 	-- string

