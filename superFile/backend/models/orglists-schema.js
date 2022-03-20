const mongoose = require("mongoose");
const orgSchema = new mongoose.Schema(
    {
        user: {
            type: String,
            required: true
        },
        connUri: {
            type: String,
            required: true
        },
        loginClient:{
            type: String,
            required: true
        },
        PAN: {
            type: String,
            required: false
        },
        nameSpace: {
            type: String,
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    { timestamps: true }, { _id: false }
);
// //mongoose.set("useFindAndModify", false);

module.exports = orgSchema
