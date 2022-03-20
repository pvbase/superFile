const moment = require("moment");
const depositReceiptTemplate = (orgDetails, transaction) => {
  return `
  
  <div style="display:flex;justify-content:flex-start;"><img  title="logo.jpg" alt="" width="148" height="148" src="${orgDetails.logo.logo}"/><p style="margin-left:20px"><strong>${orgDetails.instituteDetails.instituteName}</strong><br />${orgDetails.instituteDetails.address1},${orgDetails.instituteDetails.address2},${orgDetails.instituteDetails.address3} <br /> ${orgDetails.instituteDetails.cityTown},PIN - ${orgDetails.instituteDetails.pinCode}<br />${orgDetails.instituteDetails.stateName}<br />Contact: ${orgDetails.instituteDetails.email}<br />Ph:${orgDetails.instituteDetails.phoneNumber1}</p></div>
<br>
<hr/>
<br>
<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 35 35\"><path d=\"M1 1h7v7h-7zM10 1h2v1h1v1h-1v2h-1v2h-1v1h1v2h1v1h-1v1h1v1h-1v1h1v1h1v1h-1v1h-1v-2h-1v-1h-1v-1h-1v-1h1v-2h1v-1h-1v-6h1v1h1v-2h-1zM15 1h1v1h-1zM17 1h1v3h-1v-1h-1v-1h1zM19 1h3v1h2v1h-1v1h-1v-1h-1v-1h-1v1h-1zM24 1h1v1h-1zM27 1h7v7h-7zM2 2v5h5v-5zM25 2h1v1h-1zM28 2v5h5v-5zM3 3h3v3h-3zM15 3h1v1h-1zM20 3h1v1h-1zM24 3h1v1h1v1h-1v1h-1zM29 3h3v3h-3zM13 4h1v1h-1zM19 4h1v1h-1zM12 5h1v1h1v2h-1v-1h-1zM15 5h4v2h-1v-1h-2v3h-1zM21 5h2v1h-2zM20 6h1v1h-1zM23 6h1v2h1v-2h1v6h-1v-1h-1v-1h1v-1h-1v1h-1v-1h-2v1h2v1h-4v1h5v1h3v1h-2v1h-1v-1h-1v-1h-2v1h-1v-1h-2v1h-1v-1h-1v-1h-1v1h-1v-1h-1v-2h1v-1h1v2h2v1h1v-3h1v1h1v-2h1v-1h1v1h1zM11 7h1v1h-1zM17 7h1v2h-1zM19 7h1v1h-1zM12 8h1v1h-1zM1 9h1v1h1v-1h5v1h-2v1h2v1h-2v1h2v1h-1v1h-1v-1h-2v1h2v1h-3v-1h-1v-1h-1zM27 9h5v1h2v1h-2v1h2v3h-1v1h-1v-3h-1v3h1v1h-1v1h1v3h-1v1h1v1h1v1h1v1h-4v-1h1v-1h-1v-1h-1v-1h-1v-1h-1v1h-1v1h-1v1h-1v-1h-1v-1h-1v3h1v-1h1v1h1v1h1v-2h1v-1h2v1h1v1h-1v1h1v3h1v-2h3v1h-2v1h2v3h-2v2h-3v-1h1v-1h1v-1h1v-1h-1v1h-1v1h-1v-1h-2v1h-1v1h-1v-1h-1v-1h1v-1h-1v-1h-1v-1h2v-1h-2v-1h-2v1h1v1h-3v1h1v1h-2v-1h-1v1h1v1h-1v1h1v1h-1v2h-2v-1h1v-1h-1v-1h1v-4h1v-1h1v-1h1v1h1v-2h1v-1h-1v-1h1v-3h2v1h1v1h1v-1h1v-1h1v-1h1v-1h1v-1h1v-2h-1v-3h1v1h1v-1h-1v-1h-1v1h-2zM4 10v1h-2v2h1v-1h1v-1h1v-1zM27 12h1v1h-1zM12 13h2v2h-1v-1h-1zM15 13h1v1h-1zM16 14h1v1h1v1h-1v2h-2v-1h-2v-1h1v-1h2zM18 14h2v1h-2zM27 14h1v3h-1v1h-2v-1h1v-2h1zM7 15h3v1h-1v1h2v2h-1v1h1v1h-1v1h1v-1h1v-1h-1v-1h2v1h1v2h-2v3h-1v-2h-1v4h-1v-1h-6v-2h1v1h4v-1h1v-1h-1v-1h-1v-1h2v-3h-4v-1h1v-1h1v1h1v-1h-1zM23 15h1v1h1v1h-1v1h-1v-1h-1v-1h1zM1 16h2v2h2v1h-3v1h1v1h-1v1h2v1h-2v3h-1zM12 17h1v1h-1zM18 17h3v2h-1v1h-1v-2h-1zM33 17h1v2h-1zM13 18h2v1h-2zM17 18h1v2h-1v1h-1v-1h-1v-1h2zM24 18h1v1h-1zM29 18v1h1v1h1v-1h-1v-1zM5 19h1v2h-2v-1h1zM7 19h1v1h-1zM19 21h1v1h-1zM5 22h2v1h-1v1h-1zM14 22h1v3h-1v-1h-1v-1h1zM16 22h3v2h-1v-1h-2zM33 22h1v1h-1zM7 23h1v1h-1zM17 24h1v1h-1zM27 24v1h1v-1zM12 25h2v2h-1v-1h-1zM15 25h1v2h-1zM11 26h1v1h-1zM26 26v3h3v-3zM1 27h7v7h-7zM27 27h1v1h-1zM2 28v5h5v-5zM9 28h1v1h1v1h1v1h2v1h-3v1h-1v-1h-1zM11 28h2v2h-1v-1h-1zM14 28h1v1h-1zM21 28h2v1h-2zM3 29h3v3h-3zM20 29h1v1h2v1h-5v-1h2zM23 29h1v1h-1zM14 30h1v1h-1zM23 31h1v2h2v1h-3v-1h-1v-1h1zM27 31h2v1h-2zM20 32h1v1h-1zM26 32h1v1h-1zM9 33h1v1h-1zM11 33h3v1h-3zM18 33h1v1h-1zM27 33h2v1h-2zM32 33h1v1h-1z\"/></svg>
<p><strong>Dear Parent,</strong></p>
<p>Thank you for your payment. The transaction id is: ${transaction.transactionId}. Please find attached fee receipt for your ward ${transaction.studentName}.</p>

<p>Please contact us for any questions or clarification</p>
<p>Regards,</p>
<p><strong>${orgDetails.instituteDetails.instituteName} Accounts Team</strong></p>
<p>&nbsp;</p>`;
};

const depositReceiptPdf = async (
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
    " text-align:left; border: 1px solid black;border-collapse: collapse;font-size: 12px;font-family: sans-serif;padding: 10px;";
  const tbodyStyle =
    "width:30%;text-align:left;font-weight:bold; border: 1px solid black;border-collapse: collapse;font-size: 12px;font-family: sans-serif;padding: 10px;";

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

  var inWords = await inwords(totalValue);
  totalValue = formatCurrency(totalValue);
  let mainHtml;
  if (!qrCode) {
    if (type == "Deposit") {
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
      ​
              .container {
                  font-family: sans-serif;
              }
      ​
              /* .logo {
                  float: left;
                  padding-left: 70px;
                  padding-top: 30px;
              }
      ​
              .address {
                  float: left;
                  width: 600px;
                  padding-top: 35px;
                  padding-left: 25px;
              }
      ​
              .clearfix {
                  content: "";
                  clear: both;
                  display: table;
                  overflow: auto;
              }
      ​
              .line {
                  border: 1px solid;
                  margin-top: 20px;
                  margin-bottom: 30px;
              } */
      ​
              /* table,
              th,
              td {
                  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;
              } */
      ​
              /* th,
              td {
                  padding: 10px;
              } */
      ​
              /* p {
                  line-height: 1.5;
              }
      ​
              p,
              h3 {
                  margin: 0;
                  padding: 0;
              } */
      ​
              /* .signature {
                  text-align: center;
                  margin-top: 150px;
                  margin-bottom: 150px;
              } */
          </style>
      </head>
      ​
      <body style="padding: 25px;">
      ​
          <div class="container">
              <div class="logo" style=" float: left;
              padding-top: 20px;">
                  <img src=${orgDetails.logo.logo} width="120px" />
              </div>
              <div class="address" style=" float: left;
              width: 320px;
              padding-top: 35px;
              padding-left: 25px;font-size:12px">
                  <h3 style="margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.instituteName}</h3>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.address1},${
        orgDetails.instituteDetails.address2
      },${orgDetails.instituteDetails.address3}</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.cityTown}, ${
        orgDetails.instituteDetails.pinCode
      }</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.stateName}</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">Contact: ${
                    orgDetails.instituteDetails.phoneNumber1
                  }</p>
              </div>
          </div>
      ​
          <div class="clearfix" style="
          clear: both;
          display: table;
          overflow: auto;"></div>
          <div class="line" style=" border: 1px solid;
          margin-top: 20px;
          margin-bottom: 30px;"></div>
      ​
          <h2 style="text-align:center;margin:0;">Fees Receipt</h2>
      ​
          <div style="font-size: 12px; font-family: sans-serif; margin-top: 10px;">
              <div style="width: 33.33%;float: left; text-align: left;">
                  <div>Date:</div>
                  <div style="font-weight: bold;">${dateToday}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: center;">
                  <div>Receipt No:</div>
                  <div style="font-weight: bold;">${receiptNo}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: right;">
                  <div>Mode:</div>
                  <div style="font-weight: bold;text-transform:uppercase;">${
                    demandNoteDetails[0].mode
                  }</div>
              </div>
          </div>
      ​
          <table style="width:100%; border: 1px solid black;
          border-collapse: collapse;
          font-size: 12px;
          font-family: sans-serif;">
              <tr>
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Academic Year</td>
                 
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Student Name</td>
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Class/Section</td>
      ​
              </tr>
              <tr>
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;"> ${
                    demandNoteDetails[0].academicYear
                  }</td>
                  
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${
                    demandNoteDetails[0].studentName
                  }</td>
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${
                    demandNoteDetails[0].class
                  }</td>
              </tr>
      ​
          </table>
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
      ​        
          </table>
      
          <p class="signature" style="text-align: center;
          margin-top: 20px;font-size:10px;margin-bottom:0">This is a computer generated fee receipt and does not require any signature</p>
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
      ​
              .container {
                  font-family: sans-serif;
              }
      ​
              /* .logo {
                  float: left;
                  padding-left: 70px;
                  padding-top: 30px;
              }
      ​
              .address {
                  float: left;
                  width: 600px;
                  padding-top: 35px;
                  padding-left: 25px;
              }
      ​
              .clearfix {
                  content: "";
                  clear: both;
                  display: table;
                  overflow: auto;
              }
      ​
              .line {
                  border: 1px solid;
                  margin-top: 20px;
                  margin-bottom: 30px;
              } */
      ​
              /* table,
              th,
              td {
                  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;
              } */
      ​
              /* th,
              td {
                  padding: 10px;
              } */
      ​
              /* p {
                  line-height: 1.5;
              }
      ​
              p,
              h3 {
                  margin: 0;
                  padding: 0;
              } */
      ​
              /* .signature {
                  text-align: center;
                  margin-top: 150px;
                  margin-bottom: 150px;
              } */
          </style>
      </head>
      ​
      <body style="padding: 25px;">
      ​
          <div class="container">
              <div class="logo" style=" float: left;
              padding-top: 20px;">
                  <img src=${orgDetails.logo.logo} width="120px" />
              </div>
              <div class="address" style=" float: left;
              width: 320px;
              padding-top: 35px;
              padding-left: 25px;font-size:12px">
                  <h3 style="margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.instituteName}</h3>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.address1},${
        orgDetails.instituteDetails.address2
      },${orgDetails.instituteDetails.address3}</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.cityTown}, ${
        orgDetails.instituteDetails.pinCode
      }</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.stateName}</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">Contact: ${
                    orgDetails.instituteDetails.phoneNumber1
                  }</p>
              </div>
          </div>
      ​
          <div class="clearfix" style="
          clear: both;
          display: table;
          overflow: auto;"></div>
          <div class="line" style=" border: 1px solid;
          margin-top: 20px;
          margin-bottom: 30px;"></div>
      ​
          <h2 style="text-align:center;margin:0;">Fees Acknowledgement</h2>
      ​
          <div style="font-size: 12px; font-family: sans-serif; margin-top: 10px;">
              <div style="width: 33.33%;float: left; text-align: left;">
                  <div>Date:</div>
                  <div style="font-weight: bold;">${dateToday}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: center;">
                  <div>Transaction ID:</div>
                  <div style="font-weight: bold;">${receiptNo}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: right;">
                  <div>Mode:</div>
                  <div style="font-weight: bold;text-transform:uppercase;">${
                    demandNoteDetails[0].mode
                  }</div>
              </div>
          </div>
      ​
          <table style="width:100%; border: 1px solid black;
          border-collapse: collapse;
          font-size: 12px;
          font-family: sans-serif;">
              <tr>
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Academic Year</td>
                 
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Student Name</td>
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Class/Section</td>
      ​
              </tr>
              <tr>
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;"> ${
                    demandNoteDetails[0].academicYear
                  }</td>
                  
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${
                    demandNoteDetails[0].studentName
                  }</td>
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${
                    demandNoteDetails[0].class
                  }</td>
              </tr>
      ​
          </table>
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
          margin-top: 20px;font-size:10px;margin-bottom:0">This is a computer generated fee receipt and does not require any signature</p>
      </body>
      ​
      </html>`;
    }
  } else {
    if (type == "receipt") {
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
      ​
              .container {
                  font-family: sans-serif;
              }
      ​
              /* .logo {
                  float: left;
                  padding-left: 70px;
                  padding-top: 30px;
              }
      ​
              .address {
                  float: left;
                  width: 600px;
                  padding-top: 35px;
                  padding-left: 25px;
              }
      ​
              .clearfix {
                  content: "";
                  clear: both;
                  display: table;
                  overflow: auto;
              }
      ​
              .line {
                  border: 1px solid;
                  margin-top: 20px;
                  margin-bottom: 30px;
              } */
      ​
              /* table,
              th,
              td {
                  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;
              } */
      ​
              /* th,
              td {
                  padding: 10px;
              } */
      ​
              /* p {
                  line-height: 1.5;
              }
      ​
              p,
              h3 {
                  margin: 0;
                  padding: 0;
              } */
      ​
              /* .signature {
                  text-align: center;
                  margin-top: 150px;
                  margin-bottom: 150px;
              } */
          </style>
      </head>
      ​
      <body style="padding: 25px;">
      ​
          <div class="container">
              <div class="logo" style=" float: left;
              padding-top: 20px;">
                  <img src=${orgDetails.logo.logo} width="120px" />
              </div>
              <div class="address" style=" float: left;
              width: 320px;
              padding-top: 35px;
              padding-left: 25px;font-size:12px">
                  <h3 style="margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.instituteName}</h3>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.address1},${
        orgDetails.instituteDetails.address2
      },${orgDetails.instituteDetails.address3}</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.cityTown}, ${
        orgDetails.instituteDetails.pinCode
      }</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.stateName}</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">Contact: ${
                    orgDetails.instituteDetails.phoneNumber1
                  }</p>
              </div>
          </div>
      ​
          <div class="clearfix" style="
          clear: both;
          display: table;
          overflow: auto;"></div>
          <div class="line" style=" border: 1px solid;
          margin-top: 20px;
          margin-bottom: 30px;"></div>
      ​
          <h2 style="text-align:center;margin:0;">Fees Receipt</h2>
      ​
          <div style="font-size: 12px; font-family: sans-serif; margin-top: 10px;">
              <div style="width: 33.33%;float: left; text-align: left;">
                  <div>Date:</div>
                  <div style="font-weight: bold;">${dateToday}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: center;">
                  <div>Receipt No:</div>
                  <div style="font-weight: bold;">${receiptNo}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: right;">
                  <div>Mode:</div>
                  <div style="font-weight: bold;text-transform:uppercase;">${
                    demandNoteDetails[0].mode
                  }</div>
              </div>
          </div>
      ​
          <table style="width:100%; border: 1px solid black;
          border-collapse: collapse;
          font-size: 12px;
          font-family: sans-serif;">
              <tr>
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Academic Year</td>
                 
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Student Name</td>
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Class/Section</td>
      ​
              </tr>
              <tr>
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;"> ${
                    demandNoteDetails[0].academicYear
                  }</td>
                  
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${
                    demandNoteDetails[0].studentName
                  }</td>
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${
                    demandNoteDetails[0].class
                  }</td>
              </tr>
      ​
          </table>
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
      ​        <tr> <td colspan="6" style="height:100px;border: 1px solid black;
      border-collapse: collapse; padding: 10px;">
      ${qrCode}
      <p style="text-align:center">Please scan the QR code to access this receipt from our portal<p></td></tr>
          </table>
      
          <p class="signature" style="text-align: center;
          margin-top: 20px;font-size:10px;margin-bottom:0">This is a computer generated fee receipt and does not require any signature</p>
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
      ​
              .container {
                  font-family: sans-serif;
              }
      ​
              /* .logo {
                  float: left;
                  padding-left: 70px;
                  padding-top: 30px;
              }
      ​
              .address {
                  float: left;
                  width: 600px;
                  padding-top: 35px;
                  padding-left: 25px;
              }
      ​
              .clearfix {
                  content: "";
                  clear: both;
                  display: table;
                  overflow: auto;
              }
      ​
              .line {
                  border: 1px solid;
                  margin-top: 20px;
                  margin-bottom: 30px;
              } */
      ​
              /* table,
              th,
              td {
                  border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;
              } */
      ​
              /* th,
              td {
                  padding: 10px;
              } */
      ​
              /* p {
                  line-height: 1.5;
              }
      ​
              p,
              h3 {
                  margin: 0;
                  padding: 0;
              } */
      ​
              /* .signature {
                  text-align: center;
                  margin-top: 150px;
                  margin-bottom: 150px;
              } */
          </style>
      </head>
      ​
      <body style="padding: 25px;">
      ​
          <div class="container">
              <div class="logo" style=" float: left;
              padding-top: 20px;">
                  <img src=${orgDetails.logo.logo} width="120px" />
              </div>
              <div class="address" style=" float: left;
              width: 320px;
              padding-top: 35px;
              padding-left: 25px;font-size:12px">
                  <h3 style="margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.instituteName}</h3>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.address1},${
        orgDetails.instituteDetails.address2
      },${orgDetails.instituteDetails.address3}</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.cityTown}, ${
        orgDetails.instituteDetails.pinCode
      }</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">${orgDetails.instituteDetails.stateName}</p>
                  <p style=" line-height: 1.5;margin: 0;
                  padding: 0;">Contact: ${
                    orgDetails.instituteDetails.phoneNumber1
                  }</p>
              </div>
          </div>
      ​
          <div class="clearfix" style="
          clear: both;
          display: table;
          overflow: auto;"></div>
          <div class="line" style=" border: 1px solid;
          margin-top: 20px;
          margin-bottom: 30px;"></div>
      ​
          <h2 style="text-align:center;margin:0;">Fees Acknowledgement</h2>
      ​
          <div style="font-size: 12px; font-family: sans-serif; margin-top: 10px;">
              <div style="width: 33.33%;float: left; text-align: left;">
                  <div>Date:</div>
                  <div style="font-weight: bold;">${dateToday}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: center;">
                  <div>Transaction ID:</div>
                  <div style="font-weight: bold;">${receiptNo}</div>
              </div>
              <div style="width: 33.33%;float: left;text-align: right;">
                  <div>Mode:</div>
                  <div style="font-weight: bold;text-transform:uppercase;">${
                    demandNoteDetails[0].mode
                  }</div>
              </div>
          </div>
      ​
          <table style="width:100%; border: 1px solid black;
          border-collapse: collapse;
          font-size: 12px;
          font-family: sans-serif;">
              <tr>
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Academic Year</td>
                 
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Student Name</td>
                  <td style="text-align:left; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">Class/Section</td>
      ​
              </tr>
              <tr>
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;"> ${
                    demandNoteDetails[0].academicYear
                  }</td>
                  
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${
                    demandNoteDetails[0].studentName
                  }</td>
                  <td style="font-weight:bold; border: 1px solid black;
                  border-collapse: collapse;
                  font-size: 12px;
                  font-family: sans-serif;padding: 10px;">${
                    demandNoteDetails[0].class
                  }</td>
              </tr>
      ​
          </table>
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
      ​ <tr> <td colspan="6" style="height:100px;border: 1px solid black;
      border-collapse: collapse; padding: 10px;">         
    ${qrCode}
    <p style="text-align:center">Please scan the QR code to access this receipt from our portal<p></td></tr>
          </table>
      ​
          <p class="signature" style="text-align: center;
          margin-top: 20px;font-size:10px;margin-bottom:0">This is a computer generated fee receipt and does not require any signature</p>
      </body>
      ​
      </html>`;
    }
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
    "SENENTEEN ",
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
        "ONLY "
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
module.exports = { depositReceiptTemplate, depositReceiptPdf };
