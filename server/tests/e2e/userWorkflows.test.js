const request = require('supertest');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const User = require('../../models/User');
const Agent = require('../../models/Agent');
const Distribution = require('../../models/Distribution');
const Task = require('../../models/Task');
const { generateToken } = require('../../utils/auth');
const { seedAll, cleanAll, createMultipleAgents } = require('../helpers/testSeeder');
const { sampleCSVData } = require('../fixtures/testData');

// Import the app
const app = require('../../server');

describe('End-to-End User Workflows', () => {
    let adminToken;
    let adminUser;
    let testAgents = [];

    beforeAll(async () => {
        // Clean and seed database
        await cleanAll();
        await seedAll();

        // Create admin user and token
        adminUser = await User.create({
            email: 'admin@workflow.test',
            password: 'password123',
            role: 'admin'
        });

        adminToken = generateToken({
            userId: adminUser._id,
            email: adminUser.email,
            role: adminUser.role
        });

        // Create test agents for workflows
        testAgents = await createMultipleAgents(5);
    });

    afterAll(async () => {
        await cleanAll();
    });

    describe('Complete Agent Management Workflow', () => {
        it('should complete full agent lifecycle: create, read, update, delete', async () => {
            // Step 1: Create new agent
            const newAgentData = {
                name: 'Workflow Test Agent',
                email: 'workflow@test.com',
                mobile: {
                    countryCode: '+1',
                    number: '9876543210'
                },
                password: 'password123'
            };

            const createResponse = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newAgentData)
                .expect(201);

            expect(createResponse.body.success).toBe(true);
            expect(createResponse.body.data.name).toBe(newAgentData.name);
            expect(createResponse.body.data.email).toBe(newAgentData.email);

            const agentId = createResponse.body.data.id;

            // Step 2: Read agent details
            const readResponse = await request(app)
                .get(`/api/agents/${agentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(readResponse.body.success).toBe(true);
            expect(readResponse.body.data.name).toBe(newAgentData.name);
            expect(readResponse.body.data.isActive).toBe(true);

            // Step 3: Update agent
            const updateData = {
                name: 'Updated Workflow Agent',
                isActive: false
            };

            const updateResponse = await request(app)
                .put(`/api/agents/${agentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(updateResponse.body.success).toBe(true);
            expect(updateResponse.body.data.name).toBe(updateData.name);
            expect(updateResponse.body.data.isActive).toBe(false);

            // Step 4: Verify agent appears in list
            const listResponse = await request(app)
                .get('/api/agents')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(listResponse.body.success).toBe(true);
            const updatedAgent = listResponse.body.data.find(agent => agent.id === agentId);
            expect(updatedAgent.name).toBe(updateData.name);
            expect(updatedAgent.isActive).toBe(false);

            // Step 5: Delete agent
            const deleteResponse = await request(app)
                .delete(`/api/agents/${agentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(deleteResponse.body.success).toBe(true);
            expect(deleteResponse.body.message).toBe('Agent deleted successfully');

            // Step 6: Verify agent is deleted (soft delete)
            const verifyResponse = await request(app)
                .get(`/api/agents/${agentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(verifyResponse.body.success).toBe(false);
            expect(verifyResponse.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('Complete File Upload and Distribution Workflow', () => {
        it('should complete full upload workflow: preview, upload, distribute, view results', async () => {
            // Step 1: Preview file upload
            const previewResponse = await request(app)
                .post('/api/upload/preview')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from(sampleCSVData), 'workflow-test.csv')
                .field('targetAgents', '3')
                .expect(200);

            expect(previewResponse.body.success).toBe(true);
            expect(previewResponse.body.data.preview.totalItems).toBe(10);
            expect(previewResponse.body.data.preview.totalAgents).toBe(3);
            expect(previewResponse.body.data.preview.agents).toHaveLength(3);

            // Step 2: Upload and distribute file
            const uploadResponse = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from(sampleCSVData), 'workflow-test.csv')
                .field('targetAgents', '3')
                .expect(200);

            expect(uploadResponse.body.success).toBe(true);
            expect(uploadResponse.body.data.distribution.totalItems).toBe(10);
            expect(uploadResponse.body.data.distribution.status).toBe('completed');
            expect(uploadResponse.body.data.tasksCreated).toBe(10);

            const distributionId = uploadResponse.body.data.distribution.id;

            // Step 3: View distribution details
            const distributionResponse = await request(app)
                .get(`/api/distributions/${distributionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(distributionResponse.body.success).toBe(true);
            expect(distributionResponse.body.data.distribution.id).toBe(distributionId);
            expect(distributionResponse.body.data.agents).toHaveLength(3);

            // Verify task distribution
            const totalTasks = distributionResponse.body.data.agents.reduce(
                (sum, agent) => sum + agent.taskCount, 0
            );
            expect(totalTasks).toBe(10);

            // Step 4: View agent tasks
            const firstAgent = distributionResponse.body.data.agents[0];
            const agentTasksResponse = await request(app)
                .get(`/api/agents/${firstAgent.agentId}/tasks`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(agentTasksResponse.body.success).toBe(true);
            expect(agentTasksResponse.body.data.length).toBeGreaterThan(0);
            expect(agentTasksResponse.body.data[0].distributionId).toBe(distributionId);

            // Step 5: View all distributions
            const allDistributionsResponse = await request(app)
                .get('/api/distributions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(allDistributionsResponse.body.success).toBe(true);
            const ourDistribution = allDistributionsResponse.body.data.find(
                dist => dist.id === distributionId
            );
            expect(ourDistribution).toBeDefined();
            expect(ourDistribution.filename).toBe('workflow-test.csv');
        });
    });

    describe('Authentication and Authorization Workflow', () => {
        it('should complete authentication workflow: login, access protected routes, token validation', async () => {
            // Step 1: Login with valid credentials
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: adminUser.email,
                    password: 'password123'
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
            expect(loginResponse.body.data.token).toBeDefined();
            expect(loginResponse.body.data.user.email).toBe(adminUser.email);

            const token = loginResponse.body.data.token;

            // Step 2: Access protected route with token
            const protectedResponse = await request(app)
                .get('/api/agents')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(protectedResponse.body.success).toBe(true);
            expect(Array.isArray(protectedResponse.body.data)).toBe(true);

            // Step 3: Verify token is valid
            const verifyResponse = await request(app)
                .get('/api/auth/verify')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(verifyResponse.body.success).toBe(true);
            expect(verifyResponse.body.data.valid).toBe(true);
            expect(verifyResponse.body.data.user.email).toBe(adminUser.email);

            // Step 4: Get user profile
            const profileResponse = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(profileResponse.body.success).toBe(true);
            expect(profileResponse.body.data.user.email).toBe(adminUser.email);
            expect(profileResponse.body.data.user.role).toBe('admin');

            // Step 5: Try accessing protected route without token
            await request(app)
                .get('/api/agents')
                .expect(401);

            // Step 6: Try accessing with invalid token
            await request(app)
                .get('/api/agents')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('Error Handling Workflow', () => {
        it('should handle various error scenarios gracefully', async () => {
            // Step 1: Invalid login credentials
            const invalidLoginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(invalidLoginResponse.body.success).toBe(false);
            expect(invalidLoginResponse.body.error.code).toBe('INVALID_CREDENTIALS');

            // Step 2: Validation errors
            const validationErrorResponse = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '', // Invalid: empty name
                    email: 'invalid-email', // Invalid: bad email format
                    mobile: {
                        countryCode: 'invalid', // Invalid: bad country code
                        number: '123' // Invalid: too short
                    }
                })
                .expect(400);

            expect(validationErrorResponse.body.success).toBe(false);
            expect(validationErrorResponse.body.error.code).toBe('VALIDATION_ERROR');
            expect(Array.isArray(validationErrorResponse.body.error.details)).toBe(true);

            // Step 3: Resource not found
            const notFoundResponse = await request(app)
                .get('/api/agents/507f1f77bcf86cd799439999') // Non-existent ID
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);

            expect(notFoundResponse.body.success).toBe(false);
            expect(notFoundResponse.body.error.code).toBe('NOT_FOUND');

            // Step 4: Duplicate resource
            const existingAgent = testAgents[0];
            const duplicateResponse = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Duplicate Test',
                    email: existingAgent.email, // Duplicate email
                    mobile: {
                        countryCode: '+1',
                        number: '9999999999'
                    },
                    password: 'password123'
                })
                .expect(409);

            expect(duplicateResponse.body.success).toBe(false);
            expect(duplicateResponse.body.error.code).toBe('DUPLICATE_ERROR');

            // Step 5: Invalid file upload
            const invalidFileResponse = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from('invalid csv content'), 'invalid.csv')
                .field('targetAgents', '3')
                .expect(400);

            expect(invalidFileResponse.body.success).toBe(false);
            expect(['MISSING_COLUMNS', 'EMPTY_FILE', 'INVALID_DATA'].includes(
                invalidFileResponse.body.error.code
            )).toBe(true);
        });
    });

    describe('Performance and Load Workflow', () => {
        it('should handle multiple concurrent requests', async () => {
            // Create multiple concurrent requests to test system under load
            const concurrentRequests = Array.from({ length: 10 }, (_, i) =>
                request(app)
                    .get('/api/agents')
                    .set('Authorization', `Bearer ${adminToken}`)
            );

            const responses = await Promise.all(concurrentRequests);

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });

        it('should handle large file upload efficiently', async () => {
            // Create a larger CSV file for testing
            const largeCSVData = 'FirstName,Phone,Notes\n' +
                Array.from({ length: 100 }, (_, i) =>
                    `Customer ${i + 1},+123456789${i.toString().padStart(2, '0')},Note for customer ${i + 1}`
                ).join('\n');

            const startTime = Date.now();

            const response = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from(largeCSVData), 'large-test.csv')
                .field('targetAgents', '5')
                .expect(200);

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            expect(response.body.success).toBe(true);
            expect(response.body.data.distribution.totalItems).toBe(100);
            expect(response.body.data.tasksCreated).toBe(100);

            // Should complete within reasonable time (adjust threshold as needed)
            expect(processingTime).toBeLessThan(10000); // 10 seconds
        });
    });

    describe('Data Consistency Workflow', () => {
        it('should maintain data consistency across operations', async () => {
            // Step 1: Get initial counts
            const initialAgentsResponse = await request(app)
                .get('/api/agents')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const initialAgentCount = initialAgentsResponse.body.data.length;

            const initialDistributionsResponse = await request(app)
                .get('/api/distributions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const initialDistributionCount = initialDistributionsResponse.body.data.length;

            // Step 2: Create new agent
            const newAgentResponse = await request(app)
                .post('/api/agents')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Consistency Test Agent',
                    email: 'consistency@test.com',
                    mobile: {
                        countryCode: '+1',
                        number: '5555555555'
                    },
                    password: 'password123'
                })
                .expect(201);

            const newAgentId = newAgentResponse.body.data.id;

            // Step 3: Upload file to create distribution
            const uploadResponse = await request(app)
                .post('/api/upload')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from(sampleCSVData), 'consistency-test.csv')
                .field('targetAgents', '3')
                .expect(200);

            const distributionId = uploadResponse.body.data.distribution.id;

            // Step 4: Verify counts increased
            const updatedAgentsResponse = await request(app)
                .get('/api/agents')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(updatedAgentsResponse.body.data.length).toBe(initialAgentCount + 1);

            const updatedDistributionsResponse = await request(app)
                .get('/api/distributions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(updatedDistributionsResponse.body.data.length).toBe(initialDistributionCount + 1);

            // Step 5: Verify task count matches distribution
            const distributionDetailsResponse = await request(app)
                .get(`/api/distributions/${distributionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const totalTasksInDistribution = distributionDetailsResponse.body.data.agents.reduce(
                (sum, agent) => sum + agent.taskCount, 0
            );

            expect(totalTasksInDistribution).toBe(uploadResponse.body.data.tasksCreated);

            // Step 6: Delete agent and verify consistency
            await request(app)
                .delete(`/api/agents/${newAgentId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            const finalAgentsResponse = await request(app)
                .get('/api/agents')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(finalAgentsResponse.body.data.length).toBe(initialAgentCount);
        });
    });
});