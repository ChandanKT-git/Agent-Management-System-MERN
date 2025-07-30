const { verifyToken, extractTokenFromHeader } = require('../utils/auth');
const User = require('../models/User');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request object
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const token = extractTokenFromHeader(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Access token is required'
                }
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Find user by ID from token
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not found'
                }
            });
        }

        // Attach user to request object
        req.user = user;
        next();

    } catch (error) {
        console.error('Authentication error:', error.message);

        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: error.message || 'Invalid or expired token'
            }
        });
    }
};

/**
 * Authorization middleware to check user roles
 * @param {string[]} allowedRoles - Array of allowed roles
 */
const authorizeRoles = (allowedRoles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
        }

        if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions'
                }
            });
        }

        next();
    };
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = extractTokenFromHeader(req.headers.authorization);

        if (token) {
            const decoded = verifyToken(token);
            const user = await User.findById(decoded.userId).select('-password');

            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // Continue without authentication if token is invalid
        next();
    }
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    optionalAuth
};