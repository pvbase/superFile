const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../../models/orglists-schema");

// (1) REFUND REPORTS DATA
module.exports.getReportsRefund = async (req, res) => {
  const {
    orgId,
    campus,
    programPlan,
    page,
    limit,
    fromDate,
    toDate,
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
  var transactionModel = await dbConnection.model("transactions", allSchema);
  var feeLedgersModel = await dbConnection.model("feesledgers", allSchema);
  var studentModel = dbConnection.model("students", allSchema);
  var transAggr = {};
  var getFinalResult = [];
  try {
    var newToDate = new Date(toDate);
    newToDate = newToDate.setDate(newToDate.getDate() + 1);
    transAggr.createdAt = {
      $gte: new Date(fromDate),
      $lte: new Date(newToDate),
    };
    transAggr.transactionSubType = String("refund");

    if (
      programPlan != undefined &&
      String(programPlan).toLocaleLowerCase() != "all"
    ) {
      transAggr.programPlan = mongoose.Types.ObjectId(programPlan);
    }
    await transactionModel.find(transAggr, async (error, results) => {
      for (let i = 0; i < results.length; i++) {
        var getFeeLedgersData = await feeLedgersModel.find({
          transactionId: mongoose.Types.ObjectId(results[i]._doc._id),
        });
        if (
          campus != undefined &&
          String(campus).toLocaleLowerCase() != "all"
        ) {
          await studentModel.find(
            { _id: mongoose.Types.ObjectId(results[i]._doc.studentId) },
            (stErr, stResp) => {
              if (stResp.length > 0) {
                if (stResp[0]._doc.campusId == campus) {
                  getFinalResult.push({
                    _id: results[i]._doc._id,
                    demandNoteId:
                      getFeeLedgersData.length == 0
                        ? null
                        : getFeeLedgersData[0],
                    refundId: results[i]._doc.displayName,
                    regId: results[i]._doc.studentRegId,
                    studentName: results[i]._doc.studentName,
                    academicYear: results[i]._doc.academicYear,
                    classBatch: results[i]._doc.class,
                    description: results[i]._doc.data.feesBreakUp,
                    refundedOn: results[i]._doc.transactionDate,
                    refunded: results[i]._doc.amount,
                    mode:
                      results[i]._doc.data.mode == undefined
                        ? null
                        : results[i]._doc.data.mode,
                    txnId: results[i]._doc.paymentTransactionId,
                    transactionSubType: results[i]._doc.transactionSubType,
                    status: results[i]._doc.status,
                  });
                  console.log(getFinalResult);
                }
              }
            }
          );
        } else {
          var getFeeLedgersData = await feeLedgersModel.find({
            transactionId: mongoose.Types.ObjectId(results[i]._doc._id),
          });
          getFinalResult.push({
            _id: results[i]._doc._id,
            demandNoteId:
              getFeeLedgersData.length == 0 ? null : getFeeLedgersData[0],
            refundId: results[i]._doc.displayName,
            regId: results[i]._doc.studentRegId,
            studentName: results[i]._doc.studentName,
            academicYear: results[i]._doc.academicYear,
            classBatch: results[i]._doc.class,
            description: results[i]._doc.data.feesBreakUp,
            refundedOn: results[i]._doc.transactionDate,
            refunded: results[i]._doc.amount,
            mode:
              results[i]._doc.data.mode == undefined
                ? null
                : results[i]._doc.data.mode,
            txnId: results[i]._doc.paymentTransactionId,
            transactionSubType: results[i]._doc.transactionSubType,
            status: results[i]._doc.status,
          });
        }
      }
      if (page == undefined || limit == undefined) {
        var getPaginatedData = getFinalResult;
        var calcTotpage = null;
        res.send({
          status: "success",
          data: getPaginatedData,
          totalPage: calcTotpage,
          currentPage: Number(page),
          perPage: Number(limit),
          nextPage:
            calcTotpage == null
              ? null
              : Number(page) < calcTotpage
                ? Number(page) + 1
                : null,
        });
        centralDbConnection.close();
        dbConnection.close();
      } else if (searchKey != undefined && searchKey != "") {
        let getSearchValues = await searchData(getFinalResult);
        var getSearchedData =
          getSearchValues == undefined ? [] : getSearchValues;
        var getPaginatedData = await paginateArray(
          getSearchedData,
          page,
          limit
        );
        var calcTotpage = Math.ceil(
          Number(getSearchedData.length) / Number(limit)
        );
        res.send({
          status: "success",
          data: getPaginatedData,
          totalPage: calcTotpage,
          currentPage: Number(page),
          perPage: Number(limit),
          nextPage:
            calcTotpage == null
              ? null
              : Number(page) < calcTotpage
                ? Number(page) + 1
                : null,
        });
        centralDbConnection.close();
        dbConnection.close();
      } else {
        var getPaginatedData = await paginateArray(getFinalResult, page, limit);
        var calcTotpage = Math.ceil(Number(results.length) / Number(limit));
        res.send({
          status: "success",
          data: getPaginatedData,
          totalPage: calcTotpage,
          currentPage: Number(page),
          perPage: Number(limit),
          nextPage:
            calcTotpage == null
              ? null
              : Number(page) < calcTotpage
                ? Number(page) + 1
                : null,
        });
        centralDbConnection.close();
        dbConnection.close();
      }
    });
    async function paginateArray(array, index, size) {
      index = Math.abs(parseInt(index));
      index = index > 0 ? index - 1 : index;
      size = parseInt(size);
      size = size < 1 ? 1 : size;
      return [
        ...array.filter((value, n) => {
          return n >= index * size && n < (index + 1) * size;
        }),
      ];
    }
    async function searchData(data) {
      var searchedData = [];
      if (data.length == 0) {
      } else {
        let searchData = String(searchKey).toLowerCase();
        for (let i = 0; i < data.length; i++) {
          if (
            String(data[i].demandNoteId).toLowerCase().includes(searchData) ==
            true ||
            String(data[i].refundId).toLowerCase().includes(searchData) ==
            true ||
            String(data[i].regId).toLowerCase().includes(searchData) == true ||
            String(data[i].studentName).toLowerCase().includes(searchData) ==
            true ||
            String(data[i].academicYear).toLowerCase().includes(searchData) ==
            true ||
            String(data[i].classBatch).toLowerCase().includes(searchData) ==
            true ||
            String(data[i].description).toLowerCase().includes(searchData) ==
            true ||
            String(new Date(data[i].refundedOn).toLocaleDateString())
              .toLowerCase()
              .includes(searchData) == true ||
            String(data[i].refunded).toLowerCase().includes(searchData) ==
            true ||
            String(data[i].mode).toLowerCase().includes(searchData) == true ||
            String(data[i].txnId).toLowerCase().includes(searchData) == true ||
            String(data[i].transactionSubType)
              .toLowerCase()
              .includes(searchData) == true ||
            String(data[i].status).toLowerCase().includes(searchData) == true
          ) {
            searchedData.push(data[i]);
          } else {
          }
        }
        return searchedData;
      }
    }
  } catch (err) {
    res.send({
      status: "failed",
      data: {},
      message: err,
    });
    centralDbConnection.close();
    dbConnection.close();
  } finally {
    // centralDbConnection.close()
    // dbConnection.close()
  }
};

// API DETAILS

// (1) REFUND REPORTS DATA
// URL: /edu/getRefundReport?orgId=5fd080be1e5c6245ccf50d5a&campus=All&programPlan=All&fromDate=2021-04-01&toDate=2021-05-28&page=1&limit=10&searchKey=5440
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

// 8) searchKey
//  -- string
