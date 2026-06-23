const express = require("express");
const router = express.Router();
const { markAttendance, getClassAttendance, updateAttendance, getMyAttendance } = require("./attendance.controller.js");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

router.post("/mark", authenticate, authorize("admin"), markAttendance);
router.get("/class/:classId", authenticate, authorize("admin"), getClassAttendance);
router.put("/:id", authenticate, authorize("admin"), updateAttendance);
router.get("/me", authenticate, authorize("student"), getMyAttendance);

module.exports = router;
