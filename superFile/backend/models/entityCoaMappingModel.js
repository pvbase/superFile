const mongoose = require("mongoose");

const entityCoaMappingSchema = new mongoose.Schema(
    {
        entityId: { type: mongoose.Types.ObjectId, required: true },
        coaCode: { type: String, required: true },
        enabled: { type: Boolean, default: true },
        openingBalance: { type: Number, default: 0.0 },
        isLeaf: { type: Boolean, default: false },
        parentCode: { type: String },
        createdBy: { type: mongoose.Types.ObjectId },
        updatedBy: { type: mongoose.Types.ObjectId }
    },
    { timestamps: true }
);

module.exports = entityCoaMappingSchema;
