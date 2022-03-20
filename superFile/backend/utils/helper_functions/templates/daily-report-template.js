// let vkgiLogo = "https://fc-vkgi.zenqore.com/static/media/campus_logo.f9cc121d.png"
let vkgiLogo = "https://supportings.blob.core.windows.net/zenqore-supportings/ncef.png"

const dailyReportTemplate = async (dailyReportData, todayReportData) => {

    let dailyReport = `<!DOCTYPE html>

    <html lang="en">​
    
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
            td[rowspan] {
                position: relative;
            }
    
            td[rowspan]:before {
                position: absolute;
                content: "";
                top: -1px;
                left: -1px;
                background-color: transparent;
                border: solid #000 1px;
                width: 100%;
                height: 100%;
            }
        </style>
    </head>​
    
    <body>
        <div style="padding: 15px;padding-top: 5px;">​<div class="container" style="width: 100%;text-align: center">
                <div class="logo"> <img src=${vkgiLogo}
                        alt="logo will be displayed here" width="100px" /> </div>
    
            </div>​<div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>
            <hr style="border:1px solid black; background: black;" />
            <br />
            <h2 style="font-size:12px;text-align:center;margin:0;line-height: 0;">OVERALL FEE COLLECTION REPORT</h2>
            <br />
            <table
                style="width:100%; margin: 0 0 0 auto ;border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
                <tbody>
                    <tr>
                        <td
                            style="padding: 5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                            FROM DATE</td>
                        <td
                            style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                            ${"Apr 1, 2021"}</td>
                        <td
                            style="padding: 5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                            TO DATE</td>
                        <td
                            style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                            ${dailyReportData.toDate}</td>
                        <td
                            style="padding: 5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                            Creation Time</td>
                        <td
                            style="border: 1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                            ${dailyReportData.time}</td>
                    </tr>
                </tbody>
            </table>
    
            <br />
            <div style="width:100%;">
                <h6 style="text-align:center;font-size:'10px';margin:0;line-height: 0;">Term 1</h6>
                <table
                    style="border-spacing: 0;border:0px;table-layout:fixed;width:100%; margin: 0 0 0 auto; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
                    <tbody>
                        <tr>
                            <td rowspan="2" 
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Campus</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL RECEIVABLES</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL RECEIVED</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL PENDING</td>​
                            <td colspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                No. of students</td>
                            </tr>
                        <tr>

                            <td
                                style="width:50%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Paid
                            </td>
                            <td
                            style="width:50%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                            Pending 
                        </td>
                   
                        </tr>
                        ${dailyReportData["Term 1"].map(item => {
        if (item.campus !== "Total") {
            return `<tr>
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.campus}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.planned)}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.received)}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.pending)}</td>
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.noOfStudentsPaid}</td>​
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.noOfStudentsPending}</td>​
                        </tr>`}
        else return `<tr>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                TOTAL</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalPlanned)}</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalReceived)}</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalPending)}</td>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.totalStudentsPaid}</td>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.totalStudentsPending}</td>
                        </tr>`}
    ).join("")}
                    </tbody>​
                </table>
            </div>
    
            <br />
            <div style="width:100%;">
                <h6 style="text-align:center;font-size:'10px';margin:0;line-height: 0;">Term 2</h6>
                <table
                    style="border-spacing: 0;border:0px;table-layout:fixed;width:100%; margin: 0 0 0 auto; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
                    <tbody>
                        <tr>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Campus</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL RECEIVABLES</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL RECEIVED</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL PENDING</td>​
                            <td colspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                No. of students</td>​
                            </tr>
                        <tr>
                            <td
                                style="width:50%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Paid </td>
                            <td
                            style="width:50%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                            Pending </td>
                        </tr>
                        ${dailyReportData["Term 2"].map(item => {
        if (item.campus !== "Total") {
            return `<tr>
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.campus}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.planned)}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.received)}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.pending)}</td>
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.noOfStudentsPaid}</td>​
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.noOfStudentsPending}</td>​
                        </tr>`}
        else return `<tr>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                TOTAL</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalPlanned)}</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalReceived)}</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalPending)}</td>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.totalStudentsPaid}</td>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.totalStudentsPending}</td>
                        </tr>`}
    ).join("")}
                    </tbody>​
                </table>
            </div>
            <br />
            <div style="width:100%;">
                <h6 style="text-align:center;font-size:'10px';margin:0;line-height: 0;">Total</h6>
                <table
                    style="border-spacing: 0;border:0px;table-layout:fixed;width:100%; margin: 0 0 0 auto; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
                    <tbody>
                        <tr>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Campus</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL RECEIVABLES</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL RECEIVED</td>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                TOTAL PENDING</td>​
                            <td colspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                No. of students</td>​
                            </tr>
                        <tr>
                            <td
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Paid </td>
                            <td
                            style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                            Pending </td>
                        </tr>
                        ${dailyReportData["Total"].map(item => {
        if (item.campus !== "Total") {
            return `<tr>
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.campus}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.overallPlanned)}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.overallReceived)}</td>
                            <td
                                style="border:1px solid black;text-align: right; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.overallPending)}</td>
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.overallStudentsPaid}</td>​
                            <td
                                style="border:1px solid black;text-align: center; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.overallStudentsPending}</td>​
                        </tr>`}
        else return `<tr>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                TOTAL</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalPlanned)}</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalReceived)}</td>
                            <td
                                style="border:1px solid black;text-align: right; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${formatCurrency(item.totalPending)}</td>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.totalStudentsPaid}</td>
                            <td
                                style="border:1px solid black;text-align: center; font-weight: bold; border-collapse: collapse; font-size: 8px; font-family: sans-serif;padding: 5px;">
                                ${item.totalStudentsPending}</td>
                        </tr>`}
    ).join("")}
    
                    </tbody>​
                </table>
            </div>
            <p style="padding:5px;margin:0;margin-top:5px;font-size:9px;text-align:left">Please login to the Fees
                Collection Admin Portal for more details.
            </p>
            <p class="signature" style="text-align: center; margin: 0px;font-size:8px;margin-bottom:0px;margin-top:30px">
                This is a computer generated report.
            </p>
        </div>
        <br />
        <br />
        <div style="padding: 15px;padding-top: 5px;padding-bottom: 0px;">​
            <div class="container" style="width: 100%;text-align: center">
                <div class="logo"> <img src=${vkgiLogo}
                        alt="logo will be displayed here" width="100px" /> </div>
    
            </div>​
            <div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>
            <hr style="border:1px solid black; background: black;" />
            <br />
            <h2 style="font-size:12px;text-align:center;margin:0;line-height: 0;">TODAY FEE COLLECTION REPORT
                (${String(dailyReportData.toDate).toUpperCase()})</h2>
        
            <div style="width:100%;">
                <table
                    style="width:100%; margin: 0 0 0 auto; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
                    <tbody>
                        <tr>
                            <td rowspan="2"
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Campus </td>
                            <td colspan="2"
                                style="width:40%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Term 1</td>
                            ​
                            <td colspan="2"
                                style="width:40%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Term 2</td>​
                        </tr>
                        <tr>
                            <td
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Received Amount
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                No. of Students Paid
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                Received Amount
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:center; background-color: #f2f2f2;  font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                No. of Students Paid
                            </td>
    
                        </tr>
                        ${todayReportData.map(item => {
        if (item.campus !== "Total") {
            return (`<tr>
                            <td
                                style="width:20%;padding:5px;text-align:center;font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                ${item.campus}
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:right; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                ${formatCurrency(item.term1TotalReceived)}
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:center; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                ${item.term1TotalStudents}
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:right; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                ${formatCurrency(item.term2TotalReceived)}
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:center; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                ${item.term2TotalStudents}
                            </td>​
                        </tr>`)
        }
        else {
            return (`<tr>
                            <td
                                style="width:20%;padding:5px;text-align:center;font-family: sans-serif; border: 1px solid #000; font-size: 8px;font-weight: bold; ">
                                TOTAL
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:right;font-family: sans-serif; border: 1px solid #000; font-size: 8px;font-weight: bold; ">
                                ${formatCurrency(item.term1TotalReceived)}
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:center;font-family: sans-serif; border: 1px solid #000; font-size: 8px;font-weight: bold; ">
                                ${item.term1TotalStudents}
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:right;font-family: sans-serif; border: 1px solid #000; font-size: 8px;font-weight: bold; ">
                                ${formatCurrency(item.term2TotalReceived)}
                            </td>
                            <td
                                style="width:20%;padding:5px;text-align:center;font-family: sans-serif; border: 1px solid #000; font-size: 8px;font-weight: bold; ">
                                ${item.term2TotalStudents}
                            </td>​
                        </tr>`)
        }
    }).join("")}
                        <tr>
                            <td
                                style="width:20%;padding:5px;text-align:center;font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                AMOUNT IN WORDS
                            </td>
                            <td colspan="2"
                                style="width:20%;padding:5px;text-align:left;font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                INR ${todayReportData[todayReportData.length - 1].term1TotalReceived > 0 ?
            inwords(todayReportData[todayReportData.length - 1].term1TotalReceived) : 'ZERO'} ONLY
                            </td>
                            <td colspan="2"
                                style="width:20%;padding:5px;text-align:left;   font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 8px;">
                                INR ${todayReportData[todayReportData.length - 1].term2TotalReceived > 0 ?
            inwords(todayReportData[todayReportData.length - 1].term2TotalReceived) : 'ZERO'} ONLY
                            </td>
                        </tr>
                    </tbody>​
                </table>
            </div>
    
            <p style="padding:5px;margin:0;margin-top:5px;font-size:10px;text-align:left;padding-left: 5px;">Please login to the Fees
                Collection Admin Portal for more details.
            </p>
            <p class="signature" style="text-align: center; margin: 0px;font-size:8px;margin-bottom:0px;margin-top:10px">
                This is a computer generated report.
            </p>
        </div>
    </body>​
    
    </html>
    
`
    return dailyReport
}

function formatCurrency(amount) {
    let x = Number(Number(amount).toFixed(2))
    let numComma = x.toString().split('.')[0].length > 3 ? x.toString().substring(0, x.toString().split('.')[0].length - 3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + x.toString().substring(x.toString().split('.')[0].length - 3) : x.toString();
    // console.log('formated Amount', numComma);
    let final = ''
    if (!String(numComma).includes('.')) {
        final = '₹' + numComma + '.00'
    }
    else {
        final = '₹' + numComma;
    };
    return final
}
function inwords(num) {
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
            (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]])
            : "";
    return str;
}

module.exports = { dailyReportTemplate };


