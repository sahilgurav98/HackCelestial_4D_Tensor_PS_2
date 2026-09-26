const fs = require("fs");
const path = require("path");

const flights = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "flights.json"), "utf8"));
const trains = require("../trains");
const BASE_DATE = "2026-09-26";
const TICK_MINUTES = Number(process.env.SIMULATION_STEP_MINUTES || 5);
const AUTO_TICK_MS = Number(process.env.SIMULATION_TICK_MS || 300000);
const scenario = [0, 0, 12, 28, 45, 80, 100, 65, 30, 0];

function place(code, name, city) { return { code, name, city }; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function code(value) { return String(value || "").toUpperCase() === "NDLS" ? "DEL" : String(value || "").toUpperCase(); }
function plusMinutes(value, minutes) { const date = new Date(value); date.setMinutes(date.getMinutes() + minutes); return date.toISOString(); }

const overrides = {
  FL001: { type: "FLIGHT", operator: "TravelGuard Airways", serviceNumber: "TG 401", origin: place("BOM", "Mumbai Airport", "Mumbai"), destination: place("DEL", "Delhi Airport", "Delhi"), scheduledDeparture: `${BASE_DATE}T10:00:00+05:30`, scheduledArrival: `${BASE_DATE}T12:00:00+05:30`, durationMinutes: 120 },
  TR001: { type: "TRAIN", operator: "TravelGuard Rail", serviceNumber: "TG 201", origin: place("DEL", "New Delhi", "Delhi"), destination: place("JP", "Jaipur Junction", "Jaipur"), scheduledDeparture: `${BASE_DATE}T14:00:00+05:30`, scheduledArrival: `${BASE_DATE}T18:00:00+05:30`, durationMinutes: 240 },
  TR002: { type: "TRAIN", operator: "TravelGuard Rail", serviceNumber: "TG 203", origin: place("DEL", "New Delhi", "Delhi"), destination: place("JP", "Jaipur Junction", "Jaipur"), scheduledDeparture: `${BASE_DATE}T16:30:00+05:30`, scheduledArrival: `${BASE_DATE}T21:00:00+05:30`, durationMinutes: 270 },
  TR003: { type: "TRAIN", operator: "TravelGuard Rail", serviceNumber: "TG 205", origin: place("DEL", "New Delhi", "Delhi"), destination: place("JP", "Jaipur Junction", "Jaipur"), scheduledDeparture: `${BASE_DATE}T18:00:00+05:30`, scheduledArrival: `${BASE_DATE}T22:30:00+05:30`, durationMinutes: 270 }
};

function normalise(source, type) {
  const custom = overrides[source.id] || {};
  const item = { ...clone(source), ...custom, type: custom.type || source.type || type, origin: { ...(source.origin || {}), ...(custom.origin || {}) }, destination: { ...(source.destination || {}), ...(custom.destination || {}) }, status: "ON_TIME", delayMinutes: 0, actualDeparture: null, actualArrival: null, reliabilityScore: source.reliabilityScore || 92 };
  item.origin.code = code(item.origin.code); item.destination.code = code(item.destination.code); return item;
}
function generated(id, type, operator, origin, destination, departure, arrival) { return { id, type, operator, serviceNumber: id, origin, destination, scheduledDeparture: `${BASE_DATE}T${departure}:00+05:30`, scheduledArrival: `${BASE_DATE}T${arrival}:00+05:30`, durationMinutes: Math.round((new Date(`${BASE_DATE}T${arrival}:00+05:30`) - new Date(`${BASE_DATE}T${departure}:00+05:30`)) / 60000), status: "ON_TIME", delayMinutes: 0, actualDeparture: null, actualArrival: null, reliabilityScore: 88 }; }

const base = [...flights.map((item) => normalise(item, "FLIGHT")), ...trains.map((item) => normalise(item, "TRAIN")), generated("FL002", "FLIGHT", "TravelGuard Airways", place("BOM", "Mumbai Airport", "Mumbai"), place("DEL", "Delhi Airport", "Delhi"), "11:15", "13:20"), generated("FL003", "FLIGHT", "TravelGuard Airways", place("BLR", "Kempegowda Airport", "Bengaluru"), place("DEL", "Delhi Airport", "Delhi"), "09:10", "11:55"), generated("TR004", "TRAIN", "TravelGuard Rail", place("DEL", "New Delhi", "Delhi"), place("JP", "Jaipur Junction", "Jaipur"), "19:15", "23:40"), generated("TR005", "TRAIN", "TravelGuard Rail", place("JP", "Jaipur Junction", "Jaipur"), place("DEL", "New Delhi", "Delhi"), "08:30", "13:05"), generated("BUS001", "BUS", "TravelGuard Coach", place("DEL", "Delhi ISBT", "Delhi"), place("JP", "Jaipur Central", "Jaipur"), "17:00", "23:00")];
let state = clone(base); let history = []; let tickNumber = 0; let updatedAt = new Date().toISOString();
function metadata() { return { tick: tickNumber, updatedAt, nextUpdateAt: new Date(new Date(updatedAt).getTime() + AUTO_TICK_MS).toISOString(), intervalMinutes: TICK_MINUTES, transportCount: state.length }; }
function publicTransport(item) { return { ...clone(item), simulation: { ...metadata(), source: "SYNTHETIC_REALTIME" } }; }
function snapshot(item, reason) { history.unshift({ transportId: item.id, capturedAt: updatedAt, tick: tickNumber, reason, delayMinutes: item.delayMinutes, status: item.status, features: { hour: new Date(item.scheduledDeparture).getUTCHours(), reliabilityScore: item.reliabilityScore, congestionIndex: Math.min(100, 18 + tickNumber * 7), weatherRisk: tickNumber >= 4 ? "MODERATE" : "LOW" } }); history = history.slice(0, 1000); }
function setDelay(item, delay, reason) { item.delayMinutes = Number(delay); item.status = item.delayMinutes ? "DELAYED" : "ON_TIME"; item.actualDeparture = item.delayMinutes ? plusMinutes(item.scheduledDeparture, item.delayMinutes) : null; item.actualArrival = item.delayMinutes ? plusMinutes(item.scheduledArrival, item.delayMinutes) : null; snapshot(item, reason); return publicTransport(item); }
function tick() { tickNumber += 1; updatedAt = new Date().toISOString(); const monitored = state.find((item) => item.id === "FL001"); if (monitored) setDelay(monitored, scenario[tickNumber % scenario.length], "AUTO_TICK"); state.filter((item) => item.id !== "FL001").forEach((item) => snapshot(item, "AUTO_TICK")); return metadata(); }
function all(type) { return state.filter((item) => !type || item.type === String(type).toUpperCase()).map(publicTransport); }
function byId(id) { const item = state.find((entry) => entry.id.toUpperCase() === String(id).toUpperCase()); return item ? publicTransport(item) : null; }
function search({ type, origin, destination } = {}) { return all(type).filter((item) => (!origin || item.origin.code === code(origin)) && (!destination || item.destination.code === code(destination))); }
function historyFor(id) { return history.filter((item) => item.transportId === String(id).toUpperCase()).map(clone); }
function applyDelay(id, delay) { const item = state.find((entry) => entry.id.toUpperCase() === String(id).toUpperCase()); return item ? setDelay(item, delay, "MANUAL") : null; }
function reset() { state = clone(base); history = []; tickNumber = 0; updatedAt = new Date().toISOString(); }
function startClock() { return setInterval(tick, AUTO_TICK_MS); }
module.exports = { all, byId, search, history: () => clone(history), historyFor, applyDelay, reset, tick, metadata, startClock };
