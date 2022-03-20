const mongoose = require("mongoose");

const UniformPlanSchema = mongoose.Schema(
  {
    displayName: { type: String, required: [true, "Display Name required"] },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    gender: [
      {
        type: Number,
        required: [true, "Description required"],
        enum: [1, 2, 3],
      },
    ],
    size: { type: Number, required: [true, "Size required"] },
    createdBy: {
      type: mongoose.Types.ObjectId,
      required: [true, "createdBy required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
UniformPlanSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = UniformPlanSchema;
