const {
    checkDatabaseExists,
    createDatabase,
    createConnection,
} = require("../utils/db_creation");
var ObjectID = require("bson-objectid");
const coaSchema=require("../models/coaModel");
const collections = {
    orgLists: "orglists",
    chartOfAccounts: "chartofaccounts"
}

module.exports.createDefaultChartOfAccounts = async (reqBody, connection) => {
    return new Promise(async (resolve, reject) => {
        const orgConnection = connection;
        const coaModel = orgConnection.model(collections.chartOfAccounts, coaSchema, collections.chartOfAccounts);
        const topLevelItems = reqBody.filter(item => item.accountCode && !item.accountCode.includes("."));
        const subLevelItems = reqBody.filter(item => item.accountCode && item.accountCode.includes("."));
        let topLevelStructuredItems = createMongoId(topLevelItems);
        const subLevelStructuredItems = createMongoId(subLevelItems);
        const allCoaItems = appendParentId(subLevelStructuredItems, [...topLevelStructuredItems, ...subLevelStructuredItems]);
        topLevelStructuredItems = topLevelStructuredItems.map(item => ({ ...item, version: 1 }))
        const totalCoa = [...topLevelStructuredItems, ...allCoaItems];
        let coaWithChildren = [];
        totalCoa.forEach((item, i, array) => {
            let childrenItems = array.filter(element => element.parentId === item._id).map(item => item._id);
            let value = { ...item };
            value.children = childrenItems;
            coaWithChildren.push(value)
        })
        coaModel.insertMany(coaWithChildren).then(coaData => {
            resolve(coaData)
        }).catch((err) => {
            console.log(err)
            if (err.code && err.code == 11000) {
                reject({
                    status: "failure",
                    message: "chart of account item already exists"
                });
                return;
            }
            reject({
                status: "failure",
                message: err.message ? err.message : "",
                data: err,
            });
        });



    })
}

function createMongoId(data) {
    return data.map(item => ({ ...item, _id: ObjectID() }))
}

function appendParentId(data, structuredList) {
    let arrayList = [];
    data.forEach(item => {
        let parentCode = item.accountCode.split(".");
        parentCode.pop();
        parentCode = parentCode.join(".");
        let parentItem = structuredList.find(item => item.accountCode == parentCode);
        let coaItem = { ...item, parentId: parentItem._id, version: 1 };
        arrayList.push(coaItem);
    })
    return arrayList;
}