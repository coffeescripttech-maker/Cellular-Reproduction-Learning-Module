-- =============================================
-- DELETE dylan@gmail.com FROM AUTH.USERS
-- =============================================
-- Run this to remove the ghost record
-- =============================================

-- This is the most likely fix for your issue
DELETE FROM auth.users 
WHERE LOWER(email) = LOWER('dylan@gmail.com');

-- Verify it's gone
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER('dylan@gmail.com'))
    THEN '❌ Still exists - check permissions'
    ELSE '✅ Successfully deleted!'
  END as result;

-- Success message
DO $
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER('dylan@gmail.com')) THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ =============================================';
    RAISE NOTICE '✅ GHOST RECORD DELETED!';
    RAISE NOTICE '✅ =============================================';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '   1. Restart your dev server (Ctrl+C, npm run dev)';
    RAISE NOTICE '   2. Try creating dylan@gmail.com again';
    RAISE NOTICE '   3. It should work now!';
    RAISE NOTICE '';
  END IF;
END $;
