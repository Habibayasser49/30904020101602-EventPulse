const { body } = require('express-validator');

const registerValidator = [
    body('eventId')
        .isMongoId()
        .withMessage('Event ID must be a valid MongoId')
];

module.exports = {
    registerValidator
};