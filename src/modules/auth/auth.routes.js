const express = require("express");
const router = express.Router();


const {
    registerUser,
    loginUser,
    getMe,
    forgotPassword,
    verifyOtp,
    resetPassword
} = require("./auth.controller");

const authenticate = require("../../middlewares/authenticate");
const sendEmail = require("../../utils/sendEmail");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the user
 *           example: "65f2a1b2c3d4e5f6a7b8c9d0"
 *         name:
 *           type: string
 *           description: The user's full name
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *           example: "john.doe@example.com"
 *         role:
 *           type: string
 *           enum: [admin, teacher, student, parent]
 *           description: The role assigned to the user
 *           example: "student"
 *         isApproved:
 *           type: boolean
 *           description: Status of user approval (teachers and parents require admin approval)
 *           example: true
 *         isActive:
 *           type: boolean
 *           description: Status of whether the user account is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-06-20T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-06-20T10:00:00.000Z"
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Invalid credentials"
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user in the system. Student accounts are approved automatically, while teachers and parents require admin approval before they can log in.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 description: The user's password
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, student, parent]
 *                 default: student
 *                 description: The role of the user
 *           example:
 *             name: "John Doe"
 *             email: "john.doe@example.com"
 *             password: "Password123"
 *             role: "student"
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               message: "User registered successfully"
 *               data:
 *                 id: "65f2a1b2c3d4e5f6a7b8c9d0"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 role: "student"
 *                 isApproved: true
 *       400:
 *         description: Bad Request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Name, email and password are required"
 *       409:
 *         description: Conflict - User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User already exists"
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
router.post("/register", registerUser);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user / Login
 *     description: Authenticate credentials (email, password, and role) and return a JWT access token.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               password:
 *                 type: string
 *                 description: User password
 *               role:
 *                 type: string
 *                 enum: [admin, teacher, student, parent]
 *                 description: User role
 *           example:
 *             email: "john.doe@example.com"
 *             password: "Password123"
 *             role: "student"
 *     responses:
 *       200:
 *         description: Login successful, returns a JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *             example:
 *               success: true
 *               message: "Login successful"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               data:
 *                 id: "65f2a1b2c3d4e5f6a7b8c9d0"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 role: "student"
 *       400:
 *         description: Bad Request - Missing credentials or role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Email, password and role are required"
 *       401:
 *         description: Unauthorized - Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid credentials"
 *       403:
 *         description: Forbidden - Invalid role, pending admin approval, or account deactivated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Account is pending admin approval"
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
router.post("/login", loginUser);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user details
 *     description: Retrieve details of the user whose token is in the Authorization header.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved current user details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               success: true
 *               data:
 *                 id: "65f2a1b2c3d4e5f6a7b8c9d0"
 *                 name: "John Doe"
 *                 email: "john.doe@example.com"
 *                 role: "student"
 *                 isApproved: true
 *                 isActive: true
 *                 createdAt: "2026-06-20T10:00:00.000Z"
 *                 updatedAt: "2026-06-20T10:00:00.000Z"
 *       401:
 *         description: Unauthorized - Missing, invalid, or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "No token provided"
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
router.get("/me", authenticate, getMe);

router.post("/forgot-password", forgotPassword);

router.post("/verify-otp", verifyOtp);

router.post("/reset-password", resetPassword);



module.exports = router;