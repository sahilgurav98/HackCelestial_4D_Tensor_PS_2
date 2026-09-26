const journeyService =
  require("../services/journey.service");

async function registerJourney(req, res, next) {
  try {
    const { tripId, legs } = req.body;

    if (!tripId || !Array.isArray(legs)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_JOURNEY",
          message: "tripId and legs are required"
        }
      });
    }

    const data =
      await journeyService.registerJourney(
        tripId,
        legs
      );

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getDependencies(req, res, next) {
  try {
    const data =
      await journeyService.getDependencies(
        req.params.tripId
      );

    res.json({
      success: true,
      data: {
        tripId: req.params.tripId,
        connections: data
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerJourney,
  getDependencies
};