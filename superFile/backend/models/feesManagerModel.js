const mongoose = require("mongoose");

const FeeManagerSchema = mongoose.Schema(
  {
    // id: { type: String },
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    feeTypeId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Fee Structure required"],
    },
    programPlanId: {
      type: mongoose.Types.ObjectId,
      ref: "feeTypes",
      required: [true, "Program Plan required"],
    },
    reminderPlanId:{
      type: mongoose.Types.ObjectId,
      ref: "reminderplans",
      required: [true, "Reminder Plan required"],
    },
    paymentScheduleId:{
      type: mongoose.Types.ObjectId,
      ref: "paymentschedules",
      required: [true, "payment Schedule Plan required"],
    },
    concessionPlanId:{
      type: mongoose.Types.ObjectId,
      ref: "concessionplans",
      required: false,
    },
    lateFeePlanId:{
      type: mongoose.Types.ObjectId,
      ref: "latefeeplans",
      required: [true, "Late Fee Plan required"],
    },
    installmentPlanId:{
      type: mongoose.Types.ObjectId,
      ref: "installments",
      required: false,
    },
    feeDetails: {
      units: {
        currency: {
          type: String,
        },
        value: {
          type: Number,
        },
      },
      perUnitAmount: {
        currency: {
          type: String,
        },
        value: {
          type: Number,
        },
      },
      totalAmount: {
        type: Number,
        required: [false, "Annual Amount required"],
      },
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
FeeManagerSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = FeeManagerSchema;
