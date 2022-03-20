const mongoose = require("mongoose");
const webhookSchema = new mongoose.Schema(
  {
    data: { type: JSON },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
webhookSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = webhookSchema;
