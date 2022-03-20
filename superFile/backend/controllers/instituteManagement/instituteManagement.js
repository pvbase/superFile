const mongoose = require("mongoose");
const instituteListSchema = require("../../models/instituteList");
const { createConnection, createDatabase } = require("../../utils/db_creation");
const orglistsCollectionName = "orglists";
const jwt = require("jsonwebtoken");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("ZqSecretKey");
const axios = require("axios");
async function createInstitute(req, res) {
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const { user, client, name, clientId, loginClient } = req.body;
  const nameSpace = name
    .match(/\b([A-Z])/g)
    .join("")
    .toLowerCase();
  const instituteModel = centralDbConnection.model(
    orglistsCollectionName,
    instituteListSchema,
    orglistsCollectionName
  );
  axios
    .get(
      `${process.env.resourceUrl}?orgId=${nameSpace}&stage=${process.env.stage}`
    )
    .then(async (data) => {
      console.log(data.data, "inside api call success");
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
        };
        const instituteData = new instituteModel(orgListData);
        instituteData
          .save(orgListData)
          .then((result) => {
            centralDbConnection.close();
            res.status(200).send({
              status: "success",
              message: "Institute created Successfully",
              data: result,
            });
          })
          .catch((err) => {
            centralDbConnection.close();
            console.log(err);
            res.status(500).send({
              status: "failed",
              message: "Unable to add institute Details",
              data: err,
            });
          });
      } else {
        centralDbConnection.close();
        console.log(data);
        res.status(500).send({
          status: "failed",
          message: "Unable to connect to the server",
          data: err,
        });
      }
    })
    .catch((err) => {
      centralDbConnection.close();
      console.log(err, "org creation error");
      res.status(500).send({
        status: "failed",
        message: "Unable to connect to the server",
        data: err,
      });
    })
    .finally((finalRes) => {
      // centralDbConnection.close()
    });
}

async function getClientDetails(req, res) {
  const { nameSpace } = req.query;
  if (!nameSpace || !nameSpace.length) {
    res.status(500).send({
      status: "failed",
      message: "please provide valid namespace",
    });
    return;
  }
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const instituteModel = centralDbConnection.model(
    orglistsCollectionName,
    instituteListSchema,
    orglistsCollectionName
  );
  instituteModel
    .findOne({ nameSpace })
    .then((result) => {
      if (!result) {
        res.status(500).send({
          status: "failed",
          message: "Unable to get institute Details",
        });
        centralDbConnection.close() // new
        return;
      } else {
        const { client, clientId, loginClient } = result;
        let configJSON = require(`../../client-config/${result.client}.json`);
        res.status(200).send({
          status: "success",
          message: "institute configurations",
          data: {
            ...configJSON,
            nameSpace,
            client,
            clientId,
            loginClient,
          },
        });
        centralDbConnection.close() // new
      }
    })
    .catch((err) => {
      res.status(500).send({
        status: "failed",
        message: "Unable to get institute Details",
        data: err,
      });
      centralDbConnection.close() // new
    })
    .finally((finalRes) => {
      centralDbConnection.close();
    });
}
async function internalLogin(req, res) {
  const { authToken, loginClient } = req.body;
  if (!authToken || !loginClient) {
    res.status(400).send({
      status: "failed",
      message: "Bad request",
    });
    return;
  }
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const instituteModel = centralDbConnection.model(
    orglistsCollectionName,
    instituteListSchema,
    orglistsCollectionName
  );
  let dbQuery = {};
  switch (loginClient) {
    case "google":
      const decodedToken = jwt.decode(authToken);
      if (decodedToken) {
        const { azp, email, name } = decodedToken;
        dbQuery = { user: email };
      }
  }
  instituteModel
    .findOne(dbQuery)
    .then((result) => {
      console.log(result);
      if (!result) {
        res.status(500).send({
          status: "failed",
          message: "Unable to get institute Details",
        });
        return;
      } else {
        const { user, password } = result._doc;
        axios
          .post(process.env.zqSignInUrl, {
            username: user,
            password,
          })
          .then((loginData) => {
            res.status(200).send({
              status: "success",
              message: "login to zenqore",
              data: loginData.data,
            });
            centralDbConnection.close() // new
            
          })
          .catch((err) => {
            console.log(err.response);
            res.status(500).send({
              status: "failed",
              message: "Unable to get institute Details",
              data: err,
            });
            centralDbConnection.close() // new
           
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send({
        status: "failed",
        message: "Unable to get institute Details",
        data: err,
      });
      centralDbConnection.close() // new
      
    })
    .finally((finalRes) => {
      centralDbConnection.close();
    });
}

module.exports = { createInstitute, getClientDetails, internalLogin };
