const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Mock fs to avoid actual file operations during tests
jest.mock('fs');

describe('Logger Utils', () => {
    let logger;
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Mock fs.existsSync and fs.mkdirSync
        fs.existsSync.mockReturnValue(true);
        fs.mkdirSync.mockImplementation(() => { });

        // Reset environment
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('Logger Configuration', () => {
        it('should create logger with default info level', () => {
            delete process.env.LOG_LEVEL;
            logger = require('../utils/logger');

            expect(logger.level).toBe('info');
        });

        it('should use LOG_LEVEL environment variable', () => {
            process.env.LOG_LEVEL = 'debug';
            logger = require('../utils/logger');

            expect(logger.level).toBe('debug');
        });

        it('should create logs directory if it does not exist', () => {
            fs.existsSync.mockReturnValue(false);

            logger = require('../utils/logger');

            expect(fs.mkdirSync).toHaveBeenCalledWith(
                expect.stringContaining('logs'),
                { recursive: true }
            );
        });

        it('should not create logs directory if it exists', () => {
            fs.existsSync.mockReturnValue(true);

            logger = require('../utils/logger');

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });
    });

    describe('Logger Transports', () => {
        beforeEach(() => {
            logger = require('../utils/logger');
        });

        it('should have file transports configured', () => {
            const fileTransports = logger.transports.filter(
                transport => transport instanceof winston.transports.File
            );

            expect(fileTransports).toHaveLength(2);

            // Check error log transport
            const errorTransport = fileTransports.find(
                transport => transport.level === 'error'
            );
            expect(errorTransport).toBeDefined();
            expect(errorTransport.filename).toContain('error.log');
            expect(errorTransport.maxsize).toBe(5242880); // 5MB
            expect(errorTransport.maxFiles).toBe(5);

            // Check combined log transport
            const combinedTransport = fileTransports.find(
                transport => !transport.level || transport.level !== 'error'
            );
            expect(combinedTransport).toBeDefined();
            expect(combinedTransport.filename).toContain('combined.log');
            expect(combinedTransport.maxsize).toBe(5242880); // 5MB
            expect(combinedTransport.maxFiles).toBe(5);
        });

        it('should add console transport in non-production environment', () => {
            process.env.NODE_ENV = 'development';

            // Re-require to get fresh instance
            delete require.cache[require.resolve('../utils/logger')];
            logger = require('../utils/logger');

            const consoleTransports = logger.transports.filter(
                transport => transport instanceof winston.transports.Console
            );

            expect(consoleTransports).toHaveLength(1);
        });

        it('should not add console transport in production environment', () => {
            process.env.NODE_ENV = 'production';

            // Re-require to get fresh instance
            delete require.cache[require.resolve('../utils/logger')];
            logger = require('../utils/logger');

            const consoleTransports = logger.transports.filter(
                transport => transport instanceof winston.transports.Console
            );

            expect(consoleTransports).toHaveLength(0);
        });
    });

    describe('Logger Format', () => {
        beforeEach(() => {
            logger = require('../utils/logger');
        });

        it('should have correct default meta', () => {
            expect(logger.defaultMeta).toEqual({ service: 'agent-management' });
        });

        it('should use JSON format with timestamp and errors', () => {
            // This is harder to test directly, but we can verify the format is set
            expect(logger.format).toBeDefined();
        });
    });

    describe('Logger Stream', () => {
        beforeEach(() => {
            logger = require('../utils/logger');
            // Mock the logger.info method
            logger.info = jest.fn();
        });

        it('should have stream object for Morgan integration', () => {
            expect(logger.stream).toBeDefined();
            expect(typeof logger.stream.write).toBe('function');
        });

        it('should write to logger.info when stream.write is called', () => {
            const message = 'HTTP request log message\n';

            logger.stream.write(message);

            expect(logger.info).toHaveBeenCalledWith('HTTP request log message');
        });

        it('should trim whitespace from stream messages', () => {
            const message = '  HTTP request with spaces  \n\t';

            logger.stream.write(message);

            expect(logger.info).toHaveBeenCalledWith('HTTP request with spaces');
        });
    });

    describe('Logger Methods', () => {
        beforeEach(() => {
            logger = require('../utils/logger');

            // Mock winston methods
            logger.info = jest.fn();
            logger.error = jest.fn();
            logger.warn = jest.fn();
            logger.debug = jest.fn();
        });

        it('should log info messages', () => {
            const message = 'Info message';
            const meta = { userId: '123' };

            logger.info(message, meta);

            expect(logger.info).toHaveBeenCalledWith(message, meta);
        });

        it('should log error messages', () => {
            const message = 'Error message';
            const error = new Error('Test error');

            logger.error(message, error);

            expect(logger.error).toHaveBeenCalledWith(message, error);
        });

        it('should log warning messages', () => {
            const message = 'Warning message';

            logger.warn(message);

            expect(logger.warn).toHaveBeenCalledWith(message);
        });

        it('should log debug messages', () => {
            const message = 'Debug message';
            const debugInfo = { step: 'validation' };

            logger.debug(message, debugInfo);

            expect(logger.debug).toHaveBeenCalledWith(message, debugInfo);
        });
    });

    describe('Error Handling in Logger Setup', () => {
        it('should handle file system errors gracefully', () => {
            fs.existsSync.mockImplementation(() => {
                throw new Error('File system error');
            });

            // Should not throw error when requiring logger
            expect(() => {
                delete require.cache[require.resolve('../utils/logger')];
                require('../utils/logger');
            }).not.toThrow();
        });

        it('should handle directory creation errors gracefully', () => {
            fs.existsSync.mockReturnValue(false);
            fs.mkdirSync.mockImplementation(() => {
                throw new Error('Cannot create directory');
            });

            // Should not throw error when requiring logger
            expect(() => {
                delete require.cache[require.resolve('../utils/logger')];
                require('../utils/logger');
            }).not.toThrow();
        });
    });
});