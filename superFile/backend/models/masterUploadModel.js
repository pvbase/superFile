const mongoose = require("mongoose");
const masterUploadSchema = mongoose.Schema(
  {
    fileName: { type: String, required: [true, "File name is required"] },
    uploadedFileName: {
      type: String,
      required: [true, "File name is required"],
    },
    fileSize: {
      type: String,
      required: [true, "File size is required"],
    },
    totalRecords: {
      type: Number,
      required: [true, "Total Records is required"],
    },
    totalStudents: {
      type: Number,
      required:false,
    },
    totalFeetypes: {
      type: Number,
      required: false,
    },
    totalFeeStructures: {
      type: Number,
      required: false,
    },
    totalPrograPlans: {
      type: Number,
      required: false,
    },
    totalFeeManagers: {
      type: Number,
      required: false,
    },
    data: {
      type: Object,
      required: [true, "Data is required"],
    },
    uidata: {
      type: Object,
      required: [true, "Data is required"],
    },
    version: {
      type: Number,
      required: [true, "Version is required"],
    },
  },
  { timestamps: true }
);
masterUploadSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = masterUploadSchema;
