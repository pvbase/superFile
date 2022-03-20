const mongoose = require("mongoose");

const scholarshipSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    type: { type: String, required: [true, "Type required"] },
    campusId:{type:String},
    provider: { type: String, required: [true, "Provider required"] },
    bankId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Bank ID required"],
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
scholarshipSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = scholarshipSchema;
//