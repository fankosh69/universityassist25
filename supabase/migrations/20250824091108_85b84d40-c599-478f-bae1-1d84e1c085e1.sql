-- University Assist Core Tables (Fixed)

-- Student academics table (using auth.users directly)
CREATE TABLE IF NOT EXISTS public.student_academics (
  profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  curriculum TEXT,
  prev_major TEXT,
  gpa_raw NUMERIC(5,2),
  gpa_scale_max NUMERIC(5,2),
  gpa_min_pass NUMERIC(5,2),
  gpa_de NUMERIC(3,2),
  target_level TEXT CHECK (target_level IN ('bachelor','master')),
  target_intake TEXT CHECK (target_intake IN ('winter','summer')),
  language_certificates JSONB DEFAULT '[]',
  ects_total NUMERIC(6,1),
  extras JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program matches table
CREATE TABLE IF NOT EXISTS public.program_matches (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  score NUMERIC(5,2),
  components JSONB DEFAULT '{}',
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, program_id)
);

-- Watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (profile_id, program_id)
);

-- Ambassadors table
CREATE TABLE IF NOT EXISTS public.ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- RLS Policies
ALTER TABLE public.student_academics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own academics" ON public.student_academics;
CREATE POLICY "Users can manage own academics" ON public.student_academics
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

ALTER TABLE public.program_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own matches" ON public.program_matches;
CREATE POLICY "Users can manage own matches" ON public.program_matches
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own watchlist" ON public.watchlist;
CREATE POLICY "Users can manage own watchlist" ON public.watchlist
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

ALTER TABLE public.ambassadors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view published ambassadors" ON public.ambassadors;
CREATE POLICY "Public can view published ambassadors" ON public.ambassadors
  FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "Users can manage own ambassador profile" ON public.ambassadors;
CREATE POLICY "Users can manage own ambassador profile" ON public.ambassadors
  FOR ALL USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_academics_profile ON public.student_academics(profile_id);
CREATE INDEX IF NOT EXISTS idx_program_matches_profile ON public.program_matches(profile_id);
CREATE INDEX IF NOT EXISTS idx_program_matches_program ON public.program_matches(program_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_profile ON public.watchlist(profile_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_city ON public.ambassadors(city_id);
CREATE INDEX IF NOT EXISTS idx_ambassadors_university ON public.ambassadors(university_id);