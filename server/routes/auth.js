const express = require('express');
const { login, getProfile, verifyToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { authRateLimit } = require('../middleware/rateLimiting');

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Login user with email and password
 * @access Public
 */
router.post('/login', authRateLimit, validate(schemas.login), login);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route GET /api/auth/verify
 * @desc Verify JWT token validity
 * @access Private
 */
router.get('/verify', authenticateToken, verifyToken);

module.exports = router;