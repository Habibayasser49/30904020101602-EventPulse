const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email }).select('+password');

    if (existingUser) {
        throw new AppError('User already exists' ,400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        name,
        email,
        password: hashedPassword
    });

    res.status(201).json({
        message: 'User registered successfully',
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new AppError('Invalid email or password', 401);
    }

    const isPasswordCorrect = await bcrypt.compare(
        password, 
        user.password
    );

    if (!isPasswordCorrect) {
        throw new AppError('Invalid email or password', 401);
    }

    const token = jwt.sign(
        { 
            id: user._id, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { 
            expiresIn: process.env.JWT_EXPIRES_IN,
        }
    );

    res.json({
        message: 'Login successful',
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

const getProfile = asyncHandler(async (req, res) => {
        const user = await User.findById(req.user.id)
        .select('-password');

        if (!user) {
            throw new AppError('User not found', 404);
        }

        res.json(user);
});


const adminTest = async (req, res) => {
        res.json({
            message: 'Admin access granted',
        });
    };

module.exports = {
    register,
    login,
    getProfile,
    adminTest
};