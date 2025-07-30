/**
 * Test coverage configuration for comprehensive testing
 */

module.exports = {
    // Coverage thresholds - ensure minimum 80% coverage as required
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        },
        // Specific thresholds for critical modules
        './controllers/': {
            branches: 85,
            functions: 90,
            lines: 85,
            statements: 85
        },
        './utils/': {
            branches: 90,
            functions: 95,
            lines: 90,
            statements: 90
        },
        './middleware/': {
            branches: 85,
            functions: 90,
            lines: 85,
            statements: 85
        }
    },

    // Files to include in coverage
    collectCoverageFrom: [
        'controllers/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        '!models/index.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!**/coverage/**'
    ],

    // Coverage reporters
    coverageReporters: [
        'text',
        'text-summary',
        'lcov',
        'html',
        'json',
        'clover'
    ],

    // Coverage directory
    coverageDirectory: 'coverage',

    // Fail tests if coverage is below threshold
    coverageFailOnMinimum: true,

    // Coverage provider
    coverageProvider: 'v8'
};