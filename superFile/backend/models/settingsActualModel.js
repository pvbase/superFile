const mongoose = require("mongoose");
const settingsSchema = new mongoose.Schema(
    {
        instituteDetails: {
            instituteName: {
                type: String
            },
            gstin: {
                type: String, default: null
            },
            pan: {
                type: String, default: null
            },
            address1: {
                type: String, default: null
            },
            address2: {
                type: String, default: null
            },
            address3: {
                type: String, default: null
            },
            cityTown: {
                type: String, default: null
            },
            stateName: {
                type: String, default: null
            },
            stateCode: {
                type: String, default: null
            },
            pinCode: {
                type: String, default: null
            },
            firstName: {
                type: String, default: null
            },
            lastName: {
                type: String, default: null
            },
            email: {
                type: String, default: null
            },
            phoneNumber1: {
                type: String, default: null
            },
            phoneNumber2: {
                type: String, default: null
            },
            academicYear: {
                type: String, default: null
            },
            dateFormat: {
                type: String,default: null
            }
        },
        logo: {
            logo: {
                type: String, default: null
            }
        },
        emailServer: {
            emailServer: {
                type: String
            },
            emailAddress: {
                type: String
            },
            config: {
                type: Object
            }
        },
        smsGateway: {
            smsGateway: {
                type: String
            },
            phoneNumber: {
                type: String
            },
            senderName: { type: String },
            apiKey: { type: String },
        },
        paymentGateway: {
            paymentGateway: {
                type: String
            },
            accessKey: {
                type: String
            },
            secretKey: {
                type: String
            }
        }
    },
    { timestamps: true },
    { _id: false }
);
//mongoose.set("useFindAndModify", false);
module.exports = settingsSchema;