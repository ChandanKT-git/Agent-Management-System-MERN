const { login, getProfile, verifyToken } = require('../controllers/authController');
const User = require('../models/User');
const { generateToken } = require('../utils/auth');

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

describe('Auth Controller Unit Tests', () => {
    let mockReq, mockRes;

    beforeEach(() => {
        mockReq = {
            body: {},
            user: null
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('login', () => {
        it('should login with valid credentials', async () => {
            // Create a test user
            const testUser = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            });
            await testUser.save();

            mockReq.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            await login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    data: expect.objectContaining({
                        token: expect.any(String),
                        user: expect.objectContaining({
                            email: 'test@example.com',
                            role: 'admin'
                        })
                    }),
                    message: 'Login successful'
                })
            );
        });

        it('should return 400 for missing email', async () => {
            mockReq.body = {
                password: 'password123'
            };

            await login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'VALIDATION_ERROR',
                        details: expect.objectContaining({
                            email: 'Email is required'
                        })
                    })
                })
            );
        });

        it('should return 400 for invalid email format', async () => {
            mockReq.body = {
                email: 'invalid-email',
                password: 'password123'
            };

            await login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    error: expect.objectContaining({
                        code: 'VALIDATION_ERROR',
                        details: expect.objectContaining({
                            email: 'Please provide a valid email address'
                        })
                    })
                })
            );
        });

        it('should return 401 for non-existent user', async () => {
            mockReq.body = {
                email: 'nonexistent@example.com',
                password: 'password123'
            };

            await login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        });

        it('should return 401 for wrong password', async () => {
            // Create a test user
            const testUser = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            });
            await testUser.save();

            mockReq.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            await login(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password'
                }
            });
        });
    });

    describe('getProfile', () => {
        it('should return user profile', async () => {
            const testUser = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockReq.user = testUser;

            await getProfile(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    user: {
                        id: testUser._id,
                        email: testUser.email,
                        role: testUser.role,
                        createdAt: testUser.createdAt,
                        updatedAt: testUser.updatedAt
                    }
                }
            });
        });
    });

    describe('verifyToken', () => {
        it('should verify valid token', async () => {
            const testUser = {
                _id: '507f1f77bcf86cd799439011',
                email: 'test@example.com',
                role: 'admin'
            };

            mockReq.user = testUser;

            await verifyToken(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: {
                    valid: true,
                    user: {
                        id: testUser._id,
                        email: testUser.email,
                        role: testUser.role
                    }
                },
                message: 'Token is valid'
            });
        });
    });
});