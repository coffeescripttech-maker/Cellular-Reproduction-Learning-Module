-- =============================================
-- CLEANUP DUPLICATE OR ORPHANED STUDENTS
-- =============================================
-- Use this to remove students that are causing duplicate errors
-- =============================================

-- OPTION 1: View all students with a specific email
-- Run this first to see what exists
SELECT 
  id,
  email,
  first_name,
  last_name,
  full_name,
  role,
  created_at,
  onboarding_completed
FROM profiles
WHERE email = 'dylan@gmail.com';

-- OPTION 2: Delete a specific student by email
-- Uncomment and run this to delete the student
/*
DELETE FROM profiles 
WHERE email = 'dylan@gmail.com';
*/

-- OPTION 3: Delete a specific student by ID
-- Use this if you want to delete a specific record
/*
DELETE FROM profiles 
WHERE id = 'paste-student-id-here';
*/

-- OPTION 4: Find and list all duplicate emails
SELECT 
  email,
  COUNT(*) as count,
  array_agg(id) as student_ids,
  array_agg(full_name) as names
FROM profiles
WHERE role = 'student'
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- OPTION 5: Delete all but the most recent duplicate
-- This keeps the newest record for each duplicate email
/*
DELETE FROM profiles
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      email,
      ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM profiles
    WHERE role = 'student'
  ) ranked
  WHERE rn > 1
);
*/

-- OPTION 6: View students created in the last hour
-- Useful to see recent test data
SELECT 
  id,
  email,
  first_name,
  last_name,
  created_at
FROM profiles
WHERE role = 'student'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- OPTION 7: Delete all students created in the last hour
-- Use with caution! Only for cleaning up test data
/*
DELETE FROM profiles
WHERE role = 'student'
  AND created_at > NOW() - INTERVAL '1 hour';
*/

-- =============================================
-- VERIFICATION
-- =============================================

-- After cleanup, verify no duplicates remain
DO $
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email
    FROM profiles
    WHERE role = 'student'
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE '⚠️  Still have % duplicate emails', duplicate_count;
  ELSE
    RAISE NOTICE '✅ No duplicate emails found!';
  END IF;
END $;

-- Count total students
SELECT 
  '📊 Total students: ' || COUNT(*) as summary
FROM profiles
WHERE role = 'student';
