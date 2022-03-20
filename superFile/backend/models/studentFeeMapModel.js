const mongoose = require("mongoose");
const StudentFeeMapSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
    },
    studentId: {
      type: mongoose.Types.ObjectId,
      trim: true,
    },
    USN:{
      type: String,
    },
    programPlanId: {
      type: mongoose.Types.ObjectId,
      trim: true,
    },
    feeStructureId: {
      type: mongoose.Types.ObjectId,
      trim: true,
    },
    feeManagerId: [{
      type: mongoose.Types.ObjectId,
    }],
    dueDate: { type: Date },
    paymentSchdule:{type:Array},
    reminderPlan:{
      type:Array
    },
    amount: { 
      type: Number,
    },
    concession: {
      type: Number, },
    fine: { 
      type: Number,
     },
    paid: {  
      type: Number,
     },
    pending: { type: Number },
    receivedDate: { type: String },
    receiptNumbers: { type: String },
    transactionPlan: {
      feesBreakUp: [
        {
          amount: {
            type: Number,
          },
          paid: {
            type: Number,
          },
          pending: {
            type: Number,
          },
          feeTypeCode: {
            type: String,
            trim: true,
          },
          title: {
            type: String,
          },
        },
      ],
      totalAmount: {
        type: Number,
      },
      paidAmount: { type: Array },
      totalPaid: {
        type: Number,
      },
      totalPending: {
        type: Number,
      },
    },
    campusId: {type:String},
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    status: { type: String },
  },
  { timestamps: true }
);
//mongoose.set("useFindAndModify", false);
StudentFeeMapSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = StudentFeeMapSchema;
