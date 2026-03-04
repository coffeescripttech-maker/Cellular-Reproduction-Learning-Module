# Design Document: Student Pages API Migration

## Overview

This design document outlines the architecture and implementation approach for migrating all student-facing pages from Supabase to the Express.js/MySQL backend. The migration ensures students can access learning modules, track progress, view completions, and interact with all learning features through a unified API layer that supports seamless backend switching via feature flags.

The design follows a layered architecture with clear separation between frontend components, API clients, backend controllers, and data models. All student pages will use the Unified API layer, which abstracts the underlying backend implementation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Student Pages (React)                     │
│  - Dashboard  - VARK Modules  - Classes  - Profile          │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Unified API Layer                         │
│  (Switches between Supabase and Express based on flag)      │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐           ┌─────────▼──────────┐
│  Supabase API   │           │   Express API      │
│  (Legacy)       │           │   (New Backend)    │
└─────────────────┘           └─────────┬──────────┘
                                        │
                              ┌─────────▼──────────┐
                              │   MySQL Database   │
                              └────────────────────┘
```

### Component Layers

1. **Presentation Layer**: React components for student pages
2. **API Abstraction Layer**: Unified API that switches backends
3. **Backend Layer**: Express.js controllers and routes
4. **Data Layer**: MySQL database with Sequelize models

## Components and Interfaces

### 1. Frontend API Clients

#### ExpressStudentDashboardAPI

```typescript
interface DashboardStats {
  modulesCompleted: number;
  modulesInProgress: number;
  averageScore: number;
  totalTimeSpent: number;
  perfectSections: number;
  totalModulesAvailable: number;
}

interface RecentActivity {
  id: string;
  type: 'module_completion' | 'module_progress';
  title: string;
  status: 'completed' | 'in_progress';
  timestamp: string;
  score?: number;
  progress?: number;
}

class ExpressStudentDashboardAPI {
  // Get dashboard statistics
  static async getDashboardStats(userId: string): Promise<DashboardStats>
  
  // Get recent activities (last 5)
  static async getRecentActivities(userId: string): Promise<RecentActivity[]>
  
  // Get progress data for charts
  static async getProgressData(userId: string): Promise<ProgressData>
}
```

#### ExpressStudentProgressAPI

```typescript
interface ModuleProgress {
  id: string;
  student_id: string;
  module_id: string;
  progress_percentage: number;
  sections_completed: string[];
  last_section_id: string;
  time_spent_minutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  started_at: string;
  updated_at: string;
}

class ExpressStudentProgressAPI {
  // Get all progress for a student
  static async getStudentProgress(studentId: string): Promise<ModuleProgress[]>
  
  // Get progress for specific module
  static async getModuleProgress(studentId: string, moduleId: string): Promise<ModuleProgress | null>
  
  // Create or update progress
  static async saveProgress(progressData: Partial<ModuleProgress>): Promise<ModuleProgress>
  
  // Update progress percentage
  static async updateProgressPercentage(studentId: string, moduleId: string, percentage: number): Promise<void>
}
```

#### ExpressStudentCompletionsAPI

```typescript
interface ModuleCompletion {
  id: string;
  student_id: string;
  module_id: string;
  completion_date: string;
  final_score: number;
  time_spent_minutes: number;
  perfect_sections: number;
  badge_earned: string | null;
}

class ExpressStudentCompletionsAPI {
  // Get all completions for a student
  static async getStudentCompletions(studentId: string): Promise<ModuleCompletion[]>
  
  // Get completion for specific module
  static async getModuleCompletion(studentId: string, moduleId: string): Promise<ModuleCompletion | null>
  
  // Create completion record
  static async createCompletion(completionData: Partial<ModuleCompletion>): Promise<ModuleCompletion>
  
  // Get completion statistics
  static async getCompletionStats(studentId: string): Promise<CompletionStats>
}
```

#### ExpressStudentSubmissionsAPI

```typescript
interface StudentSubmission {
  id: string;
  student_id: string;
  module_id: string;
  section_id: string;
  answer_content: any;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  graded_at: string | null;
}

class ExpressStudentSubmissionsAPI {
  // Get all submissions for a module
  static async getModuleSubmissions(studentId: string, moduleId: string): Promise<StudentSubmission[]>
  
  // Get submission for specific section
  static async getSectionSubmission(studentId: string, moduleId: string, sectionId: string): Promise<StudentSubmission | null>
  
  // Create submission
  static async createSubmission(submissionData: Partial<StudentSubmission>): Promise<StudentSubmission>
  
  // Update submission
  static async updateSubmission(submissionId: string, updates: Partial<StudentSubmission>): Promise<StudentSubmission>
}
```

### 2. Backend Controllers

#### StudentsController (Enhanced)

```javascript
class StudentsController {
  // Existing methods
  async getAll(req, res)
  async getById(req, res)
  async create(req, res)
  async update(req, res)
  async delete(req, res)
  
  // New methods for student pages
  async getDashboardStats(req, res)
  async getRecentActivities(req, res)
  async getProgressData(req, res)
  async getEnrolledClasses(req, res)
  async getRecommendedModules(req, res)
}
```

#### ProgressController (New)

```javascript
class ProgressController {
  // Get all progress for a student
  async getStudentProgress(req, res)
  
  // Get progress for specific module
  async getModuleProgress(req, res)
  
  // Create or update progress
  async saveProgress(req, res)
  
  // Update progress percentage
  async updateProgressPercentage(req, res)
  
  // Delete progress (reset module)
  async deleteProgress(req, res)
}
```

#### CompletionsController (Enhanced)

```javascript
class CompletionsController {
  // Get all completions for a student
  async getStudentCompletions(req, res)
  
  // Get completion for specific module
  async getModuleCompletion(req, res)
  
  // Create completion record
  async createCompletion(req, res)
  
  // Get completion statistics
  async getCompletionStats(req, res)
  
  // Get completions for a module (all students)
  async getModuleCompletions(req, res)
}
```

#### SubmissionsController (New)

```javascript
class SubmissionsController {
  // Get all submissions for a student/module
  async getSubmissions(req, res)
  
  // Get submission for specific section
  async getSectionSubmission(req, res)
  
  // Create submission
  async createSubmission(req, res)
  
  // Update submission
  async updateSubmission(req, res)
  
  // Grade submission
  async gradeSubmission(req, res)
  
  // Get submission statistics
  async getSubmissionStats(req, res)
}
```

### 3. Backend Routes

```javascript
// students.routes.js (enhanced)
router.get('/:id/dashboard-stats', verifyToken, studentsController.getDashboardStats);
router.get('/:id/recent-activities', verifyToken, studentsController.getRecentActivities);
router.get('/:id/progress-data', verifyToken, studentsController.getProgressData);
router.get('/:id/enrolled-classes', verifyToken, studentsController.getEnrolledClasses);
router.get('/:id/recommended-modules', verifyToken, studentsController.getRecommendedModules);

// progress.routes.js (new)
router.get('/student/:studentId', verifyToken, progressController.getStudentProgress);
router.get('/student/:studentId/module/:moduleId', verifyToken, progressController.getModuleProgress);
router.post('/', verifyToken, progressController.saveProgress);
router.put('/:id/percentage', verifyToken, progressController.updateProgressPercentage);
router.delete('/:id', verifyToken, progressController.deleteProgress);

// completions.routes.js (enhanced)
router.get('/student/:studentId', verifyToken, completionsController.getStudentCompletions);
router.get('/student/:studentId/module/:moduleId', verifyToken, completionsController.getModuleCompletion);
router.post('/', verifyToken, completionsController.createCompletion);
router.get('/student/:studentId/stats', verifyToken, completionsController.getCompletionStats);
router.get('/module/:moduleId', verifyToken, completionsController.getModuleCompletions);

// submissions.routes.js (new)
router.get('/', verifyToken, submissionsController.getSubmissions);
router.get('/student/:studentId/module/:moduleId/section/:sectionId', verifyToken, submissionsController.getSectionSubmission);
router.post('/', verifyToken, submissionsController.createSubmission);
router.put('/:id', verifyToken, submissionsController.updateSubmission);
router.put('/:id/grade', verifyToken, requireTeacher, submissionsController.gradeSubmission);
router.get('/stats', verifyToken, submissionsController.getSubmissionStats);
```

## Data Models

### Progress Model

```javascript
class Progress {
  static tableName = 'vark_module_progress';
  
  static fields = {
    id: 'VARCHAR(36) PRIMARY KEY',
    student_id: 'VARCHAR(36) NOT NULL',
    module_id: 'VARCHAR(36) NOT NULL',
    progress_percentage: 'INT DEFAULT 0',
    sections_completed: 'JSON',
    last_section_id: 'VARCHAR(36)',
    time_spent_minutes: 'INT DEFAULT 0',
    status: 'ENUM("not_started", "in_progress", "completed") DEFAULT "not_started"',
    started_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    UNIQUE KEY: '(student_id, module_id)',
    FOREIGN KEY: 'student_id REFERENCES users(id) ON DELETE CASCADE',
    FOREIGN KEY: 'module_id REFERENCES vark_modules(id) ON DELETE CASCADE'
  };
}
```

### Submission Model

```javascript
class Submission {
  static tableName = 'student_submissions';
  
  static fields = {
    id: 'VARCHAR(36) PRIMARY KEY',
    student_id: 'VARCHAR(36) NOT NULL',
    module_id: 'VARCHAR(36) NOT NULL',
    section_id: 'VARCHAR(255) NOT NULL',
    answer_content: 'JSON NOT NULL',
    score: 'DECIMAL(5,2)',
    feedback: 'TEXT',
    submitted_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    graded_at: 'TIMESTAMP NULL',
    graded_by: 'VARCHAR(36)',
    UNIQUE KEY: '(student_id, module_id, section_id)',
    FOREIGN KEY: 'student_id REFERENCES users(id) ON DELETE CASCADE',
    FOREIGN KEY: 'module_id REFERENCES vark_modules(id) ON DELETE CASCADE',
    FOREIGN KEY: 'graded_by REFERENCES users(id) ON DELETE SET NULL'
  };
}
```

### Completion Model (Already Exists - Enhanced)

```javascript
class Completion {
  static tableName = 'module_completions';
  
  static fields = {
    id: 'VARCHAR(36) PRIMARY KEY',
    student_id: 'VARCHAR(36) NOT NULL',
    module_id: 'VARCHAR(36) NOT NULL',
    completion_date: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    final_score: 'DECIMAL(5,2) NOT NULL',
    time_spent_minutes: 'INT DEFAULT 0',
    perfect_sections: 'INT DEFAULT 0',
    badge_earned: 'VARCHAR(255)',
    UNIQUE KEY: '(student_id, module_id)',
    FOREIGN KEY: 'student_id REFERENCES users(id) ON DELETE CASCADE',
    FOREIGN KEY: 'module_id REFERENCES vark_modules(id) ON DELETE CASCADE'
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dashboard Statistics Accuracy

*For any* student ID, when dashboard statistics are requested, the returned completed modules count SHALL equal the number of records in the completions table for that student.

**Validates: Requirements 1.2, 9.2**

### Property 2: Progress Percentage Bounds

*For any* progress record, the progress percentage SHALL be between 0 and 100 inclusive.

**Validates: Requirements 3.2, 3.4**

### Property 3: Progress Persistence

*For any* student and module, when progress is saved, immediately fetching that progress SHALL return the same progress percentage.

**Validates: Requirements 3.4**

### Property 4: Completion Uniqueness

*For any* student and module combination, there SHALL exist at most one completion record.

**Validates: Requirements 4.2**

### Property 5: Completion Implies Progress

*For any* completed module, there SHALL exist a corresponding progress record with 100% progress or a status of 'completed'.

**Validates: Requirements 4.1, 4.2**

### Property 6: Submission Uniqueness Per Section

*For any* student, module, and section combination, there SHALL exist at most one submission record.

**Validates: Requirements 5.2**

### Property 7: Prerequisite Enforcement

*For any* module with a prerequisite, when checking if the module is locked, it SHALL be locked if and only if the prerequisite module is not completed.

**Validates: Requirements 6.1, 6.2, 6.4**

### Property 8: Recommended Modules Match Learning Style

*For any* student with a learning style preference, all recommended modules SHALL include that learning style in their target learning styles or have a matching category learning style.

**Validates: Requirements 8.1, 8.2**

### Property 9: Recent Activities Chronological Order

*For any* student, when recent activities are fetched, they SHALL be ordered by timestamp in descending order (most recent first).

**Validates: Requirements 10.3**

### Property 10: Data Transformation Reversibility

*For any* object with camelCase fields, converting to snake_case and then back to camelCase SHALL produce an equivalent object.

**Validates: Requirements 12.1, 12.2**

### Property 11: Module Results Export Completeness

*For any* completed module, the exported results SHALL include the module title, student name, completion data, and all submissions.

**Validates: Requirements 11.2**

### Property 12: Progress Update Monotonicity

*For any* module progress, when sections are completed, the progress percentage SHALL never decrease.

**Validates: Requirements 3.2**

### Property 13: Completion Score Validity

*For any* module completion, the final score SHALL be between 0 and 100 inclusive.

**Validates: Requirements 4.2**

### Property 14: Unified API Backend Switching

*For any* API call through the Unified API, when the feature flag is toggled, the request SHALL route to the corresponding backend without code changes.

**Validates: Requirements 15.2, 15.3, 15.4**

## Error Handling

### Error Categories

1. **Network Errors**: Connection failures, timeouts
2. **Authentication Errors**: Invalid tokens, expired sessions
3. **Authorization Errors**: Insufficient permissions
4. **Validation Errors**: Invalid input data
5. **Not Found Errors**: Resource doesn't exist
6. **Conflict Errors**: Duplicate records, constraint violations
7. **Server Errors**: Internal server errors, database errors

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
}
```

### Frontend Error Handling Strategy

```typescript
// Centralized error handler
function handleAPIError(error: any, context: string) {
  console.error(`${context} error:`, error);
  
  if (error.code === 'NETWORK_ERROR') {
    toast.error('Connection problem. Please check your internet and try again.');
  } else if (error.code === 'UNAUTHORIZED') {
    toast.error('Session expired. Please log in again.');
    router.push('/auth/login');
  } else if (error.code === 'NOT_FOUND') {
    toast.error('Resource not found.');
  } else {
    toast.error(error.message || 'An unexpected error occurred.');
  }
}
```

### Backend Error Handling

```javascript
// Centralized error middleware
function errorHandler(err, req, res, next) {
  logger.error('Error:', err);
  
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: err.message || 'An error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    }
  });
}
```

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases for individual functions and components.

**Test Coverage:**
- API client methods with mock responses
- Data transformation functions (camelCase ↔ snake_case)
- Progress percentage calculations
- Prerequisite checking logic
- Recommended modules filtering
- Error handling functions

**Example Unit Tests:**
```typescript
describe('ExpressStudentDashboardAPI', () => {
  it('should fetch dashboard stats for a student', async () => {
    const stats = await ExpressStudentDashboardAPI.getDashboardStats('student-123');
    expect(stats).toHaveProperty('modulesCompleted');
    expect(stats).toHaveProperty('averageScore');
  });
  
  it('should handle network errors gracefully', async () => {
    // Mock network failure
    const result = await ExpressStudentDashboardAPI.getDashboardStats('invalid-id');
    expect(result.modulesCompleted).toBe(0);
  });
});
```

### Property-Based Tests

Property-based tests will verify universal properties across many generated inputs.

**Configuration:**
- Minimum 100 iterations per property test
- Use fast-check library for TypeScript
- Tag each test with property number and requirement reference

**Example Property Tests:**
```typescript
import fc from 'fast-check';

describe('Property 2: Progress Percentage Bounds', () => {
  it('progress percentage should always be between 0 and 100', () => {
    /**
     * Feature: student-pages-api-migration
     * Property 2: Progress Percentage Bounds
     * Validates: Requirements 3.2, 3.4
     */
    fc.assert(
      fc.property(
        fc.record({
          student_id: fc.uuid(),
          module_id: fc.uuid(),
          progress_percentage: fc.integer({ min: -100, max: 200 })
        }),
        async (progressData) => {
          const result = await saveProgress(progressData);
          expect(result.progress_percentage).toBeGreaterThanOrEqual(0);
          expect(result.progress_percentage).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 10: Data Transformation Reversibility', () => {
  it('camelCase to snake_case and back should be identity', () => {
    /**
     * Feature: student-pages-api-migration
     * Property 10: Data Transformation Reversibility
     * Validates: Requirements 12.1, 12.2
     */
    fc.assert(
      fc.property(
        fc.record({
          firstName: fc.string(),
          lastName: fc.string(),
          learningStyle: fc.constantFrom('visual', 'auditory', 'reading_writing', 'kinesthetic'),
          progressPercentage: fc.integer({ min: 0, max: 100 })
        }),
        (obj) => {
          const snakeCase = toSnakeCase(obj);
          const backToCamel = toCamelCase(snakeCase);
          expect(backToCamel).toEqual(obj);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

Integration tests will verify end-to-end workflows across multiple components.

**Test Scenarios:**
- Student completes a module from start to finish
- Student views dashboard after completing modules
- Student filters modules by learning style
- Student views results for completed module
- Prerequisite module unlocks dependent module

### Testing Tools

- **Unit Tests**: Jest, React Testing Library
- **Property Tests**: fast-check
- **Integration Tests**: Cypress or Playwright
- **API Tests**: Supertest
- **Mocking**: MSW (Mock Service Worker)

## Implementation Notes

### Data Transformation

All data transformation between camelCase (frontend) and snake_case (backend) will be handled by utility functions:

```typescript
// utils/caseConversion.ts
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}

export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
}
```

### Feature Flag Management

The `NEXT_PUBLIC_USE_NEW_API` environment variable controls backend routing:

```typescript
// .env
NEXT_PUBLIC_USE_NEW_API=true  # Use Express backend
NEXT_PUBLIC_USE_NEW_API=false # Use Supabase backend
```

### Loading States

All pages will implement consistent loading states:

```typescript
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);

// Initial load
useEffect(() => {
  loadData().finally(() => setLoading(false));
}, []);

// Refresh
const handleRefresh = async () => {
  setRefreshing(true);
  await loadData();
  setRefreshing(false);
};
```

### Caching Strategy

- Use React Query for client-side caching
- Cache dashboard stats for 5 minutes
- Cache module list for 10 minutes
- Invalidate cache on mutations (progress updates, completions)

### Performance Optimization

- Lazy load module content
- Paginate large lists (modules, activities)
- Debounce search inputs
- Use virtual scrolling for long lists
- Optimize images and assets

## Migration Strategy

### Phase 1: Create Backend Infrastructure
1. Create Progress, Submission models
2. Create Progress, Submission controllers
3. Create new routes
4. Add database migrations

### Phase 2: Create Frontend API Clients
1. Create ExpressStudentDashboardAPI
2. Create ExpressStudentProgressAPI
3. Create ExpressStudentCompletionsAPI
4. Create ExpressStudentSubmissionsAPI
5. Add to Unified API layer

### Phase 3: Update Student Pages
1. Update Dashboard page
2. Update VARK Modules page
3. Update Classes page
4. Update Profile page

### Phase 4: Testing and Validation
1. Run unit tests
2. Run property-based tests
3. Run integration tests
4. Manual testing with real data
5. Performance testing

### Phase 5: Gradual Rollout
1. Enable for test users
2. Monitor errors and performance
3. Fix issues
4. Enable for all users
5. Remove Supabase fallback code

## Security Considerations

- All endpoints require authentication via JWT tokens
- Student endpoints verify user owns the requested data
- Teacher endpoints require teacher role
- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS prevention via output encoding
- CSRF protection via SameSite cookies
- Rate limiting on API endpoints

## Monitoring and Logging

- Log all API requests with user ID and endpoint
- Log all errors with stack traces
- Monitor API response times
- Track feature flag usage
- Alert on error rate spikes
- Dashboard for API health metrics
