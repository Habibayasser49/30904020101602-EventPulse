const User = require('../models/User');

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password');

    res.json(users);
});

const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
        throw new AppError('User not found', 404);
    }

    res.json(user);
});

const updateUser = asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (name !== undefined) {
        user.name = name;
    }

    if (email !== undefined) {
        user.email = email;
    }

    if (role !== undefined) {
        user.role = role;
    }

    await user.save();

    res.json({
        message: 'User updated successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    await user.deleteOne();

    res.json({
        message: 'User deleted successfully'
    });
});

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};