const dotenv = require("dotenv");

dotenv.config();

const env = {
  port: Number(process.env.PORT || 5000),

  dataProviderUrl:
    process.env.DATA_PROVIDER_URL || "http://localhost:5001",

  neo4jEngineUrl:
    process.env.NEO4J_ENGINE_URL || "http://localhost:8000",

  neo4jRegisterPath:
    process.env.NEO4J_REGISTER_PATH || "/journeys",

  mlServiceUrl:
    process.env.ML_SERVICE_URL || "http://localhost:8001",

  mongodbUri:
    process.env.MONGODB_URI ||
    "mongodb://localhost:27017/travelguard",

  frontendUrl:
    process.env.FRONTEND_URL || "http://localhost:5173",

  serviceTimeoutMs:
    Number(process.env.SERVICE_TIMEOUT_MS) || 5000
};

module.exports = env;