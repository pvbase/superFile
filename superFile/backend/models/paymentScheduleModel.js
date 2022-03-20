const mongoose = require("mongoose");

const PaymentScheduleSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    title: { type: String, required: [true, "Title Name required"] },
    campusId: { type: String },
    description: { type: String, required: [true, "Description required"] },
    scheduleDetails: {
      collectEvery: {
        type: String,
        required: false,
      },
      startMonth: {type:String},
      dueDate: {
        type: String,
        required: false,
      },
      startDate: { type: String },
      endDate: { type: String},
      penaltyStartDate: { type: String },
      oneTimeDateRange: { type: Object }
    },
    feesBreakUp: [
      {
        type: Number,
      },
    ],
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    status: { type: Number, default: 1 },
    __v: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
PaymentScheduleSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = PaymentScheduleSchema;
