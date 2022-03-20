const mongoose = require("mongoose");
const defaultPlan = new mongoose.Schema(
    {
        programPlanId: { type: String, unique: true },
        feesDetails: { type: Array },
        currency: { type: String },
        programName: { type: String },
        location: { type: String },
        instituteId:{type:String}
    }

);
//mongoose.set("useFindAndModify", false);
module.exports = defaultPlan;
