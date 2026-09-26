const axios = require("axios");
const env = require("../config/env");

const client = axios.create({
  baseURL: env.neo4jEngineUrl,
  timeout: env.serviceTimeoutMs
});

function handleServiceError(error) {
  if (error.response) {
    return new Error(
      error.response.data?.error?.message ||
        "Neo4j Engine request failed"
    );
  }

  if (error.code === "ECONNABORTED") {
    return new Error("Neo4j Engine request timed out");
  }

  return new Error("Neo4j Engine unavailable");
}

async function registerJourney(journey) {
  try {
    const response = await client.post(
      env.neo4jRegisterPath,
      journey
    );

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getDependencies(tripId) {
  try {
    const response = await client.get(
      `/journeys/${tripId}/dependencies`
    );

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getAffected(tripId) {
  try {
    const response = await client.get(
      `/journeys/${tripId}/affected`
    );

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getRecovery(tripId) {
  try {
    const response = await client.get(
      `/journeys/${tripId}/recovery`
    );

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

module.exports = {
  registerJourney,
  getDependencies,
  getAffected,
  getRecovery
};