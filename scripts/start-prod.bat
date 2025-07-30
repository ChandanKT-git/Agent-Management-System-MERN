@echo off
REM Production startup script for Windows

echo Starting MERN Agent Management System in production mode...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Check if PM2 is installed
pm2 --version >nul 2>&1
if errorlevel 1 (
    echo Installing PM2...
    npm install -g pm2
)

REM Check if .env file exists
if not exist ".env" (
    echo Error: .env file not found.
    echo Please copy .env.production to .env and configure your environment variables.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing production dependencies...
call npm run install:all

REM Build the application
echo Building application...
call npm run build

REM Create necessary directories
if not exist "server\logs" mkdir server\logs
if not exist "server\uploads" mkdir server\uploads

REM Set environment
set NODE_ENV=production

REM Start with PM2
echo Starting production server with PM2...
pm2 start ecosystem.config.js --env production

echo Application started successfully!
echo Use 'pm2 monit' to monitor the application
echo Use 'pm2 logs' to view logs
pause