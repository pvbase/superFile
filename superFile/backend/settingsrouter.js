const express = require("express");
const router = express.Router();

const { settings,settingsget,settingsput,settingsfee } = require("./controllers/settings");

router.post("/settings", settings)
router.get("/settings", settingsget)
router.put("/settings/:instituteid", settingsput)

router.get("/feescollectionhistory",settingsfee )


module.exports = router