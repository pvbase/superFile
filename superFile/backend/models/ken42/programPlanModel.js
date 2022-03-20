const mongoose = require("mongoose");

const programPlanSchema = mongoose.Schema(
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
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
programPlanSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = programPlanSchema;
