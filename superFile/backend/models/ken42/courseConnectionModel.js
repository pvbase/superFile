const mongoose = require("mongoose");

const CourseConnectionSchema = mongoose.Schema(
  {
    ID: {
      type: String,
      required: [true, "ID required"],
      unique: true,
      index: true,
    },
    NAME: { type: String, required: [true, "Name required"] },
    RECORDTYPEID: { type: String, required: [true, "RECORDTYPEID required"] },
    HED__ACCOUNT__C: {
      type: String,
      required: [true, "HED__ACCOUNT__C required"],
    },
    HED__CONTACT__C: {
      type: String,
      required: [true, "HED__CONTACT__C required"],
    },
    HED__COURSE_OFFERING__C: {
      type: String,
      required: [true, "HED__COURSE_OFFERING__C required"],
    },
    HED__PROGRAM_ENROLLMENT__C: {
      type: String,
      required: [true, "HED__PROGRAM_ENROLLMENT__C required"],
    },
    HED__STATUS__C: {
      type: String,
      required: [true, "HED__STATUS__C required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
CourseConnectionSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = CourseConnectionSchema;
