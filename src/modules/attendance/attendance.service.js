const mockAttendance = require("./attendance.model.js");

/**
 * @param {number} month 
 * @param {number} year
 * @returns {object} 
 */
function getAttendanceByMonth(month, year) {
  const yearData = mockAttendance[year];

  if (!yearData) {
    return null; 
  }

  const monthData = yearData[month];

  if (!monthData) {
    return null; 
  }

  const summary = {
    totalDays: monthData.length,
    present: monthData.filter((d) => d.status === "present").length,
    absent: monthData.filter((d) => d.status === "absent").length,
    leave: monthData.filter((d) => d.status === "leave").length,
    holidays: monthData.filter((d) => d.status === "holiday").length,
    weekends: monthData.filter((d) => d.status === "weekend").length,
  };

  return {
    month,
    year,
    summary,
    records: monthData,
  };
}

module.exports = { getAttendanceByMonth };
