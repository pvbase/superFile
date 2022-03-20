const mongoose = require("mongoose");

const StudentSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: false,
    },
    regId: {
      type: String,
      required: false,
      unique: true,
    },
    salutation: { type: String, required: false },
    firstName: { type: String, required: false },
    middleName: { type: String, required: false },
    lastName: { type: String, required: false },
    parentName:{ type: String, required: false },
    parentPhone: { type: String, required: false },
    parentEmail:{ type: String, required: false },
    relation:{ type: String, required: false },
    guardianDetails: [
      {
        isPrimary: {
          type: Boolean,
        },
        firstName: {
          type: String,
          required: false,
        },
        lastName: {
          type: String,
          required: false,
        },
        mobile: {
          type: String,
          required: false,
        },
        email: {
          type: String,
          required: false,
        },
        relation: {
          type: String,
          required: false,
        },
      },
    ],
    gender: { type: String, required: false },
    dob: {
      type: Date,
      required: false,
    },
    admittedOn: { type: Date, required: false },
    classOrBatch: { type: String, required: false },
    programPlan: { type: String, required: false },
    phoneNo: { type: String, required: false },
    email: { type: String, required: false },
    alternateEmail: { type: String, required: false },
    addressDetails: {
      address1: {
        type: String,
      },
      address2: {
        type: String,
      },
      address3: {
        type: String,
      },
      city: {
        type: String,
      },
      state: { type: String, required: false },
      country: { type: String, required: false },
      pincode: { type: String },
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
StudentSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = StudentSchema;
