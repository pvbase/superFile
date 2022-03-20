const mongoose = require('mongoose');

const franchiseNew = new mongoose.Schema({
    bankDetails: {
        type: Object,
        required: true,
        bankName: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        bankAccountName: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        bankAccountNumber: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        bankIFSC: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        }
    },
    financialDetails: {
        type: Object,
        required: true,
        GSTIN: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            },
        },
        PAN: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            },
        }
    },
    headApprover: {
        type: Object,
        required: true,
        designation: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            },
        },
        emailAddress: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            },
        },
        headApproverName: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            },
        },
        phoneNumber: {
            type: Number,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            },
        }
    },
    franchiseContact: {
        type: Object,
        required: true,
        contactname: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        designation: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        emailAddress: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        mobileNumber: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        phoneNumber: {
            type: Number,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        }
    },
    legalAddress: {
        type: Object,
        required: true,
        address1: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        address2: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        address3: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        city: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        state: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        country: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        },
        pincode: {
            type: Number,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        }
    },
    royalty: {
        type: Object,
        required: true,
        royaltyPercentage: {
            type: Number,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        }
    },
    logo: {
        type: Object,
        required: true,
        logoData: {
            type: String,
            required: false,
            default: null,
            set: function (value) {
                return value == "" ? null : value;
            }
        }
    },
    franchiseName: {
        type: String,
        required: false,
        default: null,
        set: function (value) {
            return value == "" ? null : value;
        }
    },
    organizationType: {
        type: String,
        required: false,
        default: null,
        set: function (value) {
            return value == "" ? null : value;
        }
    },
    dateOfRegistration: {
        type: String,
        required: false,
        default: null,
        set: function (value) {
            return value == "" ? null : value;
        }
    },
    displayName: {
        type: String,
        required: [false, ""]
    },
    status:{
        type:String,
        required: false,
        default: "Active",
    }
});

module.exports = franchiseNew;