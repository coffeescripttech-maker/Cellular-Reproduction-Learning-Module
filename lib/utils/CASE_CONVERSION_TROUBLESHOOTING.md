# Case Conversion Troubleshooting Guide

## Common Issue: Validation Error "Student ID is required"

### Problem

You may see this error even though you're sending `student_id` and `module_id` in your payload:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": ["Student ID is required", "Module ID is required"]
  }
}
```

**Payload being sent:**
```json
{
  "student_id": "4b1559f1-758d-4fc7-9cf6-dead1c43d7aa",
  "module_id": "20a92752-921f-478e-87cd-42bae4d6dc99",
  "progress_percentage": 7,
  "status": "in_progress",
  "completed_sections": ["a546e6c3-c9a8-411d-b65d-5d814cdfc709"],
  "current_section_id": "93abbdd7-6a54-43a4-b65d-5d814cdfc709",
  "time_spent_minutes": 0,
  "assessment_scores": {}
}
```

### Root Cause

The frontend is sending data in **snake_case** format, but some backend validation logic expects **camelCase** format (or vice versa). This mismatch causes validation to fail even though the data is present.

### Solution

The case conversion utilities automatically handle this by:

1. **Converting frontend data to snake_case before sending to backend**
2. **Converting backend responses to camelCase for frontend use**

### How It Works

#### Before (Without Case Conversion)

```typescript
// Frontend sends camelCase
const progressData = {
  studentId: '123',
  moduleId: '456',
  progressPercentage: 75
};

// Backend expects snake_case
// ❌ Validation fails: "Student ID is required"
```

#### After (With Case Conversion)

```typescript
import { toSnakeCase } from '../utils/caseConversion';

// Frontend sends camelCase
const progressData = {
  studentId: '123',
  moduleId: '456',
  progressPercentage: 75
};

// Convert to snake_case before sending
const backendData = toSnakeCase(progressData);
// {
//   student_id: '123',
//   module_id: '456',
//   progress_percentage: 75
// }

// ✅ Backend validation passes
```

### Verification

To verify the case conversion is working:

1. **Check the API client is using case conversion:**
   ```typescript
   // In express-student-progress.ts
   import { toSnakeCase, toCamelCase } from '../utils/caseConversion';
   
   // Before sending to backend
   const snakeCaseData = toSnakeCase(progressData);
   const response = await expressClient.post('/api/progress', snakeCaseData);
   
   // After receiving from backend
   return toCamelCase(response.data);
   ```

2. **Check the network request in browser DevTools:**
   - Open Network tab
   - Find the API request
   - Check the Request Payload
   - Verify fields are in snake_case (e.g., `student_id`, not `studentId`)

3. **Check the backend logs:**
   - Backend should log the received data
   - Verify it's receiving snake_case fields

### API Clients Using Case Conversion

The following API clients automatically handle case conversion:

- ✅ `express-student-progress.ts`
- ✅ `express-student-completions.ts`
- ✅ `express-student-submissions.ts`

### Backend Compatibility

The backend controllers have been updated to accept **both** camelCase and snake_case:

```javascript
// Progress Controller accepts both formats
const studentId = progressData.studentId || progressData.student_id;
const moduleId = progressData.moduleId || progressData.module_id;
```

However, it's still recommended to send snake_case for consistency with the database schema.

### Testing Case Conversion

To test the case conversion utilities:

```typescript
import { toSnakeCase, toCamelCase } from '../utils/caseConversion';

// Test round-trip conversion
const original = {
  studentId: '123',
  moduleId: '456',
  progressPercentage: 75,
  completedSections: ['section1', 'section2']
};

const snakeCase = toSnakeCase(original);
console.log(snakeCase);
// {
//   student_id: '123',
//   module_id: '456',
//   progress_percentage: 75,
//   completed_sections: ['section1', 'section2']
// }

const backToCamel = toCamelCase(snakeCase);
console.log(backToCamel);
// Should match original exactly
console.assert(JSON.stringify(backToCamel) === JSON.stringify(original));
```

### Common Pitfalls

1. **Not importing the utility:**
   ```typescript
   // ❌ Wrong - using local function or not converting
   const response = await expressClient.post('/api/progress', progressData);
   
   // ✅ Correct - using centralized utility
   import { toSnakeCase } from '../utils/caseConversion';
   const response = await expressClient.post('/api/progress', toSnakeCase(progressData));
   ```

2. **Forgetting to convert response data:**
   ```typescript
   // ❌ Wrong - returning snake_case to frontend
   return response.data;
   
   // ✅ Correct - converting to camelCase
   return toCamelCase(response.data);
   ```

3. **Converting Date objects:**
   The utility properly handles Date objects and doesn't try to convert them:
   ```typescript
   const data = {
     createdAt: new Date(),
     studentId: '123'
   };
   
   const converted = toSnakeCase(data);
   // {
   //   created_at: Date object (unchanged),
   //   student_id: '123'
   // }
   ```

### Debugging Tips

1. **Add console logs to see the conversion:**
   ```typescript
   console.log('Before conversion:', progressData);
   const snakeCaseData = toSnakeCase(progressData);
   console.log('After conversion:', snakeCaseData);
   ```

2. **Check the network request payload:**
   - Open browser DevTools
   - Go to Network tab
   - Find the API request
   - Click on it and check the "Payload" or "Request" tab
   - Verify the field names are in snake_case

3. **Check backend logs:**
   - Backend should log received data
   - Look for validation error messages
   - Check what fields the backend is expecting

### Related Files

- **Utility:** `lib/utils/caseConversion.ts`
- **Tests:** `lib/utils/__tests__/caseConversion.property.test.ts`
- **API Clients:**
  - `lib/api/express-student-progress.ts`
  - `lib/api/express-student-completions.ts`
  - `lib/api/express-student-submissions.ts`

### Support

If you continue to experience validation errors:

1. Verify the API client is importing and using the case conversion utilities
2. Check the network request to confirm snake_case is being sent
3. Check backend logs to see what data is being received
4. Verify the backend controller is accepting the correct field names
5. Check if there are any middleware or validation layers that might be interfering

## Summary

The case conversion utilities ensure consistent data format between frontend (camelCase) and backend (snake_case), preventing validation errors and ensuring smooth data flow throughout the application.
