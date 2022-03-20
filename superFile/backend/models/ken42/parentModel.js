const mongoose = require("mongoose");

const ParentSchema = mongoose.Schema(
  {
    firstName: { type: String, required: [true, "First Name required"] },
    middleName: { type: String, required: [true, "Middle Name required"] },
    lastName: { type: String, required: [true, "Last Name required"] },
    phoneNo: { type: Number, required: [true, "Phone number required"] },
    email: { type: String, required: [true, "Email address required"] },
    childRefIds: [
      {
        type: mongoose.Types.ObjectId,
        required: [true, "Child Id required"],
      },
    ],
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
ParentSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = ParentSchema;
