const moment = require("moment");
const demandNoteTemplate = (orgDetails, demandNoteDetails, collectionUrl) => {
    console.log("demandNoteDetails",demandNoteDetails)
  const tableHeaderStyle =
    "height: 35px;text-align: center;font-weight: bold;background: #eee;";
  const amountStyle = "text-align: right;padding-right:15px";
  let feesBreakUp = [];
  let feesTableData = [];
  let totalValue = 0;
  let feesAmount = Number(demandNoteDetails[0].data.feesBreakUp[0].examFeeamount)<0 ? "Student To Fill" : Number(demandNoteDetails[0].data.feesBreakUp[0].examFeeamount).toFixed(2)
  let exempAmount = Number(demandNoteDetails[0].data.feesBreakUp[0].excemptionamount).toFixed(2)
  let miscAmount = Number(demandNoteDetails[0].data.feesBreakUp[0].miscamount).toFixed(2)
console.log(feesAmount)
  const dueDate = moment(new Date(demandNoteDetails[0].dueDate)).format(
    "DD/MM/YYYY"
  );
  demandNoteDetails.forEach((element) => {
    let value = element.data;
    let columnData = [
      `<td>${element.studentRegId}</td>`,
      `<td>${element.studentName}</td>`,
      `<td>${element["semester"]}</td>`,
      `<td>${feesAmount}</td>`,
      `<td style="${amountStyle}">${exempAmount}</td>`,
      `<td style="${amountStyle}">${miscAmount}</td>`,
    ];
    value.feesBreakUp.forEach((item) => {
      if (feesBreakUp.indexOf(item.feeType) == -1)
        feesBreakUp.push(item.feeType);
    });
    value.feesBreakUp.forEach((item) => {
      if (feesBreakUp.indexOf(item.feeType) == -1) {
        columnData.push(`<td></td>`);
      } else {
        // columnData.push(
        //   `<td style="${amountStyle}">${formatCurrency(feesAmount)}</td>
        //   <td style="${amountStyle}">${formatCurrency(exempAmount)}</td>
        //   <td style="${amountStyle}">${formatCurrency(miscAmount)}</td>`
        // );
      }
    });
    // columnData.push(`<td style="${amountStyle}">${formatCurrency(0)}</td>`);
    // columnData.push(
    //   `<td style="${amountStyle}"><strong>${formatCurrency(
    //     element.amount
    //   )}</strong></td>`
    // );
    let tableRow = `<tr style="text-align:center;height:40px">${columnData
      .map((item) => item)
      .join("")}</tr>`;
    feesTableData.push(tableRow);
  });
  return (
    `
<div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${
      orgDetails.logo.logo
    }"/><p style="margin-left:20px"><strong>${
      orgDetails.instituteDetails.instituteName
    }</strong><br />${orgDetails.instituteDetails.address1},${
      orgDetails.instituteDetails.address2
    },${orgDetails.instituteDetails.address3} <br /> ${
      orgDetails.instituteDetails.cityTown
    },PIN - ${orgDetails.instituteDetails.pinCode}<br />${
      orgDetails.instituteDetails.stateName
    }, India<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${
      orgDetails.instituteDetails.phoneNumber1
    }</p></div>
<br>
<hr/>
<br>
<p><strong>Dear ${demandNoteDetails[0].studentName},</strong></p>
<p>Please find your examination fee details as follows:</p>
<table style="border-collapse: collapse; width: 100%; height: 84px;" border="1">
<tbody>
<tr style="${tableHeaderStyle}">
<td >Student Reg. ID</td>
<td >Student Name</td>
<td >Year/Semester</td>
<td >Exam Fee</td>
<td >Exemption</td>
<td >Miscellaneous Fee</td>
</tr> 
${feesTableData.join("")}
</tbody>
</table>
<p><br>Please follow the steps listed below to successfully make your exam fee payment:</br> 
<br>Step 1: Fill out the examination form at VTU website.</br>
<br>Step 2: Download the completed form in PDF format.</br>
<br>Step 3: Click on the "Pay Now" button that is in this email.</br>
<br>Step 4: Login using your mobile number. Password OTP will be sent to the mobile number you key in.</br> 
<br>Step 5: Upload the form downloaded in step 2.</br>
<br>Step 6: Pay the exam fees.</br>
<br>Step 7: Download the receipt.</br>
<br><strong>NOTE: The deadline for Examination Fees Payment is 13-Jan-2021</strong></br></p>
<p><strong>Please proceed to pay the examination fees by clicking the following button:&nbsp; &nbsp;<strong></p>
<p> <a href=` +
    collectionUrl +
    ` style="cursor: pointer;"> <button class="button button1" style="background-color: #00218d;border: none;
color: white;
padding: 15px 32px;
text-align: center;
text-decoration: none;
display: inline-block;
margin: 4px 2px;
cursor: pointer;font-size: 20px;">Pay Now</button></a></p>
<p>Regards,</p>
<p><strong>${orgDetails.instituteDetails.instituteName}: Exams and Accounts Team</strong></p>
<p>&nbsp;</p>`
  );
};

formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

module.exports = { demandNoteTemplate };
