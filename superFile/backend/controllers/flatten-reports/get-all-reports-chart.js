const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const reportSchema = require('./report-schema');
const orgListSchema = require("../../models/orglists-schema");

module.exports.getReportCharts = async (req, res) => {
    const { orgId, type, campus, programPlan, fromDate, toDate, section } = req.query;

    const colorCodes = ["#FF7655", "#1FBFDE", "#C2AC4D", "#00AF51", "#000000", "#000000"];
    const methodColorCodes = ["#00AF50", "#CC6601", "#01B0F1", "#0071C1", "#4AACC5", "#CB3398", "#9933FF"];
    const methodNames = ["cash", "cheque", "card", "netbanking", "wallet", "upi", "NEFT"];

    if (orgId != undefined) {
        if (type && String(type).length !== 0) {
            const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
            const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
            const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
            if (!orgData || orgData == null) {
                centralDbConnection.close();
                res.status(500).send({
                    status: "failure",
                    message: "Organization not found",
                });
            }
            const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

            const reportModel = dbConnection.model("reportdetails", reportSchema, "reportdetails");
            try {
                let filterMatch = {};
                if (programPlan != undefined && String(programPlan).toLocaleLowerCase() != "all") {
                    filterMatch.programPlanId = mongoose.Types.ObjectId(programPlan);
                }
                if (campus != undefined && String(campus).toLocaleLowerCase() != "all") {
                    filterMatch.campusId = String(campus);
                }
                if (String(type) == "transaction") {
                    res.status(200).send({
                        status: "success",
                        data: {
                            totalRecord: await getTxnCount()
                        }
                    })
                    centralDbConnection.close();
                    dbConnection.close();
                }

                async function getTxnCount() {
                    let newToDate = new Date(toDate);
                    newToDate = newToDate.setDate(newToDate.getDate() + 1);

                    let transactionMatch = {};
                    transactionMatch.transactionDetails = {
                        $elemMatch: {
                            transactionSubType: 'feePayment',
                            createdAt: {
                                $gte: new Date(fromDate),
                                $lte: new Date(newToDate)
                            }
                        }
                    }
                    let getTxnCount = await reportModel.aggregate([
                        {
                            $match: transactionMatch
                        },
                        {
                            $match: filterMatch
                        },
                        {
                            $group: {
                                _id: 0,
                                count: { $sum: 1 },
                                paid: { $sum: "$amount" }
                            }
                        },
                        {
                            $project: {
                                total: "$count",
                                paid: "$paid"
                            }
                        }
                    ]);
                    return getTxnCount;
                }
            }
            catch (err) {
                res.status(400).send({
                    status: "failed",
                    message: err.message
                })
                centralDbConnection.close();
                dbConnection.close();
            }
            finally { }
        }
        else {
            res.status(400).json({
                message: "Reports 'type' query is missing. Please provide all the required parameters.",
                status: 'failure'
            })
            centralDbConnection.close();
            dbConnection.close();
        }
    }
    else {
        res.status(400).json({
            status: "failed",
            message: "Reports 'orgId' query is missing. please provide all the required parameters."
        })
        centralDbConnection.close();
        dbConnection.close();
    }
}

// API DETAILS
// (1) REPORT CHARTS
// URL: /edu/reportChart?type=transactions&orgId=5fa8daece3eb1f18d4250e98&campus=All&programPlan=All&fromDate=2021-06-01&toDate=2021-07-19
// METHOD: GET
// HEADERS: Authorization: Auth_Token
// QUERY CHANGES:
// 1) type
//  -- type of report

// 2) orgId
//  -- 5fa8daece3eb1f18d4250e98

// 3) Campus
// 	-- All
// 	-- campus id's (Ex: 60654c035fd59b0cf8bf21e6)

// 4) programPlan
// 	-- All
// 	-- program plan id's (Ex: 60654c375fd59b0cf8bf2251)

// 5) fromDate
// 	-- Format (yyyy-mm-dd)

// 6) toDate
// 	-- Format (yyyy-mm-dd)

