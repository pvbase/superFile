const mongoose = require("mongoose");

const acchistory = new mongoose.Schema({
    nameOfField: { type: String },
    fieldName:{type:String},
    oldValue: { type: Object },
    newValue: { type: Object },
    version: { type: Number },
    updatedBy: { type: String },
    userEmail: { type: String },
    updateAt: { type: String }

});


//mongoose.set("useFindAndModify", false);
module.exports = acchistory;