const DEMO_TRANSPORTS = {
  FL001: {
    id: "FL001",
    type: "FLIGHT",
    operator: "TravelGuard Demo Air",
    serviceNumber: "FL001",
    status: "ON_TIME",
    delayMinutes: 0,
    scheduledDeparture: "2026-09-26T10:00:00+05:30",
    scheduledArrival: "2026-09-26T12:00:00+05:30",
    origin: { code: "BOM", name: "Mumbai Airport", city: "Mumbai" },
    destination: { code: "DEL", name: "Delhi Airport", city: "Delhi" },
    durationMinutes: 120,
    distanceKm: 1148
  },
  TR001: {
    id: "TR001",
    type: "TRAIN",
    operator: "TravelGuard Demo Rail",
    serviceNumber: "TR001",
    status: "ON_TIME",
    delayMinutes: 0,
    scheduledDeparture: "2026-09-26T14:00:00+05:30",
    scheduledArrival: "2026-09-26T18:00:00+05:30",
    origin: { code: "DEL", name: "Delhi Airport", city: "Delhi" },
    destination: { code: "JP", name: "Jaipur Junction", city: "Jaipur" },
    durationMinutes: 240,
    distanceKm: 280
  }
};

function getDemoTransport(id) {
  return DEMO_TRANSPORTS[id] || null;
}

module.exports = { getDemoTransport };
