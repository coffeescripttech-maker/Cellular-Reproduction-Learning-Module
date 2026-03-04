# 🔧 Fix Duplicate Email Error on /teacher/students

## 🚨 The Error

```json
{"error": "duplicate key value violates unique constraint \"profiles_email_key\""}
```

## 🎯 The Problem

The error occurs when:
1. **Creating a student** with an email that already exists
2. **Bulk importing students** where some emails already exist in the database

The code tries to check for existing emails, but there's a race condition or the check isn't working properly.

## ✅ The Solution

### Quick Fix: Update the Bulk Import Route

The issue is in `app/api/students/bulk-import/route.ts`. The code uses `.upsert()` which should handle duplicates, but it's configured incorrectly.

**Change this:**
```typescript
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .upsert(profileData)
  .select()
  .single();
```

**To this:**
```typescript
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .upsert(profileData, {
    onConflict: 'email',  // ← Specify the conflict column
    ignoreDuplicates: false  // ← Update if exists
  })
  .select()
  .single();
```

### Better Fix: Use INSERT with ON CONFLICT

Replace the upsert with a proper insert that handles conflicts:

```typescript
const { data: profile, error: profileError } = await supabaseAdmin
  .from('profiles')
  .insert(profileData)
  .select()
  .single();

if (profileError) {
  // Check if it's a duplicate email error
  if (profileError.code === '23505') {
    // Duplicate email - skip this student
    results.skipped++;
    console.log(`⏭️  Skipped duplicate: ${studentData.email}`);
    continue; // Skip to next student
  }
  
  // Other error - clean up and throw
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  throw new Error(profileError.message);
}
```

## 🔍 Root Cause Analysis

The duplicate email error happens because:

1. **Auth user is created first** (in `auth.users` table)
2. **Profile is created second** (in `profiles` table)
3. If profile creation fails due to duplicate email:
   - Auth user exists but has no profile
   - Next attempt creates another auth user
   - Profile creation fails again (duplicate email)
   - Now you have orphaned auth users!

## 🛠️ Complete Fix

I'll create an updated version of the bulk import route that properly handles duplicates.

### What the Fix Does:

1. ✅ **Check existing emails** before creating auth users
2. ✅ **Skip duplicates** gracefully without errors
3. ✅ **Clean up orphaned auth users** if profile creation fails
4. ✅ **Return detailed results** (success, failed, skipped)
5. ✅ **Handle edge cases** (race conditions, partial failures)

## 📝 Manual Workaround (Temporary)

If you need to import students right now:

### Option 1: Delete Duplicate Profiles First

```sql
-- Find duplicate emails
SELECT email, COUNT(*) 
FROM profiles 
WHERE role = 'student'
GROUP BY email 
HAVING COUNT(*) > 1;

-- Delete duplicates (keeps the first one)
DELETE FROM profiles a
USING profiles b
WHERE a.id > b.id 
  AND a.email = b.email 
  AND a.role = 'student';
```

### Option 2: Clean Up Orphaned Auth Users

```sql
-- Find auth users without profiles
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Note: You'll need to delete these via Supabase Dashboard
-- Go to Authentication → Users → Delete orphaned users
```

### Option 3: Skip Duplicates in Your JSON

Before importing, remove students that already exist:

```javascript
// In browser console on /teacher/students page
const existingEmails = students.map(s => s.email);
console.log('Existing emails:', existingEmails);

// Then filter your JSON file to exclude these emails
```

## 🎯 Prevention

To prevent this error in the future:

### 1. Add Email Validation in UI

```typescript
// In the create student form
const checkEmailExists = async (email: string) => {
  const { data } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();
  
  return !!data;
};

// Before submitting
if (await checkEmailExists(formData.email)) {
  toast.error('Email already exists!');
  return;
}
```

### 2. Add Unique Constraint Check in API

```typescript
// Before creating auth user
const { data: existing } = await supabaseAdmin
  .from('profiles')
  .select('email')
  .eq('email', email)
  .single();

if (existing) {
  return NextResponse.json(
    { error: 'Email already exists' },
    { status: 409 }
  );
}
```

### 3. Use Transactions (Advanced)

Wrap auth user creation and profile creation in a transaction so both succeed or both fail.

## 🐛 Debugging

### Check for Orphaned Auth Users

```sql
-- Count orphaned auth users
SELECT COUNT(*) as orphaned_users
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

### Check for Duplicate Emails

```sql
-- Find duplicate emails in profiles
SELECT email, COUNT(*) as count
FROM profiles
WHERE role = 'student'
GROUP BY email
HAVING COUNT(*) > 1;
```

### Check Auth vs Profile Mismatch

```sql
-- Find auth users with email but no profile
SELECT au.email, au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;
```

## ✅ Success Indicators

After applying the fix:

- ✅ Can create students without duplicate email errors
- ✅ Bulk import skips existing students gracefully
- ✅ No orphaned auth users
- ✅ Clear error messages for actual failures
- ✅ Detailed import results (success, failed, skipped)

## 📞 Need Help?

If you're still seeing the error:

1. Check Supabase logs (Dashboard → Logs → Database)
2. Look for the exact duplicate email
3. Manually delete the duplicate profile
4. Try again

---

**The fix is ready!** Check the updated files I'm about to create.
