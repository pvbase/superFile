exports.createHtml = (getHtmlDetails, qrCod) => {
    const bankCharge = 20;
    var totalCalcAmount = 0;
    getHtmlDetails.feesBreakUp.map((data) => { totalCalcAmount = totalCalcAmount + data.amount });
    const finalTotalValue = bankCharge + totalCalcAmount;
    var rupeeInWord = inwords(finalTotalValue).toLocaleLowerCase();

    const mappingArr = getHtmlDetails.feesBreakUp.map((data, i) => {
        if (data.name == "Tuition Fee") {
            return (
                `<tr><td style="padding: 3px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">${i + 1}</td>
                                            <td style="padding: 3px;border-right: 1px solid #000000; border-bottom: 1px solid #000000;">${data.name}</td>
                                            <td style="padding: 3px;text-align: right;border-bottom: 1px solid #000000;">${Number(totalCalcAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                        </tr>`
            )
        }
        else {
            return (
                `<tr><td style="padding: 3px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">${i + 1}</td>
                                        <td style="padding: 3px;border-right: 1px solid #000000; border-bottom: 1px solid #000000;">Term-1</td>
                                        <td style="padding: 3px;text-align: right;border-bottom: 1px solid #000000;">${Number(totalCalcAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                                    </tr>`
            )
        }
    })
    let tableMapping = mappingArr.join("");

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
                (a[Number(n[5])] || b[n[5][0]] + " " + a[n[5][1]]) +
                ""
                : "";
        return str;
    }
    dateFilter = (ev) => {
        var ts = new Date(ev);
        let getDate = `${String(ts.getDate()).length == 1 ? `0${ts.getDate()}` : ts.getDate()}`;
        let getMonth = `${String(ts.getMonth() + 1).length == 1 ? `0${ts.getMonth() + 1}` : ts.getMonth() + 1}`;
        let getYear = `${ts.getFullYear()}`;
        let today = `${getDate}/${getMonth}/${getYear}`;
        return today;
    };

    let fileData = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Challan</title>
</head>
<style>
    p,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        padding: 0px;
        margin: 0px;
    }
</style>

<body style="font-family: sans-serif;">
    <div class="main-challan" style="display: -webkit-box; display: flex;">
        <div class="section-one" style="width: 24%; margin: 0px 2px 0px 1px;">
            <p style="text-align: center;padding-bottom: 3px; font-size: 9px;">Parent's copy</p>
            <div class="content-section" style="border: 1px solid #000000; width: 98%;">
            <div style="width: 100%;display: -webkit-box; display: flex;">
            <div style="width: 30%;">
                <img style="height: 60px; width: 100%;"
                    src="data:image/jpeg;base64,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" />
            </div>
            <div style="width: 70%; padding: 3px; line-height:10px;">
                <p style="font-size: 8px;">BLDEA's</p>
                <p style="font-size: 5px; font-weight: bold;">SRI B M PATIL PUBLIC SCHOOL</p>
                <p style="font-size: 5px;"># 142, BHUTANAL VILLAGE,</p>
                <p style="font-size: 5px;"> SOLAPUR ROAD,</p>
                <p style="font-size: 5px; font-weight: bold;">VIJAYAPUR - 586103 <span
                        style="font-weight: 100">(KARNATAKA)</span></p>
            </div>
        </div>
        <div style="width: 100%;display: -webkit-box; display: flex; padding: 0px 0px 3px 0px;">
            <p style="font-size: 5px; padding: 0px 5px 0px 5px; width: 50%;">Phone: <span
                    style="font-weight: bold;">08352-263101/263104</span></p>
            <p style="font-size: 5px; padding: 0px 5px 0px 5px; width: 50%;">Website:<br/> <span
                    style="font-weight: bold;">bldeacbsc.org</span></p>
        </div>
        <div style="width: 100%; display: -webkit-box; display: flex;border-top: 1px solid #000000;border-bottom:1px solid #000000;">
        <p style="width: 50%;font-size: 5px;border-right: 1px solid #000000; padding: 2px 0px 2px 3px;">
            SI. No. 885</p>
        <p style="width: 50%;font-size: 5px;padding: 3px 0px 2px 3px;">Date: ${dateFilter(getHtmlDetails.challanGeneratedDate)}</p>
    </div>
        <div style="width: 100%; padding: 3px;">
            <p style="font-size: 10px; text-align: center; font-weight: bold;">STATE BANK OF INDIA</p>
            <p style="font-size: 8px; text-align: center;">BLDEA CAMPUS BRANCH, VIJAYAPUR-586103</p>
            <div style="width: 100%;display: -webkit-box; display: flex; padding: 3px 0px 0px 0px;">
                <p style="font-size: 6px; width: 50%;">Branch Code:<br/> <span
                        style="font-weight: bold;">14429</span></p>
                <p style="font-size: 6px; width: 50%;">IFSC Code:<br/> <span
                        style="font-weight: bold;">SBIN0014429</span></p>
            </div>
        </div>
                <div style="border-top: 1px solid #000000;border-bottom: 1px solid #000000; padding: 3px;">
                    <p style="padding: 0px; font-size: 9px;">Reg ID : ${getHtmlDetails.studentRegId} <span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span></p>
                    <p style="padding: 0px; font-size: 9px;">Name : ${getHtmlDetails.studentName}<span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span></p>
                    <p style="padding: 0px; font-size: 9px;">Class: ${getHtmlDetails.class}<span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span> </p>
                </div>
                <table style="width: 100%; margin: 0px 0px 0px 0px;border-collapse: collapse; font-size: 8px;">
                    <tr>
                        <th style="width: 3%; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">S.No.
                        </th>
                        <th style="width: 70%; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">
                            Item</th>
                        <th style="width: 27%; border-bottom: 1px solid #000000;">₹ </th>
                    </tr>
                    ${tableMapping}
                    <tr>
                        <td colspan="2"
                            style="padding: 3px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">
                            Bank charges</td>
                        <td style="padding: 3px; text-align: right;border-bottom: 1px solid #000000;">20.00</td>
                    </tr>
                    <tr style="height: 20px;">
                        <td colspan="2"
                            style="font-weight: bold;border-right: 1px solid #000000;border-bottom: 1px solid #000000;">
                            Total</td>
                        <td style="text-align: right;">${Number(finalTotalValue).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                    </tr>
                    <tr style="height: 30px;border-bottom: 1px solid #000000; font-size: 8px; border-top: 1px solid #000000;">
                        <td colspan="3" style="font-weight: bold; font-size:7px;">Rupees (in words):  ${rupeeInWord} only</td>
                    </tr>
                </table>
                <div style="margin: 0px;">
                    <p style="font-weight: bold; text-align: center; font-size: 7px; padding: 3px; ">Particulars of the
                        Candidate for
                        whom the remittance is made</p>
                    <p style="padding:4px; font-size: 9px;">Name :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;">Address :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;"><span style="width: 100px;"></span>
                    </p>
                    <p style="padding:4px; font-size: 9px;">Mobile No. :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;">Remitter's Signature :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                </div>
            </div>
            <p style="text-align: center; padding: 5px 0px 0px 0px; font-weight: bold; font-size: 6px;">SBI Branches be
                guided by C & I
                Circular No. 28/2009 dated 08/12/2009</p>
        </div>
        <div class="section-one" style="width: 24%; margin: 0px 2px 0px 2px;">
            <p style="text-align: center;padding-bottom: 3px; font-size: 9px;">Student copy</p>
            <div class="content-section" style="border: 1px solid #000000; width: 98%;">
            <div style="width: 100%;display: -webkit-box; display: flex;">
            <div style="width: 30%;">
                <img style="height: 60px; width: 100%;"
                    src="data:image/jpeg;base64,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" />
            </div>
            <div style="width: 70%; padding: 3px; line-height:10px;">
                <p style="font-size: 8px;">BLDEA's</p>
                <p style="font-size: 5px; font-weight: bold;">SRI B M PATIL PUBLIC SCHOOL</p>
                <p style="font-size: 5px;"># 142, BHUTANAL VILLAGE,</p>
                <p style="font-size: 5px;"> SOLAPUR ROAD,</p>
                <p style="font-size: 5px; font-weight: bold;">VIJAYAPUR - 586103 <span
                        style="font-weight: 100">(KARNATAKA)</span></p>
            </div>
        </div>
        <div style="width: 100%;display: -webkit-box; display: flex; padding: 0px 0px 3px 0px;">
            <p style="font-size: 5px; padding: 0px 5px 0px 5px; width: 50%;">Phone: <span
                    style="font-weight: bold;">08352-263101/263104</span></p>
            <p style="font-size: 5px; padding: 0px 5px 0px 5px; width: 50%;">Website:<br/> <span
                    style="font-weight: bold;">bldeacbsc.org</span></p>
        </div>
        <div style="width: 100%; display: -webkit-box; display: flex;border-top: 1px solid #000000;border-bottom:1px solid #000000;">
        <p style="width: 50%;font-size: 5px;border-right: 1px solid #000000; padding: 2px 0px 2px 3px;">
            SI. No. 885</p>
        <p style="width: 50%;font-size: 5px;padding: 3px 0px 2px 3px;">Date: ${dateFilter(getHtmlDetails.challanGeneratedDate)}</p>
    </div>
        <div style="width: 100%; padding: 3px;">
            <p style="font-size: 10px; text-align: center; font-weight: bold;">STATE BANK OF INDIA</p>
            <p style="font-size: 8px; text-align: center;">BLDEA CAMPUS BRANCH, VIJAYAPUR-586103</p>
            <div style="width: 100%;display: -webkit-box; display: flex; padding: 3px 0px 0px 0px;">
                <p style="font-size: 6px; width: 50%;">Branch Code:<br/> <span
                        style="font-weight: bold;">14429</span></p>
                <p style="font-size: 6px; width: 50%;">IFSC Code:<br/> <span
                        style="font-weight: bold;">SBIN0014429</span></p>
            </div>
        </div>
                <div style="border-top: 1px solid #000000;border-bottom: 1px solid #000000; padding: 3px;">
                    <p style="padding: 0px; font-size: 9px;">Reg ID : ${getHtmlDetails.studentRegId} <span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span></p>
                    <p style="padding: 0px; font-size: 9px;">Name : ${getHtmlDetails.studentName}<span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span></p>
                            <p style="padding: 0px; font-size: 9px;">Class: ${getHtmlDetails.class}<span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span> </p>
                </div>
                <table style="width: 100%; margin: 0px 0px 0px 0px;border-collapse: collapse; font-size: 8px;">
                    <tr>
                        <th style="width: 3%; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">S.No.
                        </th>
                        <th style="width: 70%; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">
                            Item</th>
                        <th style="width: 27%; border-bottom: 1px solid #000000;">₹ </th>
                    </tr>
                    ${tableMapping}
                    <tr>
                        <td colspan="2"
                            style="padding: 3px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">
                            Bank charges</td>
                        <td style="padding: 3px; text-align: right;border-bottom: 1px solid #000000;">20.00</td>
                    </tr>
                    <tr style="height: 20px;">
                        <td colspan="2"
                            style="font-weight: bold;border-right: 1px solid #000000;border-bottom: 1px solid #000000;">
                            Total</td>
                        <td style="text-align: right;">${Number(finalTotalValue).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                    </tr>
                    <tr style="height: 30px;border-bottom: 1px solid #000000;font-size: 8px; border-top: 1px solid #000000;">
                    <td colspan="3" style="font-weight: bold; font-size:7px;">Rupees (in words):  ${rupeeInWord} only</td>
                    </tr>
                </table>
                <div style="margin: 0px;">
                    <p style="font-weight: bold; text-align: center; font-size: 7px; padding: 3px; ">Particulars of the
                        Candidate for
                        whom the remittance is made</p>
                    <p style="padding:4px; font-size: 9px;">Name :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;">Address :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;"><span style="width: 100px;"></span>
                    </p>
                    <p style="padding:4px; font-size: 9px;">Mobile No. :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;">Remitter's Signature :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                </div>
            </div>
            <p style="text-align: center; padding: 5px 0px 0px 0px; font-weight: bold; font-size: 6px;">SBI Branches be
                guided by C & I
                Circular No. 28/2009 dated 08/12/2009</p>
        </div>
        <div class="section-one" style="width: 24%; margin: 0px 2px 0px 2px;">
            <p style="text-align: center;padding-bottom: 3px; font-size: 9px;">Office copy</p>
            <div class="content-section" style="border: 1px solid #000000; width: 98%;">
            <div style="width: 100%;display: -webkit-box; display: flex;">
            <div style="width: 30%;">
                <img style="height: 60px; width: 100%;"
                    src="data:image/jpeg;base64,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" />
            </div>
            <div style="width: 70%; padding: 3px; line-height:10px;">
                <p style="font-size: 8px;">BLDEA's</p>
                <p style="font-size: 5px; font-weight: bold;">SRI B M PATIL PUBLIC SCHOOL</p>
                <p style="font-size: 5px;"># 142, BHUTANAL VILLAGE,</p>
                <p style="font-size: 5px;"> SOLAPUR ROAD,</p>
                <p style="font-size: 5px; font-weight: bold;">VIJAYAPUR - 586103 <span
                        style="font-weight: 100">(KARNATAKA)</span></p>
            </div>
        </div>
        <div style="width: 100%;display: -webkit-box; display: flex; padding: 0px 0px 3px 0px;">
            <p style="font-size: 5px; padding: 0px 5px 0px 5px; width: 50%;">Phone: <span
                    style="font-weight: bold;">08352-263101/263104</span></p>
            <p style="font-size: 5px; padding: 0px 5px 0px 5px; width: 50%;">Website:<br/> <span
                    style="font-weight: bold;">bldeacbsc.org</span></p>
        </div>
        <div style="width: 100%; display: -webkit-box; display: flex; border-top: 1px solid #000000;border-bottom:1px solid #000000;">
        <p style="width: 50%;font-size: 5px;border-right: 1px solid #000000; padding: 2px 0px 2px 3px;">
            SI. No. 885</p>
        <p style="width: 50%;font-size: 5px;padding: 3px 0px 2px 3px;">Date: ${dateFilter(getHtmlDetails.challanGeneratedDate)}</p>
    </div>
        <div style="width: 100%; padding: 3px;">
            <p style="font-size: 10px; text-align: center; font-weight: bold;">STATE BANK OF INDIA</p>
            <p style="font-size: 8px; text-align: center;">BLDEA CAMPUS BRANCH, VIJAYAPUR-586103</p>
            <div style="width: 100%;display: -webkit-box; display: flex; padding: 3px 0px 0px 0px;">
                <p style="font-size: 6px; width: 50%;">Branch Code:<br/> <span
                        style="font-weight: bold;">14429</span></p>
                <p style="font-size: 6px; width: 50%;">IFSC Code:<br/> <span
                        style="font-weight: bold;">SBIN0014429</span></p>
            </div>
        </div>
                <div style="border-top: 1px solid #000000;border-bottom: 1px solid #000000; padding: 3px;">
                    <p style="padding: 0px; font-size: 9px;">Reg ID : ${getHtmlDetails.studentRegId} <span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span></p>
                    <p style="padding: 0px; font-size: 9px;">Name : ${getHtmlDetails.studentName}<span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span></p>
                            <p style="padding: 0px; font-size: 9px;">Class: ${getHtmlDetails.class}<span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span> </p>
                </div>
                <table style="width: 100%; margin: 0px 0px 0px 0px;border-collapse: collapse; font-size: 8px;">
                    <tr>
                        <th style="width: 3%; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">S.No.
                        </th>
                        <th style="width: 70%; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">
                            Item</th>
                        <th style="width: 27%; border-bottom: 1px solid #000000;">₹ </th>
                    </tr>
                    ${tableMapping}
                    <tr>
                        <td colspan="2"
                            style="padding: 3px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">
                            Bank charges</td>
                        <td style="padding: 3px; text-align: right;border-bottom: 1px solid #000000;">20.00</td>
                    </tr>
                    <tr style="height: 20px;">
                        <td colspan="2"
                            style="font-weight: bold;border-right: 1px solid #000000;border-bottom: 1px solid #000000;">
                            Total</td>
                        <td style="text-align: right;">${Number(finalTotalValue).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                    </tr>
                    <tr style="height: 30px;border-bottom: 1px solid #000000;font-size: 8px; border-top: 1px solid #000000;">
                    <td colspan="3" style="font-weight: bold; font-size:7px;">Rupees (in words):  ${rupeeInWord} only</td>
                    </tr>
                </table>
                <div style="margin: 0px;">
                    <p style="font-weight: bold; text-align: center; font-size: 7px; padding: 3px; ">Particulars of the
                        Candidate for
                        whom the remittance is made</p>
                    <p style="padding:4px; font-size: 9px;">Name :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;">Address :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;"><span style="width: 100px;"></span>
                    </p>
                    <p style="padding:4px; font-size: 9px;">Mobile No. :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;">Remitter's Signature :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                </div>
            </div>
            <p style="text-align: center; padding: 5px 0px 0px 0px; font-weight: bold; font-size: 6px;">SBI Branches be
                guided by C & I
                Circular No. 28/2009 dated 08/12/2009</p>
        </div>
        <div class="section-one" style="width: 24%; margin: 0px 2px 0px 0px;">
            <p style="text-align: center;padding-bottom: 3px; font-size: 9px;">Bank copy</p>
            <div class="content-section" style="border: 1px solid #000000; width: 98%;">
            <div style="width: 100%;display: -webkit-box; display: flex;">
            <div style="width: 30%;">
                <img style="height: 60px; width: 100%;"
                    src="data:image/jpeg;base64,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" />
            </div>
            <div style="width: 70%; padding: 3px; line-height:10px;">
                <p style="font-size: 8px;">BLDEA's</p>
                <p style="font-size: 5px; font-weight: bold;">SRI B M PATIL PUBLIC SCHOOL</p>
                <p style="font-size: 5px;"># 142, BHUTANAL VILLAGE,</p>
                <p style="font-size: 5px;"> SOLAPUR ROAD,</p>
                <p style="font-size: 5px; font-weight: bold;">VIJAYAPUR - 586103 <span
                        style="font-weight: 100">(KARNATAKA)</span></p>
            </div>
        </div>
        <div style="width: 100%;display: -webkit-box; display: flex; padding: 0px 0px 3px 0px;">
            <p style="font-size: 5px; padding: 0px 5px 0px 5px; width: 50%;">Phone: <span
                    style="font-weight: bold;">08352-263101/263104</span></p>
            <p style="font-size: 5px; padding: 0px 5px 0px 5px; width: 50%;">Website:<br/> <span
                    style="font-weight: bold;">bldeacbsc.org</span></p>
        </div>
        <div style="width: 100%; display: -webkit-box; display: flex; border-top: 1px solid #000000;border-bottom:1px solid #000000;">
        <p style="width: 50%;font-size: 5px;border-right: 1px solid #000000; padding: 2px 0px 2px 3px;">
            SI. No. 885</p>
        <p style="width: 50%;font-size: 5px;padding: 3px 0px 2px 3px;">Date: ${dateFilter(getHtmlDetails.challanGeneratedDate)}</p>
    </div>
        <div style="width: 100%; padding: 3px;">
            <p style="font-size: 10px; text-align: center; font-weight: bold;">STATE BANK OF INDIA</p>
            <p style="font-size: 8px; text-align: center;">BLDEA CAMPUS BRANCH, VIJAYAPUR-586103</p>
            <div style="width: 100%;display: -webkit-box; display: flex; padding: 3px 0px 0px 0px;">
                <p style="font-size: 6px; width: 50%;">Branch Code:<br/> <span
                        style="font-weight: bold;">14429</span></p>
                <p style="font-size: 6px; width: 50%;">IFSC Code:<br/> <span
                        style="font-weight: bold;">SBIN0014429</span></p>
            </div>
        </div>
                <div style="border-top: 1px solid #000000;border-bottom: 1px solid #000000; padding: 3px;">
                    <p style="padding: 0px; font-size: 9px;">Reg ID : ${getHtmlDetails.studentRegId} <span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span></p>
                    <p style="padding: 0px; font-size: 9px;">Name : ${getHtmlDetails.studentName}<span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span></p>
                            <p style="padding: 0px; font-size: 9px;">Class: ${getHtmlDetails.class}<span
                            style="border-bottom: 1px dotted #000; width: 100px; font-weight: bold;"></span> </p>
                </div>
                <table style="width: 100%; margin: 0px 0px 0px 0px;border-collapse: collapse; font-size: 8px;">
                    <tr>
                        <th style="width: 3%; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">S.No.
                        </th>
                        <th style="width: 70%; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">
                            Item</th>
                        <th style="width: 27%; border-bottom: 1px solid #000000;">₹ </th>
                    </tr>
                    ${tableMapping}
                    <tr>
                        <td colspan="2"
                            style="padding: 3px; border-right: 1px solid #000000; border-bottom: 1px solid #000000;">
                            Bank charges</td>
                        <td style="padding: 3px; text-align: right;border-bottom: 1px solid #000000;">20.00</td>
                    </tr>
                    <tr style="height: 20px;">
                        <td colspan="2"
                            style="font-weight: bold;border-right: 1px solid #000000;border-bottom: 1px solid #000000;">
                            Total</td>
                        <td style="text-align: right;">${Number(finalTotalValue).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                    </tr>
                    <tr style="height: 30px;border-bottom: 1px solid #000000;font-size: 8px;border-top: 1px solid #000000;">
                    <td colspan="3" style="font-weight: bold; font-size:7px;">Rupees (in words):  ${rupeeInWord} only</td>
                    </tr>
                </table>
                <div style="margin: 0px;">
                    <p style="font-weight: bold; text-align: center; font-size: 7px; padding: 3px; ">Particulars of the
                        Candidate for
                        whom the remittance is made</p>
                    <p style="padding:4px; font-size: 9px;">Name :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;">Address :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;"><span style="width: 100px;"></span>
                    </p>
                    <p style="padding:4px; font-size: 9px;">Mobile No. :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                    <p style="padding:4px; font-size: 9px;">Remitter's Signature :<span
                            style="width: 100px; font-weight: bold;"></span></p>
                </div>
            </div>
            <p style="text-align: center; padding: 5px 0px 0px 0px; font-weight: bold; font-size: 6px;">SBI Branches be
                guided by C & I
                Circular No. 28/2009 dated 08/12/2009</p>
        </div>
    </div>
    <div style="padding-top: 40px;">
    <p style="font-size: 10px; text-align: center;">FOR INSTITUTE STAFF ONLY</p>
        <div style="text-align: center; margin-top: 5px; height:150px; width: 150px; padding-left:212px; ">
            ${qrCod}
        </div>
           <p style="font-size: 10px; text-align: center;">Please scan the QR Code for data entry</p>
    </div>
</body>

</html>`

    return fileData
}