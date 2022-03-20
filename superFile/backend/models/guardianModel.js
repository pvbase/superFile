const mongoose = require("mongoose");

const GuardianSchema = mongoose.Schema(
    {
        isPrimary: {
            type: Boolean,
            default: true
        },
        firstName: { // Parent Name
            type: String,
            required: false,
        },
        lastName: { //Parent Name
            type: String,
            required: false,
        },
        fullName:{
            type: String,
            required: false,
        },
        mobile: { //Phone Number
            type: String,
            required: false,
        },
        email: { //Parent Email Address
            type: String,
            required: false,
        },
        relation: {
            type: String,
            required: true,
        },
        PIIUsageFlag: {type:Boolean},
        PIIUsageFlagUpdated: {type: Date},
        fatherDetails:{type: String},
        motherDetails:{type: String},
        guardianDetails:{type: String},
        createdBy: {
            type: String,
            required: [true, "createdBy required"],
        },
        status: { type: Number, default: 1 },
    },
    { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
GuardianSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = GuardianSchema;