const Joi = require('joi');
const { AppError } = require('../utils/errorHandler');

/**
 * Input sanitization function to prevent injection attacks
 */
const sanitizeInput = (input) => {
    if (typeof input === 'string') {
        // Remove potentially dangerous characters and patterns
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+\s*=/gi, '') // Remove event handlers
            .replace(/[<>]/g, '') // Remove angle brackets
            .trim();
    }
    return input;
};

/**
 * Deep sanitization for objects and arrays
 */
const deepSanitize = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(deepSanitize);
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = deepSanitize(value);
        }
        return sanitized;
    }

    return sanitizeInput(obj);
};

/**
 * Validation middleware factory with input sanitization
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 * @param {boolean} sanitize - Whether to sanitize input (default: true)
 */
const validate = (schema, property = 'body', sanitize = true) => {
    return (req, res, next) => {
        // Sanitize input before validation if enabled
        if (sanitize && req[property]) {
            req[property] = deepSanitize(req[property]);
        }

        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false
        });

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
            }));

            return next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
        }

        // Replace the original data with validated and sanitized data
        req[property] = value;
        next();
    };
};

// Common validation schemas
const schemas = {
    // User authentication
    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'Password is required'
        })
    }),

    // Agent creation/update
    agent: Joi.object({
        name: Joi.string().trim().min(2).max(100).required().messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
        }),
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
        mobile: Joi.object({
            countryCode: Joi.string().pattern(/^\+\d{1,4}$/).required().messages({
                'string.pattern.base': 'Country code must start with + followed by 1-4 digits',
                'any.required': 'Country code is required'
            }),
            number: Joi.string().pattern(/^\d{7,15}$/).required().messages({
                'string.pattern.base': 'Mobile number must be 7-15 digits',
                'any.required': 'Mobile number is required'
            })
        }).required(),
        password: Joi.string().min(6).required().messages({
            'string.min': 'Password must be at least 6 characters long',
            'any.required': 'Password is required'
        })
    }),

    // Agent update (password optional)
    agentUpdate: Joi.object({
        name: Joi.string().trim().min(2).max(100).messages({
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        email: Joi.string().email().messages({
            'string.email': 'Please provide a valid email address'
        }),
        mobile: Joi.object({
            countryCode: Joi.string().pattern(/^\+\d{1,4}$/).messages({
                'string.pattern.base': 'Country code must start with + followed by 1-4 digits'
            }),
            number: Joi.string().pattern(/^\d{7,15}$/).messages({
                'string.pattern.base': 'Mobile number must be 7-15 digits'
            })
        }),
        password: Joi.string().min(6).messages({
            'string.min': 'Password must be at least 6 characters long'
        })
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    }),

    // MongoDB ObjectId
    objectId: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            'string.pattern.base': 'Invalid ID format',
            'any.required': 'ID is required'
        })
    }),

    // Query parameters
    pagination: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sort: Joi.string().valid('name', 'email', 'createdAt', '-name', '-email', '-createdAt').default('-createdAt'),
        search: Joi.string().trim().max(100)
    }),

    // Agent ID parameter
    agentId: Joi.object({
        id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
            'string.pattern.base': 'Invalid agent ID format',
            'any.required': 'Agent ID is required'
        })
    }),

    // Agent tasks query parameters
    agentTasksQuery: Joi.object({
        status: Joi.string().valid('assigned', 'completed').messages({
            'any.only': 'Status must be either "assigned" or "completed"'
        }),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    }),

    // File upload validation
    fileUpload: Joi.object({
        filename: Joi.string().trim().min(1).max(255).required().messages({
            'string.min': 'Filename cannot be empty',
            'string.max': 'Filename too long',
            'any.required': 'Filename is required'
        }),
        mimetype: Joi.string().valid(
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/csv',
            'text/plain'
        ).required().messages({
            'any.only': 'Invalid file type. Only CSV, XLSX, and XLS files are allowed',
            'any.required': 'File type is required'
        }),
        size: Joi.number().integer().min(1).max(5 * 1024 * 1024).required().messages({
            'number.min': 'File cannot be empty',
            'number.max': 'File size cannot exceed 5MB',
            'any.required': 'File size is required'
        })
    }),

    // Distribution query parameters
    distributionQuery: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        sortBy: Joi.string().valid('createdAt', 'filename', 'totalItems').default('createdAt'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
};

/**
 * Rate limiting configuration for different endpoint types
 */
const rateLimitConfigs = {
    // Strict rate limiting for authentication endpoints
    auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
        message: {
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many authentication attempts. Please try again in 15 minutes.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    },

    // Moderate rate limiting for file uploads
    upload: {
        windowMs: 60 * 1000, // 1 minute
        max: 3, // 3 uploads per minute
        message: {
            success: false,
            error: {
                code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
                message: 'Too many file uploads. Please wait before uploading again.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    },

    // General API rate limiting
    api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: {
            success: false,
            error: {
                code: 'API_RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.'
            }
        },
        standardHeaders: true,
        legacyHeaders: false
    }
};

module.exports = {
    validate,
    schemas,
    rateLimitConfigs,
    sanitizeInput,
    deepSanitize
};