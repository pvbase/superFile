const feeCollectionSchema = require("../../models/feeCollectionModel");
const generalLedgerSchema = require("../../models/generalLedgerModel");
const demandNoteSchema = require("../../models/demandNoteModel");
const studentSchema = require("../../models/studentModel");
const { createDatabase } = require("../../utils/db_creation");
const mongoose = require("mongoose");
var nodemailer = require("nodemailer");
const transactionsCollections = "transactions";



async function receiveFeesAmount(reqBody, dbConnection, paymentDetails) {
    try {
        const { relatedTransactions, entityId, amount } = reqBody;
        const demandNoteModel = dbConnection.model(transactionsCollections, demandNoteSchema, transactionsCollections)
        const feesCollectionModel = dbConnection.model(transactionsCollections, feeCollectionSchema, transactionsCollections);
        const demandNoteQuery = { displayName: { $in: relatedTransactions } };
        let relatedDemandNotes = [];
        await demandNoteModel.find(demandNoteQuery).then(demandNoteData => {
            relatedDemandNotes = demandNoteData;
        }).catch(err => {
            throw err
        })
        relatedDemandNotes = relatedDemandNotes[0];
        let pendingAmount, status;
        if (relatedDemandNotes.amount === amount) {
            pendingAmount = 0;
            status = "initiated";
        } else {
            pendingAmount = pendingAmount - amount;
            status = "partial";
        }
        for (let demandNote of relatedDemandNotes) {
            console.log(demandNote.displayName)
        }
        await feesCollectionModel.findOneAndUpdate({ displayName: relatedDemandNotes.displayName }, { $set: { pendingAmount, status }, $push: { relatedTransactions: reqBody.displayName } }, { new: true })
        const feesCollectionData = new feesCollectionModel(reqBody);
        await feesCollectionData.save()
        return relatedDemandNotes
    } catch (e) {
        throw e
    }
}

module.exports = {
    receiveFeesAmount
}


function getProportionValue(amount, total, payingAmount) {
    let proportionValue = ((amount / total) * payingAmount);
    return Math.round((proportionValue + Number.EPSILON) * 100) / 100;
}