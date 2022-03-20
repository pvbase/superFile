const sgMail = require("@sendgrid/mail");
var mongoose = require("mongoose");
var orgSchema = require('../models/settings/modelorg');
var feeplaninstallment = require('../models/feeplanInstallment');
var feeplan = require('../models/feeplanModel');
const { confirmSoftwareReconciliation } = require("./reconciliation/rconciliationController");
exports.feeplancreate = async (req, res) => {
    var body = req.body
    const Mongouri = `${process.env.MongoUrl}/${process.env.database}`
    console.log(Mongouri)
    mongoose.createConnection(`${Mongouri}`, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(value => {
        const createModels = value.model("orglists", orgSchema, "orglists")
        createModels.findById(body['organizationId']).then((data) => {

            console.log(`${data.connUri}/${body['organizationId']}`)
            const connection = mongoose.createConnection(`${data.connUri}/${body['organizationId']}`, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
            const createfeePlan = connection.model("studentfeeplan", feeplan, 'studentfeeplan')
            const createfeeInstallment = connection.model("studentfeeinstallment", feeplaninstallment, 'studentfeeinstallment')
            var feeplancreate = new createfeePlan(req.body.paymentDetails)
            // var installment = new createfeeInstallment(req.body.installmentDetails)

            console.log(req.body.paymentDetails.applicationId)

            req.body.installmentDetails.map(a => {
                a.feePlanId = String(req.body.paymentDetails.applicationId)
            })
            feeplancreate.save(function (err, stordata) {
                if (err) { console.log(err); res.status(400); res.send({ message: "App id already exist" }) }
                else {
                    console.log(stordata._id)
                    req.body.installmentDetails.map(a => {
                        a.feePlanId = stordata._id
                    })
                    console.log(req.body.installmentDetails)
                    createfeeInstallment.insertMany(req.body.installmentDetails, function (err) {
                        if (err) { console.log(err) }
                        console.log("saved data")
                        res.status(201)
                        res.send({
                            message: "student fee plan added successfully"
                        })
                    })
                }
            })


        })
    })
}




exports.feeplanupdate = async (req, res) => {
    var body = req.body
    const Mongouri = `${process.env.MongoUrl}/${process.env.database}`
    console.log(Mongouri)
    mongoose.createConnection(`${Mongouri}`, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(value => {
        const createModels = value.model("orglists", orgSchema, "orglists")
        createModels.findById(body['organizationId']).then((data) => {

            console.log(`${data.connUri}/${body['organizationId']}`)
            const connection = mongoose.createConnection(`${data.connUri}/${body['organizationId']}`, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
            const createfeePlan = connection.model("studentfeeplan", feeplan, 'studentfeeplan')
            const createfeeInstallment = connection.model("studentfeeinstallment", feeplaninstallment, 'studentfeeinstallment')
            var feeplancreate = new createfeePlan(req.body.paymentDetails)

            console.log(req.body.paymentDetails.applicationId)

            req.body.installmentDetails.map(a => {
                a.feePlanId = req.body.paymentDetails.applicationId
            })

            createfeePlan.findOneAndReplace({ applicationId: req.body.paymentDetails.applicationId }, req.body.paymentDetails, null, function (err, data) {
                if (err) {
                    console.log('replace err,,,,', err)
                }
                else {
                    createfeeInstallment.deleteMany({ feePlanId: mongoose.Types.ObjectId(req.query.feeplanId) }, function (err, data) {
                        if (err) { console.log('deletemany err......', err) }
                        else {
                            req.body.installmentDetails.map(a => {
                                a.feePlanId = req.query.feeplanId
                            })
                            createfeeInstallment.insertMany(req.body.installmentDetails, function (err) {
                                if (err) { console.log('insert many err....', err) }
                                console.log("updated data")
                                res.status(200)
                                res.send({
                                    message: "student fee plan updated successfully"
                                })
                            })
                        }
                    })
                }
            })
        })
    })
}


exports.feeplanget = async (req, res) => {
    var body = req.body
    const Mongouri = `${process.env.MongoUrl}/${process.env.database}`
    console.log(Mongouri)
    mongoose.createConnection(`${Mongouri}`, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }).then(value => {
        const createModels = value.model("orglists", orgSchema, "orglists")
        createModels.findById(req.query.orgId).then((data) => {

            console.log(`${data.connUri}/${req.query.orgId}`)
            const connection = mongoose.createConnection(`${data.connUri}/${req.query.orgId}`, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
            const createfeePlan = connection.model("studentfeeplan", feeplan, 'studentfeeplan')
            const createfeeInstallment = connection.model("studentfeeinstallment", feeplaninstallment, 'studentfeeinstallment')
            var feeplancreate = new createfeePlan(req.body.paymentDetails)

            // console.log(req.body.paymentDetails.applicationId)

            console.log(req.query.appId)
            createfeePlan.find({ applicationId: req.query.appId }, function (err, data) {
                if (err) {
                    console.log(err)
                }
                else {
                    createfeeInstallment.find({ feePlanId: mongoose.Types.ObjectId(req.query.feeplanId) }, function (err, installment) {
                        var installments = [{ installments: installment }]
                        var finaldata = [...data, ...installments]
                        res.send(finaldata)
                    })


                }
            })
        })
    })
}