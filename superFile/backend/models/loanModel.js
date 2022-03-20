const mongoose = require("mongoose");

const loanSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    provider: { type: String, required: [true, "Provider required"] },
    campusId:{type:String},
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
loanSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = loanSchema;
