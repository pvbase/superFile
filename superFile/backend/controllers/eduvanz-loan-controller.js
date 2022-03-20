const { createDatabase } = require("../utils/db_creation");
const http = require("http");
const axios = require("axios");
const mongo = require("mongodb");
const sgMail = require("@sendgrid/mail");
const moment = require("moment");
const tinyUrl =
  "https://cwpjc8rnb2.execute-api.ap-south-1.amazonaws.com/prod/tiny/shorturl";
var FormData = require("form-data");
var uuid = require("uuid");

const orgListSchema = require("../models/orglists-schema");
const StudentSchema = require("../models/studentModel");
const GuardianSchema = require("../models/guardianModel");

async function eduvanzLoan(req, response) {
  const { orgId } = req.query;
  // const { type } = req.params;
  const inputData = req.body;

  let data = new FormData();
  data.append("meta_data", inputData.meta_data);
  // data.append('lead_id', inputData.lead_id)
  data.append("userName", process.env.eduvanzUsername);
  data.append("password", process.env.eduvanzPassword);
  data.append("redirect_url", "https://staging.eduvanz.com/login");
  // data.append('redirect_url', inputData.redirect_url)
  data.append("requestParam[client_institute_id]", orgId);
  data.append("requestParam[client_course_id]", inputData.courseId);
  data.append("requestParam[client_location_id]", inputData.locationId);
  data.append("requestParam[loan_amount]", inputData.loanAmount);
  data.append("requestParam[applicant][first_name]", inputData.firstName);
  data.append("requestParam[applicant][last_name", inputData.lastName);
  data.append("requestParam[applicant][dob]", inputData.dateOfBirth);
  data.append("requestParam[applicant][mobile_number]", inputData.phoneNo);
  data.append("requestParam[applicant][email_id]", inputData.email);
  data.append("requestParam[applicant][aadhar_no]", inputData.aadharNumber);
  data.append("requestParam[applicant][pan_no]", inputData.PAN);

  try {
    let res = await axios({
      method: "POST",
      url: `${process.env.eduvanceURL}/quickemi/login`,
      headers: { ...data.getHeaders() },
      data: data,
    });
    return response.send(res.data);
  } catch (err) {
    console.log("Error", err);
    return response.send(err);
  }
}
async function sendLoanProcessAPI(req, res) {
  let { orgId, regId } = req.query;
  try {
    // var dbUrl = req.headers.resource;

    const centralDbConnection = await createDatabase(
      `usermanagement-${process.env.stage}`,
      process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
      "orglists",
      orgListSchema,
      "orglists"
    );
    const orgData = await orgListModel.findOne({ _id: orgId });

    let dbConnection = await createDatabase(orgId, orgData.connUri);
    let studentModel = await dbConnection.model("students", StudentSchema);
    // let guardianModel = await dbConnection.model("guardian", GuardianSchema);

    let studentDetails = await studentModel.findOne({ regId: regId });
    // let guardianData = await guardianModel.findOne({ _id: studentDetails.guardianDetails[0], });

    // studentDetails['guardianDetails'] = guardianData._doc
    centralDbConnection.close();
    dbConnection.close() // new
    if (studentDetails) {
      res.status(200).json(studentDetails);
    } else {
      throw {
        message: "Student is not available",
        status: "failure",
      };
    }
  } catch (err) {
    centralDbConnection.close() // new
    dbConnection.close() // new
    return res.status(400).json(err);
  }
}
async function sendEduvanzLoanMail(req, res) {
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
  const orgData = await orgListModel.findOne({ _id: inputData.orgId });

  if (!orgData || orgData == null) {
    centralDbConnection.close();
    let Response = {
      status: "failure",
      message: "Organization data not found",
    };
    return Response;
  } else {
    let meta_data = uuid.v1();
    centralDbConnection.close();
    const orgNameSpace = orgData._doc.nameSpace;
    var tinyUri;
    const tinyUrlPayload = {
      Url: `${process.env.feeCollectionURL}${orgNameSpace}/redirectLoan?orgId=${inputData.orgId}&studentId=${inputData.regId}&eduvanzUserName=${process.env.eduvanzUsername}&eduvanzPassword=${process.env.eduvanzPassword}&meta_data=${meta_data}`,
      // Url: `${'http://localhost:3001/'}${orgNameSpace}/redirectLoan?orgId=${inputData.orgId}&studentId=${inputData.regId}&eduvanzUserName=${process.env.eduvanzUsername}&eduvanzPassword=${process.env.eduvanzPassword}&meta_data=${meta_data}`,
    };
    tinyUri = await axios.post(tinyUrl, tinyUrlPayload);
    console.log("tinyUri", tinyUri);
    const eduvanzTinyLink = tinyUri.data
      ? tinyUri.data.ShortUrl
      : tinyUrlPayload.Url;

    var body_text = `<p>We are glad to announce that you can pay the fees through Education Loan. We have partnered with Eduvanz for the same. 
            They bring tremendous benefit to you as a parent. <br>The details of the product can be found here: https://eduvanz.com</p>
             <p>Please click on the following button to start the loan process.</p>
            <button style="font-family: 'Google Sans';
            font-style: normal;
            font-weight: 600;
            height: 36px;
            padding: 0px 15px;
            font-size: 14px;
            line-height: 20px;
            display: flex;
            border-radius: 3px;
            background-color: #0052CC;
            align-items: center;
            justify-content: center;
            outline: none;
            border: none;
            cursor: pointer;
            color: #FFFFFF;"> 
            <a style="color: #FFFFFF;line-height: 36px;font-family: 'Google Sans';text-decoration:none;" href="${eduvanzTinyLink}"> Start Process 
            </a>
            </button>

            <p>Regards,</p>
            <p><strong>Fee collection Team</strong></p>
            <p>&nbsp;</p>`;

    var subject =
      "Happy to announce that you can pay fees using Educatonal Loan";
    var charset = "UTF-8";

    let sgKey = process.env.sendgridKey;
    sgMail.setApiKey(sgKey);

    console.log("sendgrid entered");
    const msg = {
      to: inputData.toMail, // Change to your recipient
      from: process.env.sendgridEmail, // Change to your verified sender
      subject: subject,
      html: body_text,
    };
    sgMail
      .send(msg)
      .then(() => {
        console.log("Sent Email");
        res.send({
          message: "Loan Announcement Email has been sent sucessfully",
        });
        centralDbConnection.close() // new
dbConnection.close() // new
      })
      .catch((error) => {
        console.log("error", error);
      });
  }
}
module.exports = {
  eduvanzWrapperAPI: eduvanzLoan,
  sendLoanProcessAPI: sendLoanProcessAPI,
  sendEduvanzLoanMail: sendEduvanzLoanMail,
};
