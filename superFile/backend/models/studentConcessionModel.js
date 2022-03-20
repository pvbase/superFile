const mongoose = require("mongoose");

const studentConcessionSchema = mongoose.Schema(
  {
    studentRegId: { type: String, required: true },
    studentName: {type: String},
    academicYear: {type:String},
    class: {type:String},
    description: { type: String, required: [true, "Description required"] },
    categoryId: { type: String },
    concessionType: { type: String },
    concessionId: { type: mongoose.Types.ObjectId},
    concessionValueType: { type: String,enum: ["%", "value"], required: [true]},
    campusId:{type:String},
    concessionValue: { type: Number, required: [true] },
    concessionAmount: { type: Number, required: [true] },
    status: { type: String },
    createdBy: { type: String },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
studentConcessionSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = studentConcessionSchema;
