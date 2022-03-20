const mongoose = require("mongoose");
const examFeesUploadSchema = mongoose.Schema(
  {
    fileName: { type: String, required: [false, "File name is required"] },
    uploadedFileName: {
      type: String,
      required: false,
    },
    fileSize: {
        type: String,
        required: [false, "File size is required"],
      },
    totalRecords: {
      type: Number,
      required: [true, "Total Records is required"],
    },
    data: {
      type: Object,
      required: [true, "Data is required"],
    },
    uidata: {
      type: Object,
      required: false,
    },
    version: {
      type: Number,
      required: [true, "Version is required"],
    },
  },
  { timestamps: true }
);
examFeesUploadSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = examFeesUploadSchema;
