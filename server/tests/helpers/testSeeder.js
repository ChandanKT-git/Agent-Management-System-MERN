const User = require('../../models/User');
const Agent = require('../../models/Agent');
const Distribution = require('../../models/Distribution');
const Task = require('../../models/Task');
const { testUsers, testAgents, testDistributions, testTasks } = require('../fixtures/testData');

/**
 * Database seeding utilities for tests
 */

/**
 * Seed all test data
 */
const seedAll = async () => {
    await seedUsers();
    await seedAgents();
    await seedDistributions();
    await seedTasks();
};

/**
 * Seed test users
 */
const seedUsers = async () => {
    await User.deleteMany({});
    await User.insertMany(testUsers);
};

/**
 * Seed test agents
 */
const seedAgents = async () => {
    await Agent.deleteMany({});
    await Agent.insertMany(testAgents);
};

/**
 * Seed test distributions
 */
const seedDistributions = async () => {
    await Distribution.deleteMany({});
    await Distribution.insertMany(testDistributions);
};

/**
 * Seed test tasks
 */
const seedTasks = async () => {
    await Task.deleteMany({});
    await Task.insertMany(testTasks);
};

/**
 * Clean all test data
 */
const cleanAll = async () => {
    await Task.deleteMany({});
    await Distribution.deleteMany({});
    await Agent.deleteMany({});
    await User.deleteMany({});
};

/**
 * Seed specific collections
 */
const seedCollection = async (collectionName, data) => {
    const models = {
        users: User,
        agents: Agent,
        distributions: Distribution,
        tasks: Task
    };

    const Model = models[collectionName];
    if (!Model) {
        throw new Error(`Unknown collection: ${collectionName}`);
    }

    await Model.deleteMany({});
    await Model.insertMany(data);
};

/**
 * Create test user with specific role
 */
const createTestUser = async (overrides = {}) => {
    const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'admin',
        ...overrides
    };

    return await User.create(userData);
};

/**
 * Create test agent
 */
const createTestAgent = async (overrides = {}) => {
    const agentData = {
        name: 'Test Agent',
        email: 'agent@test.com',
        mobile: {
            countryCode: '+1',
            number: '1234567890'
        },
        password: 'password123',
        isActive: true,
        ...overrides
    };

    return await Agent.create(agentData);
};

/**
 * Create test distribution
 */
const createTestDistribution = async (overrides = {}) => {
    const distributionData = {
        filename: 'test.csv',
        originalName: 'test.csv',
        totalItems: 10,
        uploadedBy: testUsers[0]._id,
        status: 'completed',
        ...overrides
    };

    return await Distribution.create(distributionData);
};

/**
 * Create test task
 */
const createTestTask = async (overrides = {}) => {
    const taskData = {
        distributionId: testDistributions[0]._id,
        agentId: testAgents[0]._id,
        firstName: 'Test Customer',
        phone: '+1234567890',
        notes: 'Test notes',
        status: 'assigned',
        assignedAt: new Date(),
        ...overrides
    };

    return await Task.create(taskData);
};

/**
 * Get test data by type
 */
const getTestData = (type) => {
    const data = {
        users: testUsers,
        agents: testAgents,
        distributions: testDistributions,
        tasks: testTasks
    };

    return data[type] || [];
};

/**
 * Create multiple test agents
 */
const createMultipleAgents = async (count = 5) => {
    const agents = [];
    for (let i = 0; i < count; i++) {
        const agent = await createTestAgent({
            name: `Agent ${i + 1}`,
            email: `agent${i + 1}@test.com`,
            mobile: {
                countryCode: '+1',
                number: `123456789${i}`
            }
        });
        agents.push(agent);
    }
    return agents;
};

/**
 * Create test distribution with tasks
 */
const createDistributionWithTasks = async (agentCount = 3, taskCount = 9) => {
    // Create agents
    const agents = await createMultipleAgents(agentCount);

    // Create distribution
    const distribution = await createTestDistribution({
        totalItems: taskCount,
        distributionSummary: {
            totalAgents: agentCount,
            itemsPerAgent: Math.floor(taskCount / agentCount),
            remainderItems: taskCount % agentCount
        }
    });

    // Create tasks distributed among agents
    const tasks = [];
    for (let i = 0; i < taskCount; i++) {
        const agentIndex = i % agentCount;
        const task = await createTestTask({
            distributionId: distribution._id,
            agentId: agents[agentIndex]._id,
            firstName: `Customer ${i + 1}`,
            phone: `+123456789${i}`,
            notes: `Test note ${i + 1}`,
            status: i % 3 === 0 ? 'completed' : 'assigned'
        });
        tasks.push(task);
    }

    return { distribution, agents, tasks };
};

/**
 * Wait for database operations to complete
 */
const waitForDatabase = async (timeout = 5000) => {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout);
    });
};

module.exports = {
    seedAll,
    seedUsers,
    seedAgents,
    seedDistributions,
    seedTasks,
    cleanAll,
    seedCollection,
    createTestUser,
    createTestAgent,
    createTestDistribution,
    createTestTask,
    createMultipleAgents,
    createDistributionWithTasks,
    getTestData,
    waitForDatabase
};