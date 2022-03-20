//vkgi email-template.js
const moment = require("moment");
const vkgiLogo = "https://www.ncfe.ac.in/files/NCFE%20CVR%20-%20Copy.png"

const vkgiTemplate = (orgDetails, demandNoteDetails, collectionUrl, openingLine, paidAmount, orgNameSpace) => {
  console.log("paid", paidAmount);
  const tableHeaderStyle = "height: 35px;text-align: center;font-weight: bold;background: #eee;";
  const amountStyle = "text-align: right;padding-right:15px";
  let feesBreakUp = [];
  let feesTableData = [];
  let totalValue = 0;
  let studentName = demandNoteDetails[0].studentName;
  let regId = demandNoteDetails[0].studentRegId
  let totalFees = 0
  totalFees = demandNoteDetails[0].data.feesBreakUp[0].amount

  let overallTermPending = demandNoteDetails[0].overallTermPending
  let dueDate = moment(new Date(demandNoteDetails[0].dueDate)).format("DD/MM/YYYY");
  let dueDateFull = demandNoteDetails[0].dueDate
  let installmentId = demandNoteDetails[0].paymentInstallmentId
  let dueDateCompare = 'is'
  if (moment(dueDateFull).isAfter()) { dueDateCompare = 'is' }
  else if (moment(dueDateFull).isBefore()) { dueDateCompare = 'was' }
  else dueDateCompare = dueDateCompare

  let termwiseBreakup = demandNoteDetails[0].termwiseBreakup

  demandNoteDetails.forEach((element) => {
    let value = element.data;
    let columnData = [
      `<td>${element.studentRegId}</td>`,
      `<td>${element.studentName}</td>`,
      `<td>${element.class}</td>`,
      `<td>${element.displayName}</td>`,
    ];
    value.feesBreakUp.forEach((item) => {
      if (feesBreakUp.indexOf(item.feeType) == -1)
        feesBreakUp.push(item.feeType);
    });
    value.feesBreakUp.forEach((item) => {
      if (feesBreakUp.indexOf(item.feeType) == -1) { columnData.push(`<td></td>`); }
      else { columnData.push(`<td style="${amountStyle}">${formatCurrency(item.amount)}</td>`); }
    });
    columnData.push(`<td style="${amountStyle}">${formatCurrency(paidAmount)}</td>`);
    columnData.push(`<td style="${amountStyle}"><strong>${formatCurrency(element.amount)}</strong></td>`);

    let tableRow = `<tr style="text-align:center;height:40px">${columnData.map((item) => item).join("")}</tr>`;
    feesTableData.push(tableRow);
    totalValue += element.amount;
  });
  totalValue = formatCurrency(totalValue);

  return (
    `<div style="">
        <div style="display:flex;justify-content:flex-start;">
        <img  title="logo.jpg" alt="" width="148" height="148" src="${String(orgNameSpace).toLowerCase() === "vkgi" ? vkgiLogo : orgDetails.logo.logo}"/>
        <p style = "margin-left:20px" ><strong>${orgDetails.instituteDetails.instituteName
    }</strong><br />${orgDetails.instituteDetails.address1}, ${orgDetails.instituteDetails.address2
    }, ${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown
    }, PIN - ${orgDetails.instituteDetails.pinCode} <br />${orgDetails.instituteDetails.stateName
    }, India < br /> Contact: ${orgDetails.instituteDetails.email} <br />Ph: ${orgDetails.instituteDetails.phoneNumber1
    }</p ></div >
    <br>
        <hr />
        <br>
            <p><strong>Dear Parent/Student,</strong></p>
            <p><strong>The total fees for ${studentName} with registeration id ${regId} is Rs.${String(formatCurrency(totalFees)).replace('₹', '')}</strong></p>
            <p>Term wise breakup is as follows:</p>

            <table style="border-collapse: collapse; width: 100%; height: 84px;" border="1">
                <tbody>
                    <tr style="${tableHeaderStyle}">
                        <td>S.No.</td>
                        <td>Installment No.</td>
                        <td>Term</td>
                        <td>Due Date</td>
                        <td>Planned Amount</td>
                        <td>Paid Amount</td>
                        <td>Due Amount</td>
                    </tr>
            ${termwiseBreakup.map((item, index) => {
      return (`<tr>
                    <td>${item.serialNo}</td>
                    <td>${item.label}</td>
                    <td>${item.term}</td>
                    <td>${item.dueDate}</td>
                    <td>${item.plannedAmt}</td>
                    <td>${item.paidAmt}</td>
                    <td>${item.pendingAmt}</td>
               </tr>`)
    }).join("")}
                    <tr style="height:40px">
                        <td style="${amountStyle}" colspan="6"><strong>GRAND TOTAL</strong></td>
                        <td style="${amountStyle}"><strong>${overallTermPending}</strong></td>
                    </tr>
                </tbody>
            </table>
            <p>This is a demand note for the collection of installment no. ${installmentId} for amount <strong>Rs.${String(formatCurrency(totalValue)).replace('₹', '')}. </strong> The breakup of the same is as follows:</p>
            <table style="border-collapse: collapse; width: 100%; height: 84px;" border="1">
                <tbody>
                    <tr style="${tableHeaderStyle}">
                        <td>Student Reg. ID</td>
                        <td>Student Name</td>
                        <td>Class/Batch</td>
                        <td>Demand Note ID</td>
                        ${feesBreakUp.map((item) => `<td >${item}</td>`).join("")}
                        <td>Paid Amount</td>
                        <td>TOTAL DUE</td>
                    </tr>
                    ${feesTableData.join("")}
                    <tr style="height:40px">
                        <td style="${amountStyle}" colspan="${feesBreakUp.length + 5}"><strong>GRAND TOTAL</strong></td>
                        <td style="${amountStyle}"><strong>${totalValue}</strong></td>
                    </tr>
                </tbody>
            </table>

            <p><strong>The Payment due date for this Demand note ${dueDateCompare} <u>${dueDate}</u>.&nbsp;</strong></p>
            <p>Please click the following button to login into the parent portal to initiate the payment:&nbsp; &nbsp;</p>

            <p> <a href=` + collectionUrl + ` style="cursor: pointer;">
            <button class="button button1" 
                style="background-color: #00218d;
                border: none;
                color: white;
                padding: 15px 32px;
                text-align: center;
                text-decoration: none;
                display: inline-block;
                margin: 4px 2px;
                cursor: pointer;
                font-size: 20px;">
                Login
            </button>
            </a></p>
        <p>Regards,</p>
        <p><strong>"${String(orgNameSpace).toLowerCase() === "vkgi" ? 'NCFE' : String(orgNameSpace).toUpperCase()} Accounts Team</strong></p>
        <p>&nbsp;</p>
</div>`
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

module.exports = { vkgiTemplate };
