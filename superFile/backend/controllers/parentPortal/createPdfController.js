const axios = require("axios");
exports.applicationReceipt = async function (req, res) {

  let inputData = req.body;
  let moneyString = inputData.applicationFees
  let newMoney = ''
  if (!String(moneyString).includes('.')) {
    newMoney = Number(moneyString) * 100
  }
  else {
    let moneyArr = String(moneyString).split(".")
    newMoney = moneyArr[0] + moneyArr[1] + (moneyArr[1] != null && moneyArr[1].length == 1 ? "0" : "")
  }
  console.log('Create PDF Controller Money', parseInt(newMoney));
  let payload = {
    email: inputData.email,
    academicYear: inputData.academicYear,
    applicationId: inputData.applicationId,
    transactionId: inputData.transactionId,
    studentName: inputData.studentName,
    class: inputData.class,
    applicationFees: parseInt(newMoney),
    mode: inputData.mode.toUpperCase(),
    currencyCode: inputData.currencyCode,
    programPlan: inputData.programPlan,
  };
  axios
    .post(process.env.receiptAPI + "?institute=" + req.query.institute, payload)
    .then(function (response) {
      res.status(200).json(response.data);
    })
    .catch(function (error) {
      res.status(400).json({ Message: "Failed", Error: error });
    });
};
