-- =============================================
-- COMPLETE DATABASE MIGRATION FOR VARK MODULES
-- =============================================
-- This script ensures ALL columns used in the frontend exist
-- Run this in your Supabase SQL Editor
-- =============================================

-- =============================================
-- STEP 1: Add ALL Missing Columns
-- =============================================

-- Add missing columns to vark_modules table
ALTER TABLE public.vark_modules 
ADD COLUMN IF NOT EXISTS module_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS target_learning_styles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prerequisite_module_id UUID REFERENCES public.vark_modules(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS json_content_url TEXT,
ADD COLUMN IF NOT EXISTS content_summary JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS json_backup_url TEXT;

-- Add missing columns to vark_module_sections table
ALTER TABLE public.vark_module_sections 
ADD COLUMN IF NOT EXISTS learning_style_tags JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS interactive_elements JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- =============================================
-- STEP 2: Update Constraints
-- =============================================

-- Update content_type check constraint to include all types
ALTER TABLE public.vark_module_sections 
DROP CONSTRAINT IF EXISTS vark_module_sections_content_type_check;

ALTER TABLE public.vark_module_sections 
ADD CONSTRAINT vark_module_sections_content_type_check 
CHECK (content_type IN ('text', 'video', 'audio', 'interactive', 'activity', 'assessment', 'quick_check', 'highlight', 'table', 'diagram'));

-- =============================================
-- STEP 3: Create Custom Types (if not exist)
-- =============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
        CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'paused');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_style') THEN
        CREATE TYPE learning_style AS ENUM ('visual', 'auditory', 'reading_writing', 'kinesthetic');
    END IF;
END $$;

-- =============================================
-- STEP 4: Create Missing Tables
-- =============================================

-- Create student_module_submissions table (for student work)
CREATE TABLE IF NOT EXISTS public.student_module_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.vark_modules(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  section_title TEXT NOT NULL,
  section_type TEXT NOT NULL,
  submission_data JSONB NOT NULL,
  assessment_results JSONB,
  time_spent_seconds INTEGER DEFAULT 0,
  submission_status TEXT DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted', 'reviewed')),
  teacher_feedback TEXT,
  teacher_score DECIMAL(5,2),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, module_id, section_id)
);

-- Create module_completions table (if not exists)
CREATE TABLE IF NOT EXISTS public.module_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.vark_modules(id) ON DELETE CASCADE,
  completion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  final_score DECIMAL(5,2),
  time_spent_minutes INTEGER DEFAULT 0,
  pre_test_score DECIMAL(5,2),
  post_test_score DECIMAL(5,2),
  sections_completed INTEGER DEFAULT 0,
  perfect_sections INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, module_id)
);

-- Create student_badges table (if not exists)
CREATE TABLE IF NOT EXISTS public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  badge_icon TEXT,
  badge_rarity TEXT CHECK (badge_rarity IN ('bronze', 'silver', 'gold', 'platinum')),
  module_id UUID REFERENCES public.vark_modules(id) ON DELETE SET NULL,
  earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criteria_met JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teacher_notifications table (if not exists)
CREATE TABLE IF NOT EXISTS public.teacher_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_module_id UUID REFERENCES public.vark_modules(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 5: Create Storage Buckets (via SQL)
-- =============================================

-- Note: Storage buckets are typically created via Supabase Dashboard
-- But we'll document what's needed:
-- 1. module-images (PUBLIC) - for extracted images from modules
-- 2. module-content (PUBLIC) - for full module JSON files

-- =============================================
-- STEP 6: Create Indexes for Performance
-- =============================================

-- Indexes for vark_modules
CREATE INDEX IF NOT EXISTS idx_vark_modules_category_id ON public.vark_modules(category_id);
CREATE INDEX IF NOT EXISTS idx_vark_modules_created_by ON public.vark_modules(created_by);
CREATE INDEX IF NOT EXISTS idx_vark_modules_published ON public.vark_modules(is_published);
CREATE INDEX IF NOT EXISTS idx_vark_modules_target_class ON public.vark_modules(target_class_id);
CREATE INDEX IF NOT EXISTS idx_vark_modules_prerequisite ON public.vark_modules(prerequisite_module_id);

-- Indexes for vark_module_sections
CREATE INDEX IF NOT EXISTS idx_vark_module_sections_module_id ON public.vark_module_sections(module_id);
CREATE INDEX IF NOT EXISTS idx_vark_module_sections_position ON public.vark_module_sections(module_id, position);

-- Indexes for vark_module_progress
CREATE INDEX IF NOT EXISTS idx_vark_module_progress_student_module ON public.vark_module_progress(student_id, module_id);
CREATE INDEX IF NOT EXISTS idx_vark_module_progress_status ON public.vark_module_progress(status);

-- Indexes for vark_module_assignments
CREATE INDEX IF NOT EXISTS idx_vark_module_assignments_assigned_to ON public.vark_module_assignments(assigned_to_type, assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_vark_module_assignments_module ON public.vark_module_assignments(module_id);

-- Indexes for student_module_submissions
CREATE INDEX IF NOT EXISTS idx_student_submissions_student_module ON public.student_module_submissions(student_id, module_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_status ON public.student_module_submissions(submission_status);

-- Indexes for module_completions
CREATE INDEX IF NOT EXISTS idx_module_completions_student_id ON public.module_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON public.module_completions(module_id);

-- Indexes for student_badges
CREATE INDEX IF NOT EXISTS idx_student_badges_student_id ON public.student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_module_id ON public.student_badges(module_id);

-- Indexes for teacher_notifications
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher_id ON public.teacher_notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_is_read ON public.teacher_notifications(is_read);

-- =============================================
-- STEP 7: Update Existing Records
-- =============================================

-- Update existing vark_modules records with default values
UPDATE public.vark_modules 
SET 
  module_metadata = COALESCE(module_metadata, '{}'::jsonb),
  target_learning_styles = COALESCE(target_learning_styles, '[]'::jsonb),
  content_summary = COALESCE(content_summary, '{}'::jsonb)
WHERE module_metadata IS NULL 
   OR target_learning_styles IS NULL 
   OR content_summary IS NULL;

-- Update existing vark_module_sections records with default values
UPDATE public.vark_module_sections 
SET 
  learning_style_tags = COALESCE(learning_style_tags, '[]'::jsonb),
  interactive_elements = COALESCE(interactive_elements, '[]'::jsonb),
  metadata = COALESCE(metadata, '{}'::jsonb)
WHERE learning_style_tags IS NULL 
   OR interactive_elements IS NULL 
   OR metadata IS NULL;

-- =============================================
-- STEP 8: Add Column Comments (Documentation)
-- =============================================

-- vark_modules comments
COMMENT ON COLUMN public.vark_modules.module_metadata IS 'Additional metadata: content standards, competencies, key concepts, vocabulary, real-world applications, extension activities, assessment rubrics, accessibility features';
COMMENT ON COLUMN public.vark_modules.target_class_id IS 'Reference to the target class for this module (optional)';
COMMENT ON COLUMN public.vark_modules.target_learning_styles IS 'Array of learning styles this module targets (visual, auditory, reading_writing, kinesthetic)';
COMMENT ON COLUMN public.vark_modules.prerequisite_module_id IS 'Reference to a prerequisite module that should be completed first';
COMMENT ON COLUMN public.vark_modules.json_content_url IS 'URL to full module content stored in Supabase Storage (reduces database payload)';
COMMENT ON COLUMN public.vark_modules.content_summary IS 'Lightweight summary of module content (sections count, assessment count, has multimedia)';
COMMENT ON COLUMN public.vark_modules.json_backup_url IS 'Legacy backup URL (deprecated, use json_content_url instead)';

-- vark_module_sections comments
COMMENT ON COLUMN public.vark_module_sections.learning_style_tags IS 'Array of learning style tags (visual, auditory, reading_writing, kinesthetic)';
COMMENT ON COLUMN public.vark_module_sections.interactive_elements IS 'Array of interactive element types for this section';
COMMENT ON COLUMN public.vark_module_sections.metadata IS 'Additional metadata: difficulty, key points, visual aids, audio clips';

-- =============================================
-- STEP 9: Enable Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.vark_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vark_module_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vark_module_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vark_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vark_module_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vark_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vark_module_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_module_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 10: Create RLS Policies
-- =============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Teachers can manage their own modules" ON public.vark_modules;
DROP POLICY IF EXISTS "Students can view published modules" ON public.vark_modules;
DROP POLICY IF EXISTS "Service role has full access to modules" ON public.vark_modules;

-- vark_modules policies
CREATE POLICY "Teachers can manage their own modules"
  ON public.vark_modules
  FOR ALL
  USING (
    auth.uid() = created_by 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Students can view published modules"
  ON public.vark_modules
  FOR SELECT
  USING (
    is_published = true 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('student', 'teacher')
    )
  );

CREATE POLICY "Service role has full access to modules"
  ON public.vark_modules
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- vark_module_progress policies
DROP POLICY IF EXISTS "Students can manage their own progress" ON public.vark_module_progress;
DROP POLICY IF EXISTS "Teachers can view student progress" ON public.vark_module_progress;

CREATE POLICY "Students can manage their own progress"
  ON public.vark_module_progress
  FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view student progress"
  ON public.vark_module_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- student_module_submissions policies
DROP POLICY IF EXISTS "Students can manage their own submissions" ON public.student_module_submissions;
DROP POLICY IF EXISTS "Teachers can view and review submissions" ON public.student_module_submissions;

CREATE POLICY "Students can manage their own submissions"
  ON public.student_module_submissions
  FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view and review submissions"
  ON public.student_module_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- module_completions policies
DROP POLICY IF EXISTS "Students can view their own completions" ON public.module_completions;
DROP POLICY IF EXISTS "Teachers can view all completions" ON public.module_completions;

CREATE POLICY "Students can view their own completions"
  ON public.module_completions
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all completions"
  ON public.module_completions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- student_badges policies
DROP POLICY IF EXISTS "Students can view their own badges" ON public.student_badges;
DROP POLICY IF EXISTS "Teachers can view all badges" ON public.student_badges;

CREATE POLICY "Students can view their own badges"
  ON public.student_badges
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all badges"
  ON public.student_badges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- teacher_notifications policies
DROP POLICY IF EXISTS "Teachers can manage their own notifications" ON public.teacher_notifications;

CREATE POLICY "Teachers can manage their own notifications"
  ON public.teacher_notifications
  FOR ALL
  USING (auth.uid() = teacher_id);

-- =============================================
-- STEP 11: Verification Queries
-- =============================================

-- Verify all columns exist in vark_modules
SELECT 
  'vark_modules columns' as table_info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'vark_modules'
ORDER BY ordinal_position;

-- Verify all columns exist in vark_module_sections
SELECT 
  'vark_module_sections columns' as table_info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'vark_module_sections'
ORDER BY ordinal_position;

-- Verify all tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE '%vark%' OR table_name IN ('module_completions', 'student_badges', 'teacher_notifications', 'student_module_submissions')
ORDER BY table_name;

-- =============================================
-- STEP 12: Success Message
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ =============================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '✅ =============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '  ✓ Added missing columns to vark_modules';
  RAISE NOTICE '  ✓ Added missing columns to vark_module_sections';
  RAISE NOTICE '  ✓ Created student_module_submissions table';
  RAISE NOTICE '  ✓ Created module_completions table';
  RAISE NOTICE '  ✓ Created student_badges table';
  RAISE NOTICE '  ✓ Created teacher_notifications table';
  RAISE NOTICE '  ✓ Created all necessary indexes';
  RAISE NOTICE '  ✓ Set up Row Level Security policies';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Create storage buckets in Supabase Dashboard:';
  RAISE NOTICE '     - module-images (PUBLIC)';
  RAISE NOTICE '     - module-content (PUBLIC)';
  RAISE NOTICE '  2. Test your application at http://localhost:3001/teacher/vark-modules';
  RAISE NOTICE '  3. The prerequisite_module_id error should be resolved!';
  RAISE NOTICE '';
END $$;
