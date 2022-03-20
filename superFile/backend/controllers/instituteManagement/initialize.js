const mongoose = require("mongoose");
const instituteListSchema = require("../../models/instituteList");
const { createConnection } = require("../../utils/db_creation");
const orglistsCollectionName = "orglists";
const jwt = require("jsonwebtoken");
const Cryptr = require("cryptr");
const cryptr = new Cryptr("ZqSecretKey");
const axios = require("axios");
async function createInstitute(req, res) {
  console.log("checking", process.env.resourceUrl);
  console.log("central db Url", process.env.central_mongoDbUrl);
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
            res.status(200).send({
              status: "success",
              message: "Institute created Successfully",
              data: result,
            });
            centralDbConnection.close() // new
          })
          .catch((err) => {
            console.log(err);
            res.status(500).send({
              status: "failed",
              message: "Unable to add institute Details",
              data: err,
            });
            centralDbConnection.close() // new
          });
      } else {
        console.log(data);
        res.status(500).send({
          status: "failed",
          message: "Unable to connect to the server",
          data: err,
        });
        centralDbConnection.close() // new
      }
    })
    .catch((err) => {
      console.log(err, "org creation error");
      res.status(500).send({
        status: "failed",
        message: "Unable to connect to the server",
        data: err,
      });
      centralDbConnection.close() // new
    })
    .finally((finalRes) => {
      // centralDbConnection.close()
    });
}

console.log(process.argv);
