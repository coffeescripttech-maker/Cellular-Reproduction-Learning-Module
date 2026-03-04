# VARK API Constructor Fix

## Issue
Multiple components were trying to instantiate `VARKModulesAPI` with `new VARKModulesAPI()`, but the unified API exports it as an already-instantiated object, not a class.

**Error**: `TypeError: VARKModulesAPI is not a constructor`

## Root Cause
In `lib/api/unified-api.ts`, the `VARKModulesAPI` is exported as an instance:
```typescript
export const UnifiedVARKModulesAPI = USE_NEW_API ? expressVARKModulesAPI : new VARKModulesAPI();
export { UnifiedVARKModulesAPI as VARKModulesAPI };
```

This means `VARKModulesAPI` is already an object with methods, not a class that needs instantiation.

## Files Fixed

### Components
1. ✅ `components/student/completion-dashboard.tsx`
   - Changed: `const varkAPI = new VARKModulesAPI(); varkAPI.getStudentStats()`
   - To: `VARKModulesAPI.getStudentStats()`

2. ✅ `components/teacher/student-details-modal.tsx`
   - Changed: `const varkAPI = new VARKModulesAPI(); varkAPI.getStudentStats()`
   - To: `VARKModulesAPI.getStudentStats()`

3. ✅ `components/student/module-completion-badge.tsx`
   - Changed: `const varkAPI = new VARKModulesAPI(); varkAPI.getStudentModuleCompletion()`
   - To: `VARKModulesAPI.getStudentModuleCompletion()`

4. ✅ `components/vark-modules/dynamic-module-viewer.tsx`
   - Removed local `const varkAPI = new VARKModulesAPI()` declarations
   - Changed all `varkAPI.method()` calls to `VARKModulesAPI.method()`

### Pages
5. ✅ `app/student/dashboard/page.tsx`
   - Removed: `const varkAPI = new VARKModulesAPI();`
   - Changed: `varkAPI.getModules()` to `VARKModulesAPI.getModules()`

6. ✅ `app/student/vark-modules/page.tsx`
   - Removed: `const varkAPI = new VARKModulesAPI();`
   - All `varkAPI.` calls replaced with `VARKModulesAPI.`

7. ✅ `app/student/vark-modules/[id]/page.tsx`
   - Removed: `const varkAPI = new VARKModulesAPI();`
   - All `varkAPI.` calls replaced with `VARKModulesAPI.`

8. ✅ `app/teacher/vark-modules/page.tsx`
   - Removed: `const varkAPI = new VARKModulesAPI();`
   - All `varkAPI.` calls replaced with `VARKModulesAPI.`

9. ✅ `app/teacher/vark-modules/edit/[id]/page.tsx`
   - Removed: `const varkAPI = new VARKModulesAPI();`
   - All `varkAPI.` calls replaced with `VARKModulesAPI.`

10. ✅ `app/teacher/submissions/page.tsx`
    - Removed: `const varkAPI = new VARKModulesAPI();`
    - All `varkAPI.` calls replaced with `VARKModulesAPI.`

## Additional Fix: Module.findAll Query

### Issue
The Module model's `findAll` method had a regex that couldn't match multi-line SELECT statements, causing `countResult[0]` to be undefined.

**Error**: `Cannot read properties of undefined (reading 'total')`

### Fix
**File**: `server/src/models/Module.js`

Changed regex from:
```javascript
const countQuery = query.replace(/SELECT .+ FROM/, 'SELECT COUNT(*) as total FROM');
const total = countResult[0].total;
```

To:
```javascript
const countQuery = query.replace(/SELECT[\s\S]+?FROM/, 'SELECT COUNT(*) as total FROM');
const total = countResult && countResult[0] ? countResult[0].total : 0;
```

- `[\s\S]+?` matches any character including newlines (non-greedy)
- Added null check for `countResult[0]` with fallback to 0

## Pattern for Using Unified APIs

### ❌ Wrong (Old Pattern)
```typescript
const varkAPI = new VARKModulesAPI();
const modules = await varkAPI.getModules();
```

### ✅ Correct (New Pattern)
```typescript
import { VARKModulesAPI } from '@/lib/api/unified-api';
const modules = await VARKModulesAPI.getModules();
```

## Testing Checklist
- [ ] Student dashboard loads without errors
- [ ] VARK modules page displays modules
- [ ] Module completion tracking works
- [ ] Teacher submissions page loads
- [ ] Module editing works
- [ ] No "is not a constructor" errors in console

## Related Files
- `lib/api/unified-api.ts` - Unified API exports
- `lib/api/express-vark-modules.ts` - Express VARK API implementation
- `lib/api/vark-modules.ts` - Supabase VARK API implementation
- `server/src/models/Module.js` - Module model with findAll fix
