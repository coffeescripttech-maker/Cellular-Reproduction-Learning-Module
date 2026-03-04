# Fix: RLS Blocking Duplicate Check

## The Problem
The duplicate check returns `null` even though the email exists:
```
🔍 Existing profile check: { existingProfile: null, checkError: null }
❌ Profile creation error: duplicate key value violates unique constraint "profiles_email_key"
```

## Root Cause
**RLS (Row Level Security) policies are blocking the service_role from reading profiles!**

Even though service_role should bypass RLS, there might be explicit policies that are blocking it.

## Solution 1: Fix RLS Policies (RECOMMENDED)

Run this in Supabase SQL Editor:
```sql
-- Copy/paste: scripts/fix-profiles-rls-for-service-role.sql
```

This will:
- ✅ Add explicit policies for service_role to SELECT, INSERT, UPDATE, DELETE
- ✅ Allow duplicate checks to work properly
- ✅ Maintain security for other roles

## Solution 2: Already Implemented Fallback

The code now handles this gracefully:
1. **Tries to check for duplicates** (if RLS allows)
2. **If check fails or returns null**, continues anyway
3. **Database constraint catches duplicates** on insert
4. **Returns proper 400 error** with clear message

So even if RLS blocks the check, you still get a proper error message instead of a 500 error!

## How It Works Now

### Before (Broken):
```
1. Check for duplicate → RLS blocks → returns null
2. Try to insert → Database constraint fails → 500 error
3. User sees: "Internal server error"
```

### After (Fixed):
```
1. Check for duplicate → RLS blocks → returns null
2. Try to insert → Database constraint fails → Catch error
3. Return 400 with message: "A student with email X already exists (database constraint)"
4. User sees: Clear error message
```

## Current Status

### ✅ Working (with fallback)
- Duplicate detection works via database constraint
- Clear error messages (400 instead of 500)
- Orphaned auth users are cleaned up
- System is functional

### ⚠️ Can Be Improved
- Duplicate check could work BEFORE insert (faster, cleaner)
- Requires fixing RLS policies

## To Fix Completely

### Step 1: Run RLS Fix Script
```sql
-- In Supabase SQL Editor:
-- Copy/paste contents of: scripts/fix-profiles-rls-for-service-role.sql
```

### Step 2: Restart Dev Server
```bash
# Press Ctrl+C, then:
npm run dev
```

### Step 3: Test
Try creating a duplicate student - you should see:
```
🔍 Existing profile check: { existingProfiles: [...], foundCount: 1 }
400 Bad Request: "A student with email X already exists"
```

Instead of:
```
🔍 Existing profile check: { existingProfiles: null, foundCount: 0 }
400 Bad Request: "A student with email X already exists (database constraint)"
```

## Why This Happens

RLS policies can be configured to block even service_role. Common causes:
1. Explicit policy that doesn't include service_role
2. Policy with restrictive USING clause
3. Policy that checks auth.uid() (which is null for service_role)

## Verification

After running the fix script, check the logs:
```
🔍 Existing profile check: { 
  existingProfiles: [...],  // Should have data if duplicate exists
  foundCount: 1,            // Should be > 0 if duplicate exists
  note: 'If this returns null but insert fails, RLS is blocking the check'
}
```

## Files Modified
- ✅ `app/api/students/create/route.ts` - Added fallback handling
- ✅ `scripts/fix-profiles-rls-for-service-role.sql` - RLS fix script

## Bottom Line

**The system works now**, but running the RLS fix script will make it work better (faster, cleaner error detection).

Current behavior: ✅ Functional (catches duplicates via database constraint)
After RLS fix: ✅ Optimal (catches duplicates before insert attempt)
