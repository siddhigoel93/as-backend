require("dotenv").config();

const express = require("express");
const connectDB = require("./src/config/db");

const app = express();

connectDB();

app.get("/", (req, res) => {
  res.send("ERP Backend Running");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});