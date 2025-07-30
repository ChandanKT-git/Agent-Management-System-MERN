#!/bin/bash

# Development startup script
echo "Starting MERN Agent Management System in development mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Warning: MongoDB doesn't appear to be running."
    echo "Please start MongoDB before running the application."
    echo "On macOS: brew services start mongodb/brew/mongodb-community"
    echo "On Ubuntu: sudo systemctl start mongod"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "Installing dependencies..."
    npm run install:all
fi

# Create necessary directories
mkdir -p server/logs server/uploads

# Set environment
export NODE_ENV=development

# Start the application
echo "Starting development servers..."
npm run dev