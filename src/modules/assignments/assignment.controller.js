const Assignment = require("./assignment.model.js");
const Class = require("../classes/class.model.js");

async function createAssignment(req, res, next) {
  try {
    const { title, description, dueDate, classId } = req.body;

    if (!title || !dueDate || !classId) {
      return res.status(400).json({
        success: false,
        message: "title, dueDate, and classId are required"
      });
    }

    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    const newAssignment = await Assignment.create({
      title,
      description,
      dueDate,
      classId,
      createdBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      data: newAssignment
    });
  } catch (error) {
    next(error);
  }
}

async function getMyAssignments(req, res, next) {
  try {
    const userClassId = req.user.classId;

    if (!userClassId) {
      return res.status(400).json({
        success: false,
        message: "You are not assigned to any class"
      });
    }

    const assignments = await Assignment.find({ classId: userClassId }).sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
}

async function getClassAssignments(req, res, next) {
  try {
    const { classId } = req.params;

    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    const assignments = await Assignment.find({ classId }).sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      data: assignments
    });
  } catch (error) {
    next(error);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, dueDate } = req.body;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    if (title) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate) assignment.dueDate = dueDate;

    const updatedAssignment = await assignment.save();

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      data: updatedAssignment
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found"
      });
    }

    await Assignment.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Assignment deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAssignment,
  getMyAssignments,
  getClassAssignments,
  updateAssignment,
  deleteAssignment
};
