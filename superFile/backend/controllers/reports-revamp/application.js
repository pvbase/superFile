const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const allSchema = mongoose.Schema({}, { strict: false });
const orgListSchema = require("../../models/orglists-schema");
const { dataPagination } = require("./reports-support");

module.exports.getApplicationData = async (req, res) => {
    const { orgId, campus, fromDate, toDate, programPlan, page, limit, searchKey } = req.query;
    let dbConnection;
    let centralDbConnection;
    centralDbConnection = await createDatabase(
        `usermanagement-${process.env.stage}`,
        process.env.central_mongoDbUrl
    );
    const orgListModel = centralDbConnection.model(
        "orglists",
        orgListSchema,
        "orglists"
    );
    const orgData = await orgListModel.findOne({
        _id: mongoose.Types.ObjectId(orgId),
    });
    dbConnection = await createDatabase(
        String(orgData._doc._id),
        orgData._doc.connUri
    );
    var applicationModel = dbConnection.model("applications", allSchema);
    var currencyTypes = ["INR", "USD", "AED"];
    try {
        let matchAggr = {}; let currAggr = {}; let countAggr = {};
        var applicationTotal = {}; var applicationCount = {};
        var newToDate = new Date(toDate);
        newToDate = newToDate.setDate(newToDate.getDate() + 1);
        matchAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
        currAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
        countAggr.createdAt = { $gte: new Date(fromDate), $lte: new Date(newToDate) };
        currAggr.status = "Paid";
        for (let i = 0; i < currencyTypes.length; i++) {
            currAggr.currencyCode = String(currencyTypes[i]);
            countAggr.currencyCode = String(currencyTypes[i]);
            let searchAggr = [
                {
                    $match: currAggr
                },
                {
                    $group: {
                        _id: 0,
                        totalAmount: { $sum: "$amount" }
                    }
                },
                {
                    $project: {
                        total: "$totalAmount"
                    }
                }
            ];
            let countNewAggr = [
                {
                    $match: countAggr
                },
                {
                    $group: {
                        _id: 0,
                        total: { $sum: 1 }
                    }
                },
                {
                    $project:{
                        total: "$total"
                    }
                }
            ];
            let countTotal = await applicationModel.aggregate(countNewAggr);
            let appTotal = await applicationModel.aggregate(searchAggr);
            applicationTotal[`${currencyTypes[i]}`] = appTotal.length != 0 ? appTotal[0].total : 0;
            applicationCount[`${currencyTypes[i]}`] = countTotal.length != 0 ? countTotal[0].total : 0;
        }
        if (page == undefined || limit == undefined) {
            await applicationModel.find(matchAggr, async (appErr, appResp) => {
                if (appResp.length == 0) {
                    res.send({
                        status: "success",
                        totalRecord: appResp.length,
                        data: [],
                        applicationTotalFee: applicationTotal,
                        applicationTotalCount: applicationCount,
                        message: "No data"
                    })
                }
                else {
                    res.send({
                        status: "success",
                        totalRecord: appResp.length,
                        data: appResp,
                        applicationTotalFee: applicationTotal,
                        applicationTotalCount: applicationCount,
                        message: "All data"
                    })
                }
            })
        }
        else {
            if (searchKey != undefined && searchKey != "") {
                await applicationModel.find(matchAggr, async (appErr, appResp) => {
                    if (appResp.length == 0) {
                        res.send({
                            status: "success",
                            totalRecord: findSearchVal.length,
                            data: [],
                            applicationTotalFee: applicationTotal,
                            applicationTotalCount: applicationCount,
                            message: "No data"
                        })
                    }
                    else {
                        let findSearchVal = await searchData(appResp);
                        let convertPaginate = await dataPagination(findSearchVal, page, limit);
                        let calcTotpageVal = Math.ceil(Number(findSearchVal.length) / Number(limit));
                        res.send({
                            status: "success",
                            totalRecord: findSearchVal.length,
                            data: convertPaginate,
                            applicationTotalFee: applicationTotal,
                            applicationTotalCount: applicationCount,
                            message: "All data",
                            totalPage: calcTotpageVal,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                            message: "searched data",
                        })
                    }
                })
            }
            else {
                await applicationModel.find(matchAggr, async (appErr, appResp) => {
                    if (appResp.length == 0) {
                        res.send({
                            status: "success",
                            totalRecord: appResp.length,
                            data: [],
                            applicationTotalFee: applicationTotal,
                            applicationTotalCount: applicationCount,
                            message: "No data"
                        })
                    }
                    else {
                        let convertPaginate = await dataPagination(appResp, page, limit);
                        let calcTotpageVal = Math.ceil(Number(appResp.length) / Number(limit));
                        res.send({
                            status: "success",
                            totalRecord: appResp.length,
                            data: convertPaginate,
                            applicationTotalFee: applicationTotal,
                            applicationTotalCount: applicationCount,
                            message: "All data",
                            totalPage: calcTotpageVal,
                            currentPage: Number(page),
                            perPage: Number(limit),
                            nextPage: Number(page) < calcTotpageVal ? Number(page) + 1 : null,
                            message: "Paginated data",
                        })
                    }
                })
            }
        }
        async function searchData(data) {
            var searchedData = [];
            if (data.length == 0) { }
            else {
                let searchData = String(searchKey).toLowerCase();
                for (let i = 0; i < data.length; i++) {
                    if (
                        String(data[i]._doc.name).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.email).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.mobile).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.applicationId).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.amount).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.partial).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.programPlan).toLowerCase().includes(searchData) == true ||
                        String(data[i]._doc.batch).toLowerCase().includes(searchData) == true
                    ) {
                        searchedData.push(data[i]);
                    }
                    else { }
                }
                return searchedData
            }
        }
    }
    catch (err) {
        res.send({
            status: "failed",
            data: [],
            message: err
        })
    }
    finally { 
        centralDbConnection.close()
        dbConnection.close()
    }
}