-- ================================
-- UNIVERSITY ASSIST - MISSING SCHEMA ADDITIONS
-- Only adding what's not already present
-- ================================

-- Add missing columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferred_language') THEN
    ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'ar', 'de'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'parent', 'school_counselor', 'university_staff', 'company_sales', 'company_admissions', 'marketing', 'admin'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_minor') THEN
    ALTER TABLE profiles ADD COLUMN is_minor BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='parent_consent_given') THEN
    ALTER TABLE profiles ADD COLUMN parent_consent_given BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp_points') THEN
    ALTER TABLE profiles ADD COLUMN xp_points INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='level') THEN
    ALTER TABLE profiles ADD COLUMN level INTEGER DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='streak_days') THEN
    ALTER TABLE profiles ADD COLUMN streak_days INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_activity_date') THEN
    ALTER TABLE profiles ADD COLUMN last_activity_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Student academics table
CREATE TABLE IF NOT EXISTS student_academics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  curriculum TEXT NOT NULL,
  previous_major TEXT,
  gpa_raw DECIMAL(4,2),
  gpa_scale DECIMAL(4,2),
  gpa_min_pass DECIMAL(4,2),
  german_gpa DECIMAL(3,2),
  total_ects INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE student_academics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own academics" ON student_academics;
CREATE POLICY "Users can manage their own academics" ON student_academics
  FOR ALL USING (auth.uid() = profile_id);

-- Language proficiency
CREATE TABLE IF NOT EXISTS language_proficiency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('en', 'de', 'fr', 'es', 'ar')),
  cefr_level TEXT CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  test_type TEXT,
  test_score TEXT,
  certificate_url TEXT,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE language_proficiency ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own language records" ON language_proficiency;
CREATE POLICY "Users can manage their own language records" ON language_proficiency
  FOR ALL USING (auth.uid() = profile_id);

-- Documents storage
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('transcript', 'diploma', 'language_certificate', 'passport', 'cv', 'motivation_letter', 'recommendation', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reviewing')),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own documents" ON documents;
CREATE POLICY "Users can manage their own documents" ON documents
  FOR ALL USING (auth.uid() = profile_id);

-- OCR extractions
CREATE TABLE IF NOT EXISTS ocr_extractions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extracted_text JSONB,
  table_data JSONB,
  ects_mapping JSONB,
  quality_score DECIMAL(3,2),
  needs_review BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ocr_extractions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own OCR data" ON ocr_extractions;
CREATE POLICY "Users can view their own OCR data" ON ocr_extractions
  FOR SELECT USING (
    auth.uid() IN (
      SELECT profile_id FROM documents WHERE id = document_id
    )
  );

-- Program matches (enhanced version)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='program_matches_v2') THEN
    CREATE TABLE program_matches_v2 (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      program_id UUID NOT NULL,
      match_score DECIMAL(4,2),
      eligibility_status TEXT CHECK (eligibility_status IN ('eligible', 'borderline', 'missing')),
      gpa_score DECIMAL(4,2),
      language_score DECIMAL(4,2),
      ects_score DECIMAL(4,2),
      intake_score DECIMAL(4,2),
      gap_analysis JSONB,
      calculated_at TIMESTAMPTZ DEFAULT now()
    );
    
    ALTER TABLE program_matches_v2 ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own matches v2" ON program_matches_v2
      FOR SELECT USING (auth.uid() = profile_id);
  END IF;
END $$;

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(profile_id, program_id)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own watchlist" ON watchlist;
CREATE POLICY "Users can manage their own watchlist" ON watchlist
  FOR ALL USING (auth.uid() = profile_id);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted')),
  intake_term TEXT,
  intake_year INTEGER,
  submitted_at TIMESTAMPTZ,
  university_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own applications" ON applications;
CREATE POLICY "Users can manage their own applications" ON applications
  FOR ALL USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "University staff can view applications" ON applications;
CREATE POLICY "University staff can view applications" ON applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'university_staff'
      AND university_visible = true
    )
  );

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  task_type TEXT CHECK (task_type IN ('deadline', 'document', 'test', 'custom')),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = profile_id);

-- XP events
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own XP events" ON xp_events;
CREATE POLICY "Users can view their own XP events" ON xp_events
  FOR SELECT USING (auth.uid() = profile_id);

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  title_de TEXT,
  description_en TEXT,
  description_ar TEXT,
  description_de TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = profile_id);

-- Update existing ambassadors table with missing columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambassadors' AND column_name='arrival_date') THEN
    ALTER TABLE ambassadors ADD COLUMN arrival_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambassadors' AND column_name='program_name') THEN
    ALTER TABLE ambassadors ADD COLUMN program_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambassadors' AND column_name='nationality') THEN
    ALTER TABLE ambassadors ADD COLUMN nationality TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambassadors' AND column_name='consent_given') THEN
    ALTER TABLE ambassadors ADD COLUMN consent_given BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambassadors' AND column_name='consent_date') THEN
    ALTER TABLE ambassadors ADD COLUMN consent_date TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambassadors' AND column_name='status') THEN
    ALTER TABLE ambassadors ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ambassadors' AND column_name='approved_at') THEN
    ALTER TABLE ambassadors ADD COLUMN approved_at TIMESTAMPTZ;
  END IF;
END $$;

-- Location events for ambassador detection
CREATE TABLE IF NOT EXISTS location_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  city TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  detection_method TEXT CHECK (detection_method IN ('ip', 'gps'))
);

ALTER TABLE location_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own location events" ON location_events;
CREATE POLICY "Users can view their own location events" ON location_events
  FOR SELECT USING (auth.uid() = profile_id);

-- Counselor students
CREATE TABLE IF NOT EXISTS counselor_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  counselor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_name TEXT,
  cohort_year INTEGER,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(counselor_id, student_id)
);

ALTER TABLE counselor_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Counselors can view their students" ON counselor_students;
CREATE POLICY "Counselors can view their students" ON counselor_students
  FOR SELECT USING (auth.uid() = counselor_id);

-- Message templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_type TEXT CHECK (template_type IN ('email', 'whatsapp', 'push')),
  variables JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Message outbox
CREATE TABLE IF NOT EXISTS message_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  message_type TEXT CHECK (message_type IN ('email', 'whatsapp', 'push')),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'read')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_academics_profile ON student_academics(profile_id);
CREATE INDEX IF NOT EXISTS idx_language_proficiency_profile ON language_proficiency(profile_id);
CREATE INDEX IF NOT EXISTS idx_documents_profile_status ON documents(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_ocr_extractions_document ON ocr_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_profile_program ON watchlist(profile_id, program_id);
CREATE INDEX IF NOT EXISTS idx_applications_profile_status ON applications(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_profile_due ON tasks(profile_id, due_date);
CREATE INDEX IF NOT EXISTS idx_xp_events_profile ON xp_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_location_events_profile ON location_events(profile_id);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_student_academics_updated_at ON student_academics;
CREATE TRIGGER update_student_academics_updated_at
  BEFORE UPDATE ON student_academics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();