const mongoose = require("mongoose");
const settingsSchema = new mongoose.Schema(
  {
    instituteDetails: {
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
        type: String,
      },
      dateFormat: {
        type: String,
      },
    },
    headApprover: {
      type: Object,
    },
    bankDetails: {
      type: Object,
    },
    logo: {
      logo: {
        type: String,
      },
    },
    labels: { type: Object },
    emailServer: {
      type: Object,
      //   emailServer: {
      //     type: String,
      //   },
      //   emailAddress: {
      //     type: String,
      //   },
      //   config: {
      //     type: Object,
      //   },
    },
    smsGateway: {
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
  },
  { timestamps: true },
  { _id: false }
);
//mongoose.set("useFindAndModify", false);
module.exports = settingsSchema;
