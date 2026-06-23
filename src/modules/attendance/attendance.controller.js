const Attendance = require("./attendance.model.js");
const Class = require("../classes/class.model.js");
const Holiday = require("../holidays/holiday.model.js");
const User = require("../users/user.model.js");

async function markAttendance(req, res, next) {
  try {
    const { classId, date, records } = req.body;

    // 1) Validate date
    const normalizedDate = new Date(new Date(date).setUTCHours(0, 0, 0, 0));
    if (isNaN(normalizedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date"
      });
    }

    // 2) Validate class exists and is active
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

    // 3) Validate date is not a holiday
    const holiday = await Holiday.findOne({ date: normalizedDate });
    if (holiday) {
      return res.status(400).json({
        success: false,
        message: "Cannot mark attendance on a holiday"
      });
    }

    // 4) Fetch active students roster belonging to this class
    const rosterUsers = await User.find({ classId, role: 'student', isActive: true }, '_id');
    const roster = rosterUsers.map(u => u._id.toString());

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "records must be an array"
      });
    }

    // 5) Validate all submitted students belong to the roster
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

    // 6) Validate records are complete
    if (records.length !== roster.length) {
      return res.status(400).json({
        success: false,
        message: "Incomplete student records"
      });
    }

    // 7) Upsert by classId + date
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

    const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999));

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

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

    const record = await Attendance.findById(id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }

    const classData = await Class.findById(record.classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Associated class not found"
      });
    }

    if (classData.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Class is inactive"
      });
    }

    const rosterUsers = await User.find({ classId: record.classId, role: 'student', isActive: true }, '_id');
    const roster = rosterUsers.map(u => u._id.toString());

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "records must be an array"
      });
    }

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

    if (records.length !== roster.length) {
      return res.status(400).json({
        success: false,
        message: "Incomplete student records"
      });
    }

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

    const records = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
      records: { $elemMatch: { student: req.user.id } }
    });

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

module.exports = { markAttendance, getClassAttendance, updateAttendance, getMyAttendance };
