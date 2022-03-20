const mongoose = require("mongoose");

const bankTransactionMapperSchema = new mongoose.Schema(
    {
        bankDescription: { type: String, required: true },
        transactionsStudentRegId: [{ type: String }] 
    },
    { timestamps: true }
);

module.exports = bankTransactionMapperSchema;
