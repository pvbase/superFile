const mongoose = require("mongoose");
const instituteDetailsSchema = mongoose.Schema(
    {
        legalName: { type: String, required: [true, "Legal name required"] },
        id:  { type: String, required: false },
        dateOfRegistration: { type: Date, required:false, default:null, set: function (value) { return value=="" ? null : value } },
        legalAddress: {
            address1: { type: String, required: false },
            address2: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            address3: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            city: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            state: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            country: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            pincode: { type: Number, required:false, default:null, set: function (value) { return value=="" ? null : value } },
        },
        financialDetails: {
            GSTIN: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            PAN: { type: String, required: false, default:null, set: function (value) { return value=="" ? null : value } }
        },
        bankDetails: [{
            type: Object, required: true,
            bankName: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            bankAccountName: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            bankAccountNumber: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            bankIFSC: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } }
        }],
        instituteContact: [{
            type: Object, required: true,
            contactname: { type: String, required: [true, "Contact Name required"] },
            designation: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            department: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            emailAddress: { type: String, required:true },
            phoneNumber: { type: String, required:false, default:null, set: function (value) { return value=="" ? null : value } },
            mobileNumber: { type: String, required: [true, "Mobile number required"] }
        }],
        status: {type: String}
    },
    { timestamps: true }
);
//mongoose.set("useFindAndModify", false);
instituteDetailsSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = instituteDetailsSchema;