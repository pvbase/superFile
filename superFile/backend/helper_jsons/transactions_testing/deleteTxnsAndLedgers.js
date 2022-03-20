const mongoose = require('mongoose');
const transactionsSchema = require('../../models//transactionsModel.js');
const feesLedgerSchema = require('../../models/feesLedgerModel.js');

async function main() {
    // console.log('in deleteTxns.js');
    // var uri = "mongodb://localhost:27017/zq-edu";
    var uri = "mongodb://a91573151e7a24db1a19e8a03c7111ba-4ed7d42ccce7dad4.elb.us-east-1.amazonaws.com:30000/zq-edu";
    mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });
    // mongoose.set('useFindAndModify', false);
    const dbConnection = mongoose.connection;
    TxnModel = dbConnection.model("transactions", transactionsSchema);
    await TxnModel.deleteMany().then(function (data) {
        if (data) console.log("deleted all transactions");
        else return console.log("No transactions found");
    });

    FeesLedgerModel = dbConnection.model("feesledger", feesLedgerSchema);
    await FeesLedgerModel.deleteMany().then(function (data) {
        if (data) console.log("deleted all fees ledger entries");
        else return console.log("No entries found in feesledger");
    });

    // trial code - db connections to mongo 
    dbConnection.db.command({ serverStatus: 1 }, function (err, result) {
        console.log("connections: " + JSON.stringify(result.connections));
        dbConnection.close();
    })

    process.exit();
} // main 

main();
