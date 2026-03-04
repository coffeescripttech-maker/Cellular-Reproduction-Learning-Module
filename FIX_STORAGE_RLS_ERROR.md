# 🔒 Fix Storage RLS Policy Error

## 🚨 The Error

```
Storage upload failed: new row violates row-level security policy
```

## 🎯 The Problem

Your storage buckets (`module-images` and `module-content`) don't have proper Row Level Security (RLS) policies set up. This prevents authenticated users from uploading files.

## ✅ The Solution

### Option 1: Run SQL Script (Recommended)

1. **Open Supabase Dashboard** → SQL Editor
2. **Copy** `scripts/fix-storage-rls-policies.sql`
3. **Paste** and click **Run**
4. **Wait** for "✅ STORAGE RLS POLICIES CONFIGURED!"

### Option 2: Manual Setup via Dashboard

#### Step 1: Go to Storage Policies

1. Open Supabase Dashboard
2. Click **Storage** in left sidebar
3. Click on **Policies** tab

#### Step 2: Add Policies for `module-images`

Click **New Policy** and create these 4 policies:

**Policy 1: Allow Upload**
```
Name: Allow authenticated uploads to module-images
Allowed operation: INSERT
Target roles: authenticated
Policy definition: bucket_id = 'module-images'
```

**Policy 2: Allow Read**
```
Name: Allow public read access to module-images
Allowed operation: SELECT
Target roles: public
Policy definition: bucket_id = 'module-images'
```

**Policy 3: Allow Update**
```
Name: Allow authenticated updates to module-images
Allowed operation: UPDATE
Target roles: authenticated
Policy definition: bucket_id = 'module-images'
```

**Policy 4: Allow Delete**
```
Name: Allow authenticated deletes from module-images
Allowed operation: DELETE
Target roles: authenticated
Policy definition: bucket_id = 'module-images'
```

#### Step 3: Add Policies for `module-content`

Repeat the same 4 policies but replace `module-images` with `module-content`:

**Policy 1: Allow Upload**
```
Name: Allow authenticated uploads to module-content
Allowed operation: INSERT
Target roles: authenticated
Policy definition: bucket_id = 'module-content'
```

**Policy 2: Allow Read**
```
Name: Allow public read access to module-content
Allowed operation: SELECT
Target roles: public
Policy definition: bucket_id = 'module-content'
```

**Policy 3: Allow Update**
```
Name: Allow authenticated updates to module-content
Allowed operation: UPDATE
Target roles: authenticated
Policy definition: bucket_id = 'module-content'
```

**Policy 4: Allow Delete**
```
Name: Allow authenticated deletes from module-content
Allowed operation: DELETE
Target roles: authenticated
Policy definition: bucket_id = 'module-content'
```

## 🔍 Verify It Works

### Test 1: Check Policies Exist

Run this in SQL Editor:

```sql
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
```

You should see 8 policies (4 for each bucket).

### Test 2: Try Importing a Module

1. Go to `/teacher/vark-modules`
2. Click **Import Module**
3. Select a JSON file
4. Click **Import**
5. Should work without errors! ✅

## 🎯 What These Policies Do

### For `module-images` Bucket:
- **INSERT**: Teachers can upload images when creating modules
- **SELECT**: Everyone can view images (public access)
- **UPDATE**: Teachers can replace images
- **DELETE**: Teachers can delete images

### For `module-content` Bucket:
- **INSERT**: Teachers can upload module JSON files
- **SELECT**: Everyone can read module content (public access)
- **UPDATE**: Teachers can update module content
- **DELETE**: Teachers can delete modules

## 🔒 Security Notes

### Why Public Read Access?

Both buckets allow **public read** because:
- Module content is educational (meant to be shared)
- Images need to be displayed in browser
- Students need to access content without authentication
- RLS on database tables controls who can CREATE/UPDATE modules

### Who Can Upload?

Only **authenticated users** (logged-in teachers) can:
- Upload new files
- Update existing files
- Delete files

This prevents unauthorized uploads while allowing students to view content.

## 🐛 Troubleshooting

### Still Getting RLS Error?

1. **Check you're logged in**
   - The error happens if you're not authenticated
   - Make sure you're logged in as a teacher

2. **Check bucket names are correct**
   - Must be exactly: `module-images` and `module-content`
   - Case-sensitive!

3. **Check buckets exist**
   - Go to Storage → Buckets
   - Verify both buckets are created

4. **Check buckets are PUBLIC**
   - Click on bucket
   - Settings → Public bucket should be ✅ checked

5. **Re-run the SQL script**
   - Sometimes policies need to be recreated
   - Run `scripts/fix-storage-rls-policies.sql` again

### Error: "Bucket does not exist"

**Solution**: Create the buckets first!

1. Go to Storage → New bucket
2. Create `module-images` (PUBLIC ✅)
3. Create `module-content` (PUBLIC ✅)
4. Then run the RLS policy script

### Error: "Permission denied"

**Solution**: Check your user role

```sql
-- Check your role
SELECT role FROM profiles WHERE id = auth.uid();

-- Should return 'teacher'
```

If not a teacher, you can't upload modules.

## 📊 Policy Summary

```
storage.objects table
├── module-images bucket
│   ├── INSERT (authenticated) ✅
│   ├── SELECT (public) ✅
│   ├── UPDATE (authenticated) ✅
│   └── DELETE (authenticated) ✅
│
└── module-content bucket
    ├── INSERT (authenticated) ✅
    ├── SELECT (public) ✅
    ├── UPDATE (authenticated) ✅
    └── DELETE (authenticated) ✅
```

## ✅ Success Indicators

After fixing, you should be able to:

- ✅ Import modules without RLS errors
- ✅ Create new modules with images
- ✅ Edit existing modules
- ✅ Upload images to module-images bucket
- ✅ Upload JSON to module-content bucket
- ✅ View images in browser
- ✅ Load module content

## 🎉 You're Done!

Once the policies are set up, the RLS error will be gone and you can:
- Import modules
- Create modules
- Upload images
- Everything works! 🚀

---

**Need help?** Check the Supabase logs (Dashboard → Logs) for detailed error messages.
