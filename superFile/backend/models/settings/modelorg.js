const mongoose = require("mongoose");
const orgSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
    },
    connUri: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
  { _id: false }
);
//mongoose.set("useFindAndModify", false);

module.exports = orgSchema;
