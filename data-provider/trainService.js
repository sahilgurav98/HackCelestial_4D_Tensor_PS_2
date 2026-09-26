const trains = require("../data/trains");
const trainHistory = require("../data/trainHistory");

const initialTrains = JSON.parse(JSON.stringify(trains));

function getAllTrains() { return trains; }
function getTrainById(trainId) { return trains.find((train) => train.id === trainId); }

function searchTrains(origin, destination) {
  return trains.filter((train) => {
    const originMatches = !origin || train.origin.code.toLowerCase() === origin.toLowerCase();
    const destinationMatches = !destination || train.destination.code.toLowerCase() === destination.toLowerCase();
    return originMatches && destinationMatches;
  });
}

function getTrainHistory(trainId) {
  return trainHistory.filter((record) => record.transportId === trainId);
}
function getAllHistory() { return trainHistory; }

function updateTrainDelay(trainId, delayMinutes) {
  const train = getTrainById(trainId);
  if (!train) return null;
  train.delayMinutes = delayMinutes;
  train.status = delayMinutes > 0 ? "DELAYED" : "ON_TIME";
  train.mlFeatures.currentDelayMinutes = delayMinutes;
  return { id: train.id, status: train.status, delayMinutes: train.delayMinutes };
}

function resetTrains() {
  trains.forEach((train, index) => {
    Object.keys(train).forEach((key) => delete train[key]);
    Object.assign(train, JSON.parse(JSON.stringify(initialTrains[index])));
  });
}

module.exports = {
  getAllTrains, getTrainById, searchTrains, getTrainHistory,
  getAllHistory, updateTrainDelay, resetTrains
};
