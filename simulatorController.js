const trainService = require("../services/trainService");
const flightSimulator = require("../simulator/flightSimulator");
const { successResponse } = require("../utils/response");

function resetAllSimulators(req, res) {
  trainService.resetTrains();
  flightSimulator.reset();
  return successResponse(res, { message: "Train and flight simulators reset successfully" });
}

module.exports = { resetAllSimulators };
