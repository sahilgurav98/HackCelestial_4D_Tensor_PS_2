const express = require("express");

const controller =
  require("../controllers/journey.controller");

const router = express.Router();

router.post(
  "/",
  controller.registerJourney
);

router.get(
  "/:tripId/dependencies",
  controller.getDependencies
);

module.exports = router;