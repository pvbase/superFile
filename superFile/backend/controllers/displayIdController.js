const { createDatabase } = require("../utils/db_creation");
const FeeTypeSchema = require("../models/feeTypeModel");
async function getDisplayId(type, dbName, dbUrl) {
  console.log("env", process.env.central_mongoDbUrl);
  // const { id } = req.query
  let dbConnection = await createDatabase(dbName, dbUrl);
  var getDatas = [];
  var transType = "";
  if (type == "feeTypes") {
    let feeTypeModel = dbConnection.model("feeTypes", FeeTypeSchema);
    // getDatas = await paymentScheduleModel.find({ parentId: id })
    getDatas = await feeTypeModel.find({});
    transType = "FT";
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
  //   res.status(200).send({
  //     status: "success",
  //     message: `ID generated`,
  //     data: finalVal,
  //   });
}

module.exports = { getDisplayId: getDisplayId };
