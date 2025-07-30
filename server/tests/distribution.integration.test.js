const request = require('supertest');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Distribution = require('../models/Distribution');
const Task = require('../models/Task');
const { setupTestAuth } = require('./helpers/auth');
require('./setup'); // This will handle DB setup

// Create test app without starting server
const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/agents', require('../routes/agents'));
app.use('/api/upload', require('../routes/upload'));
app.use('/api/distributions', require('../routes/distributions'));

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);

    let error = {
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong on the server'
        }
    };

    if (err.name === 'ValidationError') {
        error.error.code = 'VALIDATION_ERROR';
        error.error.message = 'Validation failed';
        error.error.details = err.details;
        return res.status(400).json(error);
    }

    if (err.name === 'UnauthorizedError') {
        error.error.code = 'UNAUTHORIZED';
        error.error.message = 'Access denied';
        return res.status(401).json(error);
    }

    if (err.code === 11000) {
        error.error.code = 'DUPLICATE_ERROR';
        error.error.message = 'Resource already exists';
        return res.status(409).json(error);
    }

    res.status(500).json(error);
});

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found'
        }
    });
});

describe('Distribution Integration Tests', () => {
    let authToken;
    let testUser;
    let testAgents = [];

    beforeEach(async () => {
        // Clean up database
        await User.deleteMany({});
        await Agent.deleteMany({});
        await Distribution.deleteMany({});
        await Task.deleteMany({});

        // Setup test authentication and agents
        const authSetup = await setupTestAuth();
        testUser = authSetup.user;
        authToken = authSetup.token;
        testAgents = authSetup.agents;
    });

    describe('POST /api/upload - File Upload and Distribution', () => {
        test('should successfully upload CSV file and create distribution', async () => {
            // Create test CSV content
            const csvContent = `FirstName,Phone,Notes
John,+1234567890,Test note 1
Jane,+1234567891,Test note 2
Bob,+1234567892,Test note 3
Alice,+1234567893,Test note 4
Charlie,+1234567894,Test note 5
David,+1234567895,Test note 6
Eve,+1234567896,Test note 7
Frank,+1234567897,Test note 8
Grace,+1234567898,Test note 9
Henry,+1234567899,Test note 10`;

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('distributionId');
            expect(response.body.data.totalItems).toBe(10);
            expect(response.body.data.summary.totalAgents).toBe(5);
            expect(response.body.data.summary.itemsPerAgent).toBe(2);
            expect(response.body.data.summary.remainderItems).toBe(0);
            expect(response.body.data.summary.tasksCreated).toBe(10);

            // Verify distribution was created in database
            const distribution = await Distribution.findById(response.body.data.distributionId);
            expect(distribution).toBeTruthy();
            expect(distribution.status).toBe('completed');
            expect(distribution.totalItems).toBe(10);

            // Verify tasks were created
            const tasks = await Task.find({ distributionId: distribution._id });
            expect(tasks).toHaveLength(10);

            // Verify each agent got exactly 2 tasks
            for (const agent of testAgents) {
                const agentTasks = tasks.filter(task => task.agentId.toString() === agent._id.toString());
                expect(agentTasks).toHaveLength(2);
            }
        });

        test('should handle uneven distribution correctly', async () => {
            // Create test CSV with 12 items (not evenly divisible by 5)
            const csvContent = `FirstName,Phone,Notes
John,+1234567890,Test note 1
Jane,+1234567891,Test note 2
Bob,+1234567892,Test note 3
Alice,+1234567893,Test note 4
Charlie,+1234567894,Test note 5
David,+1234567895,Test note 6
Eve,+1234567896,Test note 7
Frank,+1234567897,Test note 8
Grace,+1234567898,Test note 9
Henry,+1234567899,Test note 10
Ivy,+1234567800,Test note 11
Jack,+1234567801,Test note 12`;

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.totalItems).toBe(12);
            expect(response.body.data.summary.totalAgents).toBe(5);
            expect(response.body.data.summary.itemsPerAgent).toBe(2);
            expect(response.body.data.summary.remainderItems).toBe(2);

            // Verify tasks distribution
            const tasks = await Task.find({ distributionId: response.body.data.distributionId });
            expect(tasks).toHaveLength(12);

            // First 2 agents should get 3 tasks each, remaining 3 agents get 2 tasks each
            const taskCounts = {};
            tasks.forEach(task => {
                const agentId = task.agentId.toString();
                taskCounts[agentId] = (taskCounts[agentId] || 0) + 1;
            });

            const counts = Object.values(taskCounts).sort((a, b) => b - a);
            expect(counts).toEqual([3, 3, 2, 2, 2]);
        });

        test('should reject file without required columns', async () => {
            const csvContent = `Name,PhoneNumber,Comment
John,+1234567890,Test note 1`;

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_COLUMNS');
        });

        test('should require authentication', async () => {
            const csvContent = `FirstName,Phone,Notes
John,+1234567890,Test note 1`;

            await request(app)
                .post('/api/upload')
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .expect(401);
        });
    });

    describe('GET /api/distributions - List Distributions', () => {
        let testDistribution;

        beforeEach(async () => {
            // Create a test distribution
            testDistribution = new Distribution({
                filename: 'test.csv',
                originalName: 'test.csv',
                totalItems: 5,
                uploadedBy: testUser._id,
                status: 'completed',
                distributionSummary: {
                    totalAgents: 5,
                    itemsPerAgent: 1,
                    remainderItems: 0
                }
            });
            await testDistribution.save();
        });

        test('should return user distributions', async () => {
            const response = await request(app)
                .get('/api/distributions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe(testDistribution._id.toString());
            expect(response.body.data[0].filename).toBe('test.csv');
            expect(response.body.data[0].totalItems).toBe(5);
            expect(response.body.data[0].status).toBe('completed');
        });

        test('should require authentication', async () => {
            await request(app)
                .get('/api/distributions')
                .expect(401);
        });
    });

    describe('GET /api/distributions/:id - Distribution Details', () => {
        let testDistribution;
        let testTasks;

        beforeEach(async () => {
            // Create a test distribution
            testDistribution = new Distribution({
                filename: 'test.csv',
                originalName: 'test.csv',
                totalItems: 2,
                uploadedBy: testUser._id,
                status: 'completed',
                distributionSummary: {
                    totalAgents: 2,
                    itemsPerAgent: 1,
                    remainderItems: 0
                }
            });
            await testDistribution.save();

            // Create test tasks
            testTasks = [
                new Task({
                    distributionId: testDistribution._id,
                    agentId: testAgents[0]._id,
                    firstName: 'John',
                    phone: '+1234567890',
                    notes: 'Test note 1'
                }),
                new Task({
                    distributionId: testDistribution._id,
                    agentId: testAgents[1]._id,
                    firstName: 'Jane',
                    phone: '+1234567891',
                    notes: 'Test note 2'
                })
            ];

            for (const task of testTasks) {
                await task.save();
            }
        });

        test('should return distribution details with agent tasks', async () => {
            const response = await request(app)
                .get(`/api/distributions/${testDistribution._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.distribution.id).toBe(testDistribution._id.toString());
            expect(response.body.data.agents).toHaveLength(2);

            // Check first agent's tasks
            const agent1Data = response.body.data.agents.find(a => a.agent.id === testAgents[0]._id.toString());
            expect(agent1Data).toBeTruthy();
            expect(agent1Data.tasks).toHaveLength(1);
            expect(agent1Data.tasks[0].firstName).toBe('John');
            expect(agent1Data.tasks[0].phone).toBe('+1234567890');
        });

        test('should return 404 for non-existent distribution', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            await request(app)
                .get(`/api/distributions/${fakeId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        test('should validate distribution ID format', async () => {
            await request(app)
                .get('/api/distributions/invalid-id')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });

        test('should require authentication', async () => {
            await request(app)
                .get(`/api/distributions/${testDistribution._id}`)
                .expect(401);
        });
    });

    describe('GET /api/agents/:id/tasks - Agent Tasks', () => {
        let testTasks;

        beforeEach(async () => {
            // Create test distribution
            const testDistribution = new Distribution({
                filename: 'test.csv',
                originalName: 'test.csv',
                totalItems: 3,
                uploadedBy: testUser._id,
                status: 'completed',
                distributionSummary: {
                    totalAgents: 2,
                    itemsPerAgent: 1,
                    remainderItems: 1
                }
            });
            await testDistribution.save();

            // Create test tasks for first agent
            testTasks = [
                new Task({
                    distributionId: testDistribution._id,
                    agentId: testAgents[0]._id,
                    firstName: 'John',
                    phone: '+1234567890',
                    notes: 'Test note 1',
                    status: 'assigned'
                }),
                new Task({
                    distributionId: testDistribution._id,
                    agentId: testAgents[0]._id,
                    firstName: 'Jane',
                    phone: '+1234567891',
                    notes: 'Test note 2',
                    status: 'completed'
                }),
                new Task({
                    distributionId: testDistribution._id,
                    agentId: testAgents[1]._id,
                    firstName: 'Bob',
                    phone: '+1234567892',
                    notes: 'Test note 3',
                    status: 'assigned'
                })
            ];

            for (const task of testTasks) {
                await task.save();
            }
        });

        test('should return all tasks for an agent', async () => {
            const response = await request(app)
                .get(`/api/agents/${testAgents[0]._id}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.agent.id).toBe(testAgents[0]._id.toString());
            expect(response.body.data.tasks).toHaveLength(2);
            expect(response.body.data.summary.totalTasks).toBe(2);
            expect(response.body.data.summary.completedTasks).toBe(1);
            expect(response.body.data.summary.pendingTasks).toBe(1);
        });

        test('should filter tasks by status', async () => {
            const response = await request(app)
                .get(`/api/agents/${testAgents[0]._id}/tasks?status=completed`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.tasks).toHaveLength(1);
            expect(response.body.data.tasks[0].status).toBe('completed');
            expect(response.body.data.tasks[0].firstName).toBe('Jane');
        });

        test('should return 404 for non-existent agent', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            await request(app)
                .get(`/api/agents/${fakeId}/tasks`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });

        test('should validate agent ID format', async () => {
            await request(app)
                .get('/api/agents/invalid-id/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });

        test('should validate status query parameter', async () => {
            await request(app)
                .get(`/api/agents/${testAgents[0]._id}/tasks?status=invalid`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });

        test('should require authentication', async () => {
            await request(app)
                .get(`/api/agents/${testAgents[0]._id}/tasks`)
                .expect(401);
        });
    });

    describe('Complete Upload-to-Distribution Flow', () => {
        test('should complete full workflow from upload to task viewing', async () => {
            // Step 1: Upload file and create distribution
            const csvContent = `FirstName,Phone,Notes
John,+1234567890,Test note 1
Jane,+1234567891,Test note 2
Bob,+1234567892,Test note 3
Alice,+1234567893,Test note 4
Charlie,+1234567894,Test note 5`;

            const uploadResponse = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .expect(200);

            const distributionId = uploadResponse.body.data.distributionId;

            // Step 2: Verify distribution appears in list
            const listResponse = await request(app)
                .get('/api/distributions')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(listResponse.body.data).toHaveLength(1);
            expect(listResponse.body.data[0].id).toBe(distributionId);

            // Step 3: Get distribution details
            const detailsResponse = await request(app)
                .get(`/api/distributions/${distributionId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(detailsResponse.body.data.agents).toHaveLength(5);

            // Step 4: Verify each agent has tasks
            for (const agentData of detailsResponse.body.data.agents) {
                const tasksResponse = await request(app)
                    .get(`/api/agents/${agentData.agent.id}/tasks`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200);

                expect(tasksResponse.body.data.tasks.length).toBeGreaterThan(0);
                expect(tasksResponse.body.data.agent.id).toBe(agentData.agent.id);
            }
        });
    });
});