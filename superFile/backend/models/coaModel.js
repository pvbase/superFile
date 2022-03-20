const mongoose = require("mongoose");
const coaSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Types.ObjectId,
      required: true,
      set: function (value) {
        return mongoose.Types.ObjectId(value)
      }
    },
    orgId: {
      type: mongoose.Types.ObjectId,
      required: true,
      set: function (value) {
        return mongoose.Types.ObjectId(value);
      },
    },
    name: {
      type: String,
      required: true
    },
    parentId: {
      type: mongoose.Types.ObjectId,
      required: false
    },
    accountCode: {
      type: String,
      required: "{PATH} is required!",
      unique: true
    },
    isDefault: {
      type: Boolean,
    },
    isEditable: {
      type: Boolean,
    },
    version: {
      type: Number,
      required: true
    },
    children: {
      type: Array, default: []
    },
    parentCode: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);

module.exports = coaSchema;
