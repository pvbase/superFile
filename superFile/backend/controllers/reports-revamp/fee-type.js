const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const { dataPagination } = require("./reports-support");
const orgListSchema = require("../../models/orglists-schema");
const feeTypeSchema = require("../../models/feeTypeModel");
const transactionSchema = require("../../models/transactionsModel");
const campusSchema = require("../../models/campusModel");

module.exports.getFeeTypeReport = async (req, res) => {
    const { orgId, campus, page, limit, searchKey } = req.query;
    var filterFeeType = {};
    if (orgId != undefined) {
        const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
        const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
        const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
        if (!orgData || orgData == null) {
            centralDbConnection.close();
            res.status(400).send({
                status: "failure",
                message: "Organization not found"
            });
        }
        const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

        const feeTypeModel = await dbConnection.model("feetypes", feeTypeSchema);
        const campusModel = await dbConnection.model("campuses", campusSchema);
        const transactionModel = await dbConnection.model("transactions", transactionSchema);

        try {
            filterFeeType.status = 1;
            if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                filterFeeType.campusId = String(campus);
            }
            const feeTypeData = await feeTypeModel.find(filterFeeType);
            let getFinalResult = await calcFeeTypeData(feeTypeData);

            if (searchKey != undefined) {
                if (page != undefined && limit != undefined) {
                    let getSearchedData = await searchData(getFinalResult);
                    res.send({
                        status: "success",
                        totalRecord: getSearchedData.length,
                        data: await dataPagination(getSearchedData, page, limit),
                        totalPage: Math.ceil(Number(getSearchedData.length) / Number(limit)),
                        currentPage: Number(page),
                        perPage: Number(limit),
                        nextPage: Number(page) < Number(Math.ceil(Number(getSearchedData.length) / Number(limit))) ? Number(page) + 1 : null,
                        message: "Report search and paginated fee type data calculated successfully."
                    })
                    centralDbConnection.close();
                    dbConnection.close();
                }
                else {
                    res.send({
                        status: "success",
                        totalRecord: getSearchedData.length,
                        data: getSearchedData,
                        totalPage: null,
                        currentPage: Number(page),
                        perPage: Number(limit),
                        nextPage: null,
                        message: "Report fee type searched data calculated successfully."
                    })
                    centralDbConnection.close();
                    dbConnection.close();
                }
            }
            else {
                if (page != undefined && limit != undefined) {
                    res.send({
                        status: "success",
                        totalRecord: getFinalResult.length,
                        data: await dataPagination(getFinalResult, page, limit),
                        totalPage: Math.ceil(Number(getFinalResult.length) / Number(limit)),
                        currentPage: Number(page),
                        perPage: Number(limit),
                        nextPage: Number(page) < Number(Math.ceil(Number(getFinalResult.length) / Number(limit))) ? Number(page) + 1 : null,
                        message: "Report paginated fee type data calculated successfully."
                    })
                    centralDbConnection.close();
                    dbConnection.close();
                }
                else {
                    res.send({
                        status: "success",
                        totalRecord: getFinalResult.length,
                        data: getFinalResult,
                        totalPage: null,
                        currentPage: Number(page),
                        perPage: Number(limit),
                        nextPage: null,
                        message: "Report fee type data calculated successfully."
                    })
                    centralDbConnection.close();
                    dbConnection.close();
                }
            }
        }
        catch (err) {
            res.status(400).send({
                status: "failed",
                data: [],
                message: "Failed to calculate report fee type data."
            })
            centralDbConnection.close();
            dbConnection.close();
        }
        finally {
            // centralDbConnection.close()
            // dbConnection.close()
        }

        async function calcFeeTypeData(response) {
            let feeTypeDatas = [];
            const campusData = await campusModel.find({});
            if (response.length != 0) {
                for (let i = 0; i < response.length; i++) {
                    const filterCampus = campusData.find(o => String(o._doc._id) == String(response[i]._doc.campusId));
                    let dummyObj = {};
                    dummyObj.id = response[i]._doc._id;
                    dummyObj.displayName = response[i]._doc.displayName;
                    dummyObj.label = response[i]._doc.title;
                    dummyObj.partialAllowed = response[i]._doc.partialAllowed;
                    dummyObj.status = response[i]._doc.status;
                    dummyObj.campusId = response[i]._doc.campusId;
                    dummyObj.campusName = filterCampus._doc.displayName;
                    dummyObj.currency = "INR";
                    let getTxnDetail = await transactionModel.aggregate([
                        {
                            $match: {
                                "data.feesBreakUp.feeTypeCode": `${response[i]._doc.displayName}`
                            }
                        },
                        {
                            $group: {
                                _id: 0,
                                total: {
                                    $sum: "$amount"
                                },
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $project: {
                                total: "$total",
                                count: "$count"
                            }
                        }
                    ]);
                    dummyObj.totalPaid = getTxnDetail.length != 0 ? getTxnDetail[0].total : 0;
                    dummyObj.totalTransactions = getTxnDetail.length != 0 ? getTxnDetail[0].count : 0;
                    feeTypeDatas.push(dummyObj);
                }
                return feeTypeDatas
            }
            else {
                return feeTypeDatas
            }

        }
        async function searchData(data) {
            var searchedData = [];
            if (data.length == 0) { }
            else {
                let searchData = String(searchKey).toLowerCase();
                for (let i = 0; i < data.length; i++) {
                    if (
                        String(data[i].displayName).toLowerCase().includes(searchData) == true ||
                        String(data[i].label).toLowerCase().includes(searchData) == true ||
                        String(data[i].campusName).toLowerCase().includes(searchData) == true ||
                        String(data[i].totalPaid).toLowerCase().includes(searchData) == true ||
                        String(data[i].totalTransactions).toLowerCase().includes(searchData) == true
                    ) {
                        searchedData.push(data[i]);
                    }
                    else { }
                }
                return searchedData
            }
        }
    }
    else {
        res.status(400).send({
            status: "failed",
            message: "Reports 'orgId' query is missing. please provide all the required parameters."
        })
    }
}

module.exports.getFeeTypeTransaction = async (req, res) => {
    const { orgId, feeType, campus, programPlan, fromDate, toDate, page, limit, searchKey } = req.query;
    const methodNames = ["cash", "cheque", "card", "netbanking", "wallet", "upi", "NEFT"];
    var filterTransaction = {};
    var newToDate = new Date(toDate);
    newToDate = newToDate.setDate(newToDate.getDate() + 1);

    if (orgId != undefined) {
        const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
        const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
        const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
        if (!orgData || orgData == null) {
            centralDbConnection.close();
            res.status(400).send({
                status: "failure",
                message: "Organization not found"
            });
        }
        const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

        const feeTypeModel = await dbConnection.model("feetypes", feeTypeSchema);
        const transactionModel = await dbConnection.model("transactions", transactionSchema);

        try {
            if (feeType != undefined) {
                const feeTypeDetail = await feeTypeModel.find({ _id: mongoose.Types.ObjectId(feeType) });
                if (feeTypeDetail.length != 0) {
                    filterTransaction.transactionSubType = "feePayment";
                    if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                        filterTransaction.campusId = String(campus);
                    }
                    if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                        filterTransaction.programPlan = mongoose.Types.ObjectId(programPlan);
                    }
                    if (fromDate != undefined && toDate != undefined) {
                        filterTransaction.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
                    }
                    if (searchKey != undefined) {
                        const getTxnData = await transactionModel.aggregate([
                            {
                                $match: filterTransaction
                            },
                            {
                                $match: {
                                    "data.feesBreakUp.feeTypeCode": feeTypeDetail[0].displayName
                                }
                            }
                        ]);
                        const filterSearchKey = await searchData(getTxnData);
                        const searchTotAmount = filterSearchKey.reduce(function (cnt, o) { return cnt + o.amount; }, 0)
                        let modeOfPayment = [];
                        for (let i = 0; i < methodNames.length; i++) {
                            let filterMode = filterSearchKey.filter(o => o.data.method == methodNames[i]);
                            let calcTotAmount = filterMode.reduce(function (cnt, o) { return cnt + o.amount; }, 0)
                            modeOfPayment.push({
                                label: await capsLabel(methodNames[i]),
                                paid: Number(calcTotAmount)
                            })
                        }
                        if (page != undefined && limit != undefined) {
                            const convertToPaginate = await dataPagination(filterSearchKey, page, limit);
                            res.send({
                                status: "success",
                                totalRecord: filterSearchKey.length,
                                totalPaid: searchTotAmount,
                                data: convertToPaginate,
                                modeOfPayment: modeOfPayment,
                                totalPage: Math.ceil(Number(filterSearchKey.length) / Number(limit)),
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < Number(Math.ceil(Number(filterSearchKey.length) / Number(limit))) ? Number(page) + 1 : null,
                                message: "Reports fee type search and paginated transaction data."
                            });
                            centralDbConnection.close()
                            dbConnection.close()
                        }
                        else {
                            res.send({
                                status: "success",
                                totalRecord: getTxnData.length,
                                totalPaid: searchTotAmount,
                                data: getTxnData,
                                modeOfPayment: modeOfPayment,
                                totalPage: null,
                                currentPage: null,
                                perPage: null,
                                nextPage: null,
                                message: "Reports fee type searched transaction data."
                            });
                            centralDbConnection.close()
                            dbConnection.close()
                        }
                    }
                    else {
                        const getTxnData = await transactionModel.aggregate([
                            {
                                $match: filterTransaction
                            },
                            {
                                $match: {
                                    "data.feesBreakUp.feeTypeCode": feeTypeDetail[0].displayName
                                }
                            }
                        ]);
                        const getTotalPaidTxn = await transactionModel.aggregate([
                            {
                                $match: filterTransaction
                            },
                            {
                                $match: {
                                    "data.feesBreakUp.feeTypeCode": feeTypeDetail[0].displayName
                                }
                            },
                            {
                                $group: {
                                    _id: 0,
                                    paid: { $sum: "$amount" }
                                }
                            },
                            {
                                $project: {
                                    paid: "$paid"
                                }
                            }
                        ]);
                        let modeOfPayment = [];
                        for (let i = 0; i < methodNames.length; i++) {
                            let filterMode = getTxnData.filter(o => o.data.method == methodNames[i]);
                            let calcTotAmount = filterMode.reduce(function (cnt, o) { return cnt + o.amount; }, 0)
                            modeOfPayment.push({
                                label: await capsLabel(methodNames[i]),
                                paid: Number(calcTotAmount)
                            })
                        }
                        if (page != undefined && limit != undefined) {
                            const convertToPaginate = await dataPagination(getTxnData, page, limit);
                            res.send({
                                status: "success",
                                totalRecord: getTxnData.length,
                                totalPaid: getTotalPaidTxn.length != 0 ? getTotalPaidTxn[0].paid : 0,
                                data: convertToPaginate,
                                modeOfPayment: modeOfPayment,
                                totalPage: Math.ceil(Number(getTxnData.length) / Number(limit)),
                                currentPage: Number(page),
                                perPage: Number(limit),
                                nextPage: Number(page) < Number(Math.ceil(Number(getTxnData.length) / Number(limit))) ? Number(page) + 1 : null,
                                message: "Reports fee type paginated transaction data."
                            });
                            centralDbConnection.close()
                            dbConnection.close()
                        }
                        else {
                            res.send({
                                status: "success",
                                totalRecord: getTxnData.length,
                                totalPaid: getTotalPaidTxn.length != 0 ? getTotalPaidTxn[0].paid : 0,
                                data: getTxnData,
                                modeOfPayment: modeOfPayment,
                                totalPage: null,
                                currentPage: null,
                                perPage: null,
                                nextPage: null,
                                message: "Reports fee type transaction data."
                            });
                            centralDbConnection.close()
                            dbConnection.close()
                        }
                    }
                }
                else {
                    res.status(400).send({
                        status: "failed",
                        message: "Report 'feeType' id is not matching. please provide valid fee type id."
                    })
                }
            }
            else {
                res.status(400).send({
                    status: "failed",
                    message: "Report 'feeType' query is missing. please provide all the required parameters."
                })
            }
            async function searchData(data) {
                var searchedData = [];
                if (data.length == 0) { }
                else {
                    let searchData = String(searchKey).toLowerCase();
                    for (let i = 0; i < data.length; i++) {
                        if (
                            String(data[i].displayName).toLowerCase().includes(searchData) == true ||
                            String(data[i].studentRegId).toLowerCase().includes(searchData) == true ||
                            String(data[i].studentName).toLowerCase().includes(searchData) == true ||
                            String(data[i].class).toLowerCase().includes(searchData) == true ||
                            String(data[i].receiptNo).toLowerCase().includes(searchData) == true ||
                            String(data[i].amount).toLowerCase().includes(searchData) == true ||
                            String(data[i].paymentTransactionId).toLowerCase().includes(searchData) == true ||
                            String(data[i].status).toLowerCase().includes(searchData) == true
                        ) {
                            searchedData.push(data[i]);
                        }
                        else { }
                    }
                    return searchedData
                }
            }
            async function capsLabel(data) {
                return data.charAt(0).toUpperCase() + data.slice(1);
            }
        }
        catch (err) { }
        finally { }
    }
    else {
        res.status(400).send({
            status: "failed",
            message: "Report fee type 'orgId' query is missing. please provide all the required parameters."
        })
    }
}