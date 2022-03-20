const mongoose = require("mongoose");
const settingsSchemawithversion = new mongoose.Schema(
  {
    instituteDetails: {
      // version: { type: Number },
      instituteName: {
        type: String,
      },
      gstin: {
        type: String,
      },
      pan: {
        type: String,
      },
      address1: {
        type: String,
      },
      address2: {
        type: String,
      },
      address3: {
        type: String,
      },
      cityTown: {
        type: String,
      },
      stateName: {
        type: String,
      },
      stateCode: {
        type: String,
      },
      pinCode: {
        type: String,
      },
      firstName: {
        type: String,
      },
      lastName: {
        type: String,
      },
      email: {
        type: String,
      },
      phoneNumber1: {
        type: String,
      },
      phoneNumber2: {
        type: String,
      },
      academicYear: {
        type: Object,
      },
      dateFormat: {
        type: String,
      },
    },
    headApprover: {
      type: Array,
    },
    bankDetails: {
      type: Array,
    },
    logo: {
      type: Object,
    },
    favicon: { type: Object },
    logoPositions: { type: Object },
    receipts: { type: Object },
    labels: { type: Array },
    portalLogin: { type: Object },

    emailServer: {
      type: Array,
      // version: { type: Number },
      // emailServer: {
      //     type: String
      // },
      // emailAddress: {
      //     type: String
      // },
      // config: {
      //     type: Object
      // }
    },
    smsGateway: {
      // version: { type: Number },
      smsGateway: {
        type: String,
      },
      senderName: { type: String },
      apiKey: { type: String },
      phoneNumber: {
        type: String,
      },
    },
    paymentGateway: {
      // version: { type: Number },
      paymentGateway: {
        type: String,
      },
      accessKey: {
        type: String,
      },
      secretKey: {
        type: String,
      },
    },
    orgDetails: {
      status: String,
      disableLoginDate: Date
    },
  },
  { timestamps: true },
  { _id: false }
);
//mongoose.set("useFindAndModify", false);
module.exports = settingsSchemawithversion;
