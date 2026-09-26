const flightService = require("../services/flight.service");
const simulator = require("../simulator/flightSimulator");

function sendNotFound(res, code, message) {
  return res.status(404).json({
    success: false,
    error: { code, message },
  });
}

function getAllFlights(req, res) {
  return res.json({
    success: true,
    data: flightService.getAllFlights(),
  });
}

function getFlightById(req, res) {
  const flight = flightService.getFlightById(req.params.flightId);

  if (!flight) {
    return sendNotFound(
      res,
      "FLIGHT_NOT_FOUND",
      `Flight ${req.params.flightId} was not found`
    );
  }

  return res.json({ success: true, data: flight });
}

function searchFlights(req, res) {
  const { origin, destination } = req.query;

  const flights = flightService.searchFlights({ origin, destination });

  return res.json({
    success: true,
    data: flights,
  });
}

function getFlightStatus(req, res) {
  const flight = flightService.getFlightById(req.params.flightId);

  if (!flight) {
    return sendNotFound(
      res,
      "FLIGHT_NOT_FOUND",
      `Flight ${req.params.flightId} was not found`
    );
  }

  return res.json({
    success: true,
    data: {
      id: flight.id,
      status: flight.status,
      delayMinutes: flight.delayMinutes,
      actualDeparture: flight.actualDeparture,
      actualArrival: flight.actualArrival,
    },
  });
}

function getFlightHistory(req, res) {
  const flight = flightService.getFlightById(req.params.flightId);

  if (!flight) {
    return sendNotFound(
      res,
      "FLIGHT_NOT_FOUND",
      `Flight ${req.params.flightId} was not found`
    );
  }

  return res.json({
    success: true,
    data: flightService.getFlightHistory(req.params.flightId),
  });
}

function getAllHistory(req, res) {
  return res.json({
    success: true,
    data: flightService.getAllHistory(),
  });
}

function applyDelay(req, res) {
  const { flightId } = req.params;
  const { delayMinutes } = req.body;

  if (
    typeof delayMinutes !== "number" ||
    !Number.isFinite(delayMinutes) ||
    !Number.isInteger(delayMinutes) ||
    delayMinutes < 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_DELAY",
        message: "delayMinutes must be a non-negative integer",
      },
    });
  }

  const flight = simulator.applyDelay(flightId, delayMinutes);

  if (!flight) {
    return sendNotFound(
      res,
      "FLIGHT_NOT_FOUND",
      `Flight ${flightId} was not found`
    );
  }

  return res.json({
    success: true,
    data: flight,
  });
}

function resetSimulator(req, res) {
  simulator.reset();

  return res.json({
    success: true,
    data: {
      message: "Flight simulator reset successfully",
    },
  });
}

module.exports = {
  getAllFlights,
  getFlightById,
  searchFlights,
  getFlightStatus,
  getFlightHistory,
  getAllHistory,
  applyDelay,
  resetSimulator,
};
