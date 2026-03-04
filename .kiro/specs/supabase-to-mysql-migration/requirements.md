# Requirements Document: Supabase to MySQL + Express Migration

## Introduction

This document outlines the requirements for migrating the BISCAS NAGA Learning Module application from Supabase (PostgreSQL + Auth) to MySQL with Express.js backend. The migration must maintain all existing functionality while improving reliability and control over the infrastructure.

## Glossary

- **Supabase**: Current backend platform providing PostgreSQL database and authentication
- **MySQL**: Target relational database management system
- **Express**: Node.js web application framework for building the API server
- **Next.js API Routes**: Current API implementation (to be replaced)
- **JWT**: JSON Web Tokens for authentication
- **RLS**: Row Level Security (Supabase feature, to be replaced with application-level security)
- **Storage Bucket**: File storage system (currently Supabase Storage)
- **Migration**: Process of moving from one system to another without data loss

## Requirements

### Requirement 1: Database Schema Migration

**User Story:** As a developer, I want to migrate all database tables from PostgreSQL to MySQL, so that the application can run on MySQL infrastructure.

#### Acceptance Criteria

1. THE System SHALL convert all PostgreSQL tables to MySQL-compatible schema
2. THE System SHALL preserve all data types with MySQL equivalents (UUID → CHAR(36), JSONB → JSON, TIMESTAMP WITH TIME ZONE → DATETIME)
3. THE System SHALL maintain all foreign key relationships and constraints
4. THE System SHALL create indexes matching the current PostgreSQL indexes
5. THE System SHALL handle PostgreSQL-specific features (ENUM types, array types) with MySQL alternatives
6. WHEN migrating ENUM types, THE System SHALL convert to VARCHAR with CHECK constraints or separate lookup tables
7. WHEN migrating JSONB columns, THE System SHALL convert to JSON type in MySQL
8. THE System SHALL provide a rollback mechanism in case of migration failure

### Requirement 2: Data Export and Import

**User Story:** As a developer, I want to export all existing data from Supabase and import it into MySQL, so that no data is lost during migration.

#### Acceptance Criteria

1. THE System SHALL export all data from Supabase PostgreSQL in a format compatible with MySQL
2. THE System SHALL handle special characters and encoding during export/import
3. THE System SHALL preserve all relationships and foreign key integrity
4. THE System SHALL validate data integrity after import (row counts, checksums)
5. WHEN exporting UUIDs, THE System SHALL convert them to MySQL-compatible format
6. WHEN exporting timestamps, THE System SHALL preserve timezone information
7. THE System SHALL provide progress reporting during export/import
8. THE System SHALL handle large datasets without memory issues

### Requirement 3: Authentication System Replacement

**User Story:** As a developer, I want to replace Supabase Auth with a custom JWT-based authentication system, so that user authentication works independently of Supabase.

#### Acceptance Criteria

1. THE System SHALL implement JWT-based authentication with access and refresh tokens
2. THE System SHALL migrate all existing user accounts from Supabase Auth to the new system
3. THE System SHALL preserve user passwords (hashed) or require password reset
4. THE System SHALL implement login, logout, and token refresh endpoints
5. THE System SHALL implement password reset functionality via email
6. THE System SHALL implement role-based access control (student, teacher, admin)
7. WHEN a user logs in, THE System SHALL return JWT tokens with user information
8. WHEN a token expires, THE System SHALL allow refresh using refresh token
9. THE System SHALL implement session management and token blacklisting for logout
10. THE System SHALL maintain backward compatibility with existing frontend auth hooks

### Requirement 4: Express.js API Server Setup

**User Story:** As a developer, I want to create an Express.js server to replace Next.js API routes, so that the backend is independent and scalable.

#### Acceptance Criteria

1. THE System SHALL create an Express.js server with proper project structure
2. THE System SHALL implement all existing API endpoints from Next.js API routes
3. THE System SHALL use environment variables for configuration
4. THE System SHALL implement proper error handling and logging
5. THE System SHALL implement request validation using middleware
6. THE System SHALL implement CORS configuration for Next.js frontend
7. THE System SHALL implement rate limiting to prevent abuse
8. THE System SHALL implement API documentation (Swagger/OpenAPI)
9. WHEN the server starts, THE System SHALL connect to MySQL database
10. WHEN an API error occurs, THE System SHALL return consistent error responses

### Requirement 5: File Storage Migration

**User Story:** As a developer, I want to migrate from Supabase Storage to a local or cloud file storage solution, so that file uploads work independently of Supabase.

#### Acceptance Criteria

1. THE System SHALL implement file upload/download functionality
2. THE System SHALL support local file storage for development
3. THE System SHALL support cloud storage (AWS S3, Google Cloud Storage, or similar) for production
4. THE System SHALL migrate all existing files from Supabase Storage
5. THE System SHALL preserve file URLs or implement URL rewriting
6. THE System SHALL implement file access control based on user roles
7. WHEN a file is uploaded, THE System SHALL validate file type and size
8. WHEN a file is requested, THE System SHALL check user permissions
9. THE System SHALL implement file deletion and cleanup

### Requirement 6: Database Connection Layer

**User Story:** As a developer, I want to implement a robust MySQL connection layer, so that database operations are reliable and efficient.

#### Acceptance Criteria

1. THE System SHALL use a connection pool for MySQL connections
2. THE System SHALL implement automatic reconnection on connection loss
3. THE System SHALL implement query logging for debugging
4. THE System SHALL implement prepared statements to prevent SQL injection
5. THE System SHALL implement transaction support for multi-step operations
6. THE System SHALL implement database health checks
7. WHEN a query fails, THE System SHALL retry with exponential backoff
8. WHEN connection pool is exhausted, THE System SHALL queue requests

### Requirement 7: API Endpoint Migration

**User Story:** As a developer, I want to migrate all existing API endpoints to Express, so that all functionality is preserved.

#### Acceptance Criteria

1. THE System SHALL implement student management endpoints (create, read, update, delete, bulk import)
2. THE System SHALL implement VARK module endpoints (create, read, update, delete, import)
3. THE System SHALL implement class management endpoints
4. THE System SHALL implement progress tracking endpoints
5. THE System SHALL implement authentication endpoints (login, logout, register, password reset)
6. THE System SHALL implement file upload/download endpoints
7. THE System SHALL maintain the same request/response format as current API
8. WHEN an endpoint is called, THE System SHALL validate authentication
9. WHEN an endpoint is called, THE System SHALL validate user permissions
10. THE System SHALL implement the same error handling as current API

### Requirement 8: Frontend Integration

**User Story:** As a developer, I want to update the Next.js frontend to communicate with the Express API, so that the application continues to work seamlessly.

#### Acceptance Criteria

1. THE System SHALL update all API calls to point to Express server
2. THE System SHALL implement API client with authentication token management
3. THE System SHALL handle API errors gracefully
4. THE System SHALL implement request retry logic for failed requests
5. THE System SHALL update environment variables for API URL
6. WHEN the frontend makes an API call, THE System SHALL include authentication token
7. WHEN a token expires, THE System SHALL refresh it automatically
8. THE System SHALL maintain the same user experience during migration

### Requirement 9: Testing and Validation

**User Story:** As a developer, I want comprehensive testing to ensure the migration is successful, so that no functionality is broken.

#### Acceptance Criteria

1. THE System SHALL implement unit tests for all API endpoints
2. THE System SHALL implement integration tests for database operations
3. THE System SHALL implement end-to-end tests for critical user flows
4. THE System SHALL validate data integrity after migration
5. THE System SHALL test authentication and authorization
6. THE System SHALL test file upload/download functionality
7. THE System SHALL perform load testing to ensure performance
8. WHEN tests run, THE System SHALL report coverage metrics
9. THE System SHALL implement automated testing in CI/CD pipeline

### Requirement 10: Deployment and Rollback Strategy

**User Story:** As a developer, I want a safe deployment strategy with rollback capability, so that the migration can be reversed if issues occur.

#### Acceptance Criteria

1. THE System SHALL implement a phased rollout strategy
2. THE System SHALL maintain Supabase as backup during transition period
3. THE System SHALL implement feature flags to switch between old and new backend
4. THE System SHALL provide database backup before migration
5. THE System SHALL provide rollback scripts to revert to Supabase
6. THE System SHALL implement monitoring and alerting for the new system
7. WHEN issues are detected, THE System SHALL allow quick rollback
8. WHEN rollback occurs, THE System SHALL preserve data created during new system usage

### Requirement 11: Documentation

**User Story:** As a developer, I want comprehensive documentation for the new system, so that future maintenance is easier.

#### Acceptance Criteria

1. THE System SHALL provide API documentation with examples
2. THE System SHALL provide database schema documentation
3. THE System SHALL provide deployment instructions
4. THE System SHALL provide troubleshooting guide
5. THE System SHALL document environment variables and configuration
6. THE System SHALL document authentication flow
7. THE System SHALL document file storage configuration
8. THE System SHALL provide migration runbook with step-by-step instructions

### Requirement 12: Performance and Scalability

**User Story:** As a developer, I want the new system to perform as well or better than Supabase, so that user experience is not degraded.

#### Acceptance Criteria

1. THE System SHALL achieve response times equal to or better than current system
2. THE System SHALL handle concurrent users without performance degradation
3. THE System SHALL implement caching where appropriate
4. THE System SHALL implement database query optimization
5. THE System SHALL implement connection pooling for efficiency
6. WHEN load increases, THE System SHALL scale horizontally
7. WHEN database queries are slow, THE System SHALL log them for optimization

## Migration Phases

### Phase 1: Planning and Preparation (Week 1)
- Database schema analysis and conversion planning
- API endpoint inventory and mapping
- Authentication strategy design
- File storage strategy design
- Risk assessment and mitigation planning

### Phase 2: Development Environment Setup (Week 1-2)
- MySQL database setup
- Express.js server scaffolding
- Development environment configuration
- Initial schema migration scripts

### Phase 3: Core Infrastructure (Week 2-3)
- Database connection layer implementation
- Authentication system implementation
- API endpoint migration (critical paths first)
- File storage implementation

### Phase 4: Data Migration (Week 3-4)
- Data export from Supabase
- Data transformation and validation
- Data import to MySQL
- Integrity verification

### Phase 5: Testing (Week 4-5)
- Unit testing
- Integration testing
- End-to-end testing
- Performance testing
- Security testing

### Phase 6: Deployment (Week 5-6)
- Staging environment deployment
- Production deployment with feature flags
- Monitoring and observation
- Gradual rollout to users

### Phase 7: Stabilization (Week 6-8)
- Bug fixes and optimizations
- Performance tuning
- Documentation completion
- Supabase decommissioning (after stability confirmed)

## Success Criteria

1. ✅ All data migrated without loss
2. ✅ All functionality working as before
3. ✅ Authentication working for all users
4. ✅ File uploads/downloads working
5. ✅ Performance equal to or better than Supabase
6. ✅ Zero downtime during migration
7. ✅ Rollback capability tested and working
8. ✅ All tests passing
9. ✅ Documentation complete
10. ✅ Team trained on new system
