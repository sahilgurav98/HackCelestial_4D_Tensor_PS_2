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

const authRoutes =
  require("./routes/auth.routes");

const { optionalAuth } =
  require("./middleware/auth");

const notFound =
  require("./middleware/notFound");

const errorHandler =
  require("./middleware/errorHandler");

const app = express();

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});

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
  "/api/auth",
  authRoutes
);

app.use(
  "/api/itineraries",
  optionalAuth,
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
