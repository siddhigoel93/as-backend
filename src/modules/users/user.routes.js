const express = require("express");
const router = express.Router();
const { getUsers, updateStudentClass } = require("./user.controller");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

router.get("/", authenticate, authorize("admin"), getUsers);
router.put("/:id/class", authenticate, authorize("admin"), updateStudentClass);

module.exports = router;
