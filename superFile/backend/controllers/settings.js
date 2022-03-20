const AWS = require("aws-sdk");
var aws_region = "us-east-1";
awsCredentials = {
  accessKeyId: "AKIAR6HU7QOXJR7OAWH7", //AKIAR6HU7QOXIVHWCXAL
  secretAccessKey: "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", //6qXWD0mCYRhZdArZqZW0ke9KXue7d1EYYlzscSp1
  region: aws_region,
};
AWS.config.update(awsCredentials);
const axios = require("axios");
const { BlobServiceClient } = require("@azure/storage-blob");
var storage = require("@azure/storage-blob");
const accountname = "supportings";
const containerName = "zenqore-supportings";
const key =
  "l0OS+bMOq4Ak99YmohhikO/lTo1glFf8N1spp+AmAm7dM3mUNK6sL2ec97SjgRqdn1oTzhfgzcuMGeHcMd4YFg==";
let AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=supportings;AccountKey=l0OS+bMOq4Ak99YmohhikO/lTo1glFf8N1spp+AmAm7dM3mUNK6sL2ec97SjgRqdn1oTzhfgzcuMGeHcMd4YFg==;EndpointSuffix=core.windows.net";

const MongoClient = require("mongodb").MongoClient;
const mongourl = process.env.MongoUrl;
const client = new MongoClient(mongourl, {
  serverSelectionTimeoutMS: 30000,
  useUnifiedTopology: true,
});
var mongoose = require("mongoose");
var orgSchema = require("../models/settings/modelorg");
var settingsSchema = require("../models/settings/settings");
var settingswithVersion = require("../models/settings/feesetting");
var settingsHistory = require("../models/settings/acchistory");
var campusModel = require("../models/campusModel");
var diff = require("deep-diff").diff;
var jsonDiff = require("json-diff");
const { CostExplorer } = require("aws-sdk");
const campusSchema = require("../models/campusModel");

exports.settings = async (req, res) => {
  let body = req.body;
  const Mongouri = `${process.env.MongoUrl}/${process.env.database}`;
  console.log(Mongouri);
  mongoose
    .createConnection(`${Mongouri}`, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    })
    .then((value) => {
      const createModels = value.model("orglists", orgSchema, "orglists");
      createModels.findById(body["instituteid"]).then((data) => {
        console.log(`${data.connUri}/${body["instituteid"]}`);

        const connection = mongoose.createConnection(
          `${data.connUri}/${body["instituteid"]}`,
          {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
          }
        );
        const createModel = connection.model(
          "settingsActual",
          settingsSchema,
          "settingsActual"
        );
        const createModelversion = connection.model(
          "settings",
          settingswithVersion,
          "settings"
        );

        let instituteDetails = body["instituteDetails"];
        let logo = body["logo"];
        let emailServer = body["emailServer"];
        let smsGateway = body["smsGateway"];
        let paymentGateway = body["paymentGateway"];
        let storedata = {
          instituteDetails,
          logo,
          emailServer,
          smsGateway,
          paymentGateway,
        };

        let storedataversion = {
          instituteDetails,
          logo,
          emailServer,
          smsGateway,
          paymentGateway,
        };
        storedataversion.instituteDetails.version = 1;
        storedataversion.logo.version = 1;
        storedataversion.emailServer.version = 1;
        storedataversion.smsGateway.version = 1;
        storedataversion.paymentGateway.version = 1;

        var OrgMap = new createModel(storedata);
        var orgsettversion = new createModelversion(storedataversion);

        OrgMap.save(function (err) {
          if (err) {
            console.log(err);
          } else {
            orgsettversion.save(function (err, data) {
              if (err) {
                console.log(err);
              } else {
                console.log("added");
                res.header("Access-Control-Allow-Origin", "*");
                res.header(
                  "Access-Control-Allow-Methods",
                  "GET,HEAD,OPTIONS,POST,PUT"
                );
                res.header(
                  "Access-Control-Allow-Headers",
                  "Origin, X-Requested-With, Content-Type, Accept, Authorization"
                );
                res.status(200);
                res.send({ status: "success" });
              }
            });
          }
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.settingsget = async (req, res) => {
  console.log(req.query.instituteid);
  if (req.query.instituteid && req.query.campusId) {
    console.log("campus");
    const Mongouri = `${process.env.MongoUrl}/${process.env.database}`;
    console.log(Mongouri);
    mongoose
      .createConnection(`${Mongouri}`, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
      })
      .then((value) => {
        const createModels = value.model("orglists", orgSchema, "orglists");
        createModels.findById(req.query.instituteid).then(async (data) => {
          console.log(data);
          const connection = mongoose.createConnection(
            `${data.connUri}/${data._id}`,
            {
              useNewUrlParser: true,
              useCreateIndex: true,
              useUnifiedTopology: true,
            }
          );
          console.log(`${data.connUri}/${data._id}`);
          const settingmodel = connection.model(
            "settings",
            settingswithVersion,
            "settings"
          );
          const campuses = connection.model(
            "campuses",
            campusSchema,
            "campuses"
          );
          var settingsdata = await settingmodel.find({});
          var campusdata = await campuses.findById(req.query.campusId);

          var finalresult = { settings: settingsdata, campus: campusdata };

          res.status(200);
          res.send(finalresult);
        });
      });
  } else if (req.query.instituteid) {
    console.log("inst");
    const Mongouri = `${process.env.MongoUrl}/${process.env.database}`;
    console.log(Mongouri);
    mongoose
      .createConnection(`${Mongouri}`, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
      })
      .then((value) => {
        const createModels = value.model("orglists", orgSchema, "orglists");
        createModels.findById(req.query.instituteid).then((data) => {
          console.log(data);
          const connection = mongoose.createConnection(
            `${data.connUri}/${data._id}`,
            {
              useNewUrlParser: true,
              useCreateIndex: true,
              useUnifiedTopology: true,
            }
          );
          console.log(`${data.connUri}/${data._id}`);
          const settingmodel = connection.model(
            "settings",
            settingswithVersion,
            "settings"
          );

          settingmodel.find({}, function (err, data) {
            // console.log(data)
            res.header("Access-Control-Allow-Origin", "*");
            res.header(
              "Access-Control-Allow-Methods",
              "GET,HEAD,OPTIONS,POST,PUT"
            );
            res.header(
              "Access-Control-Allow-Headers",
              "Origin, X-Requested-With, Content-Type, Accept, Authorization"
            );
            res.status(200);
            res.send(data);
          });
        });
      });
  }
};
exports.settingsput = async (req, res) => {
  console.log(req.params.instituteid);
  let body = req.body;

  // var s3Bucket = new AWS.S3({ params: { Bucket: 'supportings' } });
  // var data = {
  //   Key: req.params.instituteid,
  //   Body: buf,
  //   ContentEncoding: 'base64',
  //   ContentType: 'image/jpeg',
  //   ACL: 'public-read'
  // };
  // s3Bucket.putObject(data, function (err, data) {
  //   if (err) {
  //     console.log(err);
  //     console.log('Error uploading data: ', data);
  //   } else {
  //     console.log('successfully uploaded the image!');
  //   }
  // });
  var sasUrl = "";

  if (body.logo.logo.startsWith("https", 0) == false) {
    var buf = Buffer.from(
      body.logo.logo.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    console.log(buf);

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobName = req.params.instituteid + process.env.stage + ".png";
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    console.log(
      "\nUploading to Azure storage as blob:\n\t",
      blobName,
      buf.length
    );
    // Upload data to the blob
    const uploadBlobResponse = await blockBlobClient.upload(buf, buf.length);
    console.log(
      "Blob was uploaded successfully. requestId: ",
      uploadBlobResponse.requestId
    );
    console.log("uploaded done");
    const cerds = new storage.StorageSharedKeyCredential(accountname, key);
    const blobClient = await containerClient.getBlobClient(blobName);
    const blobSAS = await storage
      .generateBlobSASQueryParameters(
        {
          containerName,
          blobName,
          permissions: storage.BlobSASPermissions.parse("racwd"),
          startsOn: new Date(),
          expiresOn: new Date(new Date().valueOf() + 86400),
        },
        cerds
      )
      .toString();
    sasUrl = blobClient.url;
    console.log("img blob url", sasUrl);
  } else {
    console.log("image update again");
    sasUrl = body.logo.logo;
  }

  const Mongouri = `${process.env.MongoUrl}/${process.env.database}`;
  console.log(Mongouri);
  var value = await mongoose.createConnection(`${Mongouri}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
  const createModels = value.model("orglists", orgSchema, "orglists");
  var data = await createModels.findById(req.params.instituteid);

  const connection = mongoose.createConnection(
    `${data.connUri}/${req.params.instituteid}`,
    { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }
  );
  // const createModel = connection.model("settingsActual", settingsSchema, 'settingsActual')
  const createModelversion = connection.model(
    "settings",
    settingswithVersion,
    "settings"
  );

  // var olddata = await createModel.find({})
  // var oldsetting = await createModelversion.find({})

  // var comparejson = jsonDiff.diff(body, olddata[0])
  // delete comparejson.instituteDetails.$init__added
  // delete comparejson.logo.$init__added
  // delete comparejson.emailServer.$init__added
  // delete comparejson.smsGateway.$init__added
  // delete comparejson.paymentGateway.$init__added

  // var comparedataKeys = []
  // comparedataKeys.push(Object.keys(comparejson.instituteDetails))
  // comparedataKeys.push(Object.keys(comparejson.logo))
  // comparedataKeys.push(Object.keys(comparejson.emailServer))
  // comparedataKeys.push(Object.keys(comparejson.smsGateway))
  // comparedataKeys.push(Object.keys(comparejson.paymentGateway))

  // var hiskeys = [].concat.apply([], comparedataKeys)
  // console.log(hiskeys)

  // if (hiskeys.length != 0) {

  //     var insdata = Object.keys(comparejson.instituteDetails)
  //     var logodata = Object.keys(comparejson.logo)
  //     var email = Object.keys(comparejson.emailServer)
  //     var sms = Object.keys(comparejson.smsGateway)
  //     var payment = Object.keys(comparejson.paymentGateway)

  //     //update indian Time..................................................

  //     var d = new Date();
  //     var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  //     var nd = new Date(utc + (3600000 * '+5.5'));
  //     console.log(nd.toLocaleString())
  //     //............................................................

  //     var inshis = []
  //     for (let i in insdata) {
  //         var history = {
  //             nameOfField: "",
  //             fieldName: "",
  //             oldValue: "",
  //             newValue: "",
  //             version: ""
  //         }
  //         history.nameOfField = "instituteDetails"
  //         history.fieldName = insdata[i]
  //         history.oldValue = oldsetting[0].instituteDetails[insdata[i]]
  //         history.newValue = body.instituteDetails[insdata[i]]
  //         history.version = oldsetting[0].instituteDetails.version
  //         history.updatedBy = body.userName
  //         history.userEmail = body.userEmail
  //         history.updateAt = nd.toLocaleString()
  //         inshis.push(history)
  //     }

  //     var logohis = []
  //     for (let i in logodata) {
  //         var history = {
  //             nameOfField: "",
  //             fieldName: "",
  //             oldValue: "",
  //             newValue: "",
  //             version: ""
  //         }
  //         history.nameOfField = "logo"
  //         history.fieldName = logodata[i]
  //         history.oldValue = oldsetting[0].logo[logodata[i]]
  //         history.newValue = body.logo[logodata[i]]
  //         history.version = oldsetting[0].logo.version
  //         history.updatedBy = body.userName
  //         history.userEmail = body.userEmail
  //         history.updateAt = nd.toLocaleString()
  //         logohis.push(history)
  //     }

  //     var emailhis = []
  //     for (let i in email) {
  //         var history = {
  //             nameOfField: "",
  //             fieldName: "",
  //             oldValue: "",
  //             newValue: "",
  //             version: ""
  //         }
  //         history.nameOfField = "emailServer"
  //         history.fieldName = email[i]
  //         history.oldValue = oldsetting[0].emailServer[email[i]]
  //         history.newValue = body.emailServer[email[i]]
  //         history.version = oldsetting[0].emailServer.version
  //         history.updatedBy = body.userName
  //         history.userEmail = body.userEmail
  //         history.updateAt = nd.toLocaleString()
  //         emailhis.push(history)
  //     }

  //     var smshis = []
  //     for (let i in sms) {
  //         var history = {
  //             nameOfField: "",
  //             fieldName: "",
  //             oldValue: "",
  //             newValue: "",
  //             version: ""
  //         }
  //         history.nameOfField = "smsGateway"
  //         history.fieldName = sms[i]
  //         history.oldValue = oldsetting[0].smsGateway[sms[i]]
  //         history.newValue = body.smsGateway[sms[i]]
  //         history.version = oldsetting[0].smsGateway.version
  //         history.updatedBy = body.userName
  //         history.userEmail = body.userEmail
  //         history.updateAt = nd.toLocaleString()
  //         smshis.push(history)
  //     }

  //     var payhis = []
  //     for (let i in payment) {
  //         var history = {
  //             nameOfField: "",
  //             fieldName: "",
  //             oldValue: "",
  //             newValue: "",
  //             version: ""
  //         }
  //         history.nameOfField = "paymentGateway"
  //         history.fieldName = payment[i]
  //         history.oldValue = oldsetting[0].paymentGateway[payment[i]]
  //         history.newValue = body.paymentGateway[payment[i]]
  //         history.version = oldsetting[0].paymentGateway.version
  //         history.updatedBy = body.userName
  //         history.userEmail = body.userEmail
  //         history.updateAt = nd.toLocaleString()
  //         payhis.push(history)
  //     }

  //     var cc = [].concat.apply(inshis, logohis);
  //     var dd = [].concat.apply(cc, emailhis)
  //     var ee = [].concat.apply(dd, smshis)
  //     var final = [].concat.apply(ee, payhis)

  // console.log(final)

  // const historymodel = connection.model("feeSettingsHistory", settingsHistory, 'feeSettingsHistory')
  // historymodel.insertMany(final, async function (err, data) {
  //     if (err) { console.log(err) }
  //     else {
  //         console.log("history added")
  //         const originalvalue = connection.model("settingsActual", settingsSchema, 'settingsActual')
  //         var getAcdataId = await originalvalue.find({})
  //         console.log(getAcdataId[0]._id)
  //         var Fetchidchanges = { _id: getAcdataId[0]._id }
  //         var updatechanges = {
  //             $set: {
  //                 instituteDetails: body['instituteDetails'],
  //                 logo: body['logo'],
  //                 label: body['label'],
  //                 emailServer: body['emailServer'],
  //                 smsGateway: body['smsGateway'],
  //                 paymentGateway: body['paymentGateway'],
  //                 headApprover:body['headApprover'],
  //                 bankDetails:body['bankDetails']
  //             }
  //         }
  //         var dbupdateorinalvalue = await connection.collection('settingsActual').updateOne(Fetchidchanges, updatechanges)

  var storedata = {};
  //         if (dbupdateorinalvalue != null) {
  //             console.log("original data updated")
  storedata.logo = {
    logo: `https://supportings.s3.amazonaws.com/${req.params.instituteid}`,
  };

  const getsettings = connection.model(
    "settings",
    settingswithVersion,
    "settings"
  );
  var settingsdata = await getsettings.find({});

  //             if (insdata.length == 0) { storedata.instituteDetails = body['instituteDetails'], storedata.instituteDetails.version = settingsdata[0].instituteDetails.version }
  //             else { storedata.instituteDetails = body['instituteDetails'], storedata.instituteDetails.version = settingsdata[0].instituteDetails.version + 1 }

  //  if (logodata.length == 0) { storedata.logo = body['logo'], storedata.logo.version = settingsdata[0].logo.version }
  // else { storedata.logo = c, storedata.logo.version = settingsdata[0].logo.version + 1 }

  //             if (logodata.length == 0) { storedata.logo = { logo: `https://supportings.s3.amazonaws.com/${req.params.instituteid}` }, storedata.logo.version = settingsdata[0].logo.version }
  //             else { storedata.logo = { logo: `https://supportings.s3.amazonaws.com/${req.params.instituteid}` }, storedata.logo.version = settingsdata[0].logo.version + 1 }

  //             if (email.length == 0) { storedata.emailServer = body['emailServer'], storedata.emailServer.version = settingsdata[0].emailServer.version }
  //             else { storedata.emailServer = body['emailServer'], storedata.emailServer.version = settingsdata[0].emailServer.version + 1 }

  //             if (sms.length == 0) { storedata.smsGateway = body['smsGateway'], storedata.smsGateway.version = settingsdata[0].smsGateway.version }
  //             else { storedata.smsGateway = body['smsGateway'], storedata.smsGateway.version = settingsdata[0].smsGateway.version + 1 }

  //             if (payment.length == 0) { storedata.paymentGateway = body['paymentGateway'], storedata.paymentGateway.version = settingsdata[0].paymentGateway.version }
  //             else { storedata.paymentGateway = body['paymentGateway'], storedata.paymentGateway.version = settingsdata[0].paymentGateway.version + 1 }

  var Fetchid = { _id: settingsdata[0]._id };
  var updatesetting = {
    $set: {
      instituteDetails: body["instituteDetails"],
      logo: { logo: sasUrl },
      favicon: body["favicon"],
      browserTitle: body["browserTitle"],
      logoPositions: body["logoPositions"],
      receipts: body["receipts"],
      label: body["label"],
      portalLogin: body["portalLogin"],
      emailServer: body["emailServer"],
      smsGateway: body["smsGateway"],
      paymentGateway: body["paymentGateway"],
      headApprover: body["headApprover"],
      bankDetails: body["bankDetails"],
      dfcr: body['dfcr'],
      currency: body['currencyLists']
    },
  };
  var dbUpdateSettings = await connection
    .collection("settings")
    .updateMany(Fetchid, updatesetting);
  if (dbUpdateSettings != null) {
    console.log("settings updated");
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.status(200);
    res.send({ message: "setting updated successfully" });
  }

  // }

  // }
  // })
  // } else {
  //     res.header("Access-Control-Allow-Origin", "*");
  //     res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  //     res.status(400)
  //     res.send({ message: "you not changed anything" })
  // }
};

exports.settingsfee = async (req, res) => {
  console.log(req.query.fieldname);
  const Mongouri = `${process.env.MongoUrl}/${process.env.database}`;
  console.log(Mongouri);
  var value = await mongoose.createConnection(`${Mongouri}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
  const createModels = value.model("orglists", orgSchema, "orglists");
  var data = await createModels.findById(req.query.orgid);

  const connection = mongoose.createConnection(
    `${data.connUri}/${req.query.orgid}`,
    { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }
  );
  const historymodel = connection.model(
    "feeSettingsHistory",
    settingsHistory,
    "feeSettingsHistory"
  );
  historymodel.find({ nameOfField: req.query.fieldname }, function (err, data) {
    if (err) {
      console.log(err);
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.status(400);
      res.send(err);
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );
      res.status(200);
      res.send(data);
    }
  });
};

//
