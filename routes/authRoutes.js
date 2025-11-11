const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const {
  validate,
  registerSchema,
  loginSchema,
} = require("../middleware/validation");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [citizen, officer, department_head, admin]
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", validate(registerSchema), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", validate(loginSchema), login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get("/profile", authenticateToken, getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     tags: [Authentication]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put("/profile", authenticateToken, updateProfile);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.post("/change-password", authenticateToken, changePassword);

module.exports = router;
