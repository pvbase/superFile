const mongoose = require("mongoose");

const ReminderSchema = mongoose.Schema(
  {
    displayName: {
      type: String,
      required: [true, "Display Name required"],
      unique: true,
    },
    title: { type: String, required: [true, "Title required"] },
    description: { type: String, required: [true, "Description required"] },
    numberOfReminders: {
      type: Number,
      required: false,
      enum: [1, 2, 3, 4, 5, 6],
    },
    demandNoteReminder: { type: Number },
    otherReminders: [{ type: Number }],
    scheduleDetails: { type: Object },
    campusId: { type: String },
    createdBy: {
      type: String,
      required: [true, "createdBy required"],
    },
    status: { type: Number, default: 1 },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
ReminderSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = ReminderSchema;
