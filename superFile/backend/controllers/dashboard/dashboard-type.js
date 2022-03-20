const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
const reportSchema = require('../flatten-reports/report-schema');
const orgListSchema = require("../../models/orglists-schema");
const campusSchema = require("../../models/campusModel");
const programPlanSchema = require("../../models/programPlanModel");

module.exports.getDashboardType = async (req, res) => {
    const { orgId, type, campus, programPlan, fromDate, toDate, page, limit, searchKey } = req.query;

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

        const reportDetailModel = dbConnection.model("reportdetails", reportSchema);
        const campusModel = dbConnection.model("campuses", campusSchema);
        const programPlanModel = dbConnection.model("programplans", programPlanSchema);

        try {
            if (String(type) == "campus") {
                
             }
        }
        catch (err) {
            res.status(400).send({
                status: "failed",
                message: err.message
            })
        }
        finally { }
    }
    else {
        res.status(400).send({
            status: "failed",
            message: "Dashboard type 'orgId' query is missing. please provide all the required parameters."
        })
    }
}