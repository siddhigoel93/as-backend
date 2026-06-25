const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getMyAssignments,
  getClassAssignments,
  updateAssignment,
  deleteAssignment
} = require("./assignment.controller");

const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       required:
 *         - title
 *         - dueDate
 *         - classId
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the assignment
 *           example: "65f2b2c3d4e5f6a7b8c9d033"
 *         title:
 *           type: string
 *           description: The title/name of the assignment
 *           example: "Math Homework Chapter 5"
 *         description:
 *           type: string
 *           description: Optional description of the assignment
 *           example: "Solve exercises 1 to 10 on page 42"
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the assignment
 *           example: "2026-08-15T00:00:00.000Z"
 *         classId:
 *           type: string
 *           description: The class this assignment belongs to
 *           example: "65f2a1b2c3d4e5f6a7b8c9d0"
 *         createdBy:
 *           type: string
 *           description: User ID of the admin/teacher who created the assignment
 *           example: "65f2a1b2c3d4e5f6a7b8c9d0"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Create a new assignment
 *     description: Create a new assignment. Admin and teacher only.
 *     tags:
 *       - Assignments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - dueDate
 *               - classId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               classId:
 *                 type: string
 *           example:
 *             title: "Math Homework"
 *             description: "Chapter 5"
 *             dueDate: "2026-08-15T23:59:59.000Z"
 *             classId: "65f2a1b2c3d4e5f6a7b8c9d0"
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Bad Request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/", authenticate, authorize("admin", "teacher"), createAssignment);

/**
 * @swagger
 * /api/assignments/me:
 *   get:
 *     summary: Get my assignments
 *     description: Get assignments for the logged-in student's class. Student only.
 *     tags:
 *       - Assignments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assignments retrieved successfully
 *       400:
 *         description: Bad Request (User not assigned to a class)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get("/me", authenticate, authorize("student"), getMyAssignments);

/**
 * @swagger
 * /api/assignments/class/{classId}:
 *   get:
 *     summary: Get assignments for a class
 *     description: Get all assignments for a specific class. Admin and teacher only.
 *     tags:
 *       - Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assignments retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Class not found
 */
router.get("/class/:classId", authenticate, authorize("admin", "teacher"), getClassAssignments);

/**
 * @swagger
 * /api/assignments/{id}:
 *   put:
 *     summary: Update an assignment
 *     description: Update assignment details. Admin and teacher only.
 *     tags:
 *       - Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 */
router.put("/:id", authenticate, authorize("admin", "teacher"), updateAssignment);

router.delete("/:id", authenticate, authorize("admin", "teacher"), deleteAssignment);

module.exports = router;
