const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../../models/orglists-schema");

// REPORTS SUPPORTING CONTROLLERS
// (1) PROGRAM PLAN DATA
module.exports.getProgramPlanId = async (req, res) => {
  const { orgId } = req.query;
  let dbConnection;
  let centralDbConnection;
  centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
  const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
  dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);
  let programPlanModel = dbConnection.model("programplans", allSchema);
  var getProgramPlanDetails = [];

  let academicYear = "";
  let endYear = new Date().getFullYear() + 1;
  let startYear = new Date().getFullYear();
  academicYear = startYear + "-" + endYear.toString().substr(endYear.toString().length - 2, 2);
  try {
    var programPlanAggr = [
      {
        $match: {
          academicYear: String(academicYear),
        },
      },
      {
        $project: {
          label: "$title",
          value: "$displayName",
        },
      },
    ];
    getProgramPlanDetails = await programPlanModel.aggregate(programPlanAggr);
    res.send({
      status: "success",
      data: await sortingData(getProgramPlanDetails),
    });
    centralDbConnection.close()
    dbConnection.close()
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
    res.send({
      status: "failed",
      data: [],
    });
    centralDbConnection.close()
    dbConnection.close()
  }
  finally {
    // centralDbConnection.close()
    // dbConnection.close()
  }
};

// (2) REPORTS DATA PAGINATION
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

// (3) CONVERT TO CURRENCY FORMAT 
exports.convertToCurrency = async function (number) {
  let getNum = Number(number);
  // let convertData = Number(getNum).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  return getNum
}

// API DETAILS
// (1) PROGRAM PLAN DATA
// URL: /edu/programPlanData?orgId=5fa8daece3eb1f18d4250e98
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) orgId
//  -- 5fa8daece3eb1f18d4250e98
