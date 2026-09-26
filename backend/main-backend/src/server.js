const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const {
  connectDatabase
} = require("./config/database");

const transportRoutes =
  require("./routes/transport.routes");

const itineraryRoutes =
  require("./routes/itinerary.routes");

const predictionRoutes =
  require("./routes/prediction.routes");

const notFound =
  require("./middleware/notFound");

const errorHandler =
  require("./middleware/errorHandler");

const app = express();

app.use(
  cors({
    origin: env.frontendUrl
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "travelguard-main-backend",
    status: "healthy"
  });
});

app.use(
  "/api/transports",
  transportRoutes
);

app.use(
  "/api/itineraries",
  itineraryRoutes
);

app.use(
  "/api/predictions",
  predictionRoutes
);

app.use(notFound);

app.use(errorHandler);

async function startServer() {
  try {
    await connectDatabase();

    app.listen(env.port, () => {
      console.log(
        `TravelGuard Main Backend running on port ${env.port}`
      );
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error.message
    );

    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  startServer
};