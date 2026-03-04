-- =============================================
-- FORCE DELETE dylan@gmail.com
-- =============================================
-- This will delete the email from everywhere
-- =============================================

-- Step 1: Delete from profiles (case-insensitive)
DELETE FROM profiles 
WHERE LOWER(email) = LOWER('dylan@gmail.com');

-- Step 2: Delete from auth.users (case-insensitive)
DELETE FROM auth.users 
WHERE LOWER(email) = LOWER('dylan@gmail.com');

-- Step 3: Verify deletion
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE LOWER(email) = LOWER('dylan@gmail.com'))
    THEN '❌ Still exists in profiles'
    ELSE '✅ Deleted from profiles'
  END as profiles_status;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER('dylan@gmail.com'))
    THEN '❌ Still exists in auth.users'
    ELSE '✅ Deleted from auth.users'
  END as auth_status;

-- Step 4: Success message
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Deletion complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Restart your dev server (Ctrl+C, then npm run dev)';
  RAISE NOTICE '2. Try creating dylan@gmail.com again';
  RAISE NOTICE '3. It should work now!';
  RAISE NOTICE '';
END $;
