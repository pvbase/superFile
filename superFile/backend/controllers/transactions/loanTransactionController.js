var _ = require("lodash");
const axios = require("axios");
const rq = require("request-promise");
const { createDatabase } = require("../../utils/db_creation");
const { BlobServiceClient } = require("@azure/storage-blob");
const { generateQrCode } = require("../qrCodeController");
var uuid = require("uuid");
const moment = require("moment");
const orgListSchema = require("../../models/orglists-schema");
const StudentSchema = require("../../models/studentModel");
const transactionsSchema = require("../../models/transactionsModel");
const FeeStructureSchema = require("../../models/feeStructureModel");
const FeeManagerSchema = require("../../models/feesManagerModel");
const settingsSchema = require("../../models/settings/feesetting");
const GuardianSchema = require("../../models/guardianModel");
const feesLedgerSchema = require("../../models/feesLedgerModel");
const programPlanSchema = require("../../models/programPlanModel");
const feeplanschema = require("../../models/feeplanModel");
const campusSchema = require("../../models/campusModel");
const journeysSchema = require("../../models/journeyModel");
const feeplanInstallmentschema = require("../../models/feeplanInstallment");
const mongoose = require("mongoose");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");
const FeeTypeSchema = require("../../models/feeTypeModel");
const { sendEmail } = require("../emailController");
const {
  receiptVkgiPdf,
  receiptVkgiTemplate,
} = require("../../utils/helper_functions/templates/vkgiReceiptTemplate");

module.exports.createLoanLedger = async (req, res) => {
  let inputData = req.body;
  let orgId = req.query.orgId;
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
    _id: orgId,
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(500).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    centralDbConnection.close();
    let result = [];
    for (one of inputData) {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );

      let transactionModel = dbConnection.model(
        "transactions",
        transactionsSchema
      );

      let guardianModel = dbConnection.model("guardians", GuardianSchema);

      let programPlanModel = dbConnection.model(
        "programplans",
        programPlanSchema
      );
      let feeMapModel = dbConnection.model(
        "studentfeesmaps",
        StudentFeeMapSchema
      );
      let settingsModel = dbConnection.model("settings", settingsSchema);
      let studentModel = dbConnection.model("students", StudentSchema);
      let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
      let installFeePlanModel = dbConnection.model(
        "studentfeeinstallmentplans",
        feeplanInstallmentschema
      );
      let id = one["student registration id"];

      let studentDetails = await studentModel.findOne({
        regId: id,
      });
      if (!studentDetails) {
        var obj = {
          success: false,
          Message: `Invalid Student Registration Id ${id}`,
        };
        result.push(obj);
        dbConnection.close();
      } else {
        let studentFeeMapDetails = await feeMapModel.findOne({
          studentId: studentDetails._id,
        });
        let programPlanDetails = await programPlanModel.findOne({
          _id: studentDetails.programPlanId,
        });
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
          var obj = {
            success: false,
            Message: `Already Paid Full Payment for the student registration ID : ${id}`,
          };
          result.push(obj);
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
            demandNoteId = transactionDetails.displayName;
          }
          let settingsDetails = await settingsModel.find({});
          let loanExtraAmount =
            Number(feePlanData.plannedAmount) - Number(one["loan amount"]);
          let installmentPlanData = await installFeePlanModel.find({
            feePlanId: feePlanData._id,
          });
          let feesBreak = [];
          var totalLoan = Number(one["loan amount"]);
          for (oneInsta of installmentPlanData) {
            if (oneInsta.status.toLowerCase() !== "paid") {
              let payAmnt;
              if (Number(oneInsta.plannedAmount) <= Number(totalLoan)) {
                payAmnt = oneInsta.plannedAmount;
              } else {
                payAmnt = Number(totalLoan);
              }
              totalLoan = Number(totalLoan) - Number(payAmnt);
              let paid = Number(oneInsta.paidAmount) + Number(payAmnt);
              let pending = Number(oneInsta.pendingAmount) - Number(payAmnt);
              let allPending;
              if (Number(pending) < 0) {
                allPending = 0;
              } else {
                allPending = pending;
              }
              let feesBreakup;
              if (Number(allPending) > 0) {
                feesBreakup = {
                  amount: oneInsta.plannedAmount,
                  paid: oneInsta.plannedAmount,
                  pending: 0,
                  feeTypeCode: oneInsta.plannedAmountBreakup[0].feeTypeCode,
                  title: oneInsta.plannedAmountBreakup[0].title,
                  installment: oneInsta.label,
                  loanProcess: true,
                  instituteCharge: loanExtraAmount,
                };
                feesBreak.push(feesBreakup);
              } else {
                feesBreakup = {
                  amount: payAmnt,
                  paid: paid,
                  pending: allPending,
                  feeTypeCode: oneInsta.plannedAmountBreakup[0].feeTypeCode,
                  title: oneInsta.plannedAmountBreakup[0].title,
                  installment: oneInsta.label,
                  loanProcess: false,
                  instituteCharge: loanExtraAmount,
                };
                feesBreak.push(feesBreakup);
              }
            }
          }
          var rcptId = await getDisplayId(dbConnection);
          let pedingAMount =
            Number(feePlanData.pendingAmount) -
            Number(feePlanData.plannedAmount);
          let PendingAmount;
          if (Number(pedingAMount) == 0 || Number(pedingAMount) < 0) {
            PendingAmount = 0;
          } else {
            PendingAmount = pedingAMount;
          }
          let passData = {
            displayName: rcptId,
            transactionDate: one["date of receipt"],
            relatedTransactions: [],
            transactionType: "eduFees",
            transactionSubType: "feePayment",
            studentId: studentDetails._id,
            emailCommunicationRefIds: studentDetails.email,
            studentName:
              studentDetails.firstName + " " + studentDetails.lastName,
            class: programPlanDetails.title,
            academicYear: programPlanDetails.academicYear,
            amount: feePlanData.plannedAmount,
            studentRegId: studentDetails.regId,
            receiptNo: rcptId,
            programPlan: studentDetails.programPlanId,
            data: {
              loanDetails: {
                dateOfPayment: one["date of receipt"],
                provider: one["loan provider"],
                chequeNumber: one["dd/cheque number"],
                chequeBank: one["cheque/dd issued bank"],
                branch: one["branch"],
                instituteBankName: one["institute bank name"],
                instituteAccNumber: one["institute bank account number"],
              },
              orgId: orgId,
              displayName: rcptId,
              transactionType: "eduFees",
              transactionSubType: "feePayment",
              provider: one["loan provider"],
              mode: "Loan",
              method: one["mode of payment"],
              modeDetails: {
                netBankingType: one["mode of payment"],
                walletType: one["mode of payment"],
                instrumentNo: one["utr number"],
                instrumentDate: one["date of receipt"],
                bankName: one["institute bank name"],
                cardDetails: {
                  cardType: null,
                  nameOnCard: null,
                  cardNumber: null,
                },
                branchName: one["branch"],
                transactionId: one["utr number"],
                remarks: "Payment from loan provider",
              },
              feesBreakUp: feesBreak,
            },
            paymentTransactionId: one["utr number"],
            receiptStatus: "",
            currency: "INR",
            currencyAmount: feePlanData.plannedAmount,
            exchangeRate: feePlanData.plannedAmount,
            userName: studentDetails.firstName + " " + studentDetails.lastName,
            createdBy: studentDetails.createdBy,
            updatedBy: studentDetails.createdBy,
            campusId: studentDetails.campusId,
            status: "Paid",
            type: "receipt",
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
            let feeTypeModel = dbConnection1.model("feetypes", FeeTypeSchema);
            let TxnModel = dbConnection1.model(
              "transactions",
              transactionsSchema
            );

            let feMapDe = await feeMapModel.findOne({
              studentId: studentDetails._id,
            });
            let feeStructureDetails = await feeStructureModel.findOne({
              _id: feMapDe.feeStructureId,
            });

            let paidA = Number(feMapDe.paid) + Number(one["loan amount"]);

            let pendingAmountTotal = Number(feMapDe.amount) - Number(paidA);

            let updateFeeMap = await feeMapModel.updateOne(
              { displayName: feMapDe.displayName },
              {
                $set: {
                  paid: Number(feMapDe.amount),
                  pending: 0,
                },
              }
            );
            if (updateFeeMap.nModified) {
              // var obj = {
              //   success: true,
              //   studentId: id,
              //   Message: createDemand.message,
              // };
              // result.push(obj);
              // dbConnection1.close();
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
              let feeTypeModel = dbConnection1.model("feetypes", FeeTypeSchema);
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
              let campusModel = dbConnection1.model("campuses", campusSchema);
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
                  contact: allC.instituteContact[0].phoneNumber,
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
                studentRegId: passData.studentRegId,
              });
              let feePlanId = mongoose.Types.ObjectId(feePlanData._doc._id);
              let installmentPlanData = await installFeePlanModel.find({
                feePlanId: feePlanId,
              });
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
                    totalDue: Number(singleFee.paid),
                    paidAmount: Number(singleFee.paid),
                    mode: passData.data.method,
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
                  let getDate = `${
                    String(ts.getDate()).length == 1
                      ? `0${ts.getDate()}`
                      : ts.getDate()
                  }`;
                  let getMonth = `${
                    String(ts.getMonth() + 1).length == 1
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
              var allMaildata = {
                transactionId: one["utr number"],
                studentName: demandNoteData.studentName,
                campus: allCampus,
              };
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
                "Receipt",
                passData.paymentTransactionId,
                feeDetails
              );
              let obje = {
                html: successReceipt,
              };
              let createPdf = await axios.post(
                process.env.externalServer,
                obje
              );
              const containerName = process.env.containerName;
              let blobName = createPdf.data.data;
              const blobServiceClient = BlobServiceClient.fromConnectionString(
                process.env.AZURE_STORAGE_CONNECTION_STRING
              );
              const containerClient =
                blobServiceClient.getContainerClient(containerName);
              const blobClient = await containerClient.getBlobClient(blobName);
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
                passData.type,
                qrCod,
                minUrl,
                statementTableHeader,
                statement,
                "Receipt",
                passData.paymentTransactionId,
                feeDetails
              );
              let obje1 = {
                html: successReceipt1,
              };
              //second receipt start
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
              //second receipt end
              dbConnection1.close();
              let title;
              if (passData.type == "receipt") {
                title = "NCFE-Receipt";
              } else {
                title = "NCFE-Acknowledgement";
              }
              let sendMail = await sendEmail(
                orgDetails.emailServer[0].emailServer,
                passData.emailCommunicationRefIds,
                orgDetails.emailServer[0].emailAddress,
                title,
                emailTemplate1,
                createPdf1.data.file,
                "vkgi"
              );
              console.log(sendMail);
              dbConnection1.close();
              let resObj = {
                success: true,
                message: "Receipt sent successfully",
                data: createDemand,
                receiptKey: createPdf.data.data,
                receiptId: rcptId,
              };
              result.push(resObj);
              sendEmail(
                orgDetails.emailServer[0].emailServer,
                passData.emailCommunicationRefIds,
                orgDetails.emailServer[0].emailAddress,
                title,
                emailTemplate1,
                createPdf1.data.file,
                "vkgi"
              )
                .then((data) => {
                  dbConnection1.close();
                  let obj = {
                    success: true,
                    message: "Receipt sent successfully",
                    receiptKey: createPdf.data.data,
                    receiptId: rcptId,
                  };
                  result.push(obj);
                })
                .catch((err) => {
                  dbConnection1.close();
                  let obj = {
                    success: false,
                    message: "failed to send receipt email",
                    data: err,
                  };
                  result.push(obj);
                });
              //if condition ending
            } else {
              var obj = {
                success: false,
                studentId: id,
                Message: createDemand.message,
              };
              result.push(obj);
              dbConnection1.close();
            }
          } else {
            dbConnection.close();
            var obj = {
              success: false,
              Message: `Unable to make the payment for the student registration ID ${studentDetails.regId}`,
            };
            result.push(obj);
          }
        }
      }
    }

    let faileds = [];
    let successs = [];
    for (oneRes of result) {
      if (oneRes.success == false) {
        let obj = {
          message: oneRes,
          status: "failed",
        };
        faileds.push(obj);
      } else if (oneRes.success == true) {
        let obj = {
          message: oneRes,
          status: "success",
        };
        successs.push(obj);
      }
    }
    if (faileds.length > 0) {
      let failure = {
        count: faileds.length,
        success: false,
        faileds,
      };
      let success = {
        count: successs.length,
        success: true,
        successs,
      };
      res.status(400).json({ success, failure });
    } else {
      let failure = {
        count: faileds.length,
        success: false,
        faileds,
      };
      let success = {
        count: successs.length,
        success: true,
        successs,
      };
      res.status(200).json({ success, failure });
    }

    // if (result) {

    // } else {
    //   res.status(200).json(result);
    // }
  }
};

module.exports.createSingleLoan = async (req, res) => {
  let inputData = req.body;
  let orgId = req.query.orgId;
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
    _id: orgId,
  });
  if (!orgData || orgData == null) {
    centralDbConnection.close();
    res.status(404).send({
      status: "failure",
      message: "Organization not found",
    });
  } else {
    centralDbConnection.close();
    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );

    let transactionModel = dbConnection.model(
      "transactions",
      transactionsSchema
    );

    let guardianModel = dbConnection.model("guardians", GuardianSchema);

    let programPlanModel = dbConnection.model(
      "programplans",
      programPlanSchema
    );
    let feeMapModel = dbConnection.model(
      "studentfeesmaps",
      StudentFeeMapSchema
    );
    let settingsModel = dbConnection.model("settings", settingsSchema);
    let studentModel = dbConnection.model("students", StudentSchema);
    let feePlanModel = dbConnection.model("studentfeeplan", feeplanschema);
    let installFeePlanModel = dbConnection.model(
      "studentfeeinstallmentplans",
      feeplanInstallmentschema
    );
    let id = inputData.studentRegId;

    let studentDetails = await studentModel.findOne({
      regId: id,
    });
    if (!studentDetails) {
      var obj = {
        success: false,
        Message: `Invalid Student Registration Id ${id}`,
      };
      res.status(404).json(obj);
      dbConnection.close();
    } else {
      let studentFeeMapDetails = await feeMapModel.findOne({
        studentId: studentDetails._id,
      });
      let programPlanDetails = await programPlanModel.findOne({
        _id: studentDetails.programPlanId,
      });
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
        var obj = {
          success: false,
          Message: `Already Paid Full Payment for the student registration ID : ${id}`,
        };
        res.status(400).json(obj);
      } else {
        var transactionDetails = await transactionModel.find({
          $or: [{ status: "Pending" }, { status: "Partial" }],
          studentRegId: studentDetails.regId,
          transactionSubType: "demandNote",
        });
        var demandNoteId;
        if (transactionDetails.length == 0) {
          demandNoteId = [];
        } else {
          demandNoteId = transactionDetails.displayName;
        }
        let settingsDetails = await settingsModel.find({});
        let loanExtraAmount =
          Number(feePlanData.plannedAmount) - Number(inputData.loanAmount);
        let installmentPlanData = await installFeePlanModel.find({
          feePlanId: feePlanData._id,
        });
        let feesBreak = [];
        var totalLoan = Number(inputData.loanAmount);
        for (oneInsta of installmentPlanData) {
          if (oneInsta.status.toLowerCase() !== "paid") {
            let payAmnt;
            if (Number(oneInsta.plannedAmount) <= Number(totalLoan)) {
              payAmnt = oneInsta.plannedAmount;
            } else {
              payAmnt = Number(totalLoan);
            }
            totalLoan = Number(totalLoan) - Number(payAmnt);
            let paid = Number(oneInsta.paidAmount) + Number(payAmnt);
            let pending = Number(oneInsta.pendingAmount) - Number(payAmnt);
            let allPending;
            if (Number(pending) < 0) {
              allPending = 0;
            } else {
              allPending = pending;
            }
            let feesBreakup;
            if (Number(allPending) > 0) {
              feesBreakup = {
                amount: oneInsta.plannedAmount,
                paid: oneInsta.plannedAmount,
                pending: 0,
                feeTypeCode: oneInsta.plannedAmountBreakup[0].feeTypeCode,
                title: oneInsta.plannedAmountBreakup[0].title,
                installment: oneInsta.label,
                loanProcess: true,
                instituteCharge: loanExtraAmount,
              };
              feesBreak.push(feesBreakup);
            } else {
              feesBreakup = {
                amount: payAmnt,
                paid: paid,
                pending: allPending,
                feeTypeCode: oneInsta.plannedAmountBreakup[0].feeTypeCode,
                title: oneInsta.plannedAmountBreakup[0].title,
                installment: oneInsta.label,
                loanProcess: false,
                instituteCharge: loanExtraAmount,
              };
              feesBreak.push(feesBreakup);
            }
          }
        }
        var rcptId = await getDisplayId(dbConnection);
        let pedingAMount =
          Number(feePlanData.pendingAmount) - Number(feePlanData.plannedAmount);
        let PendingAmount;
        if (Number(pedingAMount) == 0 || Number(pedingAMount) < 0) {
          PendingAmount = 0;
        } else {
          PendingAmount = pedingAMount;
        }
        let passData = {
          displayName: rcptId,
          transactionDate: inputData.dateOfReceipt,
          relatedTransactions: [],
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          studentId: studentDetails._id,
          emailCommunicationRefIds: studentDetails.email,
          studentName: studentDetails.firstName + " " + studentDetails.lastName,
          class: programPlanDetails.title,
          academicYear: programPlanDetails.academicYear,
          amount: feePlanData.plannedAmount,
          studentRegId: studentDetails.regId,
          receiptNo: rcptId,
          programPlan: studentDetails.programPlanId,
          data: {
            loanDetails: {
              dateOfReceipt: inputData.dateOfReceipt,
              provider: inputData.loanProvider,
              chequeNumber: inputData.chequeNumber,
              chequeBank: inputData.chequeBank,
              branch: inputData.branch,
              instituteBankName: inputData.instituteBankName,
              instituteAccNumber: inputData.instituteBankAccountNumber,
            },
            orgId: orgId,
            displayName: rcptId,
            transactionType: "eduFees",
            transactionSubType: "feePayment",
            provider: inputData.loanProvider,
            mode: "Loan",
            method: inputData.mode,
            modeDetails: {
              netBankingType: inputData.mode,
              walletType: inputData.mode,
              instrumentNo: inputData.utrNumber,
              instrumentDate: inputData.dateOfReceipt,
              bankName: inputData.instituteBankName,
              cardDetails: {
                cardType: null,
                nameOnCard: null,
                cardNumber: null,
              },
              branchName: inputData.branch,
              transactionId: inputData.utrNumber,
              remarks: "Payment from loan provider",
            },
            feesBreakUp: feesBreak,
          },
          paymentTransactionId: inputData.utrNumber,
          receiptStatus: "",
          currency: "INR",
          currencyAmount: feePlanData.plannedAmount,
          exchangeRate: feePlanData.plannedAmount,
          userName: studentDetails.firstName + " " + studentDetails.lastName,
          createdBy: studentDetails.createdBy,
          updatedBy: studentDetails.createdBy,
          campusId: studentDetails.campusId,
          status: "Paid",
          type: "receipt",
          previousPaid: feePlanData.paidAmount,
          pendingAmount: PendingAmount,
        };

        let createDemand = await ledgerEntry({ body: passData }, dbConnection);
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
          let feeTypeModel = dbConnection1.model("feetypes", FeeTypeSchema);
          let TxnModel = dbConnection1.model(
            "transactions",
            transactionsSchema
          );

          let feMapDe = await feeMapModel.findOne({
            studentId: studentDetails._id,
          });
          let feeStructureDetails = await feeStructureModel.findOne({
            _id: feMapDe.feeStructureId,
          });

          let paidA = Number(feMapDe.paid) + Number(passData.amount);

          let pendingAmountTotal = Number(feMapDe.amount) - Number(paidA);

          let updateFeeMap = await feeMapModel.updateOne(
            { displayName: feMapDe.displayName },
            {
              $set: {
                paid: Number(feMapDe.amount),
                pending: 0,
              },
            }
          );
          if (updateFeeMap.nModified) {
            // var obj = {
            //   success: true,
            //   studentId: id,
            //   Message: createDemand.message,
            // };
            // result.push(obj);
            // dbConnection1.close();
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
            let feeTypeModel = dbConnection1.model("feetypes", FeeTypeSchema);
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
            let campusModel = dbConnection1.model("campuses", campusSchema);
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
                contact: allC.instituteContact[0].phoneNumber,
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
              studentRegId: passData.studentRegId,
            });
            let feePlanId = mongoose.Types.ObjectId(feePlanData._doc._id);
            let installmentPlanData = await installFeePlanModel.find({
              feePlanId: feePlanId,
            });
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
                  totalDue: Number(singleFee.paid),
                  paidAmount: Number(singleFee.paid),
                  mode: passData.data.method,
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
                let getDate = `${
                  String(ts.getDate()).length == 1
                    ? `0${ts.getDate()}`
                    : ts.getDate()
                }`;
                let getMonth = `${
                  String(ts.getMonth() + 1).length == 1
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
            var allMaildata = {
              transactionId: inputData.utrNumber,
              studentName: demandNoteData.studentName,
              campus: allCampus,
            };

            let titlereceipt = "Receipt";
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
              "Receipt",
              inputData.utrNumber,
              feeDetails
            );
            let obje = {
              html: successReceipt,
            };
            let createPdf = await axios.post(process.env.externalServer, obje);
            const containerName = process.env.containerName;
            let blobName = createPdf.data.data;
            const blobServiceClient = BlobServiceClient.fromConnectionString(
              process.env.AZURE_STORAGE_CONNECTION_STRING
            );
            const containerClient =
              blobServiceClient.getContainerClient(containerName);
            const blobClient = await containerClient.getBlobClient(blobName);
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
              passData.type,
              qrCod,
              minUrl,
              statementTableHeader,
              statement,
              "Receipt",
              inputData.utrNumber,
              feeDetails
            );
            let obje1 = {
              html: successReceipt1,
            };
            //second receipt start
            let createPdf1 = await axios.post(
              process.env.externalServer,
              obje1
            );
            let blobName1 = createPdf1.data.data;
            const blobClient1 = await containerClient.getBlobClient(blobName1);
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
            if (passData.type == "receipt") {
              title = "NCFE-Receipt";
            } else {
              title = "NCFE-Acknowledgement";
            }
            sendEmail(
              orgDetails.emailServer[0].emailServer,
              passData.emailCommunicationRefIds,
              orgDetails.emailServer[0].emailAddress,
              title,
              emailTemplate1,
              createPdf1.data.file,
              "vkgi"
            )
              .then((data) => {
                dbConnection1.close();
                let obj = {
                  success: true,
                  message: "Receipt sent successfully",
                  data: createDemand,
                  receiptKey: createPdf.data.data,
                  receiptId: rcptId,
                };
                res.status(200).json(obj);
              })
              .catch((err) => {
                dbConnection1.close();
                let obj = {
                  success: false,
                  message: "failed to send receipt email",
                  data: err,
                };
                res.status(400).json(obj);
              });
            //if condition ending
          } else {
            var obj = {
              success: false,
              studentId: id,
              Message: createDemand.message,
            };
            res.status(400).json(obj);
            dbConnection1.close();
          }
        } else {
          dbConnection.close();
          var obj = {
            success: false,
            Message: `Unable to make the payment for the student registration ID ${studentDetails.regId}`,
            Error: createDemand,
          };
          res.status(400).json(obj);
        }
      }
    }
  }
};

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

async function ledgerEntry(req, dbConnection) {
  let txnData = req.body;
  checkTransactionPayload(txnData);
  transactionSubType = txnData.transactionSubType;
  let TxnModel = dbConnection.model("transactions", transactionsSchema);
  let FeesLedgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
  let journeyModel = dbConnection.model("journeys", journeysSchema);
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
  var journeysData;
  var feePlanData;
  var installmentFeePlan;
  try {
    let studentFeesDetails = await feeMapModel.findOne({
      studentId: txnData.studentId,
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
      studentFeesDetails.pending
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
    await TxnModel.findByIdAndUpdate(
      { _id: savedTxnData._id },
      { feesLedgerIds: ledgerIds, status: "Paid" }
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
  let totalPendingAmount = studentFeeDetails.pending;

  var ledgerIds = [];
  var pending = Number(totalPendingAmount);
  for (feeItem of savedTxnData.data.feesBreakUp) {
    pending = Number(pending) - Number(feeItem.amount);
    var ans;
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
  if (Number(savedTxnData.data.feesBreakUp[0].instituteCharge) > 0) {
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
      paidAmount: Number(savedTxnData.data.feesBreakUp[0].instituteCharge),
      pendingAmount: ans,
      transactionType: savedTxnData.transactionType,
      transactionSubType: "Loan",
      studentId: savedTxnData.studentId,
      studentRegId: savedTxnData.studentRegId,
      studentName: savedTxnData.studentName,
      academicYear: savedTxnData.academicYear,
      class: savedTxnData.class,
      programPlan: savedTxnData.programPlan,
      campusId: savedTxnData.campusId,
      status: "LoanProcessing",
    };
    let feesLedgerModel = new FeesLedgerModel(feesLedgerData);
    ledgerResponse = await feesLedgerModel.save();
    ledgerIds.push(ledgerResponse._id);
  }
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
  let journeyLedgerData = new journeyModel(journeyData);
  journeyResponse = await journeyLedgerData.save();
  return journeyResponse;
}

//updateFeeplan
async function updateFeePlan(inputData, txnData, ledgerData, feePlanModel) {
  let studentFeesDetails = await feePlanModel.findOne({
    studentRegId: txnData.studentRegId,
  });
  if (studentFeesDetails == null || studentFeesDetails == undefined) {
    return;
  }

  // let pendingAmount =
  //   Number(studentFeesDetails.pendingAmount) - Number(txnData.amount);
  let pendingAmount = 0;
  let totalPaid = Number(studentFeesDetails.plannedAmount);

  for (oneFees of txnData.data.feesBreakUp) {
    // Find item index using _.findIndex (thanks @Muniyaraj for comment)
    var index = _.findIndex(studentFeesDetails.paidAmountBreakup, {
      feeTypeCode: oneFees.feeTypeCode,
    });

    let indexData = studentFeesDetails.paidAmountBreakup[index];

    // Replace item at index using native splice
    studentFeesDetails.paidAmountBreakup.splice(index, 1, {
      amount: Number(studentFeesDetails.plannedAmount),
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
      amount: 0,
      feeTypeCode: indexData.feeTypeCode,
      title: indexData.title,
    });
  }

  let totalPending = 0;
  // if (Number(pendingAmount) < 0) {
  //   totalPending = 0;
  // } else {
  //   totalPending = pendingAmount;
  // }

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
      let newPaid = Number(oneInstallmentPaid) + Number(oneBreakUp.paid);
      let newPending =
        Number(oneInstallmentPending) - Number(oneBreakUp.amount);
      let status;
      if (Number(newPending) == 0 || Number(newPending) < 0) {
        status = "Paid";
      } else {
        status = "Planned";
      }
      let paidBreak = [
        {
          amount: newPaid,
          feeTypeCode: oneInstallment.paidAmountBreakup[0].feeTypeCode,
          title: oneInstallment.paidAmountBreakup[0].title,
        },
      ];
      let pendingBreak = [
        {
          amount: newPending,
          feeTypeCode: oneInstallment.paidAmountBreakup[0].feeTypeCode,
          title: oneInstallment.paidAmountBreakup[0].title,
        },
      ];

      installmentFeePlanModel.updateOne(
        { _id: oneInstallment._id },
        {
          $set: {
            paidAmount: newPaid,
            pendingAmount: newPending,
            status: status,
            paidAmountBreakup: paidBreak,
            pendingAmountBreakup: pendingBreak,
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
  // } catch (err) {
  //   return { status: "Fee Installment Insert Failed" };
  // }
}
