const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    campusId:{type:String},
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    status: { type: Number, Default:1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
categorySchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = categorySchema;
