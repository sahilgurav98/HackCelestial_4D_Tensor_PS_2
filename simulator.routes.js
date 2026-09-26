const express = require("express");
const controller = require("../controllers/flight.controller");

const router = express.Router();

router.post("/flights/:flightId/delay", controller.applyDelay);
router.post("/reset", controller.resetSimulator);

module.exports = router;
