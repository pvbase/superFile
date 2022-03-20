const mongoose = require("mongoose");
const headsellerschema = new mongoose.Schema(
    {
        leadId: { type: String, unique: true },
        parent: {
            firstName: { type: String },
            lastName: { type: String },
            email: { type: String },
            phoneNumber: { type: String },
            address: { type: Object }
        },
        student: {
            firstName: { type: String },
            lastName: { type: String },
            admittedOn: { type: String },
            dob: { type: String },
            gender: { type: String },
            citizenShip: { type: String },
            email: { type: String },
            phoneNumber: { type: String }
        },
        programdetail: {
            type: Object
        },
        parentPhone: { type: String },
        programPlan: { type: Object },
        installmentDetails: { type: Array },
        accountStatus: { type: String },
        currency: { type: Object },
        applicationId: { type: String },
        organizationId: { type: String }
    },
    { timestamps: true },
    { _id: false }
);
//mongoose.set("useFindAndModify", false);
module.exports = headsellerschema;
 // assignedTo: { type: String }