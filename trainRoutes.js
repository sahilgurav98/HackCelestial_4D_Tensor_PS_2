const express = require("express");
const controller = require("../controllers/trainController");

const router = express.Router();

router.get("/", controller.getAllTrains);
router.get("/search", controller.searchTrains);
router.get("/history", controller.getAllHistory);
router.get("/:trainId/status", controller.getTrainStatus);
router.get("/:trainId/history", controller.getTrainHistory);
router.get("/:trainId", controller.getTrainById);

module.exports = router;
