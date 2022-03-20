const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
var moment = require("moment");
const reportsController = require("../reportsController");
const { includes } = require("lodash");
const categorySchema = require("../../models/categoryModel");
const allSchema = mongoose.Schema({}, { strict: false });

module.exports.getReportCheck = async (req, res) => {
  var dbUrl = req.headers.resource;
  const { orgId, type, searchKey, fromDate, toDate, programPlan, campus } =
    req.query;
  var dbConnection = await createDatabase(orgId, dbUrl);
  var studentsModel = dbConnection.model("students", allSchema);
  var transactionModel = dbConnection.model("transactions", allSchema);
  var studentFeesMapsModel = dbConnection.model("studentfeesmaps", allSchema);
  var studentFeePlansModel = dbConnection.model("studentfeeplans", allSchema);
  var studentFeeInstPlansModel = dbConnection.model(
    "studentfeeinstallmentplans",
    allSchema
  );
  var feesLedgersModel = dbConnection.model("feesledgers", allSchema);
  var feeManagersModel = dbConnection.model("feemanagers", allSchema);
  var programPlanModel = dbConnection.model("programplans", allSchema);
  var finalData = [];
  var totalStudents = 0;
  var transactNewAggr = {};
  try {
    if (type == "1") {
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
                  pendingAmount: { $sum: "$pendingAmount" },
                },
              },
              {
                $project: {
                  total: "$pendingAmount",
                },
              },
            ];
            var getTotal = await studentFeeInstPlansModel.aggregate(insAggr);
            let insTotal = getTotal.length != 0 ? Number(getTotal[0].total) : 0;
            if (Number(insTotal) == Number(results[i]._doc.pendingAmount)) {
            } else {
              totalResp.push({
                _id: results[i]._doc._id,
                feePlanPendAmount: results[i]._doc.pendingAmount,
                InstPendAmount: insTotal,
              });
              console.log(
                "_id:",
                results[i]._doc._id,
                "feePlanPendAmount:",
                results[i]._doc.pendingAmount,
                "InstPendAmount:",
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
          console.log(
            "status: finished",
            "totalDifference:",
            Math.abs(Number(diff1 - diff2))
          );
        }
      });
    } else if (type == "2") {
      await studentsModel.find({}, async (stErr, stResp) => {
        let diff1 = 0;
        diff2 = 0;
        var getTotal = [];
        if (stResp.length == 0) {
          res.send({
            status: "success",
            data: [],
            message: "no data available",
          });
        } else {
          console.log("started");
          for (let z = 0; z < stResp.length; z++) {
            let tranAggr = [
              {
                $match: {
                  studentRegId: String(stResp[z]._doc.regId),
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
            let transactionTot = await transactionModel.aggregate(tranAggr);
            let getTxnTot =
              transactionTot.length != 0 ? transactionTot[0].total : 0;

            let ledgerAggr = [
              {
                $match: {
                  studentRegId: String(stResp[z]._doc.regId),
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
            let ledgerTot = await feesLedgersModel.aggregate(ledgerAggr);
            let getLedgerTot = ledgerTot.length != 0 ? ledgerTot[0].total : 0;
            if (Number(getTxnTot) == Number(getLedgerTot)) {
            } else {
              diff1 = Number(diff1) + Number(getTxnTot);
              diff2 = Number(diff2) + Number(getLedgerTot);
              getTotal.push({
                studentId: stResp[z]._doc.regId,
                transactionTotal: Number(getTxnTot),
                ledgerTotal: Number(getLedgerTot),
              });
              console.log(
                "studentId",
                stResp[z]._doc.regId,
                "transactionTotal:",
                Number(getTxnTot),
                "ledgerTotal:",
                Number(getLedgerTot)
              );
            }
          }
          res.send({
            status: "success",
            totalDifference: Math.abs(Number(diff1 - diff2)),
            data: getTotal,
          });
          console.log(
            "status: finished",
            "Total Difference:",
            Math.abs(Number(diff1 - diff2))
          );
        }
      });
    }

    // let pgmNewAggr = {};
    // let academicYear = ''
    // let endYear = new Date().getFullYear() + 1
    // let startYear = new Date().getFullYear()
    // academicYear = startYear + '-' + endYear.toString().substr(endYear.toString().length - 2, 2);
    // // pgmNewAggr.academicYear = academicYear;
    // if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != 'all') {
    //     pgmNewAggr._id = mongoose.Types.ObjectId(programPlan);
    // }
    // let pgmAggr = [
    //     {
    //         $match: pgmNewAggr
    //     },
    //     {
    //         $lookup: {
    //             from: "studentfeesmaps",
    //             localField: "_id",
    //             foreignField: "programPlanId",
    //             as: "feeMapData",
    //         }
    //     },
    //     {
    //         $group: {
    //             _id: 0,
    //             data: {
    //                 $push: {
    //                     _id: "$_id",
    //                     programPlanName: "$title",
    //                     academicYear: "$academicYear",
    //                     plannedAmnt: { $sum: "$feeMapData.amount" },
    //                     pendingAmt: { $sum: "$feeMapData.pending" },
    //                     totalStudents: { $size: "$feeMapData" },
    //                     paidAmt: 0
    //                 }
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             data: "$data"
    //         }
    //     }
    // ];
    // var getPgmData = await programPlanModel.aggregate(pgmAggr);

    // transactNewAggr.transactionSubType = "feePayment"
    // var newToDate = new Date(toDate);
    // newToDate = newToDate.setDate(newToDate.getDate() + 1);
    // transactNewAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
    // if (campus != undefined && String(campus).toLocaleLowerCase() != 'all') {
    //     transactNewAggr.campusId = String(campus);
    // }
    // var totalAmnt = 0;
    // for (let i = 0; i < getPgmData[0].data.length; i++) {
    //     transactNewAggr.programPlan = getPgmData[0].data[i]._id;
    //     let txnCalcAggr = [
    //         {
    //             $match: transactNewAggr
    //         },
    //         {
    //             $group: {
    //                 _id: 0,
    //                 data: {$sum: "$amount"}
    //             }
    //         },
    //         {
    //             $project: {
    //                 data: "$data"
    //             }
    //         }
    //     ];
    //     var getTransactTotal = await transactionModel.aggregate(txnCalcAggr);
    //     getPgmData[0].data[i].paidAmt = Number(getTransactTotal.length != 0 ? getTransactTotal[0].data : 0)
    //     totalAmnt = Number(totalAmnt) + Number(getTransactTotal.length != 0 ? getTransactTotal[0].data : 0);
    // }
    // console.log(totalAmnt);
    // res.send({ length: getPgmData[0].data.length, data: getPgmData[0].data })
  } catch (err) {
    // try {
    //     var feemapMatch = {};
    //     feemapMatch.status = "1";
    //     feemapMatch.paid = 0
    //     var feeMapAggr = [
    //         {
    //             $match: feemapMatch
    //         },
    //         {
    //             $group: {
    //                 "_id": "$_id",
    //                 "data": {
    //                     $push: {
    //                         amount: "$amount",
    //                         paid: "$paid",
    //                         pending: "$pending",
    //                         fine: "$fine",
    //                         studentId: "$studentId",
    //                         programPlanId: "$programPlanId",
    //                         _id: "$_id"
    //                     }
    //                 }

    //             }
    //         },
    //         {
    //             $project: {
    //                 data: "$data"
    //             }
    //         }
    //     ];
    //     var getListOfPendStud = await studentFeesMapsModel.aggregate(feeMapAggr);
    //     var studkeyName = ["firstName", "lastName", "displayName", "regId", "phoneNo", "email", "parentName", "parentPhone", "parentEmail"];
    //     var feeMapKeyName = ["amount", "paid", "pending", "fine"];
    //     var pgmPlnKeyName = ["name", "title", "academicYear"];
    //     var studSearchResult = await searchCollection('students', studkeyName, searchKey);
    //     var feemapSearchRes = await searchCollection('studentfeesmaps', feeMapKeyName, searchKey);
    //     var prgmPlnSearchRes = await searchCollection('campuses', pgmPlnKeyName, searchKey);
    //     if (studSearchResult.length != 0) {
    //         var filterByPagination = await paginateArray(studSearchResult, 1, 10);
    //         for (let i = 0; i < filterByPagination.length; i++) {
    //             let dummyObj = {};
    //         }
    //     }
    //     // res.send({
    //     //     status: "success",
    //     //     length: getSearchResult.length,
    //     //     data: getSearchResult
    //     // })
    //     res.send({ length: getListOfPendStud.length, data: getListOfPendStud });
    //     async function searchCollection(colName, srchKeys, searchData) {
    //         var searchedArr = [];
    //         var searchModel = dbConnection.model(`${colName}`, allSchema);
    //         for (let i = 0; i < srchKeys.length; i++) {
    //             let obj = {};
    //             obj[srchKeys[i]] = { '$regex': `.*${searchData}.*`, '$options': 'i' }
    //             searchedArr.push(obj)
    //         }
    //         const filteredVal = await searchModel.find({ $and: [{ $or: searchedArr }] });
    //         return filteredVal;
    //     }
    //     async function paginateArray(array, index, size) {
    //         index = Math.abs(parseInt(index));
    //         index = index > 0 ? index - 1 : index;
    //         size = parseInt(size);
    //         size = size < 1 ? 1 : size;
    //         return [...(array.filter((value, n) => {
    //             return (n >= (index * size)) && (n < ((index + 1) * size))
    //         }))]
    //     }
    // }
    res.send({ data: "error" });
  } finally {
  }
};
