const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { User, Agent, Distribution, Task } = require('../models');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

describe('User Model', () => {
    test('should create a user with valid data', async () => {
        const userData = {
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser.email).toBe(userData.email);
        expect(savedUser.role).toBe(userData.role);
        expect(savedUser.password).not.toBe(userData.password); // Should be hashed
        expect(savedUser.createdAt).toBeDefined();
    });

    test('should not create user with invalid email', async () => {
        const userData = {
            email: 'invalid-email',
            password: 'password123'
        };

        const user = new User(userData);
        await expect(user.save()).rejects.toThrow();
    });

    test('should compare password correctly', async () => {
        const userData = {
            email: 'admin@test.com',
            password: 'password123'
        };

        const user = new User(userData);
        await user.save();

        const isMatch = await user.comparePassword('password123');
        const isNotMatch = await user.comparePassword('wrongpassword');

        expect(isMatch).toBe(true);
        expect(isNotMatch).toBe(false);
    });
});

describe('Agent Model', () => {
    test('should create an agent with valid data', async () => {
        const agentData = {
            name: 'John Doe',
            email: 'john@test.com',
            mobile: {
                countryCode: '+1',
                number: '1234567890'
            },
            password: 'password123'
        };

        const agent = new Agent(agentData);
        const savedAgent = await agent.save();

        expect(savedAgent.name).toBe(agentData.name);
        expect(savedAgent.email).toBe(agentData.email);
        expect(savedAgent.mobile.countryCode).toBe(agentData.mobile.countryCode);
        expect(savedAgent.mobile.number).toBe(agentData.mobile.number);
        expect(savedAgent.isActive).toBe(true);
        expect(savedAgent.password).not.toBe(agentData.password); // Should be hashed
    });

    test('should get full mobile number virtual', async () => {
        const agentData = {
            name: 'John Doe',
            email: 'john@test.com',
            mobile: {
                countryCode: '+1',
                number: '1234567890'
            },
            password: 'password123'
        };

        const agent = new Agent(agentData);
        await agent.save();

        expect(agent.fullMobile).toBe('+11234567890');
    });
});

describe('Distribution Model', () => {
    test('should create a distribution with valid data', async () => {
        // First create a user
        const user = new User({
            email: 'admin@test.com',
            password: 'password123'
        });
        await user.save();

        const distributionData = {
            filename: 'test-file.csv',
            originalName: 'original-test-file.csv',
            totalItems: 100,
            uploadedBy: user._id,
            status: 'processing'
        };

        const distribution = new Distribution(distributionData);
        const savedDistribution = await distribution.save();

        expect(savedDistribution.filename).toBe(distributionData.filename);
        expect(savedDistribution.originalName).toBe(distributionData.originalName);
        expect(savedDistribution.totalItems).toBe(distributionData.totalItems);
        expect(savedDistribution.status).toBe(distributionData.status);
    });

    test('should mark distribution as completed', async () => {
        const user = new User({
            email: 'admin@test.com',
            password: 'password123'
        });
        await user.save();

        const distribution = new Distribution({
            filename: 'test-file.csv',
            originalName: 'original-test-file.csv',
            totalItems: 100,
            uploadedBy: user._id
        });
        await distribution.save();

        const summary = {
            totalAgents: 5,
            itemsPerAgent: 20,
            remainderItems: 0
        };

        await distribution.markCompleted(summary);

        expect(distribution.status).toBe('completed');
        expect(distribution.distributionSummary.totalAgents).toBe(5);
        expect(distribution.distributionSummary.itemsPerAgent).toBe(20);
    });
});

describe('Task Model', () => {
    test('should create a task with valid data', async () => {
        // Create user, agent, and distribution first
        const user = new User({
            email: 'admin@test.com',
            password: 'password123'
        });
        await user.save();

        const agent = new Agent({
            name: 'John Doe',
            email: 'john@test.com',
            mobile: {
                countryCode: '+1',
                number: '1234567890'
            },
            password: 'password123'
        });
        await agent.save();

        const distribution = new Distribution({
            filename: 'test-file.csv',
            originalName: 'original-test-file.csv',
            totalItems: 1,
            uploadedBy: user._id
        });
        await distribution.save();

        const taskData = {
            distributionId: distribution._id,
            agentId: agent._id,
            firstName: 'Jane',
            phone: '+1234567890',
            notes: 'Test notes'
        };

        const task = new Task(taskData);
        const savedTask = await task.save();

        expect(savedTask.firstName).toBe(taskData.firstName);
        expect(savedTask.phone).toBe(taskData.phone);
        expect(savedTask.notes).toBe(taskData.notes);
        expect(savedTask.status).toBe('assigned');
        expect(savedTask.assignedAt).toBeDefined();
    });

    test('should mark task as completed', async () => {
        const user = new User({
            email: 'admin@test.com',
            password: 'password123'
        });
        await user.save();

        const agent = new Agent({
            name: 'John Doe',
            email: 'john@test.com',
            mobile: {
                countryCode: '+1',
                number: '1234567890'
            },
            password: 'password123'
        });
        await agent.save();

        const distribution = new Distribution({
            filename: 'test-file.csv',
            originalName: 'original-test-file.csv',
            totalItems: 1,
            uploadedBy: user._id
        });
        await distribution.save();

        const task = new Task({
            distributionId: distribution._id,
            agentId: agent._id,
            firstName: 'Jane',
            phone: '+1234567890'
        });
        await task.save();

        await task.markCompleted();

        expect(task.status).toBe('completed');
        expect(task.completedAt).toBeDefined();
    });
});