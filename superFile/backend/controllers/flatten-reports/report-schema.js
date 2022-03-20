const mongoose = require('mongoose');
const reportSchema = new mongoose.Schema(
    {
        studentRegId: {
            type: String,
            required: [true, "student - register Id required"],
            unique: true,
        },
        feePlanId: {
            type: String,
            required: [true, "fee plan - ID required"],
            unique: true
        },
        programPlanId: { type: mongoose.Types.ObjectId },
        campusId: {
            type: String,
            required: [true, "campus - ID required"],
        },
        studentDetails: {
            studentId: {
                type: String,
                required: [true, "student - ID required"],

            },
            studentRegId: {
                type: String,
                required: [true, "student - register Id required"],

            },
            displayName: {
                type: String,
                required: [true, "student - displayName required"]
            },
            rollNumber: {
                type: String,
                required: [true, "student - rollNumber required"]
            },
            firstName: {
                type: String,
                required: [true, "student - firstName required"]
            },
            lastName: {
                type: String,
                required: [true, "student - lastName required"]
            },
            section: { type: String },
            dob: { type: String },
            phoneNo: { type: String },
            email: { type: String },
            category: { type: String },
            gender: { type: String },
            citizenship: { type: String },
            currency: { type: String },
            FOREX: { type: String },
            admittedOn: { type: String },
            parentName: { type: String, required: false },
            parentPhone: { type: String, required: false },
            parentEmail: { type: String, required: false },
            guardianDetails: [
                {
                    guardianId: { type: String },
                    firstName: { type: String },
                    lastName: { type: String },
                    fullName: { type: String },
                    phoneNumber: { type: String },
                    email: { type: String },
                    relation: { type: String }
                }
            ],
            status: { type: Number, default: 1 },
            isFinalYear: { type: String }
        },
        campusDetails: {
            headaId: { type: String },
            displayName: { type: String },
            campusdisplayName: { type: String },
            name: { type: String },
            legalName: { type: String },
            logo: { type: String }
        },
        programPlanDetails: {
            type: Object
        },
        feePlanDetails: {
            type: Object
        },
        installmentDetails: {
            type: Array,
            installmentId: { type: mongoose.Types.ObjectId },
            label: { type: String },
            description: { type: String },
            dueDate: { type: Date },
            lateFeeStartDate: { type: Date },
            percentage: { type: Number },
            plannedAmount: { type: Number },
            paidAmount: { type: Number },
            pendingAmount: { type: Number },
            discountType: { type: String },
            discountPercentage: { type: Number },
            discountAmount: { type: Number },
            status: { type: String },
            lateFees: { type: Number },
            concessionFees: { type: Number },
        },
        transactionDetails: {
            type: Array
        }

    },
    { timestamps: true }
)
//mongoose.set("useFindAndModify", false);
reportSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = reportSchema