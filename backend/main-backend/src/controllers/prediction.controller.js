const mlService =
  require("../services/ml.service");

async function predictDelay(req, res, next) {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      const error = new Error(
        "Prediction input is required"
      );

      error.code = "INVALID_PREDICTION_INPUT";

      throw error;
    }

    const prediction =
      await mlService.predictDelay(req.body);

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    error.code =
      error.code || "ML_SERVICE_UNAVAILABLE";

    next(error);
  }
}

module.exports = {
  predictDelay
};