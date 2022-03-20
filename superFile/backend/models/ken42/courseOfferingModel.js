const mongoose = require("mongoose");

const CourseOfferSchema = mongoose.Schema(
  {
    ID: {
      type: String,
      required: [true, "ID required"],
      unique: true,
      index: true,
    },
    MAXIMUM_CLASSES__C: {
      type: String,
      required: [true, "MAXIMUM_CLASSES__C required"],
    },
    NAME: { type: String, required: [true, "NAME required"] },
    TOTAL_ATTENDANCE_REQUIRED__C: {
      type: String,
      required: [true, "TOTAL_ATTENDANCE_REQUIRED__C required"],
    },
    HED__CAPACITY__C: {
      type: String,
      required: [true, "HED__CAPACITY__C required"],
    },
    HED__COURSE__C: {
      type: String,
      required: [true, "HED__COURSE__C required"],
    },
    HED__SECTION_ID__C: {
      type: String,
      required: [true, "HED__SECTION_ID__C required"],
    },
    HED__TERM__C: {
      type: String,
      required: [true, "HED__TERM__C required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
CourseOfferSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = CourseOfferSchema;
