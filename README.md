# MERN Agent Management System

A comprehensive full-stack web application for managing agents and distributing CSV-based task lists. Built with MongoDB, Express.js, React, and Node.js, this system provides a complete solution for task distribution and agent management with enterprise-grade features.

## 🚀 Features

- ✅ **Secure Authentication**: JWT-based admin authentication with session management
- ✅ **Agent Management**: Complete CRUD operations for agent profiles
- ✅ **File Processing**: CSV/Excel file upload with intelligent parsing
- ✅ **Smart Distribution**: Automated task distribution algorithm among agents
- ✅ **Real-time Monitoring**: Live task tracking and progress monitoring
- ✅ **Robust Error Handling**: Comprehensive validation and error management
- ✅ **Production Ready**: Docker, PM2, and Nginx configurations included
- ✅ **Comprehensive Testing**: Unit, integration, and component tests
- ✅ **API Documentation**: Complete REST API documentation
- ✅ **Security Features**: Rate limiting, CORS, input validation, and more

## 📚 Documentation

- **[User Guide](USER_GUIDE.md)** - Complete guide for end users
- **[API Documentation](API_DOCUMENTATION.md)** - Comprehensive API reference
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Setup and contribution guidelines
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment instructions
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Common issues and solutions

## Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (v7.0 or higher)
- npm package manager
- [Docker](https://www.docker.com/) (optional, for containerized deployment)
- [PM2](https://pm2.keymetrics.io/) (optional, for production process management)

## Project Structure

```
mern-agent-management/
├── client/                 # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend
│   ├── config/
│   ├── uploads/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── package.json           # Root package.json
└── README.md
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mern-agent-management
```

2. Install dependencies for both client and server:
```bash
npm run install:all
```

Or install individually:
```bash
# Install server dependencies
npm run install:server

# Install client dependencies
npm run install:client
```

3. Set up environment variables:
```bash
cd server
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
# MongoDB Atlas (recommended for production)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/agent-management?retryWrites=true&w=majority

# Or local MongoDB for development
# MONGODB_URI=mongodb://localhost:27017/agent-management

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

4. Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

## Quick Start

### Development Mode

1. **Using startup script (recommended):**
```bash
# Windows
scripts\start-dev.bat

# Linux/macOS
./scripts/start-dev.sh
```

2. **Manual start:**
```bash
npm run dev
```

This will start:
- Server on http://localhost:5000
- Client on http://localhost:3000

### Production Mode

1. **Using startup script (recommended):**
```bash
# Windows
scripts\start-prod.bat

# Linux/macOS
./scripts/start-prod.sh
```

2. **Manual production deployment:**
```bash
# Install dependencies and build
npm run setup:prod

# Start with PM2
pm2 start ecosystem.config.js --env production
```

3. **Using Docker:**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## Deployment Options

This application supports multiple deployment strategies:

### 1. Traditional Server Deployment
- Manual deployment with Node.js and PM2
- Suitable for VPS or dedicated servers
- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

### 2. Docker Deployment
- Containerized deployment with Docker Compose
- Includes MongoDB, application server, and optional Nginx
- Production and development configurations available

### 3. Cloud Deployment
- Compatible with cloud platforms (AWS, Google Cloud, Azure)
- Environment-based configuration
- Horizontal scaling support with PM2 cluster mode

## API Endpoints

### Health Check
- `GET /api/health` - Server health check

### Authentication
- `POST /api/auth/login` - Admin login

### Agents
- `GET /api/agents` - Get all agents
- `POST /api/agents` - Create new agent
- `GET /api/agents/:id` - Get agent by ID
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `GET /api/agents/:id/tasks` - Get agent's assigned tasks

### File Upload & Distribution
- `POST /api/upload` - Upload and distribute CSV file
- `GET /api/distributions` - Get all distributions
- `GET /api/distributions/:id` - Get distribution details

## Testing

Run tests for both client and server:
```bash
npm test
```

Run tests individually:
```bash
# Server tests
npm run test:server

# Client tests
npm run test:client
```

## Environment Variables

### Core Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/agent-management` |
| `MONGODB_TEST_URI` | MongoDB test database URI | `mongodb://localhost:27017/agent-management-test` |
| `JWT_SECRET` | Secret key for JWT tokens | **Required** |
| `JWT_EXPIRES_IN` | JWT token expiration time | `24h` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

### File Upload Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `MAX_FILE_SIZE` | Maximum upload file size in bytes | `5242880` (5MB) |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |

### Security Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000,http://localhost:5173` |
| `AUTH_RATE_LIMIT_WINDOW` | Auth rate limit window (ms) | `900000` (15 min) |
| `AUTH_RATE_LIMIT_MAX` | Max auth requests per window | `5` |
| `API_RATE_LIMIT_WINDOW` | API rate limit window (ms) | `900000` (15 min) |
| `API_RATE_LIMIT_MAX` | Max API requests per window | `100` |

### Docker Configuration (Optional)
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_ROOT_USERNAME` | MongoDB root username | `admin` |
| `MONGO_ROOT_PASSWORD` | MongoDB root password | **Required for Docker** |
| `MONGO_DB_NAME` | Database name | `agent-management` |
| `APP_PORT` | Application port mapping | `5000` |
| `NGINX_PORT` | Nginx port mapping | `80` |

## Troubleshooting

### MongoDB Connection Issues

1. **Connection refused**: Make sure MongoDB is running
2. **Authentication failed**: Check your MongoDB credentials
3. **Database not found**: The database will be created automatically on first connection

### Port Already in Use

If you get a "port already in use" error:
```bash
# Find and kill the process using the port
lsof -ti:5000 | xargs kill -9  # For port 5000
lsof -ti:3000 | xargs kill -9  # For port 3000
```

### Environment Variables Not Loading

Make sure your `.env` file is in the `server/` directory and contains all required variables.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.
##
 Available Scripts

### Root Level Scripts
```bash
npm run dev              # Start development servers (client + server)
npm run build            # Build client for production
npm run start            # Start production server
npm run setup            # Install dependencies and build
npm run setup:prod       # Production setup with NODE_ENV=production
npm run test             # Run all tests
npm run test:coverage    # Run tests with coverage
npm run clean            # Clean build artifacts
npm run clean:deps       # Clean all node_modules
npm run reset            # Clean everything and reinstall
```

### Server Scripts
```bash
cd server
npm run dev              # Start server in development mode
npm run start            # Start server in production mode
npm run test             # Run server tests
npm run test:coverage    # Run server tests with coverage
```

### Client Scripts
```bash
cd client
npm run dev              # Start client development server
npm run build            # Build client for production
npm run preview          # Preview production build
npm run test             # Run client tests
```

## Configuration Files

- **Environment**: `.env`, `.env.production`, `server/.env`
- **Docker**: `docker-compose.yml`, `docker-compose.dev.yml`, `Dockerfile`
- **PM2**: `ecosystem.config.js`
- **Nginx**: `nginx/nginx.conf`
- **Database**: `scripts/mongo-init.js`

## Monitoring and Logging

### Development
- Console logging with detailed error information
- File logging disabled for faster development

### Production
- Structured JSON logging with Winston
- Log rotation and compression
- PM2 process monitoring
- Health check endpoints

### Log Files
- Application logs: `server/logs/production.log`
- PM2 logs: `logs/pm2-*.log`
- Error logs: `server/logs/error.log`

## Performance Features

- **Database**: Connection pooling and optimization
- **Caching**: MongoDB query optimization with indexes
- **Compression**: Gzip compression via Nginx
- **Process Management**: PM2 cluster mode for multi-core utilization
- **Rate Limiting**: API endpoint protection
- **File Processing**: Streaming for large CSV files

## Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Joi schema validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers middleware
- **File Upload**: Type and size validation

## Backup and Recovery

### Database Backup
```bash
# Create backup
mongodump --db agent-management --out backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db agent-management backup/20231201/agent-management
```

### Application Backup
```bash
# Backup application files (excluding node_modules)
tar -czf backup/app-$(date +%Y%m%d).tar.gz . --exclude=node_modules --exclude=logs
```

## Scaling Considerations

### Horizontal Scaling
- PM2 cluster mode for multi-process deployment
- Load balancing with Nginx
- Database replica sets for read scaling

### Vertical Scaling
- Memory optimization with connection pooling
- CPU optimization with clustering
- Storage optimization with log rotation

## Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement changes
   - Write tests
   - Update documentation

2. **Testing**
   - Unit tests for utilities and models
   - Integration tests for API endpoints
   - Component tests for React components
   - End-to-end tests for user workflows

3. **Deployment**
   - Build application
   - Run production tests
   - Deploy to staging
   - Deploy to production

## 📖 Complete Documentation Suite

### User Documentation
- **[User Guide](USER_GUIDE.md)** - Step-by-step instructions for using the application
- **[Troubleshooting Guide](TROUBLESHOOTING.md)** - Solutions to common issues and problems

### Developer Documentation
- **[API Documentation](API_DOCUMENTATION.md)** - Complete REST API reference with examples
- **[Development Guide](DEVELOPMENT_GUIDE.md)** - Setup, architecture, and contribution guidelines
- **[Deployment Guide](DEPLOYMENT.md)** - Production deployment and configuration

### Technical Specifications
- **Architecture Overview**: See design document in `.kiro/specs/mern-agent-management/design.md`
- **Requirements**: Detailed requirements in `.kiro/specs/mern-agent-management/requirements.md`
- **Implementation Plan**: Task breakdown in `.kiro/specs/mern-agent-management/tasks.md`

## 🎯 Quick Links

- **Getting Started**: See [Prerequisites](#prerequisites) and [Quick Start](#quick-start) sections below
- **API Reference**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **User Manual**: [USER_GUIDE.md](USER_GUIDE.md)
- **Development Setup**: [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
- **Production Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Issue Resolution**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## 🆘 Support

For support and questions:

1. **Check Documentation**: Review the relevant guide above
2. **Search Issues**: Look through existing GitHub issues
3. **Troubleshooting**: Consult the [Troubleshooting Guide](TROUBLESHOOTING.md)
4. **Create Issue**: Submit a detailed issue report with:
   - Error messages and logs
   - Steps to reproduce
   - System information
   - Expected vs actual behavior

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Development Guide](DEVELOPMENT_GUIDE.md) for:
- Development environment setup
- Code standards and conventions
- Testing requirements
- Pull request process

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - Agent management system
  - CSV file processing and distribution
  - JWT authentication
  - Production deployment configurations