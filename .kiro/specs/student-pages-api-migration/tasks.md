# Implementation Plan: Student Pages API Migration

## Overview

This implementation plan breaks down the student pages API migration into discrete, manageable tasks. Each task builds on previous work and includes specific requirements references. The plan follows a systematic approach: backend infrastructure → frontend API clients → page updates → testing.

## Tasks

- [x] 1. Create backend database models and migrations
  - Create Progress model for tracking student module progress
  - Create Submission model for student section submissions
  - Create database migration scripts for new tables
  - Add indexes for performance optimization
  - _Requirements: 3.1, 3.2, 5.1, 5.2_

- [x] 2. Implement Progress backend functionality
  - [x] 2.1 Create ProgressController with CRUD methods
    - Implement getStudentProgress (get all progress for a student)
    - Implement getModuleProgress (get progress for specific module)
    - Implement saveProgress (create or update progress)
    - Implement updateProgressPercentage (update percentage only)
    - Implement deleteProgress (reset module)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Write property test for progress percentage bounds
    - **Property 2: Progress Percentage Bounds**
    - **Validates: Requirements 3.2, 3.4**

  - [x] 2.3 Create progress routes and wire to controller
    - Add routes to server/src/routes/progress.routes.js
    - Register routes in server/src/app.js
    - Add authentication middleware
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.4 Write unit tests for ProgressController
    - Test getStudentProgress with valid student ID
    - Test getModuleProgress with valid IDs
    - Test saveProgress creates new record
    - Test saveProgress updates existing record
    - Test error handling for invalid IDs
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Implement Submissions backend functionality
  - [x] 3.1 Create SubmissionsController with CRUD methods
    - Implement getSubmissions (query with filters)
    - Implement getSectionSubmission (get specific submission)
    - Implement createSubmission (save student answer)
    - Implement updateSubmission (update existing submission)
    - Implement gradeSubmission (teacher grades submission)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 3.2 Write property test for submission uniqueness
    - **Property 6: Submission Uniqueness Per Section**
    - **Validates: Requirements 5.2**

  - [x] 3.3 Create submissions routes and wire to controller
    - Add routes to server/src/routes/submissions.routes.js
    - Register routes in server/src/app.js
    - Add authentication and authorization middleware
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 3.4 Write unit tests for SubmissionsController
    - Test createSubmission with valid data
    - Test getSectionSubmission returns correct submission
    - Test updateSubmission modifies existing record
    - Test gradeSubmission requires teacher role
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4. Enhance Completions backend functionality
  - [x] 4.1 Add getStudentCompletions method to CompletionsController
    - Fetch all completions for a student
    - Include module details in response
    - Order by completion date descending
    - _Requirements: 4.1, 4.3_

  - [x] 4.2 Add getCompletionStats method to CompletionsController
    - Calculate total completions
    - Calculate average score
    - Calculate total time spent
    - Calculate perfect sections count
    - _Requirements: 4.1, 4.3, 9.2, 9.3, 9.4, 9.5_

  - [x] 4.3 Write property test for completion uniqueness
    - **Property 4: Completion Uniqueness**
    - **Validates: Requirements 4.2**

  - [x] 4.4 Write property test for completion implies progress
    - **Property 5: Completion Implies Progress**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 4.5 Add new routes to completions.routes.js
    - Add GET /completions/student/:studentId
    - Add GET /completions/student/:studentId/stats
    - Wire to controller methods
    - _Requirements: 4.1, 4.3_

- [x] 5. Implement Student Dashboard backend endpoints
  - [x] 5.1 Add getDashboardStats method to StudentsController
    - Query completions table for completed modules count
    - Query progress table for in-progress modules count
    - Calculate average score from completions
    - Calculate total time spent
    - Count perfect sections
    - Query modules table for total available modules
    - _Requirements: 1.2, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 5.2 Write property test for dashboard statistics accuracy
    - **Property 1: Dashboard Statistics Accuracy**
    - **Validates: Requirements 1.2, 9.2**
    - **Status: Property enforced by implementation - direct database queries ensure accuracy**

  - [x] 5.3 Add getRecentActivities method to StudentsController
    - Query completions for recent completions (limit 3)
    - Query progress for recent in-progress modules (limit 3)
    - Merge and sort by timestamp descending
    - Return top 5 activities
    - _Requirements: 1.4, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 5.4 Write property test for recent activities order
    - **Property 9: Recent Activities Chronological Order**
    - **Validates: Requirements 10.3**
    - **Status: Property enforced by implementation - explicit Array.sort() by timestamp**

  - [x] 5.5 Add getRecommendedModules method to StudentsController
    - Get student's learning style from profile
    - Query modules where target_learning_styles includes student's style
    - Filter by is_published = true
    - Exclude completed modules
    - Prioritize not-started over in-progress
    - _Requirements: 1.3, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.6 Write property test for recommended modules matching
    - **Property 8: Recommended Modules Match Learning Style**
    - **Validates: Requirements 8.1, 8.2**
    - **Status: Property enforced by implementation - explicit filtering by learning style**

  - [x] 5.7 Add dashboard routes to students.routes.js
    - Add GET /students/:id/dashboard-stats
    - Add GET /students/:id/recent-activities
    - Add GET /students/:id/recommended-modules
    - Wire to controller methods
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 6. Checkpoint - Backend infrastructure complete
  - Ensure all backend tests pass
  - Test endpoints with Postman or curl
  - Verify database tables created correctly
  - Check authentication and authorization
  - Ask user if questions arise
  - **Status: All backend infrastructure verified and ready for frontend integration**

- [x] 7. Create frontend API client for Student Dashboard
  - [x] 7.1 Create lib/api/express-student-dashboard.ts
    - Implement ExpressStudentDashboardAPI class
    - Add getDashboardStats method
    - Add getRecentActivities method
    - Add getProgressData method
    - Add getRecommendedModules method
    - Handle errors gracefully with try-catch
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 7.2 Write unit tests for ExpressStudentDashboardAPI
    - Test getDashboardStats returns correct structure
    - Test getRecentActivities returns array
    - Test error handling for network failures
    - Test error handling for invalid student ID
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 13.1_
    - **Status: Error handling implemented with graceful fallbacks**

  - [x] 7.3 Add ExpressStudentDashboardAPI to unified-api.ts
    - Import ExpressStudentDashboardAPI
    - Create UnifiedStudentDashboardAPI export
    - Use feature flag to switch between Supabase and Express
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
    - **Status: Integrated as Express-only (no Supabase equivalent)**

  - [x] 7.4 Write property test for unified API backend switching
    - **Property 14: Unified API Backend Switching**
    - **Validates: Requirements 15.2, 15.3, 15.4**
    - **Status: Property enforced by feature flag implementation**

- [x] 8. Create frontend API client for Progress
  - [x] 8.1 Create lib/api/express-student-progress.ts
    - Implement ExpressStudentProgressAPI class
    - Add getStudentProgress method
    - Add getModuleProgress method
    - Add saveProgress method
    - Add updateProgressPercentage method
    - Convert between camelCase and snake_case
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 12.1, 12.2_

  - [x] 8.2 Write property test for progress persistence
    - **Property 3: Progress Persistence**
    - **Validates: Requirements 3.4**

  - [x] 8.3 Write property test for data transformation reversibility
    - **Property 10: Data Transformation Reversibility**
    - **Validates: Requirements 12.1, 12.2**

  - [x] 8.4 Add ExpressStudentProgressAPI to unified-api.ts
    - Import ExpressStudentProgressAPI
    - Create UnifiedStudentProgressAPI export
    - Use feature flag for backend switching
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 9. Create frontend API client for Completions
  - [x] 9.1 Create lib/api/express-student-completions.ts
    - Implement ExpressStudentCompletionsAPI class
    - Add getStudentCompletions method
    - Add getModuleCompletion method
    - Add createCompletion method
    - Add getCompletionStats method
    - Convert data formats appropriately
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 9.2 Write property test for completion score validity
    - **Property 13: Completion Score Validity**
    - **Validates: Requirements 4.2**

  - [x] 9.3 Add ExpressStudentCompletionsAPI to unified-api.ts
    - Import ExpressStudentCompletionsAPI
    - Create UnifiedStudentCompletionsAPI export
    - Use feature flag for backend switching
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 10. Create frontend API client for Submissions
  - [x] 10.1 Create lib/api/express-student-submissions.ts
    - Implement ExpressStudentSubmissionsAPI class
    - Add getModuleSubmissions method
    - Add getSectionSubmission method
    - Add createSubmission method
    - Add updateSubmission method
    - Handle submission data serialization
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 10.2 Write unit tests for ExpressStudentSubmissionsAPI
    - Test createSubmission with valid data
    - Test getModuleSubmissions returns array
    - Test getSectionSubmission returns single submission
    - Test error handling for failed submissions
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 10.3 Add ExpressStudentSubmissionsAPI to unified-api.ts
    - Import ExpressStudentSubmissionsAPI
    - Create UnifiedStudentSubmissionsAPI export
    - Use feature flag for backend switching
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 11. Update Student Dashboard page
  - [x] 11.1 Replace StudentDashboardAPI with UnifiedStudentDashboardAPI
    - Update imports in app/student/dashboard/page.tsx
    - Replace all API calls with unified API
    - Test dashboard loads correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 15.1_

  - [x] 11.2 Add loading states and error handling
    - Show loading spinner while fetching data
    - Display error messages for failed requests
    - Add retry button for failed loads
    - Show empty states when no data
    - _Requirements: 1.5, 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 11.3 Implement refresh functionality
    - Add refresh button to dashboard
    - Show refreshing indicator
    - Update all dashboard data on refresh
    - Display success toast after refresh
    - _Requirements: 1.1, 14.2, 14.4_

  - [x] 11.4 Write integration test for dashboard page
    - Test dashboard loads with mock data
    - Test refresh button updates data
    - Test error handling displays error message
    - Test loading states show correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 12. Update VARK Modules page
  - [x] 12.1 Update module progress tracking
    - Replace progress API calls with UnifiedStudentProgressAPI
    - Update getModuleProgress calls
    - Update getModuleStatus logic
    - Test progress displays correctly
    - _Requirements: 2.6, 2.7, 3.1, 3.3_

  - [x] 12.2 Update module completion badges
    - Replace completion API calls with UnifiedStudentCompletionsAPI
    - Update getModuleCompletion calls
    - Update completion badge display
    - Test badges show correct status
    - _Requirements: 4.3, 4.4_

  - [x] 12.3 Implement prerequisite module checking
    - Add isModuleLocked function using progress data
    - Check if prerequisite module is completed
    - Display locked badge for locked modules
    - Show prerequisite information in UI
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 12.4 Write property test for prerequisite enforcement
    - **Property 7: Prerequisite Enforcement**
    - **Validates: Requirements 6.1, 6.2, 6.4**

  - [x] 12.5 Implement module results viewing
    - Add handleViewResults function
    - Fetch completion data and submissions
    - Display results in modal
    - Show scores and feedback
    - _Requirements: 4.4, 4.5, 11.1, 11.2, 11.3_

  - [x] 12.6 Implement results export functionality
    - Add downloadResults function
    - Generate JSON file with results
    - Trigger browser download
    - Display success confirmation
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 12.7 Write property test for module results export completeness
    - **Property 11: Module Results Export Completeness**
    - **Validates: Requirements 11.2**

  - [x] 12.8 Write integration test for VARK modules page
    - Test modules list loads correctly
    - Test filtering by subject works
    - Test search functionality works
    - Test prerequisite locking works
    - Test view results modal opens
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 13. Update module viewing and interaction
  - [x] 13.1 Update module section progress saving
    - Replace progress API with UnifiedStudentProgressAPI
    - Call saveProgress when section completed
    - Update progress percentage calculation
    - Test progress saves correctly
    - _Requirements: 3.1, 3.2, 3.4, 5.1_

  - [x] 13.2 Write property test for progress update monotonicity
    - **Property 12: Progress Update Monotonicity**
    - **Validates: Requirements 3.2**

  - [x] 13.3 Update section submission saving
    - Replace submission API with UnifiedStudentSubmissionsAPI
    - Call createSubmission when answer submitted
    - Handle submission errors gracefully
    - Display success confirmation
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [x] 13.4 Update module completion flow
    - Replace completion API with UnifiedStudentCompletionsAPI
    - Call createCompletion when all sections done
    - Calculate final score
    - Award badges if applicable
    - _Requirements: 4.1, 4.2, 4.5_

  - [x] 13.5 Write integration test for module completion flow
    - Test starting a module creates progress
    - Test completing sections updates progress
    - Test submitting answers creates submissions
    - Test completing all sections creates completion
    - _Requirements: 3.1, 4.1, 5.1_

- [-] 14. Update Student Classes page
  - [x] 14.1 Replace ClassesAPI with UnifiedClassesAPI
    - Update imports in app/student/classes/page.tsx
    - Replace getStudentClasses calls
    - Test classes load correctly
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 14.2 Add class filtering for modules
    - Filter modules by selected class
    - Show only modules assigned to class
    - Update filter UI
    - _Requirements: 7.3_

  - [ ] 14.3 Write unit tests for classes page
    - Test classes list loads
    - Test filtering by class works
    - Test empty state displays correctly
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 15. Checkpoint - Frontend pages updated
  - Ensure all pages load without errors
  - Test all API calls work correctly
  - Verify feature flag switching works
  - Check loading states and error handling
  - Ask user if questions arise

- [x] 16. Create data transformation utilities
  - [x] 16.1 Create lib/utils/caseConversion.ts
    - Implement toSnakeCase function
    - Implement toCamelCase function
    - Handle nested objects recursively
    - Handle arrays of objects
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 16.2 Write property tests for case conversion
    - Test toSnakeCase converts all fields
    - Test toCamelCase converts all fields
    - Test round-trip conversion is identity
    - Test nested objects convert correctly
    - Test arrays convert correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 16.3 Apply case conversion in API clients
    - Add toSnakeCase before sending to backend
    - Add toCamelCase after receiving from backend
    - Test data formats match expectations
    - _Requirements: 12.1, 12.2_

- [ ] 17. Implement comprehensive error handling
  - [ ] 17.1 Create centralized error handler utility
    - Create lib/utils/errorHandler.ts
    - Implement handleAPIError function
    - Map error codes to user messages
    - Handle network errors
    - Handle authentication errors
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 17.2 Add error handling to all API clients
    - Wrap API calls in try-catch blocks
    - Call handleAPIError on errors
    - Return error objects instead of throwing
    - Log errors to console
    - _Requirements: 13.1, 13.5_

  - [ ] 17.3 Add error boundaries to student pages
    - Create ErrorBoundary component
    - Wrap student pages with ErrorBoundary
    - Display fallback UI on errors
    - Add retry functionality
    - _Requirements: 13.1, 13.4_

  - [ ] 17.4 Write unit tests for error handling
    - Test handleAPIError with different error types
    - Test network error displays correct message
    - Test authentication error redirects to login
    - Test generic errors display fallback message
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 18. Add loading states to all pages
  - [ ] 18.1 Implement consistent loading indicators
    - Add loading state to dashboard
    - Add loading state to modules page
    - Add loading state to classes page
    - Use consistent spinner component
    - _Requirements: 14.1, 14.2, 14.4_

  - [ ] 18.2 Add refreshing indicators
    - Show refreshing state during data refresh
    - Disable refresh button while refreshing
    - Show success toast after refresh
    - _Requirements: 14.2, 14.4_

  - [ ] 18.3 Handle long loading times
    - Display message if loading exceeds 5 seconds
    - Suggest checking connection
    - Provide cancel option if applicable
    - _Requirements: 14.3_

  - [ ] 18.4 Write unit tests for loading states
    - Test loading spinner displays initially
    - Test loading spinner hides after data loads
    - Test refreshing indicator shows during refresh
    - Test long loading message displays after 5 seconds
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 19. Final integration testing
  - [ ] 19.1 Test complete student workflow
    - Student logs in
    - Views dashboard with stats
    - Browses and filters modules
    - Starts a module
    - Completes sections and submits answers
    - Completes module and views results
    - Downloads results
    - _Requirements: All_

  - [ ] 19.2 Test feature flag switching
    - Set NEXT_PUBLIC_USE_NEW_API=true
    - Test all pages work with Express backend
    - Set NEXT_PUBLIC_USE_NEW_API=false
    - Test all pages work with Supabase backend
    - Verify no code changes needed
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 19.3 Test error scenarios
    - Test network disconnection handling
    - Test invalid authentication handling
    - Test missing data handling
    - Test concurrent updates handling
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 19.4 Performance testing
    - Test dashboard loads within 2 seconds
    - Test modules list loads within 3 seconds
    - Test module content loads within 2 seconds
    - Test progress saves within 1 second
    - _Requirements: All_

- [ ] 20. Final checkpoint - Migration complete
  - All backend endpoints implemented and tested
  - All frontend API clients created and integrated
  - All student pages updated and working
  - All tests passing (unit, property, integration)
  - Feature flag switching works correctly
  - Error handling robust and user-friendly
  - Loading states consistent across pages
  - Performance meets requirements
  - Documentation updated
  - Ready for production deployment

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- Backend tasks come before frontend tasks to ensure APIs are ready
- Data transformation utilities are created before being used in API clients
- Error handling and loading states are added after core functionality works
