const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const collectionName = "shortcourseplan";
const axios = require("axios");
const orgListSchema = require("../models/orglists-schema");
const shortCoursePlanSchema = require("../models/shortCoursePlanModel");
const ApplicationSchema = require('../models/ken42/applicationModel');
const tinyUrl = "https://cwpjc8rnb2.execute-api.ap-south-1.amazonaws.com/prod/tiny/shorturl";
var _ = require("lodash");
var moment = require("moment");
const { map } = require("lodash");
const rq = require("request-promise");
var uuid = require("uuid");
const { response } = require("express");
// const { search } = require("../router");

function Paginator(items, page, per_page) {
    let current_page = page;
    let perPage = per_page;
    (offset = (current_page - 1) * perPage),
        (paginatedItems = items.slice(offset).slice(0, perPage)),
        (total_pages = Math.ceil(items.length / perPage));
    return {
        page: Number(current_page),
        perPage: Number(perPage),
        nextPage: total_pages > Number(current_page) ? Number(current_page) + 1 : null,
        totalRecord: items.length,
        totalPages: total_pages,
        data: paginatedItems,
        status: "success",
    };
}
async function getShortCoursePlan2(req, res) {
    var dbUrl = req.headers.resource;
    console.log("dburl", dbUrl);
    const { orgId, page, limit } = req.query;
    const { type } = req.params;
    let dbConnection = await createDatabase(orgId, dbUrl);
    var shortCoursePlanModel = await dbConnection.model(collectionName, shortCoursePlanSchema, collectionName);
    var applicationModel = await dbConnection.model('applications', ApplicationSchema, 'applications')
    const getapplicationData = await applicationModel.findOne({ applicationId: applicationId });

    const getData = await shortCoursePlanModel.find({});
    let finalData = await Paginator(getData, page, limit)
    res.status(200).json({
        "message": 'success',
        data: finalData.data,
        currentPage: finalData.page,
        perPage: finalData.perPage,
        nextPage: finalData.nextPage,
        totalRecord: finalData.totalRecord,
        totalPages: finalData.totalPages,
    })
}

async function createReports(req, res) {
    //Will return only Shortcourseplan collection data as output
    var dbUrl = req.headers.resource;
    console.log("dburl", dbUrl);
    const { orgId, page, limit, fromDate, toDate } = req.query;
    const { type } = req.params;
    var courseName = req.query.courseName == undefined ? undefined : String(req.query.courseName).toLowerCase();
    var batch = req.query.batch == undefined ? undefined : String(req.query.batch).toLowerCase();
    var searchKey = !isNaN(req.query.searchKey) ? Number(req.query.searchKey) : req.query.searchKey == undefined ? undefined : String(req.query.searchKey).toLowerCase();
    var responseData = []
    let dbConnection = await createDatabase(orgId, dbUrl);

    if (type == "demandNote") {
        let findParams = [{
            $match: {}
        }]
        if (courseName && courseName !== "all") {
            findParams[0].$match.courseName = req.query.courseName;
        }
        if (batch && batch !== "all") {
            findParams[0].$match.courseStartDate = req.query.batch;
        }
        if (req.query.searchKey && isNaN(Number(searchKey))) {
            findParams[0].$match.$or = [
                { name: { $regex: searchKey, $options: "i" } },
                { regId: { $regex: searchKey, $options: "i" } },
                { emailAddress: { $regex: searchKey, $options: "i" } },
                { mobileNumber: { $regex: searchKey, $options: "i" } },
                { applicationId: { $regex: searchKey, $options: "i" } },
                { courseName: { $regex: searchKey, $options: "i" } },
                { courseStartDate: { $regex: searchKey, $options: "i" } },
                { status: { $regex: searchKey, $options: "i" } },
                { demandNoteDisplayName: { $regex: searchKey, $options: "i" } },
            ];
        }
        if (req.query.fromDate && req.query.toDate) {
            console.log("date range")
            findParams[0].$match.transactionDate = {
                $gte: new Date(fromDate),
                $lte: new Date(toDate),
            }
        }
        var shortCoursePlanModel = await dbConnection.model('shortcourseplan', shortCoursePlanSchema, 'shortcourseplan')
        var demandNoteReport = await shortCoursePlanModel.aggregate(findParams).sort({ _id: -1 });
        var result = demandNoteReport.filter(item => item.demandNoteDetails)
        let paginated = await Paginator(result, req.query.page, req.query.limit);
        console.log("paginated", paginated);
        responseData.push({
            data: paginated.data,
            metadata: [
                {
                    page: paginated.page,
                    nextPage: paginated.nextPage,
                    total: paginated.totalRecord,
                    totalPages: paginated.totalPages,
                },
            ],
        });
    }
    else if (type == "feeCollection") {
        var applicationModel = await dbConnection.model('applications', ApplicationSchema, 'applications')
        var shortCoursePlanModel = await dbConnection.model('shortcourseplan', shortCoursePlanSchema, 'shortcourseplan')

        let findParams = [{
            $match: {}
        }]
        if (courseName && courseName !== "all") {
            findParams[0].$match.programPlan = req.query.courseName;
        }
        if (batch && batch !== "all") {
            findParams[0].$match.batch = req.query.batch;
        }
        if (req.query.searchKey && isNaN(Number(searchKey))) {
            findParams[0].$match.$or = [
                { name: { $regex: searchKey, $options: "i" } },
                { regId: { $regex: searchKey, $options: "i" } },
                { email: { $regex: searchKey, $options: "i" } },
                { mobile: { $regex: searchKey, $options: "i" } },
                { applicationId: { $regex: searchKey, $options: "i" } },
                { programPlan: { $regex: searchKey, $options: "i" } },
                { batch: { $regex: searchKey, $options: "i" } },
                // { 'demandNoteDetails.status': { $regex: searchKey, $options: "i" } },
                // { 'demandNoteDetails.demandNoteDetails.displayName': { $regex: searchKey, $options: "i" } },
            ];
        }

        // if (req.query.fromDate && req.query.toDate) {
        //     console.log("date range")
        //     findParams[0].$match.updatedAt = {
        //         $gte: new Date(fromDate),
        //         $lte: new Date(toDate),
        //     }
        // }
        var applicationDetails = await applicationModel.aggregate(findParams).sort({ _id: -1 })
        var shortCourse = await shortCoursePlanModel.aggregate(findParams).sort({ _id: -1 })

        let appCourseData = []
        applicationDetails.map(appItem => {
            let appCheck = false
            shortCourse.map(courseItem => {
                if (appItem.applicationId == courseItem.applicationId) {
                    appCheck = true
                    let demandObj = {}
                    if (courseItem.demandNoteDetails && courseItem.demandNoteDetails.demandNoteDetails && courseItem.razorpayDetails) {
                        let paidAmount = Number(String(appItem.amount + '.' + appItem.paisa))
                        let courseFee = courseItem.courseFee
                        let pending = Number(courseFee) - Number(paidAmount)
                        demandObj._id = appItem._id
                        demandObj.applicationId = appItem.applicationId
                        demandObj.name = appItem.name
                        demandObj.courseName = appItem.programPlan
                        demandObj.courseStartDate = appItem.batch
                        demandObj.courseFee = courseItem.courseFee
                        demandObj.demandNoteDisplayName = courseItem.demandNoteDisplayName
                        demandObj.gatewayType = appItem.gatewayType
                        demandObj.amount = Number(String(appItem.amount + '.' + appItem.paisa))
                        demandObj.paidAmount = paidAmount
                        demandObj.pendingAmount = Number(Number(pending).toFixed(2))
                        demandObj.status = Number(pending).toFixed(2) == 0 ? 'Paid' : 'Partial'
                        demandObj.paymentTxnDate = moment(courseItem["feeDetails"][0].modeDetails.transactionDate).toISOString()
                        demandObj["transactionId"] = appItem.transactionId
                        demandObj.feeDetails = courseItem["feeDetails"]
                        appCourseData.push(demandObj)
                    } else {
                        let paidAmount = Number(String(appItem.amount + '.' + appItem.paisa))
                        let courseFee = courseItem.courseFee
                        let pending = Number(courseFee) - Number(paidAmount)
                        demandObj._id = appItem._id
                        demandObj.applicationId = appItem.applicationId
                        demandObj.name = appItem.name
                        demandObj.courseName = appItem.programPlan
                        demandObj.courseStartDate = appItem.batch
                        demandObj.courseFee = courseItem.courseFee
                        demandObj.demandNoteDisplayName = courseItem.demandNoteDisplayName
                        demandObj.gatewayType = appItem.gatewayType
                        demandObj.amount = Number(courseItem.courseFee)
                        demandObj.paidAmount = paidAmount
                        demandObj.pendingAmount = Number(Number(pending).toFixed(2))
                        demandObj.status = Number(pending).toFixed(2) == 0 ? 'Paid' : 'Partial'
                        demandObj.paymentTxnDate = moment(new Date(appItem.updatedAt)).toISOString()
                        demandObj["transactionId"] = appItem.transactionId
                        demandObj.feeDetails = courseItem["feeDetails"]
                        appCourseData.push(demandObj)
                    }
                } else {
                    appCheck = appCheck
                }
            })
            if (!appCheck) {
                let demandObj = {}
                let paidAmount = Number(String(appItem.amount + '.' + appItem.paisa))
                demandObj._id = appItem._id
                demandObj.applicationId = appItem.applicationId
                demandObj.name = appItem.name
                demandObj.courseName = appItem.programPlan
                demandObj.courseStartDate = appItem.batch
                demandObj.courseFee = paidAmount
                demandObj.demandNoteDisplayName = '-'
                demandObj.gatewayType = appItem.gatewayType
                demandObj.amount = Number(String(appItem.amount + '.' + appItem.paisa))
                demandObj.paidAmount = Number(String(appItem.amount + '.' + appItem.paisa))
                demandObj.pendingAmount = Number(demandObj.amount) - Number(demandObj.paidAmount)
                demandObj.status = "Paid"
                demandObj.paymentTxnDate = moment(appItem.razorpay.updatedAt).toISOString()
                demandObj["transactionId"] = appItem.transactionId
                demandObj.feeDetails = [
                    {
                        "demandNoteDate": null,
                        "modeDetails": {
                            "transactionDate": moment(appItem.razorpay.updatedAt).toISOString(),
                            "netBankingType": null,
                            "walletType": null,
                            "instrumentNo": "",
                            "instrumentDate": "",
                            "bankName": null,
                            "cardType": null,
                            "nameOnCard": null,
                            "cardNumber": null,
                            "branchName": null,
                            "transactionId": appItem.transactionId,
                            "remarks": ""
                        },
                        "paidMode": "NetBanking",
                        "amountPaid": Number(paidAmount),
                        "status": "Paid"
                    }
                ]
                appCourseData.push(demandObj)
            }
        })
        let paginated;
        let durationFilter = []
        if (req.query.fromDate && req.query.toDate) {
            let startDate = moment(new Date(req.query.fromDate)).format('DD/MM/YYYY')
            let endDate = moment(new Date(req.query.toDate)).format('DD/MM/YYYY')
            // console.log(startDate, endDate);
            durationFilter = appCourseData.filter(item => {
                // console.log(item.paymentTxnDate);
                var date = moment(new Date(item.paymentTxnDate)).format('DD/MM/YYYY');
                return (date >= startDate && date <= endDate);
            })
            paginated = await Paginator(durationFilter, req.query.page, req.query.limit);
        }
        else {
            paginated = await Paginator(appCourseData, req.query.page, req.query.limit);
        }
        responseData.push({
            data: paginated.data,
            metadata: [
                {
                    page: paginated.page,
                    nextPage: paginated.nextPage,
                    total: paginated.totalRecord,
                    totalPages: paginated.totalPages,
                },
            ],
        });
    }

    var pageDetails = responseData["0"] != undefined ?
        responseData["0"].metadata["0"] != undefined ?
            responseData["0"].metadata["0"] : {
                page: null,
                nextPage: null,
                total: null,
                totalPages: null,
            }
        : {
            page: null,
            nextPage: null,
            total: null,
            totalPages: null,
        };

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin,x-auth-token,authorization, X-Requested-With, Content-Type, Accept");
    dbConnection.close();

    res.status(200).send({
        status: "success",
        message: `Short Course ${type} Reports has been created successfully`,
        data: responseData["0"] != undefined ? responseData["0"].data : [],
        currentPage: pageDetails.page != undefined ? pageDetails.page : null,
        perPage: Number(limit),
        nextPage: pageDetails.nextPage != undefined ? pageDetails.nextPage : null,
        totalRecord: pageDetails.total != undefined ? pageDetails.total : null,
        totalPages: pageDetails.totalPages != undefined ? pageDetails.totalPages : null,
    })
}
async function applicationSearchReport(req, res) {
    try {
        var dbUrl = req.headers.resource;
        console.log("dburl", dbUrl);
        const { orgId, page, limit } = req.query;
        var searchKey = req.query.searchKey == undefined ? undefined : String(req.query.searchKey).toLowerCase();
        var responseData = []
        let dbConnection = await createDatabase(orgId, dbUrl);
        var applicationModel = await dbConnection.model('applications', ApplicationSchema, 'applications')

        // const aggregateData = [{ $sort: { _id: -1 } }];
        // let queryOptions;
        // queryOptions = { $regex: searchKey };
        // console.log("queryOptions", String(searchKey));
        // const getData = await applicationModel.findOne({});
        // let objkeys = Object.keys(getData._doc);
        // for (let i = 0; i < objkeys.length; i++) {
        //     let getd = await applicationModel.find({
        //         $where: `function (){if (this.${[objkeys[i]]}!== undefined && this.${[objkeys[i],]}!== null ) {
        //     return this.${[objkeys[i],]}.toString().toLowerCase().match(/${String(searchKey).toLowerCase()}/) != null}}`,
        //     });
        //     // console.log("getd", getd)
        //     searchData = searchData.concat(getd);
        // }

        let searchData = [];
        let findParams = [{
            $match: {}
        }]

        if (req.query.searchKey && isNaN(Number(searchKey))) {
            findParams[0].$match.$or = [
                { name: { $regex: searchKey, $options: "i" } },
                { regId: { $regex: searchKey, $options: "i" } },
                { email: { $regex: searchKey, $options: "i" } },
                { mobile: { $regex: searchKey, $options: "i" } },
                { applicationId: { $regex: searchKey, $options: "i" } },
                { programPlan: { $regex: searchKey, $options: "i" } },
                { batch: { $regex: searchKey, $options: "i" } },
                { currencyCode: { $regex: searchKey, $options: "i" } },
                { transactionId: { $regex: searchKey, $options: "i" } },
                { gatewayType: { $regex: searchKey, $options: "i" } },
            ];
        }

        searchData = await applicationModel.aggregate(findParams).sort({ _id: -1 });
        let paginated = await Paginator(searchData, req.query.page, req.query.limit);
        // console.log("paginated", paginated);
        responseData.push({
            data: paginated.data,
            metadata: [
                {
                    page: paginated.page,
                    nextPage: paginated.nextPage,
                    total: paginated.totalRecord,
                    totalPages: paginated.totalPages,
                },
            ],
        });
        let INRamt = [];
        let USDamt = [];
        let INRApp = 0;
        let USDApp = 0;
        paginated.data.map((dataTwo, idx) => {
            let amount = Number(Number(dataTwo.amount) + '.' + Number(dataTwo.paisa))

            if (dataTwo.currencyCode == "USD") {
                let payStatus = dataTwo.status.toLowerCase();
                if (payStatus == "paid") {
                    USDamt.push(Number(amount).toFixed(2));
                    USDApp = USDApp + 1;
                } else {
                    USDApp = USDApp + 1;
                }
            }
            if (dataTwo.currencyCode == "INR") {
                let payStatus = dataTwo.status.toLowerCase();
                if (payStatus == "paid") {
                    INRamt.push(Number(amount).toFixed(2));
                    INRApp = INRApp + 1;
                } else {
                    INRApp = INRApp + 1;
                }
            }
        });
        let finalINR = INRamt.reduce((a, b) => a + Number(b), 0);
        let finalUSD = USDamt.reduce((a, b) => a + Number(b), 0);
        var pageDetails =
            responseData["0"] != undefined
                ? responseData["0"].metadata["0"] != undefined
                    ? responseData["0"].metadata["0"]
                    : {
                        page: null,
                        nextPage: null,
                        total: null,
                        totalPages: null,
                    }
                : {
                    page: null,
                    nextPage: null,
                    total: null,
                    totalPages: null,
                };
        dbConnection.close();
        res.status(200).send({
            status: "success",
            totalINR: finalINR,
            totalUSD: finalUSD,
            // message: `${type} reports`,
            message: `Short Course Application Reports results found`,
            data: responseData["0"] != undefined ? responseData["0"].data : [],
            currentPage: pageDetails.page != undefined ? pageDetails.page : null,
            perPage: Number(limit),
            nextPage: pageDetails.nextPage != undefined ? pageDetails.nextPage : null,
            totalRecord: pageDetails.total != undefined ? pageDetails.total : null,
            totalPages: pageDetails.totalPages != undefined ? pageDetails.totalPages : null,
        })
    }
    catch (e) {
        console.log(e)
        res.status(400).json({ "error": e })
    }
}

module.exports = {
    createShortCourseReports: createReports,
    applicationSearchReport: applicationSearchReport
}