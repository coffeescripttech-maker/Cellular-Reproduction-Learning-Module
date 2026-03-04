-- =============================================
-- FIX STORAGE BUCKET RLS POLICIES
-- =============================================
-- This script sets up proper RLS policies for storage buckets
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- STEP 1: Enable RLS on Storage Buckets
-- =============================================

-- Note: Storage buckets use a different RLS system than regular tables
-- We need to set policies on storage.objects table

-- =============================================
-- STEP 2: Create Policies for module-images Bucket
-- =============================================

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Allow authenticated uploads to module-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to module-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'module-images');

-- Allow public read access to images
DROP POLICY IF EXISTS "Allow public read access to module-images" ON storage.objects;
CREATE POLICY "Allow public read access to module-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'module-images');

-- Allow authenticated users to update their images
DROP POLICY IF EXISTS "Allow authenticated updates to module-images" ON storage.objects;
CREATE POLICY "Allow authenticated updates to module-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'module-images')
WITH CHECK (bucket_id = 'module-images');

-- Allow authenticated users to delete their images
DROP POLICY IF EXISTS "Allow authenticated deletes from module-images" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from module-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'module-images');

-- =============================================
-- STEP 3: Create Policies for module-content Bucket
-- =============================================

-- Allow authenticated users to upload module content
DROP POLICY IF EXISTS "Allow authenticated uploads to module-content" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to module-content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'module-content');

-- Allow public read access to module content
DROP POLICY IF EXISTS "Allow public read access to module-content" ON storage.objects;
CREATE POLICY "Allow public read access to module-content"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'module-content');

-- Allow authenticated users to update module content
DROP POLICY IF EXISTS "Allow authenticated updates to module-content" ON storage.objects;
CREATE POLICY "Allow authenticated updates to module-content"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'module-content')
WITH CHECK (bucket_id = 'module-content');

-- Allow authenticated users to delete module content
DROP POLICY IF EXISTS "Allow authenticated deletes from module-content" ON storage.objects;
CREATE POLICY "Allow authenticated deletes from module-content"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'module-content');

-- =============================================
-- STEP 4: Verify Policies
-- =============================================

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- =============================================
-- STEP 5: Success Message
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ =============================================';
  RAISE NOTICE '✅ STORAGE RLS POLICIES CONFIGURED!';
  RAISE NOTICE '✅ =============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies Created:';
  RAISE NOTICE '  ✓ module-images: INSERT, SELECT, UPDATE, DELETE';
  RAISE NOTICE '  ✓ module-content: INSERT, SELECT, UPDATE, DELETE';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security:';
  RAISE NOTICE '  ✓ Authenticated users can upload/update/delete';
  RAISE NOTICE '  ✓ Public users can read (view images and content)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Try importing a module again';
  RAISE NOTICE '  2. Should work without RLS errors!';
  RAISE NOTICE '';
END $$;
