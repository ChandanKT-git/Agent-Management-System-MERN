// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'agent-management');

// Create application user (optional, for additional security)
if (process.env.MONGO_APP_USERNAME && process.env.MONGO_APP_PASSWORD) {
    db.createUser({
        user: process.env.MONGO_APP_USERNAME,
        pwd: process.env.MONGO_APP_PASSWORD,
        roles: [
            {
                role: 'readWrite',
                db: process.env.MONGO_INITDB_DATABASE || 'agent-management'
            }
        ]
    });
}

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.agents.createIndex({ email: 1 }, { unique: true });
db.agents.createIndex({ 'mobile.number': 1 });
db.distributions.createIndex({ uploadedBy: 1 });
db.distributions.createIndex({ createdAt: -1 });
db.tasks.createIndex({ distributionId: 1 });
db.tasks.createIndex({ agentId: 1 });
db.tasks.createIndex({ status: 1 });

print('Database initialization completed successfully');