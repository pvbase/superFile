const mongoose = require("mongoose");

const reconciliationTransactionsSchema = new mongoose.Schema(
    {
        transactionType: { type: String, required: true },
        transactionSubType: { type: String },
        transactionDate: { type: Date, required: true },
        studentId: { type: mongoose.Types.ObjectId },
        studentName: {type: String},
        parentName:{type: String},
        amount: { type: Number },
        relatedTransactions: [{ type: String }],
        data: { type: Object },
        createdBy: { type: mongoose.Types.ObjectId },
        updatedBy: { type: mongoose.Types.ObjectId },
        paymentMode: {
            type: String,
            required: true,
            // enum: ["cheque", "paymentGateway","cash", "internetbanking", ""]
        },
        paymentDetails: {
            type: Object
        },
        paymentReferenceNumber: {
            type: String
        },
        // isReconciled: {
        //     type: Boolean
        // },
        transactionReferenceId: {
            type: mongoose.Types.ObjectId,
            default:null
        },
        statementReferenceId: {
            type: mongoose.Types.ObjectId,
            default:null
        },
        status: {
            type: String, 
            enum: ["initial", "nonreconciled","softwarereconciled", "reconciled"]
        }
    },
    { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
reconciliationTransactionsSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = reconciliationTransactionsSchema;

