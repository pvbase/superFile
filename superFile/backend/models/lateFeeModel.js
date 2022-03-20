const mongoose = require("mongoose");

const LateFeeSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    type: {
      type: String,
    },
    campusId:{type:String},
    amount: {
      type: Number,
      required: [true],
    },
    every: {
      type: String,
      required: [true],
    },
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
LateFeeSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = LateFeeSchema;
