const flightService = require("../services/flight.service");

const ALLOWED_STATUSES = new Set([
  "ON_TIME",
  "DELAYED",
  "CANCELLED",
  "COMPLETED",
]);

function parseDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return date;
}

function addMinutes(isoDate, minutes) {
  const date = parseDate(isoDate);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function applyDelay(flightId, delayMinutes) {
  const flights = flightService.getAllFlights();
  const index = flights.findIndex(
    (flight) => flight.id.toLowerCase() === String(flightId).toLowerCase()
  );

  if (index === -1) {
    return null;
  }

  const flight = flights[index];

  if (!ALLOWED_STATUSES.has(flight.status)) {
    throw new Error(`Unsupported flight status: ${flight.status}`);
  }

  if (flight.status === "CANCELLED") {
    return flight;
  }

  flight.delayMinutes = delayMinutes;

  if (delayMinutes > 0) {
    flight.status = "DELAYED";
    flight.actualDeparture = addMinutes(
      flight.scheduledDeparture,
      delayMinutes
    );
    flight.actualArrival = addMinutes(
      flight.scheduledArrival,
      delayMinutes
    );
  } else {
    flight.status = "ON_TIME";
    flight.actualDeparture = null;
    flight.actualArrival = null;
  }

  flights[index] = flight;
  flightService.replaceCurrentFlights(flights);

  return flight;
}

function reset() {
  flightService.replaceCurrentFlights(flightService.getInitialFlights());
}

module.exports = {
  applyDelay,
  reset,
  ALLOWED_STATUSES,
};
