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

describe('Model Validation Tests', () => {
    describe('User Model Validation', () => {
        test('should require email and password', async () => {
            const user = new User({});

            await expect(user.save()).rejects.toThrow();

            const error = user.validateSync();
            expect(error.errors.email).toBeDefined();
            expect(error.errors.password).toBeDefined();
        });

        test('should validate email format', async () => {
            const user = new User({
                email: 'invalid-email',
                password: 'password123'
            });

            const error = user.validateSync();
            expect(error.errors.email.message).toContain('valid email');
        });

        test('should enforce minimum password length', async () => {
            const user = new User({
                email: 'test@example.com',
                password: '123'
            });

            const error = user.validateSync();
            expect(error.errors.password.message).toContain('at least 6 characters');
        });

        test('should enforce unique email constraint', async () => {
            const userData = {
                email: 'test@example.com',
                password: 'password123'
            };

            const user1 = new User(userData);
            await user1.save();

            const user2 = new User(userData);
            await expect(user2.save()).rejects.toThrow();
        });
    });

    describe('Agent Model Validation', () => {
        test('should require all mandatory fields', async () => {
            const agent = new Agent({});

            const error = agent.validateSync();
            expect(error.errors.name).toBeDefined();
            expect(error.errors.email).toBeDefined();
            expect(error.errors['mobile.countryCode']).toBeDefined();
            expect(error.errors['mobile.number']).toBeDefined();
            expect(error.errors.password).toBeDefined();
        });

        test('should validate mobile country code format', async () => {
            const agent = new Agent({
                name: 'John Doe',
                email: 'john@example.com',
                mobile: {
                    countryCode: '1', // Missing +
                    number: '1234567890'
                },
                password: 'password123'
            });

            const error = agent.validateSync();
            expect(error.errors['mobile.countryCode']).toBeDefined();
        });

        test('should validate mobile number format', async () => {
            const agent = new Agent({
                name: 'John Doe',
                email: 'john@example.com',
                mobile: {
                    countryCode: '+1',
                    number: '123' // Too short
                },
                password: 'password123'
            });

            const error = agent.validateSync();
            expect(error.errors['mobile.number']).toBeDefined();
        });

        test('should enforce unique email constraint', async () => {
            const agentData = {
                name: 'John Doe',
                email: 'john@example.com',
                mobile: {
                    countryCode: '+1',
                    number: '1234567890'
                },
                password: 'password123'
            };

            const agent1 = new Agent(agentData);
            await agent1.save();

            const agent2 = new Agent({
                ...agentData,
                mobile: {
                    countryCode: '+1',
                    number: '0987654321'
                }
            });
            await expect(agent2.save()).rejects.toThrow();
        });

        test('should enforce unique mobile number constraint', async () => {
            const agent1 = new Agent({
                name: 'John Doe',
                email: 'john1@example.com',
                mobile: {
                    countryCode: '+1',
                    number: '1234567890'
                },
                password: 'password123'
            });
            await agent1.save();

            const agent2 = new Agent({
                name: 'Jane Doe',
                email: 'jane@example.com',
                mobile: {
                    countryCode: '+1',
                    number: '1234567890' // Same mobile number
                },
                password: 'password123'
            });
            await expect(agent2.save()).rejects.toThrow();
        });
    });

    describe('Distribution Model Validation', () => {
        test('should require all mandatory fields', async () => {
            const distribution = new Distribution({});

            const error = distribution.validateSync();
            expect(error.errors.filename).toBeDefined();
            expect(error.errors.originalName).toBeDefined();
            expect(error.errors.totalItems).toBeDefined();
            expect(error.errors.uploadedBy).toBeDefined();
        });

        test('should validate totalItems is not negative', async () => {
            const user = new User({
                email: 'admin@example.com',
                password: 'password123'
            });
            await user.save();

            const distribution = new Distribution({
                filename: 'test.csv',
                originalName: 'test.csv',
                totalItems: -1,
                uploadedBy: user._id
            });

            const error = distribution.validateSync();
            expect(error.errors.totalItems).toBeDefined();
        });

        test('should validate status enum values', async () => {
            const user = new User({
                email: 'admin@example.com',
                password: 'password123'
            });
            await user.save();

            const distribution = new Distribution({
                filename: 'test.csv',
                originalName: 'test.csv',
                totalItems: 100,
                uploadedBy: user._id,
                status: 'invalid-status'
            });

            const error = distribution.validateSync();
            expect(error.errors.status).toBeDefined();
        });
    });

    describe('Task Model Validation', () => {
        test('should require all mandatory fields', async () => {
            const task = new Task({});

            const error = task.validateSync();
            expect(error.errors.distributionId).toBeDefined();
            expect(error.errors.agentId).toBeDefined();
            expect(error.errors.firstName).toBeDefined();
            expect(error.errors.phone).toBeDefined();
        });

        test('should validate status enum values', async () => {
            const user = new User({
                email: 'admin@example.com',
                password: 'password123'
            });
            await user.save();

            const agent = new Agent({
                name: 'John Doe',
                email: 'john@example.com',
                mobile: {
                    countryCode: '+1',
                    number: '1234567890'
                },
                password: 'password123'
            });
            await agent.save();

            const distribution = new Distribution({
                filename: 'test.csv',
                originalName: 'test.csv',
                totalItems: 1,
                uploadedBy: user._id
            });
            await distribution.save();

            const task = new Task({
                distributionId: distribution._id,
                agentId: agent._id,
                firstName: 'Jane',
                phone: '+1234567890',
                status: 'invalid-status'
            });

            const error = task.validateSync();
            expect(error.errors.status).toBeDefined();
        });

        test('should enforce field length limits', async () => {
            const user = new User({
                email: 'admin@example.com',
                password: 'password123'
            });
            await user.save();

            const agent = new Agent({
                name: 'John Doe',
                email: 'john@example.com',
                mobile: {
                    countryCode: '+1',
                    number: '1234567890'
                },
                password: 'password123'
            });
            await agent.save();

            const distribution = new Distribution({
                filename: 'test.csv',
                originalName: 'test.csv',
                totalItems: 1,
                uploadedBy: user._id
            });
            await distribution.save();

            const task = new Task({
                distributionId: distribution._id,
                agentId: agent._id,
                firstName: 'A'.repeat(101), // Exceeds 100 character limit
                phone: '+1234567890',
                notes: 'A'.repeat(1001) // Exceeds 1000 character limit
            });

            const error = task.validateSync();
            expect(error.errors.firstName).toBeDefined();
            expect(error.errors.notes).toBeDefined();
        });
    });
});