const axios = require("axios");
const env = require("../config/env");

const client = axios.create({
  baseURL: env.dataProviderUrl,
  timeout: env.serviceTimeoutMs
});

function handleServiceError(error) {
  if (error.response) {
    return new Error(
      error.response.data?.error?.message ||
        "Data Provider request failed"
    );
  }

  if (error.code === "ECONNABORTED") {
    return new Error("Data Provider request timed out");
  }

  return new Error("Data Provider unavailable");
}

async function getFlights() {
  try {
    const response = await client.get("/api/flights");

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getFlight(flightId) {
  try {
    const response = await client.get(
      `/api/flights/${flightId}`
    );

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getTrains() {
  try {
    const response = await client.get("/api/trains");

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getTrain(trainId) {
  try {
    const response = await client.get(
      `/api/trains/${trainId}`
    );

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getFlightHistory(flightId) {
  try {
    const response = await client.get(
      `/api/flights/${flightId}/history`
    );

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getTrainHistory(trainId) {
  try {
    const response = await client.get(
      `/api/trains/${trainId}/history`
    );

    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getTransports(filters = {}) {
  try {
    const response = await client.get("/api/transports", { params: filters });
    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function getTransport(transportId) {
  try {
    const response = await client.get(`/api/transports/${transportId}`);
    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

async function simulateDelay(transportId, delayMinutes) {
  try {
    const response = await client.post(`/api/simulator/${transportId}/delay`, { delayMinutes });
    return response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

module.exports = {
  getFlights,
  getFlight,
  getTrains,
  getTrain,
  getFlightHistory,
  getTrainHistory,
  getTransports,
  getTransport,
  simulateDelay
};
