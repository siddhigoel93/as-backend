const express = require("express");
const router = express.Router();
const { markAttendance, getClassAttendance, updateAttendance, getMyAttendance } = require("./attendance.controller.js");
const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

/**
 * @swagger
 * components:
 *   schemas:
 *     AttendanceRecord:
 *       type: object
 *       required:
 *         - student
 *         - status
 *       properties:
 *         student:
 *           type: string
 *           description: The unique identifier of the student
 *           example: "65f2a1b2c3d4e5f6a7b8c9d0"
 *         status:
 *           type: string
 *           enum: [Present, Absent]
 *           description: Attendance status of the student
 *           example: "Present"
 * 
 *     Attendance:
 *       type: object
 *       required:
 *         - classId
 *         - date
 *         - markedBy
 *         - records
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the attendance record
 *           example: "65f2b2c3d4e5f6a7b8c9d022"
 *         classId:
 *           type: string
 *           description: The ID of the class
 *           example: "65f2b2c3d4e5f6a7b8c9d011"
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the attendance (normalized to UTC midnight)
 *           example: "2026-06-20T00:00:00.000Z"
 *         markedBy:
 *           type: string
 *           description: User ID of the admin who marked the attendance
 *           example: "65f2a1b2c3d4e5f6a7b8c9d0"
 *         records:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttendanceRecord'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/attendance/mark:
 *   post:
 *     summary: Mark class-wide attendance
 *     description: Submit or overwrite attendance records for all active students in a class on a given date. Admin only.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classId
 *               - date
 *               - records
 *             properties:
 *               classId:
 *                 type: string
 *                 description: Class ID to mark attendance for
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of attendance
 *               records:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AttendanceRecord'
 *           example:
 *             classId: "65f2b2c3d4e5f6a7b8c9d011"
 *             date: "2026-06-20"
 *             records:
 *               - student: "65f2a1b2c3d4e5f6a7b8c9d0"
 *                 status: "Present"
 *               - student: "65f2a1b2c3d4e5f6a7b8c9d1"
 *                 status: "Absent"
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Bad Request - Holiday, inactive class, incomplete or invalid records
 *       404:
 *         description: Class not found
 */

/**
 * @swagger
 * /api/attendance/class/{classId}:
 *   get:
 *     summary: Get class attendance
 *     description: Retrieve all attendance records for a specific class for a given month and year. Admin only.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: The Class ID
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 4-digit Year
 *     responses:
 *       200:
 *         description: Class attendance records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Bad Request - Missing or invalid parameters
 *       404:
 *         description: Class not found
 */

/**
 * @swagger
 * /api/attendance/{id}:
 *   put:
 *     summary: Update class attendance
 *     description: Update individual student attendance records for a specific attendance ID. Admin only.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Attendance Record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - records
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/AttendanceRecord'
 *           example:
 *             records:
 *               - student: "65f2a1b2c3d4e5f6a7b8c9d0"
 *                 status: "Absent"
 *               - student: "65f2a1b2c3d4e5f6a7b8c9d1"
 *                 status: "Present"
 *     responses:
 *       200:
 *         description: Attendance record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: Bad Request - Inactive class, incomplete or invalid records
 *       404:
 *         description: Attendance record or class not found
 */

/**
 * @swagger
 * /api/attendance/me:
 *   get:
 *     summary: Get own monthly attendance
 *     description: Retrieve the logged-in student's monthly attendance summary and history. Student only.
 *     tags:
 *       - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 4-digit Year
 *     responses:
 *       200:
 *         description: Personal monthly attendance summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMarkedDays:
 *                       type: integer
 *                     presentDays:
 *                       type: integer
 *                     absentDays:
 *                       type: integer
 *                     attendancePercentage:
 *                       type: number
 *                     records:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                             enum: [Present, Absent]
 *       400:
 *         description: Bad Request - Missing or invalid parameters
 */

router.post("/mark", authenticate, authorize("admin"), markAttendance);
router.get("/class/:classId", authenticate, authorize("admin"), getClassAttendance);
router.put("/:id", authenticate, authorize("admin"), updateAttendance);
router.get("/me", authenticate, authorize("student"), getMyAttendance);

module.exports = router;
