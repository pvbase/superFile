const mongoose = require("mongoose");

const ApplicationSchema = mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: [true, "Application required"],
    },
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
    batch: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: [true, "Email required"],
    },
    paymentId: {
      type: String,
    },
    partial: { type: String },
    callBackUrl: { type: String },
    currencyCode: { type: String },
    paymentStatus: { type: Number, default: 2 },
    razorpay: { type: Object },
    txnDetails: { type: Object },
    webhookStatus: { type: String },
    programPlan: { type: String },
    transactionId: { type: String },
    gatewayType: { type: String },
    parentName: { type: String },
    status: { type: String, default: "submitted" },
    razorpayUnique: { type: String },
    applicationType: { type: String }
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
ApplicationSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = ApplicationSchema;
