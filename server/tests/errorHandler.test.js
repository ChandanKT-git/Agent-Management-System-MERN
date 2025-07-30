const {
    AppError,
    handleError,
    asyncHandler,
    formatErrorResponse
} = require('../utils/errorHandler');

// Mock logger
jest.mock('../utils/logger', () => ({
    error: jest.fn()
}));

describe('Error Handler Utils', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            originalUrl: '/api/test',
            method: 'POST',
            ip: '127.0.0.1',
            get: jest.fn().mockReturnValue('Mozilla/5.0'),
            user: { id: 'user123' }
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('AppError', () => {
        it('should create error with all properties', () => {
            const error = new AppError('Test error', 400, 'TEST_ERROR', { field: 'test' });

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('TEST_ERROR');
            expect(error.details).toEqual({ field: 'test' });
            expect(error.isOperational).toBe(true);
        });

        it('should create error with minimal properties', () => {
            const error = new AppError('Simple error', 500);

            expect(error.message).toBe('Simple error');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBeNull();
            expect(error.details).toBeNull();
            expect(error.isOperational).toBe(true);
        });

        it('should capture stack trace', () => {
            const error = new AppError('Test error', 400);
            expect(error.stack).toBeDefined();
        });
    });

    describe('formatErrorResponse', () => {
        it('should format basic error response', () => {
            const error = new AppError('Test error', 400, 'TEST_ERROR');
            const response = formatErrorResponse(error, mockReq);

            expect(response).toEqual({
                success: false,
                error: {
                    code: 'TEST_ERROR',
                    message: 'Test error',
                    timestamp: expect.any(String),
                    path: '/api/test',
                    method: 'POST'
                }
            });
        });

        it('should include details when present', () => {
            const error = new AppError('Validation error', 400, 'VALIDATION_ERROR', { field: 'email' });
            const response = formatErrorResponse(error, mockReq);

            expect(response.error.details).toEqual({ field: 'email' });
        });

        it('should include stack trace in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const error = new AppError('Test error', 400);
            error.stack = 'Error stack trace';
            const response = formatErrorResponse(error, mockReq);

            expect(response.error.stack).toBe('Error stack trace');

            process.env.NODE_ENV = originalEnv;
        });

        it('should not include stack trace in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const error = new AppError('Test error', 400);
            error.stack = 'Error stack trace';
            const response = formatErrorResponse(error, mockReq);

            expect(response.error.stack).toBeUndefined();

            process.env.NODE_ENV = originalEnv;
        });

        it('should handle errors without code', () => {
            const error = new Error('Generic error');
            const response = formatErrorResponse(error, mockReq);

            expect(response.error.code).toBe('INTERNAL_SERVER_ERROR');
            expect(response.error.message).toBe('Generic error');
        });
    });

    describe('handleError', () => {
        it('should handle AppError correctly', () => {
            const error = new AppError('Test error', 400, 'TEST_ERROR');
            handleError(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'TEST_ERROR',
                        message: 'Test error'
                    })
                })
            );
        });

        it('should handle Mongoose CastError', () => {
            const error = new Error('Cast to ObjectId failed');
            error.name = 'CastError';

            handleError(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'RESOURCE_NOT_FOUND',
                        message: 'Resource not found'
                    })
                })
            );
        });

        it('should handle Mongoose duplicate key error', () => {
            const error = new Error('Duplicate key error');
            error.code = 11000;
            error.keyValue = { email: 'test@example.com' };

            handleError(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'DUPLICATE_ERROR',
                        message: 'email already exists',
                        details: {
                            field: 'email',
                            value: 'test@example.com'
                        }
                    })
                })
            );
        });

        it('should handle Mongoose validation error', () => {
            const error = new Error('Validation failed');
            error.name = 'ValidationError';
            error.errors = {
                email: {
                    path: 'email',
                    message: 'Email is required'
                },
                name: {
                    path: 'name',
                    message: 'Name is required'
                }
            };

            handleError(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'VALIDATION_ERROR',
                        message: 'Validation failed',
                        details: [
                            { field: 'email', message: 'Email is required' },
                            { field: 'name', message: 'Name is required' }
                        ]
                    })
                })
            );
        });

        it('should handle JWT errors', () => {
            const invalidTokenError = new Error('Invalid token');
            invalidTokenError.name = 'JsonWebTokenError';

            handleError(invalidTokenError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'INVALID_TOKEN',
                        message: 'Invalid token'
                    })
                })
            );

            jest.clearAllMocks();

            const expiredTokenError = new Error('Token expired');
            expiredTokenError.name = 'TokenExpiredError';

            handleError(expiredTokenError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'TOKEN_EXPIRED',
                        message: 'Token expired'
                    })
                })
            );
        });

        it('should handle Multer errors', () => {
            const fileSizeError = new Error('File too large');
            fileSizeError.code = 'LIMIT_FILE_SIZE';

            handleError(fileSizeError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(413);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'FILE_TOO_LARGE',
                        message: 'File too large'
                    })
                })
            );

            jest.clearAllMocks();

            const unexpectedFileError = new Error('Unexpected file');
            unexpectedFileError.code = 'LIMIT_UNEXPECTED_FILE';

            handleError(unexpectedFileError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'INVALID_FILE_FIELD',
                        message: 'Unexpected file field'
                    })
                })
            );
        });

        it('should handle database connection errors', () => {
            const networkError = new Error('Network error');
            networkError.name = 'MongoNetworkError';

            handleError(networkError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(503);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'DATABASE_ERROR',
                        message: 'Database connection failed'
                    })
                })
            );
        });

        it('should handle rate limiting errors', () => {
            const rateLimitError = new Error('Too many requests');
            rateLimitError.status = 429;

            handleError(rateLimitError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(429);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests, please try again later'
                    })
                })
            );
        });

        it('should handle generic errors with 500 status', () => {
            const genericError = new Error('Something went wrong');

            handleError(genericError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.objectContaining({
                        code: 'INTERNAL_SERVER_ERROR'
                    })
                })
            );
        });
    });

    describe('asyncHandler', () => {
        it('should handle successful async function', async () => {
            const asyncFn = jest.fn().mockResolvedValue('success');
            const wrappedFn = asyncHandler(asyncFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should catch and pass async errors to next', async () => {
            const error = new Error('Async error');
            const asyncFn = jest.fn().mockRejectedValue(error);
            const wrappedFn = asyncHandler(asyncFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledWith(error);
        });

        it('should handle sync functions that return promises', async () => {
            const syncFn = jest.fn().mockReturnValue(Promise.resolve('success'));
            const wrappedFn = asyncHandler(syncFn);

            await wrappedFn(mockReq, mockRes, mockNext);

            expect(syncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});