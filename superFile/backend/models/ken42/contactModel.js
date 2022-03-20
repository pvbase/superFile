const mongoose = require("mongoose");

const ContactSchema = mongoose.Schema(
  {
    ID: {
      type: String,
      required: [true, "ID required"],
      unique: true,
      index: true,
    },
    ACCOUNTID: { type: String, required: [true, "ACCOUNTID required"] },
    LASTNAME: {
      type: String,
      required: [true, "LASTNAME required"],
    },
    FIRSTNAME: {
      type: String,
      required: [true, "FIRSTNAME required"],
    },
    SALUTATION: {
      type: String,
      required: false,
    },
    NAME: {
      type: String,
      required: [true, "NAME required"],
    },
    PHONE: {
      type: String,
      required: [true, "PHONE required"],
    },
    EMAIL: {
      type: String,
      required: [true, "EMAIL required"],
    },
    BIRTHDATE: {
      type: String,
      required: false,
    },
    HED__ALTERNATEEMAIL__C: {
      type: String,
      required: [true, "HED__ALTERNATEEMAIL__C required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
ContactSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = ContactSchema;
