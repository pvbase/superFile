const mongoose = require("mongoose");
const taskSchema = mongoose.Schema(
  {
    taskId: { type: String, unique: true },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    data: {
      type: Object,
    },
    action: { type: String, required: false },
    status: { type: String, required: false },
    type: { type: String, required: false },
    dueDate: { type: String },
    assignedTo: { type: String },
    campusId: { type: mongoose.Types.ObjectId },
  },
  { timestamps: true }
);
//mongoose.set("useFindAndModify", false);
taskSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = taskSchema;
