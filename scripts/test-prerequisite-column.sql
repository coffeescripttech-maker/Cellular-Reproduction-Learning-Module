-- =============================================
-- QUICK TEST: Check if prerequisite_module_id exists
-- =============================================
-- Run this to quickly verify the main issue is fixed
-- =============================================

-- Test 1: Check if column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND table_name = 'vark_modules' 
        AND column_name = 'prerequisite_module_id'
    ) THEN '✅ SUCCESS: prerequisite_module_id column EXISTS!'
    ELSE '❌ FAILED: prerequisite_module_id column MISSING - Run migration script!'
  END as result;

-- Test 2: Show column details
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'vark_modules' 
  AND column_name = 'prerequisite_module_id';

-- Test 3: Try to query the column (this will fail if column doesn't exist)
SELECT 
  id,
  title,
  prerequisite_module_id
FROM vark_modules 
LIMIT 1;

-- If you see results above, the migration worked! ✅
