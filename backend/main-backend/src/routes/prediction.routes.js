const express = require("express");

const controller =
  require("../controllers/prediction.controller");

const router = express.Router();

router.post(
  "/delay",
  controller.predictDelay
);

module.exports = router;