/**
 * Extract user-friendly error message from API error response
 */
export const getErrorMessage = (error) => {
    // Network error
    if (!error.response) {
        if (error.code === 'ECONNABORTED') {
            return 'Request timed out. Please check your connection and try again.'
        }
        return 'Network error. Please check your connection and try again.'
    }

    // Server responded with error
    const { data, status } = error.response

    // Use server-provided error message if available
    if (data?.error?.message) {
        return data.error.message
    }

    // Fallback messages based on status code
    switch (status) {
        case 400:
            return 'Invalid request. Please check your input and try again.'
        case 401:
            return 'Authentication required. Please log in again.'
        case 403:
            return 'You do not have permission to perform this action.'
        case 404:
            return 'The requested resource was not found.'
        case 409:
            return 'This resource already exists.'
        case 413:
            return 'File is too large. Please choose a smaller file.'
        case 429:
            return 'Too many requests. Please wait a moment and try again.'
        case 500:
            return 'Server error. Please try again later.'
        case 503:
            return 'Service temporarily unavailable. Please try again later.'
        default:
            return 'An unexpected error occurred. Please try again.'
    }
}

/**
 * Extract validation errors from API response
 */
export const getValidationErrors = (error) => {
    if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details

        // Convert array of error objects to field-message mapping
        if (Array.isArray(details)) {
            return details.reduce((acc, detail) => {
                acc[detail.field] = detail.message
                return acc
            }, {})
        }

        return details
    }

    return {}
}

/**
 * Check if error is a validation error
 */
export const isValidationError = (error) => {
    return error.response?.data?.error?.code === 'VALIDATION_ERROR'
}

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
    return !error.response
}

/**
 * Check if error is retryable
 */
export const isRetryableError = (error) => {
    if (isNetworkError(error)) {
        return true
    }

    const status = error.response?.status
    return status >= 500 || status === 429
}

/**
 * Log error for debugging
 */
export const logError = (error, context = {}) => {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method,
        context,
        timestamp: new Date().toISOString()
    }

    console.error('Error logged:', errorInfo)

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
        // sendToLoggingService(errorInfo)
    }
}

/**
 * Create error handler hook
 */
export const useErrorHandler = () => {
    const handleError = (error, context = {}) => {
        logError(error, context)

        // Return user-friendly message
        return getErrorMessage(error)
    }

    return { handleError, getErrorMessage, getValidationErrors, isValidationError }
}