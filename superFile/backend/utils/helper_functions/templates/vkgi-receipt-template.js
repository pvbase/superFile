 
 // NOTE:  Pass campus as "jbn" for JeevanBheema Nagar Campus and 'cvr' for CVRaman Nagar
 
 const receiptPdf = async (campus) => { 
    let mainHTML = `<!DOCTYPE html>
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
    </head>​
    
    <body style="padding: 15px;padding-top: 5px;">​<div class="container" style="width: 100%;text-align: center">
            <div class="logo"> <img src=https://www.ncfe.ac.in/files/NCFE%20CVR%20-%20Copy.png width="120px" /> </div>
          ${campus !== "jbn" ? `<div class="address" style=" width:100%; padding-left: 25px;font-size:10px">
            <h3 style="margin: 0; padding: 0;">NATIONAL CENTER FOR EXCELLENCE</h3>
            <p style=" line-height: 1.5;margin: 0; padding: 0;">CV Raman Nagar</p>
            <p style=" line-height: 1.5;margin: 0; padding: 0;">154/1, Vijay Kiran Knowledge Park,<br />5th Main,Malleshpalya,Bengaluru-560075</p>
            <p style=" line-height: 1.5;margin: 0; padding: 0;">Karnataka</p>
            <p style=" line-height: 1.5;margin: 0; padding: 0;">Contact: +918047185857</p>
        </div>` :
            `<div class="address" style=" width:100%; padding-left: 25px;font-size:10px">
                <h3 style="margin: 0; padding: 0;">NATIONAL CENTER FOR EXCELLENCE</h3>
                <p style=" line-height: 1.5;margin: 0; padding: 0;">Jeevanbhima Nagar</p>
                <p style=" line-height: 1.5;margin: 0; padding: 0;">1054/2, Puttappa Layout,<br />New Thippasandra,Bangalore-560075 </p>
                <p style=" line-height: 1.5;margin: 0; padding: 0;">Karnataka</p>
                <p style=" line-height: 1.5;margin: 0; padding: 0;">Contact: +918047185857</p>
            </div>`}
        </div>​<div class="clearfix" style=" clear: both; display: table; overflow: auto;"></div>
        <div class="line" style=" border: 1px solid; margin-bottom: 5px;"></div>​
    
        <h2 style="font-size:15px;text-align:center;margin:0;line-height: 0;">Fees Receipt</h2>
        ​<div style="font-size:  10px; font-family: sans-serif; margin-top: 5px;">
            <div style="width: 33.33%;float: left; text-align: left; padding-bottom: 5px;">
                <div>Date:</div>
                <div style="font-weight: bold;">23/03/2021</div>
            </div>
            <div style="width: 33.33%;float: left;text-align: center; padding-bottom: 5px;">
                <div>Transaction ID:</div>
                <div style="font-weight: bold;">RCPT_2020-21_005</div>
            </div>
            <div style="width: 33.33%;float: left;text-align: right; padding-bottom: 5px;">
                <div>Mode:</div>
                <div style="font-weight: bold;text-transform:uppercase;">card</div>
            </div>
        </div>​
        <p style="font-size:10px;
        margin:0;
        font-family:sans-serif;
        text-align:center;
        font-weight:bold;
        margin-top: 0px;
        margin-bottom: 0px;
        height:0px">STUDENT DETAILS</p>
        <table
            style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
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
                <td
                    style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    2020-21</td>
                <td
                    style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    5334</td>
                <td
                    style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    Suhith Vemu</td>
                <td
                    style="border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    2020 Mont-1</td>
            </tr>​
        </table>
        <!-- <p style=" font-family: sans-serif; font-size: 10px;margin:0px;height:30px">
                The total fees for your ward is Rs.10.00 for the current academic year. We have received Rs. 10.00 from you. The
                details are as follows;
            </p> -->
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
        <table
            style="width:100%; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;">
            <td
                style="width:20%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                S.No</td>
            <td
                style="width:40%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                Particulars</td>
            <td
                style="width:40%; padding: 5px;  background-color: #f2f2f2; text-align: center; font-weight: bold; font-family: sans-serif; border: 1px solid #000; font-size: 9px;">
                Paid Amount</td>
            <tr style="border: 1px solid black;">
                <td style="width:10%;text-align:center; border: 1px solid black;border-collapse: collapse;font-size: 10px;font-family: sans-serif;padding: 5px;">
                    1</td>
                <td style="width:45%;text-align:left; border: 1px solid black;border-collapse: collapse;font-size: 10px;font-family: sans-serif;padding: 5px;;text-align:center">
                    Total Fees </td>
                <td style="width:45%;text-align:left; border: 1px solid black;border-collapse: collapse;font-size: 10px;font-family: sans-serif;padding: 5px;;text-align:right">
                    ₹60,000.00</td>
            </tr>
            <tr>
                <td colspan="2"
                    style="text-align:right;font-weight:bold; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    TOTAL</td>
                <td
                    style="text-align:right;font-weight:bold; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    ₹60,000.00</td>
            </tr>
            <tr>
                <td colspan="6"
                    style="font-weight:bold; border: 1px solid black; border-collapse: collapse; font-size: 9px; font-family: sans-serif;padding: 5px;">
                    AMOUNT IN WORDS: INR SIXTY THOUSAND ONLY</td>
            </tr>​ <tr>
                <td colspan="6"
                    style="height:auto;border: 1px solid black; border-collapse: collapse; padding: 5px; text-align: center;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 43 43" style="height:100px;">
                        <path
                            d="M1 1h7v7h-7zM10 1h1v1h-1zM12 1h2v2h-1v-1h-1zM15 1h2v1h-2zM20 1h1v1h-1zM23 1h3v1h-2v1h-1zM29 1h2v1h-1v2h1v1h-1v1h1v1h-1v2h-1v1h-3v-1h1v-3h2v-2h-2v-1h1v-1h1zM32 1h1v1h-1zM35 1h7v7h-7zM2 2v5h5v-5zM11 2h1v1h-1zM17 2h1v2h-1zM19 2h1v1h-1zM21 2h1v2h5v1h-2v1h-1v-1h-2v3h1v1h-1v2h1v1h2v1h4v1h-1v1h-1v-1h-1v1h1v1h-2v-2h-2v-1h-2v1h-1v-1h-1v-1h-2v-2h-2v-1h2v-2h-1v1h-1v-1h-1v-1h-1v-1h-1v-2h1v1h2v-1h1v2h-1v1h1v-1h2v1h2v2h1v-3h-2v-1h2zM31 2h1v1h-1zM33 2h1v1h-1zM36 2v5h5v-5zM3 3h3v3h-3zM9 3h2v2h-1v3h1v1h-2zM32 3h1v1h-1zM37 3h3v3h-3zM33 4h1v5h-1v1h1v1h1v1h-1v1h1v1h-2v1h-1v2h3v1h-2v1h-1v-1h-2v-1h1v-2h-1v1h-1v1h-1v-2h1v-1h1v-1h1v1h1v-1h-1v-1h-3v-1h1v-1h1v1h1v-1h1v-1h-1v-2h1v1h1v-2h-2v-1h2zM11 5h1v1h1v1h-1v1h-1zM25 6h1v2h-1zM13 7h1v3h-1v1h-1v-3h1zM18 7v2h1v1h-1v1h1v-1h1v-1h-1v-2zM23 7h1v1h-1zM28 7v1h1v-1zM1 9h1v2h-1zM3 9h5v1h-5zM23 9h1v1h-1zM30 9h1v1h-1zM35 9h5v1h2v1h-1v1h1v1h-1v1h1v1h-2v1h-1v1h-1v-2h-3v-1h3v-2h1v1h1v-2h-1v-1h-1v1h-1v-1h-1v1h-1zM9 10h1v1h2v1h1v1h-1v1h-2v-1h1v-1h-1v1h-1v1h1v4h1v-3h5v1h-1v1h-2v1h-1v3h-2v1h-1v1h-1v-1h-1v-1h2v-1h2v-1h-2v1h-2v1h-1v-2h2v-1h-2v1h-2v1h1v1h1v1h-1v1h-1v1h1v1h-1v1h-1v-2h-1v-2h2v-1h-2v-1h-1v-1h1v-1h2v-1h-1v-1h2v1h4v-2h-1v-1h-1v1h1v1h-2v-3h2v-1h-1v-1h2zM24 10h1v1h-1zM2 11h1v1h-1zM4 11h2v2h-1v2h-2v-1h1zM13 11h1v1h-1zM15 11h1v1h1v1h-1v1h-2v-1h1zM20 11v1h1v-1zM25 11h1v1h-1zM32 11v1h1v-1zM36 11h1v2h-2v-1h1zM1 12h1v1h-1zM18 13h1v1h1v1h1v1h1v-1h-1v-1h2v1h1v1h-1v1h-2v2h-1v-1h-1v2h1v1h-2v1h-1v-2h-1v1h-1v-2h1v-2h1v2h1v-2h1v-2h-1zM1 14h1v1h-1zM16 14h1v1h-1zM17 15h1v2h-1zM33 15h2v1h-2zM24 16h1v1h-1zM35 16h1v1h-1zM1 17h1v1h-1zM25 17h2v1h1v1h4v1h-3v1h3v1h-2v1h2v1h-4v-1h1v-1h-1v1h-2v-2h2v-1h-3v-1h-2v1h1v1h-1v1h2v1h-1v1h1v-1h1v2h1v-1h1v1h1v1h-1v1h-1v-1h-1v2h-1v-1h-1v-1h1v-1h-1v1h-1v-1h-1v-1h-1v-1h1v-2h-1v-1h1v-2h3zM36 17h1v1h1v1h1v2h2v1h1v1h-3v2h-1v1h1v1h-1v1h1v1h1v-1h2v1h-1v1h1v1h-3v1h-1v-1h-1v2h1v3h1v1h1v1h-1v2h-1v1h2v1h-6v-1h1v-1h-1v-2h-1v-1h-2v-1h-2v1h2v1h-1v1h1v-1h2v2h1v1h-1v1h-1v-1h-1v-1h-1v1h-2v-2h1v-1h-3v-1h2v-2h5v-3h1v-1h1v-1h1v-1h-1v1h-2v1h-2v-1h-6v-1h3v-2h1v-1h1v3h2v-1h1v-1h1v1h3v-1h-2v-1h1v-1h1v-1h1v-1h-1v-1h1v-1h-1v-2h-2v-1h1zM39 17h1v1h2v1h-3zM13 18h2v1h-2zM13 20h1v1h-1zM33 20h1v1h-1zM41 20h1v1h-1zM12 21h1v2h1v1h-1v1h-1zM36 21h1v1h-1zM10 22h1v2h-1v1h-2v-1h1v-1h1zM14 22h1v1h-1zM16 22h1v1h-1zM19 22h2v1h-2zM32 22h4v1h-2v1h-1v-1h-1zM5 23h1v1h-1zM7 23h1v1h-1zM16 24h2v1h2v1h2v2h-1v-1h-2v-1h-2v-1h-1zM20 24h1v1h-1zM40 24h2v1h-1v1h1v1h-2v-1h-1v-1h1zM1 25h1v1h-1zM5 25h3v1h-1v1h2v1h-2v1h-1v-2h-1zM10 25h2v1h-1v1h-2v-1h1zM13 25h3v1h1v1h-1v1h-1v-2h-1v1h-2v-1h1zM30 25h1v1h-1zM34 25h1v1h-1zM2 26h1v1h-1zM32 26h1v1h-1zM1 27h1v1h-1zM3 27h1v2h2v1h1v1h1v1h-1v1h1v1h-2v-1h-1v1h-1v-1h-1v-1h1v-1h-1v-1h-1v4h-1v-5h1v-1h1zM17 27h1v2h-1v1h-2v-1h1v-1h1zM23 27h1v1h-1zM9 28h1v1h1v1h-4v-1h2zM11 28h1v1h-1zM22 28h1v1h-1zM13 29h1v2h-1zM18 29h1v1h-1zM21 29h1v1h-1zM23 29h1v1h-1zM37 29v1h1v-1zM17 30h1v2h-1zM19 30h1v4h-3v-1h2zM22 30h1v1h-1zM24 30h1v1h-1zM5 31v1h1v-1zM9 31h2v1h-1v1h-1zM21 31h1v1h-1zM25 31h6v1h-1v1h2v1h-7v-1h3v-1h-3zM13 32h1v1h-1zM15 32h1v1h-1zM22 32h1v1h-1zM41 32h1v1h-1zM10 33h3v1h-2v2h1v1h-2v1h1v1h1v1h-3v-4h1v-1h-1v-1h1zM14 33h1v1h-1zM39 33h2v1h1v1h-2v-1h-1zM15 34h2v2h1v5h-2v-3h-1v-1h1v-1h-1zM20 34h2v3h2v1h-2v2h1v1h-1v1h-1v-1h-1v-1h1v-1h-1v-1h1v-1h-1v-1h1v-1h-1zM23 34h2v1h-1v1h-1zM34 34v3h3v-3zM1 35h7v7h-7zM19 35h1v1h-1zM25 35h1v2h-2v-1h1zM35 35h1v1h-1zM2 36v5h5v-5zM40 36h2v3h-2v-1h1v-1h-1zM3 37h3v3h-3zM12 37h2v1h-1v1h-1zM19 37h1v1h-1zM14 38h1v2h-2v-1h1zM24 38h1v1h-1zM35 38v1h1v-1zM37 38v1h1v-1zM23 39h1v1h-1zM24 40h1v2h-2v-1h1zM36 40v1h1v-1zM40 40h1v1h-1zM9 41h6v1h-6zM26 41h2v1h-2zM30 41h1v1h-1z" />
                    </svg>
                    <p style="text-align:center;margin:0;padding:0px">Please scan the QR code to access this receipt from our portal</p>
                </td>
            </tr>
        </table>​
        <p style="text-align:center; margin: 0px;font-size:10px;margin-bottom:0px;margin-top:0px;height:0px">
        The validity of this receipt is subjected to the realization of this transaction with our bank account
        </p>  
       
        <br />    
        <br />    
        <br />         
        <br />
        <h2 style="text-align:center;margin:0;font-size:12px;margin-top:25px">Statement of Transaction</h2>
    
        <table style="width:100%; border: 1px solid black;
            border-collapse: collapse;
            font-size: 9px;
            font-family: sans-serif;">
            <tr>
                <td style="text-align:left; border: 1px solid black;
                    border-collapse: collapse;background-color: #f2f2f2;
                    font-size: 9px;font-weight: bold;
                    font-family: sans-serif;padding: 5px;">Date</td>
                <td style="text-align:left; border: 1px solid black;
                    border-collapse: collapse;background-color: #f2f2f2;
                    font-size: 9px;font-weight: bold;
                    font-family: sans-serif;padding: 5px;">Name</td>
                <td style="text-align:left; border: 1px solid black;
                    border-collapse: collapse;background-color: #f2f2f2;
                    font-size: 9px;font-weight: bold;
                    font-family: sans-serif;padding: 5px;">Received Amount</td>
                <td style="text-align:left; border: 1px solid black;
                    border-collapse: collapse;background-color: #f2f2f2;
                    font-size: 9px;font-weight: bold;
                    font-family: sans-serif;padding: 5px;">Refund Amount</td>
                <td style="text-align:left; border: 1px solid black;
                    border-collapse: collapse;background-color: #f2f2f2;
                    font-size: 9px;font-weight: bold;
                    font-family: sans-serif;padding: 5px;">Total Amount</td>
                ​
            </tr>
            <tr>
                <td style="text-align:left;border: 1px solid black;
            border-collapse: collapse;
            font-size: 9px;
            font-family: sans-serif;padding: 5px;">23/03/2021</td>
                <td style="text-align:left;border: 1px solid black;
             border-collapse: collapse;
             font-size: 9px;
            font-family: sans-serif;padding: 5px;">Suhith Vemu</td>
                <td style="text-align:right;border: 1px solid black;
            border-collapse: collapse;
            font-size: 9px;
            font-family: sans-serif;padding: 5px;">₹60,000.00</td>
                <td style="text-align:right;border: 1px solid black;
             border-collapse: collapse;
             font-size: 9px;
             font-family: sans-serif;padding: 5px;">₹0.00</td>
                <td style="text-align:right;border: 1px solid black;
              border-collapse: collapse;
              font-size: 9px;
              font-family: sans-serif;padding: 5px;">₹60,000.00</td>
            </tr>
            ​
            <tr>
              <td colspan="4" style="text-align:right;
              border: 1px solid black;
              font-weight:bold;
              border-collapse: collapse;
              font-size: 9px;
              font-family: sans-serif;padding: 5px;">TOTAL</td>
    
              <td style="text-align:right;
              border: 1px solid black;
              border-collapse: collapse;
              font-size: 9px;
              font-weight:bold;
              font-family: sans-serif;padding: 5px;">₹60,000.00</td>
            </tr>
            <tr>
                <td colspan="5" style="font-weight:bold; border: 1px solid black;
                border-collapse: collapse;
                font-size: 9px;
                font-family: sans-serif;padding: 5px;">AMOUNT IN WORDS: INR SIXTY THOUSAND ONLY</td>
            </tr>
        </table>
        <p class="signature" style="text-align: center; margin: 0px;font-size:8px;margin-bottom:20px;margin-top:10px">
        This is a computer generated fee receipt and does not require any signature.
    </p>
    </body>​
    
    </html>`
    return mainHTML
}

module.exports = { receiptPdf };