const logger = require('./logger');

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
    constructor(message, statusCode, code = null, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (error, req) => {
    const response = {
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'Something went wrong on the server',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        }
    };

    // Add details for validation errors
    if (error.details) {
        response.error.details = error.details;
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development' && error.stack) {
        response.error.stack = error.stack;
    }

    return response;
};

/**
 * Handle different types of errors
 */
const handleError = (error, req, res, next) => {
    let err = { ...error };
    err.message = error.message;

    // Log error
    logger.error('Error occurred:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
    });

    // Mongoose bad ObjectId
    if (error.name === 'CastError') {
        const message = 'Resource not found';
        err = new AppError(message, 404, 'RESOURCE_NOT_FOUND');
    }

    // Mongoose duplicate key
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        const message = `${field} already exists`;
        err = new AppError(message, 409, 'DUPLICATE_ERROR', {
            field,
            value: error.keyValue[field]
        });
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(val => ({
            field: val.path,
            message: val.message
        }));
        err = new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        err = new AppError(message, 401, 'INVALID_TOKEN');
    }

    if (error.name === 'TokenExpiredError') {
        const message = 'Token expired';
        err = new AppError(message, 401, 'TOKEN_EXPIRED');
    }

    // Multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large';
        err = new AppError(message, 413, 'FILE_TOO_LARGE');
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Unexpected file field';
        err = new AppError(message, 400, 'INVALID_FILE_FIELD');
    }

    // File processing errors
    if (error.code === 'INVALID_FILE_FORMAT') {
        err = new AppError(error.message, 400, 'INVALID_FILE_FORMAT');
    }

    // Database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
        const message = 'Database connection failed';
        err = new AppError(message, 503, 'DATABASE_ERROR');
    }

    // Rate limiting errors
    if (error.status === 429) {
        const message = 'Too many requests, please try again later';
        err = new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
    }

    const statusCode = err.statusCode || 500;
    const response = formatErrorResponse(err, req);

    res.status(statusCode).json(response);
};

/**
 * Async error wrapper to catch async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = (server) => {
    process.on('unhandledRejection', (err, promise) => {
        logger.error('Unhandled Promise Rejection:', err);
        console.log('Shutting down the server due to Unhandled Promise rejection');
        server.close(() => {
            process.exit(1);
        });
    });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception:', err);
        console.log('Shutting down the server due to Uncaught Exception');
        process.exit(1);
    });
};

module.exports = {
    AppError,
    handleError,
    asyncHandler,
    handleUnhandledRejection,
    handleUncaughtException,
    formatErrorResponse
};