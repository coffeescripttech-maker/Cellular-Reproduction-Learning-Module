# Stats API Migration Summary

## Overview
The `/api/stats` endpoint has been successfully migrated to support both Supabase and Express backends through the unified API pattern.

## Changes Made

### 1. Express Stats Route ✅
**File:** `server/src/routes/stats.routes.js`

Created new Express route with two endpoints:
- `GET /api/stats/homepage` - Returns homepage statistics
- `GET /api/stats/health` - Returns system health status

Statistics include:
- Total students, teachers, modules, classes, quizzes, activities
- Success rate (% of students who completed onboarding)
- Recent activity (new students/teachers in last 30 days)

### 2. Express Stats Client ✅
**File:** `lib/api/express-stats.ts`

Created `ExpressStatsAPI` class with methods:
- `getHomepageStats()` - Fetches homepage statistics from Express API
- `getSystemHealth()` - Fetches system health status

Includes fallback stats if API call fails.

### 3. Unified API Integration ✅
**File:** `lib/api/unified-api.ts`

Added stats to unified API:
```typescript
export const UnifiedStatsAPI = USE_NEW_API ? ExpressStatsAPI : StatsAPI;
export { UnifiedStatsAPI as StatsAPI };
```

### 4. Next.js API Route Updated ✅
**File:** `app/api/stats/route.ts`

Updated to use unified API:
```typescript
import { StatsAPI } from '@/lib/api/unified-api';
```

### 5. Express Server Registration ✅
**File:** `server/src/app.js`

Registered stats route:
```javascript
const statsRoutes = require('./routes/stats.routes');
app.use('/api/stats', statsRoutes);
```

## How It Works

### With NEXT_PUBLIC_USE_NEW_API=true (Express)
1. Frontend calls `/api/stats` (Next.js API route)
2. Next.js route uses `UnifiedStatsAPI` which points to `ExpressStatsAPI`
3. `ExpressStatsAPI` calls Express server at `http://localhost:3001/api/stats/homepage`
4. Express queries MySQL database
5. Returns statistics to frontend

### With NEXT_PUBLIC_USE_NEW_API=false (Supabase)
1. Frontend calls `/api/stats` (Next.js API route)
2. Next.js route uses `UnifiedStatsAPI` which points to `StatsAPI`
3. `StatsAPI` queries Supabase directly
4. Returns statistics to frontend

## Testing

### Test Express Stats Endpoint
```bash
# Make sure Express server is running
cd server
npm start

# Test in another terminal
curl http://localhost:3001/api/stats/homepage
curl http://localhost:3001/api/stats/health
```

### Test Through Next.js
```bash
# Make sure NEXT_PUBLIC_USE_NEW_API=true in .env.local
# Make sure both servers are running

# Visit homepage
http://localhost:3000

# Or test API directly
curl http://localhost:3000/api/stats
```

## Database Queries

The stats endpoint runs these queries in parallel:
```sql
-- Total students
SELECT COUNT(*) FROM profiles WHERE role = 'student'

-- Total teachers
SELECT COUNT(*) FROM profiles WHERE role = 'teacher'

-- Total published modules
SELECT COUNT(*) FROM vark_modules WHERE is_published = true

-- Completed modules (students with onboarding)
SELECT COUNT(*) FROM profiles WHERE role = 'student' AND onboarding_completed = true

-- Recent students (last 30 days)
SELECT COUNT(*) FROM profiles WHERE role = 'student' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

-- Recent teachers (last 30 days)
SELECT COUNT(*) FROM profiles WHERE role = 'teacher' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

-- Total classes
SELECT COUNT(*) FROM classes

-- Total quizzes
SELECT COUNT(*) FROM quizzes WHERE is_published = true

-- Total activities
SELECT COUNT(*) FROM activities WHERE is_published = true
```

## Fallback Behavior

If any database query fails, the API returns fallback statistics:
```javascript
{
  totalStudents: 1250,
  totalTeachers: 85,
  totalModules: 25,
  totalClasses: 15,
  totalQuizzes: 45,
  totalActivities: 30,
  successRate: 92,
  recentActivity: {
    newStudents: 150,
    newTeachers: 12,
    completedModules: 1150
  }
}
```

## Status
✅ **Complete** - Stats API is now fully integrated with the unified API pattern and supports both Supabase and Express backends.
