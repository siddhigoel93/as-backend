const express = require("express");
const router = express.Router();
const { getAttendance, markAttendance } = require("./attendance.controller.js");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

router.get("/", getAttendance);
router.post("/", authenticate, authorize("teacher", "admin"), markAttendance);

module.exports = router;
