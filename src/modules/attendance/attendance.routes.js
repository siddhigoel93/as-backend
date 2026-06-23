const express = require("express");
const router = express.Router();
const { getAttendance, markAttendance, getClassAttendance, updateAttendance } = require("./attendance.controller.js");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

router.get("/", getAttendance);
router.post("/", authenticate, authorize("teacher", "admin"), markAttendance);
router.get("/class/:classId", authenticate, authorize("teacher", "admin"), getClassAttendance);
router.put("/:id", authenticate, authorize("teacher", "admin"), updateAttendance);

module.exports = router;
