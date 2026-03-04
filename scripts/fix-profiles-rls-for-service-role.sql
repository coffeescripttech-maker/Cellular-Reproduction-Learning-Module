-- =============================================
-- FIX PROFILES RLS FOR SERVICE ROLE
-- =============================================
-- This ensures service_role can read all profiles
-- =============================================

-- 1. Check current RLS policies
SELECT 
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

-- 2. Add policy for service_role to SELECT all profiles
DROP POLICY IF EXISTS "Service role can read all profiles" ON public.profiles;
CREATE POLICY "Service role can read all profiles"
ON public.profiles FOR SELECT
TO service_role
USING (true);

-- 3. Add policy for service_role to INSERT profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
ON public.profiles FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Add policy for service_role to UPDATE profiles
DROP POLICY IF EXISTS "Service role can update profiles" ON public.profiles;
CREATE POLICY "Service role can update profiles"
ON public.profiles FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Add policy for service_role to DELETE profiles
DROP POLICY IF EXISTS "Service role can delete profiles" ON public.profiles;
CREATE POLICY "Service role can delete profiles"
ON public.profiles FOR DELETE
TO service_role
USING (true);

-- 6. Verify policies were created
SELECT 
  '✅ Service role policies' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
  AND 'service_role' = ANY(roles)
ORDER BY policyname;

-- 7. Test query as service_role would see it
SELECT 
  '🧪 Test: Can we see profiles?' as test,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'student' THEN 1 END) as students
FROM profiles;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ =============================================';
  RAISE NOTICE '✅ SERVICE ROLE RLS POLICIES CONFIGURED!';
  RAISE NOTICE '✅ =============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies Created:';
  RAISE NOTICE '   ✓ Service role can SELECT all profiles';
  RAISE NOTICE '   ✓ Service role can INSERT profiles';
  RAISE NOTICE '   ✓ Service role can UPDATE profiles';
  RAISE NOTICE '   ✓ Service role can DELETE profiles';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '   1. Restart your dev server';
  RAISE NOTICE '   2. Try creating a student again';
  RAISE NOTICE '   3. Duplicate check should now work!';
  RAISE NOTICE '';
END $;
