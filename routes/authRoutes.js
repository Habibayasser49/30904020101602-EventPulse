const express = require('express');

const {
    register,
    login,
    getProfile,
    adminTest
} = require('../controllers/authController');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const {
    registerValidator,
    loginValidator
} = require('../middleware/validators/authValidator');

const validate = require('../middleware/validate');

const router = express.Router();


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
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
 *                 example: Test User
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: testpassword123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       422:
 *         description: Validation error
 */
router.post(
    '/register',
    registerValidator,
    validate,
    register
);


/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: testpassword123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 *       422:
 *         description: Validation error
 */
router.post(
    '/login',
    loginValidator,
    validate,
    login
);


/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/profile',
    requireAuth,
    getProfile
);


/**
 * @swagger
 * /api/auth/admin-test:
 *   get:
 *     summary: Test admin-only access
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access confirmed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get(
    '/admin-test',
    requireAuth,
    requireRole('admin'),
    adminTest
);


module.exports = router;