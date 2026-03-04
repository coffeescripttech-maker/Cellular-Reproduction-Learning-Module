-- =============================================
-- FIX PROFILES RLS FOR SERVICE ROLE (SIMPLE VERSION)
-- =============================================
-- Run each statement one at a time if needed
-- =============================================

-- Add policy for service_role to SELECT all profiles
DROP POLICY IF EXISTS "Service role can read all profiles" ON public.profiles;
CREATE POLICY "Service role can read all profiles"
ON public.profiles FOR SELECT
TO service_role
USING (true);

-- Add policy for service_role to INSERT profiles
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
CREATE POLICY "Service role can insert profiles"
ON public.profiles FOR INSERT
TO service_role
WITH CHECK (true);

-- Add policy for service_role to UPDATE profiles
DROP POLICY IF EXISTS "Service role can update profiles" ON public.profiles;
CREATE POLICY "Service role can update profiles"
ON public.profiles FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Add policy for service_role to DELETE profiles
DROP POLICY IF EXISTS "Service role can delete profiles" ON public.profiles;
CREATE POLICY "Service role can delete profiles"
ON public.profiles FOR DELETE
TO service_role
USING (true);

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
  AND 'service_role' = ANY(roles)
ORDER BY policyname;
