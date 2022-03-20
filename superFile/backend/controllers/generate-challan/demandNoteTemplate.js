const moment = require("moment");
exports.createEmailTemplate = (getDetails) => {
  var orgDetails = getDetails.orgDetails;
  const tableHeaderStyle = "height: 35px;text-align: center;font-weight: bold;background: #eee; padding:0px";
  var totalAmount = 0;
  var calculateTotal = getDetails.demandPayload.data.feesBreakUp.forEach((data) => {
    totalAmount = Number(totalAmount) + Number(data.amount)
  })
  let emailAttachment = `
  <div style="display:flex;justify-content:flex-start;">
  <img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/>
  <p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong>
  <br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> 
  ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />
  ${orgDetails.instituteDetails.stateName}, India<br />Contact: ${orgDetails.instituteDetails.email}<br />
  Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
<p><strong>Dear Parent,</strong></p>
<p>Please find the fee details of your ward(s) as follows:</p>
<table style="border-collapse: collapse; width: 100%; height: 74px;" border="1">
<tr style="${tableHeaderStyle}">
<td >Student Name</td>
<td >Class/Batch</td>
<td >Demand Note ID</td>
<td>Paid Amount</td>
<td>TOTAL DUE</td>
</tr>
<tr>
<td style="text-align: center">${getDetails.demandPayload.studentName}</td>
<td style="text-align: center">${getDetails.demandPayload.studentRegId}</td>
<td style="text-align: center">${getDetails.demandId}</td>
<td style="text-align: center">${Number(getDetails.demandPayload.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
<td style="text-align: center;">${Number(getDetails.demandPayload.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
</tr>
</table>
<p><strong>The Payment due date for this Demand note is <u>${moment(new Date(getDetails.demandPayload.dueDate)).format("DD/MM/YYYY")}</u>.&nbsp;</strong></p>
<p>Please find the attached bank challan. Please download and print the challan to pay the fees at the nearest SBI branch.</p>
  `;
  return emailAttachment
}
