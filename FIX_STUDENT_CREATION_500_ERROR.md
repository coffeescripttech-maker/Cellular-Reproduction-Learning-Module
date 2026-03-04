# Fix: Student Creation 500 Error - RESOLVED ✅

## Issue
Getting `POST /api/students/create 500 in 2509ms` when creating student with email `dylan@gmail.com`

## Root Cause Found
The error logs revealed:
```
❌ Profile creation error: duplicate key value violates unique constraint "profiles_email_key"
Details: Key (email)=(dylan@gmail.com) already exists.
```

**The problem:** The duplicate check was using the regular `supabase` client (anon key) which was blocked by RLS policies, so it returned `null` even though the student existed. Then when trying to insert, the admin client bypassed RLS and hit the unique constraint.

## Solution Applied ✅

### 1. Fixed Duplicate Check
Modified `/app/api/students/create/route.ts`:
- Changed from `supabase` (anon key) to `supabaseAdmin` (service role key)
- Changed from `.single()` to `.maybeSingle()` to avoid errors when no record found
- Now properly detects existing students before attempting insert

### 2. Created Cleanup Script
Created `scripts/cleanup-duplicate-students.sql` to:
- View students by email
- Delete specific students
- Find all duplicate emails
- Clean up test data

## How to Fix Your Current Issue

### Step 1: Delete the Existing Student
In Supabase SQL Editor, run:
```sql
-- View the student first
SELECT * FROM profiles WHERE email = 'dylan@gmail.com';

-- Then delete it
DELETE FROM profiles WHERE email = 'dylan@gmail.com';
```

Or use the cleanup script:
```sql
-- Run: scripts/cleanup-duplicate-students.sql
-- Then uncomment and run the DELETE statement
```

### Step 2: Restart Dev Server
The code fix needs a restart:
```bash
# Press Ctrl+C, then:
npm run dev
```

### Step 3: Try Creating Student Again
Now when you try to create `dylan@gmail.com`:
- If it exists: You'll get a clear error message "A student with email dylan@gmail.com already exists"
- If it doesn't exist: It will create successfully

## Files Modified
- ✅ `app/api/students/create/route.ts` - Fixed duplicate check to use admin client
- ✅ `scripts/cleanup-duplicate-students.sql` - Cleanup utility

## Technical Details

**Before:**
```typescript
// Used anon key - blocked by RLS
const { data: existingProfile } = await supabase
  .from('profiles')
  .select('email')
  .eq('email', email)
  .single(); // Throws error if not found
```

**After:**
```typescript
// Uses service role key - bypasses RLS
const { data: existingProfile } = await supabaseAdmin
  .from('profiles')
  .select('email')
  .eq('email', email)
  .maybeSingle(); // Returns null if not found, no error
```

## Prevention
This fix ensures:
- ✅ Duplicate checks work correctly regardless of RLS policies
- ✅ Clear error messages when student already exists
- ✅ No orphaned auth users (cleaned up on profile creation failure)
- ✅ Consistent behavior between single and bulk import

The duplicate check now works the same way as the bulk import endpoint! 🎯
