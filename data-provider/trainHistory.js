// Synthetic demo data only; these are not official railway records.
const trains = require("./trains");
const weatherRisks = ["LOW", "MEDIUM", "HIGH"];
const congestionRisks = ["LOW", "MEDIUM", "HIGH"];
const delayReasons = ["NONE", "WEATHER", "CONGESTION", "TECHNICAL", "OPERATIONAL"];

const trainHistory = Array.from({ length: 250 }, (_, index) => {
  const i = index + 1;
  const train = trains[index % trains.length];
  const day = ((index % 28) + 1);
  const date = new Date(Date.UTC(2026, 8, day));
  const dateString = date.toISOString().slice(0, 10);
  const departureTime = train.scheduledDeparture.slice(11, 19);
  const arrivalTime = train.scheduledArrival.slice(11, 19);
  const departureHour = Number(departureTime.slice(0, 2));
  const delayMinutes = (i * 7) % 121;
  const cancelled = i % 50 === 0;

  return {
    recordId: `TH${String(i).padStart(4, "0")}`,
    transportId: train.id,
    date: dateString,
    originCode: train.origin.code,
    destinationCode: train.destination.code,
    scheduledDeparture: `${dateString}T${departureTime}+05:30`,
    scheduledArrival: `${dateString}T${arrivalTime}+05:30`,
    departureHour,
    dayOfWeek: date.getUTCDay(),
    month: date.getUTCMonth() + 1,
    distanceKm: train.distanceKm,
    durationMinutes: train.durationMinutes,
    weatherRisk: weatherRisks[index % weatherRisks.length],
    routeCongestionRisk: congestionRisks[(index + 1) % congestionRisks.length],
    delayMinutes,
    cancelled,
    delayReason: delayReasons[index % delayReasons.length],
    dataSource: "SYNTHETIC_DEMO"
  };
});

module.exports = trainHistory;
