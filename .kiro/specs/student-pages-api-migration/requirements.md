# Requirements Document: Student Pages API Migration

## Introduction

This specification defines the requirements for migrating all student-facing pages from Supabase to the Express.js/MySQL backend. The migration ensures that students can access their learning modules, track progress, view completions, and interact with all learning features through the new unified API architecture.

## Glossary

- **Student_Portal**: The collection of web pages accessible to users with the 'student' role
- **Unified_API**: The API abstraction layer that switches between Supabase and Express backends based on feature flags
- **Express_Backend**: The Node.js/Express.js server with MySQL database
- **VARK_Module**: A learning module designed for specific learning styles (Visual, Auditory, Reading/Writing, Kinesthetic)
- **Module_Progress**: Student's current progress through a VARK module (percentage, sections completed)
- **Module_Completion**: Record of a student completing a VARK module with score and timestamp
- **Learning_Style**: Student's preferred learning modality (visual, auditory, reading_writing, kinesthetic)
- **Dashboard_Stats**: Aggregated statistics about student's learning activity
- **Student_Submission**: Student's answer or work submitted for a module section
- **Prerequisite_Module**: A module that must be completed before another module becomes accessible

## Requirements

### Requirement 1: Student Dashboard API Migration

**User Story:** As a student, I want to view my learning dashboard with personalized statistics and recommendations, so that I can track my progress and continue learning.

#### Acceptance Criteria

1. WHEN a student loads the dashboard, THE System SHALL fetch dashboard statistics from the Express backend
2. WHEN dashboard statistics are requested, THE System SHALL return total modules, completed modules, in-progress modules, and recent activities
3. WHEN a student has a learning style preference, THE System SHALL return recommended modules matching that learning style
4. WHEN a student views recent activities, THE System SHALL display the 5 most recent learning activities with timestamps
5. WHEN dashboard data fails to load, THE System SHALL display an error message and allow retry

### Requirement 2: VARK Modules Listing API Migration

**User Story:** As a student, I want to browse and filter available VARK modules, so that I can find learning content that matches my needs and preferences.

#### Acceptance Criteria

1. WHEN a student views the modules page, THE System SHALL fetch all published modules from the Express backend
2. WHEN modules are fetched, THE System SHALL include module metadata (title, description, difficulty, duration, learning styles)
3. WHEN a student searches for modules, THE System SHALL filter modules by title and description
4. WHEN a student filters by subject, THE System SHALL return only modules matching that subject
5. WHEN a student filters by difficulty, THE System SHALL return only modules matching that difficulty level
6. WHEN a student views modules, THE System SHALL display their progress percentage for each module
7. WHEN a student views modules, THE System SHALL indicate which modules are completed, in-progress, or not started

### Requirement 3: Module Progress Tracking API Migration

**User Story:** As a student, I want my progress through modules to be tracked and persisted, so that I can resume learning where I left off.

#### Acceptance Criteria

1. WHEN a student starts a module, THE System SHALL create a progress record in the Express backend
2. WHEN a student completes a module section, THE System SHALL update the progress percentage
3. WHEN a student views a module, THE System SHALL fetch their current progress from the Express backend
4. WHEN progress is updated, THE System SHALL persist changes immediately to the database
5. WHEN a student has multiple modules in progress, THE System SHALL track each module's progress independently

### Requirement 4: Module Completion API Migration

**User Story:** As a student, I want my module completions to be recorded with scores and timestamps, so that I can track my achievements and view my results.

#### Acceptance Criteria

1. WHEN a student completes all sections of a module, THE System SHALL create a completion record in the Express backend
2. WHEN a completion is recorded, THE System SHALL include student ID, module ID, completion timestamp, and score
3. WHEN a student views completed modules, THE System SHALL display completion badges with scores
4. WHEN a student clicks "View Results" on a completed module, THE System SHALL fetch detailed completion data
5. WHEN completion data is fetched, THE System SHALL include all section submissions and scores

### Requirement 5: Module Submissions API Migration

**User Story:** As a student, I want to submit my answers for module sections and receive feedback, so that I can learn and improve my understanding.

#### Acceptance Criteria

1. WHEN a student submits an answer for a module section, THE System SHALL save the submission to the Express backend
2. WHEN a submission is saved, THE System SHALL include student ID, module ID, section ID, answer content, and timestamp
3. WHEN a student views their submissions, THE System SHALL fetch all submissions for that module from the Express backend
4. WHEN submissions are fetched, THE System SHALL include scores and feedback if available
5. WHEN a submission fails to save, THE System SHALL display an error message and allow retry

### Requirement 6: Prerequisite Module Enforcement

**User Story:** As a student, I want modules with prerequisites to be locked until I complete the required modules, so that I learn content in the proper sequence.

#### Acceptance Criteria

1. WHEN a module has a prerequisite module, THE System SHALL check if the prerequisite is completed
2. WHEN a prerequisite is not completed, THE System SHALL display the module as locked
3. WHEN a student clicks on a locked module, THE System SHALL display which prerequisite must be completed first
4. WHEN a prerequisite is completed, THE System SHALL automatically unlock dependent modules
5. WHEN a module has no prerequisite, THE System SHALL display it as unlocked

### Requirement 7: Student Classes API Migration

**User Story:** As a student, I want to view my enrolled classes and class-specific modules, so that I can access content assigned by my teachers.

#### Acceptance Criteria

1. WHEN a student views their classes, THE System SHALL fetch enrolled classes from the Express backend
2. WHEN classes are fetched, THE System SHALL include class name, subject, teacher, and student count
3. WHEN a student filters modules by class, THE System SHALL return only modules assigned to that class
4. WHEN a student is not enrolled in any classes, THE System SHALL display an appropriate message
5. WHEN class data fails to load, THE System SHALL handle the error gracefully without breaking the page

### Requirement 8: Recommended Modules Algorithm

**User Story:** As a student, I want to see modules recommended for my learning style, so that I can focus on content that matches how I learn best.

#### Acceptance Criteria

1. WHEN a student has a learning style preference, THE System SHALL filter modules by target learning styles
2. WHEN multiple modules match a learning style, THE System SHALL prioritize modules the student hasn't started
3. WHEN a student has a multimodal learning type, THE System SHALL recommend modules for all preferred styles
4. WHEN no modules match a learning style, THE System SHALL display all available modules
5. WHEN a student updates their learning style, THE System SHALL refresh recommendations immediately

### Requirement 9: Dashboard Statistics Calculation

**User Story:** As a system, I want to calculate accurate dashboard statistics for students, so that they can see meaningful progress metrics.

#### Acceptance Criteria

1. WHEN dashboard statistics are requested, THE System SHALL count total published modules available to the student
2. WHEN counting completed modules, THE System SHALL query the completions table for that student
3. WHEN counting in-progress modules, THE System SHALL query the progress table for modules with 0 < progress < 100
4. WHEN calculating average score, THE System SHALL average all completion scores for that student
5. WHEN no completions exist, THE System SHALL return zero for completed modules and average score

### Requirement 10: Recent Activities Timeline

**User Story:** As a student, I want to see my recent learning activities in chronological order, so that I can track what I've been working on.

#### Acceptance Criteria

1. WHEN recent activities are requested, THE System SHALL fetch the 5 most recent activities from the Express backend
2. WHEN activities are fetched, THE System SHALL include activity type, module title, timestamp, and status
3. WHEN activities are displayed, THE System SHALL show relative timestamps (e.g., "2 hours ago")
4. WHEN an activity is a completion, THE System SHALL display the score achieved
5. WHEN an activity is in-progress, THE System SHALL display the current progress percentage

### Requirement 11: Module Results Export

**User Story:** As a student, I want to download my module results as a file, so that I can keep a record of my learning achievements.

#### Acceptance Criteria

1. WHEN a student clicks "Download Results" on a completed module, THE System SHALL generate a JSON file
2. WHEN results are exported, THE System SHALL include module title, student name, completion data, and all submissions
3. WHEN the export is generated, THE System SHALL trigger a browser download
4. WHEN the export fails, THE System SHALL display an error message
5. WHEN the export succeeds, THE System SHALL display a success confirmation

### Requirement 12: Data Compatibility and Transformation

**User Story:** As a system, I want to transform data between frontend camelCase and backend snake_case formats, so that both layers work correctly.

#### Acceptance Criteria

1. WHEN the frontend sends data to the Express backend, THE System SHALL convert camelCase field names to snake_case
2. WHEN the Express backend returns data to the frontend, THE System SHALL convert snake_case field names to camelCase
3. WHEN nested objects are transformed, THE System SHALL recursively convert all field names
4. WHEN arrays of objects are transformed, THE System SHALL convert field names for each object
5. WHEN transformation fails, THE System SHALL log the error and return the original data

### Requirement 13: Error Handling and User Feedback

**User Story:** As a student, I want clear error messages when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN an API request fails, THE System SHALL display a user-friendly error message
2. WHEN a network error occurs, THE System SHALL indicate the connection problem and suggest retry
3. WHEN authentication fails, THE System SHALL redirect to the login page
4. WHEN data fails to load, THE System SHALL display a retry button
5. WHEN an error is displayed, THE System SHALL log the technical details to the console for debugging

### Requirement 14: Loading States and User Experience

**User Story:** As a student, I want to see loading indicators when data is being fetched, so that I know the system is working.

#### Acceptance Criteria

1. WHEN a page is loading data, THE System SHALL display a loading spinner
2. WHEN data is being refreshed, THE System SHALL display a refresh indicator
3. WHEN a loading state exceeds 5 seconds, THE System SHALL display a message indicating the delay
4. WHEN data finishes loading, THE System SHALL remove the loading indicator immediately
5. WHEN multiple data sources are loading, THE System SHALL show a single unified loading state

### Requirement 15: Unified API Integration

**User Story:** As a system, I want all student pages to use the Unified API layer, so that the backend can be switched via feature flag.

#### Acceptance Criteria

1. WHEN a student page makes an API call, THE System SHALL use the Unified API exports
2. WHEN the NEXT_PUBLIC_USE_NEW_API flag is true, THE System SHALL route requests to the Express backend
3. WHEN the NEXT_PUBLIC_USE_NEW_API flag is false, THE System SHALL route requests to the Supabase backend
4. WHEN the feature flag changes, THE System SHALL use the new backend without code changes
5. WHEN an API method is not implemented in the Express backend, THE System SHALL fall back to Supabase gracefully
