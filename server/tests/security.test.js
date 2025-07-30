const request = require('supertest');
const app = require('../server');
const { connectDB, disconnectDB } = require('./setup');
const User = require('../models/User');
const { sanitizeInput, deepSanitize } = require('../middleware/validation');

describe('Security Tests', () => {
    beforeAll(async () => {
        await connectDB();
    });

    afterAll(async () => {
        await disconnectDB();
    });

    afterEach(async () => {
        // Clean up any remaining connections or timers
        jest.clearAllTimers();
    });

    beforeEach(async () => {
        await User.deleteMany({});

        // Create test admin user
        const adminUser = new User({
            email: 'admin@test.com',
            password: 'SecurePass123!',
            role: 'admin'
        });
        await adminUser.save();
    });

    describe('Input Sanitization', () => {
        test('should sanitize malicious script tags', () => {
            const maliciousInput = '<script>alert("XSS")</script>Hello';
            const sanitized = sanitizeInput(maliciousInput);
            expect(sanitized).toBe('Hello');
            expect(sanitized).not.toContain('<script>');
        });

        test('should sanitize javascript protocol', () => {
            const maliciousInput = 'javascript:alert("XSS")';
            const sanitized = sanitizeInput(maliciousInput);
            expect(sanitized).toBe('alert("XSS")');
            expect(sanitized).not.toContain('javascript:');
        });

        test('should sanitize event handlers', () => {
            const maliciousInput = 'onload=alert("XSS")';
            const sanitized = sanitizeInput(maliciousInput);
            expect(sanitized).toBe('alert("XSS")');
            expect(sanitized).not.toContain('onload=');
        });

        test('should remove angle brackets', () => {
            const maliciousInput = '<img src=x onerror=alert(1)>';
            const sanitized = sanitizeInput(maliciousInput);
            expect(sanitized).not.toContain('<');
            expect(sanitized).not.toContain('>');
        });

        test('should deep sanitize nested objects', () => {
            const maliciousObject = {
                name: '<script>alert("XSS")</script>John',
                details: {
                    bio: 'javascript:alert("XSS")',
                    tags: ['<img src=x onerror=alert(1)>', 'normal tag']
                }
            };

            const sanitized = deepSanitize(maliciousObject);
            expect(sanitized.name).toBe('John');
            expect(sanitized.details.bio).toBe('alert("XSS")');
            expect(sanitized.details.tags[0]).not.toContain('<img');
            expect(sanitized.details.tags[1]).toBe('normal tag');
        });
    });

    describe('Authentication Rate Limiting', () => {
        test('should allow normal login attempts', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'SecurePass123!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should rate limit excessive login attempts', async () => {
            const loginData = {
                email: 'admin@test.com',
                password: 'wrongpassword'
            };

            // Make multiple failed attempts
            for (let i = 0; i < 6; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send(loginData);
            }

            // The 6th attempt should be rate limited
            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(429);
            expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
        }, 10000);
    });

    describe('Input Validation', () => {
        let authToken;

        beforeEach(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'SecurePass123!'
                });
            authToken = loginResponse.body.data.token;
        });

        test('should reject invalid email formats', async () => {
            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Agent',
                    email: 'invalid-email',
                    mobile: {
                        countryCode: '+1',
                        number: '1234567890'
                    },
                    password: 'SecurePass123!'
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should reject weak passwords', async () => {
            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Agent',
                    email: 'test@example.com',
                    mobile: {
                        countryCode: '+1',
                        number: '1234567890'
                    },
                    password: '123' // Too short
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should reject invalid phone numbers', async () => {
            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Test Agent',
                    email: 'test@example.com',
                    mobile: {
                        countryCode: '+1',
                        number: '123' // Too short
                    },
                    password: 'SecurePass123!'
                });

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        test('should sanitize and validate agent name', async () => {
            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: '<script>alert("XSS")</script>John Doe',
                    email: 'john@example.com',
                    mobile: {
                        countryCode: '+1',
                        number: '1234567890'
                    },
                    password: 'SecurePass123!'
                });

            expect(response.status).toBe(201);
            expect(response.body.data.name).toBe('John Doe');
            expect(response.body.data.name).not.toContain('<script>');
        });
    });

    describe('File Upload Security', () => {
        let authToken;

        beforeEach(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'SecurePass123!'
                });
            authToken = loginResponse.body.data.token;
        });

        test('should reject non-CSV/Excel files', async () => {
            const response = await request(app)
                .post('/api/upload/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from('malicious content'), 'malicious.exe');

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
        });

        test('should reject files that are too large', async () => {
            // Create a buffer larger than 5MB
            const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'a');

            const response = await request(app)
                .post('/api/upload/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', largeBuffer, 'large.csv');

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('FILE_TOO_LARGE');
        });

        test('should accept valid CSV files', async () => {
            const csvContent = 'name,email,mobile\nJohn Doe,john@example.com,+1234567890';

            const response = await request(app)
                .post('/api/upload/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'valid.csv');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should sanitize filenames', async () => {
            const csvContent = 'name,email,mobile\nJohn Doe,john@example.com,+1234567890';

            const response = await request(app)
                .post('/api/upload/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), '../../../malicious.csv');

            expect(response.status).toBe(200);
            // The filename should be sanitized to remove path traversal
            expect(response.body.data.filename).not.toContain('../');
        });
    });

    describe('CORS Security', () => {
        test('should include proper CORS headers', async () => {
            const response = await request(app)
                .options('/api/auth/login')
                .set('Origin', 'http://localhost:3000');

            expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
            expect(response.headers['access-control-allow-credentials']).toBe('true');
            expect(response.headers['access-control-allow-methods']).toContain('POST');
        });

        test('should reject requests from unauthorized origins', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .set('Origin', 'http://malicious-site.com')
                .send({
                    email: 'admin@test.com',
                    password: 'SecurePass123!'
                });

            // The request should be blocked by CORS
            expect(response.status).toBe(500); // CORS error
        });
    });

    describe('Security Headers', () => {
        test('should include security headers', async () => {
            const response = await request(app)
                .get('/api/health');

            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-xss-protection']).toBe('0');
            expect(response.headers['strict-transport-security']).toBeDefined();
        });
    });

    describe('SQL Injection Prevention', () => {
        let authToken;

        beforeEach(async () => {
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                    password: 'SecurePass123!'
                });
            authToken = loginResponse.body.data.token;
        });

        test('should prevent NoSQL injection in search queries', async () => {
            const maliciousQuery = { $ne: null };

            const response = await request(app)
                .get('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ search: JSON.stringify(maliciousQuery) });

            // Should treat the malicious query as a regular string search
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test('should validate ObjectId parameters', async () => {
            const response = await request(app)
                .get('/api/agents/invalid-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });
});