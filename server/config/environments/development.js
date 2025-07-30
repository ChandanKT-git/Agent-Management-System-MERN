module.exports = {
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-management',
        options: {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
        }
    },
    server: {
        port: process.env.PORT || 5000,
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true
        }
    },
    security: {
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        },
        rateLimiting: {
            auth: {
                windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
                max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5
            },
            api: {
                windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
                max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100
            },
            upload: {
                windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW) || 60 * 1000, // 1 minute
                max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 3
            }
        }
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    },
    logging: {
        level: 'debug',
        format: 'combined',
        enableConsole: true,
        enableFile: true,
        filename: 'logs/development.log'
    }
};