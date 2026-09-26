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

async function getAffected(req, res, next) {
  try {
    res.json({ success: true, data: await journeyService.getAffected(req.params.tripId) });
  } catch (error) {
    next(error);
  }
}

async function getRecovery(req, res, next) {
  try {
    const candidates = req.query.candidates ? JSON.parse(req.query.candidates) : [];
    res.json({ success: true, data: await journeyService.getRecovery(req.params.tripId, candidates) });
  } catch (error) {
    next(error);
  }
}

async function simulateDelay(req, res, next) {
  try {
    const delayMinutes = Number(req.body.delayMinutes);
    if (!Number.isFinite(delayMinutes) || delayMinutes < 0) {
      const error = new Error("delayMinutes must be a non-negative number");
      error.code = "INVALID_DELAY";
      throw error;
    }
    res.json({
      success: true,
      data: await journeyService.simulateDelay(req.params.tripId, req.body.transportId, delayMinutes)
    });
  } catch (error) {
    next(error);
  }
}

async function selectRecovery(req, res, next) {
  try {
    if (!req.body.transportId) {
      const error = new Error("transportId is required");
      error.code = "INVALID_RECOVERY_SELECTION";
      throw error;
    }
    res.json({
      success: true,
      data: await journeyService.selectRecovery(req.params.tripId, req.body.transportId, req.body.candidates || [])
    });
  } catch (error) {
    next(error);
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
