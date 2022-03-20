const refundTemplate = (orgDetails, transaction) => {
  return `
  <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
<br>
  <hr/>
  <br>
  <p><strong>Dear Parent,</strong></p>
  <p>Your refund for the Payment <strong>${transaction.relatedTransactions[0]}</strong> has been initiated and your payment reference ID is <strong> ${transaction.transactionId}</strong>.</p>
  <p>This may take around 2 working days</p>
  <p>Regards,</p>
  <p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
  <p>&nbsp;</p>`;
};

module.exports = { refundTemplate };
