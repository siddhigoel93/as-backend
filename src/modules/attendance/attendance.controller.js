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

async function getClassAttendance(req, res, next) {
  try {
    const { classId } = req.params;
    const { month, year } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Query param 'month' is required."
      });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = year ? parseInt(year, 10) : new Date().getUTCFullYear();

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'month'. Must be a number between 1 and 12."
      });
    }

    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'year'."
      });
    }

    // Build UTC date range: first to last day of month UTC
    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    // Fetch the class by classId — 404 if not found
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // If req.user.role === "teacher", verify class.classTeacher.toString() === req.user.id else return 403
    if (req.user.role === "teacher") {
      if (!classData.classTeacher || classData.classTeacher.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden"
        });
      }
    }

    // Fetch all attendance records for that classId within the date range
    const records = await Attendance.find({
      classId,
      date: { $gte: startDate, $lte: endDate }
    });

    return res.status(200).json({
      success: true,
      data: records
    });

  } catch (error) {
    next(error);
  }
}

async function updateAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const { records } = req.body;

    // Fetch the attendance record by id, 404 if not found
    const record = await Attendance.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    // Fetch the class from record.classId
    const classData = await Class.findById(record.classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Associated class not found"
      });
    }

    // If req.user.role === "teacher", verify class.classTeacher.toString() === req.user.id else return 403
    if (req.user.role === "teacher") {
      if (!classData.classTeacher || classData.classTeacher.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden"
        });
      }
    }

    // If class isActive === false, return 400
    if (classData.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Class is inactive"
      });
    }

    // Fetch the current active roster via User.find({ classId: record.classId, role: 'student', isActive: true }, '_id')
    const rosterUsers = await User.find({ classId: record.classId, role: 'student', isActive: true }, '_id');
    const roster = rosterUsers.map(u => u._id.toString());

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "records must be an array"
      });
    }

    // Validate every student in submitted records exists in that roster — return 400 listing invalid IDs if any fail
    const invalidIds = [];
    for (const rec of records) {
      if (!rec.student || !roster.includes(rec.student.toString())) {
        invalidIds.push(rec.student || "null");
      }
    }
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid student IDs",
        invalidIds
      });
    }

    // Validate records.length === roster.length — return 400 if incomplete
    if (records.length !== roster.length) {
      return res.status(400).json({
        success: false,
        message: "Incomplete student records"
      });
    }

    // Update records and markedBy: req.user.id, return 200 with updated document
    record.records = records;
    record.markedBy = req.user.id;
    const updatedRecord = await record.save();

    return res.status(200).json({
      success: true,
      data: updatedRecord
    });

  } catch (error) {
    next(error);
  }
}

async function getMyAttendance(req, res, next) {
  try {
    const { month, year } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: "Query param 'month' is required."
      });
    }

    const monthNum = parseInt(month, 10);
    const yearNum = year ? parseInt(year, 10) : new Date().getUTCFullYear();

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'month'. Must be a number between 1 and 12."
      });
    }

    if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        message: "Invalid 'year'."
      });
    }

    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    // Query records using $elemMatch for student req.user.id
    const records = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
      records: { $elemMatch: { student: req.user.id } }
    });

    // Extract only that student's status entry from each record
    const mappedRecords = records.map(r => {
      const sub = r.records.find(s => s.student.toString() === req.user.id);
      return {
        date: r.date,
        status: sub ? sub.status : null
      };
    }).filter(x => x.status !== null);

    const totalMarkedDays = mappedRecords.length;
    const presentDays = mappedRecords.filter(r => r.status === "Present").length;
    const absentDays = mappedRecords.filter(r => r.status === "Absent").length;
    const attendancePercentage = totalMarkedDays > 0 
      ? parseFloat(((presentDays / totalMarkedDays) * 100).toFixed(2)) 
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalMarkedDays,
        presentDays,
        absentDays,
        attendancePercentage,
        records: mappedRecords
      }
    });

  } catch (error) {
    next(error);
  }
}

module.exports = { getAttendance, markAttendance, getClassAttendance, updateAttendance, getMyAttendance };
