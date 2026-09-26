const express = require("express");
const cors = require("cors");
const transport = require("./transport.service");

const app = express();
app.use(cors());
app.use(express.json());

function success(res, data) {
  return res.json({ success: true, data });
}

function failure(res, status, code, message) {
  return res.status(status).json({ success: false, error: { code, message } });
}

app.get("/health", (req, res) => success(res, { service: "travelguard-data-provider", status: "healthy" }));

app.get("/api/transports", (req, res) => success(res, transport.search(req.query)));
app.get("/api/transports/search", (req, res) => success(res, transport.search(req.query)));
app.get("/api/transports/history", (req, res) => success(res, { dataSource: "SYNTHETIC_DEMO", records: transport.history() }));
app.get("/api/transports/:id/status", (req, res) => {
  const item = transport.byId(req.params.id);
  if (!item) return failure(res, 404, "TRANSPORT_NOT_FOUND", `Transport ${req.params.id} was not found`);
  return success(res, { id: item.id, type: item.type, status: item.status, delayMinutes: item.delayMinutes, actualDeparture: item.actualDeparture, actualArrival: item.actualArrival });
});
app.get("/api/transports/:id/history", (req, res) => success(res, transport.historyFor(req.params.id)));
app.get("/api/transports/:id", (req, res) => {
  const item = transport.byId(req.params.id);
  return item ? success(res, item) : failure(res, 404, "TRANSPORT_NOT_FOUND", `Transport ${req.params.id} was not found`);
});

app.get("/api/flights", (req, res) => success(res, transport.search({ ...req.query, type: "FLIGHT" })));
app.get("/api/flights/:id", (req, res) => {
  const item = transport.byId(req.params.id);
  return item?.type === "FLIGHT" ? success(res, item) : failure(res, 404, "FLIGHT_NOT_FOUND", `Flight ${req.params.id} was not found`);
});
app.get("/api/trains", (req, res) => success(res, transport.search({ ...req.query, type: "TRAIN" })));
app.get("/api/trains/:id", (req, res) => {
  const item = transport.byId(req.params.id);
  return item?.type === "TRAIN" ? success(res, item) : failure(res, 404, "TRAIN_NOT_FOUND", `Train ${req.params.id} was not found`);
});

function applyDelay(req, res) {
  const delayMinutes = Number(req.body?.delayMinutes);
  if (!Number.isInteger(delayMinutes) || delayMinutes < 0) return failure(res, 400, "INVALID_DELAY", "delayMinutes must be a non-negative integer");
  const item = transport.applyDelay(req.params.transportId, delayMinutes);
  return item ? success(res, item) : failure(res, 404, "TRANSPORT_NOT_FOUND", `Transport ${req.params.transportId} was not found`);
}
app.post("/api/simulator/:transportId/delay", applyDelay);
app.post("/api/simulator/flights/:flightId/delay", (req, res) => applyDelay({ ...req, params: { transportId: req.params.flightId } }, res));
app.post("/api/simulator/trains/:trainId/delay", (req, res) => applyDelay({ ...req, params: { transportId: req.params.trainId } }, res));
app.post("/api/simulator/reset", (req, res) => { transport.reset(); return success(res, { message: "Transport simulator reset successfully" }); });

app.use((req, res) => failure(res, 404, "ROUTE_NOT_FOUND", "The requested route was not found"));

if (require.main === module) {
  const port = Number(process.env.PORT || 5001);
  app.listen(port, () => console.log(`TravelGuard Data Provider running on port ${port}`));
}

module.exports = app;
