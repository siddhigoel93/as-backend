const express = require("express");
const router = express.Router();

const {
  createHoliday,
  getHolidays,
  updateHoliday
} = require("./holiday.controller");

const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

router.post("/", authenticate, authorize("admin"), createHoliday);
router.get("/", authenticate, authorize("admin", "student"), getHolidays);
router.put("/:id", authenticate, authorize("admin"), updateHoliday);

module.exports = router;
