let extraAmount = Math.abs(Number(feMapDe.amount) - Number(paidAA));
let payable = Number(feMapDe.pending);

var advanceId = await getDisplayAdvanceId(dbConnection);
let transactionId;
if (mode == "cash") {
  transactionId = transID;
} else {
  transactionId = inputData.paymentTransactionId;
}
// let receiptNo;
// if (inputData.type == "receipt") {
//   receiptNo = `${year2}/${receiptN + 1}`;
// } else {
//   receiptNo = transactionId;
// }

let passData = {
  displayName: advanceId,
  transactionDate: transactionDate,
  relatedTransactions: inputData.relatedTransactions,
  transactionType: "eduFees",
  transactionSubType: "advance",
  studentId: inputData.studentId,
  studentName: inputData.studentName,
  class: inputData.class,
  academicYear: inputData.academicYear,
  amount: extraAmount,
  studentRegId: inputData.studentRegId,
  receiptNo: advanceId,
  programPlan: inputData.programPlanId,
  data: inputData.data,
  paymentTransactionId: transactionId,
  receiptStatus: inputData.receiptStatus,
  currency: inputData.currency,
  currencyAmount: inputData.currencyAmount,
  exchangeRate: inputData.exchangeRate,
  userName: inputData.userName,
  createdBy: inputData.createdBy,
  updatedBy: inputData.createdBy,
  campusId: feMapDe.campusId,
};
advanceLedgerEntry({ body: passData }, dbConnection)
  .then(async (paymentData) => {
    if (paymentData.status == "failure") {
      dbConnection.close();
      return res.status(400).send(paymentData);
    } else {
      let dbConnection = await createDatabase(
        String(orgData._id),
        orgData.connUri
      );
      var rcptId = await getDisplayId(dbConnection);
      let transactionId;
      if (mode == "cash") {
        transactionId = transID;
      } else {
        transactionId = inputData.paymentTransactionId;
      }
      // let receiptNo;
      // if (inputData.type == "receipt") {
      //   receiptNo = `${year2}/${receiptN + 1}`;
      // } else {
      //   receiptNo = transactionId;
      // }
      var afterAdvanceFee = [];
      for (oneFee of inputData.data.feesBreakUp) {
        let obje;
        if (String(oneFee.feeTypeCode) == "FT001") {
          obje = {
            feeTypeId: oneFee.feeTypeId,
            feeType: oneFee.feeType,
            amount: payable,
            feeTypeCode: oneFee.feeTypeCode,
          };
        } else {
          obje = {
            feeTypeId: oneFee.feeTypeId,
            feeType: oneFee.feeType,
            amount: oneFee.amount,
            feeTypeCode: oneFee.feeTypeCode,
          };
        }
        afterAdvanceFee.push(obje);
      }
      let passData = {
        displayName: rcptId,
        transactionDate: transactionDate,
        relatedTransactions: inputData.relatedTransactions,
        transactionType: "eduFees",
        transactionSubType: "feePayment",
        studentId: inputData.studentId,
        studentName: inputData.studentName,
        class: inputData.class,
        academicYear: inputData.academicYear,
        amount: payable,
        studentRegId: inputData.studentRegId,
        receiptNo: rcptId,
        programPlan: inputData.programPlanId,
        data: {
          feesBreakUp: afterAdvanceFee,
          orgId: inputData.data.orgId,
          transactionType: "eduFees",
          transactionSubType: "feePayment",
          mode: inputData.data.mode,
          method: inputData.data.method,
          modeDetails: {
            netBankingType: inputData.data.modeDetails.netBankingType,
            walletType: inputData.data.modeDetails.walletType,
            instrumentNo: inputData.data.modeDetails.instrumentNo,
            cardType: inputData.data.modeDetails.cardType,
            nameOnCard: inputData.data.modeDetails.nameOnCard,
            cardNumber: inputData.data.modeDetails.cardNumber,
            instrumentDate: inputData.data.modeDetails.instrumentDate,
            bankName: inputData.data.modeDetails.bankName,
            branchName: inputData.data.modeDetails.branchName,
            transactionId: inputData.data.modeDetails.transactionId,
            remarks: inputData.data.modeDetails.remarks,
          },
        },
        paymentTransactionId: transactionId,
        receiptStatus: inputData.receiptStatus,
        currency: inputData.currency,
        currencyAmount: inputData.currencyAmount,
        exchangeRate: inputData.exchangeRate,
        userName: inputData.userName,
        createdBy: inputData.createdBy,
        updatedBy: inputData.createdBy,
        campusId: inputData.campusId,
      };
      ledgerEntry({ body: passData }, dbConnection)
        .then(async (paymentData) => {
          if (paymentData.status == "failure") {
            dbConnection.close() // new
            return res.status(400).send(paymentData);
          } else {
            let dbConnection1 = await createDatabase(
              String(orgData._id),
              orgData.connUri
            );
            const settingsSchema = mongoose.Schema({}, { strict: false });
            const settingsModel = dbConnection1.model(
              "settings",
              settingsSchema,
              "settings"
            );
            const orgSettings = await settingsModel.find({});
            let orgDetails = orgSettings[0]._doc;
            let emailCommunicationRefIds = inputData.emailCommunicationRefIds;
            let feeMapModel = dbConnection1.model(
              "studentfeesmaps",
              StudentFeeMapSchema
            );
            let feeStructureModel = dbConnection1.model(
              "feestructures",
              FeeStructureSchema
            );
            let feeManagerModel = dbConnection1.model(
              "feemanagers",
              FeeManagerSchema
            );
            let feeTypeModel = dbConnection1.model("feetypes", FeeTypeSchema);

            let feMapDe = await feeMapModel.findOne({
              displayName: inputData.studentFeeMap,
            });
            let feeStructureDetails = await feeStructureModel.findOne({
              _id: feMapDe.feeStructureId,
            });
            let feeBre = [];
            if (feMapDe.transactionPlan.feesBreakUp.length !== 0) {
              for (singleData of feMapDe.transactionPlan.feesBreakUp) {
                console.log("singleData", singleData);
                let fees = singleData.amount;
                for (oneFee of afterAdvanceFee) {
                  if (
                    String(singleData.feeTypeCode) == String(oneFee.feeTypeCode)
                  ) {
                    let fullPaid =
                      Number(singleData.paid) + Number(oneFee.amount);
                    let fullPending = Number(fees) - fullPaid;
                    let obje = {
                      amount: fees,
                      paid: fullPaid,
                      pending: fullPending,
                      feeTypeCode: oneFee.feeTypeCode,
                      title: oneFee.feeType,
                    };
                    feeBre.push(obje);
                  }
                }
              }
            } else {
              let fees = singleData.amount;
              for (oneFee of afterAdvanceFee) {
                if (
                  String(singleData.feeTypeCode) == String(oneFee.feeTypeCode)
                ) {
                  let fullPaid = Number(oneFee.amount);
                  let fullPending = Number(fees) - fullPaid;
                  let obje = {
                    amount: fees,
                    paid: fullPaid,
                    pending: fullPending,
                    feeTypeCode: oneFee.feeTypeCode,
                    title: oneFee.feeType,
                  };
                  feeBre.push(obje);
                }
              }
            }
            var tota = 0;
            var pai = 0;
            var pend = 0;
            for (oneFees of feeBre) {
              tota += oneFees.amount;
              pai += oneFees.paid;
              pend += oneFees.pending;
            }
            let feeTypesPaid = {
              feesBreakUp: feeBre,
              totalAmount: tota,
              totalPaid: pai,
              totalPending: pend,
            };
            let paidA = Number(feMapDe.paid) + Number(inputData.amount);
            if (Number(feMapDe.amount) - Number(paidA) < 0) {
              feeMapModel.updateOne(
                { displayName: inputData.studentFeeMap },
                {
                  $set: {
                    paid: paidA,
                    pending: 0,
                    transactionPlan: feeTypesPaid,
                  },
                },
                async function (err, feeMapD) {
                  if (feeMapD.nModified) {
                    let feeTableHeader = [
                      {
                        name: "Particulars",
                        value: "feeTypeName",
                        type: "string",
                      },
                      {
                        name: "Paid Amount",
                        value: "paidAmount",
                        type: "amount",
                      },
                    ];
                    let TxnModel = dbConnection1.model(
                      "transactions",
                      transactionsSchema
                    );
                    let feeTypeModel = dbConnection1.model(
                      "feetypes",
                      FeeTypeSchema
                    );

                    let FeesLedgerModel = dbConnection1.model(
                      "feesledgers",
                      feesLedgerSchema
                    );
                    let reconciliationTransactionsModel = dbConnection1.model(
                      "reconciliationTransactions",
                      reconciliationTransactionsSchema
                    );
                    let ledgerData = await FeesLedgerModel.findOne({
                      transactionDisplayName: rcptId,
                    });
                    let demandNoteData = await TxnModel.findOne({
                      displayName: rcptId,
                    });
                    // let demandNoteData = await TxnModel.findOne({
                    //   displayName: inputData.relatedTransactions[0],
                    // });
                    var feesAll = [];
                    for (singleFee of afterAdvanceFee) {
                      var obj;
                      if (Number(singleFee.amount) !== 0) {
                        obj = {
                          feeTypeName: singleFee.feeType,
                          previousDue: 0.0,
                          currentDue: Number(singleFee.amount),
                          totalDue: Number(singleFee.amount),
                          paidAmount: Number(singleFee.amount),
                          mode: mode,
                          academicYear: demandNoteData.academicYear,
                          studentName: demandNoteData.studentName,
                          regId: demandNoteData.studentRegId,
                          class: demandNoteData.class,
                        };
                        feesAll.push(obj);
                      }
                    }

                    // let feesAll = [
                    //   {
                    //     feeTypeName: feeTypesDetails.title,
                    //     previousDue: 0.0,
                    //     currentDue: demandNoteData.amount,
                    //     totalDue: demandNoteData.amount,
                    //     paidAmount: ledgerData.paidAmount,
                    //     mode: mode,
                    //     academicYear: demandNoteData.academicYear,
                    //     studentName: demandNoteData.studentName,
                    //     class: demandNoteData.class,
                    //   },
                    // ];

                    var allMaildata = {
                      transactionId: transactionId,
                      studentName: demandNoteData.studentName,
                    };
                    //Send receipt or Acknowledgement
                    const emailTemplate1 = await receiptVkgiPdf(
                      orgDetails,
                      allMaildata
                    );
                    let qrCo = null;
                    const successReceipt = await receiptVkgiPdf(
                      orgDetails,
                      feesAll,
                      feeTableHeader,
                      rcptId,
                      inputData.type,
                      qrCo
                    );

                    let obje = {
                      html: successReceipt,
                    };
                    let createPdf = await axios.post(
                      process.env.externalServer,
                      obje
                    );
                    let accountname = process.env.blobAccountName;
                    const containerName = process.env.containerName;
                    let key = process.env.blobKey;
                    const cerds = new storage.StorageSharedKeyCredential(
                      accountname,
                      key
                    );
                    let blobName = createPdf.data.data;

                    const blobServiceClient =
                      BlobServiceClient.fromConnectionString(
                        process.env.AZURE_STORAGE_CONNECTION_STRING
                      );
                    const containerClient =
                      blobServiceClient.getContainerClient(containerName);
                    const blobClient = await containerClient.getBlobClient(
                      blobName
                    );
                    var repla = blobClient.url.replace(
                      "https://supportings.blob.core.windows.net",
                      "https://fcreceipt.zenqore.com"
                    );
                    let minUrl = repla;
                    // let getData = await getBlobData(
                    //   containerName,
                    //   createPdf.data.data
                    // );

                    // return res.status(200).json({ data: blobClient.url });
                    let qrCod = await generateQrCode(minUrl);
                    const successReceipt1 = await receiptVkgiPdf(
                      orgDetails,
                      feesAll,
                      feeTableHeader,
                      rcptId,
                      inputData.type,
                      qrCod,
                      minUrl
                    );

                    let obje1 = {
                      html: successReceipt1,
                    };
                    let createPdf1 = await axios.post(
                      process.env.externalServer,
                      obje1
                    );
                    dbConnection1.close();
                    let title;
                    if (inputData.type == "receipt") {
                      title = "ZQ EDU-Receipt";
                    } else {
                      title = "ZQ EDU-Acknowledgement";
                    }
                    sendEmail(
                      orgDetails.emailServer[0].emailServer,
                      inputData.emailCommunicationRefIds,
                      orgDetails.emailServer[0].emailAddress,
                      title,
                      emailTemplate1,
                      createPdf1.data.file,
                      "vkgi"
                    )
                      .then((data) => {
                        dbConnection1.close();
                        commonPostNotification(
                          `${inputData.data.orgId}`,
                          "success",
                          "transaction_collectPayment",
                          `Payment done successfully for the student ${
                            inputData.studentName
                          } of ${Number(inputData.amount).toLocaleString(
                            "en-IN",
                            {
                              style: "currency",
                              currency: "INR",
                            }
                          )}`
                        );
                        res.status(200).json({
                          status: "success",
                          message: "Receipt sent successfully",
                          data: paymentData,
                          receiptKey: createPdf.data.data,
                          receiptId: rcptId,
                        });
                      })
                      .catch((err) => {
                        dbConnection1.close();
                        res.status(500).send({
                          status: "failure",
                          message: "failed to send receipt email",
                          data: err,
                        });
                      });
                  } else {
                    return res.status(400).json({
                      status: "failure",
                      message: "Student Fees mapping not updated",
                      Error: err,
                    });
                  }
                }
              );
            } else {
              feeMapModel.updateOne(
                { displayName: inputData.studentFeeMap },
                {
                  $set: {
                    paid: paidA,
                    pending: Number(feMapDe.amount) - Number(paidA),
                    transactionPlan: feeTypesPaid,
                  },
                },
                async function (err, feeMapD) {
                  if (feeMapD.nModified) {
                    let feeTableHeader = [
                      {
                        name: "Particulars",
                        value: "feeTypeName",
                        type: "string",
                      },
                      {
                        name: "Paid Amount",
                        value: "paidAmount",
                        type: "amount",
                      },
                    ];
                    let TxnModel = dbConnection1.model(
                      "transactions",
                      transactionsSchema
                    );
                    let feeTypeModel = dbConnection1.model(
                      "feetypes",
                      FeeTypeSchema
                    );

                    let FeesLedgerModel = dbConnection1.model(
                      "feesledgers",
                      feesLedgerSchema
                    );
                    let reconciliationTransactionsModel = dbConnection1.model(
                      "reconciliationTransactions",
                      reconciliationTransactionsSchema
                    );
                    let ledgerData = await FeesLedgerModel.findOne({
                      transactionDisplayName: rcptId,
                    });
                    let demandNoteData = await TxnModel.findOne({
                      displayName: rcptId,
                    });
                    // let demandNoteData = await TxnModel.findOne({
                    //   displayName: inputData.relatedTransactions[0],
                    // });
                    var feesAll = [];
                    for (singleFee of afterAdvanceFee) {
                      var obj;
                      if (Number(singleFee.amount) !== 0) {
                        obj = {
                          feeTypeName: singleFee.feeType,
                          previousDue: 0.0,
                          currentDue: Number(singleFee.amount),
                          totalDue: Number(singleFee.amount),
                          paidAmount: Number(singleFee.amount),
                          mode: mode,
                          academicYear: demandNoteData.academicYear,
                          studentName: demandNoteData.studentName,
                          regId: demandNoteData.studentRegId,
                          class: demandNoteData.class,
                        };
                        feesAll.push(obj);
                      }
                    }

                    // let feesAll = [
                    //   {
                    //     feeTypeName: feeTypesDetails.title,
                    //     previousDue: 0.0,
                    //     currentDue: demandNoteData.amount,
                    //     totalDue: demandNoteData.amount,
                    //     paidAmount: ledgerData.paidAmount,
                    //     mode: mode,
                    //     academicYear: demandNoteData.academicYear,
                    //     studentName: demandNoteData.studentName,
                    //     class: demandNoteData.class,
                    //   },
                    // ];

                    var allMaildata = {
                      transactionId: transactionId,
                      studentName: demandNoteData.studentName,
                    };
                    //Send receipt or Acknowledgement
                    const emailTemplate1 = await receiptTemplate(
                      orgDetails,
                      allMaildata
                    );
                    let qrCo = null;
                    const successReceipt = await receiptPdf(
                      orgDetails,
                      feesAll,
                      feeTableHeader,
                      rcptId,
                      inputData.type,
                      qrCo
                    );

                    let obje = {
                      html: successReceipt,
                    };
                    let createPdf = await axios.post(
                      process.env.externalServer,
                      obje
                    );
                    let accountname = process.env.blobAccountName;
                    const containerName = process.env.containerName;
                    let key = process.env.blobKey;
                    const cerds = new storage.StorageSharedKeyCredential(
                      accountname,
                      key
                    );
                    let blobName = createPdf.data.data;

                    const blobServiceClient =
                      BlobServiceClient.fromConnectionString(
                        process.env.AZURE_STORAGE_CONNECTION_STRING
                      );
                    const containerClient =
                      blobServiceClient.getContainerClient(containerName);
                    const blobClient = await containerClient.getBlobClient(
                      blobName
                    );
                    var repla = blobClient.url.replace(
                      "https://supportings.blob.core.windows.net",
                      "https://fcreceipt.zenqore.com"
                    );
                    let minUrl = repla;
                    // let getData = await getBlobData(
                    //   containerName,
                    //   createPdf.data.data
                    // );

                    // return res.status(200).json({ data: blobClient.url });
                    let qrCod = await generateQrCode(minUrl);
                    const successReceipt1 = await receiptPdf(
                      orgDetails,
                      feesAll,
                      feeTableHeader,
                      rcptId,
                      inputData.type,
                      qrCod,
                      minUrl
                    );

                    let obje1 = {
                      html: successReceipt1,
                    };
                    let createPdf1 = await axios.post(
                      process.env.externalServer,
                      obje1
                    );
                    dbConnection1.close();
                    let title;
                    if (inputData.type == "receipt") {
                      title = "ZQ EDU-Receipt";
                    } else {
                      title = "ZQ EDU-Acknowledgement";
                    }
                    sendEmail(
                      orgDetails.emailServer[0].emailServer,
                      inputData.emailCommunicationRefIds,
                      orgDetails.emailServer[0].emailAddress,
                      title,
                      emailTemplate1,
                      createPdf1.data.file
                    )
                      .then((data) => {
                        dbConnection1.close();
                        commonPostNotification(
                          `${inputData.data.orgId}`,
                          "success",
                          "transaction_collectPayment",
                          `Payment done successfully for the student ${
                            inputData.studentName
                          } of ${Number(inputData.amount).toLocaleString(
                            "en-IN",
                            {
                              style: "currency",
                              currency: "INR",
                            }
                          )}`
                        );
                        res.status(200).json({
                          status: "success",
                          message: "Receipt sent successfully",
                          data: paymentData,
                          receiptKey: createPdf.data.data,
                          receiptId: rcptId,
                        });
                      })
                      .catch((err) => {
                        dbConnection1.close();
                        res.status(500).send({
                          status: "failure",
                          message: "failed to send receipt email",
                          data: err,
                        });
                      });
                  } else {
                    return res.status(400).json({
                      status: "failure",
                      message: "Student Fees mapping not updated",
                      Error: err,
                    });
                  }
                }
              );
            }
          }
        })
        .catch((err) => {
          console.log(err);
          // centralDbConnection.close();
          dbConnection.close();
          res.status(500).send(err);
        });
    }
  })
  .catch((err) => {
    console.log(err);
    // centralDbConnection.close();
    dbConnection.close();
    res.status(500).send(err);
  });
