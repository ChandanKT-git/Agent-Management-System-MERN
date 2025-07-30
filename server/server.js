const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('./config');
const { connectDB } = require('./config/database');
const { handleError, handleUnhandledRejection, handleUncaughtException } = require('./utils/errorHandler');
const logger = require('./config/logger');

const app = express();

// Handle uncaught exceptions
handleUncaughtException();

// Environment validation is handled in config/index.js

// Connect to MongoDB
connectDB();

// Enhanced security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false, // Disable for development
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.security.rateLimiting.api.windowMs,
    max: config.security.rateLimiting.api.max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: config.isProduction,
    legacyHeaders: false
});
app.use(limiter);

// Enhanced CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        const allowedOrigins = config.server.cors.origin;

        if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
            callback(null, true);
        } else if (allowedOrigins === false) {
            callback(new Error('Not allowed by CORS'));
        } else {
            callback(null, true);
        }
    },
    credentials: config.server.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// HTTP request logging
app.use(morgan('combined', { stream: logger.stream }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: config.environment,
        version: require('../package.json').version
    });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/distributions', require('./routes/distributions'));

// Global error handling middleware
app.use(handleError);

// Handle 404 routes
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found'
        }
    });
});

const PORT = config.server.port;

const server = app.listen(PORT, () => {
    logger.info(`Server running in ${config.environment} mode on port ${PORT}`);
    if (config.isDevelopment) {
        console.log(`Server running in ${config.environment} mode on port ${PORT}`);
    }
});

// Handle unhandled promise rejections
handleUnhandledRejection(server);

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Process terminated');
        console.log('Process terminated');
    });
});

module.exports = app;