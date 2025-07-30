# Troubleshooting Guide

This guide provides solutions to common issues you may encounter while using or developing the MERN Agent Management System.

## Table of Contents

1. [Installation and Setup Issues](#installation-and-setup-issues)
2. [Database Connection Problems](#database-connection-problems)
3. [Authentication Issues](#authentication-issues)
4. [File Upload Problems](#file-upload-problems)
5. [API and Network Issues](#api-and-network-issues)
6. [Frontend Issues](#frontend-issues)
7. [Performance Problems](#performance-problems)
8. [Development Issues](#development-issues)
9. [Deployment Issues](#deployment-issues)
10. [Error Messages Reference](#error-messages-reference)

## Installation and Setup Issues

### Node.js Version Compatibility

**Problem**: Application fails to start with Node.js version errors

**Symptoms**:
- `Error: Unsupported Node.js version`
- Package installation failures
- Syntax errors in modern JavaScript

**Solutions**:
1. **Check Node.js Version**
   ```bash
   node --version
   npm --version
   ```

2. **Update Node.js**
   ```bash
   # Using nvm (recommended)
   nvm install 18
   nvm use 18
   
   # Or download from nodejs.org
   ```

3. **Clear npm Cache**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

### Dependency Installation Failures

**Problem**: npm install fails with permission or network errors

**Symptoms**:
- `EACCES: permission denied`
- `ENETUNREACH: network is unreachable`
- `gyp ERR! build error`

**Solutions**:
1. **Fix npm Permissions (macOS/Linux)**
   ```bash
   sudo chown -R $(whoami) ~/.npm
   sudo chown -R $(whoami) /usr/local/lib/node_modules
   ```

2. **Use Different Registry**
   ```bash
   npm install --registry https://registry.npmjs.org/
   ```

3. **Clear npm Cache and Retry**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Install with Different Flags**
   ```bash
   npm install --no-optional
   npm install --legacy-peer-deps
   ```

### Environment Variables Not Loading

**Problem**: Application can't read environment variables

**Symptoms**:
- `JWT_SECRET is not defined`
- Database connection failures
- Default values being used instead of configured ones

**Solutions**:
1. **Check File Location**
   ```bash
   # Ensure .env file is in server/ directory
   ls -la server/.env
   ```

2. **Verify File Format**
   ```bash
   # No spaces around = sign
   JWT_SECRET=your-secret-key
   # Not: JWT_SECRET = your-secret-key
   ```

3. **Check File Permissions**
   ```bash
   chmod 644 server/.env
   ```

4. **Restart Application**
   ```bash
   # Environment variables are loaded on startup
   npm run dev
   ```

## Database Connection Problems

### MongoDB Connection Refused

**Problem**: Cannot connect to MongoDB database

**Symptoms**:
- `MongoNetworkError: connect ECONNREFUSED`
- `Server selection timed out`
- Application hangs on startup

**Solutions**:
1. **Check MongoDB Status**
   ```bash
   # macOS
   brew services list | grep mongodb
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo systemctl status mongod
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

2. **Verify Connection String**
   ```bash
   # Test connection manually
   mongosh mongodb://localhost:27017/agent-management
   ```

3. **Check Port Availability**
   ```bash
   # Check if port 27017 is in use
   lsof -i :27017
   netstat -an | grep 27017
   ```

4. **Update Connection String**
   ```env
   # In server/.env
   MONGODB_URI=mongodb://127.0.0.1:27017/agent-management
   ```

### Database Authentication Errors

**Problem**: MongoDB authentication failures

**Symptoms**:
- `MongoServerError: Authentication failed`
- `not authorized on admin to execute command`

**Solutions**:
1. **Check Credentials**
   ```env
   MONGODB_URI=mongodb://username:password@localhost:27017/agent-management
   ```

2. **Create Database User**
   ```javascript
   // In MongoDB shell
   use agent-management
   db.createUser({
     user: "appuser",
     pwd: "password",
     roles: ["readWrite"]
   })
   ```

3. **Disable Authentication (Development)**
   ```bash
   # Edit MongoDB config file
   # Comment out security section
   ```

### Database Performance Issues

**Problem**: Slow database queries and operations

**Symptoms**:
- Long response times
- Timeout errors
- High CPU usage

**Solutions**:
1. **Add Database Indexes**
   ```javascript
   // In MongoDB shell
   db.users.createIndex({ email: 1 }, { unique: true })
   db.agents.createIndex({ email: 1 }, { unique: true })
   db.tasks.createIndex({ agentId: 1, distributionId: 1 })
   ```

2. **Monitor Query Performance**
   ```javascript
   // Enable profiling
   db.setProfilingLevel(2)
   db.system.profile.find().limit(5).sort({ ts: -1 })
   ```

3. **Optimize Connection Pool**
   ```javascript
   // In database config
   mongoose.connect(uri, {
     maxPoolSize: 10,
     serverSelectionTimeoutMS: 5000,
     socketTimeoutMS: 45000
   });
   ```

## Authentication Issues

### JWT Token Problems

**Problem**: Authentication fails with valid credentials

**Symptoms**:
- `JsonWebTokenError: invalid token`
- `TokenExpiredError: jwt expired`
- Automatic logout issues

**Solutions**:
1. **Check JWT Secret**
   ```bash
   # Ensure JWT_SECRET is set and consistent
   echo $JWT_SECRET
   ```

2. **Verify Token Format**
   ```javascript
   // Check token in browser localStorage
   localStorage.getItem('token')
   
   // Should start with 'eyJ'
   ```

3. **Clear Stored Tokens**
   ```javascript
   // In browser console
   localStorage.removeItem('token')
   sessionStorage.clear()
   ```

4. **Check Token Expiration**
   ```env
   # In server/.env
   JWT_EXPIRES_IN=24h
   ```

### Session Management Issues

**Problem**: Users get logged out unexpectedly

**Symptoms**:
- Frequent redirects to login page
- "Session expired" messages
- Inconsistent authentication state

**Solutions**:
1. **Check System Clock**
   ```bash
   # Ensure system time is correct
   date
   ntpdate -s time.nist.gov
   ```

2. **Increase Token Expiration**
   ```env
   JWT_EXPIRES_IN=7d  # 7 days instead of 24h
   ```

3. **Implement Token Refresh**
   ```javascript
   // Add token refresh logic
   const refreshToken = async () => {
     try {
       const response = await api.post('/auth/refresh');
       localStorage.setItem('token', response.data.token);
     } catch (error) {
       // Redirect to login
     }
   };
   ```

### Password Issues

**Problem**: Password authentication failures

**Symptoms**:
- "Invalid credentials" with correct password
- Password reset not working
- Bcrypt comparison errors

**Solutions**:
1. **Check Password Hashing**
   ```javascript
   // Ensure consistent bcrypt rounds
   const saltRounds = 10;
   const hashedPassword = await bcrypt.hash(password, saltRounds);
   ```

2. **Verify Password Comparison**
   ```javascript
   // Debug password comparison
   console.log('Plain password:', password);
   console.log('Hashed password:', user.password);
   const isValid = await bcrypt.compare(password, user.password);
   console.log('Password valid:', isValid);
   ```

3. **Reset Admin Password**
   ```javascript
   // In MongoDB shell
   use agent-management
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { password: "$2b$10$..." } }  // Pre-hashed password
   )
   ```

## File Upload Problems

### File Size Limit Exceeded

**Problem**: Large files fail to upload

**Symptoms**:
- `PayloadTooLargeError: request entity too large`
- Upload progress stops at 100%
- Network timeout errors

**Solutions**:
1. **Increase File Size Limit**
   ```env
   # In server/.env
   MAX_FILE_SIZE=10485760  # 10MB instead of 5MB
   ```

2. **Update Express Limits**
   ```javascript
   // In server.js
   app.use(express.json({ limit: '10mb' }));
   app.use(express.urlencoded({ extended: true, limit: '10mb' }));
   ```

3. **Configure Multer Limits**
   ```javascript
   // In upload middleware
   const upload = multer({
     limits: {
       fileSize: 10 * 1024 * 1024, // 10MB
       files: 1
     }
   });
   ```

### File Format Issues

**Problem**: Valid files are rejected as invalid format

**Symptoms**:
- "Invalid file format" for CSV/Excel files
- File parsing errors
- Empty file content

**Solutions**:
1. **Check File Extension**
   ```javascript
   // Verify allowed extensions
   const allowedExtensions = ['.csv', '.xlsx', '.xls'];
   const fileExtension = path.extname(file.originalname).toLowerCase();
   ```

2. **Validate File Content**
   ```javascript
   // Check file MIME type
   const allowedMimeTypes = [
     'text/csv',
     'application/vnd.ms-excel',
     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
   ];
   ```

3. **Test File Manually**
   ```bash
   # Check file format
   file your-file.csv
   head -5 your-file.csv
   ```

### CSV Parsing Errors

**Problem**: CSV files fail to parse correctly

**Symptoms**:
- "Missing required columns" error
- Incorrect data parsing
- Special character issues

**Solutions**:
1. **Check Column Headers**
   ```csv
   FirstName,Phone,Notes
   John,+1-555-0123,Test note
   ```

2. **Handle Different Encodings**
   ```javascript
   // In CSV parser
   const parser = csv({
     encoding: 'utf8',
     skipEmptyLines: true,
     trim: true
   });
   ```

3. **Debug CSV Content**
   ```javascript
   // Log first few rows
   console.log('CSV Headers:', headers);
   console.log('First row:', firstRow);
   ```

## API and Network Issues

### CORS Errors

**Problem**: Cross-origin requests blocked by browser

**Symptoms**:
- `Access to fetch blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header`
- API calls fail from frontend

**Solutions**:
1. **Configure CORS Properly**
   ```javascript
   // In server.js
   const corsOptions = {
     origin: ['http://localhost:3000', 'http://localhost:5173'],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
   };
   app.use(cors(corsOptions));
   ```

2. **Check Environment Variables**
   ```env
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
   ```

3. **Verify API Base URL**
   ```javascript
   // In frontend config
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
   ```

### Rate Limiting Issues

**Problem**: API requests blocked by rate limiting

**Symptoms**:
- `Too many requests` error
- 429 HTTP status code
- Temporary API blocks

**Solutions**:
1. **Check Rate Limit Headers**
   ```javascript
   // In browser network tab
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset: 1640995200
   ```

2. **Adjust Rate Limits**
   ```env
   # In server/.env
   API_RATE_LIMIT_MAX=200  # Increase from 100
   API_RATE_LIMIT_WINDOW=900000  # 15 minutes
   ```

3. **Implement Retry Logic**
   ```javascript
   const apiCall = async (url, options, retries = 3) => {
     try {
       return await fetch(url, options);
     } catch (error) {
       if (error.status === 429 && retries > 0) {
         await new Promise(resolve => setTimeout(resolve, 1000));
         return apiCall(url, options, retries - 1);
       }
       throw error;
     }
   };
   ```

### Network Timeout Issues

**Problem**: API requests timeout before completion

**Symptoms**:
- `Network request failed`
- `Request timeout`
- Incomplete data loading

**Solutions**:
1. **Increase Timeout Values**
   ```javascript
   // In API client
   const api = axios.create({
     timeout: 30000, // 30 seconds
     baseURL: API_BASE_URL
   });
   ```

2. **Check Network Connectivity**
   ```bash
   # Test API endpoint
   curl -I http://localhost:5000/api/health
   ping localhost
   ```

3. **Implement Loading States**
   ```javascript
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   
   const fetchData = async () => {
     setLoading(true);
     setError(null);
     try {
       const response = await api.get('/agents');
       setData(response.data);
     } catch (err) {
       setError(err.message);
     } finally {
       setLoading(false);
     }
   };
   ```

## Frontend Issues

### React Component Errors

**Problem**: Components fail to render or update

**Symptoms**:
- White screen of death
- Component not updating
- State management issues

**Solutions**:
1. **Check Browser Console**
   ```javascript
   // Look for JavaScript errors
   console.error messages
   ```

2. **Add Error Boundaries**
   ```jsx
   class ErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false };
     }
     
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }
     
     componentDidCatch(error, errorInfo) {
       console.error('Error caught by boundary:', error, errorInfo);
     }
     
     render() {
       if (this.state.hasError) {
         return <h1>Something went wrong.</h1>;
       }
       return this.props.children;
     }
   }
   ```

3. **Debug State Updates**
   ```jsx
   useEffect(() => {
     console.log('State updated:', state);
   }, [state]);
   ```

### Routing Issues

**Problem**: React Router navigation not working

**Symptoms**:
- 404 errors on page refresh
- Navigation not updating URL
- Protected routes not working

**Solutions**:
1. **Configure History Mode**
   ```jsx
   // In App.jsx
   import { BrowserRouter } from 'react-router-dom';
   
   function App() {
     return (
       <BrowserRouter>
         <Routes>
           <Route path="/" element={<Dashboard />} />
           <Route path="/agents" element={<AgentList />} />
         </Routes>
       </BrowserRouter>
     );
   }
   ```

2. **Add Fallback Route**
   ```jsx
   <Routes>
     <Route path="*" element={<NotFound />} />
   </Routes>
   ```

3. **Configure Development Server**
   ```javascript
   // In vite.config.js
   export default {
     server: {
       historyApiFallback: true
     }
   };
   ```

### Build and Bundle Issues

**Problem**: Frontend build fails or produces errors

**Symptoms**:
- Build process errors
- Missing dependencies
- Bundle size issues

**Solutions**:
1. **Clear Build Cache**
   ```bash
   rm -rf client/dist client/node_modules/.vite
   npm run client:build
   ```

2. **Check Import Statements**
   ```javascript
   // Use correct import paths
   import Component from './Component'; // Not '../Component'
   ```

3. **Analyze Bundle Size**
   ```bash
   npm run build -- --analyze
   ```

## Performance Problems

### Slow Page Loading

**Problem**: Application loads slowly

**Symptoms**:
- Long initial load times
- Slow navigation between pages
- High memory usage

**Solutions**:
1. **Implement Code Splitting**
   ```jsx
   import { lazy, Suspense } from 'react';
   
   const AgentList = lazy(() => import('./components/AgentList'));
   
   function App() {
     return (
       <Suspense fallback={<div>Loading...</div>}>
         <AgentList />
       </Suspense>
     );
   }
   ```

2. **Optimize Images and Assets**
   ```bash
   # Compress images
   # Use appropriate formats (WebP, AVIF)
   # Implement lazy loading
   ```

3. **Enable Gzip Compression**
   ```javascript
   // In server.js
   const compression = require('compression');
   app.use(compression());
   ```

### Database Query Performance

**Problem**: Slow database operations

**Symptoms**:
- Long API response times
- Database timeouts
- High server load

**Solutions**:
1. **Add Database Indexes**
   ```javascript
   // Create compound indexes
   db.tasks.createIndex({ agentId: 1, status: 1 });
   db.distributions.createIndex({ createdAt: -1, status: 1 });
   ```

2. **Optimize Queries**
   ```javascript
   // Use projection to limit fields
   const agents = await Agent.find({}, 'name email isActive');
   
   // Use pagination
   const agents = await Agent.find()
     .limit(10)
     .skip((page - 1) * 10)
     .sort({ createdAt: -1 });
   ```

3. **Implement Caching**
   ```javascript
   // Simple in-memory cache
   const cache = new Map();
   
   const getCachedAgents = async () => {
     if (cache.has('agents')) {
       return cache.get('agents');
     }
     
     const agents = await Agent.find();
     cache.set('agents', agents);
     setTimeout(() => cache.delete('agents'), 300000); // 5 minutes
     
     return agents;
   };
   ```

## Development Issues

### Hot Reload Not Working

**Problem**: Changes not reflected during development

**Symptoms**:
- Need to manually refresh browser
- Server doesn't restart on changes
- Build process not updating

**Solutions**:
1. **Check Nodemon Configuration**
   ```json
   // In package.json
   "scripts": {
     "dev": "nodemon server.js"
   }
   ```

2. **Verify File Watching**
   ```bash
   # Check if files are being watched
   lsof | grep node
   ```

3. **Clear Module Cache**
   ```bash
   # Restart development server
   npm run dev
   ```

### Testing Issues

**Problem**: Tests fail or don't run properly

**Symptoms**:
- Test suite errors
- Database connection issues in tests
- Mocking problems

**Solutions**:
1. **Setup Test Database**
   ```javascript
   // In test setup
   beforeAll(async () => {
     await mongoose.connect(process.env.MONGODB_TEST_URI);
   });
   
   afterAll(async () => {
     await mongoose.connection.close();
   });
   ```

2. **Mock External Dependencies**
   ```javascript
   // Mock API calls
   jest.mock('../services/api', () => ({
     get: jest.fn(),
     post: jest.fn()
   }));
   ```

3. **Clear Test Data**
   ```javascript
   beforeEach(async () => {
     await User.deleteMany({});
     await Agent.deleteMany({});
   });
   ```

## Deployment Issues

### Docker Container Problems

**Problem**: Docker containers fail to start or run

**Symptoms**:
- Container exits immediately
- Port binding errors
- Volume mounting issues

**Solutions**:
1. **Check Container Logs**
   ```bash
   docker-compose logs app
   docker logs container-name
   ```

2. **Verify Port Mapping**
   ```yaml
   # In docker-compose.yml
   services:
     app:
       ports:
         - "5000:5000"  # host:container
   ```

3. **Fix Volume Permissions**
   ```bash
   # Fix ownership
   sudo chown -R $USER:$USER ./uploads
   chmod 755 ./uploads
   ```

### PM2 Process Issues

**Problem**: PM2 processes crash or don't start

**Symptoms**:
- Process shows as "errored"
- Application not accessible
- Memory leaks

**Solutions**:
1. **Check PM2 Status**
   ```bash
   pm2 status
   pm2 logs
   pm2 monit
   ```

2. **Restart Processes**
   ```bash
   pm2 restart all
   pm2 reload ecosystem.config.js
   ```

3. **Fix Memory Issues**
   ```javascript
   // In ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'agent-management',
       script: './server.js',
       max_memory_restart: '1G',
       instances: 'max',
       exec_mode: 'cluster'
     }]
   };
   ```

### SSL Certificate Issues

**Problem**: HTTPS not working properly

**Symptoms**:
- Certificate warnings
- Mixed content errors
- SSL handshake failures

**Solutions**:
1. **Check Certificate Validity**
   ```bash
   openssl x509 -in certificate.crt -text -noout
   ```

2. **Update Nginx Configuration**
   ```nginx
   server {
     listen 443 ssl;
     ssl_certificate /path/to/certificate.crt;
     ssl_certificate_key /path/to/private.key;
   }
   ```

3. **Force HTTPS Redirect**
   ```javascript
   // In Express app
   app.use((req, res, next) => {
     if (req.header('x-forwarded-proto') !== 'https') {
       res.redirect(`https://${req.header('host')}${req.url}`);
     } else {
       next();
     }
   });
   ```

## Error Messages Reference

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `ECONNREFUSED` | Connection refused | Check if service is running |
| `EADDRINUSE` | Port already in use | Kill process or use different port |
| `ENOENT` | File or directory not found | Check file paths |
| `EACCES` | Permission denied | Fix file permissions |
| `ETIMEDOUT` | Operation timed out | Check network connectivity |

### HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate data |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

### Application-Specific Errors

| Error | Cause | Solution |
|-------|-------|---------|
| `JWT_SECRET is not defined` | Missing environment variable | Set JWT_SECRET in .env |
| `MongoNetworkError` | MongoDB connection issue | Start MongoDB service |
| `ValidationError` | Invalid data format | Check input validation |
| `CastError` | Invalid ObjectId | Verify ID format |
| `File too large` | Upload size exceeded | Reduce file size or increase limit |

## Getting Additional Help

### Log Analysis

1. **Enable Debug Logging**
   ```env
   NODE_ENV=development
   DEBUG=*
   ```

2. **Check Log Files**
   ```bash
   tail -f server/logs/production.log
   tail -f logs/pm2-error.log
   ```

3. **Monitor System Resources**
   ```bash
   htop
   df -h
   free -m
   ```

### Community Support

1. **Create Detailed Issue Report**
   - Include error messages
   - Provide steps to reproduce
   - Share relevant configuration
   - Include system information

2. **Search Existing Issues**
   - Check GitHub issues
   - Search Stack Overflow
   - Review documentation

3. **Contact Maintainers**
   - Use project communication channels
   - Provide complete context
   - Be patient and respectful

Remember to always backup your data before attempting fixes, especially in production environments.