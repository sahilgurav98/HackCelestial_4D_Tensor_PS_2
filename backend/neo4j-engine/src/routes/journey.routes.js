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

router.get(
  "/:tripId/affected",
  controller.getAffected
);

router.get(
  "/:tripId/recovery",
  controller.getRecovery
);

router.post(
  "/:tripId/simulate-delay",
  controller.simulateDelay
);

router.post(
  "/:tripId/recovery/select",
  controller.selectRecovery
);

module.exports = router;
