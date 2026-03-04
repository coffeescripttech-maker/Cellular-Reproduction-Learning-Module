-- =============================================
-- TEST PROFILES TABLE STRUCTURE
-- =============================================
-- Run this to verify your profiles table is set up correctly
-- =============================================

-- 1. Check if profiles table exists
DO $
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
    RAISE NOTICE '✅ profiles table exists';
  ELSE
    RAISE NOTICE '❌ profiles table does NOT exist!';
  END IF;
END $;

-- 2. List all columns in profiles table
SELECT 
  '📋 Column: ' || column_name || 
  ' | Type: ' || data_type || 
  ' | Nullable: ' || is_nullable ||
  ' | Default: ' || COALESCE(column_default, 'none') AS column_info
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check for required columns
DO $
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check each required column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'id') THEN
    missing_columns := array_append(missing_columns, 'id');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    missing_columns := array_append(missing_columns, 'email');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'first_name') THEN
    missing_columns := array_append(missing_columns, 'first_name');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_name') THEN
    missing_columns := array_append(missing_columns, 'last_name');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    missing_columns := array_append(missing_columns, 'role');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'learning_style') THEN
    missing_columns := array_append(missing_columns, 'learning_style');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_modules') THEN
    missing_columns := array_append(missing_columns, 'preferred_modules');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'learning_type') THEN
    missing_columns := array_append(missing_columns, 'learning_type');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE NOTICE '❌ Missing columns: %', array_to_string(missing_columns, ', ');
    RAISE NOTICE '💡 Run BULLETPROOF_MIGRATION.sql to add missing columns';
  ELSE
    RAISE NOTICE '✅ All required columns exist!';
  END IF;
END $;

-- 4. Check RLS policies
SELECT 
  '🔒 Policy: ' || policyname || 
  ' | Command: ' || cmd ||
  ' | Roles: ' || COALESCE(roles::TEXT, 'all') AS policy_info
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. Test if we can query the table
DO $
DECLARE
  student_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO student_count FROM profiles WHERE role = 'student';
  RAISE NOTICE '📊 Current student count: %', student_count;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Error querying profiles table: %', SQLERRM;
END $;

-- 6. Check for duplicate emails
SELECT 
  email,
  COUNT(*) as count
FROM profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- If no results, that's good!
DO $
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email
    FROM profiles
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE '⚠️  Found % duplicate emails', duplicate_count;
  ELSE
    RAISE NOTICE '✅ No duplicate emails found';
  END IF;
END $;

-- 7. Summary
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📋 PROFILES TABLE DIAGNOSTIC COMPLETE';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If you see any ❌ errors above:';
  RAISE NOTICE '1. Run scripts/migrations/BULLETPROOF_MIGRATION.sql';
  RAISE NOTICE '2. Restart your dev server';
  RAISE NOTICE '3. Try creating the student again';
  RAISE NOTICE '';
END $;
