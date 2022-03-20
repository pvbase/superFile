const transactionsSchema = require('../models/transactionsModel')
const feesLedgerSchema = require('../models/feesLedgerModel')
const StudentSchema = require('../models/studentModel')
const GuardianSchema = require('../models/guardianModel')
const StudentFeeMapSchema = require('../models/studentFeeMapModel')
const { createDatabase } = require('../utils/db_creation')
const orgListSchema = require('../models/orglists-schema')
const feeplanschema = require('../models/feeplanModel')
const RazorpaySchema = require('../models/ken42/paymentModel')
const feeInstallmentSchema = require('../models/feeplanInstallment')
const campusSchema = require('../models/campusModel')
const mongoose = require('mongoose')
const rq = require('request-promise');
const moment = require('moment')

exports.updateInstallment = async function (req, res) {
  let dbConnection = await createDatabase(
    '5fa8daece3eb1f18d4250e98',
    process.env.central_mongoDbUrl,
  )
  let installFeePlanModel = dbConnection.model(
    'studentfeeinstallmentplans',
    feeInstallmentSchema,
  )
  const installmentData = await installFeePlanModel.find({
    label: 'Installment003',
    feePlanId: {
      $in: [
        '606550695fd59b0cf8bf6002',
        '6065506a5fd59b0cf8bf6006',
        '6065506b5fd59b0cf8bf6012',
        '6065506c5fd59b0cf8bf601a',
        '6065506c5fd59b0cf8bf601e',
        '6065506e5fd59b0cf8bf6036',
        '606550705fd59b0cf8bf6052',
        '606550715fd59b0cf8bf605a',
        '606550715fd59b0cf8bf605e',
        '606550735fd59b0cf8bf6076',
        '606550795fd59b0cf8bf60c2',
        '6065507c5fd59b0cf8bf60ee',
        '6065507e5fd59b0cf8bf6102',
        '6065507f5fd59b0cf8bf6112',
        '606550805fd59b0cf8bf611a',
        '606550815fd59b0cf8bf6122',
        '606550815fd59b0cf8bf6126',
        '606550835fd59b0cf8bf613a',
        '6065508d5fd59b0cf8bf6182',
        '606550915fd59b0cf8bf61aa',
        '606550925fd59b0cf8bf61b2',
        '606550935fd59b0cf8bf61c6',
        '606550945fd59b0cf8bf61ca',
        '606550945fd59b0cf8bf61ce',
        '606550955fd59b0cf8bf61d6',
        '606550965fd59b0cf8bf61da',
        '6065509c5fd59b0cf8bf6212',
        '6065509d5fd59b0cf8bf621e',
        '6065509d5fd59b0cf8bf6222',
        '6065509e5fd59b0cf8bf622e',
        '606550a05fd59b0cf8bf623e',
        '606550a05fd59b0cf8bf6242',
        '606550a45fd59b0cf8bf626a',
        '606550a45fd59b0cf8bf6272',
        '606550a55fd59b0cf8bf627a',
        '606550a65fd59b0cf8bf627e',
        '606550a65fd59b0cf8bf6282',
        '606550a85fd59b0cf8bf6292',
        '606550a95fd59b0cf8bf62a2',
        '606550ab5fd59b0cf8bf62b2',
        '606550b95fd59b0cf8bf6352',
        '606550b95fd59b0cf8bf6356',
        '606550ba5fd59b0cf8bf635e',
        '606550be5fd59b0cf8bf6386',
        '606550be5fd59b0cf8bf638a',
        '606550bf5fd59b0cf8bf6392',
        '606550c15fd59b0cf8bf63aa',
        '606550c25fd59b0cf8bf63b2',
        '606550ca5fd59b0cf8bf6412',
        '606550cc5fd59b0cf8bf6426',
        '60654eae5fd59b0cf8bf4fee',
        '60654eae5fd59b0cf8bf4ff2',
        '60654f185fd59b0cf8bf5342',
        '60654f195fd59b0cf8bf534a',
        '60654f1a5fd59b0cf8bf5352',
        '60654f1a5fd59b0cf8bf5356',
        '60654f1d5fd59b0cf8bf536e',
        '60654f375fd59b0cf8bf5462',
        '60654f395fd59b0cf8bf5472',
        '60654f3a5fd59b0cf8bf5486',
        '60654f3d5fd59b0cf8bf54a2',
        '60654f3d5fd59b0cf8bf54a6',
        '60654f3e5fd59b0cf8bf54aa',
        '60654f3e5fd59b0cf8bf54ae',
        '60654f3e5fd59b0cf8bf54b2',
        '60654f405fd59b0cf8bf54ba',
        '60654f435fd59b0cf8bf54d6',
        '60654f445fd59b0cf8bf54e2',
        '60654f465fd59b0cf8bf54ee',
        '60654f465fd59b0cf8bf54f6',
        '60654f475fd59b0cf8bf5502',
        '60654f485fd59b0cf8bf550a',
        '60654f485fd59b0cf8bf550e',
        '60654f4d5fd59b0cf8bf553a',
        '60654f4d5fd59b0cf8bf5542',
        '60654f505fd59b0cf8bf555e',
        '60654f505fd59b0cf8bf5562',
        '60654f515fd59b0cf8bf556a',
        '60654f535fd59b0cf8bf557e',
        '60654f565fd59b0cf8bf55a2',
        '60654f595fd59b0cf8bf55c2',
        '60654f5c5fd59b0cf8bf55e2',
        '60654f5d5fd59b0cf8bf55ea',
        '60654f5d5fd59b0cf8bf55ee',
        '60654f5f5fd59b0cf8bf5606',
        '60654f605fd59b0cf8bf560e',
        '60654f625fd59b0cf8bf561e',
        '60654f625fd59b0cf8bf5626',
        '60654f765fd59b0cf8bf56fa',
        '60654f775fd59b0cf8bf56fe',
        '60654f795fd59b0cf8bf571a',
        '60654f7a5fd59b0cf8bf5722',
        '60654f7d5fd59b0cf8bf573e',
        '60654f7e5fd59b0cf8bf574e',
        '60654f7f5fd59b0cf8bf575a',
        '60654f805fd59b0cf8bf5762',
        '60654f815fd59b0cf8bf576e',
        '60654f815fd59b0cf8bf5772',
        '60654f885fd59b0cf8bf57be',
        '60654f895fd59b0cf8bf57c6',
        '60654f895fd59b0cf8bf57ca',
        '60654f8a5fd59b0cf8bf57ce',
        '60654f8c5fd59b0cf8bf57e2',
        '60654f8c5fd59b0cf8bf57ea',
        '60654f8d5fd59b0cf8bf57f2',
        '60654f8d5fd59b0cf8bf57f6',
        '60654f8e5fd59b0cf8bf57fe',
        '60654f915fd59b0cf8bf581e',
        '60654f925fd59b0cf8bf5822',
        '60654f925fd59b0cf8bf582a',
        '60654f955fd59b0cf8bf5842',
        '60654f955fd59b0cf8bf5846',
        '60654f955fd59b0cf8bf584a',
        '60654f965fd59b0cf8bf584e',
        '60654f965fd59b0cf8bf5852',
        '60654f965fd59b0cf8bf5856',
        '60654f975fd59b0cf8bf585a',
        '60654f975fd59b0cf8bf5862',
        '60654f995fd59b0cf8bf5872',
        '60654f995fd59b0cf8bf5876',
        '60654f9a5fd59b0cf8bf5886',
        '60654f9b5fd59b0cf8bf588a',
        '60654f9b5fd59b0cf8bf5892',
        '60654f9c5fd59b0cf8bf5896',
        '60654f9c5fd59b0cf8bf589a',
        '60654f9d5fd59b0cf8bf58a6',
        '60654f9e5fd59b0cf8bf58ae',
        '60654f9e5fd59b0cf8bf58b2',
        '60654fa15fd59b0cf8bf58ca',
        '60654fa15fd59b0cf8bf58ce',
        '60654fa25fd59b0cf8bf58de',
        '60654fa55fd59b0cf8bf58fa',
        '60654fa65fd59b0cf8bf590a',
        '60654fa75fd59b0cf8bf5912',
        '60654fa95fd59b0cf8bf5926',
        '60654fb05fd59b0cf8bf596e',
        '60654fb15fd59b0cf8bf5972',
        '60654fb35fd59b0cf8bf598a',
        '60654fb65fd59b0cf8bf59a2',
        '60654fb95fd59b0cf8bf59be',
        '60654fba5fd59b0cf8bf59c6',
        '60654fc45fd59b0cf8bf5a0e',
        '60654fc55fd59b0cf8bf5a1a',
        '60654fce5fd59b0cf8bf5a42',
        '60654fd05fd59b0cf8bf5a4e',
        '60654fdb5fd59b0cf8bf5a7a',
        '60654fdc5fd59b0cf8bf5a86',
        '60654fdd5fd59b0cf8bf5a8e',
        '60654fe05fd59b0cf8bf5aae',
        '60654fe25fd59b0cf8bf5ac6',
        '60654fe35fd59b0cf8bf5ace',
        '60654fe35fd59b0cf8bf5ad2',
        '60654fe55fd59b0cf8bf5ae2',
        '60654fe65fd59b0cf8bf5aea',
        '60654fe75fd59b0cf8bf5af2',
        '60654fe85fd59b0cf8bf5af6',
        '60654fe85fd59b0cf8bf5afa',
        '60654fe95fd59b0cf8bf5b02',
        '60654feb5fd59b0cf8bf5b1e',
        '60654fec5fd59b0cf8bf5b26',
        '60654ff05fd59b0cf8bf5b4e',
        '60654ff15fd59b0cf8bf5b5a',
        '60654ff35fd59b0cf8bf5b72',
        '60654ff35fd59b0cf8bf5b76',
        '60654ff45fd59b0cf8bf5b7e',
        '60654ff65fd59b0cf8bf5b96',
        '60654ff85fd59b0cf8bf5baa',
        '60654ff95fd59b0cf8bf5bae',
        '60654ffc5fd59b0cf8bf5bd2',
        '60654ffd5fd59b0cf8bf5bde',
        '60654ffe5fd59b0cf8bf5bea',
        '606550005fd59b0cf8bf5bf6',
        '606550035fd59b0cf8bf5c12',
        '606550035fd59b0cf8bf5c16',
        '606550045fd59b0cf8bf5c1e',
        '606550065fd59b0cf8bf5c2e',
        '606550075fd59b0cf8bf5c3a',
        '606550075fd59b0cf8bf5c3e',
        '606550085fd59b0cf8bf5c46',
        '606550095fd59b0cf8bf5c52',
        '6065500a5fd59b0cf8bf5c5a',
        '606550145fd59b0cf8bf5cc2',
        '606550155fd59b0cf8bf5cca',
        '606550155fd59b0cf8bf5cd2',
        '606550175fd59b0cf8bf5ce2',
        '6065501e5fd59b0cf8bf5d2e',
        '606550215fd59b0cf8bf5d52',
        '606550235fd59b0cf8bf5d66',
        '606550265fd59b0cf8bf5d82',
        '606550265fd59b0cf8bf5d8a',
        '6065502b5fd59b0cf8bf5db6',
        '606550335fd59b0cf8bf5e0a',
        '606550355fd59b0cf8bf5e26',
        '6065503d5fd59b0cf8bf5e7a',
        '6065503f5fd59b0cf8bf5e96',
        '606550415fd59b0cf8bf5eaa',
        '606550425fd59b0cf8bf5eba',
        '606550435fd59b0cf8bf5ec6',
        '606550455fd59b0cf8bf5eda',
        '606550465fd59b0cf8bf5ee2',
        '606550475fd59b0cf8bf5eea',
        '6065504a5fd59b0cf8bf5f0a',
        '6065504b5fd59b0cf8bf5f1e',
        '6065504d5fd59b0cf8bf5f32',
        '6065504f5fd59b0cf8bf5f46',
        '606550555fd59b0cf8bf5f6e',
        '6065505a5fd59b0cf8bf5f82',
        '6065505b5fd59b0cf8bf5f8e',
        '6065505e5fd59b0cf8bf5f9e',
        '606550615fd59b0cf8bf5fb2',
        '606550625fd59b0cf8bf5fbe',
        '606550cc5fd59b0cf8bf642a',
        '606550ce5fd59b0cf8bf643e',
        '606550cf5fd59b0cf8bf644a',
        '606550cf5fd59b0cf8bf644e',
        '606550d05fd59b0cf8bf645e',
        '606550d65fd59b0cf8bf64a6',
        '606550d95fd59b0cf8bf64c2',
        '606550d95fd59b0cf8bf64c6',
        '606550df5fd59b0cf8bf6506',
        '606550df5fd59b0cf8bf650a',
        '606550e15fd59b0cf8bf651a',
        '606550e15fd59b0cf8bf651e',
        '606550e45fd59b0cf8bf6546',
        '606550e55fd59b0cf8bf654e',
        '606550e65fd59b0cf8bf655a',
        '606550e95fd59b0cf8bf6572',
        '606550ea5fd59b0cf8bf657e',
        '606550ea5fd59b0cf8bf6582',
        '606550ea5fd59b0cf8bf6586',
        '606550ed5fd59b0cf8bf65a6',
        '606550ef5fd59b0cf8bf65b6',
        '606550f25fd59b0cf8bf65da',
        '606550f45fd59b0cf8bf65f2',
        '606550f45fd59b0cf8bf65f6',
      ],
    },
  })
  try {
    let success = []
    let failed = []
    for (oneInsta of installmentData) {
      let plannedAmountBreakup = {
        amount: oneInsta.plannedAmountBreakup[0].amount,
        feeTypeCode: oneInsta.plannedAmountBreakup[0].feeTypeCode,
        title: 'Term 2 Fees',
      }
      let paidAmountBreakup = {
        amount: oneInsta.paidAmountBreakup[0].amount,
        feeTypeCode: oneInsta.paidAmountBreakup[0].feeTypeCode,
        title: 'Term 2 Fees',
      }
      let pendingAmountBreakup = {
        amount: oneInsta.pendingAmountBreakup[0].amount,
        feeTypeCode: oneInsta.pendingAmountBreakup[0].feeTypeCode,
        title: 'Term 2 Fees',
      }
      let filter = { label: 'Installment003', feePlanId: oneInsta.feePlanId }
      let update = {
        plannedAmountBreakup: [plannedAmountBreakup],
        paidAmountBreakup: [paidAmountBreakup],
        pendingAmountBreakup: [pendingAmountBreakup],
      }
      await installFeePlanModel.updateOne(filter, update, function (err, res) {
        if (err) {
          failed.push(oneInsta.feePlanId)
        } else {
          success.push(oneInsta.feePlanId)
        }
      })
    }
    res.status(200).json({ success: success.length, failed: failed.length })
    dbConnection.close() // new
  } catch (err) {
    res.status(400).json({ success: false, Error: err.message })
    dbConnection.close() // new
  } finally {
  }
}
exports.nextPayment = async function (req, res) {
  console.log('nectpayment')
  let inputData = req.body
  if (!req.body) {
    res.json({
      message: 'Please provide all required parameters.',
      type: 'error',
    })
  } else {
    res.status(200).json({ success: true, message: 'Successfully Added Data' })
  }
}
exports.getrefundDetails = async function (req, res) {
  var dbUrl = req.headers.resource
  let id = req.params.id
  if (!id || !req.query.orgId) {
    res.status(400).json({
      status: 'failed',
      message: 'Please provide all required parameters.',
      type: 'error',
    })
  } else {
    let dbName = req.query.orgId
    let dbConnection = await createDatabase(dbName, dbUrl)

    let transactionModel = dbConnection.model(
      'transactions',
      transactionsSchema,
    )
    let feeMapModel = dbConnection.model('studentfeesmaps', StudentFeeMapSchema)
    let ledgerModel = dbConnection.model('feesledgers', feesLedgerSchema)
    let refundData = await ledgerModel.find({
      status: 'Refunded',
      primaryTransaction: paymentId,
      transactionSubType: 'refund',
      studentRegId: id,
    })
    if (refundData.length == 0) {
      dbConnection.close()
      res.status(400).json({
        status: 'failed',
        message: 'refunded already for this payment',
      })
    } else {
      var ledgerDetails = await ledgerModel.find({
        $or: [{ status: 'Paid' }, { status: 'Partial' }],
        studentRegId: id,
        transactionSubType: 'feePayment',
      })
    }
  }
}

exports.getPaidDetails = async function (req, res) {
  var dbUrl = req.headers.resource
  let id = req.params.id
  if (!id || !req.query.orgId) {
    res.status(400).json({
      status: 'failed',
      message: 'Please provide all required parameters.',
      type: 'error',
    })
  } else {
    let dbName = req.query.orgId
    let dbConnection = await createDatabase(dbName, dbUrl)

    let transactionModel = dbConnection.model(
      'transactions',
      transactionsSchema,
    )
    let studentModel = dbConnection.model('students', StudentSchema)
    let guardianModel = dbConnection.model('guardians', GuardianSchema)

    let feeMapModel = dbConnection.model('studentfeesmaps', StudentFeeMapSchema)
    let studentDetails = await studentModel.findOne({
      regId: { $regex: new RegExp(id, 'i') },
    })
    let demandNoteDetails = await transactionModel.findOne({
      regId: { $regex: new RegExp(id, 'i') },
    })
    if (studentDetails) {
      var studentFeeMapDetails = await feeMapModel.find({
        studentId: studentDetails._id,
      })
      let ledgerModel = dbConnection.model('feesledgers', feesLedgerSchema)
      let feeLedgerD = await ledgerModel.find({
        $or: [{ status: 'Paid' }, { status: 'Partial' }],
        transactionSubType: 'feePayment',
        studentRegId: { $regex: new RegExp(id, 'i') },
      })
      var allRemainLedger = []
      for (ledgerD of feeLedgerD) {
        let allLDetails = await ledgerModel.findOne({
          primaryTransaction: ledgerD.transactionDisplayName,
          transactionSubType: 'refund',
        })
        let demandNoteDetails = await transactionModel.findOne({
          displayName: ledgerD.primaryTransaction,
        })

        if (allLDetails == null) {
          let obj = {
            demandNote: demandNoteDetails,
            paymentDetails: ledgerD,
          }
          allRemainLedger.push(obj)
        }
      }
      if (allRemainLedger.length == 0) {
        dbConnection.close()
        res
          .status(404)
          .json({ status: 'failed', message: 'No receipt for this student' })
      }

      let guardianDetails = await guardianModel.findOne({
        _id: studentDetails.guardianDetails[0],
      })

      if (feeLedgerD.length == 0) {
        dbConnection.close()
        res
          .status(404)
          .json({ status: 'failed', message: 'Payment not yet received' })
      } else {
        let obj = {
          payment: allRemainLedger,
          guardianDetails: guardianDetails,
          studentDetails: studentDetails,
          studentFeeMapDetails: studentFeeMapDetails,
        }
        dbConnection.close()
        res.status(200).json({ status: 'success', data: obj })
      }
    } else {
      dbConnection.close()
      res.status(404),
        json({ status: 'failed', message: 'student data not found' })
    }

    // let feeLedgerData = [];
    // for (oneLedger of transactionDetails) {
    //   let ledgerModel = dbConnection.model("feesledgers", feesLedgerSchema);
    //   let feeLedgerD = await ledgerModel.find({
    //     $or: [{ status: "Paid" }, { status: "Partial" }],
    //     primaryTransaction: oneLedger.displayName,
    //     transactionSubType: "feePayment",
    //     studentRegId: oneLedger.studentRegId,
    //   });
    //   let studentDetails = await studentModel.findOne({
    //     _id: oneLedger.studentId,
    //   });
    //   let guardianDetails = await guardianModel.findOne({
    //     _id: studentDetails.guardianDetails[0],
    //   });

    //   if (feeLedgerD.length == 0) {
    //     let obj = {
    //       status: "failed",
    //       message: "Payment not yet received",
    //     };
    //     // feeLedgerData.push(obj);
    //     return res.status(404).json(obj);
    //   } else {
    //     // for (ledg of feeLedgerD) {
    //     let obj = {
    //       demandNote: oneLedger,
    //       payment: feeLedgerD,
    //       guardianDetails: guardianDetails,
    //       studentDetails: studentDetails,
    //       studentFeeMapDetails: studentFeeMapDetails,
    //     };
    //     feeLedgerData.push(obj);
    //     // }
    //   }
    // }
    // res.status(200).json(feeLedgerData);
  }
}

exports.inwords = async function (req, res) {
  let inputData = req.body.amount
  var paisa
  var amount
  if (inputData.indexOf('.') !== -1) {
    paisa = String(inputData).split('.')[1]
    amount = String(inputData).split('.')[0]
  }
  let amountword = await convertWords(Number(amount))
  let paisaword = await convertWords(Number(paisa))
  res.send({ amount: amountword, paisa: paisaword })
}

async function convertWords(num) {
  var a = [
    '',
    'ONE ',
    'TWO ',
    'THREE ',
    'FOUR ',
    'FIVE ',
    'SIX ',
    'SEVEN ',
    'EIGHT ',
    'NINE ',
    'TEN ',
    'ELEVEN ',
    'TWELVE ',
    'THIRTEEN ',
    'FOURTEEN ',
    'FIFTEEN ',
    'SIXTEEN ',
    'SENENTEEN ',
    'EIGHTEEN ',
    'NINETEEN ',
  ]
  var b = [
    '',
    '',
    'TWENTY',
    'THIRTY',
    'FORTY',
    'FIFTY',
    'SIXTY',
    'SEVENTY',
    'EIGHTY',
    'NINETY',
  ]
  if ((num = num.toString()).length > 9) return 'overflow'
  n = ('000000000' + num)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/)
  if (!n) return
  var str = ''
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'CRORE '
      : ''
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'LAKH '
      : ''
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'THOUSAND '
      : ''
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'HUNDRED '
      : ''
  str +=
    n[5] != 0
      ? (str != '' ? 'AND ' : '') +
        (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) +
        ''
      : ''

  return str
}

exports.adjustAmount = async function (req, res) {
  let dbConnection = await createDatabase(
    String('5fa8daece3eb1f18d4250e98'),
    process.env.central_mongoDbUrl,
  )
  let feeLedgerModel = dbConnection.model('feesledgers', feesLedgerSchema)
  let transactionModel = dbConnection.model('transactions', transactionsSchema)
  let studentModel = dbConnection.model('students', StudentSchema)
  let feePlanModel = dbConnection.model('studentfeeplans', feeplanschema)
  let findStudent = feePlanModel.findOne({ studentRegId: '2767' })
  res.status(200).json({ data: findStudent })
  return
  try {
    let result = []
    let feePlanData = await feePlanModel.find({
      pendingAmount: { $gt: 0 },
      discountAmount: { $gt: 0 },
    })
    for (oneData of feePlanData) {
      console.log('regid', oneData.studentRegId)

      if (findStudent.status == 1) {
        result.push(oneData)
      }
    }

    // let faileds = [];
    // let successs = [];
    // for (oneRes of result) {
    //   if (oneRes.success == false) {
    //     faileds.push(oneRes);
    //   } else if (oneRes.success == true) {
    //     successs.push(oneRes);
    //   }
    // }

    res.status(200).json({ data: result.length })
  } catch (err) {
    res.status(400).json({ success: false, Error: err })
  } finally {
    // dbConnection.close();
  }
}

exports.discountRevert = async function (req, res) {
  let dbConnection = await createDatabase(
    '5fa8daece3eb1f18d4250e98',
    process.env.central_mongoDbUrl,
  )
  let feeLedgerModel = dbConnection.model('feesledgers', feesLedgerSchema)
  let transactionModel = dbConnection.model('transactions', transactionsSchema)
  let studentModel = dbConnection.model('students', StudentSchema)
  let feePlanModel = dbConnection.model('studentfeeplans', feeplanschema)
  let installFeePlanModel = dbConnection.model(
    'studentfeeinstallmentplans',
    feeInstallmentSchema,
  )

  let result = []
  let feePlanData = await feePlanModel.find({
    pendingAmount: { $gt: 0 },
    discountAmount: { $gt: 0 },
  })
  for (oneData of feePlanData) {
    let feeStudent = await studentModel.findOne({ regId: oneData.studentRegId })
    if (feeStudent.status === 1) {
      let findFeePlan = await feePlanModel.findOne({
        studentRegId: oneData.studentRegId,
      })
      let plannedAmount = Number(findFeePlan.totalAmount)
      let pendingAmount = Number(plannedAmount) - Number(findFeePlan.paidAmount)
      let plannedAmountBreakup = [
        {
          amount: Number(plannedAmount),
          feeTypeCode: 'FT_2021-22_001',
          title: 'Term Fees',
        },
      ]
      let pendingAmountBreakup = [
        {
          amount: Number(pendingAmount),
          feeTypeCode: 'FT_2021-22_001',
          title: 'Term Fees',
        },
      ]
      let findInstallment = await installFeePlanModel.find({
        feePlanId: oneData._id,
      })
      let firstIns = await percentage(Number(plannedAmount), 40)
      let secondtIns = await percentage(Number(plannedAmount), 20)
      let sixty = await percentage(Number(plannedAmount), 60)
      let paidAmnt = Number(findFeePlan.paidAmount)
      feePlanModel.updateOne(
        { studentRegId: oneData.studentRegId },
        {
          plannedAmount: plannedAmount,
          plannedAmountBreakup: plannedAmountBreakup,
          pendingAmount: pendingAmount,
          pendingAmountBreakup,
          discountAmount: Number(0),
        },
        async function (err, docs) {
          if (err) {
            let obj = {
              success: false,
              error: err,
            }
            result.push(obj)
          } else {
            if (findInstallment.length == 4) {
              for (oneInsta of findInstallment) {
                if (oneInsta.label == 'Installment004') {
                  let tot = plannedAmount
                  let plan =
                    Number(oneInsta.plannedAmount) +
                    Number(findFeePlan.discountAmount)
                  let pend = Number(plan) - Number(oneInsta.paidAmount)
                  let planBreak = [
                    {
                      amount: Number(plan),
                      feeTypeCode: 'FT_2021-22_001',
                      title: 'Term2 Fees',
                    },
                  ]
                  let pendBreak = [
                    {
                      amount: Number(pend),
                      feeTypeCode: 'FT_2021-22_001',
                      title: 'Term2 Fees',
                    },
                  ]
                  installFeePlanModel.updateOne(
                    { label: oneInsta.label, feePlanId: oneInsta.feePlanId },
                    {
                      totalAmount: tot,
                      plannedAmount: plan,
                      plannedAmountBreakup: planBreak,
                      pendingAmount: pend,
                      pendingAmountBreakup: pendBreak,
                      status: 'Planned',
                    },
                    async function (err, docs) {
                      if (err) {
                        let obj = {
                          success: false,
                          error: err,
                        }
                        result.push(obj)
                      } else {
                        let obj = {
                          success: true,
                        }
                        result.push(obj)
                      }
                    },
                  )
                }
              }
            } else {
              for (oneInsta of findInstallment) {
                if (oneInsta.label == 'Installment004') {
                  let tot = plannedAmount
                  let plan =
                    Number(oneInsta.plannedAmount) +
                    Number(findFeePlan.discountAmount)
                  let pend = Number(plan) - Number(oneInsta.paidAmount)
                  let planBreak = [
                    {
                      amount: Number(plan),
                      feeTypeCode: 'FT_2021-22_001',
                      title: 'Term2 Fees',
                    },
                  ]
                  let pendBreak = [
                    {
                      amount: Number(pend),
                      feeTypeCode: 'FT_2021-22_001',
                      title: 'Term2 Fees',
                    },
                  ]
                  installFeePlanModel.updateOne(
                    { label: oneInsta.label, feePlanId: oneInsta.feePlanId },
                    {
                      totalAmount: tot,
                      plannedAmount: plan,
                      plannedAmountBreakup: planBreak,
                      pendingAmount: pend,
                      pendingAmountBreakup: pendBreak,
                      status: 'Planned',
                    },
                    async function (err, docs) {
                      if (err) {
                        let obj = {
                          success: false,
                          error: err,
                        }
                        result.push(obj)
                      } else {
                        let obj = {
                          success: true,
                        }
                        result.push(obj)
                      }
                    },
                  )
                } else {
                  let tot = plannedAmount
                  let plan =
                    Number(oneInsta.plannedAmount) +
                    Number(findFeePlan.discountAmount)
                  let pend = Number(plan) - Number(oneInsta.paidAmount)
                  let planBreak = [
                    {
                      amount: Number(plan),
                      feeTypeCode: 'FT_2021-22_001',
                      title: 'Term2 Fees',
                    },
                  ]
                  let pendBreak = [
                    {
                      amount: Number(pend),
                      feeTypeCode: 'FT_2021-22_001',
                      title: 'Term2 Fees',
                    },
                  ]
                  installFeePlanModel.updateOne(
                    { label: 'Installment003', feePlanId: oneInsta.feePlanId },
                    {
                      totalAmount: tot,
                      plannedAmount: plan,
                      plannedAmountBreakup: planBreak,
                      pendingAmount: pend,
                      pendingAmountBreakup: pendBreak,
                      status: 'Planned',
                    },
                    async function (err, docs) {
                      if (err) {
                        let obj = {
                          success: false,
                          error: err,
                        }
                        result.push(obj)
                      } else {
                        let obj = {
                          success: true,
                        }
                        result.push(obj)
                      }
                    },
                  )
                }
              }
            }
          }
        },
      )
    }
  }
  let faileds = []
  let successs = []
  for (oneRes of result) {
    if (oneRes.success == false) {
      faileds.push(oneRes)
    } else if (oneRes.success == true) {
      successs.push(oneRes)
    }
  }
  res.status(200).json({ success: successs.length, failed: faileds })
  // res.status(200).json({ data:result.length})
}

exports.checkRazorpaysee = async function (req, res) {
  let dbConnection = await createDatabase(
    '5fa8daece3eb1f18d4250e98',
    process.env.central_mongoDbUrl,
  )
  let transactionModel = dbConnection.model('transactions', transactionsSchema)
  let studentModel = dbConnection.model('students', StudentSchema)
  let feePlanModel = dbConnection.model('studentfeeplans', feeplanschema)
  let installFeePlanModel = dbConnection.model(
    'studentfeeinstallmentplans',
    feeInstallmentSchema,
  )
  const razorpayModel = dbConnection.model('razorpay', RazorpaySchema)
  razorpayModel.find({}, async function (err, docs) {
    if (err) {
      res.status(400).json({ success: false, Error: err })
    } else {
      let result = []
      for (oneData of docs) {
        var auth =
          'Basic ' +
          Buffer.from(
            'rzp_live_Q0y0e1u3HiSmtT' + ':' + 'i9aeIySt3muWa1NWdnlgl0wQ',
          ).toString('base64')
        const headers = {
          Authorization: auth,
          'Content-Type': 'application/json',
        }
        var options = {
          method: 'GET',
          uri: `https://api.razorpay.com/v1/payment_links/${oneData.paymentId}`,
          json: true,
          headers: {
            'Content-Type': 'application/json',
            Authorization: auth,
          },
        }
        rq(options)
          .then(async (success) => {
            if (success.status == 'paid')
              res.status(200).json({ success: true, Data: success })
          })
          .catch((err) => {
            res.status(400).json({ Message: 'Failed', Error: err })
          })
      }
      // console.log('razor', rzrpayDetails)
      // res.status(200).json({ success: true, Data: rzrpayDetails })
    }
  })
}
exports.checkRazorpay11 = async function (req, res) {
  let inputData = req.body.data
  let dbConnection = await createDatabase(
    '5fa8daece3eb1f18d4250e98',
    process.env.central_mongoDbUrl,
  )
  let transactionModel = dbConnection.model('transactions', transactionsSchema)
  let studentModel = dbConnection.model('students', StudentSchema)
  let feePlanModel = dbConnection.model('studentfeeplans', feeplanschema)
  let installFeePlanModel = dbConnection.model(
    'studentfeeinstallmentplans',
    feeInstallmentSchema,
  )
  let campusModel = dbConnection.model('campuses', campusSchema)
  const razorpayModel = dbConnection.model('razorpay', RazorpaySchema)

  let result = []
  for (oneData of inputData) {
    let findStudent = await studentModel.findOne({ regId: oneData })
    let findCredentials = await campusModel.findOne({
      _id: findStudent.campusId,
    })
    var username = findCredentials.credentials.username
    var password = findCredentials.credentials.password
    let findRazorpay = await razorpayModel.find({
      studentId: findStudent.rollNumber,
    })
    let statusPaid = []
    for (onePay of findRazorpay) {
      var auth =
        'Basic ' + Buffer.from(username + ':' + password).toString('base64')
      var options = {
        method: 'GET',
        uri: `https://api.razorpay.com/v1/payment_links/${onePay.paymentId}`,
        json: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
      }
      await rq(options)
        .then(async (success) => {
          if (success.status == 'paid') {
            let amt = String(success.amount)
            const editedText = amt.slice(0, -2)
            let obj1 = {
              status: success.status,
              amount: Number(editedText),
              paymentLinkId: onePay.paymentId,
            }
            statusPaid.push(obj1)
          }
        })
        .catch(async (err) => {
          var auth =
            'Basic ' +
            Buffer.from(
              'rzp_live_Q0y0e1u3HiSmtT' + ':' + 'i9aeIySt3muWa1NWdnlgl0wQ',
            ).toString('base64')
          var options = {
            method: 'GET',
            uri: `https://api.razorpay.com/v1/payment_links/${onePay.paymentId}`,
            json: true,
            headers: {
              'Content-Type': 'application/json',
              Authorization: auth,
            },
          }
          await rq(options)
            .then(async (success) => {
              if (success.status == 'paid') {
                let amt = String(success.amount)
                const editedText = amt.slice(0, -2)
                let obj1 = {
                  status: success.status,
                  amount: Number(editedText),
                  paymentLinkId: onePay.paymentId,
                }
                statusPaid.push(obj1)
              }
            })
            .catch((err) => {
              let fail = {
                success: false,
                error: err.message,
              }
              statusPaid.push(fail)
            })
        })
    }

    const sumall = statusPaid.map(item => item.amount).reduce((prev, curr) => prev + curr, 0);
    let findFeePlan = await feePlanModel.findOne({
      studentRegId: oneData,
    })
    if(Number(sumall) !== Number(findFeePlan.paidAmount)){
      let obj = {
        studentRegId: oneData,
        studentName:`${findStudent.firstName}" "${findStudent.lastName}`,
        razorpaypaid: sumall,
        InitalTotalFees: findFeePlan.totalAmount,
        discount:findFeePlan.discountAmount,
        appliedandRemoved:findFeePlan.discountAmountBreakup[0].amount,
        planned:findFeePlan.plannedAmount,
        feeplanPaid:findFeePlan.paidAmount,
        pending:findFeePlan.pendingAmount
      }
      result.push(obj)
    }
   
  }
  res.status(200).json({ data: result })
}
exports.checkRazorpay = async function (req, res) {
  let inputData = req.body.data
  let dbConnection = await createDatabase(
    '5fa8daece3eb1f18d4250e98',
    process.env.central_mongoDbUrl,
  )
  let transactionModel = dbConnection.model('transactions', transactionsSchema)
  let studentModel = dbConnection.model('students', StudentSchema)
  let feePlanModel = dbConnection.model('studentfeeplans', feeplanschema)
  let installFeePlanModel = dbConnection.model(
    'studentfeeinstallmentplans',
    feeInstallmentSchema,
  )
  let campusModel = dbConnection.model('campuses', campusSchema)
  const razorpayModel = dbConnection.model('razorpay', RazorpaySchema)

  let result = []
  for (oneData of inputData) {
    let findStudent = await studentModel.findOne({ regId: oneData })
    let findCredentials = await campusModel.findOne({
      _id: findStudent.campusId,
    })
    var username = findCredentials.credentials.username
    var password = findCredentials.credentials.password
    let findRazorpay = await razorpayModel.find({
      studentId: findStudent.rollNumber,
    })
    let statusPaid = []
    for (onePay of findRazorpay) {
      var auth =
        'Basic ' + Buffer.from(username + ':' + password).toString('base64')
      var options = {
        method: 'GET',
        uri: `https://api.razorpay.com/v1/payment_links/${onePay.paymentId}`,
        json: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
      }
      await rq(options)
        .then(async (success) => {
          if (success.status == 'paid') {
            let amt = String(success.amount_paid)
            var d = moment.unix(success.updated_at);
            const editedText = amt.slice(0, -2)
            let obj1 = {
              status: success.status,
              amount: Number(editedText),
              paymentLinkId: onePay.paymentId,
              date:d,
              paidId:success.payments[0].payment_id,
              studentHedaId:findStudent.rollNumber
            }
            statusPaid.push(obj1)
          }
        })
        .catch(async (err) => {
          var auth =
            'Basic ' +
            Buffer.from(
              'rzp_live_Q0y0e1u3HiSmtT' + ':' + 'i9aeIySt3muWa1NWdnlgl0wQ',
            ).toString('base64')
          var options = {
            method: 'GET',
            uri: `https://api.razorpay.com/v1/payment_links/${onePay.paymentId}`,
            json: true,
            headers: {
              'Content-Type': 'application/json',
              Authorization: auth,
            },
          }
          await rq(options)
            .then(async (success) => {
              if (success.status == 'paid') {
                let amt = String(success.amount_paid)
                var d = moment.unix(success.updated_at);
                const editedText = amt.slice(0, -2)
                let obj1 = {
                  status: success.status,
                  amount: Number(editedText),
                  paymentLinkId: onePay.paymentId,
                  date:d,
                  paidId:success.payments[0].payment_id,
                  studentHedaId:findStudent.rollNumber
                }
                statusPaid.push(obj1)
              }
            })
            .catch((err) => {
              let fail = {
                success: false,
                error: err.message,
              }
              statusPaid.push(fail)
            })
        })
    }

    const sumall = statusPaid.map(item => item.amount).reduce((prev, curr) => prev + curr, 0);
    let findFeePlan = await feePlanModel.findOne({
      studentRegId: oneData,
    })
    // if(Number(sumall) !== Number(findFeePlan.paidAmount)){
      let obj = {
        studentRegId: oneData,
        studentName:`${findStudent.firstName}" "${findStudent.lastName}`,
        razorpaypaid: sumall,
        InitalTotalFees: findFeePlan.totalAmount,
        discount:findFeePlan.discountAmount,
        appliedandRemoved:findFeePlan.discountAmountBreakup[0].amount,
        planned:findFeePlan.plannedAmount,
        feeplanPaid:findFeePlan.paidAmount,
        pending:findFeePlan.pendingAmount,
        details:statusPaid
      }
      result.push(obj)
    // }
  }
  res.status(200).json({ data: result })
}
async function percentage(percent, total) {
  return ((percent / 100) * total).toFixed(2)
}

