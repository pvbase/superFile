const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../../models/orglists-schema");

// PROGRAM PLAN DATA
module.exports.getProgramPlanId = async (req, res) => {
  const { orgId, campus } = req.query;
  if (orgId != undefined) {
    const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(400).send({
        status: "failure",
        message: "Organization not found"
      });
    }
    const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

    const programPlanModel = dbConnection.model("programplans", allSchema);

    let academicYear = "";
    let endYear = new Date().getFullYear() + 1;
    let startYear = new Date().getFullYear();
    academicYear = startYear + "-" + endYear.toString().substr(endYear.toString().length - 2, 2);
    try {
      let pgmAggr = {};
      if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
        pgmAggr.campusId = String(campus);
      }
      pgmAggr.academicYear = String(academicYear);
      var programPlanAggr = [
        {
          $match: pgmAggr
        },
        {
          $project: {
            label: "$title",
            value: "$displayName",
          },
        },
      ];
      const getProgramPlanDetails = await programPlanModel.aggregate(programPlanAggr);
      res.status(200).send({
        status: "success",
        data: await sortingData(getProgramPlanDetails),
        message: "Successfully sorted program plan data."
      });
      centralDbConnection.close();
      dbConnection.close();
      async function sortingData(arr) {
        const sorter = (a, b) => {
          const isNumber = (v) => (+v).toString() === v;
          const aPart = a.label.match(/\d+|\D+/g);
          const bPart = b.label.match(/\d+|\D+/g);
          let i = 0; let len = Math.min(aPart.length, bPart.length);
          while (i < len && aPart[i] === bPart[i]) { i++; };
          if (i === len) {
            return aPart.length - bPart.length;
          };
          if (isNumber(aPart[i]) && isNumber(bPart[i])) {
            return aPart[i] - bPart[i];
          };
          return aPart[i].localeCompare(bPart[i]);
        };
        return arr.sort(sorter);
      }
    }
    catch (err) {
      res.status(400).send({
        status: "failed",
        message: err.message
      });
      centralDbConnection.close();
      dbConnection.close();
    }
    finally { }
  }
  else {
    res.status(400).send({
      status: "failed",
      message: "Report 'orgId' query is missing. please provide all the required parameters."
    })
  }
};

// CAMPUS DATA
module.exports.getCampusId = async (req, res) => {
  const { orgId } = req.query;
  if (orgId != undefined) {
    const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
    const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
    const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(400).send({
        status: "failure",
        message: "Organization not found"
      });
    }
    const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

    const campusModel = dbConnection.model("campuses", allSchema);

    try {
      let campusAggr = [
        {
          $project: {
            label: "$name",
            value: "$campusId",
          },
        },
      ];
      const getCampusDetails = await campusModel.aggregate(campusAggr);
      res.status(200).send({
        status: "success",
        data: getCampusDetails,
        message: "Successfully sorted campus data."
      });
    }
    catch (err) {
      res.status(400).send({
        status: "failed",
        message: err.message
      });
    }
    finally { }
  }
  else {
    res.status(400).send({
      status: "failed",
      message: "Report 'orgId' query is missing. please provide all the required parameters."
    })
  }
}

// REPORTS DATA PAGINATION
exports.dataPagination = async function (array, index, size) {
  index = Math.abs(parseInt(index));
  index = index > 0 ? index - 1 : index;
  size = parseInt(size);
  size = size < 1 ? 1 : size;
  return [
    ...array.filter((value, n) => {
      return n >= index * size && n < (index + 1) * size;
    }),
  ];
};

// CONVERT TO CURRENCY FORMAT 
exports.convertToCurrency = async function (number) {
  let getNum = Number(number);
  // let convertData = Number(getNum).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  return getNum
}

// CAPS FIRST LETTER 
exports.convertToCaps = async function (data) {
  return data.charAt(0).toUpperCase() + data.slice(1);
}

// API DETAILS

// PROGRAM PLAN DATA
// URL: /edu/programPlanData?orgId=5fa8daece3eb1f18d4250e98
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId
//  -- 5fa8daece3eb1f18d4250e98

// CAMPUS DATA
// URL: /edu/campusData?orgId=5fa8daece3eb1f18d4250e98
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId
//  -- 5fa8daece3eb1f18d4250e98
