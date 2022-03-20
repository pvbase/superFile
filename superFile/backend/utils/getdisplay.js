const FeeManagerSchema = require("../models/feesManagerModel");
const { createDatabase } = require("./db_creation");

async function getDisplayId(type, dbUrl) {
  let dbConnection = await createDatabase("admin", dbUrl);
  var getDatas = [];
  var transType = "";
  if (type == "paymentSchedule") {
    let paymentScheduleModel = dbConnection.model(
      "paymentSchedule",
      PaymentScheduleSchema
    );
    // getDatas = await paymentScheduleModel.find({ parentId: id })
    getDatas = await paymentScheduleModel.find({});
    transType = "PSCH";
  } else if (type == "installments") {
    let installmentSchema = dbConnection.model(
      "installments",
      InstallmentSchema
    );
    getDatas = await installmentSchema.find({});
    transType = "INST";
  } else if (type == "feesManager") {
    let feeManagerModel = dbConnection.model("feesManager", FeeManagerSchema);
    getDatas = await feeManagerModel.find({});
    transType = "FM";
  }
  var date = new Date();
  var month = date.getMonth();
  var finYear = "";
  if (month > 2) {
    var current = date.getFullYear();
    var prev = Number(date.getFullYear()) + 1;
    prev = String(prev).substr(String(prev).length - 2);
    finYear = `${current}-${prev}`;
  } else {
    var current = date.getFullYear();
    current = String(current).substr(String(current).length - 2);
    var prev = Number(date.getFullYear()) - 1;
    finYear = `${prev}-${current}`;
  }
  let initial = `${transType}/${finYear}/001`;
  let dataArr = [];
  let check;
  let finalVal;
  const sortAlphaNum = (a, b) => a.localeCompare(b, "en", { numeric: true });
  getDatas.forEach((el) => {
    if (el["displayName"]) {
      let filStr = el["displayName"].split("/");
      let typeStr = filStr[0];
      let typeYear = filStr[1];
      if (typeStr == transType && typeYear == finYear) {
        check = true;
        dataArr.push(el["displayName"]);
      }
    }
  });
  if (!check) {
    finalVal = initial;
  } else {
    let lastCount = dataArr.sort(sortAlphaNum)[dataArr.length - 1].split("/");
    let lastCountNo = Number(lastCount[2]) + 1;
    if (lastCountNo.toString().length == 1) lastCountNo = "00" + lastCountNo;
    if (lastCountNo.toString().length == 2) lastCountNo = "0" + lastCountNo;
    lastCount[2] = lastCountNo;
    finalVal = lastCount.join("/");
  }
  return finalVal;
}

module.exports = { getDisplayId };
