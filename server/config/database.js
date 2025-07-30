const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
    try {
        const mongoURI = config.database.uri;

        if (!mongoURI) {
            throw new Error('MongoDB URI is not defined in environment variables');
        }

        // Set up connection event listeners
        mongoose.connection.on('connected', () => {
            console.log(`MongoDB Connected: ${mongoose.connection.host}`);
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

        const conn = await mongoose.connect(mongoURI, config.database.options);

        return conn;
    } catch (error) {
        console.error('Database connection error:', error.message);

        // Provide helpful error messages for common issues
        if (error.message.includes('ECONNREFUSED')) {
            console.error('Make sure MongoDB is running on your system');
        } else if (error.message.includes('authentication failed')) {
            console.error('Check your MongoDB credentials in the environment variables');
        }

        if (config.isProduction) {
            process.exit(1);
        } else {
            throw error;
        }
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    } catch (error) {
        console.error('Error closing database connection:', error.message);
    }
};

module.exports = {
    connectDB,
    disconnectDB
};