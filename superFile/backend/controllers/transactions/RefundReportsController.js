const mongoose = require("mongoose");
const transactionSchema = require("../../models/transactionsModel");
const feeLedgerSchema = require("../../models/feesLedgerModel");
const { createDatabase } = require("../../utils/db_creation");
const FeeTypeSchema = require("../../models/feeTypeModel");
const StudentFeeMapSchema = require("../../models/studentFeeMapModel");

module.exports.getPeriodicRefunds = async (req, res) => {
    let page = Number(req.query.page);
    let per_page = Number(req.query.perPage);
    let filterType = req.query.filter
    let dbConnection = await createDatabase(req.headers.orgId, req.headers.resource);
    let transactionModel = dbConnection.model("transactions", transactionSchema);
    let feeledgerModel = dbConnection.model("feesledgers", feeLedgerSchema);
    let feeTypeModel = await dbConnection.model("feeTypes", FeeTypeSchema);
    let studentFeeMapModel = dbConnection.model("studentfeesmaps", StudentFeeMapSchema);
    
    if (req.query.user === undefined && req.query.fromDate != undefined && req.query.toDate !== undefined) {
        console.log("date")
        let fromDate = new Date(req.query.fromDate)
        fromDate.setDate(fromDate.getDate())
        let toDate = new Date(req.query.toDate)
        toDate.setDate(toDate.getDate() + 1)
        console.log(fromDate, toDate)

        const aggregatePipeline = [
            {
                $match: {
                    transactionSubType: "refund",
                    transactionDate: {
                        $gte: new Date(fromDate),
                        $lte: new Date(toDate)
                    }
                }
            },
            {
                $lookup: {
                    from: "feesledgers",
                    localField: "relatedTransactions",
                    foreignField: "transactionDisplayName",
                    as: "feesLedgers",
                },
            },
            {
                $lookup: {
                    from: "students",
                    localField: "studentId",
                    foreignField: "_id",
                    as: "students",
                },
            },
            {
                $project: {
                    refundId: "$displayName",
                    demandNoteId: "$feesLedgers",
                    regId: "$studentRegId",
                    studentName: "$studentName",
                    academicYear: "$academicYear",
                    "class/Batch": "$class",
                    description: "$data.feesBreakUp",
                    refundedOn: "$transactionDate",
                    refunded: "$amount",
                    mode: "$data.mode",
                    txnId: "$paymentTransactionId",
                    transactionSubType: "$transactionSubType",
                    status: "$status",
                },
            },
        ];
        const refundReport = await transactionModel.aggregate(aggregatePipeline)

        resultPaginated = await Paginator(refundReport, page, per_page)
        res.send(resultPaginated)
    }


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