# Fix: Ghost Duplicate Email Issue

## The Mystery
You're getting a duplicate email error for `dylan@gmail.com`, but you can't see it in the database!

```
🔍 Existing profile check: { existingProfile: null }
❌ Profile creation error: duplicate key value violates unique constraint "profiles_email_key"
```

## Possible Causes

### 1. Case-Insensitive Unique Constraint
The database might have a case-insensitive unique constraint on email, so:
- `dylan@gmail.com` 
- `Dylan@gmail.com`
- `DYLAN@GMAIL.COM`

Are all considered duplicates, but your query only checks exact case match.

### 2. RLS Policy Blocking SELECT
Even with service role, there might be a policy preventing you from seeing the record.

### 3. Different Schema/Database
The record might exist in a different schema or you're connected to a different database.

### 4. Partial Index
There might be a partial unique index that applies only to certain conditions.

## Solutions

### Solution 1: Run Investigation Script (RECOMMENDED)
This will tell us exactly what's happening:

```sql
-- In Supabase SQL Editor, run:
-- scripts/investigate-dylan-email.sql
```

This script checks:
- Exact email match
- Case-insensitive match
- Similar emails
- Unique constraints
- Indexes
- RLS policies

### Solution 2: Force Delete with Case-Insensitive Match
```sql
-- Delete any variation of the email
DELETE FROM profiles 
WHERE LOWER(email) = LOWER('dylan@gmail.com');
```

### Solution 3: Check Auth Users Table
The email might exist in auth.users but not in profiles:

```sql
-- Check auth users
SELECT id, email, created_at 
FROM auth.users 
WHERE email ILIKE 'dylan@gmail.com';

-- If found, delete it
DELETE FROM auth.users 
WHERE email ILIKE 'dylan@gmail.com';
```

### Solution 4: Disable RLS Temporarily
```sql
-- Temporarily disable RLS to see all records
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Now check
SELECT * FROM profiles WHERE email ILIKE 'dylan@gmail.com';

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Solution 5: Use Different Email
Just use a different email for now:
- `dylan.miranda@gmail.com`
- `dylan2@gmail.com`
- `dylan.test@student.com`

## Code Fix Applied

I've updated the duplicate check to use case-insensitive matching:

**Before:**
```typescript
.eq('email', email) // Exact match only
```

**After:**
```typescript
.ilike('email', email) // Case-insensitive match
```

Also added better error handling that catches the duplicate constraint error and returns a 400 instead of 500.

## Next Steps

1. **Restart your dev server:**
   ```bash
   # Press Ctrl+C, then:
   npm run dev
   ```

2. **Run the investigation script:**
   ```sql
   -- In Supabase SQL Editor:
   -- Copy/paste contents of scripts/investigate-dylan-email.sql
   ```

3. **Based on results, run the appropriate delete:**
   ```sql
   -- If found in profiles:
   DELETE FROM profiles WHERE LOWER(email) = LOWER('dylan@gmail.com');
   
   -- If found in auth.users:
   DELETE FROM auth.users WHERE email ILIKE 'dylan@gmail.com';
   ```

4. **Try creating the student again**

## Files Modified
- ✅ `app/api/students/create/route.ts` - Case-insensitive duplicate check
- ✅ `scripts/investigate-dylan-email.sql` - Investigation script

The duplicate check now uses `.ilike()` for case-insensitive matching and provides better error messages!
