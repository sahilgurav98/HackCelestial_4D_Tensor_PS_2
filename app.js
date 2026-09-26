const express = require("express");
const cors = require("cors");
const trainRoutes = require("./routes/trainRoutes");
const simulatorRoutes = require("./routes/simulatorRoutes");
const flightRoutes = require("./routes/flight.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "travelguard-data-provider",
    status: "healthy"
  });
});

app.use("/api/trains", trainRoutes);
app.use("/api/flights", flightRoutes);
app.use("/api/simulator", simulatorRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "The requested route was not found"
    }
  });
});

module.exports = app;
