@echo off
REM Development startup script for Windows

echo Starting MERN Agent Management System in development mode...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    call npm run install:all
) else if not exist "server\node_modules" (
    echo Installing dependencies...
    call npm run install:all
) else if not exist "client\node_modules" (
    echo Installing dependencies...
    call npm run install:all
)

REM Create necessary directories
if not exist "server\logs" mkdir server\logs
if not exist "server\uploads" mkdir server\uploads

REM Set environment
set NODE_ENV=development

REM Start the application
echo Starting development servers...
npm run dev