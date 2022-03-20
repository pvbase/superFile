const mongoose = require("mongoose");

const RazorpaySchema = mongoose.Schema(
  {
    studentId: { type: String, required: [true, "Application required"] },
    amount: { type: Number, required: [true, "Amount required"] },
    paisa: { type: Number, required: [true, "paisa required"] },
    name: {
      type: String,
      required: [true, "Name required"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile required"],
    },
    email: {
      type: String,
      required: [true, "Email required"],
    },
    paymentId: {
      type: String,
      required: [true, "PAYMENTID required"],
    },
    callBackUrl: { type: String },
    currencyCode: { type: String },
    paymentStatus: { type: Number, default: 2 },
    razorpay: { type: Object },
    webhookStatus: { type: String },
    feesBreakUp: { type: Array },
    status: { type: Number, default: 1 },
    referenceId: { type: String },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
RazorpaySchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = RazorpaySchema;
