const express = require('express');
const router = express.Router();

const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
} = require('../controllers/eventController');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const {
    createEventValidator,
    updateEventValidator
} = require('../middleware/validators/eventValidator');

const validate = require('../middleware/validate');


/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
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
 *               - description
 *               - date
 *               - city
 *               - venue
 *               - capacity
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tech Conference 2026
 *               description:
 *                 type: string
 *                 example: A conference about modern technology
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-12-15T10:00:00.000Z
 *               city:
 *                 type: string
 *                 example: Cairo
 *               venue:
 *                 type: string
 *                 example: Cairo Conference Center
 *               capacity:
 *                 type: integer
 *                 example: 100
 *               category:
 *                 type: string
 *                 example: 64f123456789abcdef123456
 *     responses:
 *       201:
 *         description: Event created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       422:
 *         description: Validation error
 */
router.post(
    "/",
    requireAuth,
    requireRole('admin'),
    createEventValidator,
    validate,
    createEvent
);


/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events with filtering, pagination, sorting and search
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of events per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date, newest, popular]
 *         description: Sort events
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search event name and description
 *     responses:
 *       200:
 *         description: List of events
 */
router.get(
    "/",
    getEvents
);


/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event found successfully
 *       404:
 *         description: Event not found
 */
router.get(
    "/:id",
    getEventById
);


/**
 * @swagger
 * /api/events/{id}:
 *   patch:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               city:
 *                 type: string
 *               venue:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Event not found
 *       422:
 *         description: Validation error
 */
router.patch(
    "/:id",
    requireAuth,
    requireRole('admin'),
    updateEventValidator,
    validate,
    updateEvent
);


/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Event not found
 */
router.delete(
    "/:id",
    requireAuth,
    requireRole('admin'),
    deleteEvent
);


module.exports = router;