const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const { dataPagination } = require("./reports-support");
const orgListSchema = require("../../models/orglists-schema");

// (1) GET DEMAND NOTE DATA - (TRANSACTIONS & REPORTS)
module.exports.getDemandNoteData = async (req, res) => {
  const {
    orgId,
    campus,
    programPlan,
    fromDate,
    toDate,
    page,
    limit,
    searchKey,
  } = req.query;
  let dbConnection;
  let centralDbConnection;
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
  dbConnection = await createDatabase(
    String(orgData._doc._id),
    orgData._doc.connUri
  );
  var transactionModel = dbConnection.model("transactions", allSchema);
  var studentFeePlanModel = dbConnection.model("studentfeeplans", allSchema);
  var dmdAggr = {};
  try {
    dmdAggr.transactionSubType = "demandNote";
    if (
      programPlan != undefined &&
      String(programPlan).toLocaleLowerCase() != "all"
    ) {
      dmdAggr.programPlan = mongoose.Types.ObjectId(programPlan);
    }
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
      dmdAggr.campusId = String(campus);
    }
    if (fromDate !== undefined && toDate != undefined) {
      var newToDate = new Date(toDate);
      newToDate = newToDate.setDate(newToDate.getDate() + 1);
      dmdAggr.transactionDate = {
        $gte: new Date(fromDate),
        $lte: new Date(newToDate),
      };
    }
    if (searchKey != undefined && searchKey != "") {
      let studkeyName = [
        "displayName",
        "studentRegId",
        "studentName",
        "parentName",
        "class",
        "academicYear",
        "amount",
        "status",
      ];
      let getDetails = await searchCollection(
        "transactions",
        studkeyName,
        searchKey
      );
      let paginateData = await dataPagination(getDetails, page, limit);
      let arrangeData = [];
      for (let i = 0; i < paginateData.length; i++) {
        let feePlnAggr = [
          {
            $match: {
              studentRegId: paginateData[i]._doc.studentRegId,
            },
          },
          {
            $group: {
              _id: 0,
              data: {
                $push: {
                  total: "$plannedAmount",
                  paid: "$paidAmount",
                  pending: "$pendingAmount",
                },
              },
            },
          },
          {
            $project: {
              data: "$data",
            },
          },
        ];
        let getFinalData = await studentFeePlanModel.aggregate(feePlnAggr);
        let dummyObj = { ...paginateData[i]._doc };
        dummyObj["totalPlannedAmount"] =
          getFinalData.length != 0 ? getFinalData[0].data[0].total : null;
        dummyObj["totalPaidAmount"] =
          getFinalData.length != 0 ? getFinalData[0].data[0].paid : null;
        dummyObj["totalPendingAmount"] =
          getFinalData.length != 0 ? getFinalData[0].data[0].pending : null;
        arrangeData.push(dummyObj);
      }
      var calcTotpage = Math.ceil(Number(getDetails.length) / Number(limit));
      res.send({
        status: "success",
        data: arrangeData,
        totalPage: calcTotpage,
        currentPage: Number(page),
        perPage: Number(limit),
        nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null,
      });
      centralDbConnection.close();
      dbConnection.close();
    } else {
      let getDetails = await transactionModel.find(dmdAggr);
      let paginateData = await dataPagination(getDetails, page, limit);
      let arrangeData = [];
      for (let i = 0; i < paginateData.length; i++) {
        let feePlnAggr = [
          {
            $match: {
              studentRegId: paginateData[i]._doc.studentRegId,
            },
          },
          {
            $group: {
              _id: 0,
              data: {
                $push: {
                  total: "$plannedAmount",
                  paid: "$paidAmount",
                  pending: "$pendingAmount",
                },
              },
            },
          },
          {
            $project: {
              data: "$data",
            },
          },
        ];
        let getFinalData = await studentFeePlanModel.aggregate(feePlnAggr);
        let dummyObj = { ...paginateData[i]._doc };
        dummyObj["totalPlannedAmount"] =
          getFinalData.length != 0 ? getFinalData[0].data[0].total : null;
        dummyObj["totalPaidAmount"] =
          getFinalData.length != 0 ? getFinalData[0].data[0].paid : null;
        dummyObj["totalPendingAmount"] =
          getFinalData.length != 0 ? getFinalData[0].data[0].pending : null;
        arrangeData.push(dummyObj);
      }
      var calcTotpage = Math.ceil(Number(getDetails.length) / Number(limit));
      res.send({
        status: "success",
        data: arrangeData,
        totalPage: calcTotpage,
        currentPage: Number(page),
        perPage: Number(limit),
        nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null,
      });
      centralDbConnection.close();
      dbConnection.close();
    }
    async function searchCollection(colName, srchKeys, searchData) {
      var searchedArr = [];
      var searchModel = dbConnection.model(`${colName}`, allSchema);
      for (let i = 0; i < srchKeys.length; i++) {
        let obj = {};
        obj[srchKeys[i]] = { $regex: `.*${searchData}.*`, $options: "i" };
        searchedArr.push(obj);
      }
      const filteredVal = await searchModel.find({
        $and: [{ $or: searchedArr }],
        transactionSubType: "demandNote",
      });
      return filteredVal;
    }
  } catch (err) {
    res.send({
      status: "failed",
      data: [],
    });
    centralDbConnection.close();
    dbConnection.close();
  } finally {
    // centralDbConnection.close()
    // dbConnection.close()
  }
};

// API DETAILS

// (1) GET DEMAND NOTE DATA
// URL: edu/getDemandNote?orgId=5fd080be1e5c6245ccf50d5a&campus=All&programPlan=All&fromDate=2021-04-31&toDate=2021-05-31&page=1&limit=10&searchKey=00
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId
//  -- 5fa8daece3eb1f18d4250e98

// 2) Campus
// 	-- All
// 	-- campus id's (Ex: 60654c035fd59b0cf8bf21e6)

// 3) programPlan
// 	-- All
// 	-- program plan id's (Ex: 60654c375fd59b0cf8bf2251)

// 4) fromDate
// 	-- Format (yyyy-mm-dd)

// 5) toDate
// 	-- Format (yyyy-mm-dd)

// 6) page
//  -- Number(0-9)

// 7) limit
//  -- Number(0-9)

// searchKey
//  --String()
