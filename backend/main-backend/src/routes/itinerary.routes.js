const express = require("express");

const controller =
  require("../controllers/itinerary.controller");

const router = express.Router();

router.post(
  "/",
  controller.createItinerary
);

router.get(
  "/",
  controller.listItineraries
);

router.get(
  "/:tripId",
  controller.getItinerary
);

router.get(
  "/:tripId/dependencies",
  controller.getDependencies
);

router.get(
  "/:tripId/status",
  controller.getStatus
);

router.post(
  "/:tripId/check-disruption",
  controller.checkDisruption
);

router.post(
  "/:tripId/monitor",
  controller.monitorItinerary
);

router.post(
  "/:tripId/simulate-delay",
  controller.simulateDelay
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
  "/:tripId/recovery/select",
  controller.selectRecovery
);

module.exports = router;
