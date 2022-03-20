const orgListSchema = require("../../models/orglists-schema");
const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");

module.exports.getUserProfile = async (req, res) => {
  const { resource, orgId } = req.headers;
  let dbConnectionp = await createDatabase(orgId, resource);
  const centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const settingsSchema = mongoose.Schema({}, { strict: false });
  const userProfileModel = dbConnectionp.model(
    "settings",
    settingsSchema,
    "settings"
  );
  const usersModel = centralDbConnection.model(
    `users`,
    settingsSchema,
    `users`
  );

  console.log("users", req.headers.user);
  let userdata = await usersModel.findOne({ userName: req.headers.user });
  if (!userdata) {
    res.status(404).json({ message: "Invalid user data" });
  }
  console.log("userdata", userdata);
  userProfileModel.find({}, async function (err, data) {
    if (err) {
      res.status(400).send({
        status: "failure",
        message: "could not get user profile",
        data: err.toString(),
      });
      centralDbConnection.close();
      dbConnectionp.close();
    } else {
      if (data.length > 0) {
        // console.log(data[0]._doc)
        let result = {
          instituteName: data[0]._doc.instituteDetails.instituteName,
          logo: data[0]._doc.logo,
          orgId: orgId,
          firstName: userdata._doc.firstName,
          lastName: userdata._doc.lastName,
          userProfilePic: userdata._doc.profilePic,
        };
        res.status(200).send({
          status: "success",
          message: "user profile data",
          data: result,
        });
        centralDbConnection.close();
        dbConnectionp.close();
      } else {
        dbConnectionp.close();
        let result = {
          instituteName: null,
          logo: null,
          orgId: orgId,
        };
        res.status(200).send({
          status: "success",
          message: "user profile data",
          data: result,
        });
        centralDbConnection.close();
        dbConnectionp.close();
      }
    }
  });
  // res.status(200).send({ orgId });
};
