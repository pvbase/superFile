const mongoose = require("mongoose");
const transactionSchema = require("../../models/transactionsModel");
const feeLedgerSchema = require("../../models/feesLedgerModel");
const { createDatabase } = require("../../utils/db_creation");
const FeeTypeSchema = require("../../models/feeTypeModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");

module.exports.getPeriodicFeeCollection = async (req, res) => {
    let page = Number(req.query.page);
    let per_page = Number(req.query.perPage);
    let filterType = req.query.filter
    let dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
    let transactionModel = dbConnection.model("transactions", transactionSchema);
    let feeledgerModel = dbConnection.model("feesledgers", feeLedgerSchema);
    let feeTypeModel = await dbConnection.model("feeTypes", FeeTypeSchema);
    let studentFeeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
    if (req.query.user !== undefined && req.query.fromDate == undefined && req.query.toDate == undefined) {
        console.log("user")
        let tdatea = await transactionModel.find({ //query today up to tonight
            createdBy: mongoose.Types.ObjectId(req.query.user),
            transactionSubType: "feePayment"
        })
        let feeCollectdata = []
        let totalAmount = 0
        let totalPending = 0
        let totalPaidAmount = 0
        for (let i = 0; i < tdatea.length; i++) {
            let transdata = tdatea[i]._doc
            var refundDet = await transactionModel.findOne({ paymentRefId: transdata["displayName"], transactionSubType: "refund", });
            let fesMapData = await studentFeeMapModel.findOne({ studentId: transdata["studentId"] });
            let descriptions = []
            let ledgerData = await feeledgerModel.find({ _id: { $in: transdata.feesLedgerIds } })
            let totaldue = 0;
            let totalpaid = 0;
            let totalbalance = 0;
            let stats
            totalPending = totalPending + parseFloat(fesMapData._doc.pending)
            totalAmount = totalAmount + parseFloat(fesMapData._doc.amount)
            totalPaidAmount = totalPaidAmount + parseFloat(transdata.amount)
            for (k = 0; k < ledgerData.length; k++) {
                let feeType = await feeTypeModel.findOne({ displayName: ledgerData[k]._doc["feeTypeCode"] })
                descriptions.push({
                    "name": feeType != null ? feeType._doc["title"] : null,
                    "due": fesMapData._doc["amount"],
                    "paid": ledgerData[k]._doc["paidAmount"],
                    "paidDate": await onDateFormat(transdata["transactionDate"]),
                    "balance": ledgerData[k]._doc.dueAmount == undefined ? 0 : ledgerData[k]._doc.dueAmount,
                    "status": ledgerData[k]._doc.status,
                    "txnId": transdata["paymentTransactionId"]
                })
                totaldue = parseFloat(fesMapData._doc["amount"])
                totalpaid = totalpaid + parseFloat(ledgerData[k]._doc["paidAmount"])
                totalbalance = parseFloat(fesMapData._doc["pending"])
                stats = ledgerData[k]._doc.status
            }
            descriptions.push({
                "name": "Total",
                "due": totaldue,
                "paid": totalpaid,
                "paidDate": await onDateFormat(transdata["transactionDate"]),
                "balance": totalbalance,
                "status": stats,
                "mode": transdata.data.mode,
                "txnId": transdata["paymentTransactionId"]
            })

            let data = {
                "displayName": transdata.displayName,
                "studentName": transdata.studentName,
                "regId": transdata.studentRegId,
                "academicYear": transdata.academicYear,
                "classBatch": transdata.class,
                "DemandId": transdata.relatedTransactions[0],
                "refundAmount": refundDet == null ? 0 : refundDet._doc.amount,
                "description": descriptions,
                "paymentDetails": transdata
            }
            feeCollectdata.push(data)
        }
        resultPaginated = await Paginator(feeCollectdata, page, per_page)
        resultPaginated.totalAmount = totalAmount
        resultPaginated.totalPending = totalPending
        resultPaginated.totalPaid = totalPaidAmount
        res.send(resultPaginated)
    }
    else if (req.query.user === undefined && req.query.fromDate != undefined && req.query.toDate !== undefined) {
        console.log("date")
        let fromDate = new Date(req.query.fromDate)
        fromDate.setDate(fromDate.getDate())
        let toDate = new Date(req.query.toDate)
        toDate.setDate(toDate.getDate() + 1)
        console.log(fromDate, toDate)
        let tdatea = await transactionModel.find({ //query today up to tonight
            transactionDate: {
                $gte: new Date(fromDate),
                $lt: new Date(toDate)
            },
            transactionSubType: "feePayment"
        })
        console.log(tdatea.length)
        let feeCollectdata = []
        let totalAmount = 0
        let totalPending = 0
        let totalPaidAmount = 0
        let totalCash = 0
        let totalCheque = 0
        let totalCard = 0
        let totalNetbanking = 0
        let totalWallet = 0
        let totalUpi = 0
        for (let i = 0; i < tdatea.length; i++) {
            let transdata = tdatea[i]._doc
            var refundDet = await transactionModel.findOne({ paymentRefId: transdata["displayName"], transactionSubType: "refund", });
            let fesMapData = await studentFeeMapModel.findOne({ studentId: transdata["studentId"] });
            let descriptions = []
            let ledgerData = await feeledgerModel.find({ _id: { $in: transdata.feesLedgerIds } })
            let totaldue = 0;
            let totalpaid = 0;
            let totalbalance = 0;
            totalPending = totalPending + parseFloat(fesMapData._doc.pending)
            totalAmount = totalAmount + parseFloat(fesMapData._doc.amount)
            totalPaidAmount = totalPaidAmount + parseFloat(transdata.amount)
            if (transdata.data.mode == "cash") {
                totalCash = totalCash + parseFloat(transdata.amount)
            }
            else if (transdata.data.mode == "cheque") {
                totalCheque = totalCheque + parseFloat(transdata.amount)
            }
            else if (transdata.data.mode == "netbanking") {
                totalNetbanking = totalNetbanking + parseFloat(transdata.amount)
            }
            else if (transdata.data.mode == "wallet") {
                totalWallet = totalWallet + parseFloat(transdata.amount)
            }
            else if (transdata.data.mode == "card") {
                totalCard = totalCard + parseFloat(transdata.amount)
            }
            else if (transdata.data.mode == "upi") {
                totalUpi = totalUpi + parseFloat(transdata.amount)
            }
            for (k = 0; k < ledgerData.length; k++) {
                let feeType = await feeTypeModel.findOne({ displayName: ledgerData[k]._doc["feeTypeCode"] })
                let allPend =
                    Number(feeType._doc.amount) - Number(ledgerData[k]._doc["paidAmount"]);
                let pen
                if (Number(allPend) < 0) {
                    pen = 0;
                } else {
                    totalBalance = parseFloat(ledgerData[k]._doc["pendingAmount"]);
                    pen = parseFloat(ledgerData[k]._doc["pendingAmount"]);
                }
                descriptions.push({
                    "name": feeType != null ? feeType._doc["title"] : null,
                    "due": fesMapData._doc["amount"],
                    "paid": ledgerData[k]._doc["paidAmount"],
                    "paidDate": await onDateFormat(transdata["transactionDate"]),
                    "balance": pen,
                    "status": String(transdata["status"]).toLowerCase() == "partial" ? "Partial" : transdata["status"],
                    "txnId": transdata["paymentTransactionId"]
                })
                totaldue = parseFloat(fesMapData._doc["amount"])
                totalpaid = totalpaid + parseFloat(ledgerData[k]._doc["paidAmount"])
                // totalbalance = parseFloat(fesMapData._doc["pending"])
                console.log(fesMapData._doc["pending"])
            }
            descriptions.push({
                "name": "Total",
                "due": totaldue,
                "paid": totalpaid,
                "paidDate": await onDateFormat(transdata["transactionDate"]),
                "balance": totalBalance,
                "status": String(transdata["status"]).toLowerCase() == "partial"
                    ? "Partial"
                    : transdata["status"],
                "mode": transdata.data.mode,
                "txnId": transdata["paymentTransactionId"]
            })

            let data = {
                "displayName": transdata.displayName,
                "studentName": transdata.studentName,
                "regId": transdata.studentRegId,
                "academicYear": transdata.academicYear,
                "classBatch": transdata.class,
                "DemandId": transdata.relatedTransactions[0],
                "refundAmount": refundDet == null ? 0 : refundDet._doc.amount,
                "description": descriptions,
                "paymentDetails": transdata
            }
            feeCollectdata.push(data)
        }
        resultPaginated = await Paginator(feeCollectdata, page, per_page)
        resultPaginated.totalAmount = totalAmount
        resultPaginated.totalPending = totalPending
        resultPaginated.totalPaid = totalPaidAmount
        resultPaginated.totalCash = totalCash
        resultPaginated.totalCheque = totalCheque
        resultPaginated.totalCard = totalCard
        resultPaginated.totalNetbanking = totalNetbanking
        resultPaginated.totalWallet = totalWallet
        resultPaginated.totalUpi = totalUpi
        res.send(resultPaginated)
    }
    else if (req.query.user != undefined && req.query.fromDate != undefined && req.query.toDate !== undefined) {
        console.log("both", req.query.user)
        let fromDate = new Date(req.query.fromDate)
        fromDate.setDate(fromDate.getDate())
        let toDate = new Date(req.query.toDate)
        toDate.setDate(toDate.getDate() + 1)
        let tdatea = await transactionModel.find({ //query today up to tonight
            transactionDate: {
                $gte: new Date(fromDate),
                $lt: new Date(toDate)
            },
            transactionSubType: "feePayment",
            createdBy: mongoose.Types.ObjectId(req.query.user)
        })
        let feeCollectdata = []
        let totalAmount = 0
        let totalPending = 0
        let totalPaidAmount = 0
        for (let i = 0; i < tdatea.length; i++) {
            let transdata = tdatea[i]._doc
            var refundDet = await transactionModel.findOne({ paymentRefId: transdata["displayName"], transactionSubType: "refund", });
            let fesMapData = await studentFeeMapModel.findOne({ studentId: transdata["studentId"] });
            let descriptions = []
            let ledgerData = await feeledgerModel.find({ _id: { $in: transdata.feesLedgerIds } })
            let totaldue = 0;
            let totalpaid = 0;
            let totalbalance = 0;
            totalPending = totalPending + parseFloat(fesMapData._doc.pending)
            totalAmount = totalAmount + parseFloat(fesMapData._doc.amount)
            totalPaidAmount = totalPaidAmount + parseFloat(transdata.amount)
            for (k = 0; k < ledgerData.length; k++) {
                let feeType = await feeTypeModel.findOne({ displayName: ledgerData[k]._doc["feeTypeCode"] })
                descriptions.push({
                    "name": feeType != null ? feeType._doc["title"] : null,
                    "due": fesMapData._doc["amount"],
                    "paid": ledgerData[k]._doc["paidAmount"],
                    "paidDate": await onDateFormat(transdata["transactionDate"]),
                    "balance": ledgerData[k]._doc.dueAmount == undefined ? 0 : ledgerData[k]._doc.dueAmount,
                    "status": "Pending",
                    "txnId": transdata["paymentTransactionId"]
                })
                totaldue = parseFloat(fesMapData._doc["amount"])
                totalpaid = totalpaid + parseFloat(ledgerData[k]._doc["paidAmount"])
                totalbalance = parseFloat(fesMapData._doc["pending"])
            }
            descriptions.push({
                "name": "Total",
                "due": totaldue,
                "paid": totalpaid,
                "paidDate": await onDateFormat(transdata["transactionDate"]),
                "balance": totalbalance,
                "status": "Pending",
                "mode": transdata.data.mode,
                "txnId": transdata["paymentTransactionId"]
            })

            let data = {
                "displayName": transdata.displayName,
                "studentName": transdata.studentName,
                "regId": transdata.studentRegId,
                "academicYear": transdata.academicYear,
                "classBatch": transdata.class,
                "DemandId": transdata.relatedTransactions[0],
                "refundAmount": refundDet == null ? 0 : refundDet._doc.amount,
                "description": descriptions,
                "paymentDetails": transdata
            }
            feeCollectdata.push(data)
        }
        resultPaginated = await Paginator(feeCollectdata, page, per_page)
        resultPaginated.totalAmount = totalAmount
        resultPaginated.totalPending = totalPending
        resultPaginated.totalPaid = totalPaidAmount
        res.send(resultPaginated)
    }

}
module.exports.getCheckTransactions = async (req, res) => {
    const {
        orgId,
        page,
        limit,
        sortType,
        sortKey,
        searchKey,
        campusId,
        userId,
        filterKey,
        classbatchName,
        fromDate,
        toDate,
    } = req.query;
    let type = "feePayment"
    let dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
    let transactionModel = dbConnection.model("transactions", transactionSchema);
    let feeledgerModel = dbConnection.model("feesledgers", feeLedgerSchema);
    let feeTypeModel = await dbConnection.model("feeTypes", FeeTypeSchema);
    let studentFeeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
    let trparams2 = [{
        $match:
        {
            transactionSubType: type, 'data.mode': { $regex: "cheque", $options: "i" }
        }
    }
    ]
    if (classbatchName && classbatchName !== "all") {
        trparams2[0].$match.class = req.query.classbatchName;
    }
    if (req.query.searchKey && isNaN(Number(req.query.searchKey))) {
        trparams2[0].$match.$or = [{ studentName: { $regex: searchKey, $options: "i" } },
        { class: { $regex: searchKey, $options: "i" } },
        { amount: { $regex: searchKey, $options: "i" } },
        { currency: { $regex: searchKey, $options: "i" } },
        { academicYear: { $regex: searchKey, $options: "i" } },
        { 'data.mode': { $regex: searchKey, $options: "i" } },
        { 'data.method': { $regex: searchKey, $options: "i" } },
        { paymentTransactionId: { $regex: searchKey, $options: "i" } }
        ];
    }
    if (req.query.searchKey && !isNaN(Number(searchKey))) {
        trparams2[0].$match.$or = [
            { amount: { $gte: Number(searchKey), $lte: Number(searchKey) } },
        ];
    }
    if (req.query.fromDate && req.query.toDate) {
        console.log("date range ")
        let toDate1 = new Date(req.query.toDate)
        toDate1.setDate(toDate1.getDate() + 1)
        trparams2[0].$match.createdAt = {
            $gte: new Date(fromDate),
            $lt: new Date(toDate1),
        }
    }
    if (campusId !== undefined && campusId !== null && campusId !== "" && campusId.toLowerCase() !== "all") {
        trparams2[0].$match.campusId = campusId
    }
    if (userId && userId !== undefined && userId !== null && userId !== "" && userId.toLowerCase() !== "all") {
        trparams2[0].$match.createdBy = userId
    }
    var tradata = await transactionModel.aggregate(trparams2).sort({ _id: -1 });
    let feepaymentData = await Paginator(
        tradata,
        Number(req.query.page),
        Number(req.query.limit)
      );
      let tdatea = feepaymentData.data
     let totalAmount = 0;
     let totalPending = 0;
     let totalPaidAmount = 0;
     let feeCollectdata = []
    for (let i = 0; i < tdatea.length; i++) {
        let transdata = tdatea[i]
        var refundDet = await transactionModel.findOne({ paymentRefId: transdata["displayName"], transactionSubType: "refund", });
        let fesMapData = await studentFeeMapModel.findOne({ studentId: transdata["studentId"] });
        let descriptions = []
        let ledgerData = await feeledgerModel.find({ _id: { $in: transdata.feesLedgerIds } })
        let totaldue = 0;
        let totalpaid = 0;
        let totalbalance = 0;
        let stats
        totalPending = totalPending + parseFloat(fesMapData._doc.pending)
        totalAmount = totalAmount + parseFloat(fesMapData._doc.amount)
        totalPaidAmount = totalPaidAmount + parseFloat(transdata.amount)
        for (k = 0; k < ledgerData.length; k++) {
            let feeType = await feeTypeModel.findOne({ displayName: ledgerData[k]._doc["feeTypeCode"] })
            descriptions.push({
                "name": feeType != null ? feeType._doc["title"] : null,
                "due": fesMapData._doc["amount"],
                "paid": ledgerData[k]._doc["paidAmount"],
                "paidDate": await onDateFormat(transdata["transactionDate"]),
                "balance": ledgerData[k]._doc.dueAmount == undefined ? 0 : ledgerData[k]._doc.dueAmount,
                "status": ledgerData[k]._doc.status,
                "txnId": transdata["paymentTransactionId"]
            })
            totaldue = parseFloat(fesMapData._doc["amount"])
            totalpaid = totalpaid + parseFloat(ledgerData[k]._doc["paidAmount"])
            totalbalance = parseFloat(fesMapData._doc["pending"])
            stats = ledgerData[k]._doc.status
        }
        descriptions.push({
            "name": "Total",
            "due": totaldue,
            "paid": totalpaid,
            "paidDate": await onDateFormat(transdata["transactionDate"]),
            "balance": totalbalance,
            "status": stats,
            "mode": transdata.data.mode,
            "txnId": transdata["paymentTransactionId"]
        })

        let data = {
            "displayName": transdata.displayName,
            "studentName": transdata.studentName,
            "regId": transdata.studentRegId,
            "academicYear": transdata.academicYear,
            "classBatch": transdata.class,
            "DemandId": transdata.relatedTransactions[0],
            "refundAmount": refundDet == null ? 0 : refundDet._doc.amount,
            "description": descriptions,
            "paymentDetails": transdata
        }
        feeCollectdata.push(data)
    }
    // resultPaginated = await Paginator(feeCollectdata, page, per_page)
    feepaymentData.totalAmount = totalAmount
    feepaymentData.totalPending = totalPending
    feepaymentData.totalPaid = totalPaidAmount
    feepaymentData.data =  feeCollectdata
    res.send(feepaymentData)
}
function Paginator(items, page, per_page) {
    let current_page = page;
    let perPage = per_page;
    (offset = (current_page - 1) * perPage),
        (paginatedItems = items.slice(offset).slice(0, perPage)),
        (total_pages = Math.ceil(items.length / perPage));
    return {
        page: Number(current_page),
        perPage: Number(perPage),
        nextPage:
            total_pages > Number(current_page) ? Number(current_page) + 1 : null,
        totalRecord: items.length,
        totalPages: total_pages,
        data: paginatedItems,
        status: "success",
    };
}

async function onDateFormat(d) {
    let dateField = new Date(String(d));
    let month = dateField.getMonth() + 1;
    month = String(month).length == 1 ? `0${String(month)}` : String(month);
    let date = dateField.getDate();
    date = String(date).length == 1 ? `0${String(date)}` : String(date);
    let year = dateField.getFullYear();
    return `${date}/${month}/${year}`;
}