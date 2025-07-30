const request = require('supertest');
const Agent = require('../models/Agent');
const User = require('../models/User');
const { generateToken } = require('../utils/auth');

// Import app without starting server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// Create app instance for testing
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/agents', require('../routes/agents'));

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong!'
        }
    });
});

describe('Agent API Integration Tests', () => {
    let authToken;
    let adminUser;

    beforeAll(async () => {
        // Set JWT_SECRET for testing
        process.env.JWT_SECRET = 'test-jwt-secret-key';

        // Create admin user for authentication
        adminUser = new User({
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin'
        });
        await adminUser.save();

        // Generate auth token
        authToken = generateToken({
            userId: adminUser._id,
            role: adminUser.role
        });
    });

    beforeEach(async () => {
        // Clean up agents before each test
        await Agent.deleteMany({});
    });

    describe('POST /api/agents', () => {
        const validAgentData = {
            name: 'John Doe',
            email: 'john@example.com',
            mobile: {
                countryCode: '+1',
                number: '1234567890'
            },
            password: 'password123'
        };

        it('should create a new agent with valid data', async () => {
            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validAgentData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                name: validAgentData.name,
                email: validAgentData.email,
                mobile: validAgentData.mobile,
                isActive: true
            });
            expect(response.body.data.id).toBeDefined();
            expect(response.body.message).toBe('Agent created successfully');

            // Verify agent was saved to database
            const savedAgent = await Agent.findById(response.body.data.id);
            expect(savedAgent).toBeTruthy();
            expect(savedAgent.name).toBe(validAgentData.name);
        });

        it('should return 401 without authentication token', async () => {
            const response = await request(app)
                .post('/api/agents')
                .send(validAgentData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
        });

        it('should return validation error for missing required fields', async () => {
            const invalidData = { name: 'John' };

            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.details).toBeDefined();
        });

        it('should return error for duplicate email', async () => {
            // Create first agent
            await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validAgentData)
                .expect(201);

            // Try to create second agent with same email
            const duplicateData = {
                ...validAgentData,
                name: 'Jane Doe',
                mobile: { countryCode: '+1', number: '9876543210' }
            };

            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('DUPLICATE_ERROR');
            expect(response.body.error.message).toContain('email already exists');
        });

        it('should return error for duplicate mobile number', async () => {
            // Create first agent
            await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(validAgentData)
                .expect(201);

            // Try to create second agent with same mobile
            const duplicateData = {
                ...validAgentData,
                name: 'Jane Doe',
                email: 'jane@example.com'
            };

            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(duplicateData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('DUPLICATE_ERROR');
            expect(response.body.error.message).toContain('mobile number already exists');
        });

        it('should validate email format', async () => {
            const invalidEmailData = {
                ...validAgentData,
                email: 'invalid-email'
            };

            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidEmailData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should validate mobile number format', async () => {
            const invalidMobileData = {
                ...validAgentData,
                mobile: {
                    countryCode: 'invalid',
                    number: '123'
                }
            };

            const response = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidMobileData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });
    });

    describe('GET /api/agents', () => {
        beforeEach(async () => {
            // Create test agents
            const agents = [
                {
                    name: 'Agent 1',
                    email: 'agent1@example.com',
                    mobile: { countryCode: '+1', number: '1111111111' },
                    password: 'password123'
                },
                {
                    name: 'Agent 2',
                    email: 'agent2@example.com',
                    mobile: { countryCode: '+1', number: '2222222222' },
                    password: 'password123'
                },
                {
                    name: 'Agent 3',
                    email: 'agent3@example.com',
                    mobile: { countryCode: '+1', number: '3333333333' },
                    password: 'password123',
                    isActive: false
                }
            ];

            for (const agentData of agents) {
                const agent = new Agent(agentData);
                await agent.save();
            }
        });

        it('should get all agents with default pagination', async () => {
            const response = await request(app)
                .get('/api/agents')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(3);
            expect(response.body.pagination).toMatchObject({
                currentPage: 1,
                totalPages: 1,
                totalAgents: 3,
                hasNextPage: false,
                hasPrevPage: false
            });

            // Verify password is not included
            response.body.data.forEach(agent => {
                expect(agent.password).toBeUndefined();
            });
        });

        it('should filter agents by active status', async () => {
            const response = await request(app)
                .get('/api/agents?isActive=true')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination.totalAgents).toBe(2);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/agents?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination).toMatchObject({
                currentPage: 1,
                totalPages: 2,
                totalAgents: 3,
                hasNextPage: true,
                hasPrevPage: false
            });
        });

        it('should support sorting', async () => {
            const response = await request(app)
                .get('/api/agents?sortBy=name&sortOrder=desc')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data[0].name).toBe('Agent 3');
            expect(response.body.data[1].name).toBe('Agent 2');
            expect(response.body.data[2].name).toBe('Agent 1');
        });

        it('should return 401 without authentication token', async () => {
            const response = await request(app)
                .get('/api/agents')
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNAUTHORIZED');
        });
    });

    describe('GET /api/agents/:id', () => {
        let testAgent;

        beforeEach(async () => {
            testAgent = new Agent({
                name: 'Test Agent',
                email: 'test@example.com',
                mobile: { countryCode: '+1', number: '1234567890' },
                password: 'password123'
            });
            await testAgent.save();
        });

        it('should get agent by valid ID', async () => {
            const response = await request(app)
                .get(`/api/agents/${testAgent._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                name: testAgent.name,
                email: testAgent.email,
                mobile: testAgent.mobile
            });
            expect(response.body.data.password).toBeUndefined();
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .get('/api/agents/invalid-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.message).toBe('Invalid agent ID format');
        });

        it('should return 404 for non-existent agent', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .get(`/api/agents/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('PUT /api/agents/:id', () => {
        let testAgent;

        beforeEach(async () => {
            testAgent = new Agent({
                name: 'Test Agent',
                email: 'test@example.com',
                mobile: { countryCode: '+1', number: '1234567890' },
                password: 'password123'
            });
            await testAgent.save();
        });

        it('should update agent successfully', async () => {
            const updateData = {
                name: 'Updated Agent',
                email: 'updated@example.com'
            };

            const response = await request(app)
                .put(`/api/agents/${testAgent._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject(updateData);
            expect(response.body.message).toBe('Agent updated successfully');

            // Verify update in database
            const updatedAgent = await Agent.findById(testAgent._id);
            expect(updatedAgent.name).toBe(updateData.name);
            expect(updatedAgent.email).toBe(updateData.email);
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .put('/api/agents/invalid-id')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Updated Name' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return 404 for non-existent agent', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .put(`/api/agents/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ name: 'Updated Name' })
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_FOUND');
        });

        it('should return error for duplicate email', async () => {
            // Create another agent
            const otherAgent = new Agent({
                name: 'Other Agent',
                email: 'other@example.com',
                mobile: { countryCode: '+1', number: '9876543210' },
                password: 'password123'
            });
            await otherAgent.save();

            // Try to update first agent with second agent's email
            const response = await request(app)
                .put(`/api/agents/${testAgent._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ email: 'other@example.com' })
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('DUPLICATE_ERROR');
        });
    });

    describe('DELETE /api/agents/:id', () => {
        let testAgent;

        beforeEach(async () => {
            testAgent = new Agent({
                name: 'Test Agent',
                email: 'test@example.com',
                mobile: { countryCode: '+1', number: '1234567890' },
                password: 'password123'
            });
            await testAgent.save();
        });

        it('should delete agent successfully (soft delete)', async () => {
            const response = await request(app)
                .delete(`/api/agents/${testAgent._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Agent deleted successfully');

            // Verify soft delete - agent should still exist but be inactive
            const deletedAgent = await Agent.findById(testAgent._id);
            expect(deletedAgent).toBeTruthy();
            expect(deletedAgent.isActive).toBe(false);
        });

        it('should return 400 for invalid ID format', async () => {
            const response = await request(app)
                .delete('/api/agents/invalid-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return 404 for non-existent agent', async () => {
            const nonExistentId = '507f1f77bcf86cd799439011';

            const response = await request(app)
                .delete(`/api/agents/${nonExistentId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NOT_FOUND');
        });
    });
});