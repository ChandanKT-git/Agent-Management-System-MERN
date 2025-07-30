const rateLimit = require('express-rate-limit');
const { rateLimitConfigs } = require('./validation');

/**
 * Create rate limiter with custom configuration
 * @param {Object} config - Rate limiting configuration
 * @returns {Function} Express middleware
 */
const createRateLimiter = (config) => {
    return rateLimit({
        ...config,
        // Custom key generator to include user ID if available
        keyGenerator: (req) => {
            const userId = req.user?.id || req.ip;
            return `${userId}:${req.route?.path || req.path}`;
        },
        // Skip successful requests for certain endpoints
        skip: (req, res) => {
            // Don't count successful auth requests against the limit
            if (req.path.includes('/auth/verify') && res.statusCode === 200) {
                return true;
            }
            return false;
        },
        // Custom handler for rate limit exceeded
        handler: (req, res) => {
            res.status(429).json(config.message);
        }
    });
};

// Pre-configured rate limiters
const authRateLimit = createRateLimiter(rateLimitConfigs.auth);
const uploadRateLimit = createRateLimiter(rateLimitConfigs.upload);
const apiRateLimit = createRateLimiter(rateLimitConfigs.api);

// Strict rate limiter for sensitive operations
const strictRateLimit = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per hour
    message: {
        success: false,
        error: {
            code: 'STRICT_RATE_LIMIT_EXCEEDED',
            message: 'Too many attempts for this sensitive operation. Please try again in 1 hour.'
        }
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    createRateLimiter,
    authRateLimit,
    uploadRateLimit,
    apiRateLimit,
    strictRateLimit
};