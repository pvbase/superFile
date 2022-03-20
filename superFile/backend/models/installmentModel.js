const mongoose = require("mongoose");

const InstallmentSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    numberOfInstallments: {
      type: Number,
      required: false,
      enum: [1, 2, 3, 4, 5],
    },
    dueDate: { type: Number },
    frequency: { type: String, required: true },
    monthOption:{type:String},
    percentageBreakup: [{ type: Number }],
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    updatedBy: {
      type: String,
      required: [true, "updatedBy required"],
    },
    feesBreakUp: { type: Array },
    campusId:{type:String},
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
InstallmentSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = InstallmentSchema;
