const mongoose = require("mongoose");
const centralMongodb = `usermanagement-${process.env.stage}`;
const instituteList = "orglists";
const orgListSchema = require("../models/orglists-schema");
const resourceUrl = `http://18.214.67.236:8080/container`;
const {
  checkDatabaseExists,
  createDatabase,
  createConnection,
} = require("../utils/db_creation");
const axios = require("axios");

async function checkResource(user) {
  const centralDbConnection = await createDatabase(
    centralMongodb,
    process.env.central_mongoDbUrl
  );
  // console.log("create connection", user, centralDbConnection, process.env.central_mongoDbUrl, centralMongodb)
  const orgListModel = centralDbConnection.model(
    instituteList,
    orgListSchema,
    instituteList
  );
  // console.log("create model")
  try {
    console.log("users", user);
    const findQuery =
      user.orgId != undefined
        ? { _id: user.orgId }
        : user.instituteId
        ? { _id: user.instituteId }
        : { user: user.user };
    return await orgListModel
      .findOne(findQuery)
      .then(async (data) => {
        // console.log("data", data)
        if (!data) {
          // console.log("came if condition")
          // console.log('user', user)
          // let userData = user.user.replace(/[^a-zA-Z0-9]/, '');
          // console.log('resourceUrl', resourceUrl)
          // console.log('userdata', userData)
          // console.log('stage', process.env.stage)
          // const resourceData = await axios.get(`${resourceUrl}?orgId=${user.userId}&stage=${process.env.stage}`)
          // console.log('getapi', resourceData.data)

          // if (resourceData.data.connUri!=="mongodb://undefined:27017" && resourceData.message!== "error occured") {
          //     // console.log("resourcedata", resourceData.data.connUri)
          //     const connUri = resourceData.data.connUri;
          //     const orgListData = {
          //         user: user.user, connUri
          //     }
          //     const orgListModelData = new orgListModel(orgListData);
          //     await orgListModelData.save();
          //     return orgListData
          // } else {

          // if(user.role=="Employee"){
          //   let orginst = await orgListModel.findOne({_id: user.institute})
          //   if(orginst){
          //     console.log("employee")
          //       return(orginst)
          //   }
          //   else{
          //     return null;
          //   }
          // }
          // else{
          console.log("came else condition");
          const connUri = "mongodb://20.193.147.119:30000";
          const orgListData = {
            _id: mongoose.Types.ObjectId(user.UserId),
            loginClient: "zenqore",
            name: user.institute,
            user: user.user,
            connUri,
            nameSpace: "hkbk998",
          };
          const orgListModelData = new orgListModel(orgListData);
          await orgListModelData.save();
          return orgListData;
          // }
          // }
        } else {
          console.log("came to existing part", data);
          return data;
        }
      })
      .catch((err) => {
        throw err;
      });
  } catch (e) {
    return e;
  } finally {
    centralDbConnection && centralDbConnection.close();
  }
}

module.exports = {
  checkResource,
};
