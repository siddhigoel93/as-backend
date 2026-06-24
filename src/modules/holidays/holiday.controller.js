const Holiday = require("./holiday.model");

const createHoliday = async (req, res, next) => {
  try {
    const { title, date, description } = req.body;

    if (!title || !date) {
      return res.status(400).json({
        success: false,
        message: "Title and date are required"
      });
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    parsedDate.setUTCHours(0, 0, 0, 0);

    const holiday = await Holiday.create({
      title,
      date: parsedDate,
      description,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: holiday
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A holiday already exists on this date"
      });
    }
    next(error);
  }
};


const getHolidays = async (req, res, next) => {
  try {
    const { month, year, date } = req.query;
    const query = {};

    if (date) {
      const searchDate = new Date(date);
      if (isNaN(searchDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid 'date' format"
        });
      }
      searchDate.setUTCHours(0, 0, 0, 0);
      query.date = searchDate;
    } else if (month || year) {
      const yearNum = year ? parseInt(year, 10) : new Date().getUTCFullYear();
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({
          success: false,
          message: "Invalid 'year' format"
        });
      }

      if (month) {
        const monthNum = parseInt(month, 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
          return res.status(400).json({
            success: false,
            message: "Invalid 'month'. Must be between 1 and 12"
          });
        }

        const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1));
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(Date.UTC(yearNum, monthNum, 1));
        endDate.setUTCHours(0, 0, 0, 0);

        query.date = { $gte: startDate, $lt: endDate };
      } else {
        const startDate = new Date(Date.UTC(yearNum, 0, 1));
        startDate.setUTCHours(0, 0, 0, 0);

        const endDate = new Date(Date.UTC(yearNum + 1, 0, 1));
        endDate.setUTCHours(0, 0, 0, 0);

        query.date = { $gte: startDate, $lt: endDate };
      }
    }

    const holidays = await Holiday.find(query)
      .populate("createdBy", "name email role")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      data: holidays
    });
  } catch (error) {
    next(error);
  }
};

const updateHoliday = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    
    delete updateData._id;
    delete updateData.createdBy;

    if (updateData.date) {
      const parsedDate = new Date(updateData.date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format"
        });
      }
      parsedDate.setUTCHours(0, 0, 0, 0);
      updateData.date = parsedDate;
    }

    const holiday = await Holiday.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: holiday
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A holiday already exists on this date"
      });
    }
    next(error);
  }
};


module.exports = {
  createHoliday,
  getHolidays,
  updateHoliday
};
