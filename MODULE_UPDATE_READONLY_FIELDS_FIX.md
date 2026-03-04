# Module Update - Read-Only Fields Fix

**Date:** January 14, 2026  
**Issue:** `PUT /api/modules/:id 400 - Cannot change module creator`  
**Status:** ✅ FIXED

---

## Problem

When updating a VARK module, the frontend was sending all module fields including read-only fields like `created_by`, `creator_name`, `created_at`, etc. The backend was rejecting the update with:

```
Error: Cannot change module creator
```

### Error Details
```
PUT http://localhost:3001/api/modules/4436de8b-9b45-49dd-9230-8600b287834f 400 (Bad Request)
Error updating module: Error: Cannot change module creator
```

### Root Cause
1. The VARK module builder component initializes `formData` with all fields from `initialData`, including read-only fields
2. When saving, it sends the entire `formData` object to the API
3. The backend validation checks for `createdBy` field and rejects the update
4. The backend was only checking for camelCase `createdBy`, not snake_case `created_by`

---

## Solution

### 1. Backend: Check Both Field Name Formats

**File:** `server/src/controllers/modules.controller.js`

**Before:**
```javascript
// Prevent changing createdBy
if (updates.createdBy) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Cannot change module creator',
      timestamp: new Date().toISOString()
    }
  });
}
```

**After:**
```javascript
// Prevent changing createdBy (check both camelCase and snake_case)
if (updates.createdBy || updates.created_by) {
  return res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Cannot change module creator',
      timestamp: new Date().toISOString()
    }
  });
}
```

### 2. Frontend: Strip Read-Only Fields Before Update

**File:** `lib/api/express-vark-modules.ts`

**Before:**
```typescript
async updateModule(id: string, data: UpdateVARKModuleData) {
  try {
    const response = await expressClient.put(`/api/modules/${id}`, data);
    // ...
  }
}
```

**After:**
```typescript
async updateModule(id: string, data: UpdateVARKModuleData) {
  try {
    // Strip out read-only fields that shouldn't be updated
    const updateData = { ...data };
    delete updateData.id;
    delete updateData.created_by;
    delete updateData.createdBy;
    delete updateData.creator_name;
    delete updateData.creatorName;
    delete updateData.created_at;
    delete updateData.createdAt;
    delete updateData.updated_at;
    delete updateData.updatedAt;
    delete updateData.category_name;
    delete updateData.categoryName;

    const response = await expressClient.put(`/api/modules/${id}`, updateData);
    // ...
  }
}
```

---

## Read-Only Fields Reference

### Fields That Should NOT Be Updated

| Field Name (snake_case) | Field Name (camelCase) | Reason |
|------------------------|------------------------|---------|
| `id` | `id` | Primary key, immutable |
| `created_by` | `createdBy` | Creator cannot be changed |
| `creator_name` | `creatorName` | Derived from JOIN, not stored |
| `created_at` | `createdAt` | Timestamp, auto-managed |
| `updated_at` | `updatedAt` | Timestamp, auto-managed |
| `category_name` | `categoryName` | Derived from JOIN, not stored |

### Fields That CAN Be Updated

| Field Name (snake_case) | Field Name (camelCase) | Type |
|------------------------|------------------------|------|
| `title` | `title` | string |
| `description` | `description` | string |
| `category_id` | `categoryId` | string |
| `learning_objectives` | `learningObjectives` | array |
| `content_structure` | `contentStructure` | object |
| `difficulty_level` | `difficultyLevel` | string |
| `estimated_duration_minutes` | `estimatedDurationMinutes` | number |
| `prerequisites` | `prerequisites` | array |
| `multimedia_content` | `multimediaContent` | object |
| `interactive_elements` | `interactiveElements` | object |
| `assessment_questions` | `assessmentQuestions` | array |
| `module_metadata` | `moduleMetadata` | object |
| `json_backup_url` | `jsonBackupUrl` | string |
| `json_content_url` | `jsonContentUrl` | string |
| `content_summary` | `contentSummary` | object |
| `target_class_id` | `targetClassId` | string |
| `target_learning_styles` | `targetLearningStyles` | array |
| `prerequisite_module_id` | `prerequisiteModuleId` | string |
| `is_published` | `isPublished` | boolean |

---

## Data Flow After Fix

### Update Module Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend: handleSave(updatedModule)                      │
│    - Module data includes all fields (read-only + writable) │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Express API Client: updateModule(id, data)               │
│    - Strips out read-only fields:                           │
│      • id, created_by, creator_name                         │
│      • created_at, updated_at, category_name                │
│    - Sends only writable fields                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Express Backend: updateModule()                          │
│    - Validates no createdBy/created_by in request           │
│    - Checks user permission (creator or admin)              │
│    - Calls Module.update(id, updates)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Module Model: update()                                   │
│    - Maps fields to database columns                        │
│    - Updates only provided fields                           │
│    - Returns updated module with all fields                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Response: Updated module                                 │
│    - Includes all fields (read-only + updated)              │
│    - Frontend receives complete module data                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### 1. **Always Strip Read-Only Fields on Frontend**

When updating resources, always remove fields that shouldn't be modified:

```typescript
// ✅ Good: Strip read-only fields
const updateData = { ...data };
delete updateData.id;
delete updateData.created_by;
delete updateData.created_at;
delete updateData.updated_at;

await api.update(id, updateData);

// ❌ Bad: Send all fields
await api.update(id, data);
```

### 2. **Backend Should Validate Both Field Formats**

Since the app uses both camelCase and snake_case, validate both:

```javascript
// ✅ Good: Check both formats
if (updates.createdBy || updates.created_by) {
  return res.status(400).json({ error: 'Cannot change creator' });
}

// ❌ Bad: Only check one format
if (updates.createdBy) {
  return res.status(400).json({ error: 'Cannot change creator' });
}
```

### 3. **Use TypeScript Types for Update Operations**

Define separate types for create vs update:

```typescript
// Full module type
export interface VARKModule {
  id: string;
  title: string;
  created_by: string;
  creator_name: string;
  created_at: string;
  updated_at: string;
  // ... all fields
}

// Create type (no id, timestamps, or derived fields)
export type CreateVARKModuleData = Omit<
  VARKModule,
  'id' | 'created_by' | 'creator_name' | 'created_at' | 'updated_at' | 'category_name'
>;

// Update type (no id, created_by, timestamps, or derived fields)
export type UpdateVARKModuleData = Partial<
  Omit<VARKModule, 'id' | 'created_by' | 'creator_name' | 'created_at' | 'updated_at' | 'category_name'>
>;
```

### 4. **Backend Should Ignore Unknown Fields**

Instead of rejecting updates with read-only fields, the backend could simply ignore them:

```javascript
// Alternative approach: Whitelist updatable fields
const updatableFields = [
  'title', 'description', 'category_id', 'learning_objectives',
  'content_structure', 'difficulty_level', 'estimated_duration_minutes',
  // ... other updatable fields
];

const updates = {};
for (const field of updatableFields) {
  if (req.body[field] !== undefined) {
    updates[field] = req.body[field];
  }
}

await Module.update(id, updates);
```

### 5. **Document Read-Only Fields in API**

Clearly document which fields are read-only in API documentation:

```javascript
/**
 * @route   PUT /api/modules/:id
 * @desc    Update module
 * @access  Private (Teacher/Admin only - must be creator or admin)
 * @body    Any module fields to update (except read-only fields)
 * 
 * Read-only fields (will be ignored or cause error):
 * - id: Module ID (immutable)
 * - created_by: Creator user ID (immutable)
 * - creator_name: Creator name (derived from JOIN)
 * - created_at: Creation timestamp (auto-managed)
 * - updated_at: Update timestamp (auto-managed)
 * - category_name: Category name (derived from JOIN)
 */
router.put('/:id', verifyToken, requireTeacher, modulesController.updateModule);
```

---

## Testing

### Test Cases

1. **✅ Update with only writable fields**
   ```typescript
   await updateModule(id, {
     title: 'Updated Title',
     description: 'Updated Description'
   });
   // Should succeed
   ```

2. **✅ Update with read-only fields (after fix)**
   ```typescript
   await updateModule(id, {
     title: 'Updated Title',
     created_by: 'some-user-id', // Will be stripped
     creator_name: 'Some Name'    // Will be stripped
   });
   // Should succeed (read-only fields stripped)
   ```

3. **✅ Update with all fields from formData**
   ```typescript
   const module = await getModuleById(id);
   module.title = 'Updated Title';
   await updateModule(id, module);
   // Should succeed (read-only fields stripped)
   ```

4. **✅ Verify timestamps are updated**
   ```typescript
   const before = await getModuleById(id);
   await updateModule(id, { title: 'New Title' });
   const after = await getModuleById(id);
   
   expect(after.updated_at).not.toBe(before.updated_at);
   expect(after.created_at).toBe(before.created_at);
   ```

---

## Related Issues

### Similar Issues in Other Endpoints

Check if other update endpoints have the same issue:

1. **Students Update** - ✅ Should strip `created_at`, `updated_at`
2. **Classes Update** - ✅ Should strip `created_by`, `created_at`, `updated_at`
3. **Profile Update** - ✅ Should strip `user_id`, `created_at`, `updated_at`

### Recommendation: Create Reusable Utility

Create a utility function to strip read-only fields:

```typescript
// lib/utils/api-helpers.ts

/**
 * Strip read-only fields from update data
 */
export function stripReadOnlyFields<T extends Record<string, any>>(
  data: T,
  readOnlyFields: string[]
): Partial<T> {
  const cleaned = { ...data };
  
  for (const field of readOnlyFields) {
    delete cleaned[field];
  }
  
  return cleaned;
}

// Usage in API client
const READONLY_MODULE_FIELDS = [
  'id', 'created_by', 'createdBy', 'creator_name', 'creatorName',
  'created_at', 'createdAt', 'updated_at', 'updatedAt',
  'category_name', 'categoryName'
];

async updateModule(id: string, data: UpdateVARKModuleData) {
  const updateData = stripReadOnlyFields(data, READONLY_MODULE_FIELDS);
  const response = await expressClient.put(`/api/modules/${id}`, updateData);
  // ...
}
```

---

## Summary

### ✅ Changes Made

1. **Backend:** Updated validation to check both `createdBy` and `created_by`
2. **Frontend:** Strip read-only fields before sending update request
3. **Documentation:** Documented read-only vs writable fields

### ✅ Benefits

- Module updates now work correctly
- No more "Cannot change module creator" errors
- Cleaner API requests (only send necessary data)
- Better separation of concerns (read-only vs writable)

### 🎯 Recommendations

1. Apply same pattern to other update endpoints
2. Create reusable utility for stripping read-only fields
3. Add TypeScript types for Create vs Update operations
4. Document read-only fields in API documentation
5. Consider backend approach of whitelisting updatable fields

---

**Status:** ✅ RESOLVED - Module updates now work correctly with read-only fields properly handled
