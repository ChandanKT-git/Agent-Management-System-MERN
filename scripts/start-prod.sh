#!/bin/bash

# Production startup script
echo "Starting MERN Agent Management System in production mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Warning: MongoDB doesn't appear to be running."
    echo "Please start MongoDB before running the application."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found."
    echo "Please copy .env.production to .env and configure your environment variables."
    exit 1
fi

# Install dependencies
echo "Installing production dependencies..."
npm run install:all

# Build the application
echo "Building application..."
npm run build

# Create necessary directories
mkdir -p server/logs server/uploads

# Set environment
export NODE_ENV=production

# Start with PM2
echo "Starting production server with PM2..."
pm2 start ecosystem.config.js --env production

echo "Application started successfully!"
echo "Use 'pm2 monit' to monitor the application"
echo "Use 'pm2 logs' to view logs"