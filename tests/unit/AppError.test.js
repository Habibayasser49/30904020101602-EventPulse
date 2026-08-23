const AppError = require('../../utils/AppError');

describe('AppError', () => {
    test('should create a 404 fail error', () => {
        const error = new AppError('Not found', 404);

        expect(error.statusCode).toBe(404);
        expect(error.status).toBe('fail');
    });

    test('should create a 500 error with status error', () => {
        const error = new AppError('Server error', 500);

        expect(error.statusCode).toBe(500);
        expect(error.status).toBe('error');
    });

    test('should default isOperational to true', () => {
        const error = new AppError('Something went wrong', 400);

        expect(error.isOperational).toBe(true);
    });

    test('should be an instance of native Error', () => {
        const error = new AppError('Not found', 404);

        expect(error).toBeInstanceOf(Error);
    });
});