const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';

    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Set test MongoDB URI
    process.env.MONGODB_TEST_URI = mongoUri;

    // Close any existing connections
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }

    // Stop the in-memory MongoDB instance
    if (mongoServer) {
        await mongoServer.stop();
    }
});

// Clear database between tests
afterEach(async () => {
    if (mongoose.connection.readyState === 1) {
        const collections = mongoose.connection.collections;

        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    }
});