const mongoose = require("mongoose");

const studentTransactionPlanSchema = mongoose.Schema(
  {
    bankName: { type: String, required: [true, "Bank Name required"] },
    bankAccountName: {
      type: String,
      required: [true, "Account Name required"],
    },
    bankAccountNumber: {
      type: String,
      required: [true, "Account Name required"],
    },
    bankIFSC: {
      type: String,
      required: [true, "Account IFSC required"],
    },
    status: { type: String },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
studentTransactionPlanSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = studentTransactionPlanSchema;
