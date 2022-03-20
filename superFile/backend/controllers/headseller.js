const MongoClient = require("mongodb").MongoClient; //head.js
const axios = require("axios");
const sgMail = require("@sendgrid/mail");
var mongoose = require("mongoose");
var orgSchema = require("../models/settings/modelorg");
var hdsellerSchema = require("../models/headSellerModel");
exports.headseller = async (req, res) => {
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
      createModels.findById(body["organizationId"]).then((data) => {
        console.log(`${data.connUri}/${body["organizationId"]}`);

        const connection = mongoose.createConnection(
          `${data.connUri}/${body["organizationId"]}`,
          {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
          }
        );
        const createModel = connection.model("leads", hdsellerSchema, "leads");

        var storeDb = {
          leadId: req.body.leadId,
          parent: req.body.parent,
          accountStatus: "requested",
          // assignedTo: "Headseller",
          student: req.body.student,
          programdetail: req.body.programdetail,
          currency: req.body.currency,
          applicationId: req.body.applicationId,
          organizationId: req.body.organizationId,
          parentPhone: req.body.parentPhone,
          programPlan: req.body.programPlan,
          installmentDetails: req.body.installmentDetails,
        };

        var Leads = new createModel(storeDb);

        Leads.save(function (err) {
          if (err) {
            console.log(err);
            res.status(400);
            res.send({ message: "Lead id already exist" });
          } else {
            // var body_text = `<p>Dear Siva(Head Seller), <br><br> There is a new application request no. ${req.body.applicationId} received for further processing. <br><br> Please click on the following button to process it<br></p>
            //         <button style="font-family: 'Google Sans';
            //         font-style: normal;
            //         font-weight: 600;
            //         height: 36px;
            //         padding: 0px 15px;
            //         font-size: 14px;
            //         line-height: 20px;
            //         display: flex;
            //         border-radius: 3px;
            //         background-color: #0052CC;
            //         align-items: center;
            //         justify-content: center;
            //         outline: none;
            //         border: none;
            //         cursor: pointer;
            //         color: #FFFFFF;"> <a style="color: #FFFFFF;line-height: 36px;font-family: 'Google Sans';text-decoration:none;" href="${process.env.devUI}/#/bkah"> Process </a></button>
            //         <p>Regards,</p>
            //         <p><strong>Fee collection team</strong></p>
            //         <p>&nbsp;</p>`;

            // var subject = "New application request";
            // var charset = "UTF-8";

            // let sgKey =
            //   "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";
            // sgMail.setApiKey(sgKey);

            // console.log("sendgrid entered");
            // const msg = {
            //   to: "sivaraman.a@zenqore.com", // Change to your recipient
            //   from: "noreply@zenqore.com", // Change to your verified sender
            //   subject: subject,
            //   html: body_text,
            // };
            // sgMail
            //   .send(msg)
            //   .then(() => {
            // console.log("Sent Email");
            res.status(201).send({ message: "lead added successfully" });
            // })
            // .catch((error) => {
            //   console.log("error", error);
            // });
          }
        });
      });
    });

  //     const client = new MongoClient(process.env.central_mongoDbUrl, { serverSelectionTimeoutMS: 30000, useUnifiedTopology: true });
  //     await client.connect();
  //     const db = await client.db(process.env.database);
  //     try {
  //         data = JSON.stringify({ "Url": `${process.env.apiUri}/#/bkah` })
  //         submitfortiny = await axios.post(`${process.env.tinyUrl}`, data,
  //             { headers: { 'Content-Type': 'application/json' } }
  //         )
  //         var storeDb = await db.collection(process.env.leads).insertOne({
  //             parent: req.body.parent,
  //             accountStatus: "requested",
  //             student: req.body.student,
  //             programdetail: req.body.programdetail,
  //             currency: req.body.currency,
  //             applicationId: req.body.applicationId,
  //             organizationId: req.body.organizationId
  //         })
  //         if (storeDb.result.ok == 1) {
  //             // res.status(201)
  //             // res.send({ message: "Default users Added" })

  //             var body_text = `<p>Dear ${req.body.student.firstName}, <br><br> There is a new application request no. APP-001 received for further processing. <br><br> Please click on the following button to process it<br></p>
  //     <button style="font-family: 'Google Sans';
  //     font-style: normal;
  //     font-weight: 600;
  //     height: 36px;
  //     padding: 0px 15px;
  //     font-size: 14px;
  //     line-height: 20px;
  //     display: flex;
  //     border-radius: 3px;
  //     background-color: #0052CC;
  //     align-items: center;
  //     justify-content: center;
  //     outline: none;
  //     border: none;
  //     cursor: pointer;
  //     color: #FFFFFF;"> <a style="color: #FFFFFF;line-height: 36px;font-family: 'Google Sans';text-decoration:none;" href="${process.env.devUI}/#/bkah"> Process </a></button>
  //     <p>Regards,</p>
  //     <p><strong>Fee collection team</strong></p>
  //     <p>&nbsp;</p>`

  //             var subject = "New application request"
  //             var charset = "UTF-8"

  //             let sgKey =
  //                 "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";
  //             sgMail.setApiKey(sgKey);

  //             console.log("sendgrid entered");
  //             const msg = {
  //                 to: "sivaraman.a@zenqore.com", // Change to your recipient
  //                 from: "noreply@zenqore.com", // Change to your verified sender
  //                 subject: subject,
  //                 html: body_text,
  //             };
  //             sgMail
  //                 .send(msg)
  //                 .then(() => {
  //                     console.log("Sent Email");
  //                     res.send({ message: "request send sucessfully" });
  //                 })
  //                 .catch((error) => {
  //                     console.log("error", error);

  //                 });

  //         }

  //     }
  //     catch (e) {
  //         console.error('catch part....:', e);
  //         res.status(400)
  //         res.send({ "Err": e })
  //     }
};

exports.getheadseller = async (req, res) => {
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
      createModels.findById(req.query.orgId).then(async (data) => {
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
        const settingmodel = connection.model("leads", hdsellerSchema, "leads");
        let limit = Number(req.query.limit);
        let page = Number(req.query.page);
        if (req.query.mobile == "all") {
          var totalresult = await settingmodel.find();

          var result = await settingmodel
            .find()
            .limit(limit * 1)
            .skip((page - 1) * limit);

          let totalPages = Math.ceil(totalresult.length / limit);
          res.status(200);
          res.send({
            data: result,
            totalPages: totalPages,
            totalRecords: totalresult.length,
          });
        } else {
          var totalresult = await settingmodel.find({
            parentPhone: req.query.mobile,
          });

          var result = await settingmodel
            .find({ parentPhone: req.query.mobile })
            .limit(limit * 1)
            .skip((page - 1) * limit);

          let totalPages = Math.ceil(totalresult.length / limit);
          res.status(200);
          res.send({
            data: result,
            totalPages: totalPages,
            totalRecords: totalresult.length,
          });
        }
      });
    });
};

exports.updateleads = async (req, res) => {
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
      createModels.findById(req.params.id).then((data) => {
        console.log(`${data.connUri}/${req.params.id}`);

        const connection = mongoose.createConnection(
          `${data.connUri}/${req.params.id}`,
          {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
          }
        );
        const createModel = connection.model("leads", hdsellerSchema, "leads");

        createModel.find({ leadId: req.body.leadId }, function (err, data) {
          console.log(data[0]._id);
          var Fetchid = { _id: data[0]._id };
          var updateLeads = {
            $set: {
              accountStatus: req.body.accountStatus,
              installmentDetails: req.body.installmentDetails,
            },
          };
          // assignedTo: req.body.assignedTo,
          createModel.updateOne(Fetchid, updateLeads, function (err, result) {
            if (err) {
              console.log(err);
            } else {
              console.log("updated success");
              res.status(200);
              res.send({ message: "leads data updated successfully" });
            }
          });

          //   res.status(200);
          //   res.send({ message: "setting updated successfully" });
        });
      });
    });
};

exports.leadID = async (req, res) => {
  var getDatas = [];
  var transType = "";

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
      createModels.findById(req.query.orgId).then(async (data) => {
        console.log(`${data.connUri}/${req.query.orgId}`);

        const connection = mongoose.createConnection(
          `${data.connUri}/${req.query.orgId}`,
          {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
          }
        );
        const createModel = connection.model("leads", hdsellerSchema, "leads");

        getDatas = await createModel.find({});
        transType = "LEAD";

        var date = new Date();
        var month = date.getMonth();
        var finYear = "";
        if (month > 2) {
          var current = date.getFullYear();
          var prev = Number(date.getFullYear()) + 1;
          prev = String(prev).substr(String(prev).length - 2);
          finYear = `${current}-${prev}`;
        } else {
          var current = date.getFullYear();
          current = String(current).substr(String(current).length - 2);
          var prev = Number(date.getFullYear()) - 1;
          finYear = `${prev}-${current}`;
        }
        let initial = `${transType}_${finYear}_001`;
        let dataArr = [];
        let check;
        let finalVal;

        const sortAlphaNum = (a, b) =>
          a.localeCompare(b, "en", { numeric: true });
        getDatas.forEach((el) => {
          if (el["leadId"]) {
            let filStr = el["leadId"].split("_");
            let typeStr = filStr[0];
            let typeYear = filStr[1];
            if (typeStr == transType && typeYear == finYear) {
              check = true;
              dataArr.push(el["leadId"]);
            }
          }
        });
        if (!check) {
          finalVal = initial;
        } else {
          let lastCount = dataArr
            .sort(sortAlphaNum)
            [dataArr.length - 1].split("_");
          let lastCountNo = Number(lastCount[2]) + 1;
          if (lastCountNo.toString().length == 1)
            lastCountNo = "00" + lastCountNo;
          if (lastCountNo.toString().length == 2)
            lastCountNo = "0" + lastCountNo;
          lastCount[2] = lastCountNo;
          finalVal = lastCount.join("_");
        }
        res.status(200).send({
          status: "success",
          message: `ID generated`,
          data: finalVal,
        });
      });
    });
};

exports.Application = async (req, res) => {
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
      createModels.findById("60377798737cdf7d33caf118").then(async (data) => {
        console.log(`${data.connUri}/60377798737cdf7d33caf118`);

        const connection = mongoose.createConnection(
          `${data.connUri}/60377798737cdf7d33caf118`,
          {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
          }
        );
        const createModel = connection.model("leads", hdsellerSchema, "leads");

        var leadDetail = await createModel.find({ leadId: req.body.leadId });
        // console.log(leadDetail)
        if (leadDetail.length == 0) {
          console.log("err");
          res.status(400);
          res.send({ message: "Lead Id Not Found" });
        } else {
          var Fetchid = { _id: leadDetail[0]._id };
          var updateLeads = {
            $set: {
              parent: req.body.parent,
              accountStatus: "Application Created",
              student: req.body.student,
              applicationId: req.body.applicationId,
            },
          };
          // assignedTo: req.body.assignedTo,
          createModel.updateOne(Fetchid, updateLeads, function (err, result) {
            if (err) {
              console.log("heer");
              console.log(err);
            } else {
              console.log("updated success");

              res.status(201);
              res.send({ message: "Application created successfully" });
            }
          });
        }
      });
    });
};
//
