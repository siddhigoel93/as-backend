const Class = require("./class.model");
const User = require("../users/user.model");

// Helper to validate teacher role
async function validateTeacher(teacherId) {
  if (!teacherId) return false;
  try {
    const teacher = await User.findById(teacherId);
    return teacher && teacher.role === "teacher";
  } catch (error) {
    return false;
  }
}

// Helper to validate students role
async function validateStudents(studentIds) {
  if (!studentIds || !Array.isArray(studentIds)) return false;
  if (studentIds.length === 0) return true;
  try {
    const uniqueIds = [...new Set(studentIds)];
    const validStudents = await User.find({
      _id: { $in: uniqueIds },
      role: "student"
    });
    return validStudents.length === uniqueIds.length;
  } catch (error) {
    return false;
  }
}

// POST /api/classes (Admin only)
const createClass = async (req, res, next) => {
  try {
    const { name, section, classTeacher, students } = req.body;

    if (!name || !section || !classTeacher) {
      return res.status(400).json({
        success: false,
        message: "Name, section, and classTeacher are required"
      });
    }

    // Validate classTeacher exists and is a teacher
    const isTeacherValid = await validateTeacher(classTeacher);
    if (!isTeacherValid) {
      return res.status(400).json({
        success: false,
        message: "classTeacher must be a valid user with 'teacher' role"
      });
    }

    // Validate students exist and are students
    if (students !== undefined) {
      const areStudentsValid = await validateStudents(students);
      if (!areStudentsValid) {
        return res.status(400).json({
          success: false,
          message: "All students must be valid users with 'student' role"
        });
      }
    }

    const newClass = await Class.create({
      name,
      section,
      classTeacher,
      students: students || []
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A class with the same name and section already exists"
      });
    }
    next(error);
  }
};

// GET /api/classes (Admin + Teacher only)
const getClasses = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === "teacher") {
      query.classTeacher = req.user._id;
    }

    const classes = await Class.find(query)
      .populate("classTeacher", "name email role")
      .populate("students", "name email role");

    res.status(200).json({
      success: true,
      data: classes
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/classes/:id (Admin only)
const updateClass = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove immutable fields if present
    delete updateData._id;

    // Re-run validation on classTeacher if provided
    if (updateData.classTeacher !== undefined) {
      const isTeacherValid = await validateTeacher(updateData.classTeacher);
      if (!isTeacherValid) {
        return res.status(400).json({
          success: false,
          message: "classTeacher must be a valid user with 'teacher' role"
        });
      }
    }

    // Re-run validation on students if provided
    if (updateData.students !== undefined) {
      const areStudentsValid = await validateStudents(updateData.students);
      if (!areStudentsValid) {
        return res.status(400).json({
          success: false,
          message: "All students must be valid users with 'student' role"
        });
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
      .populate("classTeacher", "name email role")
      .populate("students", "name email role");

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A class with the same name and section already exists"
      });
    }
    next(error);
  }
};

module.exports = {
  createClass,
  getClasses,
  updateClass
};
