-- =============================================
-- VERIFY DATABASE CONNECTION
-- =============================================
-- This shows which database you're connected to
-- and checks for the dylan@gmail.com email
-- =============================================

-- 1. Show current database connection info
SELECT 
  '1. Database Info' as check_type,
  current_database() as database_name,
  current_user as current_user,
  inet_server_addr() as server_ip,
  version() as postgres_version;

-- 2. Show the Supabase project reference (if available)
SELECT 
  '2. Project Reference' as check_type,
  current_setting('app.settings.project_ref', true) as project_ref;

-- 3. Check for dylan@gmail.com in profiles (all variations)
SELECT 
  '3. Dylan in profiles (exact)' as check_type,
  COUNT(*) as count,
  array_agg(email) as emails
FROM profiles
WHERE email = 'dylan@gmail.com';

SELECT 
  '3. Dylan in profiles (case-insensitive)' as check_type,
  COUNT(*) as count,
  array_agg(email) as emails
FROM profiles
WHERE LOWER(email) = 'dylan@gmail.com';

SELECT 
  '3. Dylan in profiles (ILIKE)' as check_type,
  COUNT(*) as count,
  array_agg(email) as emails
FROM profiles
WHERE email ILIKE 'dylan@gmail.com';

-- 4. Check for dylan@gmail.com in auth.users (all variations)
SELECT 
  '4. Dylan in auth.users (exact)' as check_type,
  COUNT(*) as count,
  array_agg(email) as emails
FROM auth.users
WHERE email = 'dylan@gmail.com';

SELECT 
  '4. Dylan in auth.users (case-insensitive)' as check_type,
  COUNT(*) as count,
  array_agg(email) as emails
FROM auth.users
WHERE LOWER(email) = 'dylan@gmail.com';

-- 5. Show ALL emails in profiles (to see what's there)
SELECT 
  '5. All emails in profiles' as check_type,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- 6. Show the unique constraint on profiles.email
SELECT
  '6. Email unique constraint' as check_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'u'
  AND conname LIKE '%email%';

-- 7. Show indexes on email column
SELECT
  '7. Email indexes' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexdef ILIKE '%email%';

-- 8. Try to find ANY record with 'dylan' in it
SELECT 
  '8. Any record with dylan' as check_type,
  id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM profiles
WHERE email ILIKE '%dylan%'
   OR first_name ILIKE '%dylan%'
   OR last_name ILIKE '%dylan%'
ORDER BY created_at DESC;

-- =============================================
-- SUMMARY
-- =============================================
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📋 DATABASE CONNECTION VERIFICATION';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ You are connected to: %', current_database();
  RAISE NOTICE '✅ Current user: %', current_user;
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Check the results above to see:';
  RAISE NOTICE '   1. Which database you are connected to';
  RAISE NOTICE '   2. If dylan@gmail.com exists anywhere';
  RAISE NOTICE '   3. What the unique constraint looks like';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Make sure you are checking the SAME database';
  RAISE NOTICE '   that your code is using:';
  RAISE NOTICE '   https://skhgelcmvbwkgzzkbawu.supabase.co';
  RAISE NOTICE '';
END $;
