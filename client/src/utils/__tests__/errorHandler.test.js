import {
    getErrorMessage,
    getValidationErrors,
    isValidationError,
    isNetworkError,
    isRetryableError,
    logError
} from '../errorHandler'

import { vi } from 'vitest'

// Mock console.error for tests
const originalError = console.error
beforeAll(() => {
    console.error = vi.fn()
})

afterAll(() => {
    console.error = originalError
})

describe('errorHandler utils', () => {
    describe('getErrorMessage', () => {
        test('returns network error message for no response', () => {
            const error = { code: 'ECONNABORTED' }
            expect(getErrorMessage(error)).toBe('Request timed out. Please check your connection and try again.')
        })

        test('returns generic network error for other network errors', () => {
            const error = {}
            expect(getErrorMessage(error)).toBe('Network error. Please check your connection and try again.')
        })

        test('returns server-provided error message when available', () => {
            const error = {
                response: {
                    status: 400,
                    data: {
                        error: {
                            message: 'Custom error message'
                        }
                    }
                }
            }
            expect(getErrorMessage(error)).toBe('Custom error message')
        })

        test('returns appropriate message for different status codes', () => {
            const testCases = [
                { status: 400, expected: 'Invalid request. Please check your input and try again.' },
                { status: 401, expected: 'Authentication required. Please log in again.' },
                { status: 403, expected: 'You do not have permission to perform this action.' },
                { status: 404, expected: 'The requested resource was not found.' },
                { status: 409, expected: 'This resource already exists.' },
                { status: 413, expected: 'File is too large. Please choose a smaller file.' },
                { status: 429, expected: 'Too many requests. Please wait a moment and try again.' },
                { status: 500, expected: 'Server error. Please try again later.' },
                { status: 503, expected: 'Service temporarily unavailable. Please try again later.' },
                { status: 999, expected: 'An unexpected error occurred. Please try again.' }
            ]

            testCases.forEach(({ status, expected }) => {
                const error = { response: { status, data: {} } }
                expect(getErrorMessage(error)).toBe(expected)
            })
        })
    })

    describe('getValidationErrors', () => {
        test('returns validation errors from response', () => {
            const error = {
                response: {
                    data: {
                        error: {
                            details: [
                                { field: 'email', message: 'Email is required' },
                                { field: 'password', message: 'Password is too short' }
                            ]
                        }
                    }
                }
            }

            const result = getValidationErrors(error)
            expect(result).toEqual({
                email: 'Email is required',
                password: 'Password is too short'
            })
        })

        test('returns details object if not array', () => {
            const error = {
                response: {
                    data: {
                        error: {
                            details: { email: 'Email is required' }
                        }
                    }
                }
            }

            const result = getValidationErrors(error)
            expect(result).toEqual({ email: 'Email is required' })
        })

        test('returns empty object when no details', () => {
            const error = { response: { data: { error: {} } } }
            expect(getValidationErrors(error)).toEqual({})
        })
    })

    describe('isValidationError', () => {
        test('returns true for validation errors', () => {
            const error = {
                response: {
                    data: {
                        error: {
                            code: 'VALIDATION_ERROR'
                        }
                    }
                }
            }
            expect(isValidationError(error)).toBe(true)
        })

        test('returns false for non-validation errors', () => {
            const error = {
                response: {
                    data: {
                        error: {
                            code: 'INTERNAL_SERVER_ERROR'
                        }
                    }
                }
            }
            expect(isValidationError(error)).toBe(false)
        })
    })

    describe('isNetworkError', () => {
        test('returns true when no response', () => {
            const error = {}
            expect(isNetworkError(error)).toBe(true)
        })

        test('returns false when response exists', () => {
            const error = { response: { status: 500 } }
            expect(isNetworkError(error)).toBe(false)
        })
    })

    describe('isRetryableError', () => {
        test('returns true for network errors', () => {
            const error = {}
            expect(isRetryableError(error)).toBe(true)
        })

        test('returns true for 5xx errors', () => {
            const error = { response: { status: 500 } }
            expect(isRetryableError(error)).toBe(true)
        })

        test('returns true for 429 errors', () => {
            const error = { response: { status: 429 } }
            expect(isRetryableError(error)).toBe(true)
        })

        test('returns false for 4xx errors (except 429)', () => {
            const error = { response: { status: 400 } }
            expect(isRetryableError(error)).toBe(false)
        })
    })

    describe('logError', () => {
        test('logs error information', () => {
            const error = {
                message: 'Test error',
                stack: 'Error stack',
                response: { data: 'response data', status: 500 },
                config: { url: '/api/test', method: 'GET' }
            }

            logError(error, { userId: '123' })

            expect(console.error).toHaveBeenCalledWith('Error logged:', expect.objectContaining({
                message: 'Test error',
                stack: 'Error stack',
                response: 'response data',
                status: 500,
                url: '/api/test',
                method: 'GET',
                context: { userId: '123' },
                timestamp: expect.any(String)
            }))
        })
    })
})