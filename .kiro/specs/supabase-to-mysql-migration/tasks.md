# Implementation Plan: Supabase to MySQL + Express Migration

## Overview

This implementation plan breaks down the migration into discrete, actionable tasks. Each task builds on previous tasks and includes specific requirements references. The migration will be executed in phases to minimize risk.

## Tasks

### Phase 1: Planning and Preparation

- [ ] 1. Set up project structure and tooling
  - Create `server/` directory for Express.js backend
  - Initialize npm project with `package.json`
  - Set up ESLint and Prettier for code quality
  - Create `.env.example` files for configuration
  - _Requirements: 4.1, 4.3_

- [ ] 2. Analyze current Supabase database schema
  - Export PostgreSQL schema from Supabase
  - Document all tables, columns, and relationships
  - Identify PostgreSQL-specific features (ENUM, JSONB, arrays)
  - Create schema conversion mapping document
  - _Requirements: 1.1, 1.5_

- [ ] 3. Inventory all API endpoints
  - List all Next.js API routes in `app/api/`
  - Document request/response formats for each endpoint
  - Identify authentication requirements per endpoint
  - Map endpoints to new Express routes
  - _Requirements: 7.1-7.7_

- [ ] 4. Set up development MySQL database
  - Install MySQL locally or use Docker
  - Create development database
  - Configure database user with appropriate permissions
  - Test connection from Node.js
  - _Requirements: 6.1, 6.6_

- [ ] 5. Create risk assessment and rollback plan
  - Document potential risks and mitigation strategies
  - Create rollback procedures for each phase
  - Set up backup strategy
  - Define success criteria for each phase
  - _Requirements: 10.1-10.7_

### Phase 2: Express.js Server Setup

- [ ] 6. Initialize Express.js server
  - [x] 6.1 Install Express and core dependencies
    - Install express, cors, helmet, compression
    - Install dotenv for environment variables
    - Install winston for logging
    - _Requirements: 4.1_

  - [ ] 6.2 Create basic server structure
    - Create `server/src/app.js` with Express setup
    - Configure middleware (cors, helmet, compression, json parser)
    - Set up error handling middleware
    - Create health check endpoint
    - _Requirements: 4.4, 4.5_

  - [ ] 6.3 Set up environment configuration
    - Create `.env.development` and `.env.production`
    - Configure database connection settings
    - Configure JWT secrets
    - Configure storage settings
    - _Requirements: 4.3_

  - [ ] 6.4 Implement logging system
    - Configure Winston logger with file and console transports
    - Create log rotation strategy
    - Implement request logging middleware
    - Add error logging
    - _Requirements: 4.4_

- [ ] 7. Set up MySQL connection layer
  - [x] 7.1 Install MySQL client
    - Install mysql2 package
    - Configure connection pool
    - _Requirements: 6.1_

  - [x] 7.2 Create database connection module
    - Implement connection pool with retry logic
    - Add connection health check
    - Implement graceful shutdown
    - _Requirements: 6.2, 6.6_

  - [ ] 7.3 Create database utility functions
    - Implement query wrapper with error handling
    - Add transaction support
    - Implement prepared statement helpers
    - _Requirements: 6.4, 6.5_

### Phase 3: Database Schema Migration

- [ ] 8. Convert PostgreSQL schema to MySQL
  - [x] 8.1 Create MySQL schema file
    - Convert all table definitions
    - Convert data types (UUID → CHAR(36), JSONB → JSON, etc.)
    - Convert ENUM types to VARCHAR with constraints
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 8.2 Create indexes
    - Convert all PostgreSQL indexes to MySQL
    - Add performance indexes for common queries
    - _Requirements: 1.3_

  - [x] 8.3 Set up foreign key constraints
    - Create all foreign key relationships
    - Configure ON DELETE and ON UPDATE actions
    - _Requirements: 1.3_

  - [x] 8.4 Create migration script
    - Write SQL script to create all tables
    - Add rollback script to drop tables
    - Test migration on development database
    - _Requirements: 1.8_

- [ ] 9. Create authentication tables
  - Create `users` table (replaces Supabase auth.users)
  - Create `refresh_tokens` table
  - Create `password_reset_tokens` table
  - Add indexes for performance
  - _Requirements: 3.1, 3.2_

### Phase 4: Authentication System

- [ ] 10. Implement JWT authentication
  - [x] 10.1 Install authentication dependencies
    - Install jsonwebtoken for JWT
    - Install bcrypt for password hashing
    - _Requirements: 3.1_

  - [x] 10.2 Create authentication service
    - Implement password hashing functions
    - Implement JWT token generation (access + refresh)
    - Implement token verification
    - Implement token refresh logic
    - _Requirements: 3.4, 3.7, 3.8_

  - [x] 10.3 Create User and Profile models
    - Implement User model with database methods
    - Implement Profile model with database methods
    - Add password verification method
    - _Requirements: 3.2_

  - [x] 10.4 Implement authentication middleware
    - Create JWT verification middleware
    - Create role-based access control middleware
    - Add request user injection
    - _Requirements: 3.9_

  - [x] 10.5 Create authentication endpoints
    - POST /api/auth/register
    - POST /api/auth/login
    - POST /api/auth/logout
    - POST /api/auth/refresh
    - GET /api/auth/me
    - _Requirements: 3.4, 7.1_

  - [x] 10.6 Implement password reset functionality
    - POST /api/auth/forgot-password
    - POST /api/auth/reset-password
    - Create email service for sending reset emails
    - _Requirements: 3.5_

- [ ]* 10.7 Write tests for authentication
  - Unit tests for auth service
  - Integration tests for auth endpoints
  - Test token expiration and refresh
  - _Requirements: 9.5_

### Phase 5: API Endpoint Migration

- [ ] 11. Implement student management endpoints
  - [x] 11.1 Create Student model
    - Implement database methods (create, read, update, delete)
    - Add validation logic
    - _Requirements: 7.2_

  - [x] 11.2 Create student controller
    - Implement createStudent handler
    - Implement getStudents handler
    - Implement getStudentById handler
    - Implement updateStudent handler
    - Implement deleteStudent handler
    - Implement bulkImportStudents handler
    - _Requirements: 7.2_

  - [x] 11.3 Create student routes
    - Set up Express router for /api/students
    - Add authentication middleware
    - Add role-based access control (teacher/admin only)
    - Add request validation
    - _Requirements: 7.2, 7.8, 7.9_

  - [ ]* 11.4 Write tests for student endpoints
    - Unit tests for Student model
    - Integration tests for student API
    - Test bulk import functionality
    - _Requirements: 9.1, 9.2_

- [x] 12. Implement VARK module endpoints
  - [x] 12.1 Create Module model
    - Implement database methods
    - Handle JSON fields (learning_objectives, content_structure, etc.)
    - _Requirements: 7.3_

  - [x] 12.2 Create module controller
    - Implement createModule handler
    - Implement getModules handler
    - Implement getModuleById handler
    - Implement updateModule handler
    - Implement deleteModule handler
    - Implement importModule handler
    - _Requirements: 7.3_

  - [x] 12.3 Create module routes
    - Set up Express router for /api/modules
    - Add authentication and authorization
    - Add request validation
    - _Requirements: 7.3, 7.8, 7.9_

  - [ ]* 12.4 Write tests for module endpoints
    - Unit tests for Module model
    - Integration tests for module API
    - _Requirements: 9.1, 9.2_

- [-] 13. Implement remaining endpoints
  - [ ] 13.1 Create class management endpoints
    - Implement Class model
    - Create class controller and routes
    - _Requirements: 7.4_

  - [x] 13.2 Create progress tracking endpoints
    - Implement Progress model
    - Create progress controller and routes
    - _Requirements: 7.5_

  - [ ]* 13.3 Write tests for remaining endpoints
    - Unit and integration tests
    - _Requirements: 9.1, 9.2_

### Phase 6: File Storage Implementation

- [x] 14. Implement file storage system
  - [x] 14.1 Install file upload dependencies
    - Install multer for file uploads
    - Install aws-sdk for S3 (production)
    - _Requirements: 5.1_

  - [x] 14.2 Create storage service
    - Implement local file storage for development
    - Implement S3 storage for production
    - Add file validation (type, size)
    - _Requirements: 5.2, 5.3, 5.7_

  - [x] 14.3 Create file upload endpoints
    - POST /api/files/upload
    - GET /api/files/:id
    - DELETE /api/files/:id
    - Add authentication and authorization
    - _Requirements: 5.1, 5.6, 5.8, 7.6_

  - [ ]* 14.4 Write tests for file storage
    - Test file upload
    - Test file download
    - Test file deletion
    - Test access control
    - _Requirements: 9.6_

### Phase 7: Data Migration

- [x] 15. Create data export scripts
  - [x] 15.1 Create Supabase data export script
    - Export all tables to JSON files
    - Handle pagination for large tables
    - Export in batches to avoid memory issues
    - _Requirements: 2.1, 2.7_

  - [x] 15.2 Export user authentication data
    - Export users from Supabase Auth
    - Document password migration strategy
    - _Requirements: 3.2, 3.3_

  - [x] 15.3 Export files from Supabase Storage
    - Download all files from storage buckets
    - Maintain directory structure
    - _Requirements: 5.4_

- [x] 16. Create data import scripts
  - [x] 16.1 Create MySQL data import script
    - Convert data formats (UUIDs, timestamps, JSON)
    - Handle foreign key dependencies
    - Implement batch inserts for performance
    - _Requirements: 2.2, 2.5, 2.6, 2.8_

  - [x] 16.2 Import user accounts
    - Create users in MySQL
    - Generate password reset tokens for all users
    - Send password reset emails
    - _Requirements: 3.2, 3.3_

  - [x] 16.3 Import files to new storage
    - Upload files to local storage or S3
    - Update file URLs in database
    - _Requirements: 5.4, 5.5_

  - [x] 16.4 Verify data integrity
    - Compare row counts between Supabase and MySQL
    - Verify foreign key relationships
    - Check for data corruption
    - _Requirements: 2.4_

### Phase 8: Frontend Integration

- [x] 17. Update frontend API client
  - [x] 17.1 Create new API client for Express backend
    - Implement fetch wrapper with authentication
    - Add token management (storage, refresh)
    - Add error handling
    - _Requirements: 8.2, 8.3, 8.6, 8.7_

  - [x] 17.2 Update environment variables
    - Add NEXT_PUBLIC_API_URL for Express server
    - Add feature flag NEXT_PUBLIC_USE_NEW_API
    - _Requirements: 8.5_

  - [x] 17.3 Update authentication hooks
    - Modify useAuth hook to use new API
    - Update login/logout/register flows
    - Implement token refresh logic
    - _Requirements: 8.6, 8.7, 3.10_

  - [x] 17.4 Update API calls throughout frontend
    - Replace Supabase client calls with new API client
    - Update student management pages
    - Update module management pages
    - Update file upload components
    - _Requirements: 8.1, 8.8_

  - [ ]* 17.5 Write end-to-end tests
    - Test complete user flows
    - Test authentication flow
    - Test student creation flow
    - Test module creation flow
    - _Requirements: 9.3_

### Phase 9: Testing and Validation

- [ ] 18. Comprehensive testing
  - [ ]* 18.1 Run all unit tests
    - Ensure all unit tests pass
    - Achieve >80% code coverage
    - _Requirements: 9.1, 9.8_

  - [ ]* 18.2 Run all integration tests
    - Test all API endpoints
    - Test database operations
    - Test authentication flows
    - _Requirements: 9.2_

  - [ ]* 18.3 Run end-to-end tests
    - Test critical user journeys
    - Test on multiple browsers
    - _Requirements: 9.3_

  - [ ]* 18.4 Perform load testing
    - Test with concurrent users
    - Identify performance bottlenecks
    - Optimize slow queries
    - _Requirements: 9.7, 12.1, 12.2_

  - [ ]* 18.5 Security testing
    - Test authentication and authorization
    - Test for SQL injection vulnerabilities
    - Test file upload security
    - Test rate limiting
    - _Requirements: 9.5_

  - [ ] 18.6 Data integrity validation
    - Verify all data migrated correctly
    - Check for missing or corrupted data
    - Validate foreign key relationships
    - _Requirements: 9.4_

### Phase 10: Deployment Preparation

- [ ] 19. Set up production infrastructure
  - [ ] 19.1 Set up production MySQL database
    - Configure database server
    - Set up SSL/TLS encryption
    - Configure backups
    - _Requirements: 6.1_

  - [ ] 19.2 Set up production file storage
    - Configure S3 bucket or equivalent
    - Set up CDN if needed
    - Configure access policies
    - _Requirements: 5.3_

  - [ ] 19.3 Set up Redis for sessions/caching
    - Install and configure Redis
    - Set up persistence
    - Configure connection pooling
    - _Requirements: 12.3_

  - [ ] 19.4 Configure production environment
    - Set all environment variables
    - Configure SSL certificates
    - Set up domain and DNS
    - _Requirements: 4.3_

- [ ] 20. Set up monitoring and logging
  - [ ] 20.1 Configure application monitoring
    - Set up error tracking (e.g., Sentry)
    - Configure performance monitoring
    - Set up uptime monitoring
    - _Requirements: 10.6_

  - [ ] 20.2 Set up database monitoring
    - Monitor query performance
    - Monitor connection pool usage
    - Set up slow query logging
    - _Requirements: 6.3_

  - [ ] 20.3 Configure alerting
    - Set up alerts for errors
    - Set up alerts for performance issues
    - Set up alerts for downtime
    - _Requirements: 10.6_

- [ ] 21. Create deployment scripts
  - Create deployment script for Express server
  - Create database migration script
  - Create rollback script
  - Document deployment process
  - _Requirements: 10.1, 10.5_

### Phase 11: Staged Deployment

- [ ] 22. Deploy to staging environment
  - Deploy Express API to staging
  - Run full migration on staging database
  - Test all functionality in staging
  - Fix any issues found
  - _Requirements: 10.1_

- [ ] 23. Parallel running phase
  - Deploy Express API to production (inactive)
  - Set up data sync from Supabase to MySQL
  - Monitor for sync issues
  - _Requirements: 10.2_

- [ ] 24. Feature flag rollout
  - [ ] 24.1 Enable for internal testing (10% traffic)
    - Enable new API for test accounts
    - Monitor errors and performance
    - Fix critical issues
    - _Requirements: 10.3_

  - [ ] 24.2 Gradual rollout (25% → 50% → 75%)
    - Increase traffic gradually
    - Monitor metrics at each stage
    - Be ready to rollback if needed
    - _Requirements: 10.3_

  - [ ] 24.3 Full migration (100% traffic)
    - Switch all traffic to new API
    - Keep Supabase as read-only backup
    - Monitor closely for 48 hours
    - _Requirements: 10.3_

- [ ] 25. Checkpoint - Ensure system is stable
  - Verify all functionality working
  - Check error rates and performance
  - Review user feedback
  - Address any issues before proceeding

### Phase 12: Stabilization and Cleanup

- [ ] 26. Monitor and optimize
  - Monitor system for 2 weeks
  - Optimize slow queries
  - Fix any bugs that arise
  - Tune performance as needed
  - _Requirements: 12.1, 12.2, 12.7_

- [ ] 27. Complete documentation
  - [ ] 27.1 API documentation
    - Document all endpoints with examples
    - Create Swagger/OpenAPI spec
    - _Requirements: 4.8, 11.1_

  - [ ] 27.2 Database documentation
    - Document schema with ER diagrams
    - Document indexes and constraints
    - _Requirements: 11.2_

  - [ ] 27.3 Deployment documentation
    - Document deployment process
    - Document rollback procedures
    - Document troubleshooting steps
    - _Requirements: 11.3, 11.4, 11.8_

  - [ ] 27.4 Configuration documentation
    - Document all environment variables
    - Document configuration options
    - _Requirements: 11.5_

- [ ] 28. Decommission Supabase
  - Verify system stability for 2 weeks
  - Export final backup from Supabase
  - Cancel Supabase subscription
  - Archive Supabase credentials
  - _Requirements: 10.2, 10.7_

- [ ] 29. Final checkpoint - Migration complete!
  - Verify all success criteria met
  - Conduct post-mortem meeting
  - Document lessons learned
  - Celebrate the successful migration! 🎉

## Notes

- Tasks marked with `*` are optional but highly recommended
- Each task should be completed and tested before moving to the next
- Checkpoints are critical - do not skip them
- Keep Supabase running as backup until system is proven stable
- Have rollback plan ready at all times during migration
- Monitor closely during and after deployment

## Estimated Timeline

- **Phase 1-2:** Week 1-2 (Setup and infrastructure)
- **Phase 3-4:** Week 2-3 (Database and authentication)
- **Phase 5-6:** Week 3-4 (API endpoints and file storage)
- **Phase 7-8:** Week 4-5 (Data migration and frontend)
- **Phase 9-10:** Week 5-6 (Testing and deployment prep)
- **Phase 11:** Week 6-7 (Staged deployment)
- **Phase 12:** Week 7-8 (Stabilization and cleanup)

**Total: 6-8 weeks**
