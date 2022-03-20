const mongoose = require("mongoose");

const StudentFeeMapSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      unique: true,
      trim: true,
      required: [true, "Display ID required"],
    },
    studentId: {
      type: mongoose.Types.ObjectId,
      trim: true,
      required: [true, "Student ID required"],
    },
    feeStructure: {
      type: mongoose.Types.ObjectId,
    },
    feeManager: [
      {
        id: { type: mongoose.Types.ObjectId },
        amountTillDate: { type: Number },
        paid: { type: Number },
        balance: { type: Number },
      },
    ],
    createdBy: {
      type: mongoose.Types.ObjectId,
      required: [true, "createdBy required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
StudentFeeMapSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = StudentFeeMapSchema;
