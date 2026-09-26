const express = require("express");

const controller =
  require("../controllers/transport.controller");

const router = express.Router();

router.get(
  "/",
  controller.getTransports
);

router.get(
  "/search",
  controller.searchTransports
);

router.get(
  "/:id",
  controller.getTransport
);

module.exports = router;