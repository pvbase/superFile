const entityModel = require("../models/entityModel");
const { createDatabase } = require("../utils/db_creation");
const mongoose = require("mongoose");
const { createDefaultChartOfAccounts } = require("./coaInitialize");
const coaSchema = require("../models/coaModel");
const entityCoaMappingModel = require("../models/entityCoaMappingModel");
const defaultCoa = require("../helper_jsons/transactions_testing/default-coa.json");
const entityCollectionName = "entities"

module.exports.createEntity = async (req, res) => {
    const { resource, orgId } = req.headers;
    const dbConnection = await createDatabase(orgId, resource);
    const entitySchema = dbConnection.model(entityCollectionName, entityModel, entityCollectionName);
    let coaData = defaultCoa.map(item => ({ ...item, orgId }))
    // const addChartOfAccounts = await createDefaultChartOfAccounts(coaData, dbConnection)
    let coaModel = dbConnection.model("chartofaccounts", coaSchema, "chartofaccounts");
    let allCoa = await coaModel.find({});
    const entityData = new entitySchema(req.body);
    entityData.save().then(async data => {
        const entityCoaMapper = allCoa.map(item => ({ isEnabled: true, openingBalance: 0.00, entityId: data._id, createdBy: orgId, updateBy: null, coaCode: item.accountCode, parentCode: getParentCode(item) }));
        const entityMappingModel = dbConnection.model("entitycoamappings", entityCoaMappingModel, "entitycoamappings");
        const entityCoaMappingData = await entityMappingModel.insertMany(entityCoaMapper);
        res.status(200).send({
            status: 'success',
            message: 'Entity Added Successfully',
            data
        })
    }).catch(err => {
        console.log(err)
        res.status(400).send({
            status: 'failure',
            message: 'failed to add entity',
            data: err
        })
    })
}

const getParentCode = item => {
    let parentExists = item.accountCode.indexOf(".");
    if (parentExists == -1) { item.parentCode = null }
    else {
        let parentItem = item.accountCode.split(".");
        parentItem.pop();
        parentItem = parentItem.join(".");
        item.parentCode = parentItem
    }
    return item.parentCode

}
