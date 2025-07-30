const winston = require('winston');
const path = require('path');
const config = require('./index');

// Ensure logs directory exists
const fs = require('fs');
const logsDir = path.dirname(config.logging.filename || 'logs/app.log');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level}]: ${stack || message}`;
    })
);

// Create transports array
const transports = [];

// Console transport
if (config.logging.enableConsole) {
    transports.push(
        new winston.transports.Console({
            format: consoleFormat,
            level: config.logging.level
        })
    );
}

// File transport
if (config.logging.enableFile) {
    const fileTransportOptions = {
        filename: config.logging.filename,
        format: logFormat,
        level: config.logging.level
    };

    // Add rotation options for production
    if (config.isProduction) {
        fileTransportOptions.maxsize = config.logging.maxsize;
        fileTransportOptions.maxFiles = config.logging.maxFiles;
        fileTransportOptions.tailable = true;
    }

    transports.push(new winston.transports.File(fileTransportOptions));
}

// Create logger instance
const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false
});

// Handle uncaught exceptions and unhandled rejections
if (config.isProduction) {
    logger.exceptions.handle(
        new winston.transports.File({
            filename: 'logs/exceptions.log',
            format: logFormat
        })
    );

    logger.rejections.handle(
        new winston.transports.File({
            filename: 'logs/rejections.log',
            format: logFormat
        })
    );
}

// Create a stream object for Morgan HTTP logging
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

module.exports = logger;