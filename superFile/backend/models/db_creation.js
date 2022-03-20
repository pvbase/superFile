let mongoose = require("mongoose");
let Admin = mongoose.mongo.Admin;
mongoose.promise = global.Promise;

exports.checkDatabaseExists = async function (dbName, url) {
  // dbName = dbName.toLowerCase().replace(/\s/g, '-');
  const connection = await mongoose.createConnection(`${url}`, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
  });
  let result = await new Admin(connection.db).listDatabases();
  dbList =
    result.databases && result.databases.map((item) => item.name.toLowerCase());
  // console.log("dblist", dbList)
  if (dbList.indexOf(dbName.toLowerCase()) == -1) {
    // console.log("chk db b4 cls state", connection.readyState)
    await connection.close();
    // console.log("chk db after cls state", connection.readyState)
    return false;
  } else {
    console.log("chk db b4 cls state", connection.readyState);
    await connection.close();
    console.log("chk db after cls state", connection.readyState);
    return true;
  }
};

exports.createDatabase = async function (dbName, url) {
  // dbName = dbName.toLowerCase().replace(/\s/g, '-');
  try {
    const connection = await mongoose
      .createConnection(`${url}/${dbName}`, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
      })
    return connection
  } catch (e) {
    return e
  }
};
exports.createConnection = async function (dbName, url) {
  try {
    const connection = await mongoose
      .createConnection(`${url}/${dbName}`, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
      })
    return connection
  } catch (e) {
    return e
  }
};

exports.createInstance = function (dbName, url) {
  mongoose.connection.on("connected", function () {
    console.log("Mongoose default connection is open to ", url);
  });
  mongoose.connection.on("error", function (err) {
    console.log("Mongoose default connection has occured " + err + " error");
  });

  mongoose.connection.on("disconnected", function () {
    console.log("Mongoose default connection is disconnected");
  });

  process.on("SIGINT", function () {
    mongoose.connection.close(function () {
      console.log(
        "Mongoose default connection is disconnected due to application termination"
      );
      process.exit(0);
    });
  });

  return mongoose.connect(
    `${url}/${dbName}`,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    },
    function (err, db) {
      if (err) {
        console.log("Unable to connect to the mongoDB server. Error:", err);
      } else {
        console.log("Connection established to", url);
        return db;
      }
    }
  );
};

