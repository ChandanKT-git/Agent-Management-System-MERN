const mongoose = require('mongoose');

/**
 * Test data fixtures for consistent testing
 */

const testUsers = [
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
        email: 'user@test.com',
        password: 'password123',
        role: 'user',
        createdAt: new Date('2023-01-02T00:00:00.000Z'),
        updatedAt: new Date('2023-01-02T00:00:00.000Z')
    }
];

const testAgents = [
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439021'),
        name: 'John Doe',
        email: 'john@example.com',
        mobile: {
            countryCode: '+1',
            number: '1234567890'
        },
        password: 'password123',
        isActive: true,
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
        name: 'Jane Smith',
        email: 'jane@example.com',
        mobile: {
            countryCode: '+1',
            number: '1234567891'
        },
        password: 'password123',
        isActive: true,
        createdAt: new Date('2023-01-02T00:00:00.000Z'),
        updatedAt: new Date('2023-01-02T00:00:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439023'),
        name: 'Bob Johnson',
        email: 'bob@example.com',
        mobile: {
            countryCode: '+1',
            number: '1234567892'
        },
        password: 'password123',
        isActive: false,
        createdAt: new Date('2023-01-03T00:00:00.000Z'),
        updatedAt: new Date('2023-01-03T00:00:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439024'),
        name: 'Alice Wilson',
        email: 'alice@example.com',
        mobile: {
            countryCode: '+44',
            number: '7700900123'
        },
        password: 'password123',
        isActive: true,
        createdAt: new Date('2023-01-04T00:00:00.000Z'),
        updatedAt: new Date('2023-01-04T00:00:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439025'),
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        mobile: {
            countryCode: '+1',
            number: '1234567893'
        },
        password: 'password123',
        isActive: true,
        createdAt: new Date('2023-01-05T00:00:00.000Z'),
        updatedAt: new Date('2023-01-05T00:00:00.000Z')
    }
];

const testDistributions = [
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439031'),
        filename: 'test-distribution-1.csv',
        originalName: 'test-distribution-1.csv',
        totalItems: 10,
        uploadedBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        status: 'completed',
        distributionSummary: {
            totalAgents: 3,
            itemsPerAgent: 3,
            remainderItems: 1
        },
        createdAt: new Date('2023-01-01T10:00:00.000Z'),
        updatedAt: new Date('2023-01-01T10:05:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439032'),
        filename: 'test-distribution-2.xlsx',
        originalName: 'test-distribution-2.xlsx',
        totalItems: 15,
        uploadedBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        status: 'processing',
        createdAt: new Date('2023-01-02T10:00:00.000Z'),
        updatedAt: new Date('2023-01-02T10:00:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439033'),
        filename: 'test-distribution-3.csv',
        originalName: 'test-distribution-3.csv',
        totalItems: 5,
        uploadedBy: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        status: 'failed',
        processingError: 'Invalid data format',
        createdAt: new Date('2023-01-03T10:00:00.000Z'),
        updatedAt: new Date('2023-01-03T10:05:00.000Z')
    }
];

const testTasks = [
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439041'),
        distributionId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439031'),
        agentId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439021'),
        firstName: 'Customer One',
        phone: '+1234567890',
        notes: 'Important client - high priority',
        status: 'assigned',
        assignedAt: new Date('2023-01-01T10:05:00.000Z'),
        createdAt: new Date('2023-01-01T10:05:00.000Z'),
        updatedAt: new Date('2023-01-01T10:05:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439042'),
        distributionId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439031'),
        agentId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439021'),
        firstName: 'Customer Two',
        phone: '+1234567891',
        notes: 'Follow up needed within 24 hours',
        status: 'completed',
        assignedAt: new Date('2023-01-01T10:05:00.000Z'),
        completedAt: new Date('2023-01-01T15:30:00.000Z'),
        createdAt: new Date('2023-01-01T10:05:00.000Z'),
        updatedAt: new Date('2023-01-01T15:30:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439043'),
        distributionId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439031'),
        agentId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
        firstName: 'Customer Three',
        phone: '+1234567892',
        notes: 'New lead from website',
        status: 'assigned',
        assignedAt: new Date('2023-01-01T10:05:00.000Z'),
        createdAt: new Date('2023-01-01T10:05:00.000Z'),
        updatedAt: new Date('2023-01-01T10:05:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439044'),
        distributionId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439031'),
        agentId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439022'),
        firstName: 'Customer Four',
        phone: '+1234567893',
        notes: 'Referral from existing customer',
        status: 'in_progress',
        assignedAt: new Date('2023-01-01T10:05:00.000Z'),
        startedAt: new Date('2023-01-01T14:00:00.000Z'),
        createdAt: new Date('2023-01-01T10:05:00.000Z'),
        updatedAt: new Date('2023-01-01T14:00:00.000Z')
    },
    {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439045'),
        distributionId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439031'),
        agentId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439024'),
        firstName: 'Customer Five',
        phone: '+1234567894',
        notes: 'Interested in premium package',
        status: 'assigned',
        assignedAt: new Date('2023-01-01T10:05:00.000Z'),
        createdAt: new Date('2023-01-01T10:05:00.000Z'),
        updatedAt: new Date('2023-01-01T10:05:00.000Z')
    }
];

// Sample CSV data for testing file uploads
const sampleCSVData = `FirstName,Phone,Notes
John Doe,+1234567890,Important client - high priority
Jane Smith,+1987654321,Follow up needed within 24 hours
Bob Johnson,+1555123456,New lead from website
Alice Wilson,+1444987654,Referral from existing customer
Charlie Brown,+1333876543,Interested in premium package
David Davis,+1222765432,Callback requested for tomorrow
Eva Evans,+1111654321,Urgent - decision maker
Frank Foster,+1999543210,Budget approved - ready to proceed
Grace Green,+1888432109,Technical questions about product
Henry Harris,+1777321098,Price comparison with competitors`;

const sampleExcelData = [
    ['FirstName', 'Phone', 'Notes'],
    ['John Doe', '+1234567890', 'Important client - high priority'],
    ['Jane Smith', '+1987654321', 'Follow up needed within 24 hours'],
    ['Bob Johnson', '+1555123456', 'New lead from website'],
    ['Alice Wilson', '+1444987654', 'Referral from existing customer'],
    ['Charlie Brown', '+1333876543', 'Interested in premium package'],
    ['David Davis', '+1222765432', 'Callback requested for tomorrow'],
    ['Eva Evans', '+1111654321', 'Urgent - decision maker'],
    ['Frank Foster', '+1999543210', 'Budget approved - ready to proceed']
];

// Invalid data samples for testing validation
const invalidCSVData = {
    missingColumns: `Name,Email,Phone
John Doe,john@example.com,+1234567890`,

    missingRequiredFields: `FirstName,Phone,Notes
,+1234567890,Important client
Jane Smith,,Follow up needed`,

    invalidPhoneNumbers: `FirstName,Phone,Notes
John Doe,123,Important client
Jane Smith,invalid-phone,Follow up needed`,

    emptyFile: '',

    malformedCSV: `FirstName,Phone,Notes
John Doe,"Unclosed quote,+1234567890,Important client`
};

module.exports = {
    testUsers,
    testAgents,
    testDistributions,
    testTasks,
    sampleCSVData,
    sampleExcelData,
    invalidCSVData
};