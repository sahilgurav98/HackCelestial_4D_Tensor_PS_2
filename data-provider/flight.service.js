const fs = require("fs");
const path = require("path");

const flightsPath = path.join(__dirname, "..", "data", "flights.json");
const historyPath = path.join(__dirname, "..", "data", "flight-history.json");

const initialFlights = JSON.parse(fs.readFileSync(flightsPath, "utf8"));
const historyRecords = JSON.parse(fs.readFileSync(historyPath, "utf8"));

let currentFlights = deepClone(initialFlights);

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getAllFlights() {
  return deepClone(currentFlights);
}

function getFlightById(flightId) {
  const flight = currentFlights.find(
    (item) => item.id.toLowerCase() === String(flightId).toLowerCase()
  );

  return flight ? deepClone(flight) : null;
}

function searchFlights({ origin, destination }) {
  const originCode = origin ? String(origin).toUpperCase() : null;
  const destinationCode = destination
    ? String(destination).toUpperCase()
    : null;

  return currentFlights
    .filter((flight) => {
      const matchesOrigin =
        !originCode || flight.origin.code.toUpperCase() === originCode;
      const matchesDestination =
        !destinationCode ||
        flight.destination.code.toUpperCase() === destinationCode;

      return matchesOrigin && matchesDestination;
    })
    .map(deepClone);
}

function getAllHistory() {
  return deepClone(historyRecords);
}

function getFlightHistory(flightId) {
  return historyRecords
    .filter(
      (record) =>
        record.transportId.toLowerCase() === String(flightId).toLowerCase()
    )
    .map(deepClone);
}

function replaceCurrentFlights(flights) {
  currentFlights = deepClone(flights);
}

function getInitialFlights() {
  return deepClone(initialFlights);
}

module.exports = {
  getAllFlights,
  getFlightById,
  searchFlights,
  getAllHistory,
  getFlightHistory,
  replaceCurrentFlights,
  getInitialFlights,
};
