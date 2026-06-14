const express = require("express");
const cors = require("cors");
const attendanceRoutes = require("./routes/attendanceRoutes.js");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*", // e.g. "https://your-app.com" in production
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "ERP Backend is running " });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ success: false, message: "Internal server error" });
});

module.exports = app;