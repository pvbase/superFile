const mongoose = require('mongoose');
const moment= require('moment');

const ChequeSchema = new mongoose.Schema({
    chequeNo: {
        type: String,
        required: [true, ""]
    },
    chequeDate: {
        type: String,
        required: [true, ""]
    },
    bankName: {
        type: String,
        required: [true, ""]
    },
    totalAmount: {
        type: String,
        required: [true, ""]
    },
    collectedBy: {
        type: String,
        required: [true, ""]
    },
    collectedUserName:{
        type:String,
        required:[false, ""]
    },
    collectedOn: {
        type: String,
        required: [false, ""]
    },
    transactionRefId:{
        type:String,
        required:[false, ""]
    },
    createdAt: {
        type: Date,
        required: [false, ""],
        default: moment().toISOString()
    },
    status: {
        type: String,
        required: [true, ""]
    }
})

module.exports = ChequeSchema;