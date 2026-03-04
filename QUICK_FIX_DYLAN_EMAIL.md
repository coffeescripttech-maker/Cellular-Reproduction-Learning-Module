# Quick Fix: Delete dylan@gmail.com Student

## The Problem
The student `dylan@gmail.com` already exists in your database, causing the 500 error.

## Quick Solution (2 Steps)

### Step 1: Delete the Existing Student
Open Supabase SQL Editor and run:

```sql
DELETE FROM profiles WHERE email = 'dylan@gmail.com';
```

### Step 2: Restart Dev Server
```bash
# Press Ctrl+C in your terminal
# Then restart:
npm run dev
```

### Step 3: Try Again
Now create the student at `http://localhost:3000/teacher/students` - it will work!

---

## What Was Fixed
The duplicate check now uses the admin client (service role key) instead of the anon key, so it properly detects existing students before attempting to create them.

**Before:** Duplicate check failed silently due to RLS → Insert failed with 500 error
**After:** Duplicate check works → Clear error message "A student with email X already exists"

---

## Alternative: Use Different Email
Instead of deleting, just use a different email like:
- `dylan2@gmail.com`
- `dylan.miranda@gmail.com`
- `dylan.test@gmail.com`
