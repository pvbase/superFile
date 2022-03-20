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
    const connectionDb = await mongoose.createConnection(`${url}/${dbName}`, {
      useNewUrlParser: true,
      // useCreateIndex: true,
      useUnifiedTopology: true,
    });
    return connectionDb;
  } catch (e) {
    return e;
  }
};

// exports.createConnection = function (dbName, url) {
//   // dbName = dbName.toLowerCase().replace(/\s/g, '-');
//   return mongoose
//     .createConnection(`${url}/${dbName}`, {
//       useNewUrlParser: true,
//       useCreateIndex: true,
//       useUnifiedTopology: true,
//     })
//     .then((data) => {
//       // console.log(data)
//       return data;
//     });
// };

// exports.createConnection = function (dbName, url) {
//   // dbName = dbName.toLowerCase().replace(/\s/g, '-');
//   mongoose.connection.on("connected", function () {
//     console.log("Mongoose default connection is open to ", url);
//   });
//   mongoose.connection.on("error", function (err) {
//     console.log("Mongoose default connection has occured " + err + " error");
//   });

//   mongoose.connection.on("disconnected", function () {
//     console.log("Mongoose default connection is disconnected");
//   });

//   process.on("SIGINT", function () {
//     mongoose.connection.close(function () {
//       console.log(
//         "Mongoose default connection is disconnected due to application termination"
//       );
//       process.exit(0);
//     });
//   });
//   return mongoose
//     .createConnection(`${url}/${dbName}`, {
//       useNewUrlParser: true,
//       useCreateIndex: true,
//       useUnifiedTopology: true,
//     })
//     .then((data) => {
//       // console.log(data)
//       return data;
//     });
// };

exports.createConnection = async function (dbName, url) {
  try {
    const connection = await mongoose.createConnection(`${url}/${dbName}`, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });
    return connection;
  } catch (e) {
    return e;
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
        //Close connection
        //db.close();
        return db;
      }
    }
  );
};

// exports.createInstance = async function (req, res) {
//   let dbName = req.body.dbName;
//   let url = req.body.url;
//   console.log("entered");
//   var params = {
//     Bucket: "zqconnection",
//     Key: "zqConnection.json",
//   };
//   s3.getObject(params, function (err, data) {
//     console.log("entered s3");
//     if (err) {
//       console.log(err);
//     } else if (data) {
//       let objectData = data.Body.toString("utf-8");
//       let oldData = JSON.parse(objectData);
//       const found = oldData.some(
//         (el) => el.dbName === dbName && el.url === url
//       );
//       if (!found) {
//         oldData.push({ dbName: dbName, url: url });
//       }
//       console.log("new Data", oldData);
//       let newOne = JSON.stringify(oldData);
//       fs.writeFileSync("zqConnection.json", newOne);
//       s3.putObject(
//         {
//           Bucket: "zqconnection",
//           Key: "zqConnection.json",
//           Body: newOne,
//           ACL: "bucket-owner-full-control",
//         },
//         function (err, final) {
//           if (err) {
//             console.log(err);
//           }
//           res.send({ data: oldData });
//         }
//       );
//     }
//   });

//   //   let rawdata = fs.readFileSync("zqConnection.json");
//   //   let oldData = JSON.parse(rawdata);
//   //   console.log(typeof oldData);

//   //   const found = oldData.some((el) => el.dbName === dbName && el.url === url);
//   //   if (!found) {
//   //     oldData.push({ dbName: dbName, url: url });
//   //   }

//   //   console.log(oldData);

//   //   let data = JSON.stringify(newConnections);
//   //   fs.writeFileSync("zqConnection.json", data);
// };
