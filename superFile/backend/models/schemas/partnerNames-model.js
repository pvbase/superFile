const mongoose = require("mongoose");

const partnerNamesSchema = new mongoose.Schema(
    {
        nameInBankStmt: {type: String, required: true, unique: true}, 
        nameInCoA: {type: String, required: true}, 
        coaCode: {type: String}, 
        createdBy: {type: mongoose.Types.ObjectId}, 
        updatedBy: {type: mongoose.Types.ObjectId}
    },
    { timestamps: true }
);

module.exports = partnerNamesSchema;
