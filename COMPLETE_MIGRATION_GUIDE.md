# Complete Database Migration Guide

## 🚨 Problem

You're seeing this error when accessing `/teacher/vark-modules`:
```json
{
  "code": "42703",
  "details": null,
  "hint": null,
  "message": "column vark_modules.prerequisite_module_id does not exist"
}
```

This happens because your frontend code references database columns that don't exist in your current database schema.

## 📋 What's Missing

Your code uses these columns that are missing from your database:

### vark_modules table:
- `prerequisite_module_id` - References another module as a prerequisite
- `json_content_url` - URL to full module content in storage
- `content_summary` - Lightweight summary of module content
- `target_class_id` - Target class for the module
- `target_learning_styles` - Array of learning styles
- `module_metadata` - Additional metadata

### vark_module_sections table:
- `learning_style_tags` - Array of learning style tags
- `interactive_elements` - Array of interactive elements
- `metadata` - Additional section metadata

### Missing tables:
- `student_module_submissions` - Student work submissions
- `module_completions` - Module completion records
- `student_badges` - Achievement badges
- `teacher_notifications` - Teacher notifications

## 🎯 Solution: Complete Migration Script

I've created a comprehensive migration script that will:

1. ✅ Add ALL missing columns to existing tables
2. ✅ Create ALL missing tables
3. ✅ Set up proper indexes for performance
4. ✅ Configure Row Level Security (RLS) policies
5. ✅ Update existing records with default values
6. ✅ Add documentation comments

## 🚀 How to Run the Migration

### Step 1: Open Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Sign in and select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration Script

1. Click **New Query**
2. Copy the entire contents of `scripts/migrations/COMPLETE_DB_MIGRATION.sql`
3. Paste it into the SQL editor
4. Click **Run** to execute

The script will:
- Add all missing columns
- Create all missing tables
- Set up indexes and RLS policies
- Show verification results

### Step 3: Create Storage Buckets

The migration script can't create storage buckets automatically. You need to create them manually:

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Create these buc2 buckets (both PUBLIC):

   **Bucket 1: module-images**
   - Name: `module-images`
   - Public: ✅ Yes
   - Purpose: Stores extracted images from module content

   **Bucket 2: module-content**
   - Name: `module-content`
   - Public: ✅ Yes
   - Purpose: Stores full module JSON files

### Step 4: Verify the Migration

Run these verification queries in SQL Editor:

```sql
-- Check vark_modules columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vark_modules' 
ORDER BY ordinal_position;

-- Check for prerequisite_module_id specifically
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'vark_modules' 
  AND column_name = 'prerequisite_module_id';

-- Check all VARK-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%vark%' 
    OR table_name IN ('module_completions', 'student_badges', 'teacher_notifications', 'student_module_submissions'))
ORDER BY table_name;
```

## 📊 Complete Database Schema

After migration, your database will have:

### Core Tables

#### vark_modules
```sql
- id (UUID, PK)
- category_id (UUID, FK)
- title (TEXT)
- description (TEXT)
- learning_objectives (JSONB)
- content_structure (JSONB)
- difficulty_level (TEXT)
- estimated_duration_minutes (INTEGER)
- prerequisites (JSONB)
- multimedia_content (JSONB)
- interactive_elements (JSONB)
- assessment_questions (JSONB)
- module_metadata (JSONB) ✨ NEW
- json_backup_url (TEXT)
- json_content_url (TEXT) ✨ NEW
- content_summary (JSONB) ✨ NEW
- target_class_id (UUID, FK) ✨ NEW
- target_learning_styles (JSONB) ✨ NEW
- prerequisite_module_id (UUID, FK) ✨ NEW
- is_published (BOOLEAN)
- created_by (UUID, FK)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### vark_module_sections
```sql
- id (UUID, PK)
- module_id (UUID, FK)
- title (TEXT)
- content_type (TEXT)
- content_data (JSONB)
- position (INTEGER)
- is_required (BOOLEAN)
- time_estimate_minutes (INTEGER)
- learning_style_tags (JSONB) ✨ NEW
- interactive_elements (JSONB) ✨ NEW
- metadata (JSONB) ✨ NEW
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### student_module_submissions ✨ NEW
```sql
- id (UUID, PK)
- student_id (UUID, FK)
- module_id (UUID, FK)
- section_id (TEXT)
- section_title (TEXT)
- section_type (TEXT)
- submission_data (JSONB)
- assessment_results (JSONB)
- time_spent_seconds (INTEGER)
- submission_status (TEXT)
- teacher_feedback (TEXT)
- teacher_score (DECIMAL)
- submitted_at (TIMESTAMP)
- reviewed_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(student_id, module_id, section_id)
```

#### module_completions ✨ NEW
```sql
- id (UUID, PK)
- student_id (UUID, FK)
- module_id (UUID, FK)
- completion_date (TIMESTAMP)
- final_score (DECIMAL)
- time_spent_minutes (INTEGER)
- pre_test_score (DECIMAL)
- post_test_score (DECIMAL)
- sections_completed (INTEGER)
- perfect_sections (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(student_id, module_id)
```

#### student_badges ✨ NEW
```sql
- id (UUID, PK)
- student_id (UUID, FK)
- badge_type (TEXT)
- badge_name (TEXT)
- badge_description (TEXT)
- badge_icon (TEXT)
- badge_rarity (TEXT)
- module_id (UUID, FK)
- earned_date (TIMESTAMP)
- criteria_met (JSONB)
- created_at (TIMESTAMP)
```

#### teacher_notifications ✨ NEW
```sql
- id (UUID, PK)
- teacher_id (UUID, FK)
- notification_type (TEXT)
- title (TEXT)
- message (TEXT)
- related_student_id (UUID, FK)
- related_module_id (UUID, FK)
- is_read (BOOLEAN)
- priority (TEXT)
- created_at (TIMESTAMP)
```

### Existing Tables (No Changes)
- vark_module_categories
- vark_module_progress
- vark_module_assignments
- vark_learning_paths
- vark_module_feedback

## 🔒 Security (RLS Policies)

The migration sets up these Row Level Security policies:

### vark_modules
- Teachers can manage their own modules
- Students can view published modules
- Service role has full access

### vark_module_progress
- Students can manage their own progress
- Teachers can view all student progress

### student_module_submissions
- Students can manage their own submissions
- Teachers can view and review all submissions

### module_completions
- Students can view their own completions
- Teachers can view all completions

### student_badges
- Students can view their own badges
- Teachers can view all badges

### teacher_notifications
- Teachers can manage their own notifications

## 🎯 Features Enabled After Migration

### 1. Module Prerequisites
```typescript
// Teachers can set prerequisite modules
{
  prerequisite_module_id: "uuid-of-prerequisite-module"
}
```

### 2. Class Targeting
```typescript
// Target specific classes and learning styles
{
  target_class_id: "uuid-of-class",
  target_learning_styles: ["visual", "kinesthetic"]
}
```

### 3. Content Storage Optimization
```typescript
// Large module content stored in Supabase Storage
{
  json_content_url: "https://...storage.../module-uuid.json",
  content_summary: {
    sections_count: 15,
    assessment_count: 2,
    has_multimedia: true
  }
}
```

### 4. Student Submissions
```typescript
// Track student work per section
{
  section_id: "section-1",
  submission_data: { answers: [...] },
  assessment_results: { score: 85 },
  submission_status: "submitted"
}
```

### 5. Module Completions
```typescript
// Track overall module completion
{
  final_score: 92,
  time_spent_minutes: 60,
  pre_test_score: 70,
  post_test_score: 95,
  sections_completed: 15,
  perfect_sections: 3
}
```

### 6. Achievement Badges
```typescript
// Award badges for achievements
{
  badge_type: "completion",
  badge_name: "Cell Division Master",
  badge_rarity: "gold",
  criteria_met: { perfect_score: true }
}
```

### 7. Teacher Notifications
```typescript
// Notify teachers of student activity
{
  notification_type: "submission",
  title: "New Submission",
  message: "John completed Cell Division module",
  priority: "normal"
}
```

## 🧪 Testing After Migration

### 1. Test Module Creation
```bash
# Start your dev server
npm run dev

# Navigate to
http://localhost:3001/teacher/vark-modules

# Try creating a new module
# Should work without errors!
```

### 2. Test Module Viewing
```bash
# Navigate to
http://localhost:3001/student/vark-modules

# Should see published modules
```

### 3. Test Database Queries
```sql
-- Test prerequisite_module_id column exists
SELECT id, title, prerequisite_module_id 
FROM vark_modules 
LIMIT 5;

-- Test new tables exist
SELECT COUNT(*) FROM student_module_submissions;
SELECT COUNT(*) FROM module_completions;
SELECT COUNT(*) FROM student_badges;
SELECT COUNT(*) FROM teacher_notifications;
```

## 🐛 Troubleshooting

### Error: "column still does not exist"
**Solution**: Make sure you ran the COMPLETE migration script, not just parts of it.

### Error: "relation does not exist"
**Solution**: Check that the table was created. Run:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'your_table_name';
```

### Error: "permission denied"
**Solution**: Check RLS policies are set up correctly:
```sql
SELECT * FROM pg_policies WHERE tablename = 'vark_modules';
```

### Error: "storage bucket not found"
**Solution**: Create the storage buckets manually in Supabase Dashboard (see Step 3 above).

### Error: "foreign key constraint"
**Solution**: Make sure the `classes` table exists if you're using `target_class_id`:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'classes';
```

## 📝 Migration Checklist

- [ ] Backed up current database (optional but recommended)
- [ ] Ran COMPLETE_DB_MIGRATION.sql in Supabase SQL Editor
- [ ] Created `module-images` storage bucket (PUBLIC)
- [ ] Created `module-content` storage bucket (PUBLIC)
- [ ] Verified all columns exist (ran verification queries)
- [ ] Verified all tables exist
- [ ] Tested module creation in teacher dashboard
- [ ] Tested module viewing in student dashboard
- [ ] Checked browser console for errors
- [ ] Checked Supabase logs for errors

## 🎉 Success Indicators

After successful migration, you should see:

✅ No "column does not exist" errors
✅ Teacher can create VARK modules
✅ Teacher can set prerequisites
✅ Teacher can target classes
✅ Students can view published modules
✅ Students can complete modules
✅ Module completions are tracked
✅ Badges are awarded
✅ Teacher notifications work

## 📞 Need Help?

If you encounter issues:

1. Check Supabase logs (Dashboard → Logs)
2. Check browser console for errors
3. Verify environment variables in `.env.local`
4. Check that all migration steps completed successfully
5. Review the verification queries output

## 🔄 Rollback (If Needed)

If you need to rollback the migration:

```sql
-- WARNING: This will delete data!
-- Only use if you need to start fresh

-- Drop new tables
DROP TABLE IF EXISTS public.teacher_notifications CASCADE;
DROP TABLE IF EXISTS public.student_badges CASCADE;
DROP TABLE IF EXISTS public.module_completions CASCADE;
DROP TABLE IF EXISTS public.student_module_submissions CASCADE;

-- Remove new columns from vark_modules
ALTER TABLE public.vark_modules 
DROP COLUMN IF EXISTS prerequisite_module_id,
DROP COLUMN IF EXISTS json_content_url,
DROP COLUMN IF EXISTS content_summary,
DROP COLUMN IF EXISTS target_class_id,
DROP COLUMN IF EXISTS target_learning_styles,
DROP COLUMN IF EXISTS module_metadata;

-- Remove new columns from vark_module_sections
ALTER TABLE public.vark_module_sections 
DROP COLUMN IF EXISTS learning_style_tags,
DROP COLUMN IF EXISTS interactive_elements,
DROP COLUMN IF EXISTS metadata;
```

---

**Ready to migrate?** Run the script and your database will be 100% compatible with all frontend features! 🚀
