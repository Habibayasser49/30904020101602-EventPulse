const { body } = require('express-validator');

const sendAnnouncementValidator = [
    body('eventId')
        .isMongoId()
        .withMessage('Event ID must be a valid MongoId'),

    body('text')
        .notEmpty()
        .withMessage('Announcement text is required')
];

module.exports = {
    sendAnnouncementValidator
};