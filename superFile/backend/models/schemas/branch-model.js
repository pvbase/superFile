const mongoose = require("mongoose");
const branchSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Types.ObjectId,
      required: false,
      set: function (value) {
        return value ? mongoose.Types.ObjectId(value) : mongoose.Types.ObjectId
      }
    },
    orgBranchReferenceId: {
      type: mongoose.Types.ObjectId,
      required: true
    },
    bankName: {
      type: String,
      required: false,
      default: null,
    },
    phoneNumber2: {
      type: String,
      required: false,
      default: null,
    },
    phoneNumber1: {
      type: String,
      required: false,
      default: null,
    },
    branchId: {
      type: String,
      required: false,
    },
    bankIFSC: {
      type: String,
      required: false,
      default: null,
    },
    email: {
      type: String,
      required: false,
      default: null,
    },
    status: {
      type: String,
      required: true,
      default: "active",
      enum: ["active", "inactive"],
    },
    bankAccountName: {
      type: String,
      required: false,
      default: null,
    },
    bankAccountNumber: {
      type: String,
      required: false,
      default: null,
    },
    version: {
      type: Number,
      required: false
    },
    address1: {
      type: String,
      required: false,
      default: null,
    },
    address2: {
      type: String,
      required: false,
      default: null,
    },
    address3: {
      type: String,
      required: false,
      default: null,
    },
    cityTown: {
      type: String,
      required: false,
      default: null,
    },
    PINCode: {
      type: String,
      required: false,
      default: null,
    },
    isHeadquarters: {
      type: Boolean,
      required: true,
    },
    promoterDetails: {
      firstName: {
        type: String,
        required: true
      },
      lastName: {
        type: String,
        required: false,
        default: null
      },
      email: {
        type: String,
        required: true
      },
      phoneNumber1: {
        type: String,
        required: true,
      }, phoneNumber2: {
        type: String,
        required: false,
        default: null
      }, PAN: {
        type: String,
        required: false,
        default: null
      }, aadhaar: {
        type: String,
        required: false,
        default: null
      }, phoneCode: {
        type: String,
        required: false
      }
    }, cashCoaCode: {
      type: String,
      required: false,
      default: null
    }, bankCoaCode: {
      type: String,
      required: false,
      default: null
    }, parentId: {
      type: String,
      default: null
    }, type: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
module.exports = branchSchema;
