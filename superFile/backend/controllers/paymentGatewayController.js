const PaymentGatewayModel = require("../models/PaymentGatewayModel");
const { createDatabase } = require("../utils/db_creation");
const rq = require("request-promise");
const https = require("https");
const formidable = require("formidable");
const axios = require("axios");
const credentialsModelName = "credentials";
const orgListSchema = require("../models/orglists-schema");
const settingsModelName = "settings";
const mongoose = require("mongoose");
const ApplicationSchema = require("../models/ken42/applicationModel");
const userSettings = require("../utils/helper_jsons/settings.json");
const paymentMappingJSON = require("../payloads/paymentPayloads/paymentPayloadMapping.json");
const paymentLinks = require("../payloads/paymentPayloads/paymentLinks.json");
const checksum_lib = require("../config/paytm/checksum");
const config = require("../config/paytm/config");

const PaytmChecksum = require("./PaytmChecksum");

exports.makePayment = async function (reqBody, dbConnection) {
  let credentialSchema = mongoose.Schema({}, { strict: false });
  const credentialsModel = dbConnection.model(
    credentialsModelName,
    credentialSchema,
    credentialsModelName
  );
  const credentialsData = await credentialsModel.findOne({ type: "payment" });
  const settingsModel = dbConnection.model(
    settingsModelName,
    credentialSchema,
    settingsModelName
  );
  const settingsData = await settingsModel.find({});
  const { paymentGateway, smsNotification, enableReminder, emailNotification } =
    settingsData[0]._doc.paymentGateway;
  let reqBodyData = { ...reqBody };
  switch (paymentGateway) {
    case "razorpay":
      try {
        let amount =
          reqBodyData.amount +
          reqBodyData.paisa +
          (reqBodyData.paisa.length == 1 ? "0" : "");

        // const credentials = CryptoJS.AES.decrypt(credentialsData._doc.password, process.env.enc_secret_key).toString(CryptoJS.enc.Utf8);
        const credentials = credentialsData._doc.password;
        let payloadMapper = paymentMappingJSON[paymentGateway];
        reqBodyData = {
          ...reqBodyData,
          amount: Number(amount),
          smsNotification,
          emailNotification,
          enableReminder,
          expirationTimeStamp: Date.now(),
          callbackMethod: "get",
        };
        let payloadData = createPayloadData(reqBodyData, payloadMapper);
        console.log(credentialsData._doc.username, credentials);
        var auth =
          "Basic " +
          Buffer.from(
            credentialsData._doc.userName + ":" + credentials
          ).toString("base64");
        var options = {
          method: "POST",
          uri: paymentLinks[paymentGateway].create,
          body: payloadData,
          json: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: auth,
          },
        };
        return await rq(options)
          .then(async (success) => {
            const paymentModel = dbConnection.model(
              "payments",
              PaymentGatewayModel,
              "payments"
            );
            const paymentData = new paymentModel({
              ...reqBody,
              ...success,
              status: success.status,
              paymentId: success.id,
              amount: Number(reqBody.amount),
            });
            const paymentFinalData = await paymentData.save();
            console.log(paymentFinalData);
            console.log("razorpay response ******", success);
            return success;
          })
          .catch((err) => {
            throw err;
          });
      } catch (e) {
        console.log(e);
        throw e;
      }
      break;
    case "paytm":
      try {
        //end
        // const https = require("https");
        // /*
        //  * import checksum generation utility
        //  * You can get this utility from https://developer.paytm.com/docs/checksum/
        //  */
        // const PaytmChecksum = require("./PaytmChecksum");
        // var paytmParams = {};
        // paytmParams.body = {
        //   mid: process.env.PAYTM_MID,
        //   linkType: "GENERIC",
        //   linkDescription: "Test Payment",
        //   linkName: "Test",
        // };
        // /*
        //  * Generate checksum by parameters we have in body
        //  * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
        //  */
        // return PaytmChecksum.generateSignature(
        //   JSON.stringify(paytmParams.body),
        //   process.env.PAYTM_MERCHANT_KEY
        // ).then(function (checksum) {
        //   console.log("checksum", checksum);
        //   paytmParams.head = {
        //     tokenType: "AES",
        //     signature: checksum,
        //   };
        //   var post_data = JSON.stringify(paytmParams);
        //   console.log("pots", post_data);
        //   var options = {
        //     /* for Staging */
        //     hostname: "securegw-stage.paytm.in",
        //     /* for Production */
        //     // hostname: 'securegw.paytm.in',
        //     port: 443,
        //     path: "/link/create",
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //       "Content-Length": post_data.length,
        //     },
        //   };
        //   var response = "";
        //   var post_req = https.request(options, function (post_res) {
        //     post_res.on("data", function (chunk) {
        //       response += chunk;
        //     });
        //     post_res.on("end", function () {
        //       console.log("res", response);
        //       return response;
        //       console.log("Response: ", response);
        //     });
        //   });
        //   post_req.write(post_data);
        //   post_req.end();
        // });
        // Paytm;
        const { amount, email, mobile } = reqBody;
        /* import checksum generation utility */
        const totalAmount = JSON.stringify(amount);
        var params = {
          MID: process.env.PAYTM_MID,
          WEBSITE: process.env.PAYTM_WEBSITE,
          CHANNEL_ID: process.env.PAYTM_CHANNEL_ID,
          INDUSTRY_TYPE_ID: process.env.PAYTM_INDUSTRY_TYPE_ID,
          ORDER_ID: process.env.stage + new Date().getTime(),
          CUST_ID: "CUST_" + new Date().getTime(),
          TXN_AMOUNT: totalAmount,
          CALLBACK_URL: reqBody.callBackUrl,
          EMAIL: email,
          MOBILE_NO: mobile,
        };
        var paytmChecksum = PaytmChecksum.generateSignature(
          params,
          process.env.PAYTM_MERCHANT_KEY
        );
        return paytmChecksum
          .then(function (checksum) {
            let paytmParams = {
              ...params,
              CHECKSUMHASH: checksum,
            };
            return paytmParams;
          })
          .catch(function (error) {
            return error;
          });
      } catch (e) {
        console.log(e);
        throw e;
      }
      break;
    default:
      throw "payment gateway provider not found";
  }
};

exports.getPaymentStatus = async function (req, res) {
  let razorpayId = req.params.id;
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
    let dbConnection = await createDatabase(
      String(orgData._id),
      orgData.connUri
    );
    let credentialSchema = mongoose.Schema({}, { strict: false });
    const credentialModel = dbConnection.model("credentials", credentialSchema);
    const credentialData = await credentialModel.findOne({ type: "payment" });
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
        dbConnection.close();
        res.status(200).json({
          status: "success",
          Data: success,
        });
      })
      .catch((err) => {
        dbConnection.close();
        res.status(400).json({ Message: "Failed", Error: err });
        return;
      });
  }
};

function createPayloadData(payload, mapper) {
  let payloadData = {};
  function createPayload(data, mapping, key) {
    Object.keys(mapping).forEach((item) => {
      if (typeof mapping[item] == "object") {
        payloadData[item] = {};
        createPayload(data, mapping[item], item);
      } else {
        if (key) payloadData[key][item] = data[mapping[item]];
        else payloadData[item] = data[mapping[item]];
      }
    });
  }
  createPayload(payload, mapper);
  return payloadData;
}

exports.gatewayCallback = async function (req, res) {
  let inputData = req.body;

  let obj = {
    ORDERID: inputData.ORDERID,
    MID: inputData.MID,
    TXNID: inputData.TXNID,
    TXNAMOUNT: inputData.TXNAMOUNT,
    PAYMENTMODE: inputData.PAYMENTMODE,
    CURRENCY: inputData.CURRENCY,
    TXNDATE: inputData.TXNDATE,
    STATUS: inputData.STATUS,
    RESPCODE: inputData.RESPCODE,
    RESPMSG: inputData.RESPMSG,
    GATEWAYNAME: inputData.GATEWAYNAME,
    BANKTXNID: inputData.BANKTXNID,
    BANKNAME: inputData.BANKNAME,
  };
  paytmChecksum = inputData.CHECKSUMHASH;
  var isVerifySignature = PaytmChecksum.verifySignature(
    obj,
    process.env.PAYTM_MERCHANT_KEY,
    paytmChecksum
  );

  console.log(paytmChecksum);

  if (isVerifySignature) {
    var paytmParams = {};
    paytmParams["MID"] = inputData.MID;
    paytmParams["ORDERID"] = inputData.ORDERID;

    /*
     * Generate checksum by parameters we have
     * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
     */

    PaytmChecksum.generateSignature(
      paytmParams,
      process.env.PAYTM_MERCHANT_KEY
    ).then(function (checksum) {
      paytmParams["CHECKSUMHASH"] = checksum;

      var post_data = JSON.stringify(paytmParams);
      console.log("parms", post_data);
      // axios({
      //   method: "post",
      //   url: "/user/12345",
      //   data: post_data,
      // }).then(function (response) {
      //   response.data.pipe(fs.createWriteStream("ada_lovelace.jpg"));
      // });
      var options = {
        method: "POST",
        uri: process.env.PAYTM_URL + "order/status",
        body: post_data,
        port: 443,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };
      rq(options)
        .then(async (success) => {
          let applicationId = inputData.ORDERID;
          let response = JSON.parse(success);
          if (response.STATUS == "TXN_SUCCESS") {
            // console.log("data", uri);
            // var respe = encodeURI(uri);
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
              _id: "5fdc8253e1de5d1f60e1ce43",
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
              // const applicationData = await applicationModel.find({
              //   applicationId: response.ORDERID,
              // });
              var query = {
                status: "paid",
                txnDetails: response,
                paymentId: response.TXNID,
              };

              applicationModel.findOneAndUpdate(
                { applicationId: response.ORDERID },
                query,
                { upsert: true },
                function (err, doc) {
                  if (err) {
                    var uri =
                      "applicationId=" +
                      applicationId +
                      "&paymentId=" +
                      response.TXNID +
                      "&status=success&db=failed&paymentMode=" +
                      response.PAYMENTMODE;
                    return res.redirect(
                      "https://applications.srmuniversity.ac.in/thankyou?" + uri
                    );
                  } else {
                    var uri =
                      "applicationId=" +
                      applicationId +
                      "&paymentId=" +
                      response.TXNID +
                      "&status=success&paymentMode=" +
                      response.PAYMENTMODE;
                    return res.redirect(
                      "https://applications.srmuniversity.ac.in/thankyou?" + uri
                    );
                  }
                }
              );
            }
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
              _id: "5fdc8253e1de5d1f60e1ce43",
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
              var query = { status: "failed", txnDetails: response };

              applicationModel.findOneAndUpdate(
                { applicationId: response.ORDERID },
                query,
                { upsert: true },
                function (err, doc) {
                  if (err) {
                    var uri =
                      "applicationId=" +
                      applicationId +
                      "&paymentId=" +
                      response.TXNID +
                      "&status=failed&db=failed";
                    return res.redirect(
                      "https://applications.srmuniversity.ac.in/thankyou?" + uri
                    );
                  } else {
                    var uri =
                      "applicationId=" +
                      applicationId +
                      "&paymentId=" +
                      response.TXNID +
                      "&status=failed&db=failed";
                    // console.log("data", uri);
                    // var respe = encodeURI(uri);
                    res.redirect(
                      "https://applications.srmuniversity.ac.in/thankyou?" + uri
                    );
                  }
                }
              );
            }
          }
        })
        .catch((err) => {
          res.redirect(
            "https://applications.srmuniversity.ac.in/thankyou?status=failed&message=api-issue"
          );
          // res.status(400).json({ success: true, Error: err });
        });
    });
  } else {
    res.redirect(
      "https://applications.srmuniversity.ac.in/thankyou?status=failed&message=api-issue"
    );
    // res.status(400).json({ success: false, message: "Checksum Mismatched" });
  }
};
