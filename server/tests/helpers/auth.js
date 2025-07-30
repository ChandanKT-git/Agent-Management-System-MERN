const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { hashPassword } = require('../../utils/auth');

/**
 * Create a test user with proper authentication setup
 * @param {Object} userData - User data override
 * @returns {Object} - Created user and auth token
 */
const createTestUser = async (userData = {}) => {
    const defaultUserData = {
        email: 'admin@test.com',
        password: await hashPassword('password123'),
        role: 'admin'
    };

    const user = new User({ ...defaultUserData, ...userData });
    await user.save();

    // Create token with the same structure as the auth controller
    const token = jwt.sign(
        {
            userId: user._id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { user, token };
};

/**
 * Create multiple test agents
 * @param {number} count - Number of agents to create
 * @returns {Array} - Array of created agents
 */
const createTestAgents = async (count = 5) => {
    const Agent = require('../../models/Agent');
    const agents = [];

    for (let i = 1; i <= count; i++) {
        const agent = new Agent({
            name: `Agent ${i}`,
            email: `agent${i}@test.com`,
            mobile: {
                countryCode: '+1',
                number: `123456789${i}`
            },
            password: await hashPassword('password123'),
            isActive: true
        });
        await agent.save();
        agents.push(agent);
    }

    return agents;
};

/**
 * Setup test environment with user and agents
 * @returns {Object} - Test user, token, and agents
 */
const setupTestAuth = async () => {
    // Set test environment variables
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
    process.env.NODE_ENV = 'test';

    const { user, token } = await createTestUser();
    const agents = await createTestAgents();

    return { user, token, agents };
};

module.exports = {
    createTestUser,
    createTestAgents,
    setupTestAuth
};