const { body } = require('express-validator');

const registerValidator = [ 
    body('name')
    .notEmpty()
    .withMessage('Name is required'),

    body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),

    body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
];

const loginValidator = [
    body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),

    body('password')
    .notEmpty()
    .withMessage('Password is required')
]; 

module.exports = {
    registerValidator,
    loginValidator
};