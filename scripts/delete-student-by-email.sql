-- =============================================
-- DELETE STUDENT BY EMAIL
-- =============================================
-- Replace 'YOUR_EMAIL_HERE' with the actual email
-- =============================================

-- STEP 1: Replace this with the email you want to delete
-- Example: 'dylan212@gmail.com'
DO $
DECLARE
  email_to_delete TEXT := 'dylan212@gmail.com'; -- CHANGE THIS
  profile_count INTEGER;
  auth_count INTEGER;
BEGIN
  -- Check if exists in profiles
  SELECT COUNT(*) INTO profile_count
  FROM profiles
  WHERE LOWER(email) = LOWER(email_to_delete);
  
  -- Check if exists in auth.users
  SELECT COUNT(*) INTO auth_count
  FROM auth.users
  WHERE LOWER(email) = LOWER(email_to_delete);
  
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Checking for: %', email_to_delete;
  RAISE NOTICE '   Found in profiles: %', profile_count;
  RAISE NOTICE '   Found in auth.users: %', auth_count;
  RAISE NOTICE '';
  
  IF profile_count > 0 OR auth_count > 0 THEN
    RAISE NOTICE '🗑️  Deleting...';
    
    -- Delete from profiles
    DELETE FROM profiles WHERE LOWER(email) = LOWER(email_to_delete);
    
    -- Delete from auth.users
    DELETE FROM auth.users WHERE LOWER(email) = LOWER(email_to_delete);
    
    RAISE NOTICE '✅ Deleted successfully!';
  ELSE
    RAISE NOTICE '✅ Email does not exist - you can create this student now!';
  END IF;
  RAISE NOTICE '';
END $;

-- Verify deletion
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE LOWER(email) = 'dylan212@gmail.com')
    THEN '❌ Still in profiles'
    ELSE '✅ Not in profiles'
  END as profiles_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = 'dylan212@gmail.com')
    THEN '❌ Still in auth.users'
    ELSE '✅ Not in auth.users'
  END as auth_status;
