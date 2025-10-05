-- Create enum for eligibility pathways
CREATE TYPE eligibility_pathway AS ENUM (
  'direct_admission',
  'studienkolleg_required',
  'not_eligible',
  'conditional'
);

-- Create enum for education systems
CREATE TYPE education_system AS ENUM (
  'abitur',
  'a_levels',
  'ib',
  'us_high_school',
  'indian_higher_secondary',
  'chinese_gaokao',
  'french_baccalaureat',
  'other'
);

-- Table for country-specific admission requirements
CREATE TABLE IF NOT EXISTS public.admission_requirements_by_country (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  education_system education_system NOT NULL,
  degree_level degree_level NOT NULL, -- bachelor or master
  
  -- Eligibility rules
  direct_admission_criteria JSONB DEFAULT '{}',
  studienkolleg_criteria JSONB DEFAULT '{}',
  
  -- Required documents
  required_documents TEXT[] DEFAULT '{}',
  
  -- Language requirements
  min_german_level TEXT, -- e.g., 'B2', 'C1', 'TestDaF 4x4'
  accepts_english BOOLEAN DEFAULT false,
  min_english_level TEXT, -- e.g., 'IELTS 6.5', 'TOEFL 90'
  
  -- Additional requirements
  aps_certificate_required BOOLEAN DEFAULT false,
  entrance_exam_required BOOLEAN DEFAULT false,
  additional_notes TEXT,
  
  -- Metadata
  source_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_admission_req_country ON public.admission_requirements_by_country(country_code, degree_level);

-- Table to store user eligibility checks (audit trail)
CREATE TABLE IF NOT EXISTS public.eligibility_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- User inputs
  country_of_origin TEXT NOT NULL,
  education_system education_system NOT NULL,
  highest_education_level TEXT NOT NULL,
  target_degree_level degree_level NOT NULL,
  
  -- Academic details
  grades_data JSONB DEFAULT '{}', -- stores GPA, grades, etc.
  language_certificates JSONB DEFAULT '{}',
  has_aps_certificate BOOLEAN DEFAULT false,
  
  -- Results
  eligibility_status eligibility_pathway NOT NULL,
  missing_requirements TEXT[] DEFAULT '{}',
  recommended_actions TEXT[] DEFAULT '{}',
  eligible_programs UUID[] DEFAULT '{}', -- array of program IDs
  
  -- Metadata
  check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.admission_requirements_by_country ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admission_requirements_by_country
CREATE POLICY "Public can view admission requirements"
  ON public.admission_requirements_by_country
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage admission requirements"
  ON public.admission_requirements_by_country
  FOR ALL
  USING (has_role('admin'::app_role));

-- RLS Policies for eligibility_checks
CREATE POLICY "Users can view own eligibility checks"
  ON public.eligibility_checks
  FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own eligibility checks"
  ON public.eligibility_checks
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can view all eligibility checks"
  ON public.eligibility_checks
  FOR SELECT
  USING (has_role('admin'::app_role));

-- Insert sample requirements for common countries
INSERT INTO public.admission_requirements_by_country (
  country_code, country_name, education_system, degree_level,
  direct_admission_criteria, studienkolleg_criteria, required_documents,
  min_german_level, accepts_english, aps_certificate_required, additional_notes
) VALUES
  -- Egypt - Bachelor's
  ('EG', 'Egypt', 'other', 'bachelor',
   '{"min_thanawiya_score": 75, "university_study_years": 0}'::jsonb,
   '{"min_thanawiya_score": 65, "university_study_years": 0}'::jsonb,
   ARRAY['Thanawiya Amma Certificate', 'Official translations', 'Birth certificate'],
   'B2', true, false,
   'Egyptian students need Thanawiya Amma. One year of university study may be required for direct admission.'),
   
  -- India - Bachelor's
  ('IN', 'India', 'indian_higher_secondary', 'bachelor',
   '{"min_percentage": 75, "university_study_years": 1}'::jsonb,
   '{"min_percentage": 65, "university_study_years": 0}'::jsonb,
   ARRAY['Higher Secondary Certificate (10+2)', 'University transcripts', 'Official translations'],
   'B2', true, false,
   'Indian students typically need 1 year of university study for direct Bachelor admission in Germany.'),
   
  -- USA - Bachelor's
  ('US', 'United States', 'us_high_school', 'bachelor',
   '{"min_gpa": 3.0, "sat_score": 1200, "ap_courses": 2}'::jsonb,
   '{"min_gpa": 2.5}'::jsonb,
   ARRAY['High School Diploma', 'SAT/ACT scores', 'Transcripts'],
   'B2', true, false,
   'US students need High School Diploma + SAT/ACT + AP courses or 1 year of university.'),
   
  -- UK - Bachelor's
  ('GB', 'United Kingdom', 'a_levels', 'bachelor',
   '{"min_a_levels": 3, "min_grade": "C"}'::jsonb,
   '{}'::jsonb,
   ARRAY['A-Level certificates', 'GCSE certificates'],
   'B2', true, false,
   'UK students with 3 A-Levels qualify for direct admission to German universities.'),
   
  -- China - Bachelor's
  ('CN', 'China', 'chinese_gaokao', 'bachelor',
   '{"min_gaokao_percentage": 70, "university_study_years": 0}'::jsonb,
   '{"min_gaokao_percentage": 60}'::jsonb,
   ARRAY['Gaokao certificate', 'High school diploma', 'Official translations'],
   'B2', true, true,
   'Chinese students need Gaokao and APS certificate. Direct admission with high Gaokao scores.');

COMMENT ON TABLE public.admission_requirements_by_country IS 'Country-specific admission requirements based on DAAD and Uni-Assist guidelines';
COMMENT ON TABLE public.eligibility_checks IS 'Audit trail of user eligibility checks with results and recommendations';