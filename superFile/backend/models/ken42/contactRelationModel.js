const mongoose = require("mongoose");

const ContactRelationSchema = mongoose.Schema(
  {
    ID: {
      type: String,
      required: [true, "ID required"],
      unique: true,
      index: true,
    },
    HED__CONTACT__C: {
      type: String,
      required: [true, "HED__CONTACT__C required"],
    },
    HED__RELATEDCONTACT__C: {
      type: String,
      required: [true, "HED__RELATEDCONTACT__C required"],
    },
    HED__TYPE__C: {
      type: String,
      required: [true, "HED__TYPE__C required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
ContactRelationSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = ContactRelationSchema;
