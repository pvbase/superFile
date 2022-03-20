const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    orgId: {
        type: String,
        required: [true, ""]
    },
    readStatus: {
        type: Boolean,
        required: [false, ""],
        default: false
    },
    viewStatus: {
        type: Boolean,
        required: [false, ""],
        default: false
    },
    clearStatus: {
        type: Boolean,
        required: [true, ""],
        default: false
    },
    status: {
        type: String,
        required: [true, ""],
        default: "success"
    },
    title: {
        type: String,
        required: [true, ""]
    },
    message: {
        type: String,
        required: [true, ""]
    },
    createdAt: {
        type: Date,
        required: [false, ""],
        default: new Date()
    },
    action: {
        type:Object,
        required:[true, ""]
    }
});

module.exports = notificationSchema