# Create Storage Buckets in Supabase

After running the migration script, you need to create two storage buckets manually.

## 📦 Bucket 1: module-images

**Purpose**: Stores extracted images from module content (reduces database payload)

### Steps:
1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Fill in:
   - **Name**: `module-images`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: 50 MB (default is fine)
   - **Allowed MIME types**: Leave empty (allow all image types)
4. Click **Create bucket**

### Verification:
```sql
-- Test upload (in your app)
const { data, error } = await supabase.storage
  .from('module-images')
  .upload('test.png', file);
```

---

## 📦 Bucket 2: module-content

**Purpose**: Stores full module JSON files (enables unlimited module sizes)

### Steps:
1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Fill in:
   - **Name**: `module-content`
   - **Public bucket**: ✅ **YES** (check this box)
   - **File size limit**: 50 MB (or higher if you have large modules)
   - **Allowed MIME types**: `application/json` (optional)
4. Click **Create bucket**

### Verification:
```sql
-- Test upload (in your app)
const { data, error } = await supabase.storage
  .from('module-content')
  .upload('test-module.json', jsonBlob);
```

---

## 🔒 Security Note

Both buckets are set to **PUBLIC** because:
- Module content is meant to be accessible to students
- Images need to be displayed in the browser
- RLS policies on the database tables control who can CREATE/UPDATE modules
- Public read access is safe for educational content

If you need more security:
1. Keep buckets private
2. Generate signed URLs for access
3. Update the API code to use signed URLs instead of public URLs

---

## ✅ Verification Checklist

After creating both buckets:

- [ ] `module-images` bucket exists
- [ ] `module-images` is set to PUBLIC
- [ ] `module-content` bucket exists
- [ ] `module-content` is set to PUBLIC
- [ ] Can upload files to both buckets (test in app)
- [ ] Can access uploaded files via public URL

---

## 🎯 Next Steps

1. ✅ Created storage buckets
2. ⏭️ Test your application: `npm run dev`
3. ⏭️ Visit: `http://localhost:3001/teacher/vark-modules`
4. ⏭️ Try creating a VARK module with images!

---

## 🐛 Troubleshooting

### Error: "Bucket already exists"
- Good! It means the bucket was already created
- Just verify it's set to PUBLIC

### Error: "Storage API not enabled"
- Go to Settings → API
- Enable Storage API

### Error: "Permission denied"
- Check bucket is set to PUBLIC
- Check your API keys in `.env.local`

### Can't see buckets in dashboard
- Refresh the page
- Check you're in the correct project
- Check your account has proper permissions
