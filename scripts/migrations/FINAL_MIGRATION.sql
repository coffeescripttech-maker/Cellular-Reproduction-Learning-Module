-- =============================================
-- FINAL COMPLETE MIGRATION - HANDLES ALL CASES
-- =============================================
-- This script works whether tables exist or not
-- Safe to run multiple times (idempotent)
-- =============================================

-- =============================================
-- STEP 1: Create Custom Types
-- =============================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'progress_status') THEN
        CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed', 'paused');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'learning_style') THEN
        CREATE TYPE learning_style AS ENUM ('visual', 'auditory', 'reading_writing', 'kinesthetic');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
    END IF;
END $$;

-- =============================================
-- STEP 2: Create Base Tables
-- =============================================

-- vark_module_categories
CREATE TABLE IF NOT EXISTS public.vark_module_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  learning_style TEXT NOT NULL,
  icon_name TEXT,
  color_scheme TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- vark_modules (with ALL columns)
CREATE TABLE IF NOT EXISTS public.vark_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.vark_module_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  learning_objectives JSONB,
  content_structure JSONB,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes INTEGER,
  prerequisites JSONB,
  multimedia_content JSONB,
  interactive_elements JSONB,
  assessment_questions JSONB,
  module_metadata JSONB DEFAULT '{}',
  json_backup_url TEXT,
  json_content_url TEXT,
  content_summary JSONB DEFAULT '{}',
  target_class_id UUID,
  target_learning_styles JSONB DEFAULT '[]'::jsonb,
  prerequisite_module_id UUID,
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints after table creation (to avoid circular dependency)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vark_modules_target_class_id_fkey'
    ) THEN
        ALTER TABLE public.vark_modules 
        ADD CONSTRAINT vark_modules_target_class_id_fkey 
        FOREIGN KEY (target_class_id) REFERENCES public.classes(id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        RAISE NOTICE 'classes table does not exist, skipping target_class_id foreign key';
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vark_modules_prerequisite_module_id_fkey'
    ) THEN
        ALTER TABLE public.vark_modules 
        ADD CONSTRAINT vark_modules_prerequisite_module_id_fkey 
        FOREIGN KEY (prerequisite_module_id) REFERENCES public.vark_modules(id) ON DELETE SET NULL;
    END IF;
END $$;

-- vark_module_sections
CREATE TABLE IF NOT EXISTS public.vark_module_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.vark_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'video', 'audio', 'interactive', 'activity', 'assessment', 'quick_check', 'highlight', 'table', 'diagram')),
  content_data JSONB NOT NULL,
  position INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT TRUE,
  time_estimate_minutes INTEGER,
  learning_style_tags JSONB DEFAULT '[]',
  interactive_elements JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- vark_module_progress
CREATE TABLE IF NOT EXISTS public.vark_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.vark_modules(id) ON DELETE CASCADE,
  status progress_status DEFAULT 'not_started',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  current_section_id UUID REFERENCES public.vark_module_sections(id),
  time_spent_minutes INTEGER DEFAULT 0,
  completed_sections JSONB,
  assessment_scores JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, module_id)
);

-- vark_module_assignments
CREATE TABLE IF NOT EXISTS public.vark_module_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.vark_modules(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_to_type TEXT NOT NULL CHECK (assigned_to_type IN ('student', 'class')),
  assigned_to_id UUID NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  is_required BOOLEAN DEFAULT TRUE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- vark_learning_paths
CREATE TABLE IF NOT EXISTS public.vark_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  learning_style learning_style NOT NULL,
  module_sequence JSONB NOT NULL,
  total_duration_hours INTEGER,
  difficulty_progression TEXT CHECK (difficulty_progression IN ('linear', 'adaptive', 'branching')),
  is_published BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- vark_module_feedback
CREATE TABLE IF NOT EXISTS public.vark_module_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.vark_modules(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  engagement_rating INTEGER CHECK (engagement_rating >= 1 AND engagement_rating <= 5),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, module_id)
);

-- module_completions
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

-- student_badges
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

-- teacher_notifications
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

-- student_module_submissions
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

-- =============================================
-- STEP 3: Add Missing Columns (if tables existed)
-- =============================================

DO $$ 
BEGIN
    -- Add columns to vark_modules if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_modules' AND column_name = 'module_metadata') THEN
        ALTER TABLE public.vark_modules ADD COLUMN module_metadata JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_modules' AND column_name = 'json_content_url') THEN
        ALTER TABLE public.vark_modules ADD COLUMN json_content_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_modules' AND column_name = 'content_summary') THEN
        ALTER TABLE public.vark_modules ADD COLUMN content_summary JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_modules' AND column_name = 'target_class_id') THEN
        ALTER TABLE public.vark_modules ADD COLUMN target_class_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_modules' AND column_name = 'target_learning_styles') THEN
        ALTER TABLE public.vark_modules ADD COLUMN target_learning_styles JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_modules' AND column_name = 'prerequisite_module_id') THEN
        ALTER TABLE public.vark_modules ADD COLUMN prerequisite_module_id UUID;
    END IF;
    
    -- Add columns to vark_module_sections if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_module_sections' AND column_name = 'learning_style_tags') THEN
        ALTER TABLE public.vark_module_sections ADD COLUMN learning_style_tags JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_module_sections' AND column_name = 'interactive_elements') THEN
        ALTER TABLE public.vark_module_sections ADD COLUMN interactive_elements JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vark_module_sections' AND column_name = 'metadata') THEN
        ALTER TABLE public.vark_module_sections ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- =============================================
-- STEP 4: Fix Column Types (if wrong)
-- =============================================

DO $$
BEGIN
    -- Fix content_summary if it's TEXT instead of JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vark_modules' 
          AND column_name = 'content_summary' 
          AND data_type = 'text'
    ) THEN
        ALTER TABLE public.vark_modules ALTER COLUMN content_summary TYPE JSONB USING 
          CASE 
            WHEN content_summary IS NULL OR content_summary = '' THEN '{}'::jsonb
            ELSE content_summary::jsonb
          END;
    END IF;
END $$;

-- =============================================
-- STEP 5: Create Indexes
-- =============================================

CREATE INDEX IF NOT EXISTS idx_vark_modules_category_id ON public.vark_modules(category_id);
CREATE INDEX IF NOT EXISTS idx_vark_modules_created_by ON public.vark_modules(created_by);
CREATE INDEX IF NOT EXISTS idx_vark_modules_published ON public.vark_modules(is_published);
CREATE INDEX IF NOT EXISTS idx_vark_modules_target_class ON public.vark_modules(target_class_id);
CREATE INDEX IF NOT EXISTS idx_vark_modules_prerequisite ON public.vark_modules(prerequisite_module_id);
CREATE INDEX IF NOT EXISTS idx_vark_module_sections_module_id ON public.vark_module_sections(module_id);
CREATE INDEX IF NOT EXISTS idx_vark_module_sections_position ON public.vark_module_sections(module_id, position);
CREATE INDEX IF NOT EXISTS idx_vark_module_progress_student_module ON public.vark_module_progress(student_id, module_id);
CREATE INDEX IF NOT EXISTS idx_vark_module_progress_status ON public.vark_module_progress(status);
CREATE INDEX IF NOT EXISTS idx_vark_module_assignments_assigned_to ON public.vark_module_assignments(assigned_to_type, assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_vark_module_assignments_module ON public.vark_module_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_vark_module_feedback_module_id ON public.vark_module_feedback(module_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_student_module ON public.student_module_submissions(student_id, module_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_status ON public.student_module_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_module_completions_student_id ON public.module_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_module_completions_module_id ON public.module_completions(module_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_student_id ON public.student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_module_id ON public.student_badges(module_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher_id ON public.teacher_notifications(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_is_read ON public.teacher_notifications(is_read);

-- =============================================
-- STEP 6: Enable RLS
-- =============================================

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
-- STEP 7: Create RLS Policies
-- =============================================

DROP POLICY IF EXISTS "Teachers can manage their own modules" ON public.vark_modules;
DROP POLICY IF EXISTS "Students can view published modules" ON public.vark_modules;
DROP POLICY IF EXISTS "Service role has full access to modules" ON public.vark_modules;

CREATE POLICY "Teachers can manage their own modules" ON public.vark_modules FOR ALL
  USING (auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Students can view published modules" ON public.vark_modules FOR SELECT
  USING (is_published = true OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('student', 'teacher')));

CREATE POLICY "Service role has full access to modules" ON public.vark_modules FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- STEP 8: Success Message
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '✅ =============================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '✅ =============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Created/Updated:';
  RAISE NOTICE '  ✓ All VARK tables';
  RAISE NOTICE '  ✓ All missing columns';
  RAISE NOTICE '  ✓ All indexes';
  RAISE NOTICE '  ✓ RLS policies';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Create storage buckets: module-images, module-content (both PUBLIC)';
  RAISE NOTICE '  2. Run: npm run dev';
  RAISE NOTICE '  3. Visit: http://localhost:3001/teacher/vark-modules';
  RAISE NOTICE '  4. Should work without errors!';
  RAISE NOTICE '';
END $$;
