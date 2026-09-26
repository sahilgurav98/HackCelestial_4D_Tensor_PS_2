const trains = [
  {
    id: "TR001", type: "TRAIN", operator: "Indian Rail Demo", serviceNumber: "TG1201",
    origin: { code: "NDLS", name: "Delhi", city: "Delhi" },
    destination: { code: "JP", name: "Jaipur", city: "Jaipur" },
    scheduledDeparture: "2026-10-10T14:00:00+05:30",
    scheduledArrival: "2026-10-10T18:00:00+05:30",
    actualDeparture: null, actualArrival: null, status: "ON_TIME", delayMinutes: 0,
    distanceKm: 300, durationMinutes: 240,
    metadata: { trainType: "EXPRESS", classes: ["SL", "3A", "2A"], numberOfStops: 5 },
    mlFeatures: {
      transportType: "TRAIN", operator: "Indian Rail Demo", origin: "NDLS", destination: "JP",
      scheduledDeparture: "2026-10-10T14:00:00+05:30", scheduledArrival: "2026-10-10T18:00:00+05:30",
      departureHour: 14, dayOfWeek: 6, month: 10, distanceKm: 300, durationMinutes: 240,
      historicalAverageDelayMinutes: 24, historicalCancellationRate: 0.01, currentDelayMinutes: 0,
      weatherRisk: "LOW", routeCongestionRisk: "MEDIUM", numberOfStops: 5,
      trainType: "EXPRESS", delayReason: null
    }
  },
  {
    id: "TR002", type: "TRAIN", operator: "Indian Rail Demo", serviceNumber: "TG1202",
    origin: { code: "NDLS", name: "Delhi", city: "Delhi" },
    destination: { code: "JP", name: "Jaipur", city: "Jaipur" },
    scheduledDeparture: "2026-10-10T16:30:00+05:30",
    scheduledArrival: "2026-10-10T21:00:00+05:30",
    actualDeparture: null, actualArrival: null, status: "ON_TIME", delayMinutes: 0,
    distanceKm: 300, durationMinutes: 270,
    metadata: { trainType: "EXPRESS", classes: ["SL", "3A", "2A"], numberOfStops: 6 },
    mlFeatures: {
      transportType: "TRAIN", operator: "Indian Rail Demo", origin: "NDLS", destination: "JP",
      scheduledDeparture: "2026-10-10T16:30:00+05:30", scheduledArrival: "2026-10-10T21:00:00+05:30",
      departureHour: 16, dayOfWeek: 6, month: 10, distanceKm: 300, durationMinutes: 270,
      historicalAverageDelayMinutes: 18, historicalCancellationRate: 0.02, currentDelayMinutes: 0,
      weatherRisk: "LOW", routeCongestionRisk: "MEDIUM", numberOfStops: 6,
      trainType: "EXPRESS", delayReason: null
    }
  },
  {
    id: "TR003", type: "TRAIN", operator: "Indian Rail Demo", serviceNumber: "TG1203",
    origin: { code: "NDLS", name: "Delhi", city: "Delhi" },
    destination: { code: "JP", name: "Jaipur", city: "Jaipur" },
    scheduledDeparture: "2026-10-10T18:00:00+05:30",
    scheduledArrival: "2026-10-10T22:30:00+05:30",
    actualDeparture: null, actualArrival: null, status: "ON_TIME", delayMinutes: 0,
    distanceKm: 300, durationMinutes: 270,
    metadata: { trainType: "EXPRESS", classes: ["SL", "3A", "2A"], numberOfStops: 7 },
    mlFeatures: {
      transportType: "TRAIN", operator: "Indian Rail Demo", origin: "NDLS", destination: "JP",
      scheduledDeparture: "2026-10-10T18:00:00+05:30", scheduledArrival: "2026-10-10T22:30:00+05:30",
      departureHour: 18, dayOfWeek: 6, month: 10, distanceKm: 300, durationMinutes: 270,
      historicalAverageDelayMinutes: 30, historicalCancellationRate: 0.03, currentDelayMinutes: 0,
      weatherRisk: "MEDIUM", routeCongestionRisk: "HIGH", numberOfStops: 7,
      trainType: "EXPRESS", delayReason: null
    }
  }
];

module.exports = trains;
