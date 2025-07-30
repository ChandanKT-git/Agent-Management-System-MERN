# Development Guide

This guide provides comprehensive instructions for developers who want to contribute to or extend the MERN Agent Management System.

## Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Project Architecture](#project-architecture)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Database Management](#database-management)
7. [API Development](#api-development)
8. [Frontend Development](#frontend-development)
9. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
10. [Contributing Guidelines](#contributing-guidelines)

## Development Environment Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **MongoDB**: Version 7.0 or higher
- **Git**: Latest version
- **Code Editor**: VS Code recommended with extensions

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Initial Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd mern-agent-management
   ```

2. **Install Dependencies**
   ```bash
   # Install all dependencies (client + server)
   npm run install:all
   
   # Or install individually
   npm run install:server
   npm run install:client
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment files
   cp server/.env.example server/.env
   cp .env.production .env
   ```

4. **Configure Environment Variables**
   
   Edit `server/.env`:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/agent-management
   MONGODB_TEST_URI=mongodb://localhost:27017/agent-management-test
   
   # Authentication
   JWT_SECRET=your-development-jwt-secret-key
   JWT_EXPIRES_IN=24h
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # File Upload
   MAX_FILE_SIZE=5242880
   UPLOAD_DIR=./uploads
   
   # Security
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

5. **Start MongoDB**
   ```bash
   # macOS with Homebrew
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

6. **Start Development Servers**
   ```bash
   # Start both client and server
   npm run dev
   
   # Or start individually
   npm run server:dev  # Backend on :5000
   npm run client:dev  # Frontend on :3000
   ```

### Development Scripts

```bash
# Development
npm run dev              # Start both client and server
npm run server:dev       # Start server only
npm run client:dev       # Start client only

# Building
npm run build           # Build client for production
npm run client:build    # Build client only

# Testing
npm test               # Run all tests
npm run test:server    # Run server tests
npm run test:client    # Run client tests
npm run test:coverage  # Run tests with coverage

# Maintenance
npm run clean          # Clean build artifacts
npm run clean:deps     # Clean node_modules
npm run reset          # Clean and reinstall everything
```

## Project Architecture

### Directory Structure

```
mern-agent-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── utils/          # Utility functions
│   │   └── __tests__/      # Test files
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Express backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── tests/              # Test files
│   └── package.json
├── scripts/                # Build and deployment scripts
├── nginx/                  # Nginx configuration
└── package.json           # Root package.json
```

### Technology Stack

**Backend**:
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB 7.0+ with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **File Upload**: Multer
- **File Processing**: xlsx, csv-parser
- **Security**: Helmet, CORS, bcryptjs
- **Logging**: Winston, Morgan
- **Testing**: Jest, Supertest

**Frontend**:
- **Framework**: React 18+ with functional components
- **Build Tool**: Vite
- **Routing**: React Router DOM 6+
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **File Upload**: React Dropzone
- **Testing**: Vitest, React Testing Library

**Development Tools**:
- **Process Management**: PM2
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Development**: Nodemon, Concurrently

## Development Workflow

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow code standards
   - Write tests for new functionality
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(auth): add JWT token refresh functionality
fix(upload): handle CSV parsing errors correctly
docs(api): update endpoint documentation
test(agents): add unit tests for agent controller
```

### Code Review Process

1. **Self Review**
   - Test your changes thoroughly
   - Run linting and tests
   - Check for console errors

2. **Create Pull Request**
   - Provide clear description
   - Link related issues
   - Add screenshots for UI changes

3. **Address Feedback**
   - Respond to review comments
   - Make requested changes
   - Re-request review

## Code Standards

### JavaScript/Node.js Standards

1. **ES6+ Features**
   ```javascript
   // Use const/let instead of var
   const config = require('./config');
   let result = null;
   
   // Use arrow functions for callbacks
   const users = data.map(item => item.user);
   
   // Use template literals
   const message = `Hello ${user.name}`;
   
   // Use destructuring
   const { name, email } = user;
   ```

2. **Async/Await**
   ```javascript
   // Preferred over promises
   const fetchUser = async (id) => {
     try {
       const user = await User.findById(id);
       return user;
     } catch (error) {
       throw new Error(`User not found: ${error.message}`);
     }
   };
   ```

3. **Error Handling**
   ```javascript
   // Always handle errors
   const createAgent = async (req, res, next) => {
     try {
       const agent = await Agent.create(req.body);
       res.status(201).json({ success: true, data: { agent } });
     } catch (error) {
       next(error); // Pass to error middleware
     }
   };
   ```

### React Standards

1. **Functional Components**
   ```jsx
   // Use functional components with hooks
   const AgentList = () => {
     const [agents, setAgents] = useState([]);
     
     useEffect(() => {
       fetchAgents();
     }, []);
     
     return (
       <div className="agent-list">
         {agents.map(agent => (
           <AgentCard key={agent.id} agent={agent} />
         ))}
       </div>
     );
   };
   ```

2. **Custom Hooks**
   ```jsx
   // Extract reusable logic
   const useAgents = () => {
     const [agents, setAgents] = useState([]);
     const [loading, setLoading] = useState(false);
     
     const fetchAgents = async () => {
       setLoading(true);
       try {
         const response = await api.get('/agents');
         setAgents(response.data.agents);
       } catch (error) {
         console.error('Failed to fetch agents:', error);
       } finally {
         setLoading(false);
       }
     };
     
     return { agents, loading, fetchAgents };
   };
   ```

3. **PropTypes or TypeScript**
   ```jsx
   // Document component props
   const AgentCard = ({ agent, onEdit, onDelete }) => {
     return (
       <div className="agent-card">
         <h3>{agent.name}</h3>
         <p>{agent.email}</p>
         <button onClick={() => onEdit(agent)}>Edit</button>
         <button onClick={() => onDelete(agent.id)}>Delete</button>
       </div>
     );
   };
   ```

### File Naming Conventions

- **Components**: PascalCase (`AgentList.jsx`)
- **Hooks**: camelCase with 'use' prefix (`useAgents.js`)
- **Utilities**: camelCase (`formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.js`)
- **Routes**: kebab-case (`agent-routes.js`)

## Testing Guidelines

### Backend Testing

1. **Unit Tests**
   ```javascript
   // tests/utils/validation.test.js
   const { validateEmail } = require('../../utils/validation');
   
   describe('Email Validation', () => {
     test('should validate correct email format', () => {
       expect(validateEmail('test@example.com')).toBe(true);
     });
     
     test('should reject invalid email format', () => {
       expect(validateEmail('invalid-email')).toBe(false);
     });
   });
   ```

2. **Integration Tests**
   ```javascript
   // tests/integration/agents.test.js
   const request = require('supertest');
   const app = require('../../server');
   
   describe('Agent API', () => {
     test('POST /api/agents should create new agent', async () => {
       const agentData = {
         name: 'John Doe',
         email: 'john@example.com',
         mobile: { countryCode: '+1', number: '1234567890' },
         password: 'password123'
       };
       
       const response = await request(app)
         .post('/api/agents')
         .set('Authorization', `Bearer ${token}`)
         .send(agentData)
         .expect(201);
         
       expect(response.body.success).toBe(true);
       expect(response.body.data.agent.name).toBe('John Doe');
     });
   });
   ```

### Frontend Testing

1. **Component Tests**
   ```jsx
   // src/components/__tests__/AgentCard.test.jsx
   import { render, screen, fireEvent } from '@testing-library/react';
   import AgentCard from '../AgentCard';
   
   describe('AgentCard', () => {
     const mockAgent = {
       id: '1',
       name: 'John Doe',
       email: 'john@example.com'
     };
     
     test('renders agent information', () => {
       render(<AgentCard agent={mockAgent} />);
       
       expect(screen.getByText('John Doe')).toBeInTheDocument();
       expect(screen.getByText('john@example.com')).toBeInTheDocument();
     });
     
     test('calls onEdit when edit button clicked', () => {
       const mockOnEdit = jest.fn();
       render(<AgentCard agent={mockAgent} onEdit={mockOnEdit} />);
       
       fireEvent.click(screen.getByText('Edit'));
       expect(mockOnEdit).toHaveBeenCalledWith(mockAgent);
     });
   });
   ```

2. **Hook Tests**
   ```jsx
   // src/hooks/__tests__/useAgents.test.js
   import { renderHook, act } from '@testing-library/react';
   import { useAgents } from '../useAgents';
   
   describe('useAgents', () => {
     test('should fetch agents on mount', async () => {
       const { result } = renderHook(() => useAgents());
       
       expect(result.current.loading).toBe(true);
       
       await act(async () => {
         await result.current.fetchAgents();
       });
       
       expect(result.current.loading).toBe(false);
       expect(result.current.agents).toHaveLength(0);
     });
   });
   ```

### Test Coverage Requirements

- **Minimum Coverage**: 80% for critical paths
- **Controllers**: 90% coverage required
- **Utilities**: 95% coverage required
- **Components**: 80% coverage required

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suites
npm run test:server
npm run test:client

# Run tests in watch mode
cd server && npm run test:watch
cd client && npm run test:watch
```

## Database Management

### MongoDB Schema Design

1. **User Schema**
   ```javascript
   const userSchema = new mongoose.Schema({
     email: { type: String, required: true, unique: true },
     password: { type: String, required: true },
     role: { type: String, enum: ['admin'], default: 'admin' }
   }, { timestamps: true });
   ```

2. **Agent Schema**
   ```javascript
   const agentSchema = new mongoose.Schema({
     name: { type: String, required: true },
     email: { type: String, required: true, unique: true },
     mobile: {
       countryCode: { type: String, required: true },
       number: { type: String, required: true }
     },
     password: { type: String, required: true },
     isActive: { type: Boolean, default: true }
   }, { timestamps: true });
   ```

### Database Indexes

```javascript
// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.agents.createIndex({ email: 1 }, { unique: true });
db.agents.createIndex({ isActive: 1 });
db.distributions.createIndex({ createdAt: -1 });
db.tasks.createIndex({ agentId: 1, distributionId: 1 });
```

### Database Seeding

```javascript
// scripts/seed-database.js
const seedDatabase = async () => {
  // Create admin user
  const adminUser = await User.create({
    email: 'admin@example.com',
    password: await bcrypt.hash('admin123', 10),
    role: 'admin'
  });
  
  // Create sample agents
  const agents = await Agent.create([
    {
      name: 'Agent 1',
      email: 'agent1@example.com',
      mobile: { countryCode: '+1', number: '1234567890' },
      password: await bcrypt.hash('password123', 10)
    }
    // ... more agents
  ]);
  
  console.log('Database seeded successfully');
};
```

## API Development

### Controller Pattern

```javascript
// controllers/agentController.js
const Agent = require('../models/Agent');
const { validationResult } = require('express-validator');

const createAgent = async (req, res, next) => {
  try {
    // Validation is handled by middleware
    const { name, email, mobile, password } = req.body;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create agent
    const agent = await Agent.create({
      name,
      email,
      mobile,
      password: hashedPassword
    });
    
    // Remove password from response
    const agentResponse = agent.toObject();
    delete agentResponse.password;
    
    res.status(201).json({
      success: true,
      data: { agent: agentResponse },
      message: 'Agent created successfully'
    });
  } catch (error) {
    next(error);
  }
};
```

### Middleware Development

```javascript
// middleware/validation.js
const Joi = require('joi');

const schemas = {
  agent: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    mobile: Joi.object({
      countryCode: Joi.string().pattern(/^\+\d{1,4}$/).required(),
      number: Joi.string().pattern(/^\d{10,15}$/).required()
    }).required(),
    password: Joi.string().min(6).required()
  })
};

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.details.reduce((acc, detail) => {
            acc[detail.path[0]] = detail.message;
            return acc;
          }, {})
        }
      });
    }
    next();
  };
};
```

### Error Handling

```javascript
// utils/errorHandler.js
const handleError = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { statusCode: 404, message };
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { statusCode: 409, message };
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { statusCode: 422, message };
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || 'SERVER_ERROR',
      message: error.message || 'Server Error'
    }
  });
};
```

## Frontend Development

### Component Structure

```jsx
// components/agents/AgentList.jsx
import React, { useState, useEffect } from 'react';
import { useAgents } from '../../hooks/useAgents';
import AgentCard from './AgentCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const AgentList = () => {
  const { agents, loading, error, fetchAgents } = useAgents();
  
  useEffect(() => {
    fetchAgents();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="agent-list">
      <div className="agent-list__header">
        <h2>Agents</h2>
        <button className="btn btn--primary">Add Agent</button>
      </div>
      
      <div className="agent-list__grid">
        {agents.map(agent => (
          <AgentCard 
            key={agent.id} 
            agent={agent}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

export default AgentList;
```

### State Management

```jsx
// contexts/AuthContext.jsx
import React, { createContext, useContext, useReducer } from 'react';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('token')
  });
  
  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### API Service Layer

```javascript
// services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

## Debugging and Troubleshooting

### Backend Debugging

1. **Enable Debug Logging**
   ```javascript
   // Add to server.js
   if (process.env.NODE_ENV === 'development') {
     app.use(morgan('dev'));
   }
   ```

2. **VS Code Debug Configuration**
   ```json
   // .vscode/launch.json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Debug Server",
         "type": "node",
         "request": "launch",
         "program": "${workspaceFolder}/server/server.js",
         "env": {
           "NODE_ENV": "development"
         },
         "console": "integratedTerminal",
         "restart": true,
         "runtimeExecutable": "nodemon"
       }
     ]
   }
   ```

3. **Database Debugging**
   ```javascript
   // Enable Mongoose debugging
   mongoose.set('debug', true);
   ```

### Frontend Debugging

1. **React Developer Tools**
   - Install browser extension
   - Use Components and Profiler tabs

2. **Console Debugging**
   ```javascript
   // Add debug logs
   console.log('Component rendered:', { props, state });
   console.table(data); // For arrays/objects
   ```

3. **Network Debugging**
   - Use browser DevTools Network tab
   - Monitor API requests and responses

### Common Issues

1. **CORS Errors**
   ```javascript
   // server/server.js
   app.use(cors({
     origin: ['http://localhost:3000', 'http://localhost:5173'],
     credentials: true
   }));
   ```

2. **MongoDB Connection Issues**
   ```javascript
   // Check connection status
   mongoose.connection.on('connected', () => {
     console.log('MongoDB connected');
   });
   
   mongoose.connection.on('error', (err) => {
     console.error('MongoDB connection error:', err);
   });
   ```

3. **JWT Token Issues**
   ```javascript
   // Verify token format
   const token = req.headers.authorization?.split(' ')[1];
   if (!token) {
     return res.status(401).json({ error: 'No token provided' });
   }
   ```

## Contributing Guidelines

### Before Contributing

1. **Check Existing Issues**
   - Look for related issues or feature requests
   - Comment on issues you want to work on

2. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/mern-agent-management.git
   cd mern-agent-management
   ```

3. **Set Up Development Environment**
   - Follow setup instructions above
   - Ensure all tests pass

### Making Changes

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow Code Standards**
   - Use consistent formatting
   - Add appropriate comments
   - Follow naming conventions

3. **Write Tests**
   - Add unit tests for new functions
   - Add integration tests for new endpoints
   - Add component tests for new UI components

4. **Update Documentation**
   - Update API documentation for new endpoints
   - Update user guide for new features
   - Add inline code comments

### Submitting Changes

1. **Run Quality Checks**
   ```bash
   npm test              # Run all tests
   npm run test:coverage # Check coverage
   npm run lint          # Check code style
   ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

3. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Provide clear description
   - Link related issues
   - Add screenshots for UI changes
   - Request review from maintainers

### Code Review Process

1. **Automated Checks**
   - Tests must pass
   - Code coverage requirements met
   - No linting errors

2. **Manual Review**
   - Code quality and standards
   - Security considerations
   - Performance implications
   - Documentation completeness

3. **Feedback and Iteration**
   - Address reviewer comments
   - Make requested changes
   - Re-request review

### Release Process

1. **Version Bumping**
   ```bash
   npm version patch  # Bug fixes
   npm version minor  # New features
   npm version major  # Breaking changes
   ```

2. **Changelog Updates**
   - Document all changes
   - Follow semantic versioning
   - Include migration notes

3. **Deployment**
   - Test in staging environment
   - Deploy to production
   - Monitor for issues

For questions about contributing, please create an issue or contact the maintainers.