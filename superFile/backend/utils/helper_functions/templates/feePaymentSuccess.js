const feePaymentTemplate = (orgDetails, transaction) => {
  console.log("emailtemo", transaction);
  let modes = transaction.mode;
  let mode = modes.toLowerCase();
  let types = transaction.type;
  let type = types.toLowerCase();
  let status = transaction.status;
  console.log("paytm", status);
  let paymentType = status.toLowerCase();
  console.log("email entered");
  let details = JSON.stringify(transaction.details);
  console.log("details", details);
  // Dear FN LN,
  //
  // Your scholarship with ID <id> of amount INR <> has been processed.
  // Please click on the following action for further processing
  //
  // <> <>
  //
  // Regards,
  // Fee collection team
  //adjust -->

  if (mode == "razorpay") {
    return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
  <p><strong>Dear Student/Parent,</strong></p>
  <p>Your fee payment of <strong> Rs${transaction.amount}.00</strong> towards the Demand Note <strong>${transaction.demandNote}</strong> has been initiated. </p>
  <p>The transaction id is <strong> ${transaction.transactionId}</strong>. </p>
  <p>This transaction takes some time to be deposited to our bank account. We will send the receipt as soon as the money is received.</p>
  <br>
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
  } else if (mode == "cash") {
    return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
  <p><strong>Dear Parent,</strong></p>
  <p>Your fee payment of <strong> Rs ${transaction.amount}.00</strong> towards the Demand Note ${transaction.demandNote} has been received by Cash. We will send the receipt after the money is deposited in the bank account.</p>
 
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
  } else if (mode == "card") {
    return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
  <p><strong>Dear Student/Parent,</strong></p>
  <p>Your fee payment of <strong> Rs${transaction.amount}.00</strong> towards the Demand Note <strong>${transaction.demandNote}</strong> has been initiated. </p>
  <p>The transaction id is <strong> ${transaction.transactionId}</strong>. </p>
  <p>This transaction takes some time to be deposited to our bank account. We will send the receipt as soon as the money is received.</p>
  <br>
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
  } else if (type == "scholarships" || mode == "cheque") {
    console.log("entered into scholarship template");
    console.log("paymentType", paymentType);
    if (paymentType == "adjust") {
      return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
  <p><strong>Dear ${transaction.name},</strong></p>
  <p>Your scholarship with ID ${transaction.id} of amount INR ${transaction.amount}.00 has been processed. </p>
  <p>Please click on the following action for further processing</p>
  <p> <a href="${process.env.scholarshipLandingpage}${transaction.nameSpace}/scholarship-process?scholarshipId=${transaction.scholarshipId}&type=adjust&orgId=${transaction.orgId}&userId=${transaction.userId}" style="cursor: pointer;"> <button class="button button1" style="background-color: #00218d;border: none;
color: white;
padding: 15px 32px;
text-align: center;
text-decoration: none;
display: inline-block;
margin: 4px 2px;
cursor: pointer;font-size: 20px;">Adjust</button></a>
</p>
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
    } else if (paymentType == "refund") {
      return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
  <p><strong>Dear ${transaction.name},</strong></p>
  <p>Your scholarship with ID ${transaction.id} of amount INR ${transaction.amount}.00 has been processed. </p>
  <p>Please click on the following action for further processing</p>
  <p> <a href="${process.env.scholarshipLandingpage}${transaction.nameSpace}/scholarship-process?scholarshipId=${transaction.scholarshipId}&type=refund&orgId=${transaction.orgId}&userId=${transaction.userId}" style="cursor: pointer;"> <button class="button button1" style="background-color: #00218d;border: none;
color: white;
padding: 15px 32px;
text-align: center;
text-decoration: none;
display: inline-block;
margin: 4px 2px;
cursor: pointer;font-size: 20px;">Refund</button></a>
</p>
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
    } else {
      return `
      <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
    <br>
    <hr/>
    <br>
    <p><strong>Dear ${transaction.name},</strong></p>
    <p>Your scholarship with ID ${transaction.id} of amount INR ${transaction.amount}.00 has been processed. </p>
    <p> <a href="${process.env.scholarshipLandingpage}${transaction.nameSpace}/scholarship-process?scholarshipId=${transaction.scholarshipId}&type=adjustRefund&${transaction.orgId}&userId=${transaction.userId}" style="cursor: pointer;"> <button class="button button1" style="background-color: #00218d;border: none;
color: white;
padding: 15px 32px;
text-align: center;
text-decoration: none;
display: inline-block;
margin: 4px 2px;
cursor: pointer;font-size: 20px;">Adjust</button></a> OR <a href="${process.env.scholarshipLandingpage}${transaction.nameSpace}/scholarship-process?scholarshipId=${transaction.scholarshipId}&type=refundAdjust&${transaction.orgId}&userId=${transaction.userId}" style="cursor: pointer;"> <button class="button button1" style="background-color: #00218d;border: none;
color: white;
padding: 15px 32px;
text-align: center;
text-decoration: none;
display: inline-block;
margin: 4px 2px;
cursor: pointer;font-size: 20px;">Refund</button></a>
</p> 
    <p>Regards,</p>
    <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
    <p>&nbsp;</p>`;
    }
  } else if (mode == "cheque" && !type == "scholarships") {
    return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
  <p><strong>Dear Student/Parent,</strong></p>
  <p>Your fee payment of <strong> Rs${transaction.amount}.00</strong> towards the Demand Note <strong>${transaction.demandNote}</strong> has been initiated. </p>
  <p>The transaction id is <strong> ${transaction.transactionId}</strong>. </p>
  <p>This transaction takes some time to be deposited to our bank account. We will send the receipt as soon as the money is received.</p>
  <br>
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
  } else if (mode == "netbanking") {
    return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
  <p><strong>Dear Student/Parent,</strong></p>
  <p>Your fee payment of <strong> Rs${transaction.amount}.00</strong> towards the Demand Note <strong>${transaction.demandNote}</strong> has been initiated. </p>
  <p>The transaction id is <strong> ${transaction.transactionId}</strong>. </p>
  <p>This transaction takes some time to be deposited to our bank account. We will send the receipt as soon as the money is received.</p>
  <br>
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
  } else if (mode == "wallet") {
    return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
  <hr/>
  <br>
  <p><strong>Dear Student/Parent,</strong></p>
  <p>Your fee payment of <strong> Rs${transaction.amount}.00</strong> towards the Demand Note <strong>${transaction.demandNote}</strong> has been initiated. </p>
  <p>The transaction id is <strong> ${transaction.transactionId}</strong>. </p>
  <p>This transaction takes some time to be deposited to our bank account. We will send the receipt as soon as the money is received.</p>
  <br>
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
  }
};

module.exports = { feePaymentTemplate };
