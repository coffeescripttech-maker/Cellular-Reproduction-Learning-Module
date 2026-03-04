# Student Pages API - Payload Reference Guide

This document provides sample payloads for all student-facing API endpoints.

## Authentication

All endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Progress API

### Create Progress Record

**Endpoint:** `POST /api/progress`

**Payload:**
```json
{
  "studentId": "550e8400-e29b-41d4-a716-446655440000",
  "moduleId": "660e8400-e29b-41d4-a716-446655440001",
  "status": "in_progress",
  "progressPercentage": 25,
  "currentSectionId": "section-1",
  "timeSpentMinutes": 15,
  "completedSections": ["section-1", "section-2"],
  "assessmentScores": {
    "section-1": 85,
    "section-2": 90
  }
}
```

**Required Fields:**
- `studentId` (string, UUID) - ID of the student
- `moduleId` (string, UUID) - ID of the module

**Optional Fields:**
- `status` (string) - One of: "not_started", "in_progress", "completed", "paused" (default: "not_started")
- `progressPercentage` (number) - 0-100 (default: 0)
- `currentSectionId` (string) - ID of the current section
- `timeSpentMinutes` (number) - Time spent in minutes (default: 0)
- `completedSections` (array) - Array of completed section IDs
- `assessmentScores` (object) - Object mapping section IDs to scores

**Response:**
```json
{
  "message": "Progress record created successfully",
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "studentId": "550e8400-e29b-41d4-a716-446655440000",
    "moduleId": "660e8400-e29b-41d4-a716-446655440001",
    "status": "in_progress",
    "progressPercentage": 25,
    "currentSectionId": "section-1",
    "timeSpentMinutes": 15,
    "completedSections": ["section-1", "section-2"],
    "assessmentScores": {
      "section-1": 85,
      "section-2": 90
    },
    "startedAt": "2026-01-15T05:00:00.000Z",
    "lastAccessedAt": "2026-01-15T05:15:00.000Z",
    "createdAt": "2026-01-15T05:00:00.000Z",
    "updatedAt": "2026-01-15T05:15:00.000Z"
  }
}
```

### Update Progress Record

**Endpoint:** `PUT /api/progress/:id`

**Payload:**
```json
{
  "progressPercentage": 50,
  "currentSectionId": "section-3",
  "timeSpentMinutes": 30,
  "completedSections": ["section-1", "section-2", "section-3"],
  "assessmentScores": {
    "section-1": 85,
    "section-2": 90,
    "section-3": 88
  }
}
```

**Note:** Cannot update `studentId` or `moduleId`

### Update Progress by Student and Module

**Endpoint:** `PUT /api/progress/student/:studentId/module/:moduleId`

**Payload:** Same as update by ID

### Get Student Progress

**Endpoint:** `GET /api/progress/student/:studentId`

**Query Parameters:**
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 50, max: 100)
- `status` (string) - Filter by status

**Response:**
```json
{
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "studentId": "550e8400-e29b-41d4-a716-446655440000",
      "moduleId": "660e8400-e29b-41d4-a716-446655440001",
      "status": "in_progress",
      "progressPercentage": 50,
      "moduleTitle": "Cell Division",
      "studentName": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1,
    "hasMore": false
  }
}
```

### Get Progress by Student and Module

**Endpoint:** `GET /api/progress/student/:studentId/module/:moduleId`

**Response:**
```json
{
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "studentId": "550e8400-e29b-41d4-a716-446655440000",
    "moduleId": "660e8400-e29b-41d4-a716-446655440001",
    "status": "in_progress",
    "progressPercentage": 50,
    "currentSectionId": "section-3",
    "timeSpentMinutes": 30,
    "completedSections": ["section-1", "section-2", "section-3"],
    "assessmentScores": {
      "section-1": 85,
      "section-2": 90,
      "section-3": 88
    }
  }
}
```

## Completions API

### Create Completion Record

**Endpoint:** `POST /api/completions`

**Payload:**
```json
{
  "studentId": "550e8400-e29b-41d4-a716-446655440000",
  "moduleId": "660e8400-e29b-41d4-a716-446655440001",
  "finalScore": 87.5,
  "timeSpentMinutes": 120,
  "perfectSections": 3,
  "badgeEarned": "Gold Star"
}
```

**Required Fields:**
- `studentId` (string, UUID)
- `moduleId` (string, UUID)
- `finalScore` (number) - 0-100

**Optional Fields:**
- `timeSpentMinutes` (number) - Total time spent
- `perfectSections` (number) - Number of sections with perfect score
- `badgeEarned` (string) - Badge name if earned

**Response:**
```json
{
  "message": "Completion record created successfully",
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "studentId": "550e8400-e29b-41d4-a716-446655440000",
    "moduleId": "660e8400-e29b-41d4-a716-446655440001",
    "completionDate": "2026-01-15T06:00:00.000Z",
    "finalScore": 87.5,
    "timeSpentMinutes": 120,
    "perfectSections": 3,
    "badgeEarned": "Gold Star"
  }
}
```

### Get Student Completions

**Endpoint:** `GET /api/completions/student/:studentId`

**Response:**
```json
{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440003",
      "studentId": "550e8400-e29b-41d4-a716-446655440000",
      "moduleId": "660e8400-e29b-41d4-a716-446655440001",
      "moduleTitle": "Cell Division",
      "completionDate": "2026-01-15T06:00:00.000Z",
      "finalScore": 87.5,
      "timeSpentMinutes": 120,
      "perfectSections": 3,
      "badgeEarned": "Gold Star"
    }
  ]
}
```

### Get Completion by Student and Module

**Endpoint:** `GET /api/completions/student/:studentId/module/:moduleId`

**Response:**
```json
{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "studentId": "550e8400-e29b-41d4-a716-446655440000",
    "moduleId": "660e8400-e29b-41d4-a716-446655440001",
    "completionDate": "2026-01-15T06:00:00.000Z",
    "finalScore": 87.5,
    "timeSpentMinutes": 120,
    "perfectSections": 3,
    "badgeEarned": "Gold Star"
  }
}
```

### Get Completion Stats

**Endpoint:** `GET /api/completions/student/:studentId/stats`

**Response:**
```json
{
  "data": {
    "totalCompletions": 5,
    "averageScore": 85.2,
    "totalTimeSpent": 600,
    "totalPerfectSections": 12,
    "badgesEarned": ["Gold Star", "Silver Star", "Bronze Star"]
  }
}
```

## Submissions API

### Create Submission

**Endpoint:** `POST /api/submissions`

**Payload:**
```json
{
  "studentId": "550e8400-e29b-41d4-a716-446655440000",
  "moduleId": "660e8400-e29b-41d4-a716-446655440001",
  "sectionId": "section-1",
  "answerContent": {
    "question1": "The cell divides through mitosis",
    "question2": "Prophase, Metaphase, Anaphase, Telophase",
    "essay": "Cell division is a fundamental process..."
  }
}
```

**Required Fields:**
- `studentId` (string, UUID)
- `moduleId` (string, UUID)
- `sectionId` (string)
- `answerContent` (object) - Student's answers

**Optional Fields:**
- `score` (number) - Score if auto-graded
- `feedback` (string) - Feedback text

**Response:**
```json
{
  "message": "Submission created successfully",
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "studentId": "550e8400-e29b-41d4-a716-446655440000",
    "moduleId": "660e8400-e29b-41d4-a716-446655440001",
    "sectionId": "section-1",
    "answerContent": {
      "question1": "The cell divides through mitosis",
      "question2": "Prophase, Metaphase, Anaphase, Telophase"
    },
    "score": null,
    "feedback": null,
    "submittedAt": "2026-01-15T05:30:00.000Z",
    "gradedAt": null
  }
}
```

### Update Submission

**Endpoint:** `PUT /api/submissions/:id`

**Payload:**
```json
{
  "answerContent": {
    "question1": "The cell divides through mitosis and meiosis",
    "question2": "Prophase, Metaphase, Anaphase, Telophase, Cytokinesis"
  }
}
```

### Get Module Submissions

**Endpoint:** `GET /api/submissions?student_id=:studentId&module_id=:moduleId`

**Response:**
```json
{
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "studentId": "550e8400-e29b-41d4-a716-446655440000",
      "moduleId": "660e8400-e29b-41d4-a716-446655440001",
      "sectionId": "section-1",
      "answerContent": {
        "question1": "The cell divides through mitosis"
      },
      "score": 85,
      "feedback": "Good answer!",
      "submittedAt": "2026-01-15T05:30:00.000Z",
      "gradedAt": "2026-01-15T06:00:00.000Z"
    }
  ]
}
```

### Get Section Submission

**Endpoint:** `GET /api/submissions/student/:studentId/module/:moduleId/section/:sectionId`

**Response:**
```json
{
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "studentId": "550e8400-e29b-41d4-a716-446655440000",
    "moduleId": "660e8400-e29b-41d4-a716-446655440001",
    "sectionId": "section-1",
    "answerContent": {
      "question1": "The cell divides through mitosis"
    },
    "score": 85,
    "feedback": "Good answer!",
    "submittedAt": "2026-01-15T05:30:00.000Z",
    "gradedAt": "2026-01-15T06:00:00.000Z"
  }
}
```

## Student Dashboard API

### Get Dashboard Stats

**Endpoint:** `GET /api/students/:id/dashboard-stats`

**Response:**
```json
{
  "success": true,
  "data": {
    "modulesCompleted": 5,
    "modulesInProgress": 3,
    "averageScore": 85.2,
    "totalTimeSpent": 600,
    "perfectSections": 12,
    "totalModulesAvailable": 20
  }
}
```

### Get Recent Activities

**Endpoint:** `GET /api/students/:id/recent-activities`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "activity-1",
      "type": "module_completion",
      "title": "Cell Division",
      "status": "completed",
      "timestamp": "2026-01-15T06:00:00.000Z",
      "score": 87.5
    },
    {
      "id": "activity-2",
      "type": "module_progress",
      "title": "Photosynthesis",
      "status": "in_progress",
      "timestamp": "2026-01-15T05:30:00.000Z",
      "progress": 50
    }
  ]
}
```

### Get Recommended Modules

**Endpoint:** `GET /api/students/:id/recommended-modules`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "Cell Division",
      "description": "Learn about mitosis and meiosis",
      "difficulty_level": "intermediate",
      "estimated_duration_minutes": 120,
      "target_learning_styles": ["visual", "kinesthetic"]
    }
  ]
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)",
    "timestamp": "2026-01-15T05:00:00.000Z"
  }
}
```

**Common Error Codes:**
- `AUTH_UNAUTHORIZED` - No token or invalid token
- `VALIDATION_ERROR` - Invalid request data
- `DB_NOT_FOUND` - Resource not found
- `DB_DUPLICATE_ENTRY` - Duplicate record
- `INTERNAL_SERVER_ERROR` - Server error

## Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All IDs are UUIDs (v4)
3. Scores are numbers between 0 and 100
4. Progress percentages are integers between 0 and 100
5. JSON fields (completedSections, assessmentScores, answerContent) are automatically parsed
6. Field names use camelCase in requests and responses
7. Database uses snake_case internally (handled by the model layer)
