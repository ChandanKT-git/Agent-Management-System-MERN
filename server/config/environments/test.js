module.exports = {
    database: {
        uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/agent-management-test',
        options: {
            maxPoolSize: 5, // Smaller pool for testing
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 10000,
            bufferCommands: false,
        }
    },
    server: {
        port: process.env.TEST_PORT || 5001,
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true
        }
    },
    security: {
        jwt: {
            secret: process.env.JWT_SECRET || 'test-jwt-secret',
            expiresIn: '1h'
        },
        rateLimiting: {
            auth: {
                windowMs: 60 * 1000, // 1 minute for faster testing
                max: 10
            },
            api: {
                windowMs: 60 * 1000, // 1 minute for faster testing
                max: 200
            },
            upload: {
                windowMs: 60 * 1000, // 1 minute for faster testing
                max: 10
            }
        }
    },
    upload: {
        maxFileSize: 1 * 1024 * 1024, // 1MB for testing
        uploadDir: './test-uploads',
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    },
    logging: {
        level: 'error', // Only log errors during testing
        format: 'simple',
        enableConsole: false,
        enableFile: false
    }
};