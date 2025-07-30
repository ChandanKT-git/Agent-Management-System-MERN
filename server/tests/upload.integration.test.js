const request = require('supertest');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const User = require('../models/User');
const Agent = require('../models/Agent');
const Distribution = require('../models/Distribution');
const Task = require('../models/Task');
const { generateToken } = require('../utils/auth');

// Import the app
const app = require('../server');

describe('Upload Integration Tests', () => {
    let authToken;
    let testUser;
    let testAgents = [];

    beforeAll(async () => {
        // Create test user
        testUser = await User.create({
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin'
        });

        // Generate auth token
        authToken = generateToken({
            userId: testUser._id,
            email: testUser.email,
            role: testUser.role
        });

        // Create test agents
        testAgents = await Agent.create([
            {
                name: 'Agent 1',
                email: 'agent1@test.com',
                mobile: { countryCode: '+1', number: '1234567890' },
                password: 'password123',
                isActive: true
            },
            {
                name: 'Agent 2',
                email: 'agent2@test.com',
                mobile: { countryCode: '+1', number: '1234567891' },
                password: 'password123',
                isActive: true
            },
            {
                name: 'Agent 3',
                email: 'agent3@test.com',
                mobile: { countryCode: '+1', number: '1234567892' },
                password: 'password123',
                isActive: true
            }
        ]);
    });

    afterEach(async () => {
        // Clean up distributions and tasks after each test
        await Distribution.deleteMany({});
        await Task.deleteMany({});
    });

    describe('POST /api/upload', () => {
        it('should upload and process CSV file successfully', async () => {
            const csvContent = 'FirstName,Phone,Notes\nJohn Doe,+1234567890,Important client\nJane Smith,+1987654321,Follow up needed';

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '3')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.distribution).toBeDefined();
            expect(response.body.data.distribution.totalItems).toBe(2);
            expect(response.body.data.distribution.status).toBe('completed');
            expect(response.body.data.tasksCreated).toBe(2);

            // Verify distribution was created
            const distribution = await Distribution.findById(response.body.data.distribution.id);
            expect(distribution).toBeTruthy();
            expect(distribution.filename).toBe('test.csv');
            expect(distribution.totalItems).toBe(2);

            // Verify tasks were created
            const tasks = await Task.find({ distributionId: distribution._id });
            expect(tasks).toHaveLength(2);
        });

        it('should upload and process Excel file successfully', async () => {
            // Create Excel file
            const ws = XLSX.utils.aoa_to_sheet([
                ['FirstName', 'Phone', 'Notes'],
                ['John Doe', '+1234567890', 'Important client'],
                ['Jane Smith', '+1987654321', 'Follow up needed'],
                ['Bob Johnson', '+1555123456', 'New lead']
            ]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', excelBuffer, 'test.xlsx')
                .field('targetAgents', '3')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.distribution.totalItems).toBe(3);
            expect(response.body.data.tasksCreated).toBe(3);
        });

        it('should return 400 for missing file', async () => {
            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .field('targetAgents', '3')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('NO_FILE_UPLOADED');
        });

        it('should return 400 for unsupported file type', async () => {
            const textContent = 'This is a text file';

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(textContent), 'test.txt')
                .field('targetAgents', '3')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNSUPPORTED_FORMAT');
        });

        it('should return 400 for CSV with missing columns', async () => {
            const csvContent = 'Name,Email\nJohn Doe,john@example.com';

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '3')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_COLUMNS');
        });

        it('should return 400 for invalid target agents', async () => {
            const csvContent = 'FirstName,Phone,Notes\nJohn Doe,+1234567890,Important client';

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '0')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should return 401 for unauthenticated request', async () => {
            const csvContent = 'FirstName,Phone,Notes\nJohn Doe,+1234567890,Important client';

            await request(app)
                .post('/api/upload')
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '3')
                .expect(401);
        });

        it('should handle file size limit', async () => {
            // Create a large CSV content (over 5MB)
            const largeContent = 'FirstName,Phone,Notes\n' + 'John Doe,+1234567890,Important client\n'.repeat(100000);

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(largeContent), 'large.csv')
                .field('targetAgents', '3')
                .expect(413);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('FILE_TOO_LARGE');
        });

        it('should distribute items evenly among agents', async () => {
            const csvContent = 'FirstName,Phone,Notes\n' +
                Array.from({ length: 9 }, (_, i) => `Person ${i + 1},+123456789${i},Note ${i + 1}`).join('\n');

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '3')
                .expect(200);

            expect(response.body.data.distribution.totalItems).toBe(9);
            expect(response.body.data.tasksCreated).toBe(9);

            // Verify distribution among agents
            const tasks = await Task.find({ distributionId: response.body.data.distribution.id });
            const agentTaskCounts = {};
            tasks.forEach(task => {
                const agentId = task.agentId.toString();
                agentTaskCounts[agentId] = (agentTaskCounts[agentId] || 0) + 1;
            });

            // Each agent should get 3 tasks (9 items / 3 agents)
            Object.values(agentTaskCounts).forEach(count => {
                expect(count).toBe(3);
            });
        });

        it('should handle remainder distribution correctly', async () => {
            const csvContent = 'FirstName,Phone,Notes\n' +
                Array.from({ length: 10 }, (_, i) => `Person ${i + 1},+123456789${i},Note ${i + 1}`).join('\n');

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '3')
                .expect(200);

            expect(response.body.data.distribution.totalItems).toBe(10);
            expect(response.body.data.tasksCreated).toBe(10);

            // Verify distribution: 10 items / 3 agents = 3 each + 1 remainder
            const tasks = await Task.find({ distributionId: response.body.data.distribution.id });
            const agentTaskCounts = {};
            tasks.forEach(task => {
                const agentId = task.agentId.toString();
                agentTaskCounts[agentId] = (agentTaskCounts[agentId] || 0) + 1;
            });

            const counts = Object.values(agentTaskCounts).sort();
            expect(counts).toEqual([3, 3, 4]); // One agent gets 4, two get 3
        });
    });

    describe('POST /api/upload/preview', () => {
        it('should preview distribution without creating tasks', async () => {
            const csvContent = 'FirstName,Phone,Notes\nJohn Doe,+1234567890,Important client\nJane Smith,+1987654321,Follow up needed';

            const response = await request(app)
                .post('/api/upload/preview')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '3')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.preview).toBeDefined();
            expect(response.body.data.preview.totalItems).toBe(2);
            expect(response.body.data.preview.totalAgents).toBe(3);
            expect(response.body.data.preview.itemsPerAgent).toBe(0);
            expect(response.body.data.preview.remainderItems).toBe(2);

            // Verify no distribution or tasks were created
            const distributions = await Distribution.find({});
            const tasks = await Task.find({});
            expect(distributions).toHaveLength(0);
            expect(tasks).toHaveLength(0);
        });

        it('should return 401 for unauthenticated preview request', async () => {
            const csvContent = 'FirstName,Phone,Notes\nJohn Doe,+1234567890,Important client';

            await request(app)
                .post('/api/upload/preview')
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '3')
                .expect(401);
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // Mock a database error by closing the connection temporarily
            await mongoose.connection.close();

            const csvContent = 'FirstName,Phone,Notes\nJohn Doe,+1234567890,Important client';

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(csvContent), 'test.csv')
                .field('targetAgents', '3')
                .expect(503);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('DATABASE_ERROR');

            // Reconnect for cleanup
            await mongoose.connect(process.env.MONGODB_TEST_URI);
        });

        it('should handle malformed CSV gracefully', async () => {
            const malformedCsv = 'FirstName,Phone,Notes\nJohn Doe,"Unclosed quote,+1234567890,Note';

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(malformedCsv), 'test.csv')
                .field('targetAgents', '3');

            // Should either succeed (if CSV parser handles it) or return appropriate error
            expect([200, 400].includes(response.status)).toBe(true);
        });

        it('should handle empty file', async () => {
            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('file', Buffer.from(''), 'empty.csv')
                .field('targetAgents', '3')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('EMPTY_FILE');
        });
    });
});