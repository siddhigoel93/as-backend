const express = require("express");
const router = express.Router();
const { getAttendance } = require("./attendance.controller.js");

router.get("/", getAttendance);

module.exports = router;
