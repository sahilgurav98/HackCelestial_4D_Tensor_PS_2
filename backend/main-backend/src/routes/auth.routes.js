const express = require("express");
const controller = require("../controllers/auth.controller");
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();
router.post("/signup", controller.signup);
router.post("/login", controller.login);
router.get("/me", optionalAuth, controller.me);
router.post("/logout", optionalAuth, controller.logout);

module.exports = router;
