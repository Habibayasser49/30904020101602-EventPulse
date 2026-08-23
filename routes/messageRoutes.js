const express = require('express');

const {
    sendAnnouncement,
    getMessageByEvent
} = require('../controllers/messageController');

const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const {
    sendAnnouncementValidator
} = require('../middleware/validators/messageValidator');

const validate = require('../middleware/validate');

const router = express.Router();

router.post(
    '/',
    requireAuth,
    requireRole('admin'),
    sendAnnouncementValidator,
    validate,
    sendAnnouncement
);

router.get(
    '/:eventId',
    getMessageByEvent
);

module.exports = router;