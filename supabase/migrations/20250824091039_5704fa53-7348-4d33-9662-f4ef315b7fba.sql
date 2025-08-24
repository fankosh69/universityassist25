-- University Assist Database Schema & Seed Data (Fixed)

-- Create types (handling existing types)
DO $$ BEGIN
    CREATE TYPE degree_level AS ENUM ('bachelor','master');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE intake_season AS ENUM ('winter','summer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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
DROP POLICY IF EXISTS "Users can manage own academics" ON public.student_academics;
CREATE POLICY "Users can manage own academics" ON public.student_academics
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.program_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own matches" ON public.program_matches;
CREATE POLICY "Users can manage own matches" ON public.program_matches
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own watchlist" ON public.watchlist;
CREATE POLICY "Users can manage own watchlist" ON public.watchlist
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view published ambassadors" ON public.ambassadors;
CREATE POLICY "Public can view published ambassadors" ON public.ambassadors
  FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Users can manage own ambassador profile" ON public.ambassadors;
CREATE POLICY "Users can manage own ambassador profile" ON public.ambassadors
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Add sample ambassador
INSERT INTO public.ambassadors (
  full_name, slug, city_id, university_id, linkedin_url, testimonial, 
  languages, study_programs, is_published
) VALUES (
  'Ahmed Hassan',
  'ahmed-hassan-berlin',
  (SELECT id FROM public.cities WHERE slug = 'berlin' LIMIT 1),
  (SELECT id FROM public.universities WHERE name = 'Humboldt University Berlin' LIMIT 1),
  'https://linkedin.com/in/ahmed-hassan',
  'My journey to Germany started with a dream to study computer science at one of Europe''s top universities. The application process seemed overwhelming at first, but with proper guidance and preparation, I successfully enrolled in the Data Science program at Humboldt. The multicultural environment and world-class education have exceeded my expectations.',
  ARRAY['en', 'ar', 'de'],
  ARRAY['Data Science', 'Computer Science'],
  true
) ON CONFLICT (slug) DO NOTHING;