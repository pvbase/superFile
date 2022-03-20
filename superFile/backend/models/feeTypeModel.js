const mongoose = require("mongoose");

const FeeTypeSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    status: { type: Number, default: 1 },
    roleView:{type:Array},
    partialAllowed:{type:String},
    campusId:{type:String},
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
FeeTypeSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = FeeTypeSchema;
