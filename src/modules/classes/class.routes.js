const express = require("express");
const router = express.Router();

const {
  createClass,
  getClasses,
  updateClass
} = require("./class.controller");

const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

/**
 * @swagger
 * components:
 *   schemas:
 *     Class:
 *       type: object
 *       required:
 *         - name
 *         - section
 *         - classTeacher
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the class
 *           example: "65f2b2c3d4e5f6a7b8c9d011"
 *         name:
 *           type: string
 *           description: Name of the class
 *           example: "Grade 10"
 *         section:
 *           type: string
 *           description: Section of the class
 *           example: "A"
 *         classTeacher:
 *           type: string
 *           description: User ID of the class teacher
 *           example: "65f2a1b2c3d4e5f6a7b8c9d0"
 *         isActive:
 *           type: boolean
 *           description: Status of the class
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a new class
 *     description: Create a new class in the system. Admin only.
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - section
 *               - classTeacher
 *             properties:
 *               name:
 *                 type: string
 *                 description: Class name
 *               section:
 *                 type: string
 *                 description: Class section
 *               classTeacher:
 *                 type: string
 *                 description: User ID of the teacher
 *           example:
 *             name: "Grade 10"
 *             section: "A"
 *             classTeacher: "65f2a1b2c3d4e5f6a7b8c9d0"
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Bad Request - Validation error
 *       409:
 *         description: Conflict - Class with same name and section already exists
 * 
 *   get:
 *     summary: Get all classes
 *     description: Retrieve a list of all classes. Admin only.
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes retrieved successfully
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
 *                     $ref: '#/components/schemas/Class'
 */

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update an existing class
 *     description: Update details of a class by its ID. Admin only.
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               section:
 *                 type: string
 *               classTeacher:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *           example:
 *             isActive: false
 *     responses:
 *       200:
 *         description: Class updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Bad Request - Validation error
 *       404:
 *         description: Class not found
 */

router.post("/", authenticate, authorize("admin"), createClass);
router.get("/", authenticate, authorize("admin"), getClasses);
router.put("/:id", authenticate, authorize("admin"), updateClass);

module.exports = router;
