const mongoose = require("mongoose");
const settingsSchemawithversion = new mongoose.Schema(
    {
        instituteDetails: {
            version: { type: Number },
            instituteName: {
                type: String
            },
            gstin: {
                type: String, default: null
            },
            pan: {
                type: String, default: null
            },
            typeOfOrganization: {
                type: String, default: null
            },
            dateOfRegistration: {
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
                type: String, default: null
            }

        },
        logo: {
            version: { type: Number },
            logo: {
                type: String, default: null
            }
        },
        emailServer: {
            version: { type: Number },
            emailServer: {
                type: String
            },
            emailAddress: {
                type: String
            },
            config: {
                type: Object
            },
            apiKey: {
                type: String,
                default: null
            }
        },
        smsGateway: {
            version: { type: Number },
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
            version: { type: Number },
            paymentGateway: {
                type: String
            },
            accessKey: {
                type: String
            },
            secretKey: {
                type: String
            }
        },
        dfcr: {
            // frequency: { type: Number, default: 2 },
            // timing1: { type: String, default: '6am' },
            // timing2: { type: String, default: '6pm' },
            // cronValue: { type: String, default: '0 0 6,18 * *' }
        },
        currency: {
            type: Array
        }
    },
    { timestamps: true },
    { _id: false }
);
//mongoose.set("useFindAndModify", false);
module.exports = settingsSchemawithversion;