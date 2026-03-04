-- =============================================
-- VERIFICATION SCRIPT
-- =============================================
-- Run this AFTER the migration to verify everything worked
-- =============================================

-- =============================================
-- 1. Check All Required Columns Exist
-- =============================================

SELECT 
  '✅ Checking vark_modules columns...' as status;

SELECT 
  column_name,
  data_type,
  CASE 
    WHEN column_name IN (
      'prerequisite_module_id',
      'json_content_url',
      'content_summary',
      'target_class_id',
      'target_learning_styles',
      'module_metadata'
    ) THEN '✨ NEW'
    ELSE '✓ Existing'
  END as column_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'vark_modules'
ORDER BY ordinal_position;

-- =============================================
-- 2. Verify Specific Critical Columns
-- =============================================

SELECT 
  '✅ Verifying critical columns...' as status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vark_modules' 
        AND column_name = 'prerequisite_module_id'
    ) THEN '✅ prerequisite_module_id EXISTS'
    ELSE '❌ prerequisite_module_id MISSING'
  END as prerequisite_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vark_modules' 
        AND column_name = 'json_content_url'
    ) THEN '✅ json_content_url EXISTS'
    ELSE '❌ json_content_url MISSING'
  END as json_url_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vark_modules' 
        AND column_name = 'target_class_id'
    ) THEN '✅ target_class_id EXISTS'
    ELSE '❌ target_class_id MISSING'
  END as target_class_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'vark_modules' 
        AND column_name = 'target_learning_styles'
    ) THEN '✅ target_learning_styles EXISTS'
    ELSE '❌ target_learning_styles MISSING'
  END as target_styles_check;

-- =============================================
-- 3. Check All Required Tables Exist
-- =============================================

SELECT 
  '✅ Checking all tables exist...' as status;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'student_module_submissions',
      'module_completions',
      'student_badges',
      'teacher_notifications'
    ) THEN '✨ NEW'
    ELSE '✓ Existing'
  END as table_status,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE '%vark%' 
    OR table_name IN ('module_completions', 'student_badges', 'teacher_notifications', 'student_module_submissions')
  )
ORDER BY table_name;

-- =============================================
-- 4. Verify New Tables Exist
-- =============================================

SELECT 
  '✅ Verifying new tables...' as status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'student_module_submissions'
    ) THEN '✅ student_module_submissions EXISTS'
    ELSE '❌ student_module_submissions MISSING'
  END as submissions_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'module_completions'
    ) THEN '✅ module_completions EXISTS'
    ELSE '❌ module_completions MISSING'
  END as completions_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'student_badges'
    ) THEN '✅ student_badges EXISTS'
    ELSE '❌ student_badges MISSING'
  END as badges_check,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'teacher_notifications'
    ) THEN '✅ teacher_notifications EXISTS'
    ELSE '❌ teacher_notifications MISSING'
  END as notifications_check;

-- =============================================
-- 5. Check Indexes Were Created
-- =============================================

SELECT 
  '✅ Checking indexes...' as status;

SELECT 
  schemaname,
  tablename,
  indexname,
  CASE 
    WHEN indexname LIKE '%prerequisite%' THEN '✨ NEW'
    WHEN indexname LIKE '%target_class%' THEN '✨ NEW'
    WHEN indexname LIKE '%submissions%' THEN '✨ NEW'
    WHEN indexname LIKE '%completions%' THEN '✨ NEW'
    WHEN indexname LIKE '%badges%' THEN '✨ NEW'
    WHEN indexname LIKE '%notifications%' THEN '✨ NEW'
    ELSE '✓ Existing'
  END as index_status
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%vark%' 
    OR tablename IN ('module_completions', 'student_badges', 'teacher_notifications', 'student_module_submissions')
  )
ORDER BY tablename, indexname;

-- =============================================
-- 6. Check RLS Policies
-- =============================================

SELECT 
  '✅ Checking RLS policies...' as status;

SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ SELECT'
    WHEN cmd = 'INSERT' THEN '➕ INSERT'
    WHEN cmd = 'UPDATE' THEN '✏️ UPDATE'
    WHEN cmd = 'DELETE' THEN '🗑️ DELETE'
    WHEN cmd = 'ALL' THEN '🔓 ALL'
    ELSE cmd
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%vark%' 
    OR tablename IN ('module_completions', 'student_badges', 'teacher_notifications', 'student_module_submissions')
  )
ORDER BY tablename, policyname;

-- =============================================
-- 7. Test Data Integrity
-- =============================================

SELECT 
  '✅ Testing data integrity...' as status;

-- Count existing modules
SELECT 
  'vark_modules' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN prerequisite_module_id IS NOT NULL THEN 1 END) as with_prerequisites,
  COUNT(CASE WHEN json_content_url IS NOT NULL THEN 1 END) as with_json_url,
  COUNT(CASE WHEN target_class_id IS NOT NULL THEN 1 END) as with_target_class
FROM vark_modules;

-- Count new tables (should be 0 initially)
SELECT 'student_module_submissions' as table_name, COUNT(*) as row_count FROM student_module_submissions
UNION ALL
SELECT 'module_completions', COUNT(*) FROM module_completions
UNION ALL
SELECT 'student_badges', COUNT(*) FROM student_badges
UNION ALL
SELECT 'teacher_notifications', COUNT(*) FROM teacher_notifications;

-- =============================================
-- 8. Final Summary
-- =============================================

SELECT 
  '✅ =============================================' as summary;
SELECT 
  '✅ MIGRATION VERIFICATION COMPLETE!' as summary;
SELECT 
  '✅ =============================================' as summary;

SELECT 
  '📊 Summary:' as info;

SELECT 
  CONCAT(
    '✓ vark_modules has ',
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'vark_modules'),
    ' columns'
  ) as info;

SELECT 
  CONCAT(
    '✓ Found ',
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'public' 
       AND (table_name LIKE '%vark%' OR table_name IN ('module_completions', 'student_badges', 'teacher_notifications', 'student_module_submissions'))),
    ' VARK-related tables'
  ) as info;

SELECT 
  CONCAT(
    '✓ Created ',
    (SELECT COUNT(*) FROM pg_indexes 
     WHERE schemaname = 'public' 
       AND (tablename LIKE '%vark%' OR tablename IN ('module_completions', 'student_badges', 'teacher_notifications', 'student_module_submissions'))),
    ' indexes'
  ) as info;

SELECT 
  CONCAT(
    '✓ Set up ',
    (SELECT COUNT(*) FROM pg_policies 
     WHERE schemaname = 'public' 
       AND (tablename LIKE '%vark%' OR tablename IN ('module_completions', 'student_badges', 'teacher_notifications', 'student_module_submissions'))),
    ' RLS policies'
  ) as info;

SELECT 
  '🎯 Next Steps:' as info;
SELECT 
  '1. Create storage buckets: module-images, module-content' as step;
SELECT 
  '2. Test your application: npm run dev' as step;
SELECT 
  '3. Visit: http://localhost:3001/teacher/vark-modules' as step;
SELECT 
  '4. Try creating a VARK module!' as step;

SELECT 
  '✅ If all checks passed, your database is ready! 🎉' as final_message;
