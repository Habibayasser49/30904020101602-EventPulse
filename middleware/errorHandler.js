const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let status = err.status || 'error';
    let message = err.message || 'Something went wrong';

    if (err.name === 'ValidationError') {
        statusCode = 400;
        status = 'fail';
        message = 'Validation error';
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        status = 'fail';
        message = 'Invalid ID format';
    }

    if (err.code === 11000) {
        statusCode = 409;
        status = 'fail';
        message = 'Duplicate value';
    }

    res.status(statusCode).json({
        status,
        message
    });
};

module.exports = errorHandler;