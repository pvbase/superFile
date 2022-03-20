const mongoose = require("mongoose");

const programPlanSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display ID required"],
      unique: true,
    },
    fromDate: {
      type: String,
    },
    HEDAID: { type: String },
    toDate: {
      type: String,
    },
    academicYear: {
      type: String,
    },
    title: { type: String, required: [true, "Name required"] },
    description: { type: String, required: [true, "Description required"] },
    dashboardName: { type: String, default: "" },
    campusId: { type: String },
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
programPlanSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = programPlanSchema;
