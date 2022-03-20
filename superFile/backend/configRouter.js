const express = require("express");
const router = express.Router();
const { getClientDetails, internalLogin } = require("./controllers/instituteManagement/instituteManagement");
const { createInstitute } = require("./instituteInitialize");

//Institute Creation
router.post("/institute", createInstitute);
router.get("/institute", getClientDetails);
router.post("/institute/internalLogin", internalLogin);

module.exports = router;
