const User = require('../models/User');
const { generateToken } = require('../utils/auth');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { validate, schemas } = require('../middleware/validation');

/**
 * Login user with email and password
 * @route POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);

    if (!user) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const token = generateToken({
        userId: user._id,
        email: user.email,
        role: user.role
    });

    // Return success response with token and user data
    res.status(200).json({
        success: true,
        data: {
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        },
        message: 'Login successful'
    });
});

/**
 * Get current user profile
 * @route GET /api/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
    // User is attached to request by auth middleware
    const user = req.user;

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        }
    });
});

/**
 * Verify token validity
 * @route GET /api/auth/verify
 */
const verifyToken = asyncHandler(async (req, res) => {
    // If we reach here, token is valid (verified by auth middleware)
    res.status(200).json({
        success: true,
        data: {
            valid: true,
            user: {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role
            }
        },
        message: 'Token is valid'
    });
});

module.exports = {
    login,
    getProfile,
    verifyToken
};