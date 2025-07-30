# API Documentation

This document provides comprehensive documentation for all API endpoints in the MERN Agent Management System.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error details (optional)
    }
  }
}
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General API endpoints**: 100 requests per 15 minutes per IP
- **File upload endpoints**: 10 requests per 15 minutes per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## Endpoints

### Health Check

#### GET /api/health
Check server health and status.

**Access**: Public

**Response**:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2023-12-01T10:30:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

---

## Authentication Endpoints

### POST /api/auth/login
Authenticate user with email and password.

**Access**: Public  
**Rate Limit**: 5 requests per 15 minutes

**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Validation Rules**:
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "role": "admin"
    }
  },
  "message": "Login successful"
}
```

**Error Responses**:
- `400`: Invalid credentials
- `422`: Validation errors
- `429`: Too many requests

### GET /api/auth/profile
Get current user profile information.

**Access**: Private (JWT required)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "role": "admin",
      "createdAt": "2023-12-01T10:00:00.000Z"
    }
  }
}
```

### GET /api/auth/verify
Verify JWT token validity.

**Access**: Private (JWT required)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "admin@example.com",
      "role": "admin"
    }
  }
}
```

---

## Agent Management Endpoints

### POST /api/agents
Create a new agent.

**Access**: Private (Admin only)

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "mobile": {
    "countryCode": "+1",
    "number": "1234567890"
  },
  "password": "securepassword"
}
```

**Validation Rules**:
- `name`: Required, 2-50 characters
- `email`: Required, valid email format, unique
- `mobile.countryCode`: Required, valid country code format
- `mobile.number`: Required, 10-15 digits
- `password`: Required, minimum 6 characters

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "mobile": {
        "countryCode": "+1",
        "number": "1234567890"
      },
      "isActive": true,
      "createdAt": "2023-12-01T10:30:00.000Z"
    }
  },
  "message": "Agent created successfully"
}
```

### GET /api/agents
Get all agents with pagination and filtering.

**Access**: Private (Admin only)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order - asc/desc (default: asc)
- `isActive` (optional): Filter by active status - true/false

**Example Request**:
```
GET /api/agents?page=1&limit=10&sortBy=name&sortOrder=asc&isActive=true
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "mobile": {
          "countryCode": "+1",
          "number": "1234567890"
        },
        "isActive": true,
        "createdAt": "2023-12-01T10:30:00.000Z",
        "assignedTasksCount": 15
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### GET /api/agents/:id
Get agent by ID.

**Access**: Private (Admin only)

**URL Parameters**:
- `id`: Agent ID (MongoDB ObjectId)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "mobile": {
        "countryCode": "+1",
        "number": "1234567890"
      },
      "isActive": true,
      "createdAt": "2023-12-01T10:30:00.000Z",
      "updatedAt": "2023-12-01T10:30:00.000Z",
      "assignedTasksCount": 15,
      "completedTasksCount": 8
    }
  }
}
```

### PUT /api/agents/:id
Update agent by ID.

**Access**: Private (Admin only)

**URL Parameters**:
- `id`: Agent ID (MongoDB ObjectId)

**Request Body** (all fields optional):
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "mobile": {
    "countryCode": "+1",
    "number": "9876543210"
  },
  "isActive": false
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Smith",
      "email": "john.smith@example.com",
      "mobile": {
        "countryCode": "+1",
        "number": "9876543210"
      },
      "isActive": false,
      "updatedAt": "2023-12-01T11:00:00.000Z"
    }
  },
  "message": "Agent updated successfully"
}
```

### DELETE /api/agents/:id
Delete agent by ID (soft delete).

**Access**: Private (Admin only)

**URL Parameters**:
- `id`: Agent ID (MongoDB ObjectId)

**Success Response** (200):
```json
{
  "success": true,
  "message": "Agent deleted successfully"
}
```

### GET /api/agents/:id/tasks
Get tasks assigned to a specific agent.

**Access**: Private (Admin only)

**URL Parameters**:
- `id`: Agent ID (MongoDB ObjectId)

**Query Parameters**:
- `status` (optional): Filter by task status - assigned/completed

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "tasks": [
      {
        "id": "507f1f77bcf86cd799439013",
        "firstName": "Alice",
        "phone": "+1-555-0123",
        "notes": "Interested in premium package",
        "status": "assigned",
        "distributionId": "507f1f77bcf86cd799439014",
        "assignedAt": "2023-12-01T09:00:00.000Z"
      }
    ],
    "summary": {
      "totalTasks": 15,
      "assignedTasks": 7,
      "completedTasks": 8
    }
  }
}
```

---

## File Upload Endpoints

### POST /api/upload
Upload and process CSV/Excel file with automatic distribution.

**Access**: Private (JWT required)  
**Rate Limit**: 10 requests per 15 minutes

**Request**: Multipart form data
- `file`: CSV, XLSX, or XLS file (max 5MB)

**Required Columns**: FirstName, Phone, Notes

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "distribution": {
      "id": "507f1f77bcf86cd799439014",
      "filename": "contacts_20231201.csv",
      "originalName": "contacts.csv",
      "totalItems": 100,
      "status": "completed",
      "createdAt": "2023-12-01T12:00:00.000Z"
    },
    "summary": {
      "totalItems": 100,
      "agentsCount": 5,
      "itemsPerAgent": 20,
      "remainderItems": 0,
      "agentDistribution": [
        {
          "agentId": "507f1f77bcf86cd799439012",
          "agentName": "John Doe",
          "assignedCount": 20
        }
      ]
    }
  },
  "message": "File uploaded and distributed successfully"
}
```

**Error Responses**:
- `400`: Invalid file format or structure
- `413`: File too large
- `422`: Missing required columns

### POST /api/upload/validate
Validate file structure and show preview without processing.

**Access**: Private (JWT required)  
**Rate Limit**: 10 requests per 15 minutes

**Request**: Multipart form data
- `file`: CSV, XLSX, or XLS file (max 5MB)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "filename": "contacts.csv",
    "totalRows": 100,
    "columns": ["FirstName", "Phone", "Notes", "Email"],
    "requiredColumns": ["FirstName", "Phone", "Notes"],
    "missingColumns": [],
    "preview": [
      {
        "FirstName": "Alice",
        "Phone": "+1-555-0123",
        "Notes": "Interested in premium package",
        "Email": "alice@example.com"
      }
    ]
  },
  "message": "File validation successful"
}
```

---

## Distribution Endpoints

### GET /api/distributions
Get all distributions with pagination.

**Access**: Private (JWT required)

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order - asc/desc (default: desc)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "distributions": [
      {
        "id": "507f1f77bcf86cd799439014",
        "filename": "contacts_20231201.csv",
        "originalName": "contacts.csv",
        "totalItems": 100,
        "status": "completed",
        "createdAt": "2023-12-01T12:00:00.000Z",
        "uploadedBy": {
          "id": "507f1f77bcf86cd799439011",
          "email": "admin@example.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 10
    }
  }
}
```

### GET /api/distributions/:id
Get distribution details with agent assignments.

**Access**: Private (JWT required)

**URL Parameters**:
- `id`: Distribution ID (MongoDB ObjectId)

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "distribution": {
      "id": "507f1f77bcf86cd799439014",
      "filename": "contacts_20231201.csv",
      "originalName": "contacts.csv",
      "totalItems": 100,
      "status": "completed",
      "createdAt": "2023-12-01T12:00:00.000Z",
      "uploadedBy": {
        "id": "507f1f77bcf86cd799439011",
        "email": "admin@example.com"
      }
    },
    "agentAssignments": [
      {
        "agent": {
          "id": "507f1f77bcf86cd799439012",
          "name": "John Doe",
          "email": "john.doe@example.com"
        },
        "assignedCount": 20,
        "completedCount": 15,
        "tasks": [
          {
            "id": "507f1f77bcf86cd799439013",
            "firstName": "Alice",
            "phone": "+1-555-0123",
            "notes": "Interested in premium package",
            "status": "completed",
            "assignedAt": "2023-12-01T12:00:00.000Z",
            "completedAt": "2023-12-01T14:30:00.000Z"
          }
        ]
      }
    ],
    "summary": {
      "totalTasks": 100,
      "assignedTasks": 85,
      "completedTasks": 60,
      "agentsCount": 5
    }
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Invalid or missing authentication |
| `AUTHORIZATION_ERROR` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ERROR` | Resource already exists |
| `FILE_ERROR` | File upload or processing error |
| `DATABASE_ERROR` | Database operation failed |
| `RATE_LIMIT_ERROR` | Rate limit exceeded |
| `SERVER_ERROR` | Internal server error |

## HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `413`: Payload Too Large
- `422`: Unprocessable Entity
- `429`: Too Many Requests
- `500`: Internal Server Error

## Examples

### Complete Authentication Flow

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'securepassword'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// 2. Use token for authenticated requests
const agentsResponse = await fetch('/api/agents', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### File Upload Example

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### Error Handling Example

```javascript
try {
  const response = await fetch('/api/agents', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error.message);
  }

  const data = await response.json();
  // Handle success
} catch (error) {
  console.error('API Error:', error.message);
  // Handle error
}
```

## Postman Collection

A Postman collection with all endpoints and example requests is available in the project repository at `docs/postman/MERN-Agent-Management.postman_collection.json`.

## SDK and Client Libraries

Currently, the API is consumed directly via HTTP requests. Future versions may include:
- JavaScript/Node.js SDK
- Python client library
- React hooks library

For questions or issues with the API, please refer to the troubleshooting section in the main README or create an issue in the project repository.