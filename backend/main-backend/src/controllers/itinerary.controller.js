const itineraryService =
  require("../services/itinerary.service");

async function createItinerary(req, res, next) {
  try {
    const { tripId, legs } = req.body;

    if (!tripId || !Array.isArray(legs)) {
      const error = new Error(
        "tripId and legs are required"
      );

      error.code = "INVALID_ITINERARY";

      throw error;
    }

    const itinerary =
      await itineraryService.createItinerary(
        tripId,
        legs
      );

    res.status(201).json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    next(error);
  }
}

async function getItinerary(req, res, next) {
  try {
    const itinerary =
      await itineraryService.getItinerary(
        req.params.tripId
      );

    res.json({
      success: true,
      data: itinerary
    });
  } catch (error) {
    next(error);
  }
}

async function getDependencies(req, res, next) {
  try {
    const data =
      await itineraryService.getDependencies(
        req.params.tripId
      );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getStatus(req, res, next) {
  try {
    const itinerary =
      await itineraryService.getItinerary(
        req.params.tripId
      );

    res.json({
      success: true,
      data: {
        tripId: itinerary.tripId,
        status: itinerary.status
      }
    });
  } catch (error) {
    next(error);
  }
}

async function checkDisruption(req, res, next) {
  try {
    const data =
      await itineraryService.checkDisruption(
        req.params.tripId
      );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getAffected(req, res, next) {
  try {
    const data =
      await itineraryService.getAffected(
        req.params.tripId
      );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getRecovery(req, res, next) {
  try {
    const data =
      await itineraryService.getRecovery(
        req.params.tripId
      );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function selectRecovery(req, res, next) {
  try {
    const {
      transportId
    } = req.body;

    if (!transportId) {
      const error = new Error(
        "transportId is required"
      );

      error.code = "INVALID_RECOVERY_SELECTION";

      throw error;
    }

    const data =
      await itineraryService.selectRecovery(
        req.params.tripId,
        transportId
      );

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createItinerary,
  getItinerary,
  getDependencies,
  getStatus,
  checkDisruption,
  getAffected,
  getRecovery,
  selectRecovery
};