const bcrypt = require("bcrypt");
var mongoose = require("mongoose");
const { createDatabase } = require("../helper_jsons/db_creation");

const UserSchema = mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, required: true, trim: true },
    password: String,
    crypto_keys: String,
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtual for author's full name
// userSchema.virtual('username').get(function () {
//   return this.username;
// });

//authenticate input against database
UserSchema.statics.authenticate = async function (email, password, callback) {
  //   var User = mongoose.model("User", UserSchema);
  let dbConnection = await createDatabase("ken42", process.env.database);
  let UserModel = dbConnection.model("users", UserSchema);
  UserModel.findOne({ email: email }, function (err, user) {
    console.log("user details", user);
    if (err) {
      return callback(err);
    } else if (!user) {
      var err = new Error("User not found.");
      err.status = 401;
      return callback(err);
    }
    bcrypt.compare(password, user.password, function (err, result) {
      if (result === true) {
        return callback(null, user);
      } else {
        return callback();
      }
    });
  });
};

//hashing a password before saving it to the database
UserSchema.pre("save", function (next) {
  var user = this;
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  });
});

UserSchema.pre("update", function () {
  this.update({}, { $set: { updatedAt: new Date() } });
});

module.exports = UserSchema;
