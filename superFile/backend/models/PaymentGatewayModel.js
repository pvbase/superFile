const mongoose = require("mongoose");

const PaymentGatewaySchema = mongoose.Schema(
  {
    paymentReferenceId: {
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
    },
    email: {
      type: String,
    },
    paymentId: {
      type: String,
      required: [true, "PAYMENTID required"],
    },
    callBackUrl: { type: String },
    currencyCode: { type: String },
    paymentStatus: { type: Number, default: 2 },
    data: { type: Object },
    paymentResponse: { type: Object },
    webhookStatus: { type: String },
    status: { type: String },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
PaymentGatewaySchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = PaymentGatewaySchema;
