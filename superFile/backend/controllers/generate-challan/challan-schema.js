const mongoose = require('mongoose');
const challanSchema = new mongoose.Schema(
    {
        studentName: {
            type: String,
            required: [true, "Student name is required"]
        },
        studentRegId: {
            type: String,
            required: [true, "student register ID is required"]
        },
        class: {
            type: String,
            required: [true, "Class/Batch is required"]
        },
        demandNoteId: {
            type: String,
            required: [true, "Demand note id is required"]
        },
        emailCommunicationRefIds: {
            type: String,
            required: [true, "receiver email is required"]
        },
        createdAt: {
            type: String,
            required: [false, ""],
            default: new Date()
        },
        challanGeneratedDate: {
            type: String,
            required: [true, "Challan generate date is required"]
        },
        orgId: {
            type: String,
            required: [true, "OrgId is required"]
        },
        displayName: {
            type: String
        },
        feesBreakUp: [
            {
                feeTypeId: {
                    type: String
                },
                feeTypeCode: {
                    type: String
                },
                amount: {
                    type: Number
                },
                feeType: {
                    type: String
                }
            }
        ]
    }
)

module.exports = challanSchema;