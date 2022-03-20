const generalLedgerSchema = require("../models/generalLedgerModel");
const demandNoteSchema = require("../models/demandNoteModel");
const StudentSchema = require("../models/studentModel");
const ProgramPlanSchema = require("../models/programPlanModel");
const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const feeplanschema = require("../models/feeplanModel");
const feeplanInstallmentschema = require("../models/feeplanInstallment");
const orgListSchema = require("../models/orglists-schema");

module.exports.termsAndConditions = async (req, res) => {
  let centralDbConnection;
  let dbConnectionp;
  // try{
  let stdhedaId = req.params.contactId;
  centralDbConnection = await createDatabase(
    `usermanagement-${process.env.stage}`,
    process.env.central_mongoDbUrl
  );
  const orgListModel = centralDbConnection.model(
    "orglists",
    orgListSchema,
    "orglists"
  );
  const orgData = await orgListModel.findOne({
    _id: mongoose.Types.ObjectId(req.query.orgId),
  });
  dbConnectionp = await createDatabase(
    orgData._doc._id.toString(),
    orgData._doc.connUri
  );
  // dbConnectionp = await createDatabase(
  //     "5faa2d6d83774b0007e6537d",
  //     "mongodb://20.44.39.232:30000"
  // );
  let studentModel = dbConnectionp.model("students", StudentSchema);
  let feePlanModel = dbConnectionp.model("studentfeeplans", feeplanschema);
  let ppmodel = dbConnectionp.model("programplans", ProgramPlanSchema);
  let feeInstallmentPlanModel = dbConnectionp.model(
    "studentfeeinstallmentplans",
    feeplanInstallmentschema
  );
  let studata = await studentModel.findOne({
    rollNumber: req.params.contactId,
  });
  // console.log(studata)
  let ppdata = await ppmodel.findOne({ _id: studata._doc.programPlanId });
  let feePlandata = await feePlanModel.findOne({
    studentRegId: studata._doc.regId,
  });
  let feeInstallments = await feeInstallmentPlanModel.find({
    feePlanId: feePlandata._doc._id,
  });
  let status1;
  let stusts2;
  console.log(ppdata);
  // if(Number(feeInstallments[0]._doc.pendingAmount)<=0){
  //     status1 = "Paid"
  // }
  // if(Number(feeInstallments[1]._doc.pendingAmount)<=0){
  //     status2 = "Paid"
  // }
  // let lateFeeRow;
  // console.log(new Date()>feeInstallments[0]._doc.lateFeeStartDate, Number(feeInstallments[0]._doc.pendingAmount))
  // if(new Date()> new Date(feeInstallments[0]._doc.lateFeeStartDate) && status1!=="Paid"){

  // }
  // else{

  // }
  // if(new Date()> new Date(feeInstallments[1]._doc.lateFeeStartDate) && status1!=="Paid"){

  // }
  // console.log(new Date(`${feeInstallments[1]._doc.dueDate.split(" ")[3]}/${feeInstallments[1]._doc.dueDate.split(" ")[1].toUpperCase()}/${feeInstallments[1]._doc.dueDate.split(" ")[2]}`))
  let tablerows = "";
  for (let j = 0; j < feeInstallments.length; j++) {
    tablerows =
      tablerows +
      `<tr>
        <td  style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${feeInstallments[
        j
      ]._doc.plannedAmountBreakup[0].title.slice(0, 7)}</td>
        <td  style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${feeInstallments[j]._doc.dueDate.split(" ")[2]
      }/${feeInstallments[j]._doc.dueDate.split(" ")[1].toUpperCase()}/${feeInstallments[j]._doc.dueDate.split(" ")[3]
      }</td>
        <td  style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">₹${feeInstallments[
        j
      ]._doc.plannedAmount.toFixed(2)}</td>
        <td  style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${feeInstallments[j]._doc.status
      }</td>

    </tr>`;
  }
  let htmlTemplate = `
        <div class="body demandNoteTemplate">
<h3> Fees Information</h3>
            </div>
            <p> Greetings from NCFE! We are happy to announce the commencement of the Academic Year ${ppdata._doc.academicYear
    }.</p>
            <ul>
          <li> <p>Your ward ${studata._doc.firstName.includes(".")
      ? studata._doc.firstName.replace(".", "")
      : studata._doc.firstName
    } ${studata._doc.lastName.includes(".")
      ? studata._doc.lastName.replace(".", "")
      : studata._doc.lastName
    } is in ${ppdata._doc.title.includes("Mont")
      ? "Mont" + ppdata._doc.title.split("-")[2]
      : ppdata._doc.title.split("-")[2]
        ? ppdata._doc.title.split("-")[2]
        : ppdata._doc.title.split("-")[1]
    } and the annual fee for the Academic Year  ${ppdata._doc.academicYear
    } is <b>₹${feePlandata._doc.plannedAmount.toFixed(2)} </b></li>
  <li>The fee can be paid in 1,2,3 and/or 4 installments as follows:</p>
            <table style= " border-collapse: collapse; width: 40%; height: 84px; border: 1px solid #000">
                <thead>
                        <th style="font-size: 12px; padding: 5px;text-align:center;  background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; ">TERM</th>
                        <th style="font-size: 12px; padding: 5px;text-align:center;  background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; ">DUE DATE</th>
                        <th style="font-size: 12px; padding: 5px;text-align:center;  background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; ">AMOUNT</th>
                        <th style="font-size: 12px; padding: 5px;text-align:center;  background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; ">STATUS</th>
                </thead>
                <tbody>
                    ${tablerows}
                    <tr>
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData" colspan="2"><b>TOTAL</b></td>
                        <!-- <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">-</td> -->
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData"><b>₹${feePlandata._doc.plannedAmount.toFixed(2)}</b></td>
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData"><b>Planned</b></td>
                    </tr>
                </tbody>
            </table>
           
        </li> 
        </ul>
            <p>Thanks and Regards</p>
        
        </div>`;
  let latefeeline = `<li>  <p> Please note that a penalty of ₹25.00 per day will be charged if the Term 1 fees is not paid by <u> ${feeInstallments[1]._doc.lateFeeStartDate.split(" ")[2]
    }/${feeInstallments[1]._doc.lateFeeStartDate.split(" ")[1].toUpperCase()}/${feeInstallments[1]._doc.lateFeeStartDate.split(" ")[3]
    }</u>.</p></li>`;

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.send(htmlTemplate);
  centralDbConnection.close() // new
  dbConnectionp.close() // new
  // }
  // catch (err) {
  //     res.status(404).send({ status: "failure", message: "parent details: ", data: err.toString() });
  // }
  // finally {
  //     await dbConnectionp.close()
  //     await centralDbConnection.close();
  // }
};
