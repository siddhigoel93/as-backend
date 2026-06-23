const User = require("./user.model");
const Class = require("../classes/class.model");

async function getUsers(req, res, next) {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
}

async function updateStudentClass(req, res, next) {
  try {
    const { id } = req.params;
    const { classId } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "Only students can be assigned to classes"
      });
    }

    if (classId === null || classId === undefined || classId === "") {
      user.classId = null;
    } else {
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
      user.classId = classId;
    }

    const updatedUser = await user.save();
    
    // Return updated user excluding password
    const userObj = updatedUser.toObject();
    delete userObj.password;

    return res.status(200).json({
      success: true,
      data: userObj
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsers,
  updateStudentClass
};
