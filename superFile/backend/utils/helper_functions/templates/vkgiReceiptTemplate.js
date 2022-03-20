const moment = require("moment");
const receiptVkgiTemplate = (orgDetails, transaction, nameSpace) => {
  return `
  <div style="display:flex;justify-content:flex-start;">
  <img  title="logo.jpg" alt="" width="148" height="148" src=${transaction.campus.logo}>
  <p style="margin-left:20px"><strong>${transaction.campus.name}</strong>
  <br />${transaction.campus.address1}${transaction.campus.address2}${transaction.campus.address3}<br /> ${transaction.campus.city}-${transaction.campus.pincode} | ${transaction.campus.state}
  <br />Contact: ${transaction.campus.contact}</p></div>
<br>
<hr/>
<br>
<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 35 35\"><path d=\"M1 1h7v7h-7zM10 1h2v1h1v1h-1v2h-1v2h-1v1h1v2h1v1h-1v1h1v1h-1v1h1v1h1v1h-1v1h-1v-2h-1v-1h-1v-1h-1v-1h1v-2h1v-1h-1v-6h1v1h1v-2h-1zM15 1h1v1h-1zM17 1h1v3h-1v-1h-1v-1h1zM19 1h3v1h2v1h-1v1h-1v-1h-1v-1h-1v1h-1zM24 1h1v1h-1zM27 1h7v7h-7zM2 2v5h5v-5zM25 2h1v1h-1zM28 2v5h5v-5zM3 3h3v3h-3zM15 3h1v1h-1zM20 3h1v1h-1zM24 3h1v1h1v1h-1v1h-1zM29 3h3v3h-3zM13 4h1v1h-1zM19 4h1v1h-1zM12 5h1v1h1v2h-1v-1h-1zM15 5h4v2h-1v-1h-2v3h-1zM21 5h2v1h-2zM20 6h1v1h-1zM23 6h1v2h1v-2h1v6h-1v-1h-1v-1h1v-1h-1v1h-1v-1h-2v1h2v1h-4v1h5v1h3v1h-2v1h-1v-1h-1v-1h-2v1h-1v-1h-2v1h-1v-1h-1v-1h-1v1h-1v-1h-1v-2h1v-1h1v2h2v1h1v-3h1v1h1v-2h1v-1h1v1h1zM11 7h1v1h-1zM17 7h1v2h-1zM19 7h1v1h-1zM12 8h1v1h-1zM1 9h1v1h1v-1h5v1h-2v1h2v1h-2v1h2v1h-1v1h-1v-1h-2v1h2v1h-3v-1h-1v-1h-1zM27 9h5v1h2v1h-2v1h2v3h-1v1h-1v-3h-1v3h1v1h-1v1h1v3h-1v1h1v1h1v1h1v1h-4v-1h1v-1h-1v-1h-1v-1h-1v-1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v3h1v-1h1v1h1v1h1v-2h1v-1h2v1h1v1h-1v1h1v3h1v-2h3v1h-2v1h2v3h-2v2h-3v-1h1v-1h1v-1h1v-1h-1v1h-1v1h-1v-1h-2v1h-1v1h-1v-1h-1v-1h1v-1h-1v-1h-1v-1h2v-1h-2v-1h-2v1h1v1h-3v1h1v1h-2v-1h-1v1h1v1h-1v1h1v1h-1v2h-2v-1h1v-1h-1v-1h1v-4h1v-1h1v-1h1v1h1v-2h1v-1h-1v-1h1v-3h2v1h1v1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-2h-1v-3h1v1h1v-1h-1v-1h-1v1h-2zM4 10v1h-2v2h1v-1h1v-1h1v-1zM27 12h1v1h-1zM12 13h2v2h-1v-1h-1zM15 13h1v1h-1zM16 14h1v1h1v1h-1v2h-2v-1h-2v-1h1v-1h2zM18 14h2v1h-2zM27 14h1v3h-1v1h-2v-1h1v-2h1zM7 15h3v1h-1v1h2v2h-1v1h1v1h-1v1h1v-1h1v-1h-1v-1h2v1h1v2h-2v3h-1v-2h-1v4h-1v-1h-6v-2h1v1h4v-1h1v-1h-1v-1h-1v-1h2v-3h-4v-1h1v-1h1v1h1v-1h-1zM23 15h1v1h1v1h-1v1h-1v-1h-1v-1h1zM1 16h2v2h2v1h-3v1h1v1h-1v1h2v1h-2v3h-1zM12 17h1v1h-1zM18 17h3v2h-1v1h-1v-2h-1zM33 17h1v2h-1zM13 18h2v1h-2zM17 18h1v2h-1v1h-1v-1h-1v-1h2zM24 18h1v1h-1zM29 18v1h1v1h1v-1h-1v-1zM5 19h1v2h-2v-1h1zM7 19h1v1h-1zM19 21h1v1h-1zM5 22h2v1h-1v1h-1zM14 22h1v3h-1v-1h-1v-1h1zM16 22h3v2h-1v-1h-2zM33 22h1v1h-1zM7 23h1v1h-1zM17 24h1v1h-1zM27 24v1h1v-1zM12 25h2v2h-1v-1h-1zM15 25h1v2h-1zM11 26h1v1h-1zM26 26v3h3v-3zM1 27h7v7h-7zM27 27h1v1h-1zM2 28v5h5v-5zM9 28h1v1h1v1h1v1h2v1h-3v1h-1v-1h-1zM11 28h2v2h-1v-1h-1zM14 28h1v1h-1zM21 28h2v1h-2zM3 29h3v3h-3zM20 29h1v1h2v1h-5v-1h2zM23 29h1v1h-1zM14 30h1v1h-1zM23 31h1v2h2v1h-3v-1h-1v-1h1zM27 31h2v1h-2zM20 32h1v1h-1zM26 32h1v1h-1zM9 33h1v1h-1zM11 33h3v1h-3zM18 33h1v1h-1zM27 33h2v1h-2zM32 33h1v1h-1z\"/></svg>
<p><strong>Dear Parent,</strong></p>
<p>Thank you for your payment. The transaction id is: ${transaction.transactionId}. Please find attached fee receipt for your ward ${transaction.studentName}.</p>

<p>Please contact us for any questions or clarification at ${transaction.campus.contact}</p>
<p>Regards,</p>
<p><strong>${nameSpace} Accounts Team</strong></p>
<p>Note: This is a computer generated email. Please do not reply to it.</p>
<p>&nbsp;</p>
`;
};

const receiptVkgiPdf = async (
  orgDetails,
  demandNoteDetails,
  feeTableHeader,
  receiptNo,
  type,
  qrCode,
  url,
  statementTableHeader,
  installmentPlanData,
  title,
  transactionId,
  feeDetails
) => {
  let feesBreakUp = [];
  let feesTableData = [];
  let totalValue1 = 0;
  let totalValue = 0;
  let totalDue = 0;
  let totalDue1 = 0;
  let dateToday = moment(demandNoteDetails[0].transactionDate).format(
    "DD/MM/YYYY"
  );
  // let dateToday = moment().format("DD/MM/YYYY");

  const thStyle =
    " width:20%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px";
  const tbodyStyle =
    "width:10%;text-align:center; border: 1px solid black;border-collapse: collapse;font-size: 10px;font-family: sans-serif;padding: 5px;";

  let columnData = [];
  let tableHeaderData = feeTableHeader
    .map((item) => `<td  style="${thStyle}">${item.name}</td>`)
    .join("");
  let tableHeaderData1 = statementTableHeader
    .map((item) => `<td  style="${thStyle}">${item.name}</td>`)
    .join("");
  tableHeaderData = `<td  style="${thStyle}">S.No</td>` + tableHeaderData;

  // tableHeaderData1 = `<td  style="${thStyle}">TERM</td>` + tableHeaderData1;
  let tableBodyData = [];
  let tableBodyData1 = [];
  demandNoteDetails.forEach((data, i) => {
    let rowData = `<td style="${tbodyStyle}">${i + 1}</td>`;
    feeTableHeader.forEach((item) => {
      rowData =
        rowData +
        `<td  style="${tbodyStyle}${
          item.type == "amount" ? ";text-align:right" : ";text-align:center"
        }">${
          item.type == "amount"
            ? formatCurrency(data[item.value])
            : data[item.value]
        }</td>`;
    });
    tableBodyData.push(`<tr style="border: 1px solid black;">${rowData}</tr>`);
    totalValue += Number(data.paidAmount);
    totalDue += Number(data.currentDue);
  });
  console.log("installmentPlan", installmentPlanData);
  installmentPlanData.forEach((data, i) => {
    let rowData = ``;
    statementTableHeader.forEach((item) => {
      rowData =
        rowData +
        `<td  style="${tbodyStyle}${
          item.type == "amount" ? ";text-align:right" : ";text-align:center"
        }">${
          item.type == "amount"
            ? formatCurrency(data[item.value])
            : data[item.value]
        }</td>`;
    });
    tableBodyData1.push(`<tr style="border: 1px solid black;">${rowData}</tr>`);
    // totalValue1 += Number(data.plannedAmount);
  });

  tableBodyData = tableBodyData.join("");
  tableBodyData1 = tableBodyData1.join("");
  let inputData = String(totalValue);
  var paisa;
  var amount;
  if (inputData.indexOf(".") !== -1) {
    paisa = String(inputData).split(".")[1];
    amount = String(inputData).split(".")[0];
  } else {
    paisa = "00";
    amount = inputData;
  }
  let inWords = await inwords(Number(amount));
  let paisaword = await inwords(Number(paisa));

  inWords += paisa != "00" ? "AND " + paisaword + "PAISA" : "";

  //   var inWords = await inwords(totalValue);
  totalValue = formatCurrency(totalValue);
  totalValue1 = formatCurrency(totalValue1);
  let mainHtml;
  let cash = demandNoteDetails[0].mode.toLowerCase();

  if (!qrCode) {
    mainHtml = `<!DOCTYPE html>
      <html lang="en">
      ​
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
          * {
              box-sizing: border-box;
              font-family: sans-serif;
          }
  
          ​.container {
              font-family: sans-serif;
          }
  
          ​
          /* .logo { float: left; padding-left: 70px; }​.address { float: left; width: 600px; padding-left: 25px; }​.clearfix { content: ""; clear: both; display: table; overflow: auto; }​.line { border: 1px solid; margin-top: 10px; margin-bottom: 10px; } */
          ​
          /* table, th, td { border: 1px solid black; border-collapse: collapse; font-size:  11px; font-family: sans-serif; } */
          ​
          /* th, td { padding: 10px; } */
          ​
          /* p { line-height: 1.5; }​p, h3 { margin: 0; padding: 0; } */
          ​
          /* .signature { text-align: center; margin-top: 20px; margin-bottom: 20px; } */
      </style>
      </head>
      ​
      <body style="padding: 15px;padding-top: 5px;">
      ​
          <div class="container" style="width: 100%;text-align: center">
          <div class="logo"> <img src=${
            demandNoteDetails[0].campus.logo
          } width="120px" /> </div>
          <div class="address" style=" width:100%; padding-left: 25px;font-size:10px; text-align: center;">
        
          <h3 style="font-family: sans-serif;margin: 0; padding: 0;">${
            demandNoteDetails[0].campus.name
          }</h3>
         
          <p style=" line-height: 1.5; font-family: sans-serif;margin: 0; padding: 0;">${
            demandNoteDetails[0].campus.address1
          }${demandNoteDetails[0].campus.address2}${
      demandNoteDetails[0].campus.address3
    }</p>

          <p style=" line-height: 1.5; font-family: sans-serif;margin: 0; padding: 0;">${
            demandNoteDetails[0].campus.city
          }-${demandNoteDetails[0].campus.pincode} | ${
      demandNoteDetails[0].campus.state
    }, Contact: ${demandNoteDetails[0].campus.contact}</p>
         
      </div>
          </div>
          </div>​<div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>
          <div class="line" style=" border: 1px solid; margin-bottom: 5px;"></div>​
          <h2 style="font-size:15px;text-align:center;margin:0;line-height: 0;">${title}</h2>
      ​    ​<div style="font-size:  10px; font-family: sans-serif; margin-top: 5px;">
            <div style="width: 25%;float: left;text-align: center; padding-bottom: 5px;">
              <div>Receipt No:</div>
              <div style="font-weight: bold;">${receiptNo}</div>
            </div>
            <div style="width: 25%;float: left;text-align: center; padding-bottom: 5px;">
                <div>Transaction ID:</div>
                <div style="font-weight: bold;">${transactionId}</div>
            </div>
            <div style="width: 25%;float: left;text-align: right; padding-bottom: 5px;">
                <div>Mode:</div>
                <div style="font-weight: bold;text-transform:uppercase;">${
                  demandNoteDetails[0].mode
                }</div>
              </div>  
            <div style="width: 25%;float: left; text-align: right; padding-bottom: 5px;">
              <div>Date:</div>
              <div style="font-weight: bold;">${dateToday}</div>
            </div>  
          </div>
      ​  <p style="font-size:10px;
      margin:0;
      font-family:sans-serif;
      text-align:center;
      font-weight:bold;
      margin-top: 0px;
      margin-bottom: 0px;
      height:0px">STUDENT DETAILS</p>
          <table style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
          <tr>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Academic Year</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Student Admission Number</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Student Name</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Class/Batch</td>​
      </tr>
              <tr>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;"> ${
                    demandNoteDetails[0].academicYear
                  }</td>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;"> ${
                    demandNoteDetails[0].regId
                  }</td>
                  
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">${
                    demandNoteDetails[0].studentName
                  }</td>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">${
                    demandNoteDetails[0].class
                  }</td>
              </tr>
      ​
          </table>
          <p style="font-size:10px;
          margin:0;
          font-family:sans-serif;
          text-align:center;
          font-weight:bold;
          margin-top: 10px;
          margin-bottom: 0px;
          height:0px">FEES DETAILS</p>

      <table
          style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
          <tr>
              <td
                  style="width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Total Fees</td>
              <td
                  style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Total Concession</td>
              <td
                  style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Total Payable</td>
            ​
          </tr>
          <tr>
              <td
                  style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                  ${formatCurrency(feeDetails.totalFees)}</td>
              <td
                  style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                  ${formatCurrency(feeDetails.totalConcession)}</td>
              <td
                  style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                  ${formatCurrency(feeDetails.totalPayable)}</td>
             
          </tr>​
      </table>
  
      <p style="font-size:10px;
      margin:0;
      font-family:sans-serif;
      text-align:center;
      font-weight:bold;
      margin-top: 10px;
      margin-bottom: 0px;
      height:0px">TRANSACTION DETAILS</p>
          <br>
          <table style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
    
          ${tableHeaderData}${tableBodyData}
              <tr>
                  <td colspan="2" style="text-align:right;font-weight:bold;  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">TOTAL</td>
                  <td style="text-align:right;font-weight:bold;  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${formatCurrency(
                    totalDue
                  )}</td>
              </tr>
              <tr>
                  <td colspan="6" style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">AMOUNT IN WORDS: INR ${inWords} ONLY</td>
              </tr>
            </table>
        ​
        <p style="text-align:center; margin: 0px;font-size:10px;margin-bottom:0px;margin-top:0px;height:0px">
        The validity of this receipt is subjected to the realization of this transaction with our bank account
        </p>  
        <br />    
        <br />    
        <br />         
        <br />
        <br />    
        <br />         
        <br />
        <br /> 
        <br />
        <br/>
        <div class="logo" style="margin-top: 20px; text-align: center;"> <img src=${
          demandNoteDetails[0].campus.logo
        } width="120px" /> </div>
        <div class="address" style=" width:100%; padding-left: 25px;font-size:10px; text-align: center;">
      
        <h3 style="font-family: sans-serif;margin: 0; padding: 0;">${
          demandNoteDetails[0].campus.name
        }</h3>
       
        <p style=" line-height: 1.5; font-family: sans-serif;margin: 0; padding: 0;">${
          demandNoteDetails[0].campus.address1
        }${demandNoteDetails[0].campus.address2}${
      demandNoteDetails[0].campus.address3
    }</p>

        <p style=" line-height: 1.5; font-family: sans-serif;margin: 0; padding: 0;">${
          demandNoteDetails[0].campus.city
        }-${demandNoteDetails[0].campus.pincode} | ${
      demandNoteDetails[0].campus.state
    }, Contact: ${demandNoteDetails[0].campus.contact}</p>
       
    </div>
        </div>
        </div>​<div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>
        <p style="font-size:10px;
        margin:0;
        font-family:sans-serif;
        text-align:center;
        font-weight:bold;
        margin-top: 10px;
        margin-bottom: 5px;
        height:0px">STATEMENT OF ACCOUNT</p>
        <table style= "border-collapse: collapse; width: 100%;margin-top:15px;border: 1px solid #000">
    
        ${tableHeaderData1}${tableBodyData1}
        <tr>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"><b>TOTAL PAID</b></td>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"></td>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"></td>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px; text-align: right"><b>${formatCurrency(
                      installmentPlanData[0].totalAmount
                    )}</b></td>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"><b>Paid</b></td>
                </tr>

                <tr>
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"><b>TOTAL BALANCE</b></td>
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"></td>
                <!-- <td class="tableBodyData"><b>100%</b></td> -->
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"></td>
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px; text-align: right"><b>${formatCurrency(
                  installmentPlanData[0].totalBalance
                )}</b></td>
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"><b>${
                  installmentPlanData[0].totalBalanceStatus
                }</b></td>
            </tr>
           
          </table>
        <p class="signature" style="text-align: center; margin: 0px;font-size:8px;margin-bottom:20px;margin-top:10px">
        This is a computer generated fee receipt and does not require any signature.
    </p>
        </body>
        ​
        </html>`;
  } else {
    mainHtml = `<!DOCTYPE html>
      <html lang="en">
      ​
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
          * {
              box-sizing: border-box;
              font-family: sans-serif;
          }
  
          ​.container {
              font-family: sans-serif;
          }
  
          ​
          /* .logo { float: left; padding-left: 70px; }​.address { float: left; width: 600px; padding-left: 25px; }​.clearfix { content: ""; clear: both; display: table; overflow: auto; }​.line { border: 1px solid; margin-top: 10px; margin-bottom: 10px; } */
          ​
          /* table, th, td { border: 1px solid black; border-collapse: collapse; font-size:  11px; font-family: sans-serif; } */
          ​
          /* th, td { padding: 10px; } */
          ​
          /* p { line-height: 1.5; }​p, h3 { margin: 0; padding: 0; } */
          ​
          /* .signature { text-align: center; margin-top: 20px; margin-bottom: 20px; } */
      </style>
      </head>
      ​
      <body style="padding: 15px;padding-top: 5px;">
      ​
          <div class="container" style="width: 100%;text-align: center">
          <div class="logo"> <img src=${
            demandNoteDetails[0].campus.logo
          } width="120px" /> </div>
          <div class="address" style=" width:100%; padding-left: 25px;font-size:10px; text-align: center;">
        
          <h3 style="font-family: sans-serif;margin: 0; padding: 0;">${
            demandNoteDetails[0].campus.name
          }</h3>
         
          <p style=" line-height: 1.5; font-family: sans-serif;margin: 0; padding: 0;">${
            demandNoteDetails[0].campus.address1
          }${demandNoteDetails[0].campus.address2}${
      demandNoteDetails[0].campus.address3
    }</p>

          <p style=" line-height: 1.5; font-family: sans-serif;margin: 0; padding: 0;">${
            demandNoteDetails[0].campus.city
          }-${demandNoteDetails[0].campus.pincode} | ${
      demandNoteDetails[0].campus.state
    }, Contact: ${demandNoteDetails[0].campus.contact}</p>
         
      </div>
          </div>
          </div>​<div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>
          <div class="line" style=" border: 1px solid; margin-bottom: 5px;"></div>​
      
          <h2 style="font-size:15px;text-align:center;margin:0;line-height: 0;">${title}</h2>
      ​
      ​<div style="font-size:  10px; font-family: sans-serif; margin-top: 5px;">
      <div style="width: 26%;float: left; text-align: center; padding-bottom: 5px;">
      <div>Receipt No:</div>
      <div style="font-weight: bold;">${receiptNo}</div>
    </div>
    <div style="width: 26%; float: left; text-align: center; padding-bottom: 5px;">
        <div>Transaction ID:</div>
        <div style="font-weight: bold;">${transactionId}</div>
    </div>
    <div style="width: 24%; float: left; text-align: center; padding-bottom: 5px;">
        <div>Mode:</div>
        <div style="font-weight: bold;text-transform:uppercase;">${
          demandNoteDetails[0].mode
        }</div>
      </div>  
    <div style="width: 24%; float: left; text-align: center; padding-bottom: 5px;">
      <div>Date:</div>
      <div style="font-weight: bold;">${dateToday}</div>
    </div> 
          </div>
      ​  <p style="font-size:10px;
      margin:0;
      font-family:sans-serif;
      text-align:center;
      font-weight:bold;
      margin-top: 0px;
      margin-bottom: 0px;
      height:0px">STUDENT DETAILS</p>
          <table style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
          <tr>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Academic Year</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Student Admission Number</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Student Name</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Class/Batch</td>​
      </tr>
              <tr>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;"> ${
                    demandNoteDetails[0].academicYear
                  }</td>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;"> ${
                    demandNoteDetails[0].regId
                  }</td>
                  
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">${
                    demandNoteDetails[0].studentName
                  }</td>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">${
                    demandNoteDetails[0].class
                  }</td>
              </tr>
      ​
          </table>
          <p style="font-size:10px;
          margin:0;
          font-family:sans-serif;
          text-align:center;
          font-weight:bold;
          margin-top: 10px;
          margin-bottom: 0px;
          height:0px">FEES DETAILS</p>

      <table
          style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
          <tr>
              <td
                  style="width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Total Fees</td>
              <td
                  style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Total Concession</td>
              <td
                  style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Total Payable</td>
            ​
          </tr>
          <tr>
          <td
          style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
          ${formatCurrency(feeDetails.totalFees)}</td>
      <td
          style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
          ${formatCurrency(feeDetails.totalConcession)}</td>
      <td
          style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
          ${formatCurrency(feeDetails.totalPayable)}</td>
             
          </tr>​
      </table>
  
      <p style="font-size:10px;
      margin:0;
      font-family:sans-serif;
      text-align:center;
      font-weight:bold;
      margin-top: 10px;
      margin-bottom: 0px;
      height:0px">TRANSACTION DETAILS</p>
          <br>
          <table style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
    
          ${tableHeaderData}${tableBodyData}
              <tr>
                  <td colspan="2" style="text-align:right;font-weight:bold;  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">TOTAL</td>
                  <td style="text-align:right;font-weight:bold;  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${formatCurrency(
                    totalDue
                  )}</td>
              </tr>
              <tr>
                  <td colspan="6" style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">AMOUNT IN WORDS: INR ${inWords} ONLY</td>
              </tr>
        ​ <tr> <td colspan="6" style="height:100px;border: 1px solid black;
        border-collapse: collapse; padding: 10px;">         
      ${qrCode}
      <p style="text-align:center">Please scan the QR code to access this receipt from our portal<p></td></tr>
            </table>
        ​
        <p style="text-align:center; margin: 0px;font-size:10px;margin-bottom:0px;margin-top:0px;height:0px">
        The validity of this receipt is subjected to the realization of this transaction with our bank account
        </p>  
        <br />    
        <br />    
        <br />         
        <br />
        <br />    
        <br />         
        <br />
        <br /> 
        <div class="logo" style="margin-top: 20px; text-align: center;"> <img src=${
          demandNoteDetails[0].campus.logo
        } width="120px" /> </div>
        <div class="address" style=" width:100%; padding-left: 25px;font-size:10px; text-align: center;">
      
        <h3 style="font-family: sans-serif;margin: 0; padding: 0;">${
          demandNoteDetails[0].campus.name
        }</h3>
       
        <p style=" line-height: 1.5; font-family: sans-serif;margin: 0; padding: 0;">${
          demandNoteDetails[0].campus.address1
        }${demandNoteDetails[0].campus.address2}${
      demandNoteDetails[0].campus.address3
    }</p>

        <p style=" line-height: 1.5; font-family: sans-serif;margin: 0; padding: 0;">${
          demandNoteDetails[0].campus.city
        }-${demandNoteDetails[0].campus.pincode} | ${
      demandNoteDetails[0].campus.state
    }, Contact: ${demandNoteDetails[0].campus.contact}</p>
       
    </div>
        </div>
        </div>​<div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>

        <div class="line" style=" border: 1px solid; margin-bottom: 5px;"></div>​

        <h2 style="font-size:15px;text-align:center;margin:25px;line-height: 0;">STATEMENT OF ACCOUNT</h2>
        <table style= "border-collapse: collapse; width: 98%;margin:20px auto;border: 1px solid #000">
    
        ${tableHeaderData1}${tableBodyData1}
        <tr>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"><b>TOTAL PAID</b></td>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"></td>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"></td>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px; text-align: right"><b>${formatCurrency(
                      installmentPlanData[0].totalAmount
                    )}</b></td>
                    <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"><b>Paid</b></td>
                </tr>

                <tr>
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"><b>TOTAL BALANCE</b></td>
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"></td>
                <!-- <td class="tableBodyData"><b>100%</b></td> -->
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px;"></td>
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px; text-align: right"><b>${formatCurrency(
                  installmentPlanData[0].totalBalance
                )}</b></td>
                <td class="tableBodyData"  style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;text-align:center;padding: 5px; "><b>${
                  installmentPlanData[0].totalBalanceStatus
                }</b></td>
            </tr>
           
          </table>
        <p class="signature" style="text-align: center; margin: 0px;font-size:8px;margin-bottom:20px;margin-top:10px">
        This is a computer generated fee receipt and does not require any signature.
    </p>
        </body>
        ​
        </html>`;
  }

  // console.log(mainHtml);
  return mainHtml;
};

async function inwords(num) {
  var a = [
    "",
    "ONE ",
    "TWO ",
    "THREE ",
    "FOUR ",
    "FIVE ",
    "SIX ",
    "SEVEN ",
    "EIGHT ",
    "NINE ",
    "TEN ",
    "ELEVEN ",
    "TWELVE ",
    "THIRTEEN ",
    "FOURTEEN ",
    "FIFTEEN ",
    "SIXTEEN ",
    "SEVENTEEN ",
    "EIGHTEEN ",
    "NINETEEN ",
  ];
  var b = [
    "",
    "",
    "TWENTY",
    "THIRTY",
    "FORTY",
    "FIFTY",
    "SIXTY",
    "SEVENTY",
    "EIGHTY",
    "NINETY",
  ];
  if ((num = num.toString()).length > 9) return "overflow";
  n = ("000000000" + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  var str = "";
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + " " + a[n[1][1]]) + "CRORE "
      : "";
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + " " + a[n[2][1]]) + "LAKH "
      : "";
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + " " + a[n[3][1]]) + "THOUSAND "
      : "";
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + " " + a[n[4][1]]) + "HUNDRED "
      : "";
  str +=
    n[5] != 0
      ? (str != "" ? "AND " : "") +
        (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) +
        ""
      : "";
  return str;
}
formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const receiptVkgiPdfBackup = async (
  orgDetails,
  demandNoteDetails,
  feeTableHeader,
  receiptNo,
  type,
  qrCode,
  url
) => {
  let feesBreakUp = [];
  let feesTableData = [];
  let totalValue = 0;
  let totalDue = 0;
  let dateToday = moment().format("DD/MM/YYYY");
  const thStyle =
    " width:20%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px";
  const tbodyStyle =
    "width:10%;text-align:center; border: 1px solid black;border-collapse: collapse;font-size: 10px;font-family: sans-serif;padding: 5px;";

  let columnData = [];
  let tableHeaderData = feeTableHeader
    .map((item) => `<td  style="${thStyle}">${item.name}</td>`)
    .join("");
  tableHeaderData = `<td  style="${thStyle}">S.No</td>` + tableHeaderData;
  let tableBodyData = [];
  demandNoteDetails.forEach((data, i) => {
    let rowData = `<td style="${tbodyStyle}">${i + 1}</td>`;
    feeTableHeader.forEach((item) => {
      rowData =
        rowData +
        `<td  style="${tbodyStyle}${
          item.type == "amount" ? ";text-align:right" : ";text-align:center"
        }">${
          item.type == "amount"
            ? formatCurrency(data[item.value])
            : data[item.value]
        }</td>`;
    });
    tableBodyData.push(`<tr style="border: 1px solid black;">${rowData}</tr>`);
    totalValue += Number(data.paidAmount);
    totalDue += Number(data.currentDue);
  });
  tableBodyData = tableBodyData.join("");

  let inputData = String(totalValue);
  var paisa;
  var amount;
  if (inputData.indexOf(".") !== -1) {
    paisa = String(inputData).split(".")[1];
    amount = String(inputData).split(".")[0];
  } else {
    paisa = "00";
    amount = inputData;
  }
  let inWords = await inwords(Number(amount));
  let paisaword = await inwords(Number(paisa));

  inWords += paisa != "00" ? "AND " + paisaword + "PAISA" : "";

  //   var inWords = await inwords(totalValue);
  totalValue = formatCurrency(totalValue);
  let mainHtml;
  let cash = demandNoteDetails[0].mode.toLowerCase();
  if (!qrCode) {
    mainHtml = `<!DOCTYPE html>
        <html lang="en">
        ​
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
            <style>
            * {
                box-sizing: border-box;
                font-family: sans-serif;
            }
    
            ​.container {
                font-family: sans-serif;
            }
    
            ​
            /* .logo { float: left; padding-left: 70px; }​.address { float: left; width: 600px; padding-left: 25px; }​.clearfix { content: ""; clear: both; display: table; overflow: auto; }​.line { border: 1px solid; margin-top: 10px; margin-bottom: 10px; } */
            ​
            /* table, th, td { border: 1px solid black; border-collapse: collapse; font-size:  11px; font-family: sans-serif; } */
            ​
            /* th, td { padding: 10px; } */
            ​
            /* p { line-height: 1.5; }​p, h3 { margin: 0; padding: 0; } */
            ​
            /* .signature { text-align: center; margin-top: 20px; margin-bottom: 20px; } */
        </style>
        </head>
        ​
        <body style="padding: 15px;padding-top: 5px;">
        ​
            <div class="container" style="width: 100%;text-align: center">
            <div class="logo"> <img src=https://www.ncfe.ac.in/files/NCFE%20CVR%20-%20Copy.png width="120px" /> </div>
                <div class="address" style=" width:100%; padding-left: 25px;font-size:10px">
                <h3 style="margin: 0; padding: 0;">NATIONAL CENTER FOR EXCELLENCE</h3>
                <p style=" line-height: 1.5;margin: 0; padding: 0;">CV Raman Nagar</p>
                <p style=" line-height: 1.5;margin: 0; padding: 0;">154/1, Vijay Kiran Knowledge Park,<br />5th Main,Malleshpalya,Bengaluru-560075</p>
                <p style=" line-height: 1.5;margin: 0; padding: 0;">Karnataka</p>
                <p style=" line-height: 1.5;margin: 0; padding: 0;">Contact: +918047185857</p>
                </div>
            </div>
            </div>​<div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>
            <div class="line" style=" border: 1px solid; margin-bottom: 5px;"></div>​
        
            <h2 style="font-size:15px;text-align:center;margin:0;line-height: 0;">Fees Receipt</h2>
        ​
        ​<div style="font-size:  10px; font-family: sans-serif; margin-top: 5px;">
        <div style="width: 33.33%;float: left; text-align: left; padding-bottom: 5px;">
                    <div>Date:</div>
                    <div style="font-weight: bold;">${dateToday}</div>
                </div>
                <div style="width: 33.33%;float: left;text-align: center; padding-bottom: 5px;">
                    <div>Transaction ID:</div>
                    <div style="font-weight: bold;">${receiptNo}</div>
                </div>
                <div style="width: 33.33%;float: left;text-align: right; padding-bottom: 5px;">
                    <div>Mode:</div>
                    <div style="font-weight: bold;text-transform:uppercase;">${
                      demandNoteDetails[0].mode
                    }</div>
                </div>
            </div>
        ​  <p style="font-size:10px;
        margin:0;
        font-family:sans-serif;
        text-align:center;
        font-weight:bold;
        margin-top: 0px;
        margin-bottom: 0px;
        height:0px">STUDENT DETAILS</p>
            <table style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
            <tr>
            <td
                style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                Academic Year</td>
            <td
                style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                Registration ID</td>
            <td
                style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                Student Name</td>
            <td
                style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                Class/Batch</td>​
        </tr>
                <tr>
                    <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;"> ${
                      demandNoteDetails[0].academicYear
                    }</td>
                    <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;"> ${
                      demandNoteDetails[0].regId
                    }</td>
                    
                    <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">${
                      demandNoteDetails[0].studentName
                    }</td>
                    <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">${
                      demandNoteDetails[0].class
                    }</td>
                </tr>
        ​
            </table>

            <p style="font-size:10px;
        margin:0;
        font-family:sans-serif;
        text-align:center;
        font-weight:bold;
        margin-top: 10px;
        margin-bottom: 0px;
        height:0px">FEES SUMMARY</p>

        <table
            style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
            <tr>
                <td
                    style="width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                    Total Fees</td>
                <td
                    style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                    Received</td>
                <td
                    style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                    This Transaction</td>
                <td
                    style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                    Pending</td>​
            </tr>
            <tr>
                <td
                    style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    ₹1,00,000.00</td>
                <td
                    style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    ₹0.00</td>
                <td
                    style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    ₹60,000.00</td>
                <td
                    style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    ₹40,000.00</td>
            </tr>​
        </table>
        <p style="font-size:10px;
        margin:0;
        font-family:sans-serif;
        text-align:center;
        font-weight:bold;
        margin-top: 10px;
        margin-bottom: 0px;
        height:0px">TRANSACTION DETAILS</p>
            <br>
            <table style="width:100%; border: 1px solid black;
            border-collapse: collapse;
            font-size: 12px;
            font-family: sans-serif;">
      
            ${tableHeaderData}${tableBodyData}
                <tr>
                    <td colspan="2" style="text-align:right;font-weight:bold;  border: 1px solid black;
                    border-collapse: collapse;
                    font-size: 12px;
                    font-family: sans-serif;padding: 10px;">TOTAL</td>
                    <td style="text-align:right;font-weight:bold;  border: 1px solid black;
                    border-collapse: collapse;
                    font-size: 12px;
                    font-family: sans-serif;padding: 10px;">${formatCurrency(
                      totalDue
                    )}</td>
                </tr>
                <tr>
                    <td colspan="6" style="font-weight:bold; border: 1px solid black;
                    border-collapse: collapse;
                    font-size: 12px;
                    font-family: sans-serif;padding: 10px;">AMOUNT IN WORDS: INR ${inWords} ONLY</td>
                </tr>
   
            </table>
        ​
            <p class="signature" style="text-align: center;
            margin: 0px;font-size:10px;margin-bottom:0px">This is a computer generated fee receipt and does not require any signature</p>
        </body>
        ​
        </html>`;
  } else {
    mainHtml = `<!DOCTYPE html>
      <html lang="en">
      ​
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
          * {
              box-sizing: border-box;
              font-family: sans-serif;
          }
  
          ​.container {
              font-family: sans-serif;
          }
  
          ​
          /* .logo { float: left; padding-left: 70px; }​.address { float: left; width: 600px; padding-left: 25px; }​.clearfix { content: ""; clear: both; display: table; overflow: auto; }​.line { border: 1px solid; margin-top: 10px; margin-bottom: 10px; } */
          ​
          /* table, th, td { border: 1px solid black; border-collapse: collapse; font-size:  11px; font-family: sans-serif; } */
          ​
          /* th, td { padding: 10px; } */
          ​
          /* p { line-height: 1.5; }​p, h3 { margin: 0; padding: 0; } */
          ​
          /* .signature { text-align: center; margin-top: 20px; margin-bottom: 20px; } */
      </style>
      </head>
      ​
      <body style="padding: 15px;padding-top: 5px;">
      ​
          <div class="container" style="width: 100%;text-align: center">
          <div class="logo"> <img src=https://www.ncfe.ac.in/files/NCFE%20CVR%20-%20Copy.png width="120px" /> </div>
              <div class="address" style=" width:100%; padding-left: 25px;font-size:10px">
              <h3 style="margin: 0; padding: 0;">NATIONAL CENTER FOR EXCELLENCE</h3>
              <p style=" line-height: 1.5;margin: 0; padding: 0;">CV Raman Nagar</p>
              <p style=" line-height: 1.5;margin: 0; padding: 0;">154/1, Vijay Kiran Knowledge Park,<br />5th Main,Malleshpalya,Bengaluru-560075</p>
              <p style=" line-height: 1.5;margin: 0; padding: 0;">Karnataka</p>
              <p style=" line-height: 1.5;margin: 0; padding: 0;">Contact: +918047185857</p>
              </div>
          </div>
          </div>​<div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>
          <div class="line" style=" border: 1px solid; margin-bottom: 5px;"></div>​
      
          <h2 style="font-size:15px;text-align:center;margin:0;line-height: 0;">Fees Receipt</h2>
      ​
      ​<div style="font-size:  10px; font-family: sans-serif; margin-top: 5px;">
      <div style="width: 33.33%;float: left; text-align: left; padding-bottom: 5px;">
                  <div>Date:</div>
                  <div style="font-weight: bold;">${dateToday}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: center; padding-bottom: 5px;">
                  <div>Transaction ID:</div>
                  <div style="font-weight: bold;">${receiptNo}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: right; padding-bottom: 5px;">
                  <div>Mode:</div>
                  <div style="font-weight: bold;text-transform:uppercase;">${
                    demandNoteDetails[0].mode
                  }</div>
              </div>
          </div>
      ​  <p style="font-size:10px;
      margin:0;
      font-family:sans-serif;
      text-align:center;
      font-weight:bold;
      margin-top: 0px;
      margin-bottom: 0px;
      height:0px">STUDENT DETAILS</p>
          <table style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
          <tr>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Academic Year</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Registration ID</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Student Name</td>
          <td
              style=" padding: 5px;  background-color: #f2f2f2; text-align: left; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
              Class/Batch</td>​
      </tr>
              <tr>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;"> ${
                    demandNoteDetails[0].academicYear
                  }</td>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;"> ${
                    demandNoteDetails[0].regId
                  }</td>
                  
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">${
                    demandNoteDetails[0].studentName
                  }</td>
                  <td style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">${
                    demandNoteDetails[0].class
                  }</td>
              </tr>
      ​
          </table>

          <p style="font-size:10px;
      margin:0;
      font-family:sans-serif;
      text-align:center;
      font-weight:bold;
      margin-top: 10px;
      margin-bottom: 0px;
      height:0px">FEES SUMMARY</p>

      <table
          style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
          <tr>
              <td
                  style="width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Total Fees</td>
              <td
                  style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Received</td>
              <td
                  style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  This Transaction</td>
              <td
                  style=" width:25%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                  Pending</td>​
          </tr>
          <tr>
              <td
                  style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                  ${formatCurrency(
                    demandNoteDetails[0].studentFeesDetails.amount
                  )} </td>
              <td
                  style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                  ${formatCurrency(
                    demandNoteDetails[0].studentFeesDetails.paid
                  )}</td>
              <td
                  style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                  ${formatCurrency(demandNoteDetails[0].paidAmount)}</td>
              <td
                  style=" width:25%; text-align:center;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                  ${formatCurrency(
                    demandNoteDetails[0].studentFeesDetails.pending
                  )}</td>
          </tr>​
      </table>
      <p style="font-size:10px;
      margin:0;
      font-family:sans-serif;
      text-align:center;
      font-weight:bold;
      margin-top: 10px;
      margin-bottom: 0px;
      height:0px">TRANSACTION DETAILS</p>
          <br>
          <table style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
    
          ${tableHeaderData}${tableBodyData}
              <tr>
                  <td colspan="2" style="text-align:right;font-weight:bold;  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">TOTAL</td>
                  <td style="text-align:right;font-weight:bold;  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${formatCurrency(
                    totalDue
                  )}</td>
              </tr>
              <tr>
                  <td colspan="6" style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">AMOUNT IN WORDS: INR ${inWords} ONLY</td>
              </tr>
        ​ <tr> <td colspan="6" style="height:100px;border: 1px solid black;
        border-collapse: collapse; padding: 10px;">         
      ${qrCode}
      <p style="text-align:center">Please scan the QR code to access this receipt from our portal<p></td></tr>
            </table>
        ​
            <p class="signature" style="text-align: center;
            margin: 0px;font-size:10px;margin-bottom:0px">This is a computer generated fee receipt and does not require any signature</p>
        </body>
        ​
        </html>`;
  }

  // console.log(mainHtml);
  return mainHtml;
};
module.exports = { receiptVkgiTemplate, receiptVkgiPdf };
