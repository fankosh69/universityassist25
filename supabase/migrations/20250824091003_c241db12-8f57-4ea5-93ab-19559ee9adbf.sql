-- University Assist Database Schema & Seed Data

-- Types
CREATE TYPE IF NOT EXISTS degree_level AS ENUM ('bachelor','master');
CREATE TYPE IF NOT EXISTS intake_season AS ENUM ('winter','summer');

-- Cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'DE',
  state TEXT,
  slug TEXT UNIQUE NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}',
  search_doc JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Institutions table (rename from universities for consistency)
CREATE TABLE IF NOT EXISTS public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'DE',
  city_id UUID REFERENCES public.cities(id),
  slug TEXT UNIQUE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  external_refs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs table (updated structure)
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS institution_id UUID,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS major TEXT,
ADD COLUMN IF NOT EXISTS language_of_instruction TEXT[] DEFAULT ARRAY['de'],
ADD COLUMN IF NOT EXISTS tuition_eur NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'on_campus';

-- Update existing programs to use new structure
UPDATE public.programs SET 
  title = name,
  major = field_of_study,
  institution_id = university_id
WHERE title IS NULL;

-- Student academics table
CREATE TABLE IF NOT EXISTS public.student_academics (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  curriculum TEXT,
  prev_major TEXT,
  gpa_raw NUMERIC(5,2),
  gpa_scale_max NUMERIC(5,2),
  gpa_min_pass NUMERIC(5,2),
  gpa_de NUMERIC(3,2),
  target_level degree_level,
  target_intake TEXT CHECK (target_intake IN ('winter','summer')),
  language_certificates JSONB DEFAULT '[]',
  ects_total NUMERIC(6,1),
  extras JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program matches table
CREATE TABLE IF NOT EXISTS public.program_matches (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  components JSONB DEFAULT '{}',
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, program_id)
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, program_id)
);

-- Ambassadors table
CREATE TABLE IF NOT EXISTS public.ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city_id UUID REFERENCES public.cities(id),
  university_id UUID REFERENCES public.universities(id),
  linkedin_url TEXT,
  photo_url TEXT,
  testimonial TEXT,
  video_url TEXT,
  languages TEXT[] DEFAULT '{}',
  study_programs TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_degree ON public.programs(degree_level);
CREATE INDEX IF NOT EXISTS idx_programs_lang ON public.programs USING GIN (language_of_instruction);
CREATE INDEX IF NOT EXISTS idx_programs_search ON public.programs USING GIN (search_doc);
CREATE INDEX IF NOT EXISTS idx_cities_search ON public.cities USING GIN (search_doc);
CREATE INDEX IF NOT EXISTS idx_ambassadors_city ON public.ambassadors(city_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_university ON public.ambassadors(university_id);

-- RLS Policies
ALTER TABLE public.student_academics ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own academics" ON public.student_academics
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.program_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own matches" ON public.program_matches
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own watchlist" ON public.watchlist
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public can view published ambassadors" ON public.ambassadors
  FOR SELECT USING (is_published = true);
CREATE POLICY IF NOT EXISTS "Users can manage own ambassador profile" ON public.ambassadors
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Public read policies for reference data
CREATE POLICY IF NOT EXISTS "Public can view cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Public can view institutions" ON public.institutions FOR SELECT USING (true);

-- Seed Data
INSERT INTO public.cities (name, country_code, state, slug, lat, lng, metadata) VALUES
('Berlin', 'DE', 'Berlin', 'berlin', 52.5200, 13.4050, '{"population": 3669491, "timezone": "Europe/Berlin"}')
ON CONFLICT (slug) DO NOTHING;

-- Get Berlin city ID for reference
INSERT INTO public.institutions (name, country_code, city_id, slug, lat, lng, external_refs) 
SELECT 
  'Humboldt University Berlin', 
  'DE', 
  c.id, 
  'humboldt-university-berlin', 
  52.5170, 
  13.3975,
  '{"website": "https://www.hu-berlin.de", "type": "public"}'
FROM public.cities c WHERE c.slug = 'berlin'
ON CONFLICT (slug) DO NOTHING;

-- Update existing universities table if it exists
UPDATE public.universities SET 
  city_id = c.id,
  lat = 52.5170,
  lng = 13.3975
FROM public.cities c 
WHERE c.slug = 'berlin' AND universities.name = 'Humboldt University Berlin';

-- Sample programs with proper structure
INSERT INTO public.programs (
  institution_id, title, major, degree_level, language_of_instruction, 
  uni_assist_required, tuition_eur, delivery_mode, slug, published, metadata
) 
SELECT 
  i.id,
  'Data Science',
  'Computer Science',
  'master'::degree_level,
  ARRAY['en', 'de'],
  true,
  500.00,
  'on_campus',
  'data-science-berlin',
  true,
  '{"duration_semesters": 4, "ects_credits": 120}'
FROM public.institutions i WHERE i.slug = 'humboldt-university-berlin'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.programs (
  institution_id, title, major, degree_level, language_of_instruction, 
  uni_assist_required, tuition_eur, delivery_mode, slug, published, metadata
) 
SELECT 
  i.id,
  'International Business',
  'Business Administration',
  'bachelor'::degree_level,
  ARRAY['en'],
  false,
  0.00,
  'on_campus',
  'international-business-berlin',
  true,
  '{"duration_semesters": 6, "ects_credits": 180}'
FROM public.institutions i WHERE i.slug = 'humboldt-university-berlin'
ON CONFLICT (slug) DO NOTHING;

-- Program deadlines
INSERT INTO public.program_deadlines (program_id, intake, application_deadline, notes)
SELECT p.id, 'winter', '2024-07-15', 'For winter semester starting in October'
FROM public.programs p WHERE p.slug = 'data-science-berlin'
ON CONFLICT DO NOTHING;

INSERT INTO public.program_deadlines (program_id, intake, application_deadline, notes)
SELECT p.id, 'summer', '2025-01-15', 'For summer semester starting in April'
FROM public.programs p WHERE p.slug = 'data-science-berlin'
ON CONFLICT DO NOTHING;

INSERT INTO public.program_deadlines (program_id, intake, application_deadline, notes)
SELECT p.id, 'winter', '2024-07-31', 'For winter semester starting in October'
FROM public.programs p WHERE p.slug = 'international-business-berlin'
ON CONFLICT DO NOTHING;

-- Program requirements
INSERT INTO public.program_requirements (program_id, requirement_type, details)
SELECT p.id, 'gpa', '{"minimum": 2.5, "scale": "german"}'
FROM public.programs p WHERE p.slug = 'data-science-berlin'
ON CONFLICT DO NOTHING;

INSERT INTO public.program_requirements (program_id, requirement_type, details)
SELECT p.id, 'language', '{"english": "B2", "german": null}'
FROM public.programs p WHERE p.slug = 'data-science-berlin'
ON CONFLICT DO NOTHING;

INSERT INTO public.program_requirements (program_id, requirement_type, details)
SELECT p.id, 'ects', '{"minimum": 180, "field": "computer_science"}'
FROM public.programs p WHERE p.slug = 'data-science-berlin'
ON CONFLICT DO NOTHING;

-- Update search documents
UPDATE public.programs SET search_doc = jsonb_build_object(
  'title', title,
  'major', major,
  'degree_level', degree_level,
  'language_of_instruction', language_of_instruction,
  'uni_assist_required', uni_assist_required
);

UPDATE public.cities SET search_doc = jsonb_build_object(
  'name', name,
  'country_code', country_code,
  'state', state
);