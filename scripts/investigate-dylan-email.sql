-- =============================================
-- INVESTIGATE dylan@gmail.com ISSUE
-- =============================================
-- The duplicate check returns null but insert fails
-- Let's find out why
-- =============================================

-- 1. Check profiles table (case-sensitive)
SELECT 
  '1. Exact match (case-sensitive)' as check_type,
  id, email, first_name, last_name, role, created_at
FROM profiles
WHERE email = 'dylan@gmail.com';

-- 2. Check profiles table (case-insensitive)
SELECT 
  '2. Case-insensitive match' as check_type,
  id, email, first_name, last_name, role, created_at
FROM profiles
WHERE LOWER(email) = LOWER('dylan@gmail.com');

-- 3. Check for similar emails
SELECT 
  '3. Similar emails' as check_type,
  id, email, first_name, last_name, role, created_at
FROM profiles
WHERE email LIKE '%dylan%'
   OR email LIKE '%gmail%';

-- 4. Check all emails in profiles
SELECT 
  '4. All profiles with gmail' as check_type,
  id, email, first_name, last_name, role, created_at
FROM profiles
WHERE email LIKE '%@gmail.com%'
ORDER BY created_at DESC;

-- 5. Check the unique constraint
SELECT
  '5. Unique constraint info' as check_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'u'; -- unique constraints

-- 6. Check indexes on email column
SELECT
  '6. Indexes on email' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexdef LIKE '%email%';

-- 7. Try to find the conflicting record by querying with service role
-- This simulates what the admin client should see
SET ROLE postgres;
SELECT 
  '7. As postgres role' as check_type,
  id, email, first_name, last_name, role, created_at
FROM profiles
WHERE email = 'dylan@gmail.com';
RESET ROLE;

-- 8. Check if there's a trigger or rule that might be interfering
SELECT
  '8. Triggers on profiles' as check_type,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 9. Count total profiles
SELECT 
  '9. Total profiles count' as check_type,
  COUNT(*) as total,
  COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
  COUNT(CASE WHEN role = 'teacher' THEN 1 END) as teachers
FROM profiles;

-- 10. Check for any RLS policies that might affect SELECT
SELECT
  '10. RLS policies on profiles' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- =============================================
-- SUMMARY
-- =============================================
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📋 INVESTIGATION COMPLETE';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the results above to find:';
  RAISE NOTICE '1. Does dylan@gmail.com exist? (Check #1 and #2)';
  RAISE NOTICE '2. Are there similar emails? (Check #3 and #4)';
  RAISE NOTICE '3. What is the unique constraint? (Check #5)';
  RAISE NOTICE '4. Are there RLS policies blocking SELECT? (Check #10)';
  RAISE NOTICE '';
END $;
