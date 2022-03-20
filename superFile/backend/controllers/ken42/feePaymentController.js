const { createDatabase } = require("../../utils/db_creation");
const { decryption } = require("../cryptoController");
const studentSchema = require("../../models/studentModel");
const mongoose = require("mongoose");
const transactionSchema = require("../../models/transactionsModel");
const orgListSchema = require("../../models/orglists-schema");
const feesLedgerCollectionName = "feesledgers";
const feesLedgerSchema = require("../../models/feesLedgerModel");
const GuardianSchema = require("../../models/guardianModel");
const FeeStructureSchema = require("../../models/feeStructureModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const settingsSchema = require("../../models/settings/feesetting");
const programPlanSchema = require("../../models/programPlanModel");
const feeplanschema = require("../../models/feeplanModel");
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
var _ = require("lodash");
module.exports.getPaymentScheduleById = async (req, res) => {
  let rollNo = req.params.id;
  if (!rollNo || !req.query.orgId) {
    res.status(400).json({
      status: "failed",
      message: "Please provide all required parameters.",
      type: "error",
    });
  } else {
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
      _id: req.query.orgId,
    });

    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(500).send({
        status: "failure",
        message: "Organization not found",
      });
    } else {
      // var mongourl = await decryption(orgData.connUri);
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );

      let studentModel = dbConnection.model("students", studentSchema);
      let feeStructureModel = dbConnection.model(
        "feestructures",
        FeeStructureSchema
      );
      let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);
      let feeManagerModel = dbConnection.model("feemanagers", FeeManagerSchema);
      let transactionModel = dbConnection.model(
        "transactions",
        transactionSchema
      );
      let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);

      let installFeePlanModel = dbConnection.model(
        "studentfeeinstallmentplans",
        feeplanInstallmentschema
      );
      const feeMapModel = dbConnection.model(
        "studentfeesmaps",
        StudentFeeMapSchema
      );
      let programPlanModel = dbConnection.model(
        "programplans",
        programPlanSchema
      );

      const settingsModel = dbConnection.model("settings", settingsSchema);
      let studentDetails = await studentModel.findOne({
        rollNumber: rollNo
      });
      if (!studentDetails) {
       return  res.status(400).json({ success: false, message: "No Student Data" });
      }else{
        if(studentDetails.status==0){
          return res.status(400).json({ success: false, message: "In-Active Student" });
        }else{
        let id = studentDetails.regId;

        const settingData = await settingsModel.find({});
        feeMapModel
          .findOne({ studentId: studentDetails._id })
          .then(async function (data) {
            let feeStructureDetails = await feeStructureModel.findOne({
              _id: studentDetails.feeStructureId,
            });
            let programPlanDetails = await programPlanModel.findOne({
              _id: studentDetails.programPlanId,
            });
            let feePlanData = await feePlanModel.findOne({
              studentRegId: id,
            });
            let feePlanId = mongoose.Types.ObjectId(feePlanData._doc._id);
            let installmentPlanData = await installFeePlanModel.find({
              feePlanId: feePlanId,
            });
            if (installmentPlanData.length == 0) {
              res
                .status(400)
                .json({ success: false, message: "No Installment Plan" });
            } else {
              let feesBreakUp = [];
              for (oneInsta of installmentPlanData) {
                // let datNo = moment(oneInsta.dueDate).add(1, "days");
  
                let paidAmount = oneInsta.paidAmount;
                let pendingAmount = oneInsta.pendingAmount;
                let obj = {
                  amount: oneInsta.plannedAmount,
                  paid: paidAmount,
                  pending: pendingAmount,
                  feeTypeCode: oneInsta.plannedAmountBreakup[0].feeTypeCode,
                  title: oneInsta.plannedAmountBreakup[0].title,
                  installment: oneInsta.label,
                  dueDate: oneInsta.dueDate,
                  lateFees: oneInsta.lateFees,
                  concessionFees: oneInsta.concessionFees,
                  partial: settingData[0].receipts.partialAmount,
                };
                feesBreakUp.push(obj);
              }
  
              let totalAmount = _.sumBy(feesBreakUp, function (o) {
                return o.amount;
              });
              let finalArr = await _.remove(feesBreakUp, function (e) {
                return e.pending === 0;
              });
              let paisa = await CountDecimalDigits(data.amount);
              let resObj = {
                feesBreakUp: feesBreakUp,
                amount: totalAmount,
                currencyCode: studentDetails.currency,
                paisa: paisa,
                emailCommunicationRefIds: studentDetails.email,
                class: programPlanDetails.title,
                academicYear: programPlanDetails.academicYear,
                fineAmount: data.fine,
                studentFeeMapId: data.displayName,
                mobileNo: studentDetails.phoneNo,
                gateWay: settingData[0].paymentGateway.paymentGateway,
              };
              return res.status(200).json({ success: true, data: resObj });
            }
          })
          .catch((err) => {
            res.status(400).json({ success: false, Error: err });
          })
          .finally(() => {
            centralDbConnection.close();
            dbConnection.close();
          });

      }
    }
     
    }
  }
};
module.exports.getPaymentHistoryById = async (req, res) => {
  let rollNo = req.params.id;
  if (!rollNo || !req.query.orgId) {
    res.status(400).json({
      status: "failed",
      message: "Please provide all required parameters.",
      type: "error",
    });
  } else {
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
      _id: req.query.orgId,
    });
    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(500).send({
        status: "failure",
        message: "Organization not found",
      });
    } else {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
      let studentModel = dbConnection.model("students", studentSchema);
      let studentDetails = await studentModel.findOne({
        rollNumber: rollNo,
      });
      if (!studentDetails) {

        res.status(404).json({ success: false, Message: "Invalid Registration ID" });
        centralDbConnection.close();
        dbConnection.close();
      }
      let id = studentDetails.regId;

      let transactionModel = dbConnection.model(
        "transactions",
        transactionSchema
      );
      let ledgersModel = dbConnection.model("feesledgers", feesLedgerSchema);

      transactionModel.find(
        {
          $or: [{ status: "Paid" }, { status: "Partial" }],
          studentRegId: id,
          transactionSubType: "feePayment",
        },
        function (err, docs) {
          if (err) {
            res.status(400).json({ success: false, Error: err });
          } else {
            let paymentHistory = [];
            for (transactionDetails of docs) {
              let feesBreak = [];
              for (oneFee of transactionDetails.data.feesBreakUp) {
                if (!Number(oneFee.amount) == 0) {
                  feesBreak.push(oneFee);
                }
              }
              let obj = {
                feeType: feesBreak,
                class: transactionDetails.class,
                academicYear: transactionDetails.academicYear,
                paymentDate: transactionDetails.createdAt,
                amount: transactionDetails.amount,
                receiptUrl: transactionDetails.receiptWithQr,
              };
              paymentHistory.push(obj);
            }
            res.status(200).json({ data: paymentHistory });
            centralDbConnection.close();
            dbConnection.close();
          }
        }
      );
    }
  }
};

async function CountDecimalDigits(number) {
  var char_array = number.toString().split(""); // split every single char
  var not_decimal = char_array.lastIndexOf(".");
  return not_decimal < 0 ? 0 : char_array.length - not_decimal;
}
