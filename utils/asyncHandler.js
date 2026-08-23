const asyncHandler = (fn) => {
    return (req, res, next) => {
        try {
            Promise.resolve(fn(req, res, next))
                .catch(next);
        } catch (error) {
            next(error);
        }
    };
};

module.exports = asyncHandler;