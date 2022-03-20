const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const { dataPagination } = require("./reports-support");
const orgListSchema = require("../../models/orglists-schema");

// (1) REPORTS-LOANS DATA + TRANSACTION-LOANS DATA (GET)
module.exports.getLoanReports = async (req, res) => {
  const {
    orgId,
    campus,
    fromDate,
    toDate,
    programPlan,
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
  var loanAggr = {};
  try {
    loanAggr["data.mode"] = "Loan";
    var newToDate = new Date(toDate);
    newToDate = newToDate.setDate(newToDate.getDate() + 1);
    if (fromDate == undefined || toDate == undefined) {
    } else {
      loanAggr.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(newToDate),
      };
    }
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
      loanAggr.campusId = String(campus);
    }
    if (
      programPlan != undefined &&
      String(programPlan).toLocaleLowerCase() != "all"
    ) {
      loanAggr.programPlan = mongoose.Types.ObjectId(programPlan);
    }
    if (page == undefined || limit == undefined) {
      await transactionModel.find(loanAggr, async (error, results) => {
        res.send({
          status: "success",
          data: results,
          totalData: results.length,
          totalPage: null,
          currentPage: null,
          perPage: null,
          nextPage: null,
        });
        centralDbConnection.close();
        dbConnection.close();
      });
    } else if (searchKey != undefined && searchKey != "") {
      await transactionModel.find(loanAggr, async (error, results) => {
        if (results.length == 0) {
        } else {
          let getSearchedValues = await searchData(results);
          let searchJsonData =
            getSearchedValues == undefined ? [] : getSearchedValues;
          var convertPaginate = await dataPagination(
            searchJsonData,
            page,
            limit
          );
          var calcTotpage = Math.ceil(
            Number(searchJsonData.length) / Number(limit)
          );
          res.send({
            status: "success",
            data: convertPaginate,
            totalPage: calcTotpage,
            currentPage: Number(page),
            perPage: Number(limit),
            nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null,
          });
          centralDbConnection.close();
          dbConnection.close();
        }
      });
    } else {
      await transactionModel.find(loanAggr, async (error, results) => {
        var calcTotpage = Math.ceil(Number(results.length) / Number(limit));
        var convertPaginate = await dataPagination(results, page, limit);
        res.send({
          status: "success",
          data: convertPaginate,
          totalPage: calcTotpage,
          currentPage: Number(page),
          perPage: Number(limit),
          nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null,
        });
        centralDbConnection.close();
        dbConnection.close();
      });
    }
    async function searchData(data) {
      var searchedData = [];
      if (data.length == 0) {
      } else {
        let searchData = String(searchKey).toLowerCase();
        for (let i = 0; i < data.length; i++) {
          if (
            String(data[i]._doc.studentRegId)
              .toLowerCase()
              .includes(searchData) == true ||
            String(data[i]._doc.studentName)
              .toLowerCase()
              .includes(searchData) == true ||
            String(data[i]._doc.class).toLowerCase().includes(searchData) ==
            true ||
            String(data[i]._doc.academicYear)
              .toLowerCase()
              .includes(searchData) == true ||
            String(data[i]._doc.amount).toLowerCase().includes(searchData) ==
            true ||
            String(new Date(data[i]._doc.transactionDate).toLocaleDateString())
              .toLowerCase()
              .includes(searchData) == true ||
            String(data[i]._doc.status).toLowerCase().includes(searchData) ==
            true ||
            String(data[i]._doc.displayName)
              .toLowerCase()
              .includes(searchData) == true ||
            String(data[i]._doc.currency).toLowerCase().includes(searchData) ==
            true ||
            String(data[i]._doc.data.provider)
              .toLowerCase()
              .includes(searchData) == true ||
            String(data[i]._doc.currencyAmount)
              .toLowerCase()
              .includes(searchData) == true
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

// (1) REPORTS-LOANS DATA + TRANSACTION-LOANS DATA (GET)
// URL: /edu/getLoanData?orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All&fromDate=2021-04-01&toDate=2021-05-28&page=5&limit=10&searchKey=RCPT_2021-22_1180
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
