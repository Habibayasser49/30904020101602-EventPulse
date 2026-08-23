const express = require('express');

const {
    registerValidator
} = require('../middleware/validators/registrationValidator');

const validate = require('../middleware/validate');

const {
    registerForEvent,
    getMyRegistrations,
    cancelRegistration
} = require('../controllers/registrationController');

const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

/**
 * @swagger
 * /api/registrations:
 *   post:
 *     summary: Register for an event
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Successfully registered for the event
 *       400:
 *         description: Event is full or user is already registered
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post(
    '/', 
    requireAuth,
    registerValidator,
    validate,
    registerForEvent
);

/**
 * @swagger
 * /api/registrations/my:
 *   get:
 *     summary: Get the current user's registrations
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's registrations
 *       401:
 *         description: Unauthorized
 */
router.get('/my', requireAuth, getMyRegistrations);

/**
 * @swagger
 * /api/registrations/{registrationId}:
 *   delete:
 *     summary: Cancel a registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: registrationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the registration
 *     responses:
 *       200:
 *         description: Registration cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not allowed to cancel this registration
 *       404:
 *         description: Registration not found
 */
router.delete('/:registrationId', requireAuth, cancelRegistration);

module.exports = router;