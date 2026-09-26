function errorHandler(err, req, res, next) {
  console.error(
    `[ERROR] ${req.method} ${req.originalUrl}`,
    err.message
  );

  let statusCode = 500;

  let code =
    err.code || "INTERNAL_SERVER_ERROR";

  let message =
    err.message || "Internal server error";

  if (code === "ITINERARY_NOT_FOUND") {
    statusCode = 404;
  }

  if (code === "TRANSPORT_NOT_FOUND") {
    statusCode = 404;
  }

  if (code === "FLIGHT_NOT_FOUND") {
    statusCode = 404;
  }

  if (code === "TRAIN_NOT_FOUND") {
    statusCode = 404;
  }

  if (code === "RECOVERY_PLAN_NOT_FOUND") {
    statusCode = 404;
  }

  if (code === "RECOVERY_OPTION_NOT_FOUND") {
    statusCode = 404;
  }

  if (code === "ITINERARY_EXISTS") {
    statusCode = 409;
  }

  if (
    code === "INVALID_ITINERARY" ||
    code === "INVALID_TRANSPORT_TYPE" ||
    code === "INVALID_RECOVERY_SELECTION" ||
    code === "INVALID_PREDICTION_INPUT"
  ) {
    statusCode = 400;
  }

  if (
    code === "DATA_PROVIDER_UNAVAILABLE"
  ) {
    statusCode = 503;
    message =
      "Transport data service is unavailable";
  }

  if (
    code === "NEO4J_ENGINE_UNAVAILABLE"
  ) {
    statusCode = 503;
    message =
      "Recovery graph service is unavailable";
  }

  if (
    code === "ML_SERVICE_UNAVAILABLE"
  ) {
    statusCode = 503;
    message =
      "ML prediction service is unavailable";
  }

  if (
    code === "NEO4J_REGISTRATION_FAILED"
  ) {
    statusCode = 503;
    message =
      "Unable to register itinerary with recovery engine";
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

module.exports = errorHandler;