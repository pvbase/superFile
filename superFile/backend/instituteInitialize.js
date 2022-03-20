const mongoose = require("mongoose");
const instituteListSchema = require("./models/instituteList");
const { createConnection } = require("./utils/db_creation");
const orglistsCollectionName = "orglists";
// require('dotenv-flow').config();
const jwt = require("jsonwebtoken");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("ZqSecretKey");
const zqSecretKey = "ZqSecretKey";
var readline = require("readline");
const axios = require("axios");
var CryptoJS = require("crypto-js");
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
async function createInstitute(req, res) {
  try {
    console.log("checking", process.env.resourceUrl);
    // console.log("central db Url", process.env.central_mongoDbUrl, json)
    // const jsonFileName = json ? json : process.argv[process.argv.length - 1];
    // console.log(jsonFileName)
    // const jsonData = require(`./institute-config-jsons/${jsonFileName}`)
    const jsonData = req.body;
    const { user, client, name, clientId, loginClient, code, hedaIds } =
      jsonData;
    let password = "";
    const usersSchema = mongoose.Schema({}, { strict: false });
    if (loginClient && loginClient != "zenqore") {
      password = makePassword(user);
      // password = cryptr.encrypt(password);
      password = CryptoJS.AES.encrypt(zqSecretKey, password).toString();
    }
    const nameSpace = code;
    let resourceData;
    for (let i = 0; i < 100; i++) {
      const resourceItem = await axios.get(
        `${process.env.resourceUrl}?orgId=${nameSpace}&stage=${process.env.stage}`
      );
      let data = resourceItem;
      if (
        data.data &&
        !data.data.connUri.includes("undefined") &&
        !data.data.connUri.toLowerCase().includes("pending")
      ) {
        resourceData = data;
        break;
      }
    }
    // axios.get(`${process.env.resourceUrl}?orgId=${nameSpace}&stage=${process.env.stage}`).then(async data => {
    // console.log(data.data, "inside api call success")
    const centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const usersDbCollection = await createConnection(
      `Zq-EduUser-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const usersModel = usersDbCollection.model(
      `Users_${process.env.stage}`,
      usersSchema,
      `Users_${process.env.stage}`
    );
    const instituteModel = centralDbConnection.model(
      orglistsCollectionName,
      instituteListSchema,
      orglistsCollectionName
    );
    if (
      resourceData.data &&
      !resourceData.data.connUri.includes("undefined") &&
      !resourceData.data.connUri.toLowerCase().includes("pending")
    ) {
      const connUri = resourceData.data.connUri;
      const orgListData = {
        user,
        client,
        name,
        nameSpace,
        connUri,
        clientId,
        loginClient,
        password,
        hedaIds,
      };
      const instituteData = new instituteModel(orgListData);
      instituteData
        .save(orgListData)
        .then(async (result) => {
          const tinyUrlPayload = {
            Url: `${process.env.studentDataPortal}/#/${nameSpace}/${process.env.redirectPortal}`,
          };
          const tinyUri = await axios.post(process.env.tinyUrl, tinyUrlPayload);
          // const emailMessage = {
          //     "contact": user,
          //     "message": `Your infrastructure for fees collection has been setup successfully.Please click here to continue ${tinyUri.data.ShortUrl}`,
          //     "subject": `${client} Fees Collection Portal -Infrastructure setup`
          // }
          const emailMessage = {
            contact: user,
            message: `Your infrastructure for fees collection has been setup successfully.`,
            subject: `${client} Fees Collection Portal -Infrastructure setup`,
          };
          let userData = {
            account_Status: "Invitation Sent",
            inviteUrl: tinyUri.data.ShortUrl,
            role: "Admin",
            register_date: new Date().toLocaleString(),
            userName: user,
          };
          if (loginClient && loginClient != "zenqore") {
            await new usersModel(userData).save();
            await axios.post(process.env.registerUrl, {
              username: user,
              password,
            });
          }
          const emailToUser = await axios.post(
            process.env.smsEmailUrl,
            emailMessage
          );
          res.status(200).send({
            status: "success",
            message: "Infrastructure created successfully!",
          });
          centralDbConnection.close() // new
          // rl.close()
        })
        .catch((err) => {
          console.log(err);
          if (err && err.code && err.code == 11000) {
            console.log("Error Occured: Institute already exists");
            res.status(409).send({
              status: "failure",
              message: "error occured : Institute already exists",
            });
            centralDbConnection.close() // new
          } else {
            console.log("Error Occured: Failed to create the infrastructure");
            res.status(500).send({
              status: "failure",
              message: "error occured : Failed to create infrastructure",
              data: err,
            });
            centralDbConnection.close() // new
          }
          // rl.close()
        })
        .finally((finalRes) => {
          centralDbConnection.close();
        });
    } else {
      console.log("came to else");
      res.status(500).send({
        status: "failure",
        message: "error occured : Failed to create infrastructure",
        data: err,
      });
      centralDbConnection.close() // new
    }
    // rl.close()
    // })
    //     .finally((finalRes) => {
    //       centralDbConnection.close();
    //     });
    // } else {
    //   console.log("came to else");
    //   res.status(500).send({
    //     status: "failure",
    //     message: "error occured : Failed to create infrastructure",
    //   });
    // }
    // }).catch(err => {
    //     if (err.response && err.response.data && err.response.data.message && err.response.data.message.includes("error occured")) {
    //         createInstituteWithoutService(jsonFileName)
    //     }
    //     else {
    //         rl.close()
    //     }
    // }).finally(finalRes => {
    //     // centralDbConnection.close()
    // })
  } catch (e) {
    console.log(e);
    // console.log(e)
    // if (e.code == "MODULE_NOT_FOUND") {

    //     rl.question("Please provide a valid json :", function (jsonValue) {
    //         createInstitute(jsonValue)
    //     })
    // }
    res.status(500).send({
      status: "failure",
      message: "error occured : Failed to create infrastructure",
    });
    centralDbConnection.close() // new
  }
}
async function createInstituteWithoutService(req, res) {
  try {
    console.log("checking", process.env.resourceUrl);
    console.log("central db Url", process.env.central_mongoDbUrl, json);
    const jsonFileName = json ? json : process.argv[process.argv.length - 1];
    console.log(jsonFileName);
    const jsonData = require(`./institute-config-jsons/${jsonFileName}`);
    // const jsonData = req.body;
    const { user, client, name, clientId, loginClient, code, hedaIds } =
      jsonData;
    let password = "";
    const usersSchema = mongoose.Schema({}, { strict: false });
    if (loginClient && loginClient != "zenqore") {
      password = makePassword(user);
      // password = cryptr.encrypt(password);
      password = CryptoJS.AES.encrypt(zqSecretKey, password).toString();
    }
    const nameSpace = code;
    axios
      .get(
        `${process.env.resourceUrl}?orgId=${nameSpace}&stage=${process.env.stage}`
      )
      .then(async (data) => {
        // console.log(data.data, "inside api call success")
        const centralDbConnection = await createDatabase(
          `usermanagement-${process.env.stage}`,
          process.env.central_mongoDbUrl
        );
        const usersDbCollection = await createConnection(
          `Zq-EduUser-${process.env.stage}`,
          process.env.central_mongoDbUrl
        );
        const usersModel = usersDbCollection.model(
          `Users_${process.env.stage}`,
          usersSchema,
          `Users_${process.env.stage}`
        );
        const instituteModel = centralDbConnection.model(
          orglistsCollectionName,
          instituteListSchema,
          orglistsCollectionName
        );
        if (
          data.data &&
          !data.data.connUri.includes("undefined") &&
          !data.data.connUri.toLowerCase().includes("pending")
        ) {
          const connUri = data.data.connUri;
          const orgListData = {
            user,
            client,
            name,
            nameSpace,
            connUri,
            clientId,
            loginClient,
            password,
            hedaIds,
          };
          const instituteData = new instituteModel(orgListData);
          instituteData
            .save(orgListData)
            .then(async (result) => {
              const tinyUrlPayload = {
                Url: `${process.env.studentDataPortal}/#/${nameSpace}/${process.env.redirectPortal}`,
              };
              const tinyUri = await axios.post(
                process.env.tinyUrl,
                tinyUrlPayload
              );
              const emailMessage = {
                contact: user,
                message: `Your infrastructure for fees collection has been setup successfully.Please click here to continue ${tinyUri.data.ShortUrl}`,
                subject: `${client} Fees Collection Portal -Infrastructure setup`,
              };
              let userData = {
                account_Status: "Invitation Sent",
                inviteUrl: tinyUri.data.ShortUrl,
                role: "Admin",
                register_date: new Date().toLocaleString(),
                userName: user,
              };
              if (loginClient && loginClient != "zenqore") {
                await new usersModel(userData).save();
                await axios.post(process.env.registerUrl, {
                  username: user,
                  password,
                });
              }
              const emailToUser = await axios.post(
                process.env.smsEmailUrl,
                emailMessage
              );
              console.log("Infrastructure created successfully!");
              rl.close();
            })
            .catch((err) => {
              console.log(err);
              if (err && err.code && err.code == 11000) {
                console.log("Error Occured: Institute already exists");
              } else {
                console.log(
                  "Error Occured: Failed to create the infrastructure"
                );
              }
              rl.close();
            })
            .finally((finalRes) => {
              centralDbConnection.close();
            });
        } else {
          console.log(
            "Creating an infrastructure for you.This may take few mins, please wait "
          );
          createInstituteWithoutService(jsonFileName);
        }
      })
      .catch((err) => {
        if (
          err.response &&
          err.response.data &&
          err.response.data.message &&
          err.response.data.message.includes("error occured")
        ) {
        } else {
          rl.close();
        }
      })
      .finally((finalRes) => {
        // centralDbConnection.close()
      });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: "unable to setup the institute",
      data: e,
    });
    centralDbConnection.close() // new
  }
}

// createInstituteWithoutService();
function makePassword(string) {
  var result = "";
  var characters = string;
  var charactersLength = characters.length;
  for (var i = 0; i < string.length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// console.log(process.argv)
// console.log(process.env.stage)

module.exports = { createInstitute };
