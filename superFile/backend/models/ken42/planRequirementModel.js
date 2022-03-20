const mongoose = require("mongoose");

const planRequirementSchema = mongoose.Schema(
  {
    ID: {
      type: String,
      required: [true, "ID required"],
      unique: true,
      index: true,
    },
    NAME: { type: String, required: [true, "Name required"] },
    HED__CATEGORY__C: {
      type: String,
      required: [true, "HED__CATEGORY__C required"],
    },
    HED__COURSE__C: {
      type: String,
      required: [true, "HED__COURSE__C required"],
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
planRequirementSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = planRequirementSchema;
