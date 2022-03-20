const { createDatabase } = require("../utils/db_creation");
const masterUploadSchema = require("../models/masterUploadModel");
var _ = require("lodash");
var moment = require("moment");
var mongoose = require("mongoose");
const csvtojson = require("csvtojson");
const instituteDetailsSchema = require("../models/instituteDetailsModel");
const ProgramPlanSchemaa = require("../models/programPlanModel");
const FeeTypeSchema = require("../models/feeTypeModel");
//Import Schema
const AccountSchema = require("../models/ken42/accountModel");
const ContactSchema = require("../models/ken42/contactModel");
const CourseConnectionSchema = require("../models/ken42/courseConnectionModel");
const CourseSchema = require("../models/ken42/courseModel");
const CourseOfferSchema = require("../models/ken42/courseOfferingModel");
const PlanRequirementSchema = require("../models/ken42/planRequirementModel");
const ProgramEnrollmentSchema = require("../models/ken42/programEnrollmentModel");
const ProgramPlanSchema = require("../models/ken42/programPlanModel");
const ContactRelationSchema = require("../models/ken42/contactRelationModel");
const TermSchema = require("../models/ken42/termModel");
const StudentSchema = require("../models/studentModel");
const GuardianSchema = require("../models/guardianModel");
const { BlobServiceClient } = require("@azure/storage-blob");
// let blobSvc = azure.createBlobService();

var excell = require("excel4node");
var AWS = require("aws-sdk");
let axios = require("axios");
const PubNub = require("pubnub");
let promise;
var pubnub = new PubNub({
  subscribeKey: "sub-c-982dbaba-1d98-11ea-8c76-2e065dbe5941",
  publishKey: "pub-c-87ae3cc8-8d0a-40e0-8e0f-dbb286306b21",
  secretKey: "sec-c-ODRhYWJjZmYtZGQ0MS00ZjY2LTkzMGMtY2VhNGZhYjYzOWRi",
  ssl: false,
});
//Multer configuration
AWS.config.update({
  region: process.env.region,
  aws_access_key_id: process.env.accessKeyId,
  aws_secret_access_key: process.env.secretAccessKey,
});

const S3 = new AWS.S3({
  region: process.env.region,
  aws_access_key_id: process.env.accessKeyId,
  aws_secret_access_key: process.env.secretAccessKey,
});

async function uploadMasterken42(req, res) {
  if (req.query.type) {
    let response = req.files;
    if (response.file == undefined) {
      res.status(400).send({ Message: "Please Upload file" });
    } else {
      let fileName = response.file[0].key;
      var params = {
        Bucket: process.env.S3_BUCKET,
        Key: fileName,
      };
      console.log("params", params);
      // get csv file and create stream
      const stream = S3.getObject(params).createReadStream();
      // convert csv file (stream) to JSON format data
      const jsonData = await csvtojson().fromStream(stream);
      //let dbConnectionp = await createDatabase(req.headers.orgId, req.headers.resource);
      let dbConnection = await createDatabase(
        "zqken42",
        "mongodb://localhost:27017"
      );
      let collections = {
        "accounts.csv": { name: "accounts", schema: AccountSchema },
        "contactRelation.csv": {
          name: "contactrelation",
          schema: ContactRelationSchema,
        },
        "contacts.csv": { name: "contacts", schema: ContactSchema },
        "courseConnection.csv": {
          name: "courseconnections",
          schema: CourseConnectionSchema,
        },
        "courseOffering.csv": {
          name: "courseoffers",
          schema: CourseOfferSchema,
        },
        "courses.csv": { name: "courses", schema: CourseSchema },
        "planRequirement.csv": {
          name: "planrequirements",
          schema: PlanRequirementSchema,
        },
        "programEnrollment.csv": {
          name: "programenrollments",
          schema: ProgramEnrollmentSchema,
        },
        "programPlan.csv": { name: "programplans", schema: ProgramPlanSchema },
        "terms.csv": { name: "terms", schema: TermSchema },
      };
      if (req.query.type == "accounts") {
        console.log("came to accounts");
        let accountModel = dbConnection.model("accounts", AccountSchema);
        // Function call
        accountModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Accounts added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error,
            });
          });
      } else if (req.query.type == "contacts") {
        let contactModel = dbConnection.model("contacts", ContactSchema);
        // Function call
        contactModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Contacts added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else if (req.query.type == "courseConnection") {
        let courseConnectionModel = dbConnection.model(
          "courseconnections",
          CourseConnectionSchema
        );
        // Function call
        courseConnectionModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Course Connection added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else if (req.query.type == "courseOffer") {
        let courseOfferModel = dbConnection.model(
          "courseoffers",
          CourseOfferSchema
        );
        // Function call
        courseOfferModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Course Offer added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else if (req.query.type == "courses") {
        let CourseModel = dbConnection.model("courses", CourseSchema);
        // Function call
        CourseModel.insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Course  added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else if (req.query.type == "planRequirement") {
        let planRequirementModel = dbConnection.model(
          "planrequirements",
          PlanRequirementSchema
        );
        // Function call
        planRequirementModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Plan Requirement added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else if (req.query.type == "programEnrollment") {
        let programEnrollmentModel = dbConnection.model(
          "programenrollments",
          ProgramEnrollmentSchema
        );
        // Function call
        programEnrollmentModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Program Enrollment added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else if (req.query.type == "programPlan") {
        let programPlanModel = dbConnection.model(
          "programplan",
          ProgramPlanSchema
        );
        // Function call
        programPlanModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Program Plan added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else if (req.query.type == "contactRelation") {
        let contactRelationModel = dbConnection.model(
          "contactrelation",
          ContactRelationSchema
        );
        // Function call
        contactRelationModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Contact Relation added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else if (req.query.type == "terms") {
        let termModel = dbConnection.model("terms", TermSchema);
        // Function call
        termModel
          .insertMany(jsonData, { ordered: false }, { upsert: true })
          .then(function (insertedData) {
            return res.status(201).json({
              message: "New Term added",
              type: "success",
              data: insertedData,
            }); // Success
          })
          .catch(function (error) {
            return res.status(400).json({
              message: "Database Error",
              type: "error",
              data: error, // Failure
            });
          });
      } else {
        return res.status(404).json({
          message: "Please give correct Type",
          type: "error",
        });
      }
    }
  } else {
    res.status(404).json({
      status: "failed",
      message: "Please pass type in params",
    });
  }
}

async function uploadMasterLinkold(req, res) {
  if (req.query.type) {
    let inputData = req.body;
    if (!inputData.url) {
      res.status(404).json({
        status: "failed",
        message: "Please provide all required parameters.",
        type: "error",
      });
    } else {
      axios
        .get(inputData.url)
        .then(async function (response) {
          let jsonData = await csvtojson().fromString(response.data);
          let dbConnection = await createDatabase(
            "ken42",
            process.env.database
          );
          let collections = {
            "accounts.csv": "accounts",
            "contactRelation.csv": "contactrelation",
            "contacts.csv": "contacts",
            "courseConnection.csv": "courseconnections",
            "courseOffering.csv": "courseoffers",
            "courses.csv": "courses",
            "planRequirement.csv": "planrequirements",
            "programEnrollment.csv": "programenrollments",
            "programPlan.csv": "programplans",
            "terms.csv": "terms",
          };
          // let apis = {
          //     "accounts": "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=accounts",
          //     contacts: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=contacts",
          //     courceConntion: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=courseConnection",
          //     courcesOffers: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=courseOffering",
          //     cources: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=courses",
          //     planRequirement: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=planRequirement",
          //     programEnroll: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=programEnrollment",
          //     contactRelation: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=contactRelation",
          //     programPlan: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=programPlan",
          //     terms: "https://api1.ken42.com:8243/fee/1.0.0/getmaster?type=terms"
          // }
          if (req.query.type == "accounts") {
            let accountModel = dbConnection.model("accounts", AccountSchema);
            // Function call
            accountModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Accounts added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error,
                });
              });
          } else if (req.query.type == "contacts") {
            let contactModel = dbConnection.model("contacts", ContactSchema);
            // Function call
            contactModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Contacts added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else if (req.query.type == "courseConnection") {
            let courseConnectionModel = dbConnection.model(
              "courseconnections",
              CourseConnectionSchema
            );
            // Function call
            courseConnectionModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Course Connection added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else if (req.query.type == "courseOffer") {
            let courseOfferModel = dbConnection.model(
              "courseoffers",
              CourseOfferSchema
            );
            // Function call
            courseOfferModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Course Offer added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else if (req.query.type == "courses") {
            let CourseModel = dbConnection.model("courses", CourseSchema);
            // Function call
            CourseModel.insertMany(
              jsonData,
              { ordered: false },
              { upsert: true }
            )
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Course  added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else if (req.query.type == "planRequirement") {
            let planRequirementModel = dbConnection.model(
              "planrequirements",
              PlanRequirementSchema
            );
            // Function call
            planRequirementModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Plan Requirement added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else if (req.query.type == "programEnrollment") {
            let programEnrollmentModel = dbConnection.model(
              "programenrollments",
              ProgramEnrollmentSchema
            );
            // Function call
            programEnrollmentModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Program Enrollment added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else if (req.query.type == "programPlan") {
            let programPlanModel = dbConnection.model(
              "programplan",
              ProgramPlanSchema
            );
            // Function call
            programPlanModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Program Plan added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else if (req.query.type == "contactRelation") {
            let contactRelationModel = dbConnection.model(
              "contactrelation",
              ContactRelationSchema
            );
            // Function call
            contactRelationModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Contact Relation added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else if (req.query.type == "terms") {
            let termModel = dbConnection.model("terms", TermSchema);
            // Function call
            termModel
              .insertMany(jsonData, { ordered: false }, { upsert: true })
              .then(function (insertedData) {
                return res.status(201).json({
                  message: "New Term added",
                  type: "success",
                  data: insertedData,
                }); // Success
              })
              .catch(function (error) {
                if (error.name === "BulkWriteError" && error.code === 11000) {
                  // Duplicate username
                  return res.status(422).json({
                    succes: false,
                    message: "Students already exist!",
                    count: 0,
                  });
                }
                return res.status(400).json({
                  message: "Database Error",
                  type: "error",
                  data: error, // Failure
                });
              });
          } else {
            return res.status(404).json({
              message: "Please give correct Type",
              type: "error",
            });
          }
        })
        .catch(function (error) {
          res.status(400).json({
            status: "failed",
            Error: error,
          });
        });
    }

    // let fileName = response.file[0].key;
    // var params = {
    //   Bucket: process.env.S3_BUCKET,
    //   Key: fileName,
    // };
    // // get csv file and create stream
    // const stream = S3.getObject(params).createReadStream();
    // convert csv file (stream) to JSON format data
  } else {
    res.status(404).json({
      status: "failed",
      message: "Please pass type in params",
    });
  }
}

async function uploadMasterLink(req, res) {
  // const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=vksdata;AccountKey=8ZUER1NJE8gVZoC3w6mrknXHnXJXFr2uII7ObvZy45ARpoRxRmLGJ9EbRI2kc1/XIOKyEP/J5PHh/Zlcu2bOcw==;EndpointSuffix=core.windows.net";
  // Create the BlobServiceClient object which will be used to create a container client
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  let dbConnection = await createDatabase(
    "zqken42",
    process.env.central_mongoDbUrl
  );
  // let dbname = `${req.headers.orgId}ken42`
  let i = 1;
  // let dbConnection = await createDatabase(dbname, process.env.profilewise_mongoDbUrl);
  // let dbConnection = await createDatabase(dbname, "mongodb://localhost:27017");
  // let studentModel = dbConnection.model("students", StudentSchema);
  // let guardianSchema = dbConnection.model("guardian", GuardianSchema);
  // let guardians = []
  // let students = []
  // let existstd = []
  // let programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
  let blobnames = [
    "accounts.csv",
    "contactRelation.csv",
    "contacts.csv",
    "courseConnection.csv",
    "courseOffering.csv",
    "courses.csv",
    "planRequirement.csv",
    "programEnrollment.csv",
    "programPlan.csv",
    "terms.csv",
    "Affiliations.csv",
  ];
  let cllectionnames = {
    "accounts.csv": { name: "accounts", schema: AccountSchema },
    "contactRelation.csv": {
      name: "contactrelation",
      schema: ContactRelationSchema,
    },
    "contacts.csv": { name: "contacts", schema: ContactSchema },
    "courseConnection.csv": {
      name: "courseconnections",
      schema: CourseConnectionSchema,
    },
    "courseOffering.csv": { name: "courseoffers", schema: CourseOfferSchema },
    "courses.csv": { name: "courses", schema: CourseSchema },
    "planRequirement.csv": {
      name: "planrequirements",
      schema: PlanRequirementSchema,
    },
    "programEnrollment.csv": {
      name: "programenrollments",
      schema: ProgramEnrollmentSchema,
    },
    "programPlan.csv": { name: "programplans", schema: ProgramPlanSchema },
    "terms.csv": { name: "terms", schema: TermSchema },
    "Affiliations.csv": { name: "affiliations", schema: TermSchema },
  };
  let filenames = [];
  let filesdata = {
    accounts: [],
    contacts: [],
    programplans: [],
    contactrelation: [],
    courseconnections: [],
    courseoffers: [],
    courses: [],
    planrequirements: [],
    programenrollments: [],
    terms: [],
  };
  var promise = [];
  for await (const container of blobServiceClient.listContainers()) {
    console.log(`Container ${i++}: ${container.name}`);
    // Get a block blob client
    const containerClient = blobServiceClient.getContainerClient(
      container.name
    );
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blobnames.includes(blob.name)) {
        console.log("\t", "blobname", blob.name);
        // Create a unique name for the blob
        const blobName = blob.name;
        // Get a block blob client
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        console.log("\nDownloaded blob content...");
        let streamtostring = await streamToString(
          downloadBlockBlobResponse.readableStreamBody
        );
        let jsonData = await csvtojson().fromString(streamtostring);
        filesdata[cllectionnames[blob.name]["name"]] = jsonData;
        // let model = dbConnection.model(cllectionnames[blob.name]["name"], cllectionnames[blob.name]["schema"])
        // await model.insertMany(jsonData, { ordered: false }, { upsert: true })
        filenames.push(`New ${cllectionnames[blob.name]["name"]} added`);
      }
    }
  }
  if (filenames.length == 11) {
    // res.send(filesdata)
    mapAllData(
      filesdata["accounts"],
      filesdata["programplans"],
      filesdata["contacts"],
      filesdata["contactrelation"],
      req.headers.orgId,
      req.query.headId,
      res
    ).then(async (fresult) => {
      // res.body = responseHandler(response);
      // let data = res.body.Data;
      // console.log(fresult.data.head.data)
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=" + `${fresult.filename}`
      );
      res.type("application/octet-stream");
      // res.body.data = fresult.data;
      // fresult.data.head.data.writeToBuffer().then(function (buffer) {
      res.body = fresult.data.head.data;
      res.send(res.body);
      //   });
      res.send(fresult.data.head.data.data);
    });
  }
}

async function createMasterken42(req, res) {
  let inputData = req.body;
  if (req.query.type) {
    let dbConnection = await createDatabase("ken42", process.env.database);
    if (req.query.type == "accounts") {
      let accountModel = dbConnection.model("accounts", AccountSchema);
      if (
        !inputData.ID ||
        !inputData.NAME ||
        !inputData.RECORDTYPEID ||
        !inputData.HED__SCHOOL_CODE__C
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newAccountDetails = new accountModel({
          ID: inputData.ID,
          NAME: inputData.NAME,
          TYPE: inputData.TYPE,
          RECORDTYPEID: inputData.RECORDTYPEID,
          PARENTID: inputData.PARENTID,
          HED__SCHOOL_CODE__C: inputData.HED__SCHOOL_CODE__C,
        });
        newAccountDetails.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Account added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "contacts") {
      let contactModel = dbConnection.model("contacts", ContactSchema);
      if (
        !inputData.ID ||
        !inputData.ACCOUNTID ||
        !inputData.NAME ||
        !inputData.PHONE ||
        !inputData.EMAIL
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newContactDetails = new contactModel({
          ID: inputData.ID,
          ACCOUNTID: inputData.ACCOUNTID,
          LASTNAME: inputData.LASTNAME,
          FIRSTNAME: inputData.FIRSTNAME,
          SALUTATION: inputData.SALUTATION,
          NAME: inputData.NAME,
          PHONE: inputData.PHONE,
          EMAIL: inputData.EMAIL,
          BIRTHDATE: inputData.BIRTHDATE,
          HED__ALTERNATEEMAIL__C: inputData.HED__ALTERNATEEMAIL__C,
        });
        newContactDetails.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Contact added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "courseConnection") {
      let courseConnectionModel = dbConnection.model(
        "courseconnections",
        CourseConnectionSchema
      );
      if (
        !inputData.ID ||
        !inputData.NAME ||
        !inputData.RECORDTYPEID ||
        !inputData.HED__ACCOUNT__C ||
        !inputData.HED__CONTACT__C ||
        !inputData.HED__COURSE_OFFERING__C ||
        !inputData.HED__PROGRAM_ENROLLMENT__C ||
        !inputData.HED__STATUS__C
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newCourseConnection = new courseConnectionModel({
          ID: inputData.ID,
          NAME: inputData.NAME,
          RECORDTYPEID: inputData.RECORDTYPEID,
          HED__ACCOUNT__C: inputData.HED__ACCOUNT__C,
          HED__CONTACT__C: inputData.HED__CONTACT__C,
          HED__COURSE_OFFERING__C: inputData.HED__COURSE_OFFERING__C,
          HED__PROGRAM_ENROLLMENT__C: inputData.HED__PROGRAM_ENROLLMENT__C,
          HED__STATUS__C: inputData.HED__STATUS__C,
        });
        newCourseConnection.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Course Connection added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "courseOffer") {
      let courseOfferModel = dbConnection.model(
        "courseoffers",
        CourseOfferSchema
      );
      if (
        !inputData.ID ||
        !inputData.MAXIMUM_CLASSES__C ||
        !inputData.NAME ||
        !inputData.TOTAL_ATTENDANCE_REQUIRED__C ||
        !inputData.HED__CAPACITY__C ||
        !inputData.HED__COURSE__C ||
        !inputData.HED__SECTION_ID__C ||
        !inputData.HED__TERM__C
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newCourseOffer = new courseOfferModel({
          ID: inputData.ID,
          MAXIMUM_CLASSES__C: inputData.MAXIMUM_CLASSES__C,
          NAME: inputData.NAME,
          TOTAL_ATTENDANCE_REQUIRED__C: inputData.TOTAL_ATTENDANCE_REQUIRED__C,
          HED__CAPACITY__C: inputData.HED__CAPACITY__C,
          HED__COURSE__C: inputData.HED__COURSE__C,
          HED__SECTION_ID__C: inputData.HED__SECTION_ID__C,
          HED__TERM__C: inputData.HED__TERM__C,
        });
        newCourseOffer.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Course Offer added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "courses") {
      let CourseModel = dbConnection.model("courses", CourseSchema);
      if (
        !inputData.ID ||
        !inputData.NAME ||
        !inputData.HED__ACCOUNT__C ||
        !inputData.HED__COURSE_ID__C
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newCourse = new CourseModel({
          ID: inputData.ID,
          NAME: inputData.NAME,
          HED__ACCOUNT__C: inputData.HED__ACCOUNT__C,
          HED__COURSE_ID__C: inputData.HED__COURSE_ID__C,
        });
        newCourse.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Course added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "planRequirement") {
      let planRequirementModel = dbConnection.model(
        "planrequirements",
        PlanRequirementSchema
      );
      if (
        !inputData.ID ||
        !inputData.NAME ||
        !inputData.HED__CATEGORY__C ||
        !inputData.HED__COURSE__C ||
        !inputData.HED__PROGRAM_PLAN__C
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newPlanRequirement = new planRequirementModel({
          ID: inputData.ID,
          NAME: inputData.NAME,
          HED__CATEGORY__C: inputData.HED__CATEGORY__C,
          HED__COURSE__C: inputData.HED__COURSE__C,
          HED__PROGRAM_PLAN__C: inputData.HED__PROGRAM_PLAN__C,
        });
        newPlanRequirement.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Plan Requirement added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "programEnrollment") {
      let programEnrollmentModel = dbConnection.model(
        "programenrollments",
        ProgramEnrollmentSchema
      );
      if (
        !inputData.ID ||
        !inputData.NAME ||
        !inputData.HED__ACCOUNT__C ||
        !inputData.HED__CONTACT__C ||
        !inputData.HED__PROGRAM_PLAN__C
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newProgramEnrollment = new programEnrollmentModel({
          ID: inputData.ID,
          NAME: inputData.NAME,
          HED__ACCOUNT__C: inputData.HED__ACCOUNT__C,
          HED__CONTACT__C: inputData.HED__CONTACT__C,
          HED__PROGRAM_PLAN__C: inputData.HED__PROGRAM_PLAN__C,
        });
        newProgramEnrollment.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Program Enrollment added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "programPlan") {
      let programPlanModel = dbConnection.model(
        "programplan",
        ProgramPlanSchema
      );
      if (!inputData.ID || !inputData.NAME || !inputData.HED__ACCOUNT__C) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newProgramPlan = new programPlanModel({
          ID: inputData.ID,
          NAME: inputData.NAME,
          HED__ACCOUNT__C: inputData.HED__ACCOUNT__C,
        });
        newProgramPlan.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Program Plan added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "contactRelation") {
      let contactRelationModel = dbConnection.model(
        "contactrelation",
        ContactRelationSchema
      );
      if (
        !inputData.ID ||
        !inputData.HED__CONTACT__C ||
        !inputData.HED__RELATEDCONTACT__C ||
        !inputData.HED__TYPE__C
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newContactRelation = new contactRelationModel({
          ID: inputData.ID,
          HED__CONTACT__C: inputData.HED__CONTACT__C,
          HED__RELATEDCONTACT__C: inputData.HED__RELATEDCONTACT__C,
          HED__TYPE__C: inputData.HED__TYPE__C,
        });
        newContactRelation.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Contact Relation added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "terms") {
      let termModel = dbConnection.model("terms", TermSchema);
      if (
        !inputData.ID ||
        !inputData.NAME ||
        !inputData.HED__ACCOUNT__C ||
        !inputData.HED__TYPE__C
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newTerm = new termModel({
          ID: inputData.ID,
          NAME: inputData.NAME,
          HED__ACCOUNT__C: inputData.HED__ACCOUNT__C,
          HED__TYPE__C: inputData.HED__TYPE__C,
        });
        newTerm.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Term added",
              type: "success",
              data: data,
            });
          }
        });
      }
    }
  } else {
    res.status(404).json({
      status: "failed",
      message: "Please pass type in params",
    });
  }
}

async function showAllMaster(req, res) {
  if (req.query.type) {
    let dbConnection = await createDatabase("ken42", process.env.database);
    if (req.query.type == "accounts") {
      let accountModel = dbConnection.model("accounts", AccountSchema);
      accountModel.find({}, function (err, doc) {
        if (doc) {
          return res
            .status(200)
            .json({ status: "success", data: doc, count: doc.length });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Account does not exist" });
        }
      });
    } else if (req.query.type == "contacts") {
      let contactModel = dbConnection.model("contacts", ContactSchema);
      if (
        !inputData.ID ||
        !inputData.ACCOUNTID ||
        !inputData.NAME ||
        !inputData.PHONE ||
        !inputData.EMAIL
      ) {
        res.status(200).json({
          status: "failed",
          message: "Please provide all required parameters.",
          type: "error",
        });
      } else {
        var newContactDetails = new contactModel({
          ID: inputData.ID,
          ACCOUNTID: inputData.ACCOUNTID,
          LASTNAME: inputData.LASTNAME,
          FIRSTNAME: inputData.FIRSTNAME,
          SALUTATION: inputData.SALUTATION,
          NAME: inputData.NAME,
          PHONE: inputData.PHONE,
          EMAIL: inputData.EMAIL,
          BIRTHDATE: inputData.BIRTHDATE,
          HED__ALTERNATEEMAIL__C: inputData.HED__ALTERNATEEMAIL__C,
        });
        newContactDetails.save(function (err, data) {
          if (err) {
            return res.status(400).json({
              message: "Database error",
              type: "error",
              data: err,
            });
          } else {
            return res.status(201).json({
              message: "New Contact added",
              type: "success",
              data: data,
            });
          }
        });
      }
    } else if (req.query.type == "courseConnection") {
      let courseConnectionModel = dbConnection.model(
        "courseconnections",
        CourseConnectionSchema
      );
      courseConnectionModel.find({}, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Course Connection does not exist",
          });
        }
      });
    } else if (req.query.type == "courseOffer") {
      let courseOfferModel = dbConnection.model(
        "courseoffers",
        CourseOfferSchema
      );
      courseOfferModel.find({}, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Course Offer does not exist",
          });
        }
      });
    } else if (req.query.type == "courses") {
      let CourseModel = dbConnection.model("courses", CourseSchema);
      CourseModel.find({}, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Course does not exist",
          });
        }
      });
    } else if (req.query.type == "planRequirement") {
      let planRequirementModel = dbConnection.model(
        "planrequirements",
        PlanRequirementSchema
      );
      planRequirementModel.find({}, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Plan Requirement does not exist",
          });
        }
      });
    } else if (req.query.type == "programEnrollment") {
      let programEnrollmentModel = dbConnection.model(
        "programenrollments",
        ProgramEnrollmentSchema
      );
      programEnrollmentModel.find({}, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Program Enrollment does not exist",
          });
        }
      });
    } else if (req.query.type == "programPlan") {
      let programPlanModel = dbConnection.model(
        "programplan",
        ProgramPlanSchema
      );
      programPlanModel.find({}, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Program Plan does not exist",
          });
        }
      });
    } else if (req.query.type == "contactRelation") {
      let contactRelationModel = dbConnection.model(
        "contactrelation",
        ContactRelationSchema
      );
      contactRelationModel.find({}, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Contact Relation does not exist",
          });
        }
      });
    } else if (req.query.type == "terms") {
      let termModel = dbConnection.model("terms", TermSchema);
      termModel.find({}, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Term does not exist",
          });
        }
      });
    } else {
      return res.status(404).json({
        status: "failure",
        message: "Please mention Masters Type in Params",
      });
    }
  } else {
    res.status(404).json({
      status: "failed",
      message: "Please pass type in params",
    });
  }
}

async function getMasterDetails(req, res) {
  let id = req.params.id;
  if (req.query.type) {
    let dbConnection = await createDatabase("ken42", process.env.database);
    if (req.query.type == "accounts") {
      let accountModel = dbConnection.model("accounts", AccountSchema);
      accountModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Account does not exist" });
        }
      });
    } else if (req.query.type == "contacts") {
      let contactModel = dbConnection.model("contacts", ContactSchema);
      contactModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else if (req.query.type == "courseConnection") {
      let courseConnectionModel = dbConnection.model(
        "courseconnections",
        CourseConnectionSchema
      );
      courseConnectionModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else if (req.query.type == "courseOffer") {
      let courseOfferModel = dbConnection.model(
        "courseoffers",
        CourseOfferSchema
      );
      courseOfferModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else if (req.query.type == "courses") {
      let CourseModel = dbConnection.model("courses", CourseSchema);
      CourseModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else if (req.query.type == "planRequirement") {
      let planRequirementModel = dbConnection.model(
        "planrequirements",
        PlanRequirementSchema
      );
      planRequirementModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else if (req.query.type == "programEnrollment") {
      let programEnrollmentModel = dbConnection.model(
        "programenrollments",
        ProgramEnrollmentSchema
      );
      programEnrollmentModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else if (req.query.type == "programPlan") {
      let programPlanModel = dbConnection.model(
        "programplan",
        ProgramPlanSchema
      );
      programPlanModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else if (req.query.type == "contactRelation") {
      let contactRelationModel = dbConnection.model(
        "contactrelation",
        ContactRelationSchema
      );
      contactRelationModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else if (req.query.type == "terms") {
      let termModel = dbConnection.model("terms", TermSchema);
      termModel.findById(id, function (err, doc) {
        if (doc) {
          return res.status(200).json({ status: "success", data: doc });
        } else {
          return res
            .status(400)
            .json({ status: "failure", message: "Data does not exist" });
        }
      });
    } else {
      return res.status(404).json({
        status: "failure",
        message: "Please mention Masters Type in Params",
      });
    }
  } else {
    res.status(404).json({
      status: "failed",
      message: "Please pass type in params",
    });
  }
}

async function updateMasterDetails(req, res) {
  let id = req.params.id;
  if (req.query.type) {
    let dbConnection = await createDatabase("ken42", process.env.database);
    if (req.query.type == "accounts") {
      let accountModel = dbConnection.model("accounts", AccountSchema);
      accountModel.updateOne({ _id: id }, req.body, function (err, doc) {
        if (doc.nModified) {
          return res.status(200).json({
            status: "success",
            message: "Data has been updated successfully",
          });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Unable to update the data",
            Error: err,
          });
        }
      });
    } else if (req.query.type == "contacts") {
      let contactModel = dbConnection.model("contacts", ContactSchema);
      contactModel.updateOne({ _id: id }, req.body, function (err, doc) {
        if (doc.nModified) {
          return res.status(200).json({
            status: "success",
            message: "Data has been updated successfully",
          });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Unable to update the data",
            Error: err,
          });
        }
      });
    } else if (req.query.type == "courseConnection") {
      let courseConnectionModel = dbConnection.model(
        "courseconnections",
        CourseConnectionSchema
      );
      courseConnectionModel.updateOne(
        { _id: id },
        req.body,
        function (err, doc) {
          if (doc.nModified) {
            return res.status(200).json({
              status: "success",
              message: "Data has been updated successfully",
            });
          } else {
            return res.status(400).json({
              status: "failure",
              message: "Unable to update the data",
              Error: err,
            });
          }
        }
      );
    } else if (req.query.type == "courseOffer") {
      let courseOfferModel = dbConnection.model(
        "courseoffers",
        CourseOfferSchema
      );
      courseOfferModel.updateOne({ _id: id }, req.body, function (err, doc) {
        if (doc.nModified) {
          return res.status(200).json({
            status: "success",
            message: "Data has been updated successfully",
          });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Unable to update the data",
            Error: err,
          });
        }
      });
    } else if (req.query.type == "courses") {
      let CourseModel = dbConnection.model("courses", CourseSchema);
      CourseModel.updateOne({ _id: id }, req.body, function (err, doc) {
        if (doc.nModified) {
          return res.status(200).json({
            status: "success",
            message: "Data has been updated successfully",
          });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Unable to update the data",
            Error: err,
          });
        }
      });
    } else if (req.query.type == "planRequirement") {
      let planRequirementModel = dbConnection.model(
        "planrequirements",
        PlanRequirementSchema
      );
      planRequirementModel.updateOne(
        { _id: id },
        req.body,
        function (err, doc) {
          if (doc.nModified) {
            return res.status(200).json({
              status: "success",
              message: "Data has been updated successfully",
            });
          } else {
            return res.status(400).json({
              status: "failure",
              message: "Unable to update the data",
              Error: err,
            });
          }
        }
      );
    } else if (req.query.type == "programEnrollment") {
      let programEnrollmentModel = dbConnection.model(
        "programenrollments",
        ProgramEnrollmentSchema
      );
      programEnrollmentModel.updateOne(
        { _id: id },
        req.body,
        function (err, doc) {
          if (doc.nModified) {
            return res.status(200).json({
              status: "success",
              message: "Data has been updated successfully",
            });
          } else {
            return res.status(400).json({
              status: "failure",
              message: "Unable to update the data",
              Error: err,
            });
          }
        }
      );
    } else if (req.query.type == "programPlan") {
      let programPlanModel = dbConnection.model(
        "programplan",
        ProgramPlanSchema
      );
      programPlanModel.updateOne({ _id: id }, req.body, function (err, doc) {
        if (doc.nModified) {
          return res.status(200).json({
            status: "success",
            message: "Data has been updated successfully",
          });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Unable to update the data",
            Error: err,
          });
        }
      });
    } else if (req.query.type == "contactRelation") {
      let contactRelationModel = dbConnection.model(
        "contactrelation",
        ContactRelationSchema
      );
      contactRelationModel.updateOne(
        { _id: id },
        req.body,
        function (err, doc) {
          if (doc.nModified) {
            return res.status(200).json({
              status: "success",
              message: "Data has been updated successfully",
            });
          } else {
            return res.status(400).json({
              status: "failure",
              message: "Unable to update the data",
              Error: err,
            });
          }
        }
      );
    } else if (req.query.type == "terms") {
      let termModel = dbConnection.model("terms", TermSchema);
      termModel.updateOne({ _id: id }, req.body, function (err, doc) {
        if (doc.nModified) {
          return res.status(200).json({
            status: "success",
            message: "Data has been updated successfully",
          });
        } else {
          return res.status(400).json({
            status: "failure",
            message: "Unable to update the data",
            Error: err,
          });
        }
      });
    } else {
      return res.status(404).json({
        status: "failure",
        message: "Please mention Masters Type in Params",
      });
    }
  } else {
    res.status(404).json({
      status: "failed",
      message: "Please pass type in params",
    });
  }
}

async function mergeAllDataold(req, res) {
  let dbConnection = await createDatabase(
    "zqken42",
    process.env.profilewise_mongoDbUrl
  );
  let contactModel = dbConnection.model("contacts", ContactSchema);
  let accountModel = dbConnection.model("accounts", AccountSchema);
  let contactRelationModel = dbConnection.model(
    "contactrelations",
    ContactRelationSchema
  );
  let cby = mongoose.Types.ObjectId();
  let dbConnectionp = await createDatabase(
    "zqken42u",
    process.env.profilewise_mongoDbUrl
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
  let programEnrollModel = dbConnection.model(
    "programenrollments",
    ProgramEnrollmentSchema
  );
  let allcontacts = await contactModel.find({});
  let contactRelation = await contactRelationModel.find({});
  // let pgenrolls = await programEnrollModel.find({})
  let count = 0;
  let regids = [];
  let forcount = 1;
  var forloop = new Promise((resolve, reject) => {
    contactRelation.forEach(async function (item) {
      let std = await contactModel.findOne({ ID: item.HED__CONTACT__C });
      let gardd = [];
      if (std) {
        let pgenroll = await programEnrollModel.find({
          HED__CONTACT__C: item.HED__CONTACT__C,
        });
        // let gardians = await contactRelationModel.find({ HED__CONTACT__C: item.HED__CONTACT__C })
        let lengthg = 1;
        // let gar = await allcontacts.find({ ID: gardians[0].HED__RELATEDCONTACT__C })
        var guardid = mongoose.Types.ObjectId();
        gardd.push(guardid);
        if (
          pgenroll.length > 0 &&
          gardd.length > 0 &&
          !regids.includes(item.HED__CONTACT__C)
        ) {
          regids.push(item.HED__CONTACT__C);
          count++;
          console.log({
            displayName: `ST_${
              String(count).length == 1
                ? "00"
                : String(count).length == 2
                ? "0"
                : ""
            }${Number(count) + 1}`,
            instituteId: std.ACCOUNTID,
            regId: item.HED__CONTACT__C,
            salutation: std.SALUTATION,
            category: "",
            firstName: std.FIRSTNAME,
            middleName: std.MIDDLENAME,
            lastName: std.LASTNAME,
            guardianDetails: gardd,
            gender: std.GENDER,
            dob: std.BIRTHDATE,
            admittedOn: std.ADMITTEDON,
            programPlanId: pgenroll[0].HED__PROGRAM_PLAN__C,
            feeStructureId: null,
            phoneNo: std.PHONE,
            email: std.EMAIL,
            alternateEmail: std.HED__ALTERNATEEMAIL__C,
            addressDetails: {
              address1: null,
              address2: null,
              address3: null,
              city: null,
              state: null,
              country: null,
              pincode: null,
            },
            createdBy: cby,
            status: 1,
          });
          let studentDetails = new studentModel({
            displayName: `ST_${
              String(count).length == 1
                ? "00"
                : String(count).length == 2
                ? "0"
                : ""
            }${Number(count) + 1}`,
            instituteId: std.ACCOUNTID,
            regId: item.HED__CONTACT__C,
            salutation: std.SALUTATION,
            category: "",
            firstName: std.FIRSTNAME,
            middleName: std.MIDDLENAME,
            lastName: std.LASTNAME,
            guardianDetails: gardd,
            gender: std.GENDER,
            dob: std.BIRTHDATE,
            admittedOn: std.ADMITTEDON,
            programPlanId: pgenroll[0]._id,
            feeStructureId: null,
            phoneNo: std.PHONE,
            email: std.EMAIL,
            alternateEmail: std.HED__ALTERNATEEMAIL__C,
            addressDetails: {
              address1: null,
              address2: null,
              address3: null,
              city: null,
              state: null,
              country: null,
              pincode: null,
            },
            createdBy: cby,
            status: 1,
          });
          await studentDetails.save();
        }
      }
      if (forcount == contactRelation.length) {
        resolve(
          res.status(201).json({
            message: "New Accounts added",
            type: "success",
            data: docs,
            count: docs.length,
          })
        );
      }
    });
  });

  // forloop.then(() => {
  //     console.log("done for loop")
  //     studentModel.insertMany(studentDetails, { unique: true }, function (
  //         error,
  //         docs
  //     ) {
  //         if (error) {
  //             if (error.name === "BulkWriteError" && error.code === 11000) {
  //                 // Duplicate username
  //                 return res.status(200).json({
  //                     success: true,
  //                     message: "Students already exist!",
  //                     count: 0,
  //                 });
  //             }
  //             return res.status(400).json({
  //                 message: "Database Error",
  //                 type: "error",
  //                 data: error,
  //             });
  //         } else {
  //             return res.status(201).json({
  //                 message: "New Accounts added",
  //                 type: "success",
  //                 data: docs,
  //                 count: docs.length,
  //             }); // Success
  //         }
  //     });
  // })
}
async function mergeAllData(req, res) {
  let orgId = req.query.orgId;
  let dbConnection = await createDatabase(
    "zqken42",
    "mongodb://localhost:27017"
  );
  console.log("mongodb://localhost:27017");
  let contactModel = dbConnection.model("contacts", ContactSchema);
  let accountModel = dbConnection.model("accounts", AccountSchema);
  let contactRelationModel = dbConnection.model(
    "contactrelations",
    ContactRelationSchema
  );
  let cby = mongoose.Types.ObjectId();
  let dbConnectionp = await createDatabase(
    "zqken42u",
    "mongodb://localhost:27017"
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let guardianSchema = dbConnectionp.model("guardian", GuardianSchema);
  // let programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
  let programEnrollModel = dbConnection.model(
    "programenrollments",
    ProgramEnrollmentSchema
  );
  let guardians = [];
  let students = [];
  let existstd = [];
  let count = 0;
  let programPlanModel2 = dbConnectionp.model(
    "programplans",
    ProgramPlanSchema
  );
  programPlanModel2.find({}, async function (err, pplans) {
    contactModel.find({}, async function (err2, scontacts) {
      programEnrollModel.find({}, async function (err3, pgenrolls) {
        contactRelationModel.find({}, async function (err4, contactrelation) {
          // console.log(contactrelation.length)
          for (let i = 0; i < contactrelation.length; i++) {
            let pplan;
            let pgenroll = await pgenrolls.find(
              (itemp) =>
                itemp.HED__CONTACT__C == contactrelation[i].HED__CONTACT__C
            );
            let scontact = await scontacts.find(
              (itemc) => itemc.ID == contactrelation[i].HED__CONTACT__C
            );
            let guard = await scontacts.find(
              (itemc) => itemc.ID == contactrelation[i].HED__RELATEDCONTACT__C
            );
            if (
              guard &&
              pgenroll &&
              scontact &&
              !existstd.includes(contactrelation[i].HED__CONTACT__C)
            ) {
              existstd.push(contactrelation[i].HED__CONTACT__C);
              console.log(pgenroll.HED__PROGRAM_PLAN__C);
              pplan = await pplans.find(
                (itempp) =>
                  itempp._doc.programCode == pgenroll.HED__PROGRAM_PLAN__C
              );
              console.log(pplan);
              count++;
              let newguard = new guardianSchema({
                isPrimary: true,
                firstName: guard.FIRSTNAME,
                lastName: guard.LASTNAME,
                mobile: guard.PHONE,
                email: guard.EMAIL,
                relation: contactrelation[i].HED__TYPE__C,
                createdBy: orgId,
                status: 1,
              });
              let newstd = studentModel({
                displayName: `ST_${
                  String(count).length == 1
                    ? "00"
                    : String(count).length == 2
                    ? "0"
                    : ""
                }${Number(count) + 1}`,
                instituteId: scontact.ACCOUNTID,
                regId: scontact.ID,
                salutation: scontact.SALUTATION,
                category: "",
                firstName: scontact.FIRSTNAME,
                middleName: scontact.MIDDLENAME,
                lastName: scontact.LASTNAME,
                guardianDetails: [newguard._id],
                gender: scontact.GENDER,
                dob: scontact.BIRTHDATE,
                admittedOn: scontact.ADMITTEDON,
                programPlanId: pplan._id,
                programPlanCode: pplan._doc.programCode,
                programPlanTitle: pplan._doc.title,
                feeStructureId: null,
                phoneNo: scontact.PHONE,
                email: scontact.EMAIL,
                parentName: `${guard.FIRSTNAME} ${guard.LASTNAME}`,
                parentPhone: `${guard.PHONE}`,
                parentEmail: `${guard.EMAIL}`,
                relation: `${contactrelation[i].HED__TYPE__C}`,
                alternateEmail: scontact.HED__ALTERNATEEMAIL__C,
                addressDetails: {
                  address1: null,
                  address2: null,
                  address3: null,
                  city: null,
                  state: null,
                  country: null,
                  pincode: null,
                },
                createdBy: orgId,
                status: 1,
              });
              await newguard.save();
              await newstd.save();
              if (i + 1 == contactrelation.length) {
                res.send("student uploaded successfully");
              }
            } else {
              if (i + 1 == contactrelation.length) {
                res.send("student uploaded successfully");
              }
            }
          }
        });
      });
    });
  });
}
async function addinsttutePplans(req, res) {
  console.log("merge institute");
  let dbConnection = await createDatabase(
    "zqken42",
    "mongodb://localhost:27017"
  );
  let dbConnectionp = await createDatabase(
    "zqken42u",
    "mongodb://localhost:27017"
  );
  let accountModel = dbConnection.model("accounts", AccountSchema);
  let programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
  let programPlanModelk = dbConnectionp.model(
    "programplans",
    ProgramPlanSchemaa
  );
  let institutionModel = dbConnectionp.model(
    "instituteDetails",
    instituteDetailsSchema
  );
  let accdata = await accountModel.find({});
  let ppdata = await programPlanModel.find({});
  let institutes = [];
  let programPlans = [];
  let icount = 1;
  let ppcount = 1;
  accdata.forEach(async function (item) {
    let institute = new institutionModel({
      legalName: item.NAME,
      id: item.ID,
      hcode: item.HED__SCHOOL_CODE__C,
      dateOfRegistration: "",
      legalAddress: {
        address1: "",
        address2: "",
        address3: "",
        city: "",
        state: "",
        country: "",
        pincode: "",
      },
      financialDetails: {
        GSTIN: "",
        PAN: "",
      },
      bankDetails: [
        {
          bankName: "",
          bankAccountName: "",
          bankAccountNumber: "",
          bankIFSC: "",
        },
      ],
      instituteContact: [
        {
          contactname: "",
          designation: "",
          department: "",
          emailAddress: "",
          phoneNumber: "",
          mobileNumber: "",
        },
      ],
    });
    institutes.push(institute);
    if (icount == accdata.length) {
      let count = 0;
      ppdata.forEach(async function (item) {
        let insti = institutes.find(
          (itemi) => itemi.id == item.HED__ACCOUNT__C
        );
        var b = item.NAME.split("-")[0];
        var c = b.substring(2);
        var d = parseInt(c) + 1;
        let pplan = new programPlanModelk({
          displayName: `PP_${
            String(count).length == 1
              ? "00"
              : String(count).length == 2
              ? "0"
              : ""
          }${Number(count) + 1}`,
          programCode: item.ID,
          academicYear: `${b}-${d}`,
          title: item.NAME,
          description: item.NAME,
          createdBy: insti._id,
          status: "Active",
        });
        programPlans.push(pplan);
        if (ppcount == ppdata.length) {
          console.log("prograplans", programPlans, "institutes", institutes);
          institutionModel.insertMany(
            institutes,
            async function (error1, docs1) {
              if (error1) {
                res.status(500).send({
                  status: "failure",
                  Message: "Get uploaded records",
                  data: error1.toString(),
                });
              } else {
                programPlanModelk.insertMany(
                  programPlans,
                  async function (error2, docs2) {
                    if (error2) {
                      res.status(500).send({
                        status: "failure",
                        Message: "Get uploaded records",
                        data: error2.toString(),
                      });
                    } else {
                      res.header("Access-Control-Allow-Origin", "*");
                      res.header(
                        "Access-Control-Allow-Methods",
                        "GET,HEAD,OPTIONS,POST,PUT"
                      );
                      res.header(
                        "Access-Control-Allow-Headers",
                        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
                      );
                      res.status(201).send({
                        status: "success",
                        Message: "Get uploaded records",
                        data: { institute: docs1, programPlans: docs2 },
                      });
                    }
                  }
                );
              }
            }
          );
        }
        ppcount++;
        count++;
      });
    }
    icount++;
  });
}
async function mapAllData(
  accdata,
  ppdatas,
  contacts,
  contactrelations,
  orgId,
  headid,
  res
) {
  // let AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=vksdata;AccountKey=8ZUER1NJE8gVZoC3w6mrknXHnXJXFr2uII7ObvZy45ARpoRxRmLGJ9EbRI2kc1/XIOKyEP/J5PHh/Zlcu2bOcw==;EndpointSuffix=core.windows.net";
  const blobServiceClient = await BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING
  );
  const containerClient = await blobServiceClient.getContainerClient(
    "vksexcels"
  );
  // const createContainerResponse = await containerClient.create();
  // console.log("Container was created successfully. requestId: ", createContainerResponse.requestId);

  let counti = 0;
  let existstd = [];
  let filenames = [];
  let files = [];
  let months = [
    "First",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  // res.send(contacts)
  return new Promise(async function (resolve, reject) {
    // for (let i = 0; i < accdata.length; i++) {
    let accid = await accdata.find((item) => item.ID == headid);
    counti++;
    var workbook = new excell.Workbook();
    var worksheet = workbook.addWorksheet("Institute Details ");
    var ppsheet = workbook.addWorksheet("Program Plan");
    var ftsheet = workbook.addWorksheet("Fee Type");
    var payschsheet = workbook.addWorksheet("Payment Schedule");
    var remplansheet = workbook.addWorksheet("Reminder Plan");
    var latefeesheet = workbook.addWorksheet("Late Fee Plan");
    var installplansheet = workbook.addWorksheet("Installment plan");
    var catplansheet = workbook.addWorksheet("Category Plan");
    var concessionsheet = workbook.addWorksheet("Concession Plan");
    var feemanagersheet = workbook.addWorksheet("Fee Manager");
    var feestrsheet = workbook.addWorksheet("Fee Structure");
    var stdsheet = workbook.addWorksheet("Student Details");
    var styleb = workbook.createStyle({
      font: {
        color: "#000000",
        size: 12,
        bold: true,
        name: "Calibri",
      },
      numberFormat: "@",
    });
    var style = workbook.createStyle({
      font: {
        color: "#000000",
        size: 11,
        bold: false,
        name: "Arial",
      },
      numberFormat: "@",
    });
    //institute details sheet
    worksheet.cell(1, 1).string("Educational Institute Details").style(styleb);
    worksheet.cell(2, 1).string("Legal Name").style(styleb);
    worksheet
      .cell(3, 1)
      .string("Legal Name of the Institute/Trust *")
      .style(style);
    worksheet.cell(3, 2).string(accid.NAME.toString()).style(style);
    //   worksheet.cell(3, 2).string("Institute Id").style(style);
    //   worksheet.cell(3, 2).string(accdata[j].NAME).style(style);
    //   id: accdata[j].ID,
    //     hcode: accdata[j].HED__SCHOOL_CODE__C,
    worksheet.cell(4, 1).string("Date Of Registration").style(style);
    worksheet.cell(5, 1).string("Legal Address").style(styleb);
    worksheet.cell(6, 1).string("Address 1").style(style);
    worksheet.cell(7, 1).string("Address 2").style(style);
    worksheet.cell(8, 1).string("Address 3").style(style);
    worksheet.cell(9, 1).string("City/Town").style(style);
    worksheet.cell(10, 1).string("State").style(style);
    worksheet.cell(11, 1).string("Country").style(style);
    worksheet.cell(12, 1).string("Pincode").style(style);
    worksheet.cell(13, 1).string("GST & PAN").style(styleb);
    worksheet.cell(14, 1).string("GSTIN").style(style);
    worksheet.cell(15, 1).string("PAN *").style(style);
    worksheet.cell(16, 1).string("Bank Details 1").style(styleb);
    worksheet.cell(17, 1).string("Bank Name").style(style);
    worksheet.cell(18, 1).string("Bank Account Name").style(style);
    worksheet.cell(19, 1).string("Bank Accunt Number").style(style);
    worksheet.cell(20, 1).string("Bank IFSC").style(style);
    worksheet.cell(21, 1).string("Bank Details 2").style(styleb);
    worksheet.cell(22, 1).string("Bank Name").style(style);
    worksheet.cell(23, 1).string("Bank Account Name").style(style);
    worksheet.cell(24, 1).string("Bank Accunt Number").style(style);
    worksheet.cell(25, 1).string("Bank IFSC").style(style);
    worksheet.cell(26, 1).string(" ").style(style);
    worksheet.cell(27, 1).string("Institute Contact Details 1").style(styleb);
    worksheet.cell(28, 1).string("Contact Name *").style(style);
    worksheet.cell(29, 1).string("Designation").style(style);
    worksheet.cell(30, 1).string("Department").style(style);
    worksheet.cell(31, 1).string("Email Address *").style(style);
    worksheet.cell(32, 1).string("Phone Number").style(style);
    worksheet.cell(33, 1).string("Mobile Number").style(style);
    worksheet.cell(34, 1).string("Institute Contact Details 2").style(styleb);
    worksheet.cell(35, 1).string("Contact Name").style(style);
    worksheet.cell(36, 1).string("Designation").style(style);
    worksheet.cell(37, 1).string("Department").style(style);
    worksheet.cell(38, 1).string("Email Address").style(style);
    worksheet.cell(39, 1).string("Phone Number").style(style);
    worksheet.cell(40, 1).string("Mobile Number").style(style);
    //fee type sheet
    ftsheet.cell(1, 1).string("ID *").style(styleb);
    ftsheet.cell(1, 2).string("Fee Type *").style(styleb);
    ftsheet.cell(1, 3).string("Description").style(styleb);
    ftsheet.cell(1, 4).string("Status").style(styleb);
    //payment schedule sheet
    payschsheet.cell(1, 1).string("ID *").style(styleb);
    payschsheet.cell(1, 2).string("Title").style(styleb);
    payschsheet.cell(1, 3).string("Description").style(styleb);
    payschsheet.cell(1, 4).string("Collection period").style(styleb);
    payschsheet.cell(1, 5).string("Due By").style(styleb);
    payschsheet.cell(1, 6).string("Period").style(styleb);
    payschsheet.cell(1, 7).string("Percentage").style(styleb);
    payschsheet.cell(1, 8).string("Status").style(styleb);
    //reminder plan sheet
    remplansheet.cell(1, 1).string("ID *").style(styleb);
    remplansheet.cell(1, 2).string("Title").style(styleb);
    remplansheet.cell(1, 3).string("Description").style(styleb);
    remplansheet.cell(1, 4).string("No. of Reminders").style(styleb);
    remplansheet.cell(1, 5).string("Days Before Due Date").style(styleb);
    remplansheet.cell(1, 6).string("Days After Demand Note").style(styleb);
    remplansheet.cell(1, 7).string("Days After 1st Reminder").style(styleb);
    remplansheet.cell(1, 8).string("Days After 2nd Reminder").style(styleb);
    remplansheet.cell(1, 9).string("Status").style(styleb);
    //late fee plan sheet
    latefeesheet.cell(1, 1).string("ID *").style(styleb);
    latefeesheet.cell(1, 2).string("Title").style(styleb);
    latefeesheet.cell(1, 3).string("Description").style(styleb);
    latefeesheet.cell(1, 4).string("Type").style(styleb);
    latefeesheet.cell(1, 5).string("Charges").style(styleb);
    latefeesheet.cell(1, 6).string("Frequency").style(styleb);
    latefeesheet.cell(1, 7).string("Status").style(styleb);
    //installment plan sheet
    installplansheet.cell(1, 1).string("ID").style(styleb);
    installplansheet.cell(1, 2).string("Title").style(styleb);
    installplansheet.cell(1, 3).string("Description").style(styleb);
    installplansheet.cell(1, 4).string("No. of Installments").style(styleb);
    installplansheet.cell(1, 5).string("Frequency").style(styleb);
    installplansheet.cell(1, 6).string("Due Date").style(styleb);
    installplansheet.cell(1, 7).string("Status").style(styleb);
    //category plan sheet
    catplansheet.cell(1, 1).string("ID").style(styleb);
    catplansheet.cell(1, 2).string("Title").style(styleb);
    catplansheet.cell(1, 3).string("Description").style(styleb);
    catplansheet.cell(1, 4).string("Status").style(styleb);
    //concession plan sheet
    concessionsheet.cell(1, 1).string("ID").style(styleb);
    concessionsheet.cell(1, 2).string("Title").style(styleb);
    concessionsheet.cell(1, 3).string("Description").style(styleb);
    concessionsheet.cell(1, 4).string("Category Id").style(styleb);
    concessionsheet.cell(1, 5).string("Concession Type").style(styleb);
    concessionsheet.cell(1, 6).string("Concession Value").style(styleb);
    concessionsheet.cell(1, 7).string("Status").style(styleb);
    //fee manager sheet
    feemanagersheet.cell(1, 1).string("ID *").style(styleb);
    feemanagersheet.cell(1, 2).string("Title *").style(styleb);
    feemanagersheet.cell(1, 3).string("Description").style(styleb);
    feemanagersheet.cell(1, 4).string("Program Plan Id *").style(styleb);
    feemanagersheet.cell(1, 5).string("Fee Type Id *").style(styleb);
    feemanagersheet.cell(1, 6).string("Payment Schedule ID *").style(styleb);
    feemanagersheet.cell(1, 7).string("Reminder Plan ID *").style(styleb);
    feemanagersheet.cell(1, 8).string("Late Fee Plan ID *").style(styleb);
    feemanagersheet.cell(1, 9).string("Installment ID").style(styleb);
    feemanagersheet.cell(1, 10).string("Concession ID").style(styleb);
    feemanagersheet.cell(1, 11).string("Total Fees *").style(styleb);
    feemanagersheet.cell(1, 12).string("Status").style(styleb);
    //fee structure sheet
    feestrsheet.cell(1, 1).string("ID *").style(styleb);
    feestrsheet.cell(1, 2).string("Title *").style(styleb);
    feestrsheet.cell(1, 3).string("Description").style(styleb);
    feestrsheet.cell(1, 4).string("Fee Types *").style(styleb);
    feestrsheet.cell(1, 5).string("Status").style(styleb);
    //student details sheet
    stdsheet.cell(1, 1).string("Reg ID *").style(styleb);
    stdsheet.cell(1, 2).string("Program Plan ID").style(styleb);
    stdsheet.cell(1, 3).string("First Name *").style(styleb);
    stdsheet.cell(1, 5).string("Last Name *").style(styleb);
    stdsheet.cell(1, 6).string("Category").style(styleb);
    stdsheet.cell(1, 7).string("Email Address *").style(styleb);
    stdsheet.cell(1, 8).string("Phone Number *").style(styleb);
    stdsheet.cell(1, 9).string("DOB").style(styleb);
    stdsheet.cell(1, 10).string("Gender").style(styleb);
    stdsheet.cell(1, 11).string("Admitted Date ").style(styleb);
    stdsheet.cell(1, 12).string("Address 1").style(styleb);
    stdsheet.cell(1, 13).string("Address 2").style(styleb);
    stdsheet.cell(1, 14).string("Address 3").style(styleb);
    stdsheet.cell(1, 15).string("City/Town").style(styleb);
    stdsheet.cell(1, 16).string("State").style(styleb);
    stdsheet.cell(1, 17).string("PIN Code").style(styleb);
    stdsheet.cell(1, 18).string("Country").style(styleb);
    stdsheet.cell(1, 19).string("Parent Name").style(styleb);
    stdsheet.cell(1, 20).string("Parent Email Address").style(styleb);
    stdsheet.cell(1, 21).string("Parent Phone Number").style(styleb);
    stdsheet.cell(1, 22).string("Fee Structure ID *").style(styleb);
    stdsheet.cell(1, 23).string("Institute ID").style(styleb);
    stdsheet.cell(1, 24).string("Status").style(styleb);
    // console.log(accdata[i].ID)

    //program plan sheet
    let ppdata = await ppdatas.find((item) => item.HED__ACCOUNT__C == headid);
    //   for(let j=0;j<ppdata.length;j++){
    //       if(j==0){
    if (ppdata) {
      ppsheet.cell(1, 1).string("Program Code *").style(styleb);
      ppsheet.cell(1, 2).string("Program Name *").style(styleb);
      ppsheet.cell(1, 3).string("Description ").style(styleb);
      ppsheet.cell(1, 4).string("From Date").style(styleb);
      ppsheet.cell(1, 5).string("To Date").style(styleb);
      ppsheet.cell(1, 6).string("Status").style(styleb);
      //   }
      let stds = ppdata.HED__START_DATE__C.split("-");
      let eds = ppdata.HED__END_DATE__C.split("-");
      ppsheet.cell(2, 1).string(ppdata.ID).style(style);
      ppsheet.cell(2, 2).string(ppdata.NAME).style(style);
      ppsheet.cell(2, 3).string(ppdata.NAME).style(style);
      ppsheet
        .cell(2, 4)
        .string(`${stds[2]} ${months[Number(stds[1])]} ${stds[0]}`)
        .style(style);
      ppsheet
        .cell(2, 5)
        .string(`${eds[2]} ${months[Number(eds[1])]} ${eds[0]}`)
        .style(style);
      // ppsheet.cell(2, 4).string(`${months[Number(stds[1])]} ${stds[0]}-${months[Number(eds[1])]} ${eds[0]}`).style(style);
      ppsheet.cell(2, 6).string("Active").style(style);
    } else {
      ppdata = { ID: "NA" };
      ppsheet.cell(1, 1).string("Program Code *").style(styleb);
      ppsheet.cell(1, 2).string("Program Name *").style(styleb);
      ppsheet.cell(1, 3).string("Description ").style(styleb);
      ppsheet.cell(1, 4).string("From Date").style(styleb);
      ppsheet.cell(1, 5).string("To Date").style(styleb);
      ppsheet.cell(1, 6).string("Status").style(styleb);
      //   }
    }

    //   }
    let count = 0;
    // console.log("length",contactrelations.length)
    let stdcound = 1;
    for (let j = 0; j < contactrelations.length; j++) {
      count++;
      // let ind = j
      // console.log(contactrelations[j])
      var std = await contacts.find(
        (item) => item.ID == contactrelations[j].HED__CONTACT__C
      );
      // console.log(std)
      var guard = await contacts.find(
        (item) => item.ID == contactrelations[j].HED__RELATEDCONTACT__C
      );
      // console.log(guard)
      if (std) {
        if (!existstd.includes(std.ID) && std.ACCOUNTID == accid.ID) {
          // console.log(std)
          stdcound++;
          existstd.push(std.ID);
          stdsheet.cell(stdcound, 1).string(std.ID.toString()).style(style);
          stdsheet.cell(stdcound, 2).string(ppdata.ID).style(style);
          stdsheet
            .cell(stdcound, 3)
            .string(std.FIRSTNAME.toString())
            .style(style);
          stdsheet.cell(stdcound, 4).string("NA").style(style);
          stdsheet
            .cell(stdcound, 5)
            .string(std.LASTNAME.toString())
            .style(style);
          stdsheet.cell(stdcound, 6).string("NA").style(style);
          stdsheet.cell(stdcound, 7).string(std.EMAIL.toString()).style(style);
          stdsheet.cell(stdcound, 8).string(std.PHONE.toString()).style(style);
          stdsheet
            .cell(stdcound, 9)
            .string(std.BIRTHDATE.toString())
            .style(style);
          stdsheet.cell(stdcound, 10).string("NA").style(style);
          stdsheet.cell(stdcound, 11).string("NA").style(style);
          stdsheet.cell(stdcound, 12).string("NA").style(style);
          stdsheet.cell(stdcound, 13).string("NA").style(style);
          stdsheet.cell(stdcound, 14).string("NA").style(style);
          stdsheet.cell(stdcound, 15).string("NA").style(style);
          stdsheet.cell(stdcound, 16).string("NA").style(style);
          stdsheet.cell(stdcound, 17).string("NA").style(style);
          stdsheet.cell(stdcound, 18).string("NA").style(style);
          stdsheet
            .cell(stdcound, 19)
            .string(
              `${guard.FIRSTNAME.toString()} ${guard.LASTNAME.toString()}`
            )
            .style(style);
          stdsheet
            .cell(stdcound, 20)
            .string(guard.EMAIL.toString())
            .style(style);
          stdsheet
            .cell(stdcound, 21)
            .string(guard.PHONE.toString())
            .style(style);
          stdsheet.cell(stdcound, 22).string("NA").style(style);
          stdsheet.cell(stdcound, 23).string(accid.ID.toString()).style(style);
        }
      }
      if (count == contactrelations.length) {
        filename1 = "Ken42_" + accid.ID + ".xlsx";
        filenames.push(filename1);
        let bucket = "supportings";
        buffer = await workbook.writeToBuffer();
        // .then(async function (buffer) {
        let params = {
          Bucket: bucket,
          Key: filename1,
          ContentType: "application/octet-stream",
          Body: buffer, //Data of file to be uploaded in Binary String format
        };
        const blockBlobClient = await containerClient.getBlockBlobClient(
          filename1
        );
        const uploadBlobResponse = await blockBlobClient.upload(
          buffer,
          buffer.length
        );
        console.log(
          "Blob was uploaded successfully. requestId: ",
          uploadBlobResponse.requestId
        );
        // const uploadBlobResponse = await blockBlobClient.downloadToFile(buffer, buffer.length);
        // const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        console.log(
          "Blob was downloaded successfully. requestId: ",
          downloadBlockBlobResponse.requestId
        );
        // downloadBlockBlobResponse.readableStreamBody
        // buffer.pipe(blobSvc.createWriteStreamToBlockBlob('mycontainer',filename1,function(err,result){
        //     if(err){
        //         console.log(err)}
        //         else{
        //             console.log(result);
        resolve({
          status: "success",
          message: `Excel sheet created successfully for institute ${accid.NAME}`,
          filename: filename1,
          data:
            downloadBlockBlobResponse.originalResponse.readableStreamBody
              ._readableState.buffer,
        });
        //         }
        // }))
        // S3.putObject(params, async function (err, pres) {
        //     if (err) {
        //         console.log("Error uploading data: ", err);
        //         reject({ status: "failure" })
        //     } else {
        //         let url = await S3.getSignedUrl('getObject', { Bucket: params.Bucket, Key: params.Key })
        //             resolve({ status: "success", message: `Excel sheet created successfully for institute ${accid.NAME}`, data: url })
        //     }
        // })
      }
    }
  });
}
async function addStudent(req, res) {
  let dbConnection = await createDatabase(
    "zqken42",
    process.env.profilewise_mongoDbUrl
  );
  let dbConnectionp = await createDatabase(
    "zqken42u",
    process.env.profilewise_mongoDbUrl
  );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let contactModel = dbConnection.model("contacts", ContactSchema);
  let accountModel = dbConnection.model("accounts", AccountSchema);

  let contactRelationModel = dbConnection.model(
    "contactrelations",
    ContactRelationSchema
  );
  let programPlanModel = dbConnection.model("programplans", ProgramPlanSchema);
  let contactRelation = await contactRelationModel.find({});
}
// A helper method used to read a Node.js readable stream into a string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

module.exports = {
  uploadMasterken42: uploadMasterken42,
  createMasterken42: createMasterken42,
  showAllMaster: showAllMaster,
  getMasterDetails: getMasterDetails,
  updateMasterDetails: updateMasterDetails,
  mergeAllData: mergeAllData,
  uploadMasterLink: uploadMasterLink,
  addinsttutePplans: addinsttutePplans,
};
