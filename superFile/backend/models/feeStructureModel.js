const mongoose = require("mongoose");

const FeeStructureSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    campusId:{type:String},
    feeTypeIds: [
      {
        type: mongoose.Types.ObjectId,
        ref: "feetypes",
      },
    ],
    createdBy: {
      type: String,
      required: [true, "created by required"],
    },
    // id: { type: String },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
FeeStructureSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = FeeStructureSchema;
