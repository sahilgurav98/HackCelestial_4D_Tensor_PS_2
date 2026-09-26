const express = require("express");
const cors = require("cors");

require("dotenv").config();

const {
  verifyConnection
} = require("./config/neo4j");

const journeyRoutes =
  require("./routes/journey.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await verifyConnection();

    res.json({
      success: true,
      service: "travelguard-neo4j-engine",
      status: "healthy",
      neo4j: "connected"
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: "travelguard-neo4j-engine",
      status: "unhealthy",
      neo4j: "disconnected"
    });
  }
});

app.use(
  "/journeys",
  journeyRoutes
);

app.use((err, req, res, next) => {
  console.error(err);

  const statusCode = ["INVALID_DELAY", "INVALID_RECOVERY_SELECTION"].includes(err.code) ? 400 :
    err.code === "TRANSPORT_NOT_FOUND" ? 404 : 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: "NEO4J_ENGINE_ERROR",
      message: err.message
    }
  });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(
    `Neo4j Engine running on port ${PORT}`
  );

  try {
    await verifyConnection();
  } catch (error) {
    console.error(
      "Neo4j connection failed:",
      error.message
    );
  }
});
