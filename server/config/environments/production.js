module.exports = {
    database: {
        uri: process.env.MONGODB_URI,
        options: {
            maxPoolSize: 50, // Maintain up to 50 socket connections
            serverSelectionTimeoutMS: 30000, // Keep trying to send operations for 30 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            retryWrites: true,
            w: 'majority'
        }
    },
    server: {
        port: process.env.PORT || 5000,
        cors: {
            origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
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
                max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
                standardHeaders: true,
                legacyHeaders: false
            },
            api: {
                windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
                max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100,
                standardHeaders: true,
                legacyHeaders: false
            },
            upload: {
                windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW) || 60 * 1000, // 1 minute
                max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX) || 3,
                standardHeaders: true,
                legacyHeaders: false
            }
        }
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        allowedTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    },
    logging: {
        level: 'info',
        format: 'combined',
        enableConsole: false,
        enableFile: true,
        filename: 'logs/production.log',
        maxsize: 10485760, // 10MB
        maxFiles: 5,
        compress: true
    }
};