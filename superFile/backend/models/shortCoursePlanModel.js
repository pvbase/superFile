const mongoose = require("mongoose");

const shortCoursePlan = mongoose.Schema(
    {
        applicationId: {
            type: String,
            required: [true, "Application ID required"]
        },
        regId: {
            type: String,
            required: false
        },
        name: {
            type: String,
            required: [true, "Student Name required"]
        },
        permanentAddress: {
            type: String,
            required: [true, "Address required"],
        },
        mobileNumber: {
            type: String,
            required: [true, "Phone Number required"]
        },
        emailAddress: {
            type: String,
            required: [true, 'Email address required']
        },
        courseId: {
            type: String,
            required: [true, 'Course ID required']
        },
        courseName: {
            type: String,
            required: [true, "Course Name required"],
        },
        courseFee: {
            type: Number,
            required: [true, "Course Fee required"],
        },
        courseStartDate: {
            type: String,
            required: [true, "Course Start Date required"],
        },
        currencyCode: {
            type: String,
            required: false,
            default:'INR'
        },
        feeDetails: [
            {
                feeAmount: {
                    type: Number,
                    required: [true, "Fee amount required"]
                },
                feeType: {
                    type: String,
                    required: [true, "Fee Type required"]
                },
                amountType: {
                    type: String,
                    required: [true, "Amount Type required (Full/Partial)"],
                    enum: ["Full", "Partial"]
                },
                demandNoteDate: {
                    type: String,
                    required: false
                },
                amountPaid: {
                    type: Number,
                    required: false
                },
                paidMode: {
                    type: String
                },
                receiptUrl: {
                    type: String,
                    required: false
                },
                modeDetails: {
                    type: Object
                },
                status: { type: String }
            }
        ],
        demandNoteDisplayName: {
            type: String
        },
        demandNoteDetails: {
            type: Object
        },
        razorpayDetails: {
            type: Object,
        },
        createdBy: {
            type: String,
            required: [false],
        },
    },
    { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
shortCoursePlan.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = shortCoursePlan;
