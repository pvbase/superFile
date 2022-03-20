const mongoose = require("mongoose");
const instituteDetailsSchema = mongoose.Schema(
    {
        type: {
            type: String, required: [true, "Entity Type is required"],
            enum: ["institute", "campus", "board"]
        },
        subType: { type: String, required: false },
        legalName: { type: String, required: [true, "Entity name is required"] },
        dateOfRegistration: { type: Date, required: false, default: null },
        legalAddress: {
            address1: { type: String, required: false },
            address2: { type: String, required: false, default: null },
            address3: { type: String, required: false, default: null },
            city: { type: String, required: false, default: null },
            state: { type: String, required: false, default: null },
            country: { type: String, required: false, default: null },
            pincode: { type: Number, required: false, default: null },
        },
        financialDetails: {
            GSTIN: { type: String, required: false, default: null },
            PAN: { type: String, required: false, default: null }
        },
        bankDetails: [{
            type: Object, required: true,
            bankName: { type: String, required: false, default: null },
            bankAccountName: { type: String, required: false, default: null },
            bankAccountNumber: { type: String, required: false, default: null },
            bankIFSC: { type: String, required: false, default: null }
        }],
        contact: [{
            type: Object, required: true,
            contactName: { type: String, required: [true, "Contact Name required"] },
            designation: { type: String, required: false, default: null },
            department: { type: String, required: false, default: null },
            emailAddress: { type: String, required: true },
            phoneNumber: { type: String, required: false, default: null },
            mobileNumber: { type: String, required: [true, "Mobile number required"] }
        }],
    },
    { timestamps: true }
);
//mongoose.set("useFindAndModify", false);
instituteDetailsSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = instituteDetailsSchema;