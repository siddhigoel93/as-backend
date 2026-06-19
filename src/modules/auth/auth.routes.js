const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe
} = require("./auth.controller");

const authenticate = require("../../middlewares/authenticate");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getMe);

module.exports = router;