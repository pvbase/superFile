const mongoose = require('mongoose');
// const mongoDbUrl = "mongodb://a930627567e9a4668bdcbf984f221e0f-650def687177be28.elb.us-east-1.amazonaws.com:27017";
// const dbName = "reconciliation";
const mongoDbUrl = "mongodb://a91573151e7a24db1a19e8a03c7111ba-4ed7d42ccce7dad4.elb.us-east-1.amazonaws.com:30000";
const dbName = "5f9a6e2325c3670009b50a86";
const bseCollectionName = "bankStmtEntries";
const bseSchema = require("../../models/schemas/bankStatementEntries-model");

async function main() {
    var uri = mongoDbUrl + "/" + dbName; 
    mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
    // mongoose.set('useFindAndModify', false);
    const dbConnection = mongoose.connection;
    BseModel = dbConnection.model(bseCollectionName, bseSchema);
    await BseModel.deleteMany().then(function (data) {
        if (data) console.log("deleted all bank stmt entries");
        else return console.log("No transactions found");
    });

    // trial code - db connections to mongo 
    dbConnection.db.command({ serverStatus: 1 }, function (err, result) {
        console.log("connections: " + JSON.stringify(result.connections));
        dbConnection.close();
    })

    process.exit();
} // main 

main();