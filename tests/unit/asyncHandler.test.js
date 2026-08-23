const asyncHandler = require('../../utils/asyncHandler');

describe('asyncHandler', () => {
    test('should call the wrapped controller with req, res, and next', async () => {
        const req = { body: {} };
        const res = {};
        const next = jest.fn();

        const controller = jest.fn();

        const wrappedController = asyncHandler(controller);

        wrappedController(req, res, next);

        await Promise.resolve();

        expect(controller).toHaveBeenCalledWith(
            req,
            res,
            next
        );
    });

    test('should pass rejected errors to next', async () => {
        const req = {};
        const res = {};
        const next = jest.fn();

        const error = new Error('Test error');

        const controller = jest.fn().mockRejectedValue(error);

        const wrappedController = asyncHandler(controller);

        wrappedController(req, res, next);

        await Promise.resolve();

        expect(next).toHaveBeenCalledWith(error);
    });

    test('should pass thrown errors to next', async () => {
        const req = {};
        const res = {};
        const next = jest.fn();

        const error = new Error('Thrown error');

        const controller = jest.fn().mockImplementation(() => {
            throw error;
        });

        const wrappedController = asyncHandler(controller);

        wrappedController(req, res, next);

        await Promise.resolve();

        expect(next).toHaveBeenCalledWith(error);
    });
});