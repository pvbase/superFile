/**
 * @author rahul.jain@zenqore.com 
 */

const mongoDB = require('mongodb');
const mongoose = require("mongoose");
const dbName = process.env.dbName;
//const dbName = "zq-edu";
const collectionName = "feesledger";
const schema = require("../../models/feesLedgerModel");

const {
    checkDatabaseExists,
    createDatabase,
    createConnection,
} = require("../../utils/db_creation");

async function count(req, res) {
    const dbConnection = await createConnection(dbName, process.env.central_mongoDbUrl);
    let model = dbConnection.model(collectionName, schema);
    model.countDocuments(params(req))
        .then(function (data) {
            if (data) return res.json(data);
            else return res.json(0);
        })
        .finally(() => {
            dbConnection.close();
        })
} // count 

// Needed for query params in httpRequest  
var params = function (req) {
    let q = req.url.split('?'), result = {};
    if (q.length >= 2) {
        q[1].split('&').forEach((item) => {
            try {
                result[item.split('=')[0]] = item.split('=')[1];
            } catch (e) {
                result[item.split('=')[0]] = '';
            }
        })
    }
    return result;
} // params 


async function listAll(req, res) {
    const dbConnection = await createConnection(dbName, process.env.central_mongoDbUrl);
    let model = dbConnection.model(collectionName, schema);

    try {
        let data = await model.find(params(req));
        if (data) return res.json(data);
        else return res.json({ message: "feesLedgerController: Nothing found" });
    } catch (err) {
        return res.json({ status: "failure", message: "feesLedgerController: " + err.message });
    }
    finally {
        dbConnection.close();
    }
} // listAll 

async function listOne(req, res) {
    var id = req.url.toString().substring(12);
    console.log("id: " + id);
    const dbConnection = await createConnection(dbName, process.env.central_mongoDbUrl);
    let model = dbConnection.model(collectionName, schema);
    try {
        var o_id = new mongoDB.ObjectID(id);
        var params = {
            _id: o_id,
        };
        let data = await model.findOne(params);
        if (data) return res.json(data);
        else return res.json({ message: "Fees Ledger entry by o_id not found: " + id });
    } catch (err) {
        return res.json({ status: "failure", message: "feesLedgerController: " + err.message });
    }
    finally {
        dbConnection.close();
    }
} // listOne 

module.exports = {
    // insertIntoGenLedger: insert,
    listAllFeesLedger: listAll,
    listOneFeesLedger: listOne,
    countFeesLedger: count,
};
