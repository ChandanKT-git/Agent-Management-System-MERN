const mongoose = require('mongoose');
const Agent = require('../models/Agent');
const Task = require('../models/Task');
const Distribution = require('../models/Distribution');
const {
    distributeItems,
    createDistribution,
    getDistributionSummary,
    validateDistributionParams,
    previewDistribution
} = require('../utils/distributionAlgorithm');

describe('Distribution Algorithm', () => {
    let testAgents = [];
    let testDistribution;

    beforeEach(async () => {
        // Clear all collections
        await Agent.deleteMany({});
        await Task.deleteMany({});
        await Distribution.deleteMany({});

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
            },
            {
                name: 'Agent 4',
                email: 'agent4@test.com',
                mobile: { countryCode: '+1', number: '1234567893' },
                password: 'password123',
                isActive: true
            },
            {
                name: 'Agent 5',
                email: 'agent5@test.com',
                mobile: { countryCode: '+1', number: '1234567894' },
                password: 'password123',
                isActive: true
            }
        ]);

        // Create test distribution
        testDistribution = await Distribution.create({
            filename: 'test-file.csv',
            originalName: 'test-file.csv',
            totalItems: 10,
            uploadedBy: new mongoose.Types.ObjectId(),
            status: 'processing'
        });
    });

    describe('validateDistributionParams', () => {
        test('should validate correct parameters', () => {
            const items = [
                { FirstName: 'John', Phone: '1234567890', Notes: 'Test note' }
            ];
            const result = validateDistributionParams(items, 5);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('should reject empty items array', () => {
            const result = validateDistributionParams([], 5);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Items array cannot be empty');
        });

        test('should reject non-array items', () => {
            const result = validateDistributionParams('not an array', 5);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Items must be an array');
        });

        test('should reject invalid target agent count', () => {
            const items = [{ FirstName: 'John', Phone: '1234567890', Notes: 'Test' }];

            const result1 = validateDistributionParams(items, 0);
            expect(result1.isValid).toBe(false);
            expect(result1.errors).toContain('Target agent count must be a positive integer');

            const result2 = validateDistributionParams(items, 11);
            expect(result2.isValid).toBe(false);
            expect(result2.errors).toContain('Target agent count cannot exceed 10');
        });
    });

    describe('previewDistribution', () => {
        test('should generate preview for equal distribution', async () => {
            const items = Array.from({ length: 10 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            const result = await previewDistribution(items, 5);

            expect(result.success).toBe(true);
            expect(result.preview.totalItems).toBe(10);
            expect(result.preview.totalAgents).toBe(5);
            expect(result.preview.itemsPerAgent).toBe(2);
            expect(result.preview.remainderItems).toBe(0);
            expect(result.preview.agents).toHaveLength(5);

            result.preview.agents.forEach(agent => {
                expect(agent.itemCount).toBe(2);
            });
        });

        test('should generate preview with remainder distribution', async () => {
            const items = Array.from({ length: 13 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            const result = await previewDistribution(items, 5);

            expect(result.success).toBe(true);
            expect(result.preview.totalItems).toBe(13);
            expect(result.preview.totalAgents).toBe(5);
            expect(result.preview.itemsPerAgent).toBe(2);
            expect(result.preview.remainderItems).toBe(3);

            // First 3 agents should get 3 items, last 2 should get 2 items
            expect(result.preview.agents[0].itemCount).toBe(3);
            expect(result.preview.agents[1].itemCount).toBe(3);
            expect(result.preview.agents[2].itemCount).toBe(3);
            expect(result.preview.agents[3].itemCount).toBe(2);
            expect(result.preview.agents[4].itemCount).toBe(2);
        });

        test('should handle fewer agents than target', async () => {
            // Remove 2 agents to have only 3 active
            await Agent.updateMany(
                { _id: { $in: [testAgents[3]._id, testAgents[4]._id] } },
                { isActive: false }
            );

            const items = Array.from({ length: 10 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            const result = await previewDistribution(items, 5);

            expect(result.success).toBe(true);
            expect(result.preview.totalAgents).toBe(3); // Only 3 active agents
            expect(result.preview.itemsPerAgent).toBe(3);
            expect(result.preview.remainderItems).toBe(1);
        });

        test('should throw error when no active agents', async () => {
            await Agent.updateMany({}, { isActive: false });

            const items = [{ FirstName: 'John', Phone: '1234567890', Notes: 'Test' }];

            await expect(previewDistribution(items, 5)).rejects.toThrow('No active agents available for distribution');
        });
    });

    describe('distributeItems', () => {
        test('should distribute items equally among 5 agents', async () => {
            const items = Array.from({ length: 10 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            const result = await distributeItems(items, testDistribution._id, 5);

            expect(result.success).toBe(true);
            expect(result.tasksCreated).toBe(10);
            expect(result.totalItemsDistributed).toBe(10);
            expect(result.summary.totalAgents).toBe(5);
            expect(result.summary.itemsPerAgent).toBe(2);
            expect(result.summary.remainderItems).toBe(0);

            // Verify tasks were created in database
            const tasks = await Task.find({ distributionId: testDistribution._id });
            expect(tasks).toHaveLength(10);

            // Verify each agent got 2 tasks
            for (const agent of testAgents) {
                const agentTasks = tasks.filter(task => task.agentId.equals(agent._id));
                expect(agentTasks).toHaveLength(2);
            }
        });

        test('should handle remainder distribution correctly', async () => {
            const items = Array.from({ length: 13 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            const result = await distributeItems(items, testDistribution._id, 5);

            expect(result.success).toBe(true);
            expect(result.tasksCreated).toBe(13);
            expect(result.summary.totalAgents).toBe(5);
            expect(result.summary.itemsPerAgent).toBe(2);
            expect(result.summary.remainderItems).toBe(3);

            // Verify tasks were created
            const tasks = await Task.find({ distributionId: testDistribution._id });
            expect(tasks).toHaveLength(13);

            // Verify distribution: with 13 items and 5 agents (2 per agent + 3 remainder)
            // First 3 agents get 3 items, last 2 get 2 items
            const sortedAgents = testAgents.sort((a, b) => a.createdAt - b.createdAt);
            const agentTaskCounts = [];
            for (const agent of sortedAgents) {
                const agentTasks = tasks.filter(task => task.agentId.equals(agent._id));
                agentTaskCounts.push(agentTasks.length);
            }

            // Check that the distribution is correct
            const totalDistributed = agentTaskCounts.reduce((sum, count) => sum + count, 0);
            expect(totalDistributed).toBe(13);

            const threeItemAgents = agentTaskCounts.filter(count => count === 3).length;
            const twoItemAgents = agentTaskCounts.filter(count => count === 2).length;
            expect(threeItemAgents).toBe(3);
            expect(twoItemAgents).toBe(2);
        });

        test('should distribute among fewer agents when less than target available', async () => {
            // Deactivate 2 agents
            await Agent.updateMany(
                { _id: { $in: [testAgents[3]._id, testAgents[4]._id] } },
                { isActive: false }
            );

            const items = Array.from({ length: 9 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            const result = await distributeItems(items, testDistribution._id, 5);

            expect(result.success).toBe(true);
            expect(result.summary.totalAgents).toBe(3); // Only 3 active agents
            expect(result.summary.itemsPerAgent).toBe(3);
            expect(result.summary.remainderItems).toBe(0);

            // Verify only active agents got tasks
            const tasks = await Task.find({ distributionId: testDistribution._id });
            expect(tasks).toHaveLength(9);

            const activeAgentIds = testAgents.slice(0, 3).map(agent => agent._id);
            tasks.forEach(task => {
                expect(activeAgentIds.some(id => id.equals(task.agentId))).toBe(true);
            });
        });

        test('should throw error for invalid input', async () => {
            await expect(distributeItems([], testDistribution._id, 5))
                .rejects.toThrow('Items array is required and cannot be empty');

            await expect(distributeItems(null, testDistribution._id, 5))
                .rejects.toThrow('Items array is required and cannot be empty');

            const items = [{ FirstName: 'John', Phone: '1234567890', Notes: 'Test' }];
            await expect(distributeItems(items, null, 5))
                .rejects.toThrow('Distribution ID is required');
        });

        test('should throw error when no active agents available', async () => {
            await Agent.updateMany({}, { isActive: false });

            const items = [{ FirstName: 'John', Phone: '1234567890', Notes: 'Test' }];

            await expect(distributeItems(items, testDistribution._id, 5))
                .rejects.toThrow('No active agents available for distribution');
        });

        test('should create tasks with correct data structure', async () => {
            const items = [
                { FirstName: 'John Doe', Phone: '+1234567890', Notes: 'Important client' },
                { FirstName: 'Jane Smith', Phone: '+1987654321', Notes: 'Follow up needed' }
            ];

            await distributeItems(items, testDistribution._id, 5);

            const tasks = await Task.find({ distributionId: testDistribution._id });
            expect(tasks).toHaveLength(2);

            tasks.forEach(task => {
                expect(task.distributionId).toEqual(testDistribution._id);
                expect(task.agentId).toBeDefined();
                expect(task.firstName).toBeDefined();
                expect(task.phone).toBeDefined();
                expect(task.notes).toBeDefined();
                expect(task.status).toBe('assigned');
                expect(task.assignedAt).toBeDefined();
            });

            // Verify specific data
            const johnTask = tasks.find(task => task.firstName === 'John Doe');
            expect(johnTask.phone).toBe('+1234567890');
            expect(johnTask.notes).toBe('Important client');
        });
    });

    describe('createDistribution', () => {
        test('should create complete distribution and update document', async () => {
            const items = Array.from({ length: 10 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            const result = await createDistribution(items, testDistribution, 5);

            expect(result.success).toBe(true);
            expect(result.distributionId).toEqual(testDistribution._id);
            expect(result.tasksCreated).toBe(10);

            // Verify distribution document was updated
            const updatedDistribution = await Distribution.findById(testDistribution._id);
            expect(updatedDistribution.status).toBe('completed');
            expect(updatedDistribution.distributionSummary.totalAgents).toBe(5);
            expect(updatedDistribution.distributionSummary.itemsPerAgent).toBe(2);
            expect(updatedDistribution.distributionSummary.remainderItems).toBe(0);
        });

        test('should mark distribution as failed on error', async () => {
            // Create invalid scenario by removing all agents
            await Agent.updateMany({}, { isActive: false });

            const items = [{ FirstName: 'John', Phone: '1234567890', Notes: 'Test' }];

            await expect(createDistribution(items, testDistribution, 5))
                .rejects.toThrow('No active agents available for distribution');

            // Verify distribution was marked as failed
            const updatedDistribution = await Distribution.findById(testDistribution._id);
            expect(updatedDistribution.status).toBe('failed');
            expect(updatedDistribution.processingError).toContain('No active agents available');
        });
    });

    describe('getDistributionSummary', () => {
        test('should return complete distribution summary', async () => {
            // First create a distribution with matching totalItems
            const items = Array.from({ length: 10 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            await createDistribution(items, testDistribution, 5);

            // Get the summary
            const result = await getDistributionSummary(testDistribution._id);

            expect(result.success).toBe(true);
            expect(result.distribution.id).toEqual(testDistribution._id);
            expect(result.distribution.filename).toBe('test-file.csv');
            expect(result.distribution.totalItems).toBe(10); // Original total from testDistribution
            expect(result.distribution.status).toBe('completed');

            expect(result.agentSummary).toHaveLength(5);
            result.agentSummary.forEach(agentSummary => {
                expect(agentSummary.agentName).toBeDefined();
                expect(agentSummary.agentEmail).toBeDefined();
                expect(agentSummary.taskCount).toBeGreaterThan(0);
                expect(agentSummary.completedCount).toBe(0); // All tasks start as assigned
                expect(agentSummary.pendingCount).toBe(agentSummary.taskCount);
            });
        });

        test('should throw error for non-existent distribution', async () => {
            const fakeId = new mongoose.Types.ObjectId();

            await expect(getDistributionSummary(fakeId))
                .rejects.toThrow('Distribution not found');
        });
    });

    describe('Edge Cases', () => {
        test('should handle single item distribution', async () => {
            const items = [{ FirstName: 'John', Phone: '1234567890', Notes: 'Single item' }];

            const result = await distributeItems(items, testDistribution._id, 5);

            expect(result.success).toBe(true);
            expect(result.tasksCreated).toBe(1);
            expect(result.summary.totalAgents).toBe(5);
            expect(result.summary.itemsPerAgent).toBe(0);
            expect(result.summary.remainderItems).toBe(1);

            // Only first agent (by creation order) should get the item
            const tasks = await Task.find({ distributionId: testDistribution._id });
            expect(tasks).toHaveLength(1);
            const sortedAgents = testAgents.sort((a, b) => a.createdAt - b.createdAt);
            expect(tasks[0].agentId).toEqual(sortedAgents[0]._id);
        });

        test('should handle more items than agents can handle evenly', async () => {
            const items = Array.from({ length: 23 }, (_, i) => ({
                FirstName: `Person ${i + 1}`,
                Phone: `123456789${i}`,
                Notes: `Note ${i + 1}`
            }));

            const result = await distributeItems(items, testDistribution._id, 5);

            expect(result.success).toBe(true);
            expect(result.tasksCreated).toBe(23);
            expect(result.summary.itemsPerAgent).toBe(4);
            expect(result.summary.remainderItems).toBe(3);

            // Verify distribution
            const tasks = await Task.find({ distributionId: testDistribution._id });
            const sortedAgents = testAgents.sort((a, b) => a.createdAt - b.createdAt);
            const agentTaskCounts = [];
            for (const agent of sortedAgents) {
                const agentTasks = tasks.filter(task => task.agentId.equals(agent._id));
                agentTaskCounts.push(agentTasks.length);
            }

            // With 23 items and 5 agents: 4 per agent + 3 remainder
            // First 3 agents get 5 items, last 2 get 4 items
            // But the actual distribution might vary based on agent order
            const totalDistributed = agentTaskCounts.reduce((sum, count) => sum + count, 0);
            expect(totalDistributed).toBe(23);

            // Check that the distribution is correct: some agents get 5, others get 4
            const fiveItemAgents = agentTaskCounts.filter(count => count === 5).length;
            const fourItemAgents = agentTaskCounts.filter(count => count === 4).length;
            expect(fiveItemAgents).toBe(3);
            expect(fourItemAgents).toBe(2);
        });

        test('should handle empty notes field', async () => {
            const items = [
                { FirstName: 'John', Phone: '1234567890', Notes: '' },
                { FirstName: 'Jane', Phone: '1987654321' } // No Notes field
            ];

            const result = await distributeItems(items, testDistribution._id, 5);

            expect(result.success).toBe(true);

            const tasks = await Task.find({ distributionId: testDistribution._id });
            expect(tasks).toHaveLength(2);

            tasks.forEach(task => {
                expect(task.notes).toBe(''); // Should default to empty string
            });
        });
    });
});