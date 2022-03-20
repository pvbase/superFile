const mongoose = require("mongoose");

const AccountSchema = mongoose.Schema(
  {
    ID: {
      type: String,
      required: [true, "ID required"],
      unique: true,
      index: true,
    },
    NAME: { type: String, required: [true, "Name required"] },
    TYPE: { type: String, required: false },
    RECORDTYPEID: {
      type: String,
      required: [true, "Record type ID required"],
    },
    PARENTID: {
      type: String,
      required: false,
    },
    HED__SCHOOL_CODE__C: {
      type: String,
      required: false,
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
AccountSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = AccountSchema;
