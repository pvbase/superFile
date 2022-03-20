const mongoose = require("mongoose");

const programEnrollmentSchema = mongoose.Schema(
  {
    ID: {
      type: String,
      required: [true, "ID required"],
      unique: true,
      index: true,
    },
    NAME: { type: String, required: [true, "Name required"] },
    HED__ACCOUNT__C: {
      type: String,
      required: [true, "HED__ACCOUNT__C required"],
    },
    HED__CONTACT__C: {
      type: String,
      required: [true, "HED__CONTACT__C required"],
    },
    HED__PROGRAM_PLAN__C: {
      type: String,
      required: [true, "HED__PROGRAM_PLAN__C required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
programEnrollmentSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = programEnrollmentSchema;
