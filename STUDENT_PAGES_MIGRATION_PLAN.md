# Student Pages Migration Plan

**Date:** January 15, 2026  
**Status:** 📋 PLANNING  
**Directory:** `app/student/`

---

## Overview

This document outlines the plan for reviewing and migrating all student-facing pages from Supabase to Express backend. We'll systematically review each page, identify API operations, ensure backend endpoints exist, and verify data compatibility.

---

## Student Pages Inventory

Based on the file tree and documentation:

### 1. **Student Dashboard** (`/student/dashboard`)
- **Priority:** 🔴 HIGH
- **Complexity:** Medium
- **APIs Used:** StudentDashboardAPI, StatsAPI
- **Status:** ⏳ Not yet migrated (per API_MIGRATION_REVIEW.md)

### 2. **Student Profile** (`/student/profile`)
- **Priority:** 🟡 MEDIUM
- **Complexity:** Low
- **APIs Used:** ProfileAPI (bypassed via useAuth)
- **Status:** ✅ Already handled through unified auth

### 3. **Student Classes** (`/student/classes`)
- **Priority:** 🟡 MEDIUM
- **Complexity:** Medium
- **APIs Used:** ClassesAPI
- **Status:** ⏳ Not yet migrated

### 4. **Student Lessons** (`/student/lessons`)
- **Priority:** 🟢 LOW
- **Complexity:** Low
- **APIs Used:** None (placeholder page)
- **Status:** ✅ No migration needed (coming soon page)

### 5. **Student VARK Modules** (`/student/vark-modules`)
- **Priority:** 🔴 HIGH
- **Complexity:** High
- **APIs Used:** VARKModulesAPI, CompletionsAPI
- **Status:** ⏳ Needs review

### 6. **Student Activities** (`/student/activities`)
- **Priority:** 🟡 MEDIUM
- **Complexity:** Medium
- **APIs Used:** ActivitiesAPI
- **Status:** ⏳ Needs review

### 7. **Student Quizzes** (`/student/quizzes`)
- **Priority:** 🟡 MEDIUM
- **Complexity:** Medium
- **APIs Used:** QuizzesAPI
- **Status:** ⏳ Needs review

---

## Migration Phases

### Phase 1: High Priority Pages (Week 1)
Focus on core student functionality:

1. **Student Dashboard** - Main landing page
2. **Student VARK Modules** - Core learning functionality

### Phase 2: Medium Priority Pages (Week 2)
Secondary functionality:

3. **Student Classes** - Class enrollment and management
4. **Student Activities** - Activity completion
5. **Student Quizzes** - Quiz taking
6. **Student Profile** - Profile management

### Phase 3: Low Priority Pages (Week 3)
Future features:

7. **Student Lessons** - Already placeholder, no work needed

---

## Review Checklist (Per Page)

For each page, we'll verify:

### API Operations
- [ ] List all API calls made by the page
- [ ] Identify which API client is used (Supabase vs Express)
- [ ] Check if `NEXT_PUBLIC_USE_NEW_API` flag is respected
- [ ] Verify unified API is used where available

### Backend Endpoints
- [ ] Confirm corresponding Express endpoint exists
- [ ] Verify endpoint is properly authenticated
- [ ] Check authorization (student role access)
- [ ] Ensure proper error handling

### Data Compatibility
- [ ] Compare frontend data structure expectations
- [ ] Verify backend response format matches
- [ ] Check field name conversions (camelCase ↔ snake_case)
- [ ] Validate data types match
- [ ] Test with real data

### Components
- [ ] Review child components for API calls
- [ ] Check hooks for API dependencies
- [ ] Verify state management compatibility

---

## Detailed Page Analysis

### 1. Student Dashboard (`/student/dashboard/page.tsx`)

**Expected API Operations:**
```typescript
// Dashboard statistics
StudentDashboardAPI.getStats(studentId)
// Returns: {
//   totalModules, completedModules, inProgressModules,
//   averageScore, totalTimeSpent, badges, recentActivity
// }

// Recent completions
VARKModulesAPI.getStudentCompletions(studentId)

// Recommended modules
VARKModulesAPI.getRecommendedModules(studentId, learningStyle)
```

**Required Backend Endpoints:**
- `GET /api/students/:id/stats` - ✅ EXISTS (students.controller.js)
- `GET /api/students/:id/completions` - ❓ NEEDS VERIFICATION
- `GET /api/modules/recommended` - ❓ NEEDS CREATION

**Data Structure:**
```typescript
interface DashboardStats {
  total_modules: number;
  completed_modules: number;
  in_progress_modules: number;
  average_score: number;
  total_time_spent: number;
  badges_earned: number;
  recent_activity: Activity[];
}
```

---

### 2. Student VARK Modules (`/student/vark-modules/`)

**Expected API Operations:**
```typescript
// List available modules
VARKModulesAPI.getModules({ learningStyle, isPublished: true })

// Get module details
VARKModulesAPI.getModuleById(moduleId)

// Start module
VARKModulesAPI.startModule(studentId, moduleId)

// Save progress
VARKModulesAPI.saveProgress(studentId, moduleId, progressData)

// Complete module
VARKModulesAPI.completeModule(studentId, moduleId, completionData)

// Get student progress
VARKModulesAPI.getStudentModuleProgress(studentId, moduleId)
```

**Required Backend Endpoints:**
- `GET /api/modules` - ✅ EXISTS
- `GET /api/modules/:id` - ✅ EXISTS
- `POST /api/progress` - ❓ NEEDS VERIFICATION
- `PUT /api/progress/:id` - ❓ NEEDS VERIFICATION
- `POST /api/completions` - ❓ NEEDS VERIFICATION
- `GET /api/students/:studentId/modules/:moduleId/progress` - ❓ NEEDS VERIFICATION

---

### 3. Student Classes (`/student/classes/page.tsx`)

**Expected API Operations:**
```typescript
// Get enrolled classes
ClassesAPI.getStudentClasses(studentId)

// Get available classes
ClassesAPI.getAvailableClasses()

// Enroll in class
ClassesAPI.enrollInClass(studentId, classId)

// Leave class
ClassesAPI.leaveClass(studentId, classId)
```

**Required Backend Endpoints:**
- `GET /api/students/:id/classes` - ❓ NEEDS CREATION
- `GET /api/classes` - ❓ NEEDS VERIFICATION
- `POST /api/classes/:id/enroll` - ❓ NEEDS CREATION
- `DELETE /api/classes/:id/enroll` - ❓ NEEDS CREATION

---

### 4. Student Activities (`/student/activities/`)

**Expected API Operations:**
```typescript
// Get activities for module
ActivitiesAPI.getModuleActivities(moduleId)

// Submit activity
ActivitiesAPI.submitActivity(studentId, activityId, submission)

// Get activity results
ActivitiesAPI.getActivityResults(studentId, activityId)
```

**Required Backend Endpoints:**
- `GET /api/modules/:id/activities` - ❓ NEEDS CREATION
- `POST /api/activities/:id/submit` - ❓ NEEDS CREATION
- `GET /api/students/:studentId/activities/:activityId/results` - ❓ NEEDS CREATION

---

### 5. Student Quizzes (`/student/quizzes/`)

**Expected API Operations:**
```typescript
// Get quizzes for module
QuizzesAPI.getModuleQuizzes(moduleId)

// Start quiz
QuizzesAPI.startQuiz(studentId, quizId)

// Submit quiz
QuizzesAPI.submitQuiz(studentId, quizId, answers)

// Get quiz results
QuizzesAPI.getQuizResults(studentId, quizId)
```

**Required Backend Endpoints:**
- `GET /api/modules/:id/quizzes` - ❓ NEEDS CREATION
- `POST /api/quizzes/:id/start` - ❓ NEEDS CREATION
- `POST /api/quizzes/:id/submit` - ❓ NEEDS CREATION
- `GET /api/students/:studentId/quizzes/:quizId/results` - ❓ NEEDS CREATION

---

## Implementation Strategy

### Step 1: Audit Current State
1. List all student pages
2. Identify API calls in each page
3. Check which APIs are already migrated
4. Document missing endpoints

### Step 2: Create Missing Backend Endpoints
For each missing endpoint:
1. Create controller method
2. Create route
3. Add authentication/authorization
4. Test with Postman/curl

### Step 3: Create/Update Frontend API Clients
1. Create Express API clients for missing APIs
2. Add to unified API layer
3. Ensure data conversion (snake_case ↔ camelCase)

### Step 4: Update Student Pages
1. Replace direct Supabase calls with unified API
2. Update data structure handling
3. Add error handling
4. Test functionality

### Step 5: Testing
1. Test each page individually
2. Test complete student workflows
3. Test with different learning styles
4. Test error scenarios

---

## Database Tables Needed

Based on student functionality:

### Already Exist
- ✅ `users` - Student accounts
- ✅ `profiles` - Student profiles
- ✅ `modules` - VARK modules
- ✅ `completions` - Module completions (just created)

### May Need Creation
- ❓ `progress` - Student module progress
- ❓ `enrollments` - Class enrollments
- ❓ `activities` - Activity definitions
- ❓ `activity_submissions` - Student activity submissions
- ❓ `quizzes` - Quiz definitions
- ❓ `quiz_attempts` - Student quiz attempts
- ❓ `badges` - Badge definitions
- ❓ `student_badges` - Earned badges

---

## Success Criteria

For each page:
- [ ] All API calls use unified API layer
- [ ] All backend endpoints exist and work
- [ ] Data structures are compatible
- [ ] Authentication/authorization works
- [ ] Error handling is robust
- [ ] Page loads without errors
- [ ] All features work as expected
- [ ] No Supabase dependencies remain

---

## Next Steps

1. **Immediate:** Review student dashboard page
2. **Then:** Review student VARK modules pages
3. **After:** Create missing backend endpoints
4. **Finally:** Update remaining student pages

---

## Notes

- Student pages are critical for user experience
- Focus on core learning functionality first
- Ensure smooth migration with no downtime
- Keep Supabase as fallback during migration
- Test thoroughly before full rollout

---

## Timeline Estimate

- **Phase 1 (High Priority):** 3-5 days
- **Phase 2 (Medium Priority):** 5-7 days
- **Phase 3 (Low Priority):** 1-2 days
- **Testing & Fixes:** 2-3 days

**Total:** 11-17 days (2-3 weeks)

---

**Status Legend:**
- ✅ Complete
- ⏳ In Progress
- ❓ Needs Investigation
- ❌ Blocked
- 🔴 High Priority
- 🟡 Medium Priority
- 🟢 Low Priority
