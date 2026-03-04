# Design Document: Supabase to MySQL + Express Migration

## Overview

This document outlines the technical design for migrating the BISCAS NAGA Learning Module application from Supabase (PostgreSQL + Auth + Storage) to a self-hosted solution using MySQL, Express.js, and custom authentication. The migration will be executed in phases to minimize risk and ensure zero data loss.

### Goals
- Migrate from PostgreSQL to MySQL without data loss
- Replace Supabase Auth with custom JWT authentication
- Replace Next.js API routes with Express.js backend
- Replace Supabase Storage with local/cloud file storage
- Maintain all existing functionality
- Improve system reliability and control

### Non-Goals
- Changing frontend framework (Next.js stays)
- Modifying UI/UX
- Adding new features during migration
- Changing business logic

## Architecture

### Current Architecture (Supabase)
```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────┐
│  Next.js API    │  │   Supabase   │
│    Routes       │  │              │
└────────┬────────┘  │  - Auth      │
         │           │  - PostgreSQL│
         └──────────►│  - Storage   │
                     └──────────────┘
```

### Target Architecture (MySQL + Express)
```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Express.js API │
│    Server       │
├─────────────────┤
│  - Auth (JWT)   │
│  - Middleware   │
│  - Routes       │
│  - Controllers  │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────┐    ┌──────────────┐   ┌─────────────┐
│    MySQL    │    │ File Storage │   │   Redis     │
│  Database   │    │ (Local/S3)   │   │  (Sessions) │
└─────────────┘    └──────────────┘   └─────────────┘
```


## Components and Interfaces

### 1. Express.js API Server

**Structure:**
```
server/
├── src/
│   ├── config/
│   │   ├── database.js       # MySQL connection config
│   │   ├── auth.js           # JWT config
│   │   └── storage.js        # File storage config
│   ├── middleware/
│   │   ├── auth.js           # JWT verification
│   │   ├── validation.js     # Request validation
│   │   ├── errorHandler.js   # Error handling
│   │   └── rateLimiter.js    # Rate limiting
│   ├── routes/
│   │   ├── auth.routes.js    # Login, register, logout
│   │   ├── students.routes.js
│   │   ├── modules.routes.js
│   │   ├── classes.routes.js
│   │   └── files.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── students.controller.js
│   │   ├── modules.controller.js
│   │   └── files.controller.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Student.js
│   │   ├── Module.js
│   │   └── Class.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   └── storage.service.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── helpers.js
│   └── app.js              # Express app setup
├── tests/
├── package.json
└── .env
```

**Key Dependencies:**
- express: Web framework
- mysql2: MySQL client
- jsonwebtoken: JWT authentication
- bcrypt: Password hashing
- multer: File uploads
- joi: Request validation
- winston: Logging
- helmet: Security headers
- cors: CORS handling
- express-rate-limit: Rate limiting

### 2. MySQL Database Schema

**Schema Conversion Strategy:**

PostgreSQL → MySQL conversions:
- `UUID` → `CHAR(36)` or `BINARY(16)`
- `JSONB` → `JSON`
- `TIMESTAMP WITH TIME ZONE` → `DATETIME` (store UTC)
- `ENUM` → `VARCHAR` with CHECK constraint or lookup table
- `ARRAY` → `JSON` array or separate junction table
- `SERIAL` → `INT AUTO_INCREMENT`

**Core Tables:**

```sql
-- Users table (replaces Supabase auth.users)
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login DATETIME,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profiles table
CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(255),
  grade_level VARCHAR(50),
  learning_style ENUM('visual', 'auditory', 'reading_writing', 'kinesthetic'),
  preferred_modules JSON,
  learning_type VARCHAR(50),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_learning_style (learning_style)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password reset tokens
CREATE TABLE password_reset_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```


### 3. Authentication System

**JWT Token Strategy:**

```javascript
// Access Token (short-lived, 15 minutes)
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "student",
  "exp": 1234567890,
  "iat": 1234567890
}

// Refresh Token (long-lived, 7 days)
{
  "userId": "uuid",
  "tokenId": "unique-token-id",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**Authentication Flow:**

```
1. Login:
   POST /api/auth/login
   Body: { email, password }
   Response: { accessToken, refreshToken, user }

2. Token Refresh:
   POST /api/auth/refresh
   Body: { refreshToken }
   Response: { accessToken, refreshToken }

3. Logout:
   POST /api/auth/logout
   Headers: Authorization: Bearer <accessToken>
   Body: { refreshToken }
   Response: { success: true }

4. Password Reset Request:
   POST /api/auth/forgot-password
   Body: { email }
   Response: { message: "Reset email sent" }

5. Password Reset:
   POST /api/auth/reset-password
   Body: { token, newPassword }
   Response: { success: true }
```

**Middleware:**

```javascript
// auth.middleware.js
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

### 4. File Storage System

**Storage Options:**

**Development:** Local file system
```
uploads/
├── modules/
│   ├── images/
│   └── content/
├── profiles/
└── temp/
```

**Production:** AWS S3 or compatible service
```javascript
// storage.service.js
class StorageService {
  async uploadFile(file, path) {
    if (process.env.NODE_ENV === 'production') {
      return this.uploadToS3(file, path);
    }
    return this.uploadToLocal(file, path);
  }
  
  async getFileUrl(path) {
    if (process.env.NODE_ENV === 'production') {
      return this.getS3Url(path);
    }
    return this.getLocalUrl(path);
  }
}
```

**File Upload Endpoint:**
```javascript
// files.routes.js
router.post('/upload', 
  verifyToken,
  upload.single('file'),
  validateFile,
  filesController.uploadFile
);
```

### 5. API Endpoints

**Authentication Endpoints:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/me
```

**Student Endpoints:**
```
GET    /api/students
GET    /api/students/:id
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id
POST   /api/students/bulk-import
```

**Module Endpoints:**
```
GET    /api/modules
GET    /api/modules/:id
POST   /api/modules
PUT    /api/modules/:id
DELETE /api/modules/:id
POST   /api/modules/import
GET    /api/modules/:id/sections
POST   /api/modules/:id/sections
```

**File Endpoints:**
```
POST   /api/files/upload
GET    /api/files/:id
DELETE /api/files/:id
```

**Progress Endpoints:**
```
GET    /api/progress/student/:studentId
GET    /api/progress/module/:moduleId
POST   /api/progress
PUT    /api/progress/:id
```


## Data Models

### User Model
```javascript
class User {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.role = data.role;
    this.emailVerified = data.email_verified || false;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.lastLogin = data.last_login;
  }

  static async findByEmail(email) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] ? new User(rows[0]) : null;
  }

  static async create(userData) {
    const user = new User(userData);
    await db.query(
      'INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [user.id, user.email, user.passwordHash, user.role]
    );
    return user;
  }

  async verifyPassword(password) {
    return bcrypt.compare(password, this.passwordHash);
  }
}
```

### Profile Model
```javascript
class Profile {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.userId = data.user_id;
    this.firstName = data.first_name;
    this.middleName = data.middle_name;
    this.lastName = data.last_name;
    this.fullName = data.full_name;
    this.gradeLevel = data.grade_level;
    this.learningStyle = data.learning_style;
    this.preferredModules = data.preferred_modules;
    this.learningType = data.learning_type;
    this.onboardingCompleted = data.onboarding_completed;
  }

  static async findByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    );
    return rows[0] ? new Profile(rows[0]) : null;
  }

  static async create(profileData) {
    const profile = new Profile(profileData);
    await db.query(
      `INSERT INTO profiles 
       (id, user_id, first_name, middle_name, last_name, full_name, 
        grade_level, learning_style, preferred_modules, learning_type, 
        onboarding_completed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profile.id, profile.userId, profile.firstName, profile.middleName,
       profile.lastName, profile.fullName, profile.gradeLevel, 
       profile.learningStyle, JSON.stringify(profile.preferredModules),
       profile.learningType, profile.onboardingCompleted]
    );
    return profile;
  }
}
```

## Database Migration Strategy

### Phase 1: Schema Migration

**Step 1: Export PostgreSQL Schema**
```bash
pg_dump -h <host> -U <user> -d <database> --schema-only > schema.sql
```

**Step 2: Convert to MySQL**
```sql
-- Conversion script (automated tool or manual)
-- Convert data types
-- Convert sequences to AUTO_INCREMENT
-- Convert ENUM types
-- Convert JSONB to JSON
-- Adjust constraints
```

**Step 3: Create MySQL Schema**
```bash
mysql -h <host> -u <user> -p <database> < mysql_schema.sql
```

### Phase 2: Data Migration

**Export Strategy:**
```javascript
// export-data.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function exportTable(tableName) {
  let allData = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) throw error;
    if (data.length === 0) break;
    
    allData = allData.concat(data);
    page++;
  }
  
  fs.writeFileSync(
    `exports/${tableName}.json`,
    JSON.stringify(allData, null, 2)
  );
  
  console.log(`Exported ${allData.length} rows from ${tableName}`);
}

// Export all tables
const tables = ['users', 'profiles', 'vark_modules', 'classes', ...];
for (const table of tables) {
  await exportTable(table);
}
```

**Import Strategy:**
```javascript
// import-data.js
const mysql = require('mysql2/promise');
const fs = require('fs');

async function importTable(tableName, connection) {
  const data = JSON.parse(fs.readFileSync(`exports/${tableName}.json`));
  
  for (const row of data) {
    // Convert UUIDs
    if (row.id) row.id = row.id.replace(/-/g, '');
    
    // Convert timestamps
    if (row.created_at) row.created_at = new Date(row.created_at);
    
    // Convert JSON fields
    if (row.preferred_modules) {
      row.preferred_modules = JSON.stringify(row.preferred_modules);
    }
    
    // Insert row
    const columns = Object.keys(row).join(', ');
    const placeholders = Object.keys(row).map(() => '?').join(', ');
    const values = Object.values(row);
    
    await connection.query(
      `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
      values
    );
  }
  
  console.log(`Imported ${data.length} rows into ${tableName}`);
}
```

### Phase 3: User Migration

**Migrate Supabase Auth Users:**
```javascript
// migrate-auth.js
async function migrateAuthUsers() {
  // Export users from Supabase Auth
  const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
  
  for (const authUser of authUsers) {
    // Create user in MySQL
    const userId = authUser.id;
    const email = authUser.email;
    
    // Generate temporary password or send reset email
    const tempPassword = generateSecurePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    await db.query(
      'INSERT INTO users (id, email, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?)',
      [userId, email, passwordHash, authUser.user_metadata.role, authUser.email_confirmed_at !== null]
    );
    
    // Send password reset email
    await sendPasswordResetEmail(email);
  }
}
```


## Error Handling

### Error Response Format
```javascript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}, // Optional additional details
    "timestamp": "2025-01-14T10:30:00Z"
  }
}
```

### Error Codes
```javascript
const ErrorCodes = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_TOKEN_EXPIRED: 'Token has expired',
  AUTH_TOKEN_INVALID: 'Invalid token',
  AUTH_UNAUTHORIZED: 'Unauthorized access',
  AUTH_FORBIDDEN: 'Insufficient permissions',
  
  // Validation
  VALIDATION_ERROR: 'Validation failed',
  VALIDATION_REQUIRED_FIELD: 'Required field missing',
  VALIDATION_INVALID_FORMAT: 'Invalid format',
  
  // Database
  DB_CONNECTION_ERROR: 'Database connection failed',
  DB_QUERY_ERROR: 'Database query failed',
  DB_DUPLICATE_ENTRY: 'Duplicate entry',
  DB_NOT_FOUND: 'Resource not found',
  
  // File Storage
  STORAGE_UPLOAD_FAILED: 'File upload failed',
  STORAGE_FILE_NOT_FOUND: 'File not found',
  STORAGE_INVALID_FILE_TYPE: 'Invalid file type',
  STORAGE_FILE_TOO_LARGE: 'File too large',
  
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  BAD_REQUEST: 'Bad request',
  NOT_FOUND: 'Not found'
};
```

### Error Handler Middleware
```javascript
// errorHandler.js
const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.userId
  });
  
  // Determine status code
  const statusCode = err.statusCode || 500;
  
  // Send error response
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: err.details || {},
      timestamp: new Date().toISOString()
    }
  });
};
```

## Testing Strategy

### Unit Tests
```javascript
// Example: auth.service.test.js
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password123');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });
    
    it('should throw error for invalid credentials', async () => {
      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
  
  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const token = jwt.sign({ userId: '123' }, JWT_SECRET);
      const decoded = await authService.verifyToken(token);
      expect(decoded.userId).toBe('123');
    });
    
    it('should reject expired token', async () => {
      const token = jwt.sign({ userId: '123' }, JWT_SECRET, { expiresIn: '0s' });
      await expect(
        authService.verifyToken(token)
      ).rejects.toThrow('Token expired');
    });
  });
});
```

### Integration Tests
```javascript
// Example: students.integration.test.js
describe('Students API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Login and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'password' });
    authToken = response.body.accessToken;
  });
  
  describe('POST /api/students', () => {
    it('should create a new student', async () => {
      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'student@test.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          gradeLevel: 'Grade 7'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('student@test.com');
    });
    
    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/students')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'student@test.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Doe'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('DB_DUPLICATE_ENTRY');
    });
  });
});
```

### End-to-End Tests
```javascript
// Example: student-workflow.e2e.test.js
describe('Student Workflow E2E', () => {
  it('should complete full student lifecycle', async () => {
    // 1. Teacher logs in
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@test.com', password: 'password' });
    const token = loginResponse.body.accessToken;
    
    // 2. Teacher creates student
    const createResponse = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        email: 'newstudent@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Student'
      });
    const studentId = createResponse.body.id;
    
    // 3. Student logs in
    const studentLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'newstudent@test.com', password: 'password123' });
    const studentToken = studentLoginResponse.body.accessToken;
    
    // 4. Student views modules
    const modulesResponse = await request(app)
      .get('/api/modules')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(modulesResponse.status).toBe(200);
    
    // 5. Teacher deletes student
    const deleteResponse = await request(app)
      .delete(`/api/students/${studentId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(200);
  });
});
```


## Deployment Strategy

### Phase 1: Parallel Running (Week 1-2)
```
┌─────────────┐
│  Next.js    │
└──────┬──────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ Next.js  │   │ Express  │   │ Supabase │
│   API    │   │   API    │   │          │
│ (Active) │   │ (Testing)│   │ (Active) │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┴──────────────┘
                    │
              ┌─────┴─────┐
              │           │
              ▼           ▼
         ┌────────┐  ┌────────┐
         │ MySQL  │  │Supabase│
         │(Synced)│  │  (DB)  │
         └────────┘  └────────┘
```

**Actions:**
- Deploy Express API to staging
- Set up MySQL database
- Implement data sync from Supabase to MySQL
- Run parallel testing
- Monitor for discrepancies

### Phase 2: Feature Flag Rollout (Week 3-4)
```javascript
// Feature flag in frontend
const USE_NEW_API = process.env.NEXT_PUBLIC_USE_NEW_API === 'true';

const apiClient = USE_NEW_API ? newApiClient : oldApiClient;
```

**Actions:**
- Enable new API for internal testing (10% traffic)
- Monitor errors and performance
- Gradually increase to 25%, 50%, 75%
- Keep Supabase as fallback

### Phase 3: Full Migration (Week 5-6)
```
┌─────────────┐
│  Next.js    │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│  Express API │
│   (Active)   │
└──────┬───────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
  ┌────────┐    ┌──────────┐   ┌────────┐
  │ MySQL  │    │  Storage │   │ Redis  │
  │(Active)│    │ (Active) │   │(Active)│
  └────────┘    └──────────┘   └────────┘
```

**Actions:**
- Switch 100% traffic to new API
- Keep Supabase read-only for 2 weeks
- Monitor system stability
- Decommission Supabase after stability confirmed

### Rollback Plan

**Immediate Rollback (< 5 minutes):**
```bash
# Switch feature flag
export NEXT_PUBLIC_USE_NEW_API=false
# Restart Next.js
pm2 restart nextjs
```

**Data Rollback (if needed):**
```bash
# 1. Stop Express API
pm2 stop express-api

# 2. Restore Supabase as primary
export NEXT_PUBLIC_USE_NEW_API=false

# 3. Sync any new data from MySQL to Supabase
node scripts/sync-mysql-to-supabase.js

# 4. Restart Next.js
pm2 restart nextjs
```

## Monitoring and Observability

### Metrics to Track
```javascript
// Key metrics
const metrics = {
  // Performance
  apiResponseTime: 'avg, p50, p95, p99',
  databaseQueryTime: 'avg, p50, p95, p99',
  errorRate: 'errors per minute',
  
  // Business
  activeUsers: 'concurrent users',
  requestsPerMinute: 'total requests',
  authSuccessRate: 'successful logins / total attempts',
  
  // Infrastructure
  cpuUsage: 'percentage',
  memoryUsage: 'percentage',
  diskUsage: 'percentage',
  databaseConnections: 'active connections'
};
```

### Logging Strategy
```javascript
// winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Log structure
logger.info('API request', {
  method: req.method,
  url: req.url,
  userId: req.user?.userId,
  duration: responseTime,
  statusCode: res.statusCode
});
```

### Health Checks
```javascript
// health.routes.js
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      storage: await checkStorage(),
      redis: await checkRedis()
    }
  };
  
  const allHealthy = Object.values(health.checks).every(c => c.status === 'ok');
  res.status(allHealthy ? 200 : 503).json(health);
});

async function checkDatabase() {
  try {
    await db.query('SELECT 1');
    return { status: 'ok', message: 'Database connected' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

## Security Considerations

### 1. Password Security
- Use bcrypt with salt rounds >= 10
- Enforce password complexity requirements
- Implement password reset with time-limited tokens
- Never log passwords

### 2. JWT Security
- Use strong secret keys (256-bit minimum)
- Short-lived access tokens (15 minutes)
- Refresh tokens stored in database for revocation
- Implement token blacklist for logout

### 3. API Security
- Rate limiting (100 requests per 15 minutes per IP)
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize inputs)
- CSRF protection for state-changing operations
- HTTPS only in production

### 4. Database Security
- Principle of least privilege for database users
- Encrypted connections (SSL/TLS)
- Regular backups
- Audit logging for sensitive operations

### 5. File Upload Security
- Validate file types (whitelist)
- Limit file sizes
- Scan for malware
- Store files outside web root
- Generate unique filenames


## Environment Configuration

### Development Environment
```env
# .env.development
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=biscas_dev
DB_USER=dev_user
DB_PASSWORD=dev_password
DB_CONNECTION_LIMIT=10

# JWT
JWT_SECRET=your-dev-secret-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads

# Email (for password reset)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-user
EMAIL_PASSWORD=your-mailtrap-password
EMAIL_FROM=noreply@biscas.edu

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### Production Environment
```env
# .env.production
NODE_ENV=production
PORT=3001

# Database
DB_HOST=your-mysql-host
DB_PORT=3306
DB_NAME=biscas_prod
DB_USER=prod_user
DB_PASSWORD=strong-production-password
DB_CONNECTION_LIMIT=50
DB_SSL=true

# JWT
JWT_SECRET=your-very-strong-production-secret-key-256-bits
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Storage
STORAGE_TYPE=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=biscas-files

# Redis (for sessions/caching)
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=noreply@biscas.edu

# Frontend URL
FRONTEND_URL=https://biscas.edu

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Performance Optimization

### 1. Database Optimization

**Connection Pooling:**
```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
  queueLimit: 0,
  waitForConnections: true
});
```

**Query Optimization:**
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_modules_created_by ON vark_modules(created_by);
CREATE INDEX idx_progress_student_module ON vark_module_progress(student_id, module_id);

-- Use EXPLAIN to analyze queries
EXPLAIN SELECT * FROM profiles WHERE user_id = 'xxx';
```

**Caching Strategy:**
```javascript
// Redis caching for frequently accessed data
const cache = {
  async get(key) {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  },
  
  async set(key, value, ttl = 3600) {
    await redis.setex(key, ttl, JSON.stringify(value));
  },
  
  async del(key) {
    await redis.del(key);
  }
};

// Example usage
async function getUser(userId) {
  const cacheKey = `user:${userId}`;
  
  // Try cache first
  let user = await cache.get(cacheKey);
  if (user) return user;
  
  // Query database
  user = await User.findById(userId);
  
  // Cache result
  await cache.set(cacheKey, user, 3600); // 1 hour
  
  return user;
}
```

### 2. API Optimization

**Response Compression:**
```javascript
const compression = require('compression');
app.use(compression());
```

**Pagination:**
```javascript
router.get('/students', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  
  const [students] = await db.query(
    'SELECT * FROM profiles WHERE role = ? LIMIT ? OFFSET ?',
    ['student', limit, offset]
  );
  
  const [countResult] = await db.query(
    'SELECT COUNT(*) as total FROM profiles WHERE role = ?',
    ['student']
  );
  
  res.json({
    data: students,
    pagination: {
      page,
      limit,
      total: countResult[0].total,
      totalPages: Math.ceil(countResult[0].total / limit)
    }
  });
});
```

**Field Selection:**
```javascript
// Allow clients to specify which fields they need
router.get('/students/:id', async (req, res) => {
  const fields = req.query.fields || '*';
  const [students] = await db.query(
    `SELECT ${fields} FROM profiles WHERE id = ?`,
    [req.params.id]
  );
  res.json(students[0]);
});
```

## Migration Checklist

### Pre-Migration
- [ ] Backup all Supabase data
- [ ] Set up MySQL database
- [ ] Set up Express.js server
- [ ] Implement authentication system
- [ ] Implement all API endpoints
- [ ] Set up file storage
- [ ] Write migration scripts
- [ ] Write tests (unit, integration, e2e)
- [ ] Set up monitoring and logging
- [ ] Document API endpoints
- [ ] Create rollback plan

### Migration Day
- [ ] Announce maintenance window
- [ ] Put application in read-only mode
- [ ] Export all data from Supabase
- [ ] Import data to MySQL
- [ ] Verify data integrity
- [ ] Migrate user accounts
- [ ] Migrate files to new storage
- [ ] Run smoke tests
- [ ] Switch to new API (feature flag)
- [ ] Monitor for errors
- [ ] Announce migration complete

### Post-Migration
- [ ] Monitor system for 48 hours
- [ ] Fix any issues that arise
- [ ] Gradually increase traffic to new API
- [ ] Keep Supabase as backup for 2 weeks
- [ ] Decommission Supabase
- [ ] Update documentation
- [ ] Conduct post-mortem
- [ ] Celebrate! 🎉

## Risk Mitigation

### Risk 1: Data Loss
**Mitigation:**
- Multiple backups before migration
- Verify data integrity after import
- Keep Supabase running for 2 weeks
- Implement data sync during transition

### Risk 2: Authentication Issues
**Mitigation:**
- Test authentication thoroughly
- Implement password reset for all users
- Keep admin backdoor access
- Have rollback plan ready

### Risk 3: Performance Degradation
**Mitigation:**
- Load testing before migration
- Monitor performance metrics
- Optimize slow queries
- Scale infrastructure as needed

### Risk 4: File Access Issues
**Mitigation:**
- Test file upload/download thoroughly
- Migrate files in batches
- Keep Supabase Storage as backup
- Implement URL rewriting if needed

### Risk 5: Downtime
**Mitigation:**
- Phased rollout with feature flags
- Parallel running of old and new systems
- Quick rollback capability
- Maintenance window during low traffic

## Success Metrics

### Technical Metrics
- API response time < 200ms (p95)
- Database query time < 50ms (p95)
- Error rate < 0.1%
- Uptime > 99.9%
- Zero data loss

### Business Metrics
- User satisfaction maintained
- No increase in support tickets
- All features working as before
- Improved system reliability
- Reduced infrastructure costs

## Conclusion

This migration from Supabase to MySQL + Express is a significant undertaking that will provide greater control, flexibility, and reliability. By following this design document and executing the migration in careful phases, we can ensure a smooth transition with minimal risk and zero data loss.

The key to success is thorough testing, careful monitoring, and having a solid rollback plan. With proper execution, this migration will set up the application for long-term success and scalability.
