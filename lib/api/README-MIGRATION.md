# Frontend API Migration Guide

This document explains how the frontend API layer has been updated to support both Supabase and Express backends with a feature flag.

## Architecture

The migration uses a **unified API pattern** that switches between Supabase and Express implementations based on the `NEXT_PUBLIC_USE_NEW_API` environment variable.

```
┌─────────────────────────────────────────┐
│         Frontend Application            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│         Unified API Layer                │
│  (Switches based on feature flag)        │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌──────────────┐
│  Supabase   │  │   Express    │
│    APIs     │  │     APIs     │
└─────────────┘  └──────────────┘
```

## File Structure

```
lib/api/
├── express-client.ts          # Express API client with auth & token management
├── express-auth.ts            # Express authentication API
├── express-students.ts        # Express students API
├── express-vark-modules.ts    # Express VARK modules API
├── express-files.ts           # Express files API
├── unified-api.ts             # Unified API that switches between backends
├── auth.ts                    # Supabase authentication API (existing)
├── students.ts                # Supabase students API (existing)
├── vark-modules.ts            # Supabase VARK modules API (existing)
└── README-MIGRATION.md        # This file

hooks/
├── useAuth.tsx                # Supabase auth hook (existing)
├── useExpressAuth.tsx         # Express auth hook (new)
└── useUnifiedAuth.tsx         # Unified auth hook (new)
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Express API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_NEW_API=false
```

- `NEXT_PUBLIC_API_URL`: URL of the Express API server
- `NEXT_PUBLIC_USE_NEW_API`: Feature flag to switch between Supabase (false) and Express (true)

## Usage

### Option 1: Use Unified APIs (Recommended)

Import from `unified-api.ts` to automatically use the correct backend:

```typescript
import { UnifiedAuthAPI, UnifiedStudentAPI, UnifiedVARKModulesAPI } from '@/lib/api/unified-api';

// These will use Supabase or Express based on NEXT_PUBLIC_USE_NEW_API
const result = await UnifiedAuthAPI.login({ email, password });
const students = await UnifiedStudentAPI.getStudents();
const modules = await UnifiedVARKModulesAPI.getModules();
```

### Option 2: Use Unified Auth Hook

Update your components to use the unified auth hook:

```typescript
// Before
import { useAuth } from '@/hooks/useAuth';

// After
import { useAuth } from '@/hooks/useUnifiedAuth';

// Usage remains the same
const { user, login, logout } = useAuth();
```

### Option 3: Direct Import (For Testing)

You can also import specific implementations directly:

```typescript
// Use Express API directly
import { ExpressAuthAPI } from '@/lib/api/express-auth';
import { ExpressStudentAPI } from '@/lib/api/express-students';

// Use Supabase API directly
import { AuthAPI } from '@/lib/api/auth';
import { StudentAPI } from '@/lib/api/students';
```

## Migration Strategy

### Phase 1: Parallel Running (Current)
- Both Supabase and Express APIs are available
- Feature flag defaults to `false` (Supabase)
- Express APIs can be tested independently

### Phase 2: Gradual Rollout
1. Set `NEXT_PUBLIC_USE_NEW_API=true` for internal testing
2. Test all functionality with Express backend
3. Monitor for errors and performance issues
4. Gradually increase rollout percentage

### Phase 3: Full Migration
1. Switch all traffic to Express (`NEXT_PUBLIC_USE_NEW_API=true`)
2. Keep Supabase as read-only backup for 2 weeks
3. Monitor system stability
4. Decommission Supabase after stability confirmed

## API Compatibility

The Express APIs are designed to be **drop-in replacements** for Supabase APIs with the same interface:

### Authentication
```typescript
// Both return the same structure
const result = await AuthAPI.login({ email, password });
const result = await ExpressAuthAPI.login({ email, password });

// Result: { success: boolean, message: string, user?: User }
```

### Students
```typescript
// Both return the same structure
const result = await StudentAPI.getStudents();
const result = await ExpressStudentAPI.getStudents();

// Result: { success: boolean, data?: Student[], error?: string }
```

### VARK Modules
```typescript
// Both return the same structure
const result = await varkModulesAPI.getModules(filters);
const result = await expressVARKModulesAPI.getModules(filters);

// Result: { success: boolean, data?: VARKModule[], error?: string }
```

## Express API Client Features

The `express-client.ts` provides:

1. **Token Management**
   - Automatic storage of access and refresh tokens
   - Token refresh on 401 errors
   - Token clearing on logout

2. **Request Interceptors**
   - Automatic addition of Authorization header
   - Retry logic for expired tokens
   - Error handling and parsing

3. **Convenience Methods**
   - `get()`, `post()`, `put()`, `patch()`, `delete()`
   - `uploadFile()` for multipart/form-data uploads

4. **Error Handling**
   - Consistent error response format
   - Network error handling
   - Response parsing errors

## Testing

### Test Supabase API (Default)
```bash
# Ensure feature flag is false
NEXT_PUBLIC_USE_NEW_API=false npm run dev
```

### Test Express API
```bash
# Start Express server
cd server
npm run dev

# Start Next.js with feature flag
NEXT_PUBLIC_USE_NEW_API=true npm run dev
```

### Test Both APIs
You can run both backends simultaneously and switch between them using the feature flag without restarting the frontend.

## Troubleshooting

### Issue: "No token provided" error
**Solution**: Make sure you're logged in. The Express API requires authentication for most endpoints.

### Issue: "Network request failed"
**Solution**: Check that the Express server is running at the URL specified in `NEXT_PUBLIC_API_URL`.

### Issue: "Token expired" errors
**Solution**: The Express client automatically refreshes tokens. If this persists, try logging out and back in.

### Issue: Different behavior between Supabase and Express
**Solution**: Check the API response format. Both should return the same structure, but there might be minor differences in error messages.

## Next Steps

1. ✅ Create Express API client with token management
2. ✅ Create Express authentication API
3. ✅ Create Express students API
4. ✅ Create Express VARK modules API
5. ✅ Create Express files API
6. ✅ Create unified API layer
7. ✅ Create unified auth hook
8. ⏳ Update all components to use unified APIs
9. ⏳ Test with Express backend
10. ⏳ Deploy and monitor

## Notes

- The unified API pattern allows for **zero-downtime migration**
- Components don't need to be updated if they already use the API layer
- The feature flag can be toggled without code changes
- Both backends can run in parallel during the transition period
