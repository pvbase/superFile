const rq = require("request-promise");
const axios = require("axios");
var _ = require("lodash");
const {
  receiptTemplate,
  receiptPdf,
} = require("../../utils/helper_functions/templates/receipt-email-template");

const {
  receiptVkgiPdf,
  receiptVkgiTemplate,
} = require("../../utils/helper_functions/templates/vkgiReceiptTemplate");
const { generateQrCode } = require("../qrCodeController");
const { sendEmail } = require("../emailController");
const moment = require("moment");
const mongoose = require("mongoose");
const PaytmChecksum = require("../PaytmChecksum");
const { BlobServiceClient } = require("@azure/storage-blob");
var storage = require("@azure/storage-blob");
var uuid = require("uuid");
const reconciliationTransactionsSchema = require("../../models/reconciliationTransactionsModel");
const RazorpaySchema = require("../../models/ken42/paymentModel");
const ApplicationSchema = require("../../models/ken42/applicationModel");
const orgListSchema = require("../../models/orglists-schema");
const { createDatabase } = require("../../utils/db_creation");
const settingsSchema = require("../../models/settings/feesetting");
const feesLedgerSchema = require("../../models/feesLedgerModel");
const StudentSchema = require("../../models/studentModel");
const GuardianSchema = require("../../models/guardianModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const programPlanSchema = require("../../models/programPlanModel");
const campusSchema = require("../../models/campusModel");
const FeeStructureSchema = require("../../models/feeStructureModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const transactionsSchema = require("../../models/transactionsModel");
const journeysSchema = require("../../models/journeyModel");
const feeplanschema = require("../../models/feeplanModel");
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
const { decryption } = require("../cryptoController");
const { updateReportCollection } = require("../flatten-reports/report-update");
exports.createPaymentKen = async function (req, res) {
  let inputData = req.body;
  if (
    !inputData.name ||
    !inputData.email ||
    !inputData.mobile ||
    !inputData.amount ||
    !inputData.paisa ||
    !inputData.callBackUrl ||
    !inputData.currencyCode
  ) {
    res.status(422).json({
      status: "failed",
      message: "Please provide all required parameters.",
      type: "error",
    });
  } else if (!validEmail(inputData.email)) {
    res.json({ message: "Invalid Info", type: "error" });
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
      const settingsModel = dbConnection.model(
        "settings",
        settingsSchema,
        "settings"
      );

      const paymentModel = dbConnection.model("razorpay", RazorpaySchema);
      const settings = await settingsModel.find({});
      let paymentGateway = settings[0].paymentGateway.paymentGateway;

      if (paymentGateway == "paytm") {
        //paytm intergretion
        const { amount, email, mobile } = inputData;
        /* import checksum generation utility */
        const totalAmount = JSON.stringify(amount);
        var params = {
          MID: process.env.PAYTM_MID,
          WEBSITE: process.env.PAYTM_WEBSITE,
          CHANNEL_ID: process.env.PAYTM_CHANNEL_ID,
          INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE_ID,
          ORDER_ID: inputData.studentId,
          CUST_ID: "CUST_" + new Date().getTime(),
          TXN_AMOUNT: totalAmount,
          CALLBACK_URL: inputData.callBackUrl,
          EMAIL: email,
          MOBILE_NO: mobile,
        };

        var paytmChecksum = PaytmChecksum.generateSignature(
          params,
          process.env.PAYTM_MERCHANT_KEY
        );
        paytmChecksum
          .then(function (checksum) {
            let paytmParams = {
              ...params,
              CHECKSUMHASH: checksum,
            };

            var applicationModel = dbConnection.model(
              "applications",
              ApplicationSchema
            );
            var appDetails = new applicationModel({
              name: inputData.name,
              email: inputData.email,
              mobile: inputData.mobile,
              studentId: inputData.studentId,
              amount: Number(inputData.amount),
              paisa: Number(inputData.paisa),
              partial: inputData.accept_partial,
              programPlan: inputData.programPlan,
              callBackUrl: inputData.callBackUrl,
              currencyCode: inputData.currencyCode,
              paymentId: "",
              gatewayType: "paytm",
              razorpay: paytmParams,
            });
            appDetails.save(function (err, applicationDetails) {
              if (err) {
                dbConnection.close();
                if (err.code == 11000) {
                  centralDbConnection.close();
                  dbConnection.close();
                  return res.status(400).json({
                    message: "Already applied for this Application",
                    type: "error",
                    data: err,
                  });
                } else {
                  centralDbConnection.close();
                  dbConnection.close();
                  return res.status(400).json({
                    message: "failed to store application",
                    type: "error",
                    data: err,
                  });
                }
              } else {
                dbConnection.close();
                res.status(200).json({
                  success: true,
                  Data: paytmParams,
                  studentId: inputData.studentId,
                  applicationDetails,
                  paymentGatewayType: paymentGateway,
                });
              }
            });

            // res.status(200).json({ success: true, data: paytmParams });
          })
          .catch(function (error) {
            centralDbConnection.close();
            dbConnection.close();
            res.status(400).json({ success: false, Error: error });
          });
      } else {
        const credentials = mongoose.Schema({}, { strict: false });
        // const msettingModel = dbConnectionp.model("settings", credentials, "settings")
        const credentialsModel = dbConnection.model(
          "credentials",
          credentials,
          "credentials"
        );
        let studentModel = dbConnection.model("students", StudentSchema);
        let campusModel = dbConnection.model(
          "campuses",
          campusSchema
        );
        let studentDetails = await studentModel.findOne({
          rollNumber: inputData.studentId,
        });
        let campusData = await campusModel.findOne({
          _id: studentDetails.campusId,
        });
        var username = campusData.credentials.username;
        var password = campusData.credentials.password;
        var auth =
          "Basic " + Buffer.from(username + ":" + password).toString("base64");
        let amount =
          inputData.amount +
          inputData.paisa +
          (inputData.paisa.length == 1 ? "0" : "");
        // let amount = inputData.amount + inputData.paisa;
        let today = Date.now();
        var obj;
        let uniqueId = uuid.v1();
        if (inputData.accept_partial == true) {
          obj = {
            amount: parseInt(amount),
            currency: inputData.currencyCode,
            accept_partial: true,
            first_min_partial_amount: inputData.min_partial_amount,
            expire_by: today,
            reference_id: uniqueId,
            description: "Payment for " + inputData.studentId,
            customer: {
              name: inputData.name,
              contact: inputData.mobile,
              email: inputData.email,
            },
            notify: {
              sms: false,
              email: false,
            },
            reminder_enable: false,
            notes: {
              policy_name: inputData.name,
            },
            callback_url: inputData.callBackUrl,
            callback_method: "get",
          };
        } else {
          obj = {
            amount: parseInt(amount),
            currency: inputData.currencyCode,
            accept_partial: inputData.accept_partial,
            expire_by: today,
            reference_id: uniqueId,
            description: "Payment for " + inputData.studentId,
            customer: {
              name: inputData.name,
              contact: inputData.mobile,
              email: inputData.email,
            },
            notify: {
              sms: false,
              email: false,
            },
            reminder_enable: false,
            notes: {
              policy_name: inputData.name,
            },
            callback_url: inputData.callBackUrl,
            callback_method: "get",
          };
        }
        var options = {
          method: "POST",
          uri: "https://api.razorpay.com/v1/payment_links",
          body: obj,
          json: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: auth,
          },
        };
        rq(options)
          .then(async (success) => {
            console.log("sucess");
            var newData = new paymentModel({
              name: inputData.name,
              email: inputData.email,
              mobile: inputData.mobile,
              studentId: inputData.studentId,
              amount: inputData.amount,
              paisa: inputData.paisa,
              paymentId: success.id,
              callBackUrl: inputData.callBackUrl,
              currencyCode: inputData.currencyCode,
              razorpay: success,
              feesBreakUp: inputData.feesBreakUp,
              webhookStatus: success.status,
              referenceId: uniqueId,
            });
            newData.save(function (err, data) {
              if (err) {
                centralDbConnection.close();
                dbConnection.close();
                return res.status(500).json({
                  message: "Database error",
                  success: false,
                  Error: err,
                });
              }
              else {
                centralDbConnection.close();
                dbConnection.close();
                return res.status(200).json({
                  message: "Paymentlink Created",
                  success: true,
                  data: success,
                });
              }
            });
          })
          .catch((err) => {
            centralDbConnection.close();
            dbConnection.close();
            res.status(400).json({ Message: "Failed", Error: err });
            return;
          })
          .finally(() => {
            centralDbConnection.close();
          });
      }
    }
  }
};

exports.getStudentFee = async function (req, res) {
  let id = req.params.id;
  if (!id || !req.query.orgId) {
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
      let transactionModel = dbConnection.model(
        "transactions",
        transactionsSchema
      );
      let studentModel = dbConnection.model("students", StudentSchema);
      let feeStructureModel = dbConnection.model(
        "feestructures",
        FeeStructureSchema
      );
      let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);
      let feeManagerModel = dbConnection.model("feemanagers", FeeManagerSchema);
      let guardianModel = dbConnection.model("guardians", GuardianSchema);
      let feeMapModel = dbConnection.model(
        "studentfeesmaps",
        StudentFeeMapSchema
      );
      let programPlanModel = dbConnection.model(
        "programplans",
        programPlanSchema
      );

      let settingsModel = dbConnection.model("settings", settingsSchema);

      let studentDetails = await studentModel.findOne({
        regId: id,
      });

      var transactionDetails = await transactionModel.find({
        $or: [{ status: "Pending" }, { status: "Partial" }],
        studentRegId: id,
        transactionSubType: "demandNote",
      });
      let demandNoteId;
      if (transactionDetails.length == 0) {
        demandNoteId = [];
      } else {
        demandNoteId = transactionDetails;
      }
      if (studentDetails == null) {
        return res
          .status(404)
          .json({ status: "failed", message: "Invalid Student ID" });
      } else {
        let studentFeeMapDetails = await feeMapModel.findOne({
          studentId: studentDetails._id,
        });
        let feeStructureDetails = await feeStructureModel.findOne({
          _id: studentFeeMapDetails.feeStructureId,
        });
        let guardianDetails = await guardianModel.findOne({
          _id: studentDetails.guardianDetails[0],
        });
        let programPlanDetails = await programPlanModel.findOne({
          _id: studentFeeMapDetails.programPlanId,
        });
        let settingsDetails = await settingsModel.find({});
        let feesBreakUp = [];
        for (feeTypesI of feeStructureDetails.feeTypeIds) {
          let feeTypesDetails = await feeTypeModel.findOne({
            _id: feeTypesI,
          });
          let feeManagerDetails = await feeManagerModel.findOne({
            feeTypeId: feeTypesI,
          });
          let fees;
          if (feeManagerDetails !== null) {
            fees = feeManagerDetails.feeDetails.totalAmount;
          } else {
            fees = 0;
          }
          let obj = {
            feeTypeId: feeTypesDetails._id,
            feeType: feeTypesDetails.title,
            amount: fees,
            feeTypeCode: feeTypesDetails.displayName,
          };
          feesBreakUp.push(obj);
        }
        console.log("settings", settingsDetails);
        let obj = {
          studentDetails: studentDetails,
          guardianDetails: guardianDetails,
          totalAmount: studentFeeMapDetails.amount,
          paid: studentFeeMapDetails.paid,
          pending: studentFeeMapDetails.pending,
          dueDate: studentFeeMapDetails.dueDate,
          feesBreakUp: feesBreakUp,
          studentFeeMapId: studentFeeMapDetails.displayName,
          receiptStatus: settingsDetails[0].receipts["send"],
          demandNoteDetails: demandNoteId,
          programPlanDetails: programPlanDetails,
          partial: settingsDetails[0].receipts.partialAmount,
        };
        res.status(200).json(obj);
        centralDbConnection.close();
        dbConnection.close();
      }
    }
  }
};

exports.addPaymentNew = async function (req, res) {
  let inputData = req.body;
  if (!inputData.orgId || !inputData.studentId || !inputData.razorpayId) {
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
      _id: inputData.orgId,
    });

    if (!orgData || orgData == null) {
      centralDbConnection.close();
      res.status(500).send({
        status: "failure",
        message: "Organization not found",
      });
    } else {
      if (orgData.nameSpace == "vkgi") {
        let dbConnection = await createDatabase(
          String(orgData._id),
          orgData.connUri
        );
        let transactionModel = dbConnection.model(
          "transactions",
          transactionsSchema
        );
        let studentModel = dbConnection.model("students", StudentSchema);
        let feeStructureModel = dbConnection.model(
          "feestructures",
          FeeStructureSchema
        );
        let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);
        let feeManagerModel = dbConnection.model(
          "feemanagers",
          FeeManagerSchema
        );
        let guardianModel = dbConnection.model("guardians", GuardianSchema);
        let feeMapModel = dbConnection.model(
          "studentfeesmaps",
          StudentFeeMapSchema
        );
        let programPlanModel = dbConnection.model(
          "programplans",
          programPlanSchema
        );
        const paymentModel = dbConnection.model("razorpay", RazorpaySchema);
        let settingsModel = dbConnection.model("settings", settingsSchema);

        let studentDetails = await studentModel.findOne({
          rollNumber: inputData.studentId,
        });
        if (studentDetails == null) {
          centralDbConnection.close();
          dbConnection.close();
          return res
            .status(404)
            .json({ status: "failed", message: "Invalid Student ID" });
        } else {
          let feePlanModel = dbConnection.model(
            "studentfeeplan",
            feeplanschema
          );
          let feePlanData = await feePlanModel.findOne({
            studentRegId: studentDetails.regId,
          });
          if (
            Number(feePlanData.pendingAmount) == 0 ||
            Number(feePlanData.pendingAmount) < 0
          ) {
            centralDbConnection.close();
            dbConnection.close();
            return res
              .status(400)
              .json({ success: false, message: "Already Paid Full Payment" });
          }
          var transactionDetails = await transactionModel.find({
            $or: [{ status: "Pending" }, { status: "Partial" }],
            studentRegId: studentDetails.regId,
            transactionSubType: "demandNote",
          });
          let demandNoteId;
          if (transactionDetails.length == 0) {
            demandNoteId = [];
          } else {
            demandNoteId = transactionDetails;
          }
          let studentFeeMapDetails = await feeMapModel.findOne({
            studentId: studentDetails._id,
          });

          let feeStructureDetails = await feeStructureModel.findOne({
            _id: studentFeeMapDetails.feeStructureId,
          });
          let guardianDetails = await guardianModel.findOne({
            _id: studentDetails.guardianDetails[0],
          });
          let programPlanDetails = await programPlanModel.findOne({
            _id: studentFeeMapDetails.programPlanId,
          });
          let settingsDetails = await settingsModel.find({});
          let paymentDetails = await paymentModel.findOne({
            paymentId: inputData.paymentLinkId,
          });

          let feesBreakUp = [];
          for (oneData of paymentDetails.feesBreakUp) {
            let TtoalPend;
            let pending = Number(oneData.amount) - Number(oneData.paid);
            if (Number(pending) == 0 || Number(pending) < 0) {
              TtoalPend = 0;
            } else {
              TtoalPend = pending;
            }
            let obj = {
              amount: oneData.amount,
              paid: oneData.paid,
              pending: TtoalPend,
              feeTypeCode: oneData.feeTypeCode,
              title: oneData.title,
              installment: oneData.installment,
              dueDate: oneData.dueDate,
              partial: oneData.partial,
            };
            feesBreakUp.push(obj);
          }

          const credentials = mongoose.Schema({}, { strict: false });
          // const msettingModel = dbConnectionp.model("settings", credentials, "settings")
          const credentialsModel = dbConnection.model(
            "credentials",
            credentials,
            "credentials"
          );
          const credentialData = await credentialsModel.findOne({
            type: "payment",
          });

          var username = credentialData._doc.userName;
          var password = credentialData._doc.password;
          var auth =
            "Basic " +
            Buffer.from(username + ":" + password).toString("base64");

          var options = {
            method: "GET",
            uri: "https://api.razorpay.com/v1/payments/" + inputData.razorpayId,
            headers: {
              "Content-Type": "application/json",
              Authorization: auth,
            },
          };
          rq(options)
            .then(async (success) => {
              let rs = JSON.parse(success);
              var rcptId = await getDisplayId(dbConnection);
              let transId;
              if (rs.acquirer_data.bank_transaction_id) {
                transId = rs.acquirer_data.bank_transaction_id;
              } else if (rs.acquirer_data.auth_code) {
                transId = rs.acquirer_data.auth_code;
              } else if (rs.acquirer_data.upi_transaction_id) {
                transId = rs.acquirer_data.upi_transaction_id;
              } else if (rs.acquirer_data.rrn) {
                transId = rs.acquirer_data.rrn;
              } else {
                transId = rcptId;
              }
              let receiptType;
              if (settingsDetails[0].receipts.send == "immediately") {
                receiptType = "receipt";
              } else {
                receiptType = "afterReconciliation";
              }
              let paidAmounr = String(rs.amount);
              let editedText = paidAmounr.slice(0, -2);

              let feePlanModel = dbConnection.model(
                "studentfeeplan",
                feeplanschema
              );
              let feePlanData = await feePlanModel.findOne({
                studentRegId: studentDetails.regId,
              });
              let totalAmount = feePlanData.plannedAmount;
              let previousPaid =
                Number(feePlanData.paidAmount) + Number(editedText);
              if (Number(totalAmount) < Number(previousPaid)) {
                centralDbConnection.close();
                dbConnection.close();
                return res.status(400).json({
                  success: false,
                  message: "Already Paid Full Payment",
                });
              }
              var d = new Date();
              let comEmail;
              if (paymentDetails.email) {
                comEmail = paymentDetails.email;
              } else if (studentDetails.parentEmail) {
                comEmail = studentDetails.parentEmail;
              } else {
                comEmail = studentDetails.email;
              }
              let pedingAMount =
                Number(feePlanData.pendingAmount) - Number(editedText);
              let PendingAmount;
              if (Number(pedingAMount) == 0 || Number(pedingAMount) < 0) {
                PendingAmount = 0;
              } else {
                PendingAmount = pedingAMount;
              }
              let payloadOtc = {
                transactionDate: d,
                relatedTransactions: demandNoteId,
                studentId: studentDetails._id,
                emailCommunicationRefIds: comEmail,
                transactionType: "eduFees",
                transactionSubType: "feePayment",
                studentFeeMap: studentFeeMapDetails.displayName,
                amount: editedText,
                status: "initiated",
                data: {
                  feesBreakUp: feesBreakUp,
                  orgId: inputData.orgId,
                  transactionType: "eduFees",
                  transactionSubType: "feePayment",
                  mode: "razorpay",
                  method: rs.method,
                  modeDetails: {
                    netBankingType: null,
                    walletType: rs.wallet,
                    instrumentNo: null,
                    cardType: null,
                    nameOnCard: null,
                    cardNumber: rs.card_id,
                    instrumentDate: d,
                    bankName: rs.bank,
                    branchName: null,
                    transactionId: null,
                    remarks: null,
                  },
                },
                paymentTransactionId: transId,
                createdBy: "all",
                academicYear: programPlanDetails.academicYear,
                class: programPlanDetails.title,
                studentName:
                  studentDetails.firstName + " " + studentDetails.lastName,
                studentRegId: studentDetails.regId,
                programPlanId: programPlanDetails._id,
                type: receiptType,
                currency: rs.currency,
                currencyAmount: editedText,
                exchangeRate: rs.base_amount,
                campusId: studentDetails._doc.campusId,
                previousPaid: feePlanData.paidAmount,
                pendingAmount: PendingAmount,
              };

              //create OTC
              var receiptN = ("" + Math.random()).substring(2, 7);
              var year2 = moment().year();

              var transID = `TXN/${year2}/${receiptN + 1}`;
              let imode = payloadOtc.data.mode;
              let mode = imode.toLowerCase();

              let transactionId;
              if (mode == "cash") {
                transactionId = transID;
              } else {
                transactionId = payloadOtc.paymentTransactionId;
              }
              let passData = {
                displayName: rcptId,
                transactionDate: payloadOtc.transactionDate,
                relatedTransactions: payloadOtc.relatedTransactions,
                transactionType: "eduFees",
                transactionSubType: "feePayment",
                studentId: payloadOtc.studentId,
                emailCommunicationRefIds: payloadOtc.emailCommunicationRefIds,
                studentName: payloadOtc.studentName,
                class: payloadOtc.class,
                academicYear: payloadOtc.academicYear,
                amount: payloadOtc.amount,
                studentRegId: payloadOtc.studentRegId,
                receiptNo: rcptId,
                programPlan: payloadOtc.programPlanId,
                data: {
                  orgId: payloadOtc.data.orgId,
                  displayName: rcptId,
                  transactionType: "eduFees",
                  transactionSubType: "feePayment",
                  mode: mode,
                  method: payloadOtc.data.method,
                  modeDetails: {
                    netBankingType: payloadOtc.data.modeDetails.netBankingType,
                    walletType: payloadOtc.data.modeDetails.walletType,
                    instrumentNo: payloadOtc.data.modeDetails.instrumentNo,
                    instrumentDate: payloadOtc.data.modeDetails.instrumentDate,
                    bankName: payloadOtc.data.modeDetails.bankName,
                    cardDetails: {
                      cardType: payloadOtc.data.modeDetails.cardType,
                      nameOnCard: payloadOtc.data.modeDetails.nameOnCard,
                      cardNumber: payloadOtc.data.modeDetails.cardNumber,
                    },
                    branchName: payloadOtc.data.modeDetails.branch,
                    transactionId: transactionId,
                    remarks: payloadOtc.data.modeDetails.remarks,
                  },
                  feesBreakUp: payloadOtc.data.feesBreakUp,
                },
                paymentTransactionId: transactionId,
                receiptStatus: payloadOtc.receiptStatus,
                currency: payloadOtc.currency,
                currencyAmount: payloadOtc.currencyAmount,
                exchangeRate: payloadOtc.exchangeRate,
                userName: payloadOtc.userName,
                createdBy: payloadOtc.userId,
                updatedBy: payloadOtc.userId,
                campusId: payloadOtc.campusId,
              };

              ledgerEntry({ body: passData }, dbConnection)
                .then(async (paymentData) => {
                  if (paymentData.status == "failure") {
                    centralDbConnection.close();
                    dbConnection.close();
                    res.status(400).json(paymentData);
                  } else {
                    let dbConnection1 = await createDatabase(
                      String(orgData._id),
                      orgData.connUri
                    );
                    const settingsSchema = mongoose.Schema(
                      {},
                      { strict: false }
                    );
                    const settingsModel = dbConnection1.model(
                      "settings",
                      settingsSchema,
                      "settings"
                    );
                    const orgSettings = await settingsModel.find({});
                    let orgDetails = orgSettings[0]._doc;
                    let feeMapModel = dbConnection1.model(
                      "studentfeesmaps",
                      StudentFeeMapSchema
                    );
                    let feeStructureModel = dbConnection1.model(
                      "feestructures",
                      FeeStructureSchema
                    );
                    let feeManagerModel = dbConnection1.model(
                      "feemanagers",
                      FeeManagerSchema
                    );
                    let feeTypeModel = dbConnection1.model(
                      "feetypes",
                      FeeTypeSchema
                    );
                    let TxnModel = dbConnection1.model(
                      "transactions",
                      transactionsSchema
                    );

                    let feMapDe = await feeMapModel.findOne({
                      displayName: payloadOtc.studentFeeMap,
                    });
                    let feeStructureDetails = await feeStructureModel.findOne({
                      _id: feMapDe.feeStructureId,
                    });
                    let feeBre = [];
                    if (feMapDe.transactionPlan.feesBreakUp.length !== 0) {
                      for (singleData of feMapDe.transactionPlan.feesBreakUp) {
                        console.log("singleData", singleData);
                        let fees = singleData.amount;
                        for (oneFee of payloadOtc.data.feesBreakUp) {
                          if (
                            String(singleData.feeTypeCode) ==
                            String(oneFee.feeTypeCode)
                          ) {
                            let fullPaid =
                              Number(singleData.paid) + Number(oneFee.amount);
                            let fullPending = Number(fees) - Number(fullPaid);
                            let obje;
                            if (Number(fullPending) < 0) {
                              obje = {
                                amount: fees,
                                paid: fullPaid,
                                pending: 0,
                                feeTypeCode: oneFee.feeTypeCode,
                                title: oneFee.title,
                              };
                            } else {
                              obje = {
                                amount: fees,
                                paid: fullPaid,
                                pending: fullPending,
                                feeTypeCode: oneFee.feeTypeCode,
                                title: oneFee.title,
                              };
                            }
                            feeBre.push(obje);
                          }
                        }
                      }
                    } else {
                      let fees = singleData.amount;
                      for (oneFee of payloadOtc.data.feesBreakUp) {
                        if (
                          String(singleData.feeTypeCode) ==
                          String(oneFee.feeTypeCode)
                        ) {
                          let fullPaid = Number(oneFee.amount);
                          let fullPending = Number(fees) - Number(fullPaid);
                          let obje;
                          if (Number(fullPending) < 0) {
                            obje = {
                              amount: fees,
                              paid: fullPaid,
                              pending: 0,
                              feeTypeCode: oneFee.feeTypeCode,
                              title: oneFee.title,
                            };
                          } else {
                            obje = {
                              amount: fees,
                              paid: fullPaid,
                              pending: fullPending,
                              feeTypeCode: oneFee.feeTypeCode,
                              title: oneFee.title,
                            };
                          }
                          feeBre.push(obje);
                        }
                      }
                    }
                    var tota = 0;
                    var pai = 0;
                    var pend = 0;
                    for (oneFees of feeBre) {
                      tota += oneFees.amount;
                      pai += oneFees.paid;
                      pend += oneFees.pending;
                    }
                    let feeTypesPaid = {
                      feesBreakUp: feeBre,
                      totalAmount: tota,
                      totalPaid: pai,
                      totalPending: pend,
                    };
                    let paidA =
                      Number(feMapDe.paid) + Number(payloadOtc.amount);

                    let pendingAmountTotal =
                      Number(feMapDe.amount) - Number(paidA);
                    feeMapModel.updateOne(
                      { displayName: payloadOtc.studentFeeMap },
                      {
                        $set: {
                          paid: paidA,
                          pending: pendingAmountTotal,
                          transactionPlan: feeTypesPaid,
                        },
                      },
                      async function (err, feeMapD) {
                        if (feeMapD.nModified) {
                          let feeTableHeader = [
                            {
                              name: "Particulars",
                              value: "feeTypeName",
                              type: "string",
                            },
                            {
                              name: "Paid Amount",
                              value: "paidAmount",
                              type: "amount",
                            },
                          ];
                          let statementTableHeader = [
                            {
                              name: "TERM",
                              value: "term",
                              type: "string",
                            },
                            {
                              name: "DUE DATE",
                              value: "dueDate",
                              type: "string",
                            },
                            {
                              name: "PAID DATE",
                              value: "paidDate",
                              type: "string",
                            },
                            {
                              name: "AMOUNT",
                              value: "paidTotal",
                              type: "amount",
                            },
                            {
                              name: "STATUS",
                              value: "status",
                              type: "string",
                            },
                          ];
                          let TxnModel = dbConnection1.model(
                            "transactions",
                            transactionsSchema
                          );
                          let feeTypeModel = dbConnection1.model(
                            "feetypes",
                            FeeTypeSchema
                          );

                          let feePlanModel = dbConnection1.model(
                            "studentfeeplan",
                            feeplanschema
                          );

                          let installFeePlanModel = dbConnection1.model(
                            "studentfeeinstallmentplans",
                            feeplanInstallmentschema
                          );
                          let FeesLedgerModel = dbConnection1.model(
                            "feesledgers",
                            feesLedgerSchema
                          );
                          let reconciliationTransactionsModel =
                            dbConnection1.model(
                              "reconciliationTransactions",
                              reconciliationTransactionsSchema
                            );
                          let campusModel = dbConnection1.model(
                            "campuses",
                            campusSchema
                          );
                          let campusStatus;
                          console.log("campusid", payloadOtc.campusId);
                          if (
                            payloadOtc.campusId.toLowerCase() == "all" ||
                            payloadOtc.campusId.toLowerCase() == "undefined" ||
                            payloadOtc.campusId.toLowerCase() == "null" ||
                            payloadOtc.campusId == undefined ||
                            payloadOtc.campusId == null
                          ) {
                            campusStatus = false;
                          } else {
                            campusStatus = true;
                          }
                          let allCampus;
                          if (campusStatus == true) {
                            let allC = await campusModel.findOne({
                              _id: payloadOtc.campusId,
                            });
                            allCampus = {
                              logo: allC.logo,
                              name: allC.legalName,
                              address1: allC.legalAddress.address1,
                              address2: allC.legalAddress.address2,
                              address3: allC.legalAddress.address3,
                              city: allC.legalAddress.city,
                              state: allC.legalAddress.state,
                              pincode: allC.legalAddress.pincode,
                              contact: allC.instituteContact[0].mobileNumber,
                            };
                          } else {
                            allCampus = {
                              logo: orgDetails.logo.logo,
                              name: orgDetails.instituteDetails.instituteName,
                              address1: orgDetails.instituteDetails.address1,
                              address2: orgDetails.instituteDetails.address2,
                              address3: orgDetails.instituteDetails.address3,
                              city: orgDetails.instituteDetails.cityTown,
                              state: orgDetails.instituteDetails.stateName,
                              pincode: orgDetails.instituteDetails.pinCode,
                              contact: orgDetails.instituteDetails.phoneNumber1,
                            };
                          }

                          let feePlanData = await feePlanModel.findOne({
                            studentRegId: payloadOtc.studentRegId,
                          });
                          console.log("feePlan data", feePlanData);

                          let feePlanId = mongoose.Types.ObjectId(
                            feePlanData._doc._id
                          );
                          console.log("feePlanId", feePlanId);
                          let installmentPlanData =
                            await installFeePlanModel.find({
                              feePlanId: feePlanId,
                            });

                          let ledgerData = await FeesLedgerModel.findOne({
                            transactionDisplayName: rcptId,
                          });
                          let demandNoteData = await TxnModel.findOne({
                            displayName: rcptId,
                          });
                          // let demandNoteData = await TxnModel.findOne({
                          //   displayName: payloadOtc.relatedTransactions[0],
                          // });
                          var feesAll = [];
                          for (singleFee of payloadOtc.data.feesBreakUp) {
                            var obj;
                            if (Number(singleFee.amount) !== 0) {
                              obj = {
                                feeTypeName: `${singleFee.title} (${singleFee.installment})`,
                                previousDue: 0.0,
                                currentDue: Number(singleFee.amount),
                                totalDue: Number(singleFee.paid),
                                paidAmount: Number(singleFee.paid),
                                mode: mode,
                                academicYear: demandNoteData.academicYear,
                                studentName: demandNoteData.studentName,
                                regId: demandNoteData.studentRegId,
                                class: demandNoteData.class,
                                studentFeesDetails: studentFeeMapDetails,
                                campus: allCampus,
                              };
                              feesAll.push(obj);
                            }
                          }

                          let statement = [];
                          for (oneInsta of installmentPlanData) {
                            let stat;
                            if (oneInsta.status == "Paid") {
                              stat = moment().format("DD/MM/YYYY");
                            } else {
                              stat = "-";
                            }
                            dateFilter = (ev) => {
                              var ts = new Date(ev);
                              let getDate = `${String(ts.getDate()).length == 1
                                ? `0${ts.getDate()}`
                                : ts.getDate()
                                }`;
                              let getMonth = `${String(ts.getMonth() + 1).length == 1
                                ? `0${ts.getMonth() + 1}`
                                : ts.getMonth() + 1
                                }`;

                              let getYear = `${ts.getFullYear()}`;
                              let today = `${getDate}/${getMonth}/${getYear}`;
                              return today;
                            };
                            let datNo = moment(oneInsta.dueDate)
                              .add(1, "days")
                              .format("DD/MM/YYYY");

                            let newDate = `${oneInsta.dueDate.split(" ")[3]
                              }/${oneInsta.dueDate.split(" ")[1].toUpperCase()}/${oneInsta.dueDate.split(" ")[2]
                              }`;
                            let paidall;
                            if (Number(oneInsta.paidAmount) == 0) {
                              paidall = oneInsta.plannedAmount;
                            } else {
                              paidall = oneInsta.paidAmount;
                            }
                            let obj = {
                              dueDate: datNo,
                              paidDate: stat,
                              amount: oneInsta.plannedAmount,
                              paidTotal: paidall,
                              allPaid: oneInsta.paidAmount,
                              term: `${oneInsta.plannedAmountBreakup[0].title} (${oneInsta.label})`,
                              status: oneInsta.status,
                              payable: oneInsta.plannedAmount,
                            };
                            statement.push(obj);
                          }

                          let totalPaid = _.sumBy(statement, function (o) {
                            return o.allPaid;
                          });
                          let totalPayable = _.sumBy(statement, function (o) {
                            return o.payable;
                          });

                          let totBal = Number(totalPayable) - Number(totalPaid);

                          let allBalance;
                          let totalBalanceStatus;
                          if (Number(totBal) == 0 || Number(totBal) < 0) {
                            allBalance = 0;
                            totalBalanceStatus = "-";
                          } else {
                            allBalance = Number(totBal);
                            totalBalanceStatus = "Planned";
                          }

                          statement[0].totalAmount = totalPaid;
                          statement[0].totalBalance = allBalance;
                          statement[0].totalBalanceStatus = totalBalanceStatus;
                          // let dateToday = moment().format("DD/MM/YYYY");
                          // statement[0].status = "Paid";
                          // statement[0].paidDate = dateToday;

                          // let feesAll = [
                          //   {
                          //     feeTypeName: feeTypesDetails.title,
                          //     previousDue: 0.0,
                          //     currentDue: demandNoteData.amount,
                          //     totalDue: demandNoteData.amount,
                          //     paidAmount: ledgerData.paidAmount,
                          //     mode: mode,
                          //     academicYear: demandNoteData.academicYear,
                          //     studentName: demandNoteData.studentName,
                          //     class: demandNoteData.class,
                          //   },
                          // ];

                          var allMaildata = {
                            transactionId: transactionId,
                            studentName: demandNoteData.studentName,
                            campus: allCampus,
                          };

                          let titlereceipt;
                          if (payloadOtc.type.toLowerCase() == "receipt") {
                            titlereceipt = `Receipt`;
                          } else {
                            titlereceipt = `Acknowledgement`;
                          }
                          //Send receipt or Acknowledgement
                          const emailTemplate1 = await receiptVkgiTemplate(
                            orgDetails,
                            allMaildata,
                            orgData.nameSpace.toUpperCase()
                          );
                          let qrCo = null;
                          const successReceipt = await receiptVkgiPdf(
                            orgDetails,
                            feesAll,
                            feeTableHeader,
                            rcptId,
                            payloadOtc.type,
                            qrCo,
                            "",
                            statementTableHeader,
                            statement,
                            titlereceipt,
                            transactionId
                          );

                          let obje = {
                            html: successReceipt,
                          };

                          let createPdf = await axios.post(
                            "http://13.71.115.192:8080/receipts",
                            obje
                          );

                          let accountname = process.env.blobAccountName;
                          const containerName = process.env.containerName;
                          let key = process.env.blobKey;

                          let blobName = createPdf.data.data;

                          const blobServiceClient =
                            BlobServiceClient.fromConnectionString(
                              process.env.AZURE_STORAGE_CONNECTION_STRING
                            );
                          const containerClient =
                            blobServiceClient.getContainerClient(containerName);
                          const blobClient =
                            await containerClient.getBlobClient(blobName);
                          var repla = blobClient.url.replace(
                            "https://supportings.blob.core.windows.net",
                            "https://fcreceipt.zenqore.com"
                          );
                          let minUrl = repla;

                          // let getData = await getBlobData(
                          //   containerName,
                          //   createPdf.data.data
                          // );
                          let qrCod = await generateQrCode(minUrl);

                          const successReceipt1 = await receiptVkgiPdf(
                            orgDetails,
                            feesAll,
                            feeTableHeader,
                            rcptId,
                            payloadOtc.type,
                            qrCod,
                            minUrl,
                            statementTableHeader,
                            statement,
                            titlereceipt,
                            transactionId
                          );

                          let obje1 = {
                            html: successReceipt1,
                          };

                          //second receipt start
                          let createPdf1 = await axios.post(
                            "http://13.71.115.192:8080/receipts",
                            obje1
                          );

                          let blobName1 = createPdf1.data.data;

                          const blobClient1 =
                            await containerClient.getBlobClient(blobName1);
                          var repla1 = blobClient1.url.replace(
                            "https://supportings.blob.core.windows.net",
                            "https://fcreceipt.zenqore.com"
                          );
                          let minUrl1 = repla1;
                          const transactionUpdate = await TxnModel.updateOne(
                            { displayName: rcptId },
                            { receiptWithoutQr: minUrl, receiptWithQr: minUrl1 }
                          );

                          //second receipt end
                          dbConnection1.close();
                          let title;
                          if (payloadOtc.type == "receipt") {
                            title = "NCFE-Receipt";
                          } else {
                            title = "NCFE-Acknowledgement";
                          }

                          sendEmail(
                            orgDetails.emailServer[0].emailServer,
                            comEmail,
                            orgDetails.emailServer[0].emailAddress,
                            title,
                            emailTemplate1,
                            createPdf1.data.file,
                            "vkgi"
                          )
                            .then((data) => {
                              dbConnection1.close();
                              res.status(200).json({
                                status: "success",
                                message: "Receipt sent successfully",
                                data: paymentData,
                                receiptKey: createPdf.data.data,
                                receiptId: rcptId,
                              });
                            })
                            .catch((err) => {
                              dbConnection1.close();
                              res.status(500).send({
                                status: "failure",
                                message: "failed to send receipt email",
                                data: err,
                              });
                            });
                        } else {
                          centralDbConnection.close();
                          dbConnection1.close();
                          return res.status(400).json({
                            status: "failure",
                            message: "Student Fees mapping not updated",
                            Error: err,
                          });
                        }
                      }
                    );
                  }
                })
                .catch((err) => {
                  res.status(500).send(err);
                });
            })
            .catch((err) => {
              res.status(400).json({ Message: "Failed", Error: err });
              return;
            });
        }
      } else {
        let dbConnection = await createDatabase(
          String(orgData._id),
          orgData.connUri
        );
        let transactionModel = dbConnection.model(
          "transactions",
          transactionsSchema
        );
        let studentModel = dbConnection.model("students", StudentSchema);
        let feeStructureModel = dbConnection.model(
          "feestructures",
          FeeStructureSchema
        );
        let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);
        let feeManagerModel = dbConnection.model(
          "feemanagers",
          FeeManagerSchema
        );
        let guardianModel = dbConnection.model("guardians", GuardianSchema);
        let feeMapModel = dbConnection.model(
          "studentfeesmaps",
          StudentFeeMapSchema
        );
        let programPlanModel = dbConnection.model(
          "programplans",
          programPlanSchema
        );
        const paymentModel = dbConnection.model("razorpay", RazorpaySchema);
        let settingsModel = dbConnection.model("settings", settingsSchema);

        let studentDetails = await studentModel.findOne({
          rollNumber: inputData.studentId,
        });

        var transactionDetails = await transactionModel.find({
          $or: [{ status: "Pending" }, { status: "Partial" }],
          studentRegId: studentDetails.regId,
          transactionSubType: "demandNote",
        });
        let demandNoteId;
        if (transactionDetails.length == 0) {
          demandNoteId = [];
        } else {
          demandNoteId = transactionDetails;
        }
        if (studentDetails == null) {
          centralDbConnection.close();
          dbConnection.close();
          return res
            .status(404)
            .json({ status: "failed", message: "Invalid Student ID" });
        } else {
          let studentFeeMapDetails = await feeMapModel.findOne({
            studentId: studentDetails._id,
          });
          if (
            Number(studentFeeMapDetails.pending) == 0 ||
            Number(studentFeeMapDetails.pending) < 0
          ) {
            centralDbConnection.close();
            dbConnection.close();
            return res
              .status(400)
              .json({ success: false, message: "Already Paid Full Payment" });
          }
          let feeStructureDetails = await feeStructureModel.findOne({
            _id: studentFeeMapDetails.feeStructureId,
          });
          let guardianDetails = await guardianModel.findOne({
            _id: studentDetails.guardianDetails[0],
          });
          let programPlanDetails = await programPlanModel.findOne({
            _id: studentFeeMapDetails.programPlanId,
          });
          let settingsDetails = await settingsModel.find({});
          let paymentDetails = await paymentModel.findOne({
            paymentId: inputData.paymentLinkId,
          });

          let feesBreakUp = [];
          for (oneData of paymentDetails.feesBreakUp) {
            let TtoalPend;
            let pending = Number(oneData.amount) - Number(oneData.paid);
            if (Number(pending) == 0 || Number(pending) < 0) {
              TtoalPend = 0;
            } else {
              TtoalPend = pending;
            }
            let obj = {
              amount: oneData.amount,
              paid: oneData.paid,
              pending: TtoalPend,
              feeTypeCode: oneData.feeTypeCode,
              title: oneData.title,
              dueDate: oneData.dueDate,
              partial: oneData.partial,
            };
            feesBreakUp.push(obj);
          }
          // for (feeTypesI of feeStructureDetails.feeTypeIds) {
          //   let feeTypesDetails = await feeTypeModel.findOne({
          //     _id: feeTypesI,
          //   });
          //   let feeManagerDetails = await feeManagerModel.findOne({
          //     feeTypeId: feeTypesI,
          //   });
          //   let fees;
          //   if (feeManagerDetails !== null) {
          //     fees = feeManagerDetails.feeDetails.totalAmount;
          //   } else {
          //     fees = 0;
          //   }
          //   let obj = {
          //     feeTypeId: feeTypesDetails._id,
          //     feeType: feeTypesDetails.title,
          //     amount: fees,
          //     feeTypeCode: feeTypesDetails.displayName,
          //   };
          //   feesBreakUp.push(obj);
          // }

          const credentials = mongoose.Schema({}, { strict: false });
          // const msettingModel = dbConnectionp.model("settings", credentials, "settings")
          const credentialsModel = dbConnection.model(
            "credentials",
            credentials,
            "credentials"
          );
          const credentialData = await credentialsModel.findOne({
            type: "payment",
          });

          var username = credentialData._doc.userName;
          var password = credentialData._doc.password;
          var auth =
            "Basic " +
            Buffer.from(username + ":" + password).toString("base64");

          var options = {
            method: "GET",
            uri: "https://api.razorpay.com/v1/payments/" + inputData.razorpayId,
            headers: {
              "Content-Type": "application/json",
              Authorization: auth,
            },
          };
          rq(options)
            .then(async (success) => {
              let rs = JSON.parse(success);
              let transId;
              if (rs.acquirer_data.bank_transaction_id) {
                transId = rs.acquirer_data.bank_transaction_id;
              } else if (rs.acquirer_data.auth_code) {
                transId = rs.acquirer_data.auth_code;
              } else if (rs.acquirer_data.upi_transaction_id) {
                transId = rs.acquirer_data.upi_transaction_id;
              } else if (rs.acquirer_data.rrn) {
                transId = rs.acquirer_data.rrn;
              }
              let receiptType;
              if (settingsDetails[0].receipts.send == "immediately") {
                receiptType = "receipt";
              } else {
                receiptType = "afterReconciliation";
              }
              let paidAmounr = String(rs.amount);
              let editedText = paidAmounr.slice(0, -2);
              var d = new Date();
              let comEmail;
              if (paymentDetails.email) {
                comEmail = paymentDetails.email;
              } else if (studentDetails.parentEmail) {
                comEmail = studentDetails.parentEmail;
              } else {
                comEmail = studentDetails.email;
              }
              let payloadOtc = {
                transactionDate: d,
                relatedTransactions: demandNoteId,
                studentId: studentDetails._id,
                emailCommunicationRefIds: comEmail,
                transactionType: "eduFees",
                transactionSubType: "feePayment",
                studentFeeMap: studentFeeMapDetails.displayName,
                amount: editedText,
                status: "initiated",
                data: {
                  feesBreakUp: feesBreakUp,
                  orgId: inputData.orgId,
                  transactionType: "eduFees",
                  transactionSubType: "feePayment",
                  mode: "razorpay",
                  method: rs.method,
                  modeDetails: {
                    netBankingType: null,
                    walletType: rs.wallet,
                    instrumentNo: null,
                    cardType: null,
                    nameOnCard: null,
                    cardNumber: rs.card_id,
                    instrumentDate: d,
                    bankName: rs.bank,
                    branchName: null,
                    transactionId: null,
                    remarks: null,
                  },
                },
                paymentTransactionId: transId,
                createdBy: inputData.userId,
                academicYear: programPlanDetails.academicYear,
                class: programPlanDetails.title,
                studentName:
                  studentDetails.firstName + "" + studentDetails.lastName,
                studentRegId: studentDetails.regId,
                programPlanId: programPlanDetails._id,
                type: receiptType,
                currency: rs.currency,
                currencyAmount: editedText,
                exchangeRate: rs.base_amount,
                campusId: studentDetails.campusId,
              };
              //create OTC
              var receiptN = ("" + Math.random()).substring(2, 7);
              var year2 = moment().year();

              var transID = `TXN/${year2}/${receiptN + 1}`;
              let imode = payloadOtc.data.mode;
              let mode = imode.toLowerCase();
              var rcptId = await getDisplayId(dbConnection);
              let transactionId;
              if (mode == "cash") {
                transactionId = transID;
              } else {
                transactionId = payloadOtc.paymentTransactionId;
              }
              let passData = {
                displayName: rcptId,
                transactionDate: payloadOtc.transactionDate,
                relatedTransactions: payloadOtc.relatedTransactions,
                transactionType: "eduFees",
                transactionSubType: "feePayment",
                studentId: payloadOtc.studentId,
                emailCommunicationRefIds: payloadOtc.emailCommunicationRefIds,
                studentName: payloadOtc.studentName,
                class: payloadOtc.class,
                academicYear: payloadOtc.academicYear,
                amount: payloadOtc.amount,
                studentRegId: payloadOtc.studentRegId,
                receiptNo: rcptId,
                programPlan: payloadOtc.programPlanId,
                data: {
                  orgId: payloadOtc.data.orgId,
                  displayName: rcptId,
                  transactionType: "eduFees",
                  transactionSubType: "feePayment",
                  mode: mode,
                  method: payloadOtc.data.method,
                  modeDetails: {
                    netBankingType: payloadOtc.data.modeDetails.netBankingType,
                    walletType: payloadOtc.data.modeDetails.walletType,
                    instrumentNo: payloadOtc.data.modeDetails.instrumentNo,
                    instrumentDate: payloadOtc.data.modeDetails.instrumentDate,
                    bankName: payloadOtc.data.modeDetails.bankName,
                    cardDetails: {
                      cardType: payloadOtc.data.modeDetails.cardType,
                      nameOnCard: payloadOtc.data.modeDetails.nameOnCard,
                      cardNumber: payloadOtc.data.modeDetails.cardNumber,
                    },
                    branchName: payloadOtc.data.modeDetails.branch,
                    transactionId: transactionId,
                    remarks: payloadOtc.data.modeDetails.remarks,
                  },
                  feesBreakUp: payloadOtc.data.feesBreakUp,
                },
                paymentTransactionId: transactionId,
                receiptStatus: payloadOtc.receiptStatus,
                currency: payloadOtc.currency,
                currencyAmount: payloadOtc.currencyAmount,
                exchangeRate: payloadOtc.exchangeRate,
                userName: payloadOtc.userName,
                createdBy: payloadOtc.userId,
                updatedBy: payloadOtc.userId,
                campusId: payloadOtc.campusId,
              };
              ledgerEntry({ body: passData }, dbConnection)
                .then(async (paymentData) => {
                  if (paymentData.status == "failure") {
                    res.status(400).json(paymentData);
                  } else {
                    let dbConnection1 = await createDatabase(
                      String(orgData._id),
                      orgData.connUri
                    );
                    const settingsSchema = mongoose.Schema(
                      {},
                      { strict: false }
                    );
                    const settingsModel = dbConnection1.model(
                      "settings",
                      settingsSchema,
                      "settings"
                    );
                    const orgSettings = await settingsModel.find({});
                    let orgDetails = orgSettings[0]._doc;
                    let feeMapModel = dbConnection1.model(
                      "studentfeesmaps",
                      StudentFeeMapSchema
                    );
                    let feeStructureModel = dbConnection1.model(
                      "feestructures",
                      FeeStructureSchema
                    );
                    let feeManagerModel = dbConnection1.model(
                      "feemanagers",
                      FeeManagerSchema
                    );
                    let feeTypeModel = dbConnection1.model(
                      "feetypes",
                      FeeTypeSchema
                    );

                    let feMapDe = await feeMapModel.findOne({
                      displayName: payloadOtc.studentFeeMap,
                    });
                    let feeStructureDetails = await feeStructureModel.findOne({
                      _id: feMapDe.feeStructureId,
                    });
                    let feeBre = [];
                    if (feMapDe.transactionPlan.feesBreakUp.length !== 0) {
                      for (singleData of feMapDe.transactionPlan.feesBreakUp) {
                        console.log("singleData", singleData);
                        let fees = singleData.amount;
                        for (oneFee of payloadOtc.data.feesBreakUp) {
                          if (
                            String(singleData.feeTypeCode) ==
                            String(oneFee.feeTypeCode)
                          ) {
                            let fullPaid =
                              Number(singleData.paid) + Number(oneFee.amount);
                            let fullPending = Number(fees) - fullPaid;
                            let obje;
                            if (Number(fullPending) < 0) {
                              obje = {
                                amount: fees,
                                paid: fullPaid,
                                pending: 0,
                                feeTypeCode: oneFee.feeTypeCode,
                                title: oneFee.title,
                              };
                            } else {
                              obje = {
                                amount: fees,
                                paid: fullPaid,
                                pending: fullPending,
                                feeTypeCode: oneFee.feeTypeCode,
                                title: oneFee.title,
                              };
                            }
                            feeBre.push(obje);
                          }
                        }
                      }
                    } else {
                      let fees = singleData.amount;
                      for (oneFee of payloadOtc.data.feesBreakUp) {
                        if (
                          String(singleData.feeTypeCode) ==
                          String(oneFee.feeTypeCode)
                        ) {
                          let fullPaid = Number(oneFee.amount);
                          let fullPending = Number(fees) - fullPaid;
                          let obje;
                          if (Number(fullPending) < 0) {
                            obje = {
                              amount: fees,
                              paid: fullPaid,
                              pending: 0,
                              feeTypeCode: oneFee.feeTypeCode,
                              title: oneFee.title,
                            };
                          } else {
                            obje = {
                              amount: fees,
                              paid: fullPaid,
                              pending: fullPending,
                              feeTypeCode: oneFee.feeTypeCode,
                              title: oneFee.title,
                            };
                          }
                          feeBre.push(obje);
                        }
                      }
                    }
                    var tota = 0;
                    var pai = 0;
                    var pend = 0;
                    for (oneFees of feeBre) {
                      tota += oneFees.amount;
                      pai += oneFees.paid;
                      pend += oneFees.pending;
                    }
                    let feeTypesPaid = {
                      feesBreakUp: feeBre,
                      totalAmount: tota,
                      totalPaid: pai,
                      totalPending: pend,
                    };
                    let paidA =
                      Number(feMapDe.paid) + Number(payloadOtc.amount);
                    let pendingAmountTotal =
                      Number(feMapDe.amount) - Number(paidA);
                    feeMapModel.updateOne(
                      { displayName: payloadOtc.studentFeeMap },
                      {
                        $set: {
                          paid: paidA,
                          pending: pendingAmountTotal,
                          transactionPlan: feeTypesPaid,
                        },
                      },
                      async function (err, feeMapD) {
                        if (feeMapD.nModified) {
                          let feeTableHeader = [
                            {
                              name: "Particulars",
                              value: "feeTypeName",
                              type: "string",
                            },
                            {
                              name: "Paid Amount",
                              value: "paidAmount",
                              type: "amount",
                            },
                          ];
                          let TxnModel = dbConnection1.model(
                            "transactions",
                            transactionsSchema
                          );
                          let feeTypeModel = dbConnection1.model(
                            "feetypes",
                            FeeTypeSchema
                          );

                          let FeesLedgerModel = dbConnection1.model(
                            "feesledgers",
                            feesLedgerSchema
                          );
                          let reconciliationTransactionsModel =
                            dbConnection1.model(
                              "reconciliationTransactions",
                              reconciliationTransactionsSchema
                            );
                          let ledgerData = await FeesLedgerModel.findOne({
                            transactionDisplayName: rcptId,
                          });
                          let demandNoteData = await TxnModel.findOne({
                            displayName: rcptId,
                          });
                          // let demandNoteData = await TxnModel.findOne({
                          //   displayName: payloadOtc.relatedTransactions[0],
                          // });
                          var feesAll = [];
                          for (singleFee of payloadOtc.data.feesBreakUp) {
                            var obj;
                            if (Number(singleFee.amount) !== 0) {
                              obj = {
                                feeTypeName: singleFee.feeType,
                                previousDue: 0.0,
                                currentDue: Number(singleFee.amount),
                                totalDue: Number(singleFee.amount),
                                paidAmount: Number(singleFee.amount),
                                mode: mode,
                                academicYear: demandNoteData.academicYear,
                                studentName: demandNoteData.studentName,
                                regId: demandNoteData.studentRegId,
                                class: demandNoteData.class,
                              };
                              feesAll.push(obj);
                            }
                          }

                          // let feesAll = [
                          //   {
                          //     feeTypeName: feeTypesDetails.title,
                          //     previousDue: 0.0,
                          //     currentDue: demandNoteData.amount,
                          //     totalDue: demandNoteData.amount,
                          //     paidAmount: ledgerData.paidAmount,
                          //     mode: mode,
                          //     academicYear: demandNoteData.academicYear,
                          //     studentName: demandNoteData.studentName,
                          //     class: demandNoteData.class,
                          //   },
                          // ];

                          var allMaildata = {
                            transactionId: transactionId,
                            studentName: demandNoteData.studentName,
                          };
                          //Send receipt or Acknowledgement
                          const emailTemplate1 = await receiptTemplate(
                            orgDetails,
                            allMaildata
                          );
                          let qrCo = null;
                          const successReceipt = await receiptPdf(
                            orgDetails,
                            feesAll,
                            feeTableHeader,
                            rcptId,
                            payloadOtc.type,
                            qrCo
                          );

                          let obje = {
                            html: successReceipt,
                          };
                          let createPdf = await axios.post(
                            "http://13.71.115.192:8080/receipts",
                            obje
                          );
                          let accountname = process.env.blobAccountName;
                          const containerName = process.env.containerName;
                          let key = process.env.blobKey;

                          let blobName = createPdf.data.data;

                          const blobServiceClient =
                            BlobServiceClient.fromConnectionString(
                              process.env.AZURE_STORAGE_CONNECTION_STRING
                            );
                          const containerClient =
                            blobServiceClient.getContainerClient(containerName);
                          const blobClient =
                            await containerClient.getBlobClient(blobName);
                          var repla = blobClient.url.replace(
                            "https://supportings.blob.core.windows.net",
                            "https://fcreceipt.zenqore.com"
                          );
                          let minUrl = repla;
                          // let getData = await getBlobData(
                          //   containerName,
                          //   createPdf.data.data
                          // );
                          let qrCod = await generateQrCode(minUrl);
                          const successReceipt1 = await receiptPdf(
                            orgDetails,
                            feesAll,
                            feeTableHeader,
                            rcptId,
                            payloadOtc.type,
                            qrCod,
                            minUrl
                          );

                          let obje1 = {
                            html: successReceipt1,
                          };
                          let createPdf1 = await axios.post(
                            "http://13.71.115.192:8080/receipts",
                            obje1
                          );
                          dbConnection1.close();
                          let title;
                          if (payloadOtc.type == "receipt") {
                            title = "ZQ EDU-Receipt";
                          } else {
                            title = "ZQ EDU-Acknowledgement";
                          }
                          sendEmail(
                            orgDetails.emailServer[0].emailServer,
                            comEmail,
                            orgDetails.emailServer[0].emailAddress,
                            title,
                            emailTemplate1,
                            createPdf1.data.file
                          )
                            .then((data) => {
                              dbConnection1.close();
                              res.status(200).json({
                                status: "success",
                                message: "Receipt sent successfully",
                                data: paymentData,
                                receiptKey: createPdf.data.data,
                                receiptId: rcptId,
                              });
                            })
                            .catch((err) => {
                              dbConnection1.close();
                              res.status(500).send({
                                status: "failure",
                                message: "failed to send receipt email",
                                data: err,
                              });
                            });
                        } else {
                          dbConnection1.close();
                          return res.status(400).json({
                            status: "failure",
                            message: "Student Fees mapping not updated",
                            Error: err,
                          });
                        }
                      }
                    );
                  }
                })
                .catch((err) => {
                  centralDbConnection.close();
                  dbConnection.close();
                  res.status(500).send(err);
                });
            })
            .catch((err) => {
              centralDbConnection.close();
              dbConnection.close();
              res.status(400).json({ Message: "Failed", Error: err });
              return;
            });
        }
      }
    }
  }
};
exports.addPayment = async function (req, res) {
  let inputData = req.body;
  if (!inputData.orgId || !inputData.studentId || !inputData.razorpayId) {
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
      _id: inputData.orgId,
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
      let campusModel = dbConnection.model(
        "campuses",
        campusSchema
      );
      let transactionModel = dbConnection.model(
        "transactions",
        transactionsSchema
      );
      let studentModel = dbConnection.model("students", StudentSchema);
      let feeStructureModel = dbConnection.model(
        "feestructures",
        FeeStructureSchema
      );
      let feeTypeModel = dbConnection.model("feetypes", FeeTypeSchema);
      let feeManagerModel = dbConnection.model("feemanagers", FeeManagerSchema);
      let guardianModel = dbConnection.model("guardians", GuardianSchema);
      let feeMapModel = dbConnection.model(
        "studentfeesmaps",
        StudentFeeMapSchema
      );
      let installFeePlanModel = dbConnection.model(
        "studentfeeinstallmentplans",
        feeplanInstallmentschema
      );
      let programPlanModel = dbConnection.model(
        "programplans",
        programPlanSchema
      );

      const paymentModel = dbConnection.model("razorpay", RazorpaySchema);
      let settingsModel = dbConnection.model("settings", settingsSchema);

      let studentDetails = await studentModel.findOne({
        rollNumber: inputData.studentId,
      });
      let campusData = await campusModel.findOne({
        _id: studentDetails.campusId,
      });
      var username = campusData.credentials.username;
      var password = campusData.credentials.password;
      if (studentDetails == null) {
        centralDbConnection.close();
        dbConnection.close();
        return res
          .status(404)
          .json({ status: "failed", message: "Invalid Student ID" });
      } else {
        let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
        let feePlanData = await feePlanModel.findOne({
          studentRegId: studentDetails.regId,
        });
        let feeDetails = {
          totalFees: feePlanData.plannedAmount,
          totalConcession: feePlanData.concessionFees,
          totalPayable: feePlanData.pendingAmount,
        };
        if (
          Number(feePlanData.pendingAmount) == 0 ||
          Number(feePlanData.pendingAmount) < 0
        ) {
          return res
            .status(400)
            .json({ success: false, message: "Already Paid Full Payment" });
        } else {
          var transactionDetails = await transactionModel.find({
            $or: [{ status: "Pending" }, { status: "Partial" }],
            studentRegId: studentDetails.regId,
            transactionSubType: "demandNote",
          });
          let demandNoteId;
          if (transactionDetails.length == 0) {
            demandNoteId = [];
          } else {
            demandNoteId = transactionDetails;
          }
          let studentFeeMapDetails = await feeMapModel.findOne({
            studentId: studentDetails._id,
          });

          let feeStructureDetails = await feeStructureModel.findOne({
            _id: studentDetails.feeStructureId,
          });
          let guardianDetails = await guardianModel.findOne({
            _id: studentDetails.guardianDetails[0],
          });
          let programPlanDetails = await programPlanModel.findOne({
            _id: studentDetails.programPlanId,
          });
          let settingsDetails = await settingsModel.find({});
          let paymentDetails = await paymentModel.findOne({
            paymentId: inputData.paymentLinkId,
          });
          //payload set start
          let installmentPlanData = await installFeePlanModel.find({
            feePlanId: feePlanData._id,
          });
          let feesBreak = [];
          var totalLoan = Number(paymentDetails.amount);

          for (oneData of paymentDetails.feesBreakUp) {
            let obj = {
              amount: oneData.pending,
              paid: oneData.pending,
              pending: oneData.pending,
              feeTypeCode: oneData.feeTypeCode,
              title: oneData.title,
              installment: oneData.installment,
              dueDate: oneData.dueDate,
            };
            feesBreak.push(obj);
          }
         
          var auth =
            "Basic " +
            Buffer.from(username + ":" + password).toString("base64");

          var options = {
            method: "GET",
            uri: "https://api.razorpay.com/v1/payments/" + inputData.razorpayId,
            headers: {
              "Content-Type": "application/json",
              Authorization: auth,
            },
          };
          rq(options)
            .then(async (success) => {
              let rs = JSON.parse(success);
              var rcptId = await getDisplayId(dbConnection);

              let paidAmounr = String(rs.amount);
              let editedText =Number(totalLoan);
              var transId;
              if (rs.acquirer_data.bank_transaction_id) {
                transId = rs.acquirer_data.bank_transaction_id;
              } else if (rs.acquirer_data.auth_code) {
                transId = rs.acquirer_data.auth_code;
              } else if (rs.acquirer_data.upi_transaction_id) {
                transId = rs.acquirer_data.upi_transaction_id;
              } else if (rs.acquirer_data.rrn) {
                transId = rs.acquirer_data.rrn;
              } else {
                transId = rcptId;
              }
              var comEmail;
              if (paymentDetails.email) {
                comEmail = paymentDetails.email;
              } else if (studentDetails.parentEmail) {
                comEmail = studentDetails.parentEmail;
              } else {
                comEmail = studentDetails.email;
              }

              let pedingAMount =
                Number(feePlanData.pendingAmount) - Number(editedText);
              let PendingAmount;
              if (Number(pedingAMount) == 0 || Number(pedingAMount) < 0) {
                PendingAmount = 0;
              } else {
                PendingAmount = pedingAMount;
              }
              var d = new Date();
              var transactionDate = moment.utc(d).tz("Asia/Kolkata");
              let passData = {
                displayName: rcptId,
                transactionDate: transactionDate,
                relatedTransactions: demandNoteId,
                transactionType: "eduFees",
                transactionSubType: "feePayment",
                studentId: studentDetails._id,
                emailCommunicationRefIds: paymentDetails.email,
                studentName:
                  studentDetails.firstName + " " + studentDetails.lastName,
                class: programPlanDetails.title,
                academicYear: programPlanDetails.academicYear,
                amount: totalLoan,
                studentRegId: studentDetails.regId,
                receiptNo: rcptId,
                programPlan: programPlanDetails._id,
                data: {
                  orgId: inputData.orgId,
                  displayName: rcptId,
                  transactionType: "eduFees",
                  transactionSubType: "feePayment",
                  mode: "razorpay",
                  method: rs.method,
                  modeDetails: {
                    netBankingType: null,
                    walletType: rs.wallet,
                    instrumentNo: null,
                    cardType: null,
                    nameOnCard: null,
                    cardNumber: rs.card_id,
                    instrumentDate: d,
                    bankName: rs.bank,
                    branchName: null,
                    transactionId: null,
                    remarks: null,
                  },
                  feesBreakUp: feesBreak,
                },
                paymentTransactionId: transId,
                receiptStatus: "",
                currency: "INR",
                currencyAmount: totalLoan,
                exchangeRate: totalLoan,
                userName:
                  studentDetails.firstName + " " + studentDetails.lastName,
                createdBy: studentDetails.createdBy,
                updatedBy: studentDetails.createdBy,
                campusId: studentDetails.campusId,
                status: "initiated",
                type: settingsDetails[0].receipts.send,
                previousPaid: feePlanData.paidAmount,
                pendingAmount: PendingAmount,
              };
              let createDemand = await ledgerEntry(
                { body: passData },
                dbConnection
              );
              if (createDemand.status == "success") {
                let dbConnection1 = await createDatabase(
                  String(orgData._id),
                  orgData.connUri
                );
                const settingsSchema = mongoose.Schema({}, { strict: false });
                const settingsModel = dbConnection1.model(
                  "settings",
                  settingsSchema,
                  "settings"
                );
                const orgSettings = await settingsModel.find({});
                let orgDetails = orgSettings[0]._doc;
                let TxnModel = dbConnection1.model(
                  "transactions",
                  transactionsSchema
                );
                let feePlanModel = dbConnection1.model(
                  "studentfeeplan",
                  feeplanschema
                );
                let feeMapModel = dbConnection1.model(
                  "studentfeesmaps",
                  StudentFeeMapSchema
                );
                let installFeePlanModel = dbConnection1.model(
                  "studentfeeinstallmentplans",
                  feeplanInstallmentschema
                );

                let campusModel = dbConnection1.model("campuses", campusSchema);

                let feMapDe = await feeMapModel.findOne({
                  studentId: studentDetails._id,
                });

                let feePlanData = await feePlanModel.findOne({
                  studentRegId: studentDetails.regId,
                });
                var transactionDetails = await TxnModel.findOne({
                  $or: [{ status: "Pending" }, { status: "Partial" }],
                  studentRegId: studentDetails.regId,
                  transactionSubType: "demandNote",
                });
                if (transactionDetails) {
                  if (
                    Number(feePlanData.pendingAmount) < 0 ||
                    Number(feePlanData.pendingAmount) == 0
                  ) {
                    let updateTransaction = await TxnModel.updateOne(
                      {
                        $or: [{ status: "Pending" }, { status: "Partial" }],
                        studentRegId: studentDetails.regId,
                        transactionSubType: "demandNote",
                      },
                      {
                        $set: {
                          status: "Paid",
                        },
                      }
                    );
                    if (updateTransaction.nModified) {
                      console.log("demand note status updated");
                    } else {
                      console.log("demand note status not updated");
                    }
                  }
                }
                let updateFeeMap = await feeMapModel.updateOne(
                  { displayName: feMapDe.displayName },
                  {
                    $set: {
                      paid: Number(feePlanData.paidAmount),
                      pending: Number(feePlanData.pendingAmount),
                    },
                  }
                );
                if (updateFeeMap.nModified) {
                  let feeTableHeader = [
                    {
                      name: "Particulars",
                      value: "feeTypeName",
                      type: "string",
                    },
                    {
                      name: "Paid Amount",
                      value: "paidAmount",
                      type: "amount",
                    },
                  ];
                  let statementTableHeader = [
                    {
                      name: "TITLE",
                      value: "term",
                      type: "string",
                    },
                    {
                      name: "DUE DATE",
                      value: "dueDate",
                      type: "string",
                    },
                    {
                      name: "PAID DATE",
                      value: "paidDate",
                      type: "string",
                    },
                    {
                      name: "AMOUNT",
                      value: "paidTotal",
                      type: "amount",
                    },
                    {
                      name: "STATUS",
                      value: "status",
                      type: "string",
                    },
                  ];
                  let campusStatus;
                  if (
                    passData.campusId.toLowerCase() == "all" ||
                    passData.campusId.toLowerCase() == "undefined" ||
                    passData.campusId.toLowerCase() == "null" ||
                    passData.campusId == undefined ||
                    passData.campusId == null
                  ) {
                    campusStatus = false;
                  } else {
                    campusStatus = true;
                  }

                  let allCampus;
                  if (campusStatus == true) {
                    let allC = await campusModel.findOne({
                      _id: studentDetails.campusId,
                    });
                    allCampus = {
                      logo: allC.logo,
                      name: allC.legalName,
                      address1: allC.legalAddress.address1,
                      address2: allC.legalAddress.address2,
                      address3: allC.legalAddress.address3,
                      city: allC.legalAddress.city,
                      state: allC.legalAddress.state,
                      pincode: allC.legalAddress.pincode,
                      contact: allC.instituteContact[0].mobileNumber,
                    };
                  } else {
                    allCampus = {
                      logo: orgDetails.logo.logo,
                      name: orgDetails.instituteDetails.instituteName,
                      address1: orgDetails.instituteDetails.address1,
                      address2: orgDetails.instituteDetails.address2,
                      address3: orgDetails.instituteDetails.address3,
                      city: orgDetails.instituteDetails.cityTown,
                      state: orgDetails.instituteDetails.stateName,
                      pincode: orgDetails.instituteDetails.pinCode,
                      contact: orgDetails.instituteDetails.phoneNumber1,
                    };
                  }
                  let transactionData = await TxnModel.find({
                    studentRegId: studentDetails.regId,
                    transactionSubType: "feePayment",
                  });
                  let statement = [];
                  for (oneTransactions of transactionData) {
                    let title;
                    if (
                      oneTransactions.data.feesBreakUp[0].title == undefined ||
                      oneTransactions.data.feesBreakUp[0].title ==
                      "undefined" ||
                      oneTransactions.data.feesBreakUp[0].title == null
                    ) {
                      title = oneTransactions.data.feesBreakUp[0].feeType;
                    } else {
                      title = oneTransactions.data.feesBreakUp[0].title;
                    }
                    let totalBalanceStatus;
                    if (feePlanData.pendingAmount > 0) {
                      totalBalanceStatus = "Planned";
                    } else {
                      totalBalanceStatus = "Paid";
                    }
                    let obj = {
                      dueDate: moment(
                        oneTransactions.data.feesBreakUp[0].dueDate
                      ).format("DD/MM/YYYY"),
                      paidDate: moment(oneTransactions.transactionDate).format(
                        "DD/MM/YYYY"
                      ),
                      amount: oneTransactions.amount,
                      paidTotal: oneTransactions.amount,
                      allPaid: oneTransactions.amount,
                      term: title,
                      status: oneTransactions.status,
                      totalBalance: feePlanData.pendingAmount,
                      totalAmount: feePlanData.paidAmount,
                      totalBalanceStatus: totalBalanceStatus,
                    };
                    statement.push(obj);
                  }
                  let demandNoteData = await TxnModel.findOne({
                    displayName: rcptId,
                  });
                  var feesAll = [];
                  for (singleFee of passData.data.feesBreakUp) {
                    var obj;
                    if (Number(singleFee.amount) !== 0) {
                      obj = {
                        feeTypeName: `${singleFee.title} (${singleFee.installment})`,
                        previousDue: 0.0,
                        currentDue: Number(singleFee.amount),
                        totalDue: Number(singleFee.amount),
                        paidAmount: Number(singleFee.amount),
                        mode: passData.data.method,
                        academicYear: demandNoteData.academicYear,
                        studentName: demandNoteData.studentName,
                        regId: demandNoteData.studentRegId,
                        class: demandNoteData.class,
                        studentFeesDetails: studentFeeMapDetails,
                        campus: allCampus,
                        transactionDate: transactionDate,
                      };
                      feesAll.push(obj);
                    }
                  }
                  var allMaildata = {
                    transactionId: demandNoteData.paymentTransactionId,
                    studentName: demandNoteData.studentName,
                    campus: allCampus,
                  };
                  let transactionId = demandNoteData.paymentTransactionId;
                  let nameSpace;
                  if (orgData.nameSpace.toLowerCase() == "vkgi") {
                    nameSpace = "NCFE";
                  } else {
                    nameSpace = orgData.nameSpace;
                  }
                  let title;
                  if (demandNoteData.type.toLowerCase() == "immediately") {
                    title = `${nameSpace.toUpperCase()}-Receipt`;
                  } else {
                    title = `${nameSpace.toUpperCase()}-Acknowledgement`;
                  }
                  let titlereceipt;
                  if (demandNoteData.type.toLowerCase() == "immediately") {
                    titlereceipt = `Receipt`;
                  } else {
                    titlereceipt = `Acknowledgement`;
                  }
                  //Send receipt or Acknowledgement
                  const emailTemplate1 = await receiptVkgiTemplate(
                    orgDetails,
                    allMaildata,
                    orgData.nameSpace.toUpperCase()
                  );
                  let qrCo = null;
                  const successReceipt = await receiptVkgiPdf(
                    orgDetails,
                    feesAll,
                    feeTableHeader,
                    rcptId,
                    passData.type,
                    qrCo,
                    "",
                    statementTableHeader,
                    statement,
                    titlereceipt,
                    transactionId,
                    feeDetails
                  );
                  let obje = {
                    html: successReceipt,
                  };
                  let createPdf = await axios.post(
                    process.env.externalServer,
                    obje
                  );
                  let accountname = process.env.blobAccountName;
                  const containerName = process.env.containerName;
                  let key = process.env.blobKey;

                  let blobName = createPdf.data.data;
                  const blobServiceClient =
                    BlobServiceClient.fromConnectionString(
                      process.env.AZURE_STORAGE_CONNECTION_STRING
                    );
                  const containerClient =
                    blobServiceClient.getContainerClient(containerName);
                  const blobClient = await containerClient.getBlobClient(
                    blobName
                  );
                  var repla = blobClient.url.replace(
                    "https://supportings.blob.core.windows.net",
                    "https://fcreceipt.zenqore.com"
                  );
                  let minUrl = repla;
                  let qrCod = await generateQrCode(minUrl);
                  const successReceipt1 = await receiptVkgiPdf(
                    orgDetails,
                    feesAll,
                    feeTableHeader,
                    rcptId,
                    demandNoteData.type,
                    qrCod,
                    minUrl,
                    statementTableHeader,
                    statement,
                    titlereceipt,
                    transactionId,
                    feeDetails
                  );

                  let obje1 = {
                    html: successReceipt1,
                  };
                  let createPdf1 = await axios.post(
                    process.env.externalServer,
                    obje1
                  );
                  let blobName1 = createPdf1.data.data;

                  const blobClient1 = await containerClient.getBlobClient(
                    blobName1
                  );
                  var repla1 = blobClient1.url.replace(
                    "https://supportings.blob.core.windows.net",
                    "https://fcreceipt.zenqore.com"
                  );
                  let minUrl1 = repla1;
                  const transactionUpdate = await TxnModel.updateOne(
                    { displayName: rcptId },
                    { receiptWithoutQr: minUrl, receiptWithQr: minUrl1 }
                  );

                  sendEmail(
                    orgDetails.emailServer[0].emailServer,
                    paymentDetails.email,
                    orgDetails.emailServer[0].emailAddress,
                    title,
                    emailTemplate1,
                    createPdf1.data.file
                  )
                    .then(async (data) => {
                      dbConnection1.close();
                      res.status(200).json({
                        status: "success",
                        message: "Receipt sent successfully",
                        data: createDemand,
                        receiptKey: createPdf1.data.data,
                        receiptId: rcptId,
                      });
                      const updateData = await updateReportCollection(inputData.orgId, studentDetails.regId);
                    })
                    .catch((err) => {
                      console.log("errror", err);
                      dbConnection1.close();
                      res.status(500).send({
                        status: "failure",
                        message: "failed to send receipt email",
                        data: err,
                      });
                    });
                } else {
                  res.status(400).json({
                    success: false,
                    message: "Unable to update the student fees mapping",
                  });
                }
              } else {
                dbConnection.close();
                res.status(400).json({
                  success: false,
                  Message: `Unable to make the payment for the student registration ID ${studentDetails.regId}`,
                  Error: createDemand,
                });
              }
            })
            .catch((err) => {
              res.status(400).json({ Message: "Failed", Error: err.message });
              return;
            });
          //payload set end
        }
      }
    }
  }
};

async function ledgerEntry(req, dbConnection) {
  let txnData = req.body;
  checkTransactionPayload(txnData);
  transactionSubType = txnData.transactionSubType;
  let TxnModel = dbConnection.model("transactions", transactionsSchema);
  let FeesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
  let journeyModel = dbConnection.model("journeys", journeysSchema);
  let reconciliationTransactionsModel = dbConnection.model(
    "reconciliationTransactions",
    reconciliationTransactionsSchema
  );
  let studentModel = dbConnection.model("students", StudentSchema);
  let feeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
  let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
  let installFeePlan = dbConnection.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );
  let studentData = await studentModel.findOne({ _id: txnData.studentId });
  var savedTxnData;
  var ledgerIds;
  var status = "Pending";
  var journeysData;
  var feePlanData;
  var installmentFeePlan;
  try {
    let studentFeesDetails = await feePlanModel.findOne({
      studentRegId: txnData.studentRegId,
    });
    savedTxnData = await insertTransaction(txnData, TxnModel);
    ledgerIds = await insertFeesPaymentLedgerEntries(
      savedTxnData,
      FeesLedgerModel,
      studentFeesDetails
    );
    journeysData = await journeyEntry(
      txnData,
      savedTxnData,
      ledgerIds,
      journeyModel,
      studentFeesDetails.pendingAmount
    );

    feePlanData = await updateFeePlan(
      txnData,
      savedTxnData,
      ledgerIds,
      feePlanModel
    );

    installmentFeePlan = await updateInstallmentFeePlan(
      savedTxnData,
      installFeePlan,
      feePlanData
    );
    let studentFeesDetails1 = await feePlanModel.findOne({
      studentRegId: txnData.studentRegId,
    });
    if (Number(studentFeesDetails1.pendingAmount) == 0) {
      status = "Paid";
    } else {
      status = "Partial";
    }
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: status }
    );
    msg =
      "feesTransactionsController: Created " +
      ledgerIds.length +
      " ledger entries for transaction: " +
      txnData.displayName;
    return { status: "success", message: msg, data: savedTxnData };
  } catch (err) {
    msg = "feesTransactionsController: Error: " + err.message;
    // need to do cleanup in case transaction (and some ledger entries) were inserted
    if (savedTxnData) {
      msg =
        "feesTransactionsController: Error: " +
        err.message +
        " Rolling back transaction " +
        savedTxnData._id +
        " and ledgerIds: " +
        ledgerIds;

      if (TxnModel) {
        await TxnModel.deleteOne({ _id: savedTxnData._id });
      }
      if (FeesLedgerModel && ledgerIds) {
        await FeesLedgerModel.deleteMany({ _id: { $in: ledgerIds } });
      }
    }
    return { status: "failure", message: msg, data: txnData };
  } finally {
    dbConnection.close();
  }
}
async function getDisplayId(dbConnection) {
  var getDatas = [];
  var transType = "";
  const rcptSchema = dbConnection.model(
    "transactions",
    transactionsSchema,
    "transactions"
  );
  //   let rcptSchema = await dbConnection.model(
  //     "transactions",
  //     rcptModel,
  //     "transactions"
  //   );
  getDatas = await rcptSchema.find({});
  transType = "RCPT";
  var date = new Date();
  var month = date.getMonth();
  var finYear = "";
  // if (month > 2) {
  //   var current = date.getFullYear();
  //   var prev = Number(date.getFullYear()) + 1;
  //   prev = String(prev).substr(String(prev).length - 2);
  //   finYear = `${current}-${prev}`;
  // } else {
  //   var current = date.getFullYear();
  //   current = String(current).substr(String(current).length - 2);
  //   var prev = Number(date.getFullYear()) - 1;
  //   finYear = `${prev}-${current}`;
  // }
  var current = date.getFullYear();
  var prev = Number(date.getFullYear()) + 1;
  prev = String(prev).substr(String(prev).length - 2);
  finYear = `${current}-${prev}`;
  let initial = `${transType}_${finYear}_001`;
  let dataArr = [];
  let check;
  let finalVal;
  const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
  getDatas.forEach((el) => {
    if (el["displayName"]) {
      let filStr = el["displayName"].split("_");
      let typeStr = filStr[0];
      let typeYear = filStr[1];
      if (typeStr == transType && typeYear == finYear) {
        check = true;
        dataArr.push(el["displayName"]);
      }
    }
  });
  if (!check) {
    finalVal = initial;
  } else {
    let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split("_");
    let lastCountNo = Number(lastCount[2]) + 1;
    if (lastCountNo.toString().length == 1) lastCountNo = "00" + lastCountNo;
    if (lastCountNo.toString().length == 2) lastCountNo = "0" + lastCountNo;
    lastCount[2] = lastCountNo;
    finalVal = lastCount.join("_");
  }
  return finalVal;
}

/**
 * This function performs all sanity checks on input payload
 * req.body should have payload for transaction and corresponding ledger entries
 * @param {*} txnData - from httpRequest object - txnData = req.body
 */
function checkTransactionPayload(txnData) {
  let displayName = txnData.displayName;
  let txnType = txnData.transactionType;
  let txnSubType = txnData.transactionSubType;
  // check for null or empty fields in the httprequest payload
  if (!displayName || displayName == "") {
    errMsg =
      "transactionController: displayName is null in the Transaction payload";
    throw new Error(errMsg);
  }
  if (!txnType || txnType == "") {
    errMsg =
      "transactionController: transactionType is null in the Transaction payload";
    throw new Error(errMsg);
  }
  if (!txnSubType || txnSubType == "") {
    errMsg =
      "transactionController: transactionSubType is null in the Transaction payload";
    throw new Error(errMsg);
  }
} // checkTransactionPayload

async function insertTransaction(txnData, TxnModel) {
  try {
    let txnModel = new TxnModel(txnData);
    var savedTxnData = await txnModel.save();
    msg =
      "feesTransactionsController: Created: " +
      "_id: " +
      savedTxnData._id +
      ", '" +
      savedTxnData.displayName +
      "', type: " +
      savedTxnData.transactionType +
      "/" +
      savedTxnData.transactionSubType;
    return savedTxnData;
  } catch (err) {
    throw err;
  }
} // insertTransaction

async function insertFeesPaymentLedgerEntries(
  savedTxnData,
  FeesLedgerModel,
  studentFeeDetails
) {
  let totalPendingAmount = studentFeeDetails.pendingAmount;

  var ledgerIds = [];
  var pending = Number(totalPendingAmount);
  for (feeItem of savedTxnData.data.feesBreakUp) {
    pending = Number(pending) - Number(feeItem.amount);
    let ans;
    var status;
    if (Number(pending) < 0 || Number(pending) == 0) {
      ans = 0;
      status = "Paid";
    } else {
      ans = pending;
      status = "Partial";
    }
    if (Number(feeItem.amount) !== 0) {
      let primary;
      if (savedTxnData.relatedTransactions.length == 0) {
        primary = "";
      } else {
        primary = savedTxnData.relatedTransactions[0];
      }
      feesLedgerData = {
        transactionId: savedTxnData._id,
        transactionDate: savedTxnData.transactionDate,
        transactionDisplayName: savedTxnData.displayName,
        primaryTransaction: primary,
        feeTypeCode: feeItem.feeTypeCode,
        paidAmount: Number(feeItem.amount),
        pendingAmount: ans,
        transactionType: savedTxnData.transactionType,
        transactionSubType: savedTxnData.transactionSubType,
        studentId: savedTxnData.studentId,
        studentRegId: savedTxnData.studentRegId,
        studentName: savedTxnData.studentName,
        academicYear: savedTxnData.academicYear,
        class: savedTxnData.class,
        programPlan: savedTxnData.programPlan,
        campusId: savedTxnData.campusId,
        status: status,
      };
      let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
      ledgerResponse = await feesLedgerModel.save();
      ledgerIds.push(ledgerResponse._id);
    }
  } // for
  return ledgerIds;
} // insertFeesPaymentLedgerEntries
//jounrey entry
async function journeyEntry(
  inputData,
  txnData,
  ledgerData,
  journeyModel,
  totalPendingAmount
) {
  let primary;
  if (txnData.relatedTransactions.length == 0) {
    primary = "";
  } else {
    primary = txnData.relatedTransactions[0];
  }
  let journeyData = {
    primaryCoaCode: inputData.studentId,
    primaryTransaction: primary,
    transaction: txnData.displayName,
    transactionDate: txnData.transactionDate,
    ledgerId: ledgerData,
    creditAmount: 0,
    debitAmount: inputData.amount,
    pendingAmount: totalPendingAmount,
    campusId: inputData.campusId,
  };
  console.log("journet Data", journeyData);
  let journeyLedgerData = new journeyModel(journeyData);
  journeyResponse = await journeyLedgerData.save();
  console.log("journyData", journeyResponse);
  return journeyResponse;
}

//updateFeeplan
async function updateFeePlan(inputData, txnData, ledgerData, feePlanModel) {
  let studentFeesDetails = await feePlanModel.findOne({
    studentRegId: txnData.studentRegId,
  });
  if (studentFeesDetails == null || studentFeesDetails == undefined) {
    console.log("no student fee plan");
    return;
  }

  let pendingAmount =
    Number(studentFeesDetails.pendingAmount) - Number(txnData.amount);
  let totalPaid =
    Number(studentFeesDetails.paidAmount) + Number(txnData.amount);

  for (oneFees of txnData.data.feesBreakUp) {
    // Find item index using _.findIndex (thanks @Muniyaraj for comment)
    var index = _.findIndex(studentFeesDetails.paidAmountBreakup, {
      feeTypeCode: oneFees.feeTypeCode,
    });

    let indexData = studentFeesDetails.paidAmountBreakup[index];

    // Replace item at index using native splice
    studentFeesDetails.paidAmountBreakup.splice(index, 1, {
      amount: Number(indexData.amount) + Number(oneFees.amount),
      feeTypeCode: indexData.feeTypeCode,
      title: indexData.title,
    });
  }

  for (onePending of txnData.data.feesBreakUp) {
    // Find item index using _.findIndex (thanks @Muniyaraj for comment)
    var index = _.findIndex(studentFeesDetails.pendingAmountBreakup, {
      feeTypeCode: onePending.feeTypeCode,
    });

    let indexData = studentFeesDetails.pendingAmountBreakup[index];

    let pendingAm = Number(indexData.amount) - Number(onePending.amount);

    let tot;
    if (Number(pendingAm) < 0) {
      tot = 0;
    } else {
      tot = Number(pendingAm);
    }
    // Replace item at index using native splice
    studentFeesDetails.pendingAmountBreakup.splice(index, 1, {
      amount: tot,
      feeTypeCode: indexData.feeTypeCode,
      title: indexData.title,
    });
  }

  let totalPending;
  if (Number(pendingAmount) < 0) {
    totalPending = 0;
  } else {
    totalPending = pendingAmount;
  }

  let feePlanId = await feePlanModel.findOne({
    studentRegId: txnData.studentRegId,
  });

  let datum = await feePlanModel.updateOne(
    { studentRegId: txnData.studentRegId },
    {
      $set: {
        paidAmount: totalPaid,
        paidAmountBreakup: studentFeesDetails.paidAmountBreakup,
        pendingAmount: totalPending,
        pendingAmountBreakup: studentFeesDetails.pendingAmountBreakup,
      },
    },
    async function (err, resultData) {
      if (resultData.nModified) {
        return feePlanId._id;
      } else {
        return err;
      }
    }
  );

  return feePlanId._id;
}

async function updateInstallmentFeePlan(
  txnData,
  installmentFeePlanModel,
  feePlanId
) {
  //transaction loop
  for (oneBreakUp of txnData.data.feesBreakUp) {
    let oneInstallment = await installmentFeePlanModel.findOne({
      label: String(oneBreakUp.installment),
      feePlanId: feePlanId,
    });
    let oneInstallmentPaid = Number(oneInstallment.paidAmount);
    let oneInstallmentPending = Number(oneInstallment.pendingAmount);
    if (
      Number(oneInstallmentPending) < 0 ||
      Number(oneInstallmentPending) == 0
    ) {
      return { status: "Fee Installment Already Paid" };
    } else {
      let newPaid = Number(oneInstallmentPaid) + Number(oneBreakUp.amount);
      let newPending =
        Number(oneInstallmentPending) - Number(oneBreakUp.amount);
      let status;
      if (Number(newPending) == 0 || Number(newPending) < 0) {
        status = "Paid";
      } else {
        status = "Planned";
      }

      // Find item index using _.findIndex (thanks @Muniyaraj for comment)
      var index = _.findIndex(oneInstallment.paidAmountBreakup, {
        feeTypeCode: oneBreakUp.feeTypeCode,
      });

      let indexData = oneInstallment.paidAmountBreakup[index];

      // Replace item at index using native splice
      oneInstallment.paidAmountBreakup.splice(index, 1, {
        amount: Number(indexData.amount) + Number(oneBreakUp.amount),
        feeTypeCode: indexData.feeTypeCode,
        title: indexData.title,
      });

      // Find item index using _.findIndex (thanks @Muniyaraj for comment)
      var index1 = _.findIndex(oneInstallment.pendingAmountBreakup, {
        feeTypeCode: oneBreakUp.feeTypeCode,
      });

      let indexData1 = oneInstallment.pendingAmountBreakup[index1];

      // Replace item at index using native splice
      oneInstallment.pendingAmountBreakup.splice(index, 1, {
        amount: Number(indexData1.amount) - Number(oneBreakUp.amount),
        feeTypeCode: indexData1.feeTypeCode,
        title: indexData1.title,
      });

      installmentFeePlanModel.updateOne(
        { _id: oneInstallment._id },
        {
          $set: {
            paidAmount: newPaid,
            pendingAmount: newPending,
            status: status,
            paidAmountBreakup: oneInstallment.paidAmountBreakup,
            pendingAmountBreakup: oneInstallment.pendingAmountBreakup,
          },
        },
        async function (err, resultData) {
          if (resultData.nModified) {
            console.log("updated installment successfully", resultData);
          } else {
            console.log("nothing updated", err);
          }
        }
      );
    }
  }
}
