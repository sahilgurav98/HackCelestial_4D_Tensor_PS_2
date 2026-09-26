const express = require("express");
const trainController = require("../controllers/trainController");
const flightController = require("../controllers/flight.controller");
const simulatorController = require("../controllers/simulatorController");

const router = express.Router();

router.post("/trains/:trainId/delay", trainController.simulateDelay);
router.post("/flights/:flightId/delay", flightController.applyDelay);
router.post("/reset", simulatorController.resetAllSimulators);

module.exports = router;
