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

async function getRecovery(tripId, candidates = []) {
  try {
    const response = await client.get(`/journeys/${tripId}/recovery`, {
      params: candidates.length ? { candidates: JSON.stringify(candidates) } : undefined
    });

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function simulateDelay(tripId, transportId, delayMinutes) {
  try {
    const response = await client.post(
      `/journeys/${tripId}/simulate-delay`,
      { transportId, delayMinutes }
    );
    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function selectRecovery(tripId, transportId, candidates = []) {
  try {
    const response = await client.post(
      `/journeys/${tripId}/recovery/select`,
      { transportId, candidates }
    );
    return response.data.data;
  } catch (error) {
    const normalized = handleServiceError(error);
    normalized.code = error.response?.data?.error?.code || "NEO4J_ENGINE_UNAVAILABLE";
    throw normalized;
  }
}

module.exports = {
  registerJourney,
  getDependencies,
  getAffected,
  getRecovery,
  simulateDelay,
  selectRecovery
};
