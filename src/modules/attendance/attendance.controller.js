const { getAttendanceByMonth } = require("./attendance.service.js");
const Attendance = require("./attendance.model.js");
const Class = require("../classes/class.model.js");
const Holiday = require("../holidays/holiday.model.js");
const User = require("../users/user.model.js");

async function getAttendance(req, res, next) {
  try {
    const { month, year } = req.query;
    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Query param 'month' is required. Example: ?month=6&year=2025",
      });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = year ? parseInt(year, 10) : new Date().getFullYear();

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'month'. Must be a number between 1 and 12.",
      });
    }

    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'year'. Must be a 4-digit year.",
      });
    }

    const data = getAttendanceByMonth(monthNum, yearNum);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: `No attendance data found for month ${monthNum}, year ${yearNum}.`,
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function markAttendance(req, res, next) {
  try {
    // 1) req.user must exist (401 if not), role must be teacher or admin (403 if not) — middleware handles this, just document it
    // Note: The authentication and authorization are handled by middlewares (authenticate, authorize('teacher', 'admin')).
    // Below is documentation and a safety assertion:
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Forbidden - Access denied"
      });
    }

    const { classId, date, records } = req.body;

    // 2) Normalize date to UTC midnight via new Date(new Date(date).setUTCHours(0,0,0,0)). Return 400 if invalid date.
    const normalizedDate = new Date(new Date(date).setUTCHours(0, 0, 0, 0));
    if (isNaN(normalizedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date"
      });
    }

    // 3) Fetch class by classId — 404 if not found, 400 if isActive === false.
    if (!classId) {
      return res.status(400).json({
        success: false,
        message: "classId is required"
      });
    }
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }
    if (classData.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Class is inactive"
      });
    }

    // 4) If req.user.role === "teacher", check class.classTeacher.toString() === req.user.id — 403 if not.
    if (req.user.role === "teacher") {
      if (!classData.classTeacher || classData.classTeacher.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden"
        });
      }
    }

    // 5) Check Holiday collection for normalized date — 400 with "Cannot mark attendance on a holiday" if found.
    const holiday = await Holiday.findOne({ date: normalizedDate });
    if (holiday) {
      return res.status(400).json({
        success: false,
        message: "Cannot mark attendance on a holiday"
      });
    }

    // 6) Fetch class roster from User model: User.find({ classId, role: 'student', isActive: true }, '_id') — get an array of valid student ID strings.
    const rosterUsers = await User.find({ classId, role: 'student', isActive: true }, '_id');
    const roster = rosterUsers.map(u => u._id.toString());

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "records must be an array"
      });
    }

    // 7) Validate every student in submitted records exists in that roster — 400 listing invalid IDs if any fail.
    const invalidIds = [];
    for (const record of records) {
      if (!record.student || !roster.includes(record.student.toString())) {
        invalidIds.push(record.student || "null");
      }
    }
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid student IDs",
        invalidIds
      });
    }

    // 8) Validate records.length === roster.length — 400 if incomplete.
    if (records.length !== roster.length) {
      return res.status(400).json({
        success: false,
        message: "Incomplete student records"
      });
    }

    // 9) Upsert with findOneAndUpdate({ classId, date }, { $set: { records, markedBy: req.user.id } }, { upsert: true, new: true }) — return 200.
    const savedRecord = await Attendance.findOneAndUpdate(
      { classId, date: normalizedDate },
      { $set: { records, markedBy: req.user.id } },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      data: savedRecord
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { getAttendance, markAttendance };
