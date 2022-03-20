const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const orgListSchema = require("../models/orglists-schema");
const programPlanSchema = require("../models/programPlanModel");

module.exports.editProgramPlan = async (req, res) => {
    const { orgId } = req.query;
    if (orgId !== undefined && orgId !== "") {
        const centralDbConnection = await createDatabase(`usermanagement-${process.env.stage}`, process.env.central_mongoDbUrl);
        const orgListModel = centralDbConnection.model("orglists", orgListSchema, "orglists");
        const orgData = await orgListModel.findOne({ _id: mongoose.Types.ObjectId(orgId) });
        if (!orgData || orgData == null) {
            centralDbConnection.close();
            res.status(400).send({
                status: 'failure',
                message: "Organization not found"
            });
        }
        const dbConnection = await createDatabase(String(orgData._doc._id), orgData._doc.connUri);

        const getProgramPlan = await dbConnection.model("programPlans", programPlanSchema);
        getProgramPlan.findByIdAndUpdate(
            mongoose.Types.ObjectId(req.body._id),
            { $set: { status: req.body.status, dashboardName: req.body.dashboardName } },
            { new: true },
            (err, results) => {
                if (err) {
                    res.status(400).send({
                        status: 'failure',
                        message: err.message
                    });
                }
                else {
                    res.status(200).send({
                        status: 'success',
                        message: "Updated successfully."
                    });
                }
            }
        );
    }
    else {
        res.status(400).send({
            message: "Program plan 'orgId' query is missing. Please provide valid Id.",
            status: 'failure'
        })
    }
}