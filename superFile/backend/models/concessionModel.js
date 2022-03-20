const mongoose = require("mongoose");

const concessionSchema = mongoose.Schema(
  {
    displayName: { type: String, required: [true, "Display Name required"],
    unique: true },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    categoryId: { type: String, required: [true, "Category ID required"] },
    concessionType: {
      type: String,
      enum: ["%", "value"],
      required: [true]
    },
    campusId:{type:String},
    concessionValue: {
      type: Number,
      required: [true]
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
concessionSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = concessionSchema;
