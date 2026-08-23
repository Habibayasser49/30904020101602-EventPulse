const { body, param } = require('express-validator');

const createEventValidator = [
    body('title')
        .notEmpty()
        .withMessage('Event title is required'),

    body('description')
        .notEmpty()
        .withMessage('Description is required'),

    body('date')
        .isISO8601()
        .withMessage('Date must be valid'),

    body('city')
        .notEmpty()
        .withMessage('City is required'),

    body('venue')
        .notEmpty()
        .withMessage('Venue is required'),

    body('capacity')
        .isInt({ min: 1 })
        .withMessage('Capacity must be at least 1'),

    body('category')
        .isMongoId()
        .withMessage('Category must be a valid MongoId')
];

const updateEventValidator = [
    param('id')
    .isMongoId()
    .withMessage('Event ID must be a valid MongoId'),
    
    body('title')
        .optional()
        .notEmpty()
        .withMessage('Event title cannot be empty'),

    body('description')
        .optional()
        .notEmpty()
        .withMessage('Description cannot be empty'),

    body('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be valid'),

    body('city')
        .optional()
        .notEmpty()
        .withMessage('City cannot be empty'),

    body('venue')
        .optional()
        .notEmpty()
        .withMessage('Venue cannot be empty'),

    body('capacity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Capacity must be at least 1'),

    body('category')
        .optional()
        .isMongoId()
        .withMessage('Category must be a valid MongoId')
];

module.exports = {
    createEventValidator,
    updateEventValidator
};