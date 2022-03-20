const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../../models/orglists-schema");

module.exports.checkReportData = async (req, res) => {
  const { orgId, type } = req.query;

  if (orgId != undefined) {
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
      _id: mongoose.Types.ObjectId(orgId),
    });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(400).send({
        status: "failure",
        message: "Organization not found",
      });
    }
    const dbConnection = await createDatabase(
      String(orgData._doc._id),
      orgData._doc.connUri
    );

    const studentsModel = dbConnection.model("students", allSchema);
    const campusModel = dbConnection.model("campuses", allSchema);
    const programPlanModel = dbConnection.model("programplans", allSchema);
    const studentFeePlansModel = dbConnection.model(
      "studentfeeplans",
      allSchema
    );
    const studentFeeInstPlansModel = dbConnection.model(
      "studentfeeinstallmentplans",
      allSchema
    );
    const transactionModel = dbConnection.model("transactions", allSchema);
    const feesLedgersModel = dbConnection.model("feesledgers", allSchema);
    const newReportDetail = dbConnection.model("reportdetails", allSchema);

    if (type != undefined) {
      try {
        if (Number(type) == 1) {
          // studentFeePlans vs studentfeeinstallmentplans
          // amount mismatch return studentFeePlans: _id
          // used to calculate (Planned, Paid and pending difference)
          await studentFeePlansModel.find({}, async (error, results) => {
            let diff1 = 0;
            let diff2 = 0;
            let totalResp = [];
            if (results.length == 0) {
              res.send({
                status: "success",
                data: [],
                message: "no data available",
              });
              centralDbConnection.close();
              dbConnection.close();
            } else {
              console.log(
                "studentFeePlans vs studentfeeinstallmentplans - started"
              );
              for (let i = 0; i < results.length; i++) {
                let insAggr = [
                  {
                    $match: {
                      feePlanId: mongoose.Types.ObjectId(results[i]._doc._id),
                    },
                  },
                  {
                    $group: {
                      _id: 0,
                      paidAmount: { $sum: "$paidAmount" },
                    },
                  },
                  {
                    $project: {
                      total: "$paidAmount",
                    },
                  },
                ];
                var getTotal = await studentFeeInstPlansModel.aggregate(
                  insAggr
                );
                let insTotal =
                  getTotal.length != 0 ? Number(getTotal[0].total) : 0;
                if (Number(insTotal) == Number(results[i]._doc.paidAmount)) {
                } else {
                  totalResp.push({
                    _id: results[i]._doc._id,
                    feePlanPaidAmount: results[i]._doc.paidAmount,
                    InstPaidAmount: insTotal,
                  });
                  console.log(
                    "_id:",
                    results[i]._doc._id,
                    "feePlanPaidAmount:",
                    results[i]._doc.paidAmount,
                    "InstPaidAmount:",
                    insTotal
                  );
                  diff1 = Number(diff1) + Number(results[i]._doc.paidAmount);
                  diff2 = Number(insTotal) + Number(diff2);
                }
              }
              res.send({
                status: "success",
                totalDifference: Math.abs(Number(diff1 - diff2)),
                data: totalResp,
              });
              centralDbConnection.close();
              dbConnection.close();
              console.log(
                "status: finished",
                "totalDifference:",
                Math.abs(Number(diff1 - diff2))
              );
            }
          });
        } else if (Number(type) == 2) {
          // studentFeePlans vs transactions difference
          await studentFeePlansModel.find({}, async (error, results) => {
            let diff1 = 0;
            let diff2 = 0;
            let totalResp = [];
            if (results.length == 0) {
              res.send({
                status: "success",
                data: [],
                message: "no data available",
              });
              centralDbConnection.close();
              dbConnection.close();
            } else {
              console.log("studentFeePlans vs transactions - started");
              for (let i = 0; i < results.length; i++) {
                let insAggr = [
                  {
                    $match: {
                      studentRegId: results[i]._doc.studentRegId,
                    },
                  },
                  {
                    $group: {
                      _id: 0,
                      amount: { $sum: "$amount" },
                    },
                  },
                  {
                    $project: {
                      total: "$amount",
                    },
                  },
                ];
                var getTotal = await transactionModel.aggregate(insAggr);
                let insTotal =
                  getTotal.length != 0 ? Number(getTotal[0].total) : 0;
                if (Number(insTotal) == Number(results[i]._doc.paidAmount)) {
                } else {
                  totalResp.push({
                    studentRegId: results[i]._doc.studentRegId,
                    feePlanPendAmount: results[i]._doc.paidAmount,
                    InstPendAmount: insTotal,
                  });
                  console.log(
                    "studentRegId:",
                    results[i]._doc.studentRegId,
                    "feePlanPaidAmount:",
                    results[i]._doc.paidAmount,
                    "transactions:",
                    insTotal
                  );
                  diff1 = Number(diff1) + Number(results[i]._doc.paidAmount);
                  diff2 = Number(insTotal) + Number(diff2);
                }
              }
              res.send({
                status: "success",
                totalDifference: Math.abs(Number(diff1 - diff2)),
                data: totalResp,
              });
              centralDbConnection.close();
              dbConnection.close();
              console.log(
                "status: finished",
                "totalDifference:",
                Math.abs(Number(diff1 - diff2))
              );
            }
          });
        } else if (Number(type) == 3) {
          let getStudData = await studentsModel.aggregate([
            {
              $group: {
                _id: 0,
                data: {
                  $push: "$regId",
                },
              },
            },
            {
              $project: {
                data: "$data",
              },
            },
          ]);
          let getReportDetails = await newReportDetail.aggregate([
            {
              $group: {
                _id: 0,
                data: {
                  $push: "$studentRegId",
                },
              },
            },
            {
              $project: {
                total: "$data",
              },
            },
          ]);
          let a1 = getStudData.length != 0 ? getStudData[0].data : [];
          let a2 =
            getReportDetails.length != 0 ? getReportDetails[0].total : [];
          let intersection = a1.filter((e) => !a2.includes(e));
          res.status(200).send({
            data: intersection,
          });
          centralDbConnection.close();
          dbConnection.close();
        } else if (Number(type) == 4) {
          // studentFeePlans vs studentfeeinstallmentplans
          // amount mismatch return studentFeePlans: _id
          // used to calculate (Planned, Paid and pending difference)
          await studentFeePlansModel.find({}, async (error, results) => {
            let diff1 = 0;
            let diff2 = 0;
            let totalResp = [];
            if (results.length == 0) {
              res.send({
                status: "success",
                data: [],
                message: "no data available",
              });
              centralDbConnection.close();
              dbConnection.close();
            } else {
              console.log(
                "Pending Amount - studentFeePlans vs studentfeeinstallmentplans - started"
              );
              for (let i = 0; i < results.length; i++) {
                let insAggr = [
                  {
                    $match: {
                      feePlanId: mongoose.Types.ObjectId(results[i]._doc._id),
                    },
                  },
                  {
                    $group: {
                      _id: 0,
                      pendingAmount: { $sum: "$pendingAmount" },
                    },
                  },
                  {
                    $project: {
                      total: "$pendingAmount",
                    },
                  },
                ];
                var getTotal = await studentFeeInstPlansModel.aggregate(
                  insAggr
                );
                let insTotal =
                  getTotal.length != 0 ? Number(getTotal[0].total) : 0;
                if (Number(insTotal) == Number(results[i]._doc.pendingAmount)) {
                } else {
                  totalResp.push({
                    _id: results[i]._doc._id,
                    feePlanPaidAmount: results[i]._doc.pendingAmount,
                    InstPaidAmount: insTotal,
                  });
                  console.log(
                    "_id:",
                    results[i]._doc._id,
                    "feePlanPendingAmount:",
                    results[i]._doc.pendingAmount,
                    "InstPendingAmount:",
                    insTotal
                  );
                  diff1 = Number(diff1) + Number(results[i]._doc.pendingAmount);
                  diff2 = Number(insTotal) + Number(diff2);
                }
              }
              res.send({
                status: "success",
                totalDifference: Math.abs(Number(diff1 - diff2)),
                data: totalResp,
              });
              centralDbConnection.close();
              dbConnection.close();
              console.log(
                "status: finished",
                "totalDifference:",
                Math.abs(Number(diff1 - diff2))
              );
            }
          });
        } else {
          res.status(200).send({
            status: "success",
            message: `Report check - entered 'type' query is not matching with register type.`,
          });
          centralDbConnection.close();
          dbConnection.close();
        }
      } catch (err) {
        res.status(400).send({
          status: "failed",
          message: err.message,
        });
        centralDbConnection.close();
        dbConnection.close();
      } finally {
      }
    } else {
      res.status(400).send({
        status: "failed",
        message:
          "Report check 'type' query is missing. Please provide all required parameters.",
      });
    }
  } else {
    res.status(400).send({
      status: "failed",
      message:
        "Report-Test 'orgId' query is missing. please provide all the required parameters.",
    });
  }
};
