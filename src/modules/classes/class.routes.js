const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  updateClass
} = require("./class.controller");

const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

router.post("/", authenticate, authorize("admin"), createClass);
router.get("/", authenticate, authorize("admin"), getClasses);
router.put("/:id", authenticate, authorize("admin"), updateClass);

module.exports = router;
