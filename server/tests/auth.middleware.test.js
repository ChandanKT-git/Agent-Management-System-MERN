const { authenticateToken, authorizeRoles, optionalAuth } = require('../middleware/auth');
const { generateToken } = require('../utils/auth');
const User = require('../models/User');

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
    process.env = {
        ...originalEnv,
        JWT_SECRET: 'test-secret-key',
        JWT_EXPIRES_IN: '1h'
    };
});

afterEach(() => {
    process.env = originalEnv;
});

describe('Auth Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            headers: {},
            user: null
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockNext = jest.fn();
    });

    describe('authenticateToken', () => {
        it('should authenticate valid token and attach user to request', async () => {
            // Create a test user
            const testUser = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            });
            await testUser.save();

            // Generate token for the user
            const token = generateToken({
                userId: testUser._id,
                email: testUser.email,
                role: testUser.role
            });

            // Set authorization header
            mockReq.headers.authorization = `Bearer ${token}`;

            await authenticateToken(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
            expect(mockReq.user.email).toBe(testUser.email);
            expect(mockReq.user.role).toBe(testUser.role);
            expect(mockReq.user.password).toBeUndefined(); // Password should be excluded
        });

        it('should return 401 for missing authorization header', async () => {
            await authenticateToken(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Access token is required'
                }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 for invalid token format', async () => {
            mockReq.headers.authorization = 'InvalidToken';

            await authenticateToken(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Access token is required'
                }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 for invalid token', async () => {
            mockReq.headers.authorization = 'Bearer invalid.token.here';

            await authenticateToken(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid token'
                }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 for user not found', async () => {
            // Generate token for non-existent user
            const token = generateToken({
                userId: '507f1f77bcf86cd799439011', // Valid ObjectId but user doesn't exist
                email: 'nonexistent@example.com',
                role: 'admin'
            });

            mockReq.headers.authorization = `Bearer ${token}`;

            await authenticateToken(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not found'
                }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('authorizeRoles', () => {
        beforeEach(() => {
            mockReq.user = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                role: 'admin'
            };
        });

        it('should allow access when user has required role', () => {
            const middleware = authorizeRoles(['admin', 'user']);

            middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should allow access when no roles specified', () => {
            const middleware = authorizeRoles([]);

            middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should deny access when user lacks required role', () => {
            mockReq.user.role = 'user';
            const middleware = authorizeRoles(['admin']);

            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Insufficient permissions'
                }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 401 when user is not authenticated', () => {
            mockReq.user = null;
            const middleware = authorizeRoles(['admin']);

            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Authentication required'
                }
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('optionalAuth', () => {
        it('should attach user when valid token is provided', async () => {
            // Create a test user
            const testUser = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            });
            await testUser.save();

            // Generate token for the user
            const token = generateToken({
                userId: testUser._id,
                email: testUser.email,
                role: testUser.role
            });

            mockReq.headers.authorization = `Bearer ${token}`;

            await optionalAuth(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
            expect(mockReq.user.email).toBe(testUser.email);
        });

        it('should continue without user when no token is provided', async () => {
            await optionalAuth(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeFalsy();
        });

        it('should continue without user when invalid token is provided', async () => {
            mockReq.headers.authorization = 'Bearer invalid.token.here';

            await optionalAuth(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeFalsy();
        });

        it('should continue without user when user not found', async () => {
            const token = generateToken({
                userId: '507f1f77bcf86cd799439011', // Valid ObjectId but user doesn't exist
                email: 'nonexistent@example.com',
                role: 'admin'
            });

            mockReq.headers.authorization = `Bearer ${token}`;

            await optionalAuth(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeFalsy();
        });
    });
});