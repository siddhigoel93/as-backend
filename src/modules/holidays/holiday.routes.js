const express = require("express");
const router = express.Router();

const {
  createHoliday,
  getHolidays,
  updateHoliday
} = require("./holiday.controller");

const authenticate = require("../../middlewares/authenticate");
const authorize = require("../../middlewares/authorize");

/**
 * @swagger
 * components:
 *   schemas:
 *     Holiday:
 *       type: object
 *       required:
 *         - title
 *         - date
 *         - createdBy
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the holiday
 *           example: "65f2b2c3d4e5f6a7b8c9d033"
 *         title:
 *           type: string
 *           description: The title/name of the holiday
 *           example: "Independence Day"
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the holiday (normalized to UTC midnight)
 *           example: "2026-08-15T00:00:00.000Z"
 *         description:
 *           type: string
 *           description: Optional description of the holiday
 *           example: "National Independence Day holiday"
 *         createdBy:
 *           type: string
 *           description: User ID of the admin who created the holiday
 *           example: "65f2a1b2c3d4e5f6a7b8c9d0"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     HolidayPopulated:
 *       type: object
 *       required:
 *         - title
 *         - date
 *         - createdBy
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the holiday
 *           example: "65f2b2c3d4e5f6a7b8c9d033"
 *         title:
 *           type: string
 *           description: The title/name of the holiday
 *           example: "Independence Day"
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date of the holiday (normalized to UTC midnight)
 *           example: "2026-08-15T00:00:00.000Z"
 *         description:
 *           type: string
 *           description: Optional description of the holiday
 *           example: "National Independence Day holiday"
 *         createdBy:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "65f2a1b2c3d4e5f6a7b8c9d0"
 *             name:
 *               type: string
 *               example: "Admin User"
 *             email:
 *               type: string
 *               example: "admin@erp.com"
 *             role:
 *               type: string
 *               example: "admin"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/holidays:
 *   post:
 *     summary: Create a new holiday
 *     description: Create a new holiday in the system. Admin only.
 *     tags:
 *       - Holidays
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
 *               - date
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the holiday
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of the holiday (e.g. YYYY-MM-DD)
 *               description:
 *                 type: string
 *                 description: Optional description of the holiday
 *           example:
 *             title: "Independence Day"
 *             date: "2026-08-15"
 *             description: "National Independence Day holiday"
 *     responses:
 *       201:
 *         description: Holiday created successfully
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
 *                   $ref: '#/components/schemas/Holiday'
 *             example:
 *               success: true
 *               message: "Holiday created successfully"
 *               data:
 *                 id: "65f2b2c3d4e5f6a7b8c9d033"
 *                 title: "Independence Day"
 *                 date: "2026-08-15T00:00:00.000Z"
 *                 description: "National Independence Day holiday"
 *                 createdBy: "65f2a1b2c3d4e5f6a7b8c9d0"
 *                 createdAt: "2026-06-24T23:00:00.000Z"
 *                 updatedAt: "2026-06-24T23:00:00.000Z"
 *       400:
 *         description: Bad Request - Missing title/date or invalid date format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Title and date are required"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No token provided"
 *       403:
 *         description: Forbidden - Requires admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Forbidden - Access denied"
 *       409:
 *         description: Conflict - Holiday already exists on this date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "A holiday already exists on this date"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal server error"
 * 
 *   get:
 *     summary: Get holidays
 *     description: Retrieve a list of holidays, filtered by month, year, or a specific date. Admin or Student.
 *     tags:
 *       - Holidays
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Month number (1-12) to filter holidays
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: 4-digit Year to filter holidays (defaults to current UTC year if month is provided)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date (YYYY-MM-DD) to get a holiday for
 *     responses:
 *       200:
 *         description: List of holidays retrieved successfully
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
 *                     $ref: '#/components/schemas/HolidayPopulated'
 *             example:
 *               success: true
 *               data:
 *                 - id: "65f2b2c3d4e5f6a7b8c9d033"
 *                   title: "Independence Day"
 *                   date: "2026-08-15T00:00:00.000Z"
 *                   description: "National Independence Day holiday"
 *                   createdBy:
 *                     _id: "65f2a1b2c3d4e5f6a7b8c9d0"
 *                     name: "Admin User"
 *                     email: "admin@erp.com"
 *                     role: "admin"
 *                   createdAt: "2026-06-24T23:00:00.000Z"
 *                   updatedAt: "2026-06-24T23:00:00.000Z"
 *       400:
 *         description: Bad Request - Invalid parameters format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid 'month'. Must be between 1 and 12"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No token provided"
 *       403:
 *         description: Forbidden - Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Forbidden - Access denied"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */

/**
 * @swagger
 * /api/holidays/{id}:
 *   put:
 *     summary: Update an existing holiday
 *     description: Update details of a holiday by its ID. Admin only.
 *     tags:
 *       - Holidays
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Holiday ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the holiday
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of the holiday (e.g. YYYY-MM-DD)
 *               description:
 *                 type: string
 *                 description: Optional description of the holiday
 *           example:
 *             title: "Updated Independence Day"
 *             date: "2026-08-16"
 *     responses:
 *       200:
 *         description: Holiday updated successfully
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
 *                   $ref: '#/components/schemas/Holiday'
 *             example:
 *               success: true
 *               message: "Holiday updated successfully"
 *               data:
 *                 id: "65f2b2c3d4e5f6a7b8c9d033"
 *                 title: "Updated Independence Day"
 *                 date: "2026-08-16T00:00:00.000Z"
 *                 description: "National Independence Day holiday"
 *                 createdBy: "65f2a1b2c3d4e5f6a7b8c9d0"
 *                 createdAt: "2026-06-24T23:00:00.000Z"
 *                 updatedAt: "2026-06-24T23:05:00.000Z"
 *       400:
 *         description: Bad Request - Invalid date format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid date format"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No token provided"
 *       403:
 *         description: Forbidden - Access denied
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Forbidden - Access denied"
 *       404:
 *         description: Holiday not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Holiday not found"
 *       409:
 *         description: Conflict - A holiday already exists on updated date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "A holiday already exists on this date"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */

router.post("/", authenticate, authorize("admin"), createHoliday);
router.get("/", authenticate, authorize("admin", "student"), getHolidays);
router.put("/:id", authenticate, authorize("admin"), updateHoliday);

module.exports = router;

