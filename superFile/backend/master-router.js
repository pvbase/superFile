const express = require("express");
const { createEntity } = require("./controllers/entityController");
const router = express.Router();

const { createMaster, getMaster, updateMaster, getDisplayId, dueDateCalculation, installmentDueDateCalculation } = require('./controllers/masterManagementController')
//entity management
router.post("/entity", createEntity)

router.post("/:type", createMaster)
router.get("/:type", getMaster)
router.put("/:type", updateMaster)
router.get("/getDisplayId/:type", getDisplayId)
router.get("/paymentSchedule/dueDateCalculation", dueDateCalculation)
router.get("/paymentSchedule/installmentDueDateCalculation", installmentDueDateCalculation)

module.exports = router