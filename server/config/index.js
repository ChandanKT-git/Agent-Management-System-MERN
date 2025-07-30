const path = require('path');

// Load environment variables
require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';

let config;

try {
    config = require(`./environments/${environment}`);
} catch (error) {
    console.error(`Configuration file for environment '${environment}' not found. Falling back to development.`);
    config = require('./environments/development');
}

// Validate required environment variables
const requiredEnvVars = {
    production: ['MONGODB_URI', 'JWT_SECRET'],
    development: ['JWT_SECRET'],
    test: []
};

const required = requiredEnvVars[environment] || [];
const missing = required.filter(envVar => !process.env[envVar]);

if (missing.length > 0) {
    console.error(`Missing required environment variables for ${environment}: ${missing.join(', ')}`);
    if (environment === 'production') {
        process.exit(1);
    }
}

// Add environment info to config
config.environment = environment;
config.isDevelopment = environment === 'development';
config.isProduction = environment === 'production';
config.isTest = environment === 'test';

module.exports = config;