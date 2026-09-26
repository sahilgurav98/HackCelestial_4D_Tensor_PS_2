const fs = require("fs");
const path = require("path");

const flightData = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "flights.json"), "utf8"));
const flightHistory = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "flight-history.json"), "utf8"));
const trainData = require("../trains");
const trainHistory = require("../trainHistory");

const DEMO_OVERRIDES = {
  FL001: {
    operator: "TravelGuard Demo Air",
    serviceNumber: "FL001",
    scheduledDeparture: "2026-09-26T10:00:00+05:30",
    scheduledArrival: "2026-09-26T12:00:00+05:30",
    origin: { code: "BOM", name: "Mumbai Airport", city: "Mumbai" },
    destination: { code: "DEL", name: "Delhi Airport", city: "Delhi" },
    durationMinutes: 120
  },
  TR001: {
    operator: "TravelGuard Demo Rail",
    serviceNumber: "TR001",
    scheduledDeparture: "2026-09-26T14:00:00+05:30",
    scheduledArrival: "2026-09-26T18:00:00+05:30",
    origin: { code: "DEL", name: "Delhi Airport", city: "Delhi" },
    destination: { code: "JP", name: "Jaipur Junction", city: "Jaipur" },
    durationMinutes: 240
  },
  TR002: { scheduledDeparture: "2026-09-26T16:30:00+05:30", scheduledArrival: "2026-09-26T21:00:00+05:30" },
  TR003: { scheduledDeparture: "2026-09-26T18:00:00+05:30", scheduledArrival: "2026-09-26T22:30:00+05:30" }
};

const initialExtraTransports = [{
  id: "BUS001", type: "BUS", operator: "TravelGuard Demo Coach", serviceNumber: "BUS001",
  origin: { code: "DEL", name: "Delhi", city: "Delhi" }, destination: { code: "JP", name: "Jaipur", city: "Jaipur" },
  scheduledDeparture: "2026-09-26T17:00:00+05:30", scheduledArrival: "2026-09-26T23:00:00+05:30",
  actualDeparture: null, actualArrival: null, status: "ON_TIME", delayMinutes: 0, distanceKm: 280, durationMinutes: 360
}];
const extraTransports = clone(initialExtraTransports);

const initial = {
  FLIGHT: clone(flightData),
  TRAIN: clone(trainData)
};
const current = {
  FLIGHT: clone(flightData),
  TRAIN: clone(trainData)
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canonicalCode(code) {
  const value = String(code || "").toUpperCase();
  return value === "NDLS" ? "DEL" : value;
}

function normalizeTransport(transport) {
  const result = { ...clone(transport), ...(DEMO_OVERRIDES[transport.id] || {}) };
  result.type = result.type || "TRAIN";
  result.origin = result.origin || {};
  result.destination = result.destination || {};
  result.origin.code = canonicalCode(result.origin.code);
  result.destination.code = canonicalCode(result.destination.code);
  result.status = result.status || "ON_TIME";
  result.delayMinutes = Number(result.delayMinutes || 0);
  result.actualDeparture = result.actualDeparture || null;
  result.actualArrival = result.actualArrival || null;
  return result;
}

function all(type) {
  const types = type ? [type.toUpperCase()] : ["FLIGHT", "TRAIN"];
  const regular = types.flatMap((item) => (current[item] || []).map(normalizeTransport));
  return regular.concat(!type || type.toUpperCase() === "BUS" ? extraTransports.map(normalizeTransport) : []);
}

function byId(id) {
  const value = String(id || "").toUpperCase();
  return all().find((transport) => transport.id.toUpperCase() === value) || null;
}

function search({ type, origin, destination }) {
  const originCode = origin ? canonicalCode(origin) : null;
  const destinationCode = destination ? canonicalCode(destination) : null;
  return all(type).filter((transport) =>
    (!originCode || canonicalCode(transport.origin.code) === originCode) &&
    (!destinationCode || canonicalCode(transport.destination.code) === destinationCode)
  );
}

function historyFor(id) {
  const value = String(id || "").toUpperCase();
  return [...flightHistory, ...trainHistory].filter((record) =>
    String(record.transportId || "").toUpperCase() === value
  ).map(clone);
}

function history() {
  return [...flightHistory, ...trainHistory].map(clone);
}

function addMinutes(value, minutes) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function applyDelay(id, delayMinutes) {
  const value = String(id || "").toUpperCase();
  const transport = [...current.FLIGHT, ...current.TRAIN, ...extraTransports].find((item) => item.id.toUpperCase() === value);
  if (!transport) return null;
  transport.delayMinutes = delayMinutes;
  transport.status = delayMinutes > 0 ? "DELAYED" : "ON_TIME";
  transport.actualDeparture = delayMinutes > 0 ? addMinutes(transport.scheduledDeparture, delayMinutes) : null;
  transport.actualArrival = delayMinutes > 0 ? addMinutes(transport.scheduledArrival, delayMinutes) : null;
  if (transport.mlFeatures) transport.mlFeatures.currentDelayMinutes = delayMinutes;
  return normalizeTransport(transport);
}

function reset() {
  current.FLIGHT = clone(initial.FLIGHT);
  current.TRAIN = clone(initial.TRAIN);
  extraTransports.splice(0, extraTransports.length, ...clone(initialExtraTransports));
}

module.exports = { all, byId, search, historyFor, history, applyDelay, reset, normalizeTransport };
