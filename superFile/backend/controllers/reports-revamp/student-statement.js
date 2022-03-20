const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../../models/orglists-schema");
const { dataPagination } = require("./reports-support");

// (1) STUDENT STATEMENT DATA
module.exports.getStudentStatement = async (req, res) => {
  const { orgId, campus, programPlan, page, limit, fromDate, toDate, searchKey, academicYear } = req.query;

  let dbConnection;
  let centralDbConnection;
  centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
  const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
  const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
  dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

  var studentModel = dbConnection.model("students", allSchema);
  var transactionModel = dbConnection.model("transactions", allSchema);
  var programPlansModel = dbConnection.model("programplans", allSchema);
  var feeLedgersModel = dbConnection.model("feesledgers", allSchema);
  var studentFeePlanModel = dbConnection.model("studentfeeplans", allSchema);
  var studentFeeInstallmentModel = dbConnection.model("studentfeeinstallmentplans", allSchema);
  var studFilterAggr = {};
  var studPlansAggr = {}
  var gettransactionsData;
  try {
    // studFilterAggr.status = 1;
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
      studFilterAggr.campusId = String(campus);
      studPlansAggr.campusId = String(campus)
    }
    if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
      studFilterAggr.programPlanId = mongoose.Types.ObjectId(programPlan);
    }
    var getFeeLedgerData = await feeLedgersModel.find({});
    // console.log('fee ledgers came');
    var getProgramPlanData = await programPlansModel.find({});
    // console.log('program plan came');
    var getFeePlanData = await studentFeePlanModel.find(studPlansAggr);
    // console.log('fee plans came', getFeePlanData.length);
    var gettransactionsData = await transactionModel.find({ transactionSubType: "feePayment" });
    // await transactionModel.find({ transactionSubType: "feePayment" }, (feeErr, resp) => {
    //   gettransactionsData = resp;
    //   console.log('fee transactions came');
    // })

    var getFinalResult = [];

    await studentModel.find(studFilterAggr, async (studErr, studResp) => {
      // console.log('students data came', studResp.length)
      if (studResp.length == 0) {
        res.send({
          status: "success",
          data: [],
          totalPage: null,
          currentPage: Number(page),
          perPage: Number(limit),
          nextPage: null,
        });
        centralDbConnection.close()
        dbConnection.close()
      }
      else if (searchKey != undefined && searchKey != "") {
        { // for (let i = 0; i < studResp.length; i++) {
          //   let dummyObj = {};

          //   let filterProgramPlan = getProgramPlanData.find(o => String(o._doc._id) == String(studResp[i]._doc.programPlanId));
          //   let filterTransactions = gettransactionsData.filter(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId));
          //   let filterFeePlans = getFeePlanData.find(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId));
          //   dummyObj.statements = [];

          //   if (filterTransactions.length != 0) {
          //     for (let y = 0; y < filterTransactions.length; y++) {
          //       let findFeeLedgerData = getFeeLedgerData.find(o => String(o._doc._id) == String(filterTransactions[y]._doc.feesLedgerIds[filterTransactions[y]._doc.feesLedgerIds.length - 1]));
          //       let txnObj = {};
          //       txnObj.particulars = [];
          //       txnObj.displayName = filterTransactions[y]._doc.displayName;
          //       txnObj.paymentDate = filterTransactions[y]._doc.transactionDate;
          //       txnObj.particulars.push(...filterTransactions[y]._doc.data.feesBreakUp);
          //       txnObj.dueAmount = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
          //       txnObj.paidAmount = filterTransactions[y]._doc.amount;
          //       txnObj.balance = findFeeLedgerData != undefined ? findFeeLedgerData._doc.pendingAmount : "-";
          //       txnObj.paymentMode = filterTransactions[y]._doc.data.method;
          //       txnObj.transactionId = filterTransactions[y]._doc.paymentTransactionId;
          //       txnObj.paymentStatus = filterTransactions[y]._doc.status;
          //       if (txnObj.particulars.length != 0) {
          //         let totalObj = {
          //           amount: filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-",
          //           paid: 0,
          //           pending: 0,
          //           title: "Total"
          //         };
          //         txnObj.particulars.map((data, z) => {
          //           totalObj.paid = Number(data.paid) + Number(totalObj.paid);
          //           totalObj.pending = Number(data.pending) + Number(totalObj.pending);
          //         })
          //         txnObj.particulars.push(totalObj);
          //       }
          //       dummyObj.statements.push(txnObj);
          //     }
          //   }
          //   dummyObj.registerId = studResp[i]._doc.regId;
          //   dummyObj.studentName = studResp[i]._doc.firstName + " " + studResp[i]._doc.lastName;
          //   dummyObj.academicYear = filterProgramPlan !== undefined ? filterProgramPlan._doc.academicYear : "-";
          //   dummyObj.classBatch = filterProgramPlan !== undefined ? filterProgramPlan._doc.title : "-";
          //   dummyObj.totalFees = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
          //   dummyObj.paidAmnt = filterFeePlans != undefined ? filterFeePlans._doc.paidAmount : "-";
          //   dummyObj.pendAmnt = filterFeePlans != undefined ? filterFeePlans._doc.pendingAmount : "-";
          //   getFinalResult.push(dummyObj);
          // }
        }
        let finalResult = []
        if (academicYear == undefined || String(academicYear).toLowerCase() == 'all') { //Query not there
          console.log('no academic query if condition is working')
          // for (let i = 0; i < 25; i++) {
          for (let i = 0; i < studResp.length; i++) {
            // console.log(i + 1,)
            let filterProgramPlan = getProgramPlanData.find(o => String(o._doc._id) == String(studResp[i]._doc.programPlanId));
            let filterFeePlans = getFeePlanData.find(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId));

            if (filterFeePlans) { //filter the current feeplan students
              let dummyObj = {};
              dummyObj.statements = [];
              // gettransactionsData = await transactionModel.find({ transactionSubType: "feePayment", studentRegId: String(studResp[i]._doc.regId), academicYear: String(filterFeePlans._doc.academicYear) })
              let filterTransactions = gettransactionsData.filter(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId) && String(filterFeePlans._doc.academicYear) == String(o._doc.academicYear));
              if (filterTransactions.length != 0) {
                for (let y = 0; y < filterTransactions.length; y++) {
                  let findFeeLedgerData = getFeeLedgerData.find(o => String(o._doc._id) == String(filterTransactions[y]._doc.feesLedgerIds[filterTransactions[y]._doc.feesLedgerIds.length - 1]));
                  let txnObj = {};
                  txnObj.particulars = [];
                  txnObj.displayName = filterTransactions[y]._doc.displayName;
                  txnObj.paymentDate = filterTransactions[y]._doc.transactionDate;
                  txnObj.particulars.push(...filterTransactions[y]._doc.data.feesBreakUp);
                  txnObj.dueAmount = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
                  txnObj.paidAmount = filterTransactions[y]._doc.amount;
                  txnObj.balance = findFeeLedgerData != undefined ? findFeeLedgerData._doc.pendingAmount : "-";
                  txnObj.paymentMode = filterTransactions[y]._doc.data.method;
                  txnObj.transactionId = filterTransactions[y]._doc.paymentTransactionId;
                  txnObj.paymentStatus = filterTransactions[y]._doc.status;
                  if (txnObj.particulars.length != 0) {
                    let totalObj = {
                      amount: filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-",
                      paid: 0,
                      pending: 0,
                      title: "Total"
                    };
                    txnObj.particulars.map((data, z) => {
                      totalObj.paid = Number(data.paid) + Number(totalObj.paid);
                      totalObj.pending = Number(data.pending) + Number(totalObj.pending);
                    })
                    txnObj.particulars.push(totalObj);
                  }
                  dummyObj.statements.push(txnObj);
                }
              }
              dummyObj.registerId = studResp[i]._doc.regId;
              dummyObj.studentName = studResp[i]._doc.firstName + " " + studResp[i]._doc.lastName;
              // dummyObj.academicYear = filterProgramPlan !== undefined ? filterProgramPlan._doc.academicYear : "-";
              dummyObj.academicYear = filterFeePlans !== undefined ? filterFeePlans._doc.academicYear : "-";
              dummyObj.classBatch = filterProgramPlan !== undefined ? filterProgramPlan._doc.title : "-";
              dummyObj.totalFees = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
              dummyObj.paidAmnt = filterFeePlans != undefined ? filterFeePlans._doc.paidAmount : "-";
              dummyObj.pendAmnt = filterFeePlans != undefined ? filterFeePlans._doc.pendingAmount : "-";
              finalResult.push(dummyObj);
            }
          }
        }
        else {  //Query is there 
          console.log('query else condition is working')
          // for (let i = 0; i < 25; i++) {
          for (let i = 0; i < studResp.length; i++) {
            let filterProgramPlan = getProgramPlanData.find(o => String(o._doc._id) == String(studResp[i]._doc.programPlanId));
            let filterFeePlans = getFeePlanData.find(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId));
            // console.log(i + 1)

            if (filterFeePlans) { //filter the current feeplan students
              let dummyObj = {};
              dummyObj.statements = [];
              let installmentData = await studentFeeInstallmentModel.find({ feePlanId: filterFeePlans._doc._id, academicYear: academicYear })
              let installmentFilter = [...installmentData]
              // gettransactionsData = await transactionModel.find({ transactionSubType: "feePayment", studentRegId: String(studResp[i]._doc.regId), academicYear: String(academicYear) })
              let filterTransactions = gettransactionsData.filter(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId) && String(academicYear) == String(o._doc.academicYear));
              if (filterTransactions.length != 0) {
                for (let y = 0; y < filterTransactions.length; y++) {
                  let findFeeLedgerData = getFeeLedgerData.find(o => String(o._doc._id) == String(filterTransactions[y]._doc.feesLedgerIds[filterTransactions[y]._doc.feesLedgerIds.length - 1]));
                  let txnObj = {};
                  txnObj.particulars = [];
                  txnObj.displayName = filterTransactions[y]._doc.displayName;
                  txnObj.paymentDate = filterTransactions[y]._doc.transactionDate;
                  txnObj.particulars.push(...filterTransactions[y]._doc.data.feesBreakUp);
                  // txnObj.dueAmount = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
                  txnObj.dueAmount = installmentFilter.length !== 0 ? installmentFilter[0]._doc.plannedAmount : "-";
                  txnObj.paidAmount = filterTransactions[y]._doc.amount;
                  txnObj.balance = findFeeLedgerData != undefined ? findFeeLedgerData._doc.pendingAmount : "-";
                  txnObj.paymentMode = filterTransactions[y]._doc.data.method;
                  txnObj.transactionId = filterTransactions[y]._doc.paymentTransactionId;
                  txnObj.paymentStatus = filterTransactions[y]._doc.status;
                  if (txnObj.particulars.length != 0) {
                    let totalObj = {
                      // amount: filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-",
                      amount: installmentFilter.length != 0 ? installmentFilter[0]._doc.plannedAmount : "-",
                      paid: 0,
                      pending: 0,
                      title: "Total"
                    };
                    txnObj.particulars.map((data, z) => {
                      totalObj.paid = Number(data.paid) + Number(totalObj.paid);
                      totalObj.pending = Number(data.pending) + Number(totalObj.pending);
                    })
                    txnObj.particulars.push(totalObj);
                  }
                  dummyObj.statements.push(txnObj);
                }
              }
              dummyObj.registerId = studResp[i]._doc.regId;
              dummyObj.studentName = studResp[i]._doc.firstName + " " + studResp[i]._doc.lastName;
              // dummyObj.academicYear = filterProgramPlan !== undefined ? filterProgramPlan._doc.academicYear : "-";
              dummyObj.academicYear = installmentFilter.length !== 0 ? installmentFilter[0]._doc.academicYear : "-";
              dummyObj.classBatch = filterProgramPlan !== undefined ? filterProgramPlan._doc.title : "-";
              dummyObj.totalFees = installmentFilter.length !== 0 ? installmentFilter[0]._doc.plannedAmount : "-";
              dummyObj.paidAmnt = installmentFilter.length !== 0 ? installmentFilter[0]._doc.paidAmount : "-";
              dummyObj.pendAmnt = installmentFilter.length !== 0 ? installmentFilter[0]._doc.pendingAmount : "-";
              finalResult.push(dummyObj);
            }
          }
        }
        let getSearchedData = await findSearchData(finalResult, searchKey);
        // console.log('getSearchdata', getSearchedData)
        let convertToPaginateData = await dataPagination(getSearchedData, page, limit);
        let calcTotalpage = Math.ceil(Number(getSearchedData.length) / Number(limit));
        res.send({
          status: "success",
          totalRecords: getSearchedData.length,
          data: convertToPaginateData,
          totalPage: calcTotalpage,
          currentPage: Number(page),
          perPage: Number(limit),
          nextPage: Number(page) < calcTotalpage ? Number(page) + 1 : null,
          message: "Searched data"
        });
        centralDbConnection.close()
        dbConnection.close()
      }
      else {
        if (page == undefined || limit == undefined) {
          let finalResult = []
          if (academicYear == undefined || String(academicYear).toLowerCase() == 'all') { //Query not there
            console.log('no academic query if condition is working')
            // for (let i = 0; i < 25; i++) {
            for (let i = 0; i < studResp.length; i++) {
              // console.log(i + 1,)
              let filterProgramPlan = getProgramPlanData.find(o => String(o._doc._id) == String(studResp[i]._doc.programPlanId));
              let filterFeePlans = getFeePlanData.find(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId));

              if (filterFeePlans) { //filter the current feeplan students
                let dummyObj = {};
                dummyObj.statements = [];
                // gettransactionsData = await transactionModel.find({ transactionSubType: "feePayment", studentRegId: String(studResp[i]._doc.regId), academicYear: String(filterFeePlans._doc.academicYear) })
                let filterTransactions = gettransactionsData.filter(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId) && String(filterFeePlans._doc.academicYear) == String(o._doc.academicYear));
                if (filterTransactions.length != 0) {
                  for (let y = 0; y < filterTransactions.length; y++) {
                    let findFeeLedgerData = getFeeLedgerData.find(o => String(o._doc._id) == String(filterTransactions[y]._doc.feesLedgerIds[filterTransactions[y]._doc.feesLedgerIds.length - 1]));
                    let txnObj = {};
                    txnObj.particulars = [];
                    txnObj.displayName = filterTransactions[y]._doc.displayName;
                    txnObj.paymentDate = filterTransactions[y]._doc.transactionDate;
                    txnObj.particulars.push(...filterTransactions[y]._doc.data.feesBreakUp);
                    txnObj.dueAmount = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
                    txnObj.paidAmount = filterTransactions[y]._doc.amount;
                    txnObj.balance = findFeeLedgerData != undefined ? findFeeLedgerData._doc.pendingAmount : "-";
                    txnObj.paymentMode = filterTransactions[y]._doc.data.method;
                    txnObj.transactionId = filterTransactions[y]._doc.paymentTransactionId;
                    txnObj.paymentStatus = filterTransactions[y]._doc.status;
                    if (txnObj.particulars.length != 0) {
                      let totalObj = {
                        amount: filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-",
                        paid: 0,
                        pending: 0,
                        title: "Total"
                      };
                      txnObj.particulars.map((data, z) => {
                        totalObj.paid = Number(data.paid) + Number(totalObj.paid);
                        totalObj.pending = Number(data.pending) + Number(totalObj.pending);
                      })
                      txnObj.particulars.push(totalObj);
                    }
                    dummyObj.statements.push(txnObj);
                  }
                }
                dummyObj.registerId = studResp[i]._doc.regId;
                dummyObj.studentName = studResp[i]._doc.firstName + " " + studResp[i]._doc.lastName;
                // dummyObj.academicYear = filterProgramPlan !== undefined ? filterProgramPlan._doc.academicYear : "-";
                dummyObj.academicYear = filterFeePlans !== undefined ? filterFeePlans._doc.academicYear : "-";
                dummyObj.classBatch = filterProgramPlan !== undefined ? filterProgramPlan._doc.title : "-";
                dummyObj.totalFees = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
                dummyObj.paidAmnt = filterFeePlans != undefined ? filterFeePlans._doc.paidAmount : "-";
                dummyObj.pendAmnt = filterFeePlans != undefined ? filterFeePlans._doc.pendingAmount : "-";
                finalResult.push(dummyObj);
              }
            }
          }
          else {  //Query is there 
            console.log('query else condition is working')
            // for (let i = 0; i < 25; i++) {
            for (let i = 0; i < studResp.length; i++) {
              let filterProgramPlan = getProgramPlanData.find(o => String(o._doc._id) == String(studResp[i]._doc.programPlanId));
              let filterFeePlans = getFeePlanData.find(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId));
              // console.log(i + 1)

              if (filterFeePlans) { //filter the current feeplan students
                let dummyObj = {};
                dummyObj.statements = [];
                let installmentData = await studentFeeInstallmentModel.find({ feePlanId: filterFeePlans._doc._id, academicYear: academicYear })
                let installmentFilter = [...installmentData]
                // gettransactionsData = await transactionModel.find({ transactionSubType: "feePayment", studentRegId: String(studResp[i]._doc.regId), academicYear: String(academicYear) })
                let filterTransactions = gettransactionsData.filter(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId) && String(academicYear) == String(o._doc.academicYear));
                if (filterTransactions.length != 0) {
                  for (let y = 0; y < filterTransactions.length; y++) {
                    let findFeeLedgerData = getFeeLedgerData.find(o => String(o._doc._id) == String(filterTransactions[y]._doc.feesLedgerIds[filterTransactions[y]._doc.feesLedgerIds.length - 1]));
                    let txnObj = {};
                    txnObj.particulars = [];
                    txnObj.displayName = filterTransactions[y]._doc.displayName;
                    txnObj.paymentDate = filterTransactions[y]._doc.transactionDate;
                    txnObj.particulars.push(...filterTransactions[y]._doc.data.feesBreakUp);
                    // txnObj.dueAmount = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
                    txnObj.dueAmount = installmentFilter.length !== 0 ? installmentFilter[0]._doc.plannedAmount : "-";
                    txnObj.paidAmount = filterTransactions[y]._doc.amount;
                    txnObj.balance = findFeeLedgerData != undefined ? findFeeLedgerData._doc.pendingAmount : "-";
                    txnObj.paymentMode = filterTransactions[y]._doc.data.method;
                    txnObj.transactionId = filterTransactions[y]._doc.paymentTransactionId;
                    txnObj.paymentStatus = filterTransactions[y]._doc.status;
                    if (txnObj.particulars.length != 0) {
                      let totalObj = {
                        // amount: filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-",
                        amount: installmentFilter.length != 0 ? installmentFilter[0]._doc.plannedAmount : "-",
                        paid: 0,
                        pending: 0,
                        title: "Total"
                      };
                      txnObj.particulars.map((data, z) => {
                        totalObj.paid = Number(data.paid) + Number(totalObj.paid);
                        totalObj.pending = Number(data.pending) + Number(totalObj.pending);
                      })
                      txnObj.particulars.push(totalObj);
                    }
                    dummyObj.statements.push(txnObj);
                  }
                }
                dummyObj.registerId = studResp[i]._doc.regId;
                dummyObj.studentName = studResp[i]._doc.firstName + " " + studResp[i]._doc.lastName;
                // dummyObj.academicYear = filterProgramPlan !== undefined ? filterProgramPlan._doc.academicYear : "-";
                dummyObj.academicYear = installmentFilter.length !== 0 ? installmentFilter[0]._doc.academicYear : "-";
                dummyObj.classBatch = filterProgramPlan !== undefined ? filterProgramPlan._doc.title : "-";
                dummyObj.totalFees = installmentFilter.length !== 0 ? installmentFilter[0]._doc.plannedAmount : "-";
                dummyObj.paidAmnt = installmentFilter.length !== 0 ? installmentFilter[0]._doc.paidAmount : "-";
                dummyObj.pendAmnt = installmentFilter.length !== 0 ? installmentFilter[0]._doc.pendingAmount : "-";
                finalResult.push(dummyObj);
              }
            }
          }
          res.send({
            status: "success",
            totalRecords: finalResult.length,
            data: finalResult,
            totalPage: null,
            currentPage: Number(page),
            perPage: Number(limit),
            nextPage: null,
            message: "Total data"
          });
          centralDbConnection.close()
          dbConnection.close()
        }
        else {
          let finalResult = []
          if (academicYear == undefined || String(academicYear).toLowerCase() == 'all') { //Query not there
            console.log('no academic query if condition is working')
            // for (let i = 0; i < 25; i++) {
            for (let i = 0; i < studResp.length; i++) {
              // console.log(i + 1,)
              let filterProgramPlan = getProgramPlanData.find(o => String(o._doc._id) == String(studResp[i]._doc.programPlanId));
              let filterFeePlans = getFeePlanData.find(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId));

              if (filterFeePlans) { //filter the current feeplan students
                let dummyObj = {};
                dummyObj.statements = [];
                // gettransactionsData = await transactionModel.find({ transactionSubType: "feePayment", studentRegId: String(studResp[i]._doc.regId), academicYear: String(filterFeePlans._doc.academicYear) })
                let filterTransactions = gettransactionsData.filter(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId) && String(filterFeePlans._doc.academicYear) == String(o._doc.academicYear));
                if (filterTransactions.length != 0) {
                  for (let y = 0; y < filterTransactions.length; y++) {
                    let findFeeLedgerData = getFeeLedgerData.find(o => String(o._doc._id) == String(filterTransactions[y]._doc.feesLedgerIds[filterTransactions[y]._doc.feesLedgerIds.length - 1]));
                    let txnObj = {};
                    txnObj.particulars = [];
                    txnObj.displayName = filterTransactions[y]._doc.displayName;
                    txnObj.paymentDate = filterTransactions[y]._doc.transactionDate;
                    txnObj.particulars.push(...filterTransactions[y]._doc.data.feesBreakUp);
                    txnObj.dueAmount = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
                    txnObj.paidAmount = filterTransactions[y]._doc.amount;
                    txnObj.balance = findFeeLedgerData != undefined ? findFeeLedgerData._doc.pendingAmount : "-";
                    txnObj.paymentMode = filterTransactions[y]._doc.data.method;
                    txnObj.transactionId = filterTransactions[y]._doc.paymentTransactionId;
                    txnObj.paymentStatus = filterTransactions[y]._doc.status;
                    if (txnObj.particulars.length != 0) {
                      let totalObj = {
                        amount: filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-",
                        paid: 0,
                        pending: 0,
                        title: "Total"
                      };
                      txnObj.particulars.map((data, z) => {
                        totalObj.paid = Number(data.paid) + Number(totalObj.paid);
                        totalObj.pending = Number(data.pending) + Number(totalObj.pending);
                      })
                      txnObj.particulars.push(totalObj);
                    }
                    dummyObj.statements.push(txnObj);
                  }
                }
                dummyObj.registerId = studResp[i]._doc.regId;
                dummyObj.studentName = studResp[i]._doc.firstName + " " + studResp[i]._doc.lastName;
                // dummyObj.academicYear = filterProgramPlan !== undefined ? filterProgramPlan._doc.academicYear : "-";
                dummyObj.academicYear = filterFeePlans !== undefined ? filterFeePlans._doc.academicYear : "-";
                dummyObj.classBatch = filterProgramPlan !== undefined ? filterProgramPlan._doc.title : "-";
                dummyObj.totalFees = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
                dummyObj.paidAmnt = filterFeePlans != undefined ? filterFeePlans._doc.paidAmount : "-";
                dummyObj.pendAmnt = filterFeePlans != undefined ? filterFeePlans._doc.pendingAmount : "-";
                finalResult.push(dummyObj);
              }
            }
          }
          else {  //Query is there 
            console.log('query else condition is working')
            // for (let i = 0; i < 25; i++) {
            for (let i = 0; i < studResp.length; i++) {
              let filterProgramPlan = getProgramPlanData.find(o => String(o._doc._id) == String(studResp[i]._doc.programPlanId));
              let filterFeePlans = getFeePlanData.find(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId));
              // console.log(i + 1)

              if (filterFeePlans) { //filter the current feeplan students
                let dummyObj = {};
                dummyObj.statements = [];
                let installmentData = await studentFeeInstallmentModel.find({ feePlanId: filterFeePlans._doc._id, academicYear: academicYear })
                let installmentFilter = [...installmentData]
                // gettransactionsData = await transactionModel.find({ transactionSubType: "feePayment", studentRegId: String(studResp[i]._doc.regId), academicYear: String(academicYear) })
                let filterTransactions = gettransactionsData.filter(o => String(o._doc.studentRegId) == String(studResp[i]._doc.regId) && String(academicYear) == String(o._doc.academicYear));
                if (filterTransactions.length != 0) {
                  for (let y = 0; y < filterTransactions.length; y++) {
                    let findFeeLedgerData = getFeeLedgerData.find(o => String(o._doc._id) == String(filterTransactions[y]._doc.feesLedgerIds[filterTransactions[y]._doc.feesLedgerIds.length - 1]));
                    let txnObj = {};
                    txnObj.particulars = [];
                    txnObj.displayName = filterTransactions[y]._doc.displayName;
                    txnObj.paymentDate = filterTransactions[y]._doc.transactionDate;
                    txnObj.particulars.push(...filterTransactions[y]._doc.data.feesBreakUp);
                    // txnObj.dueAmount = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
                    txnObj.dueAmount = installmentFilter.length !== 0 ? installmentFilter[0]._doc.plannedAmount : "-";
                    txnObj.paidAmount = filterTransactions[y]._doc.amount;
                    txnObj.balance = findFeeLedgerData != undefined ? findFeeLedgerData._doc.pendingAmount : "-";
                    txnObj.paymentMode = filterTransactions[y]._doc.data.method;
                    txnObj.transactionId = filterTransactions[y]._doc.paymentTransactionId;
                    txnObj.paymentStatus = filterTransactions[y]._doc.status;
                    if (txnObj.particulars.length != 0) {
                      let totalObj = {
                        // amount: filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-",
                        amount: installmentFilter.length != 0 ? installmentFilter[0]._doc.plannedAmount : "-",
                        paid: 0,
                        pending: 0,
                        title: "Total"
                      };
                      txnObj.particulars.map((data, z) => {
                        totalObj.paid = Number(data.paid) + Number(totalObj.paid);
                        totalObj.pending = Number(data.pending) + Number(totalObj.pending);
                      })
                      txnObj.particulars.push(totalObj);
                    }
                    dummyObj.statements.push(txnObj);
                  }
                }
                dummyObj.registerId = studResp[i]._doc.regId;
                dummyObj.studentName = studResp[i]._doc.firstName + " " + studResp[i]._doc.lastName;
                // dummyObj.academicYear = filterProgramPlan !== undefined ? filterProgramPlan._doc.academicYear : "-";
                dummyObj.academicYear = installmentFilter.length !== 0 ? installmentFilter[0]._doc.academicYear : "-";
                dummyObj.classBatch = filterProgramPlan !== undefined ? filterProgramPlan._doc.title : "-";
                dummyObj.totalFees = installmentFilter.length !== 0 ? installmentFilter[0]._doc.plannedAmount : "-";
                dummyObj.paidAmnt = installmentFilter.length !== 0 ? installmentFilter[0]._doc.paidAmount : "-";
                dummyObj.pendAmnt = installmentFilter.length !== 0 ? installmentFilter[0]._doc.pendingAmount : "-";
                finalResult.push(dummyObj);
              }
            }
          }
          let convertToPaginate = await dataPagination(finalResult, page, limit);
          // for (let i = 0; i < convertToPaginate.length; i++) {
          //   let dummyObj = {};

          //   let filterProgramPlan = getProgramPlanData.find(o => String(o._doc._id) == String(convertToPaginate[i]._doc.programPlanId));
          //   let filterTransactions = gettransactionsData.filter(o => String(o._doc.studentRegId) == String(convertToPaginate[i]._doc.regId));
          //   let filterFeePlans = getFeePlanData.find(o => String(o._doc.studentRegId) == String(convertToPaginate[i]._doc.regId));
          //   dummyObj.statements = [];

          //   if (filterTransactions.length != 0) {
          //     for (let y = 0; y < filterTransactions.length; y++) {
          //       let findFeeLedgerData = getFeeLedgerData.find(o => String(o._doc._id) == String(filterTransactions[y]._doc.feesLedgerIds[filterTransactions[y]._doc.feesLedgerIds.length - 1]));
          //       let txnObj = {};
          //       txnObj.particulars = [];
          //       txnObj.displayName = filterTransactions[y]._doc.displayName;
          //       txnObj.paymentDate = filterTransactions[y]._doc.transactionDate;
          //       txnObj.particulars.push(...filterTransactions[y]._doc.data.feesBreakUp);
          //       txnObj.dueAmount = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
          //       txnObj.paidAmount = filterTransactions[y]._doc.amount;
          //       txnObj.balance = findFeeLedgerData != undefined ? findFeeLedgerData._doc.pendingAmount : "-";
          //       txnObj.paymentMode = filterTransactions[y]._doc.data.method;
          //       txnObj.transactionId = filterTransactions[y]._doc.paymentTransactionId;
          //       txnObj.paymentStatus = filterTransactions[y]._doc.status;
          //       if (txnObj.particulars.length != 0) {
          //         let totalObj = {
          //           amount: filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-",
          //           paid: 0,
          //           pending: 0,
          //           title: "Total"
          //         };
          //         txnObj.particulars.map((data, z) => {
          //           totalObj.paid = Number(data.paid) + Number(totalObj.paid);
          //           totalObj.pending = Number(data.pending) + Number(totalObj.pending);
          //         })
          //         txnObj.particulars.push(totalObj);
          //       }
          //       dummyObj.statements.push(txnObj);
          //     }
          //   }
          //   dummyObj.registerId = convertToPaginate[i]._doc.regId;
          //   dummyObj.studentName = convertToPaginate[i]._doc.firstName + " " + convertToPaginate[i]._doc.lastName;
          //   dummyObj.academicYear = filterProgramPlan !== undefined ? filterProgramPlan._doc.academicYear : "-";
          //   dummyObj.classBatch = filterProgramPlan !== undefined ? filterProgramPlan._doc.title : "-";
          //   dummyObj.totalFees = filterFeePlans != undefined ? filterFeePlans._doc.plannedAmount : "-";
          //   dummyObj.paidAmnt = filterFeePlans != undefined ? filterFeePlans._doc.paidAmount : "-";
          //   dummyObj.pendAmnt = filterFeePlans != undefined ? filterFeePlans._doc.pendingAmount : "-";
          //   getFinalResult.push(dummyObj);
          // }
          var calcTotpage = Math.ceil(Number(finalResult.length) / Number(limit));
          res.send({
            status: "success",
            totalRecords: finalResult.length,
            data: convertToPaginate,
            totalPage: calcTotpage,
            currentPage: Number(page),
            perPage: Number(limit),
            nextPage: Number(page) < calcTotpage ? Number(page) + 1 : null,
            message: "Paginated data"
          });
          centralDbConnection.close()
          dbConnection.close()
        }
      }
    })
    async function findSearchData(data, srchVal) {
      let searchedVal = [];
      if (data.length == 0) { }
      else {
        data.map((dataOne, i) => {
          if (String(dataOne.academicYear).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.classBatch).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.paidAmnt).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.pendAmnt).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.registerId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.studentName).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
            String(dataOne.totalFees).toLowerCase().includes(String(srchVal).toLowerCase()) == true
          ) {
            searchedVal.push(dataOne);
          }
          else { }
        });
        return searchedVal;
      }
    }
  }
  catch (err) {
    res.send({
      status: "failed",
      message: err,
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
// (2) STUDENT STATEMENT DOWNLOAD
module.exports.downloadStudentStatement = async (req, res) => {
  var dbUrl = req.headers.resource;
  const { orgId, campus, programPlan, academicYear } = req.query;
  var dbConnection = await createDatabase(orgId, dbUrl);
  var studentModel = dbConnection.model("students", allSchema);
  var studentFeeInstallmentModel = dbConnection.model("studentfeeinstallmentplans", allSchema);
  var studentAggr = {};
  try {
    // studentAggr.status = 1;
    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
      studentAggr.campusId = String(campus);
    }
    if (
      programPlan != undefined &&
      String(programPlan).toLocaleLowerCase() != "all"
    ) {
      studentAggr.programPlanId = mongoose.Types.ObjectId(programPlan);
    }
    let stdntAggr;
    if (academicYear == undefined || String(academicYear).toLowerCase() == 'all') {
      stdntAggr = [
        {
          $match: studentAggr,
        },
        {
          $lookup: {
            from: "studentfeeplans",
            localField: "regId",
            foreignField: "studentRegId",
            as: "feePlanData",
          },
        },
        {
          $lookup: {
            from: "programplans",
            localField: "programPlanId",
            foreignField: "_id",
            as: "programData",
          },
        },
        // {
        //     $lookup: {
        //         from: "transactions",
        //         localField: "regId",
        //         foreignField: "studentRegId",
        //         as: "transactionData"
        //     }
        // },
        // { "$unwind": "$feePlanData" },
        {
          $unwind: {
            path: "$feePlanData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$programData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "0",
            data: {
              $push: {
                registerId: "$regId",
                fName: "$firstName",
                lName: "$lastName",
                totalFees: "$feePlanData.plannedAmount",
                paidAmnt: "$feePlanData.paidAmount",
                pendAmnt: "$feePlanData.pendingAmount",
                academicYear: "$feePlanData.academicYear",
                classBatch: "$programData.title",
                // statements: {
                //     displayName: "$transactionData.displayName",
                //     paymentDate: "$transactionData.transactionDate",
                //     particulars: "$transactionData.data.feesBreakUp",
                //     dueAmount: "$feePlanData.plannedAmount",
                //     paidAmount: "$transactionData.amount",
                //     balance: "$feePlanData.pendingAmount",
                //     paymentMode: "$transactionData.data.method",
                //     transactionId:"$transactionData.paymentTransactionId",
                //     paymentStatus: "$transactionData.status"
                // }
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
      var getStudentData = await studentModel.aggregate(stdntAggr);
      res.send({
        status: "success",
        total: getStudentData[0].data.length,
        data: getStudentData[0].data,
      });
      centralDbConnection.close();
      dbConnection.close();
    }
    else { //academic year is there
      stdntAggr = [
        {
          $match: studentAggr,
        },
        {
          $lookup: {
            from: "studentfeeplans",
            localField: "regId",
            foreignField: "studentRegId",
            as: "feePlanData",
          },
        },
        {
          $lookup: {
            from: "programplans",
            localField: "programPlanId",
            foreignField: "_id",
            as: "programData",
          },
        },
        {
          $unwind: {
            path: "$feePlanData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$programData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "0",
            data: {
              $push: {
                registerId: "$regId",
                fName: "$firstName",
                lName: "$lastName",
                feePlanId: "$feePlanData._id",
                classBatch: "$programData.title",
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

      var getStudentData = await studentModel.aggregate(stdntAggr);
      var output = []
      for (let i = 0; i < getStudentData[0]['data'].length; i++) {
        const item = getStudentData[0]['data'][i];
        var obj = {}
        var installmentData = await studentFeeInstallmentModel.find({ feePlanId: item.feePlanId, academicYear: academicYear })
        obj['registerId'] = item['registerId']
        obj['fName'] = item['fName']
        obj['lName'] = item['lName']
        obj['classBatch'] = item['classBatch']
        // console.log(installmentData.length)
        obj['totalFees'] = installmentData.length !== 0 ? installmentData[0]._doc.plannedAmount : "-"
        obj['paidAmnt'] = installmentData.length !== 0 ? installmentData[0]._doc.paidAmount : "-"
        obj['pendAmnt'] = installmentData.length !== 0 ? installmentData[0]._doc.pendingAmount : "-"
        obj['academicYear'] = installmentData.length !== 0 ? installmentData[0]._doc.academicYear : "-"
        if (installmentData.length && installmentData[0]._doc.academicYear == academicYear) { output.push(obj) }
      }
      res.send({
        status: "success",
        total: output.length,
        data: output,
      });
      centralDbConnection.close();
      dbConnection.close();
    }
    // centralDbConnection.close()
    dbConnection.close()
  } catch (err) {
    res.send({
      status: "failed",
      total: 0,
      err: err,
      data: [],
    });
    centralDbConnection.close()
    dbConnection.close()
  } finally {
    // centralDbConnection.close()
    // dbConnection.close()
  }
};

// API DETAILS

// (1) STUDENT STATEMENT DATA
// URL: /edu/getStudentStatement?orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All&fromDate=2021-04-01&toDate=2021-05-28&page=1&limit=10&searchKey=5440
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

// (2) STUDENT STATEMENT DOWNLOAD
// URL: edu/downloadStatement?orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All
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
