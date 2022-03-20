const mongoose = require("mongoose");

const ReportSchema = mongoose.Schema(
  {
    demandNoteReport: {
      type: Array,
    },
    feeCollectionReport: {
      type: Array,
    },
    studentStatementReport: {
      type: Array,
    },
    programplanReport: {
      type: Array,
    },
    feePendingReport: {
      type: Array,
    },
    refundReport: {
      type: Array,
    },
  },
  { timestamps: true }
);

//mongoose.set("useFindAndModify", false);
ReportSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = ReportSchema;
