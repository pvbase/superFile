const mongoose = require("mongoose");
const instituteListSchema = mongoose.Schema(
    {
        name: { type: String, required: [true, "Please provide institute name"] },
        connUri: { type: String, required: [true, "Please connection uri for the organization"] },
        nameSpace: { type: String, required: [true, "Please provide institute name"], unique: true },
        user: { type: String, required: [true, "Please provide user email or phone number"], unique: true },
        client: { type: String, required: false },
        loginClient: { type: String, required: false, default: null },
        clientId: { type: String, required: false, default: null },
        password: { type: String, required: false, default: null },
        hedaIds: [
            { type: String, required: false, default: null },
        ]
    },
    { timestamps: true }
);
//mongoose.set("useFindAndModify", false);
instituteListSchema.pre("update", function () {
    this.update({}, { $set: { updatedAt: new Date() } });
});
module.exports = instituteListSchema;