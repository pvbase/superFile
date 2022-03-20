const transactionCancelTemplate = (orgDetails, transaction) => {
    return `
    <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
  <br>
    <hr/>
    <br>
    <p><strong>Dear ${transaction.studentName},</strong></p>
    <p>Due to unavoidable circumstances, we had to cancel the transaction no. <strong>${transaction.transactionId}</strong>.  This transaction no. has been rendered invalid going forward.</p>
    <p>We will update you shortly with a new transaction no.</p>
    <p>Regards,</p>
    <p><strong>${orgDetails.instituteDetails.instituteName} Finance/Accounts Team</strong></p>
    <p>&nbsp;</p>`;
  };
  
  module.exports = { transactionCancelTemplate };