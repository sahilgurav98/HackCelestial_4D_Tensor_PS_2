const express = require("express");
const controller = require("../controllers/flight.controller");

const router = express.Router();

// Static routes must appear before /:flightId.
router.get("/search", controller.searchFlights);
router.get("/history", controller.getAllHistory);

router.get("/:flightId/status", controller.getFlightStatus);
router.get("/:flightId/history", controller.getFlightHistory);
router.get("/:flightId", controller.getFlightById);
router.get("/", controller.getAllFlights);

module.exports = router;
