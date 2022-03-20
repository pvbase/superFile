const rq = require("request-promise");
const axios = require("axios");
const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const PaytmChecksum = require("../PaytmChecksum");
var uuid = require("uuid");
const ApplicationSchema = require("../../models/ken42/applicationModel");
const RegistrationSchema = require("../../models/registrationModel")
const orgListSchema = require("../../models/orglists-schema");
const { createDatabase } = require("../../utils/db_creation");
const settingsSchema = require("../../models/settings-model");
const moment = require("moment");

exports.createApplication = async function (req, res) {
  let inputData = req.body;
  if (
    !inputData.name ||
    !inputData.email ||
    !inputData.mobile ||
    !inputData.amount ||
    !inputData.paisa ||
    !inputData.applicationId ||
    !inputData.callBackUrl ||
    !inputData.currencyCode ||
    !inputData.programPlan
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
    const orgData = await orgListModel.findOne({ _id: req.query.orgId });

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
          ORDER_ID: inputData.applicationId,
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
              applicationId: inputData.applicationId,
              amount: Number(inputData.amount),
              paisa: Number(inputData.paisa),
              partial: inputData.accept_partial,
              programPlan: inputData.programPlan,
              callBackUrl: inputData.callBackUrl,
              currencyCode: inputData.currencyCode,
              paymentId: "",
              gatewayType: "paytm",
              razorpay: paytmParams,
              applicationType:
                inputData.applicationType == undefined
                  ? "Admission"
                  : inputData.applicationType,
            });
            appDetails.save(function (err, applicationDetails) {
              if (err) {
                dbConnection.close();
                if (err.code == 11000) {
                  return res.status(400).json({
                    message: "Already applied for this Application",
                    type: "error",
                    data: err,
                  });
                } else {
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
                  applicationId: inputData.applicationId,
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
            console.log("errror", error);
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
        const credentialData = await credentialsModel.findOne({
          type: "payment",
        });

        var username = credentialData._doc.userName;
        var password = credentialData._doc.password;
        var auth =
          "Basic " + Buffer.from(username + ":" + password).toString("base64");
        let amount =
          inputData.amount +
          inputData.paisa +
          (inputData.paisa.length == 1 ? "0" : "");
        console.log("payload amount***", amount);
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
            description: "Payment for " + inputData.applicationId,
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
            callback_url:
              inputData.callBackUrl +
              "?applicationId=" +
              inputData.applicationId,
            callback_method: "get",
          };
        } else {
          obj = {
            amount: parseInt(amount),
            currency: inputData.currencyCode,
            accept_partial: inputData.accept_partial,
            expire_by: today,
            reference_id: uniqueId,
            description: "Payment for " + inputData.applicationId,
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
            callback_url:
              inputData.callBackUrl +
              "?applicationId=" +
              inputData.applicationId,
            callback_method: "get",
          };
        }
        console.log("payload", obj);
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
            var applicationModel = dbConnection.model(
              "applications",
              ApplicationSchema
            );
            var appDetails = new applicationModel({
              name: inputData.name,
              email: inputData.email,
              mobile: inputData.mobile,
              applicationId: inputData.applicationId,
              amount: Number(inputData.amount),
              paisa: Number(inputData.paisa),
              partial: inputData.accept_partial,
              programPlan: inputData.programPlan,
              batch: inputData.batch,
              paymentId: success.id,
              callBackUrl: inputData.callBackUrl,
              currencyCode: inputData.currencyCode,
              razorpay: success,
              gatewayType: "razorpay",
              status: "submitted",
              webhookStatus: success.status,
              parentName: inputData.parentName,
              razorpayUnique: uniqueId,
              applicationType:
                inputData.applicationType == undefined
                  ? "Admission"
                  : inputData.applicationType,
            });
            appDetails.save(function (err, applicationDetails) {
              if (err) {
                dbConnection.close();
                return res.status(400).json({
                  message: "failed to store application",
                  type: "error",
                  data: err,
                });
              } else {
                dbConnection.close();
                res.status(200).json({
                  success: true,
                  Data: success,
                  applicationId: inputData.applicationId,
                  applicationDetails,
                  paymentGatewayType: "razorpay",
                });
              }
            });
            // res.status(200).json({
            //   success: true,
            //   Data: success,
            //   applicationId: inputData.applicationId,
            // });
          })
          .catch((err) => {
            console.log("errror", err);
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

exports.razorpayPaymentStatus = async function (req, res) {
  let razorpayId = req.params.id;
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
      "Basic " + Buffer.from(username + ":" + password).toString("base64");
    var options = {
      method: "GET",
      uri: "https://api.razorpay.com/v1/payments/" + razorpayId,
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
    };
    rq(options)
      .then((success) => {
        res.status(200).json({
          status: "success",
          Data: success,
        });
        centralDbConnection.close();
        dbConnection.close();
      })
      .catch((err) => {
        res.status(400).json({ Message: "Failed", Error: err });
        centralDbConnection.close();
        dbConnection.close();
        return;
      });
  }
};

exports.sendReceipt = async function (req, res) {
  let inputData = req.body;
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
    if (inputData.gatewayType == "paytm") {
      console.log("entered paytm receipt");
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
      let payload = {
        email: inputData.email,
        academicYear: inputData.academicYear,
        applicationId: inputData.applicationId,
        transactionId: inputData.transactionId,
        studentName: inputData.studentName,
        class: inputData.class,
        applicationFees: parseInt(inputData.applicationFees),
        mode: inputData.mode,
        currencyCode: inputData.currencyCode,
        programPlan: inputData.programPlan,
      };
      axios
        .post(
          process.env.receiptAPI + "?institute=" + req.query.institute,
          payload
        )
        .then(function (response) {
          res.status(200).json(response.data);
        })
        .catch(function (error) {
          res.status(400).json({ Message: "Failed", Error: error });
        });
    } else {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
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
        "Basic " + Buffer.from(username + ":" + password).toString("base64");
      var options = {
        method: "GET",
        uri: process.env.razorpay + "/payments/" + inputData.paymentId,
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
      };
      rq(options)
        .then(async (success) => {
          let responseRazor = JSON.parse(success);
          let method = responseRazor.method;
          var transId;
          if (inputData.currencyCode == "USD") {
            transId = responseRazor.acquirer_data.auth_code;
          } else {
            if (responseRazor.acquirer_data.bank_transaction_id) {
              transId = responseRazor.acquirer_data.bank_transaction_id;
            } else if (responseRazor.acquirer_data.auth_code) {
              transId = responseRazor.acquirer_data.auth_code;
            } else if (responseRazor.acquirer_data.upi_transaction_id) {
              transId = responseRazor.acquirer_data.upi_transaction_id;
            } else if (responseRazor.acquirer_data.rrn) {
              transId = responseRazor.acquirer_data.rrn;
            }
          }
          if (transId == null) {
            transId = inputData.paymentId;
          }
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
            var applicationModel = dbConnection.model(
              "applications",
              ApplicationSchema
            );
            //update
            let updateData = { transactionId: transId, status: "Paid" };
            applicationModel.updateOne(
              { applicationId: inputData.applicationId },
              updateData,
              async function (err, data) {
                if (!err) {
                  let applicationData = await applicationModel.findOne({
                    applicationId: inputData.applicationId,
                  });
                  let feeStatement = [];
                  let receivedAmount = String(
                    applicationData.amount + "." + applicationData.paisa
                  );
                  let newReceiveMoney = "";
                  // if (!String(receivedAmount).includes('.')) {
                  //   newReceiveMoney = Number(receivedAmount) * 100
                  // }
                  // else {
                  let moneyArr = String(receivedAmount).split(".");
                  newReceiveMoney =
                    moneyArr[0] +
                    "." +
                    moneyArr[1] +
                    (moneyArr[1] != null && moneyArr[1].length == 1 ? "0" : "");
                  // }
                  feeStatement.push({
                    date: moment(new Date(applicationData.createdAt)).format(
                      "DD/MM/YYYY"
                    ),
                    name: applicationData.name,
                    applicationId: applicationData.applicationId,
                    course: applicationData.programPlan,
                    batch:
                      applicationData.batch == null
                        ? "-"
                        : applicationData.batch,
                    receivedAmount: Number(newReceiveMoney).toFixed(2),
                    refundAmount: 0.0,
                    totalAmount: Number(newReceiveMoney).toFixed(2),
                  });
                  console.log("updated");
                  let moneyString = inputData.applicationFees;
                  console.log("moneystring", moneyString);
                  let newMoney = "";
                  if (!String(moneyString).includes(".")) {
                    console.log("emnterd if");
                    newMoney = Number(moneyString) * 100;
                    console.log("enterd into if condition", newMoney);
                  } else {
                    console.log("enterd into else condition");
                    let moneyArr = String(moneyString).split(".");
                    newMoney =
                      moneyArr[0] +
                      moneyArr[1] +
                      (moneyArr[1] != null && moneyArr[1].length == 1
                        ? "0"
                        : "");
                    console.log("else passed", newMoney);
                  }
                  console.log(
                    "Application Controller RazorPay Money",
                    parseInt(newMoney)
                  );
                  let payload = {
                    email: inputData.email,
                    academicYear: inputData.academicYear,
                    applicationId: inputData.applicationId,
                    transactionId: transId,
                    studentName: inputData.studentName,
                    class: inputData.class,
                    applicationFees: parseInt(newMoney),
                    mode: method.toUpperCase(),
                    currencyCode: inputData.currencyCode,
                    programPlan: inputData.programPlan,
                    feeStatement: feeStatement,
                    parentName: applicationData.parentName,
                  };
                  axios
                    .post(
                      process.env.receiptAPI +
                      "?institute=" +
                      req.query.institute,
                      payload
                    )
                    .then(function (response) {
                      res.status(200).json(response.data);
                      centralDbConnection.close();
                      dbConnection.close();
                    })
                    .catch(function (error) {
                      centralDbConnection.close();
                      dbConnection.close();
                      res.status(400).json({ Message: "Failed", Error: error });
                    });
                } else {
                  centralDbConnection.close();
                  dbConnection.close();
                  return res.status(400).json({ message: "Application Nothing updated" });
                }
              }
            );
          }
        })
        .catch((err) => {
          res.status(400).json({ Message: "Failed", Error: err });
          return;
        });
    }
  }
};

// exports.deleteStudent = function (req, res) {
//   Role.deleteOne({ _id: req.params.id }).then(function (data) {
//     if (data.deletedCount)
//       return res.json("Role has been deleted successfully");
//     else return res.json({ message: "User does not exist" });
//   });
// };
validEmail = function (email) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return true;
  }
  return false;
};
exports.getRegistrationList = async function (req, res) {
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({ _id: req.query.orgId });

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
    var registrationModel = dbConnection.model(
      "registrations",
      RegistrationSchema
    );
    const registrationData = await registrationModel.find({});
    let paginated = await Paginator(
      registrationData,
      req.query.page,
      req.query.limit
    );
    if (req.query.searchKey != undefined || req.query.searchKey != "") {
      let searchedData = await findSearchData(registrationData, req.query.searchKey);
      let paginated = await Paginator(
        searchedData,
        req.query.page,
        req.query.limit
      );
      res.status(200).json(paginated);
    }
    else {
      res.status(200).json(paginated);
    }
  }
  async function findSearchData(data, srchVal) {
    let searchedVal = [];
    if (data.length == 0) {
    } else {
      data.map((dataOne, i) => {
        if (
          String(dataOne.status).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
          String(dataOne.name).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
          String(dataOne.email).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
          String(dataOne.mobile).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
          String(dataOne.applicationId).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
          String(dataOne.amount).toLowerCase().includes(String(srchVal).toLowerCase()) == true ||
          String(dataOne.currency).toLowerCase().includes(String(srchVal).toLowerCase()) == true
        ) {
          searchedVal.push(dataOne);
        }
        else { }
      });
      return searchedVal;
    }
  }
};
exports.getApplicationList = async function (req, res) {
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({ _id: req.query.orgId });

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
    var applicationModel = dbConnection.model(
      "applications",
      ApplicationSchema
    );

    const registrationData = await applicationModel.find({});
    res.status(200).json({ success: true, data: registrationData });
  }
};





function Paginator(items, page, per_page) {
  let current_page = page;
  let perPage = per_page;
  (offset = (current_page - 1) * perPage),
    (paginatedItems = items.slice(offset).slice(0, perPage)),
    (total_pages = Math.ceil(items.length / perPage));
  return {
    page: Number(current_page),
    perPage: Number(perPage),
    nextPage:
      total_pages > Number(current_page) ? Number(current_page) + 1 : null,
    totalRecord: items.length,
    totalPages: total_pages,
    data: paginatedItems,
    status: "success",
  };
}
