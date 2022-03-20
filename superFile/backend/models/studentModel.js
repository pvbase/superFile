const mongoose = require("mongoose");

const StudentSchema = mongoose.Schema(
  {
    displayName: {
      //generate id
      type: String,
      required: false,
    },
    regId: {
      // Reg No *
      type: String,
      required: true,
      unique: false,
    },
    rollNumber:{
      type: String,
    },
    salutation: { type: String, required: false }, // salutation
    section: {type:String},
    category: { type: String, required: false, default:null }, // Category
    firstName: { type: String, required: true }, //First Name *
    middleName: { type: String, required: false }, //
    lastName: { type: String, required: false }, //Last Name *
    guardianDetails: [{ type: mongoose.Types.ObjectId, required: false }],
    gender: { type: String, required: false, default:null }, //Gender
    dob: {
      //DOB
      type: String,
      required: false,
    },
    citizenship: {type: String, required: false, default:null },
    currency: {type: String, required: false, default:null },
    FOREX: {type: Number, required: false, default:null },
    admittedOn: { type: String }, //Admitted Date *
    programPlanId: { type: mongoose.Types.ObjectId },
    // programPlanCode: { type: String, required:false },
    // programPlanTitle:{ type: String, required:false },
    feeStructureId: { type: mongoose.Types.ObjectId, required: false },
    phoneNo: { type: String, required: false }, //Phone Number *
    email: { type: String, required: false }, // Email Address *
    alternateEmail: { type: String, required: false },
    parentName:{ type: String, required: false },
    parentPhone: { type: String, required: false },
    parentEmail:{ type: String, required: false },
    relation:{ type: String, required: false },
    addressDetails: {
      address1: {
        //Address 1
        type: String,
        require: true,
      },
      address2: {
        //Address 2
        type: String,
      },
      address3: {
        // Address 3
        type: String,
      },
      city: {
        // City/Town
        type: String,
        require: true,
      },
      state: { type: String, required: false },
      country: { type: String, required: false }, //Country
      pincode: { type: String }, //PIN Code
    },
    isFinalYear: {type:Boolean},
    final: {type:String},
    campusId: {type:String, required:false},
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    leadId: {type:String},
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
StudentSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = StudentSchema;
