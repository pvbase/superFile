const mongoose = require("mongoose");
const examFeesSchema = mongoose.Schema(
    {
        displayName: {
            type: String,
            required: [true, "File name is required"],
        },
        USN: {
            type: String,
            required: [true, "Total Records is required"],
        },
        studentName: {
            type: String,
            required: [true, "Data is required"],
        },
        studentID: {
            type: mongoose.Types.ObjectId,
            required: false,
        },
        branchCode: {
            type: String,
            required: false,
        },
        semester: {
            type: String,
            required: false,
        },
        email: {
            type: String,
            required: false,
        },
        mobile: {
            type: String,
            required: false,
        },
        examFees: {
            type: Number,
            required: false,
        },
        excemption: {
            type: Number,
            required: false,
        },
        miscellaneous: {
            type: Number,
            required: false,
        },
        version: {
            type: Number,
            required: [true, "Version is required"],
        },
    },
    { timestamps: true }
);
examFeesSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = examFeesSchema;
