const service = require("../services/trainService");
const { successResponse, errorResponse } = require("../utils/response");

function getAllTrains(req, res) {
  return successResponse(res, service.getAllTrains());
}
function getTrainById(req, res) {
  const train = service.getTrainById(req.params.trainId);
  if (!train) return errorResponse(res, 404, "TRAIN_NOT_FOUND", `Train ${req.params.trainId} was not found`);
  return successResponse(res, train);
}
function searchTrains(req, res) {
  return successResponse(res, service.searchTrains(req.query.origin, req.query.destination));
}
function getTrainStatus(req, res) {
  const train = service.getTrainById(req.params.trainId);
  if (!train) return errorResponse(res, 404, "TRAIN_NOT_FOUND", `Train ${req.params.trainId} was not found`);
  return successResponse(res, {
    id: train.id, status: train.status, delayMinutes: train.delayMinutes,
    actualDeparture: train.actualDeparture, actualArrival: train.actualArrival
  });
}
function getTrainHistory(req, res) {
  const train = service.getTrainById(req.params.trainId);
  if (!train) return errorResponse(res, 404, "TRAIN_NOT_FOUND", `Train ${req.params.trainId} was not found`);
  return successResponse(res, service.getTrainHistory(req.params.trainId));
}
function getAllHistory(req, res) {
  return successResponse(res, {
    dataSource: "SYNTHETIC_DEMO",
    target: "delayMinutes",
    count: service.getAllHistory().length,
    records: service.getAllHistory()
  });
}
function simulateDelay(req, res) {
  const { delayMinutes } = req.body || {};
  if (!Number.isInteger(delayMinutes) || delayMinutes < 0) {
    return errorResponse(res, 400, "INVALID_DELAY", "delayMinutes must be a non-negative integer");
  }
  const result = service.updateTrainDelay(req.params.trainId, delayMinutes);
  if (!result) return errorResponse(res, 404, "TRAIN_NOT_FOUND", `Train ${req.params.trainId} was not found`);
  return successResponse(res, result);
}
function resetSimulator(req, res) {
  service.resetTrains();
  return successResponse(res, { message: "Train simulator reset successfully" });
}

module.exports = {
  getAllTrains, getTrainById, searchTrains, getTrainStatus,
  getTrainHistory, getAllHistory, simulateDelay, resetSimulator
};
