const axios = require("axios");
const env = require("../config/env");

const client = axios.create({
  baseURL: env.mlServiceUrl,
  timeout: env.serviceTimeoutMs
});

function handleServiceError(error) {
  if (error.response) {
    return new Error(
      error.response.data?.error?.message ||
        "ML Service request failed"
    );
  }

  if (error.code === "ECONNABORTED") {
    return new Error("ML Service request timed out");
  }

  return new Error("ML Service unavailable");
}

async function predictDelay(payload) {
  try {
    const response = await client.post(
      "/predict-delay",
      payload
    );

    return response.data.prediction || response.data.data;
  } catch (error) {
    throw handleServiceError(error);
  }
}

module.exports = {
  predictDelay
};