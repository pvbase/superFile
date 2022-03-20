const mongoose = require("mongoose");

const BookSchema = mongoose.Schema(
  {
    displayName: { type: String, required: [true, "Display Name required"] },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    createdBy: {
      type: mongoose.Types.ObjectId,
      required: [true, "createdBy required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
BookSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = BookSchema;
