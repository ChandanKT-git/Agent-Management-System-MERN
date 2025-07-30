# Deployment Guide

This guide covers different deployment strategies for the MERN Agent Management System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Local Development](#local-development)
4. [Production Deployment](#production-deployment)
5. [Docker Deployment](#docker-deployment)
6. [PM2 Deployment](#pm2-deployment)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm
- MongoDB 7.0+
- Git
- Docker and Docker Compose (for containerized deployment)
- PM2 (for process management)

## Environment Configuration

### 1. Copy Environment Files

```bash
# Copy and configure environment variables
cp .env.production .env
cp server/.env.example server/.env
```

### 2. Update Environment Variables

Edit `.env` and `server/.env` with your production values:

```bash
# Required for production
MONGODB_URI=mongodb://localhost:27017/agent-management
JWT_SECRET=your-super-secure-jwt-secret-key-here
ALLOWED_ORIGINS=https://yourdomain.com

# Optional but recommended
NODE_ENV=production
PORT=5000
MAX_FILE_SIZE=5242880
```

## Local Development

### Quick Start

```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev
```

This starts:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### Individual Services

```bash
# Backend only
npm run server:dev

# Frontend only
npm run client:dev

# Build frontend
npm run client:build
```

## Production Deployment

### 1. Manual Deployment

```bash
# Clone repository
git clone <repository-url>
cd agent-management

# Install dependencies
npm run install:all

# Build application
npm run build

# Start production server
npm start
```

### 2. Build Scripts

Available build commands:

```bash
npm run build          # Build client for production
npm run build:prod     # Build with NODE_ENV=production
npm run setup          # Install deps and build
npm run setup:prod     # Production setup
```

### 3. Process Management

The application includes several process management options:

- **Direct Node.js**: `npm start`
- **PM2**: `pm2 start ecosystem.config.js --env production`
- **Docker**: See Docker deployment section

## Docker Deployment

### 1. Using Docker Compose (Recommended)

```bash
# Production deployment
docker-compose up -d

# Development deployment
docker-compose -f docker-compose.dev.yml up -d

# With Nginx reverse proxy
docker-compose --profile with-nginx up -d
```

### 2. Environment Variables for Docker

Create `.env` file in project root:

```bash
# Database
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password
MONGO_DB_NAME=agent-management

# Application
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://yourdomain.com

# Ports
APP_PORT=5000
MONGO_PORT=27017
NGINX_PORT=80
```

### 3. Docker Commands

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Clean up
docker-compose down -v --remove-orphans
```

## PM2 Deployment

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Start Application

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js --env production

# Start development mode
pm2 start ecosystem.config.js --env development
```

### 3. PM2 Commands

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart agent-management-server

# Stop application
pm2 stop agent-management-server

# Delete process
pm2 delete agent-management-server

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

### 4. PM2 Deployment (Advanced)

```bash
# Setup deployment
pm2 deploy ecosystem.config.js production setup

# Deploy application
pm2 deploy ecosystem.config.js production
```

## Database Setup

### 1. MongoDB Installation

#### Ubuntu/Debian
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb/brew/mongodb-community
```

### 2. Database Configuration

```bash
# Connect to MongoDB
mongosh

# Create database and user
use agent-management
db.createUser({
  user: "appuser",
  pwd: "secure-password",
  roles: ["readWrite"]
})
```

## Nginx Configuration (Optional)

### 1. Install Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# macOS
brew install nginx
```

### 2. Configure Nginx

Copy the provided `nginx/nginx.conf` to your Nginx configuration directory and update server names and SSL certificates as needed.

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo nginx -s reload
```

## SSL/TLS Setup

### 1. Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Manual SSL Setup

1. Obtain SSL certificates from your provider
2. Place certificates in `nginx/ssl/` directory
3. Update `nginx/nginx.conf` with certificate paths
4. Uncomment HTTPS server block

## Monitoring and Maintenance

### 1. Health Checks

The application includes health check endpoints:

- **HTTP**: `GET /api/health`
- **Script**: `node server/healthcheck.js`

### 2. Logging

Logs are stored in:
- **Development**: Console output
- **Production**: `logs/` directory
- **PM2**: PM2 log files
- **Docker**: Container logs

### 3. Log Rotation

```bash
# Setup logrotate for application logs
sudo nano /etc/logrotate.d/agent-management

# Add configuration:
/path/to/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. Backup Strategy

```bash
# Database backup
mongodump --db agent-management --out /backup/$(date +%Y%m%d)

# Application backup
tar -czf /backup/app-$(date +%Y%m%d).tar.gz /path/to/app --exclude=node_modules --exclude=logs
```

## Performance Optimization

### 1. Database Optimization

```javascript
// Create indexes (run in MongoDB shell)
db.users.createIndex({ email: 1 }, { unique: true })
db.agents.createIndex({ email: 1 }, { unique: true })
db.distributions.createIndex({ createdAt: -1 })
db.tasks.createIndex({ agentId: 1, distributionId: 1 })
```

### 2. Application Optimization

- Enable gzip compression (handled by Nginx)
- Use PM2 cluster mode for multiple CPU cores
- Configure MongoDB connection pooling
- Implement caching for frequently accessed data

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI

# Test connection
mongosh $MONGODB_URI
```

#### 2. Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### 3. Permission Errors

```bash
# Fix file permissions
sudo chown -R nodejs:nodejs /path/to/app
chmod -R 755 /path/to/app
```

#### 4. PM2 Issues

```bash
# Reset PM2
pm2 kill
pm2 resurrect

# Clear logs
pm2 flush
```

#### 5. Docker Issues

```bash
# View container logs
docker-compose logs app

# Restart containers
docker-compose restart

# Clean up
docker system prune -a
```

### Log Analysis

```bash
# View application logs
tail -f logs/production.log

# View PM2 logs
pm2 logs --lines 100

# View Docker logs
docker-compose logs -f --tail=100
```

### Performance Monitoring

```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Monitor Docker containers
docker stats
```

## Security Checklist

- [ ] Use strong JWT secrets
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use HTTPS in production
- [ ] Keep dependencies updated
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable MongoDB authentication
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

## Maintenance Tasks

### Daily
- Monitor application logs
- Check system resources
- Verify backup completion

### Weekly
- Update dependencies
- Review security logs
- Performance analysis

### Monthly
- Security updates
- Database maintenance
- Backup verification
- Performance optimization review

For additional support, refer to the main README.md file or create an issue in the project repository.