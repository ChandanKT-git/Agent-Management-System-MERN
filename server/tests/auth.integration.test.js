const express = require('express');
const request = require('supertest');
const authRoutes = require('../routes/auth');
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

describe('Auth Integration Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);

        // Error handling middleware
        app.use((err, req, res, next) => {
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Something went wrong'
                }
            });
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            // Create a test user
            const testUser = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            });
            await testUser.save();

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.user.password).toBeUndefined();
        });

        it('should return 400 for validation errors', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: ''
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should return user profile with valid token', async () => {
            // Create a test user
            const testUser = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            });
            await testUser.save();

            // Generate token
            const token = generateToken({
                userId: testUser._id,
                email: testUser.email,
                role: testUser.role
            });

            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
        });

        it('should return 401 without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('GET /api/auth/verify', () => {
        it('should verify valid token', async () => {
            // Create a test user
            const testUser = new User({
                email: 'test@example.com',
                password: 'password123',
                role: 'admin'
            });
            await testUser.save();

            // Generate token
            const token = generateToken({
                userId: testUser._id,
                email: testUser.email,
                role: testUser.role
            });

            const response = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.valid).toBe(true);
        });
    });
});