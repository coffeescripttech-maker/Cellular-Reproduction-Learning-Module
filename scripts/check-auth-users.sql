-- =============================================
-- CHECK AUTH.USERS TABLE FOR GHOST RECORDS
-- =============================================
-- This checks for emails in auth.users that don't have profiles
-- =============================================

-- 1. Check if dylan@gmail.com exists in auth.users
SELECT 
  '1. Dylan in auth.users' as check_type,
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users
WHERE LOWER(email) = LOWER('dylan@gmail.com');

-- 2. Check if dylan@gmail.com exists in profiles
SELECT 
  '2. Dylan in profiles' as check_type,
  id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM profiles
WHERE LOWER(email) = LOWER('dylan@gmail.com');

-- 3. Find all auth users WITHOUT matching profiles (orphaned auth users)
SELECT 
  '3. Orphaned auth users' as check_type,
  u.id,
  u.email,
  u.created_at,
  'NO PROFILE' as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC
LIMIT 20;

-- 4. Count orphaned users
SELECT 
  '4. Orphaned count' as check_type,
  COUNT(*) as orphaned_auth_users
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- =============================================
-- CLEANUP COMMANDS (Uncomment to use)
-- =============================================

-- Delete dylan@gmail.com from auth.users
/*
DELETE FROM auth.users 
WHERE LOWER(email) = LOWER('dylan@gmail.com');
*/

-- Delete ALL orphaned auth users (use with caution!)
/*
DELETE FROM auth.users
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  LEFT JOIN profiles p ON u.id = p.id
  WHERE p.id IS NULL
);
*/

-- =============================================
-- VERIFICATION
-- =============================================

DO $
DECLARE
  auth_exists BOOLEAN;
  profile_exists BOOLEAN;
BEGIN
  -- Check auth.users
  SELECT EXISTS(
    SELECT 1 FROM auth.users 
    WHERE LOWER(email) = LOWER('dylan@gmail.com')
  ) INTO auth_exists;
  
  -- Check profiles
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE LOWER(email) = LOWER('dylan@gmail.com')
  ) INTO profile_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📋 GHOST RECORD INVESTIGATION';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  
  IF auth_exists AND NOT profile_exists THEN
    RAISE NOTICE '👻 GHOST RECORD FOUND!';
    RAISE NOTICE '   Email exists in auth.users but NOT in profiles';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 To fix, uncomment and run:';
    RAISE NOTICE '   DELETE FROM auth.users WHERE LOWER(email) = LOWER(''dylan@gmail.com'');';
  ELSIF auth_exists AND profile_exists THEN
    RAISE NOTICE '✅ Email exists in BOTH auth.users and profiles';
    RAISE NOTICE '   This is normal - delete from profiles first if needed';
  ELSIF NOT auth_exists AND profile_exists THEN
    RAISE NOTICE '⚠️  Email exists in profiles but NOT in auth.users';
    RAISE NOTICE '   This is unusual - the profile is orphaned';
  ELSE
    RAISE NOTICE '✅ Email does NOT exist in either table';
    RAISE NOTICE '   You should be able to create this student now!';
  END IF;
  
  RAISE NOTICE '';
END $;
