
const moment = require("moment");
const demandNoteTemplate = (
  orgDetails,
  demandNoteDetails,
  collectionUrl,
  openingLine,
  paidAmount,
  templateType
) => {
return (
    `<html>
    <head>
    </head>
    <body style="font-family: sans-serif;">
        <div class="body demandNoteTemplate">
<h3> Terms and Conditions</h3>
            </div>
            <p> Greetings from NCFE! We are happy to announce the commencement of the Academic Year ${academicYear}.</p>
            <ul>
          <li> <p>Your ward Aarav Mahesh is in Grade-1 and the annual fee for the Academic Year  ${academicYear} is <b>₹${totalAmount} </b></li>
          <li>The fees has to be paid in ${numofInstallment} installments as follows:</p>
            <table style= " border-collapse: collapse; width: 40%; height: 84px; border: 1px solid #000">
                <thead>
                        <th style="font-size: 12px; padding: 5px;text-align:center;  background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; ">TERM</th>
                        <th style="font-size: 12px; padding: 5px;text-align:center;  background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; ">DUE DATE</th>
                        <th style="font-size: 12px; padding: 5px;text-align:center;  background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; ">AMOUNT</th>
                        <th style="font-size: 12px; padding: 5px;text-align:center;  background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; ">STATUS</th>
                </thead>
                <tbody>
                    <tr>
                        <td  style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${term1}</td>
                        <td  style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${dueDate1}</td>
                        <td  style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">₹${termFee1}</td>
                        <td  style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${status1}</td>
​
                    </tr>
                    <tr>
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${term2}</td>
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${dueDate2}</td>
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${termFee2}</td>
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">${status2}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData" colspan="2"><b>TOTAL</b></td>
                        <!-- <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData">-</td> -->
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData"><b>₹${totalAmount}</b></td>
                        <td style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 12px; font-family: sans-serif;padding: 5px;"class="tableBodyData"><b>${status3}</b></td>
                    </tr>
                </tbody>
            </table>
           
        </li> 
          <li>  <p> Please note that a penalty of ₹${penaltyAmount} per day will be charged if the fees is not paid by <u> ${penaltyStartDate}</u>.</p></li>
        </ul>
            <p>Thanks and Regards</p>
        
        </div>
    </body>
</html>`)

}
formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };
  
  module.exports = { demandNoteTemplate };
  