// Enhanced validation utility functions with security measures

/**
 * Sanitize input to prevent XSS attacks
 */
export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .replace(/[<>]/g, '') // Remove angle brackets
        .trim();
};

/**
 * Enhanced email validation with additional security checks
 */
export const validateEmail = (email) => {
    if (!email || typeof email !== 'string') return false;

    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    // Additional security checks
    const sanitized = sanitizeInput(email);
    if (sanitized !== email) return false; // Contains suspicious characters

    // Check for common malicious patterns
    const maliciousPatterns = [
        /script/i,
        /javascript/i,
        /vbscript/i,
        /onload/i,
        /onerror/i
    ];

    return !maliciousPatterns.some(pattern => pattern.test(email));
};

/**
 * Enhanced phone validation with security checks
 */
export const validatePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;

    // Sanitize input first
    const sanitized = sanitizeInput(phone);
    if (sanitized !== phone) return false;

    // Enhanced phone validation
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,15}$/;
    return phoneRegex.test(phone);
};

/**
 * Enhanced required field validation with sanitization
 */
export const validateRequired = (value) => {
    if (!value) return false;

    const stringValue = value.toString().trim();
    if (stringValue.length === 0) return false;

    // Check for suspicious content - if input becomes empty after sanitization, it's invalid
    const sanitized = sanitizeInput(stringValue);
    return sanitized.length > 0;
};

export const validateMinLength = (value, minLength) => {
    return value && value.toString().length >= minLength;
};

export const validateMaxLength = (value, maxLength) => {
    return !value || value.toString().length <= maxLength;
};

/**
 * Enhanced file type validation with security checks
 */
export const validateFileType = (file, allowedTypes) => {
    if (!file || !file.name) return false;

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Check file extension
    const extension = sanitizedName.toLowerCase().split('.').pop();
    const allowedExtensions = ['csv', 'xlsx', 'xls'];

    if (!allowedExtensions.includes(extension)) return false;

    // Check MIME type
    const allowedMimeTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/csv',
        'text/plain'
    ];

    return allowedMimeTypes.includes(file.type);
};

export const validateCSVStructure = (csvText, requiredColumns = []) => {
    try {
        const lines = csvText.split('\n').filter(line => line.trim());

        if (lines.length === 0) {
            return { isValid: false, error: 'File appears to be empty' };
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const missingColumns = requiredColumns.filter(col =>
            !headers.some(header => header.toLowerCase() === col.toLowerCase())
        );

        if (missingColumns.length > 0) {
            return {
                isValid: false,
                error: `Missing required columns: ${missingColumns.join(', ')}`
            };
        }

        return {
            isValid: true,
            headers,
            totalRows: lines.length - 1
        };
    } catch (error) {
        return {
            isValid: false,
            error: 'Failed to parse CSV file. Please check the file format.'
        };
    }
};

export const validateFileSize = (file, maxSizeInMB) => {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
};

/**
 * Enhanced password strength validation
 */
export const validatePasswordStrength = (password) => {
    if (!password || typeof password !== 'string') return false;

    // Minimum length
    if (password.length < 8) return false;

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) return false;

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) return false;

    // Check for at least one number
    if (!/\d/.test(password)) return false;

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

    // Check for common weak patterns (only if they are the main part of the password)
    const weakPatterns = [
        /^123456/,
        /^password$/i,
        /^qwerty$/i,
        /^admin$/i,
        /(.)\1{3,}/ // Repeated characters (4 or more in a row)
    ];

    return !weakPatterns.some(pattern => pattern.test(password));
};

/**
 * Get password strength score and feedback
 */
export const getPasswordStrength = (password) => {
    if (!password) return { score: 0, feedback: 'Password is required' };

    let score = 0;
    const feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('One uppercase letter');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('One lowercase letter');

    if (/\d/.test(password)) score += 1;
    else feedback.push('One number');

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
    else feedback.push('One special character');

    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];

    return {
        score,
        strength,
        feedback: feedback.length > 0 ? `Missing: ${feedback.join(', ')}` : 'Strong password!'
    };
};

// Form validation helper
export const createValidator = (rules) => {
    return (values) => {
        const errors = {};

        Object.keys(rules).forEach(field => {
            const fieldRules = rules[field];
            const value = values[field];

            for (const rule of fieldRules) {
                const error = rule(value, values);
                if (error) {
                    errors[field] = error;
                    break; // Stop at first error for this field
                }
            }
        });

        return errors;
    };
};

// Enhanced validation rules with security
export const required = (message = 'This field is required') => (value) => {
    return validateRequired(value) ? null : message;
};

export const email = (message = 'Please enter a valid email address') => (value) => {
    return !value || validateEmail(value) ? null : message;
};

export const minLength = (min, message) => (value) => {
    const msg = message || `Must be at least ${min} characters`;
    return !value || validateMinLength(value, min) ? null : msg;
};

export const maxLength = (max, message) => (value) => {
    const msg = message || `Must be no more than ${max} characters`;
    return validateMaxLength(value, max) ? null : msg;
};

export const strongPassword = (message = 'Password must be strong') => (value) => {
    return !value || validatePasswordStrength(value) ? null : message;
};

export const phoneNumber = (message = 'Please enter a valid phone number') => (value) => {
    return !value || validatePhone(value) ? null : message;
};