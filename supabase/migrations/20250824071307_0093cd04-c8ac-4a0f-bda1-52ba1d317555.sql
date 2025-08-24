-- University Assist Schema Extension (building on existing tables)

-- User roles enum (if not exists)
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM (
        'student', 'parent', 'school_counselor', 'university_staff', 
        'company_sales', 'company_admissions', 'marketing', 'admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Degree level enum (if not exists)
DO $$ BEGIN
    CREATE TYPE public.degree_level AS ENUM ('bachelor', 'master');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User roles table (separate from profiles for RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Cities table (if not exists)
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
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns to existing programs table
ALTER TABLE public.programs 
ADD COLUMN IF NOT EXISTS country_code CHAR(2) DEFAULT 'DE',
ADD COLUMN IF NOT EXISTS degree_level degree_level,
ADD COLUMN IF NOT EXISTS language_of_instruction TEXT[] DEFAULT ARRAY['de'],
ADD COLUMN IF NOT EXISTS uni_assist_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tuition_eur NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'on_campus',
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS search_doc JSONB DEFAULT '{}';

-- Add missing columns to existing universities table (rename to institutions)
ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS country_code CHAR(2) DEFAULT 'DE',
ADD COLUMN IF NOT EXISTS city_id UUID,
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS external_refs JSONB DEFAULT '{}';

-- Program requirements
CREATE TABLE IF NOT EXISTS public.program_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    requirement_type TEXT NOT NULL, -- 'gpa','language','ects','prereq_course','portfolio'
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Program deadlines
CREATE TABLE IF NOT EXISTS public.program_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
    intake TEXT CHECK (intake IN ('winter','summer')) NOT NULL,
    application_deadline DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Student academics (extends profiles)
CREATE TABLE IF NOT EXISTS public.student_academics (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    curriculum TEXT,
    prev_major TEXT,
    gpa_raw NUMERIC(5,2),
    gpa_scale_max NUMERIC(5,2),
    gpa_min_pass NUMERIC(5,2),
    gpa_de NUMERIC(3,2), -- Computed German GPA via Bavarian Formula
    target_level degree_level,
    target_intake TEXT CHECK (target_intake IN ('winter','summer')),
    language_certificates JSONB DEFAULT '[]',
    ects_total NUMERIC(6,1),
    extras JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Rename existing matches to program_matches and add missing columns
DO $$ 
BEGIN
    -- Check if program_matches exists, if not rename matches
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_matches' AND table_schema = 'public') THEN
        ALTER TABLE public.matches RENAME TO program_matches;
    END IF;
END $$;

-- Add missing columns to program_matches
ALTER TABLE public.program_matches 
ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('eligible','borderline','missing')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Rename saved_programs to watchlist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'watchlist' AND table_schema = 'public') THEN
        ALTER TABLE public.saved_programs RENAME TO watchlist;
    END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop existing and recreate)
DROP POLICY IF EXISTS "Public can view cities" ON public.cities;
CREATE POLICY "Public can view cities" ON public.cities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view institutions" ON public.universities;
CREATE POLICY "Public can view institutions" ON public.universities FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view published programs" ON public.programs;
CREATE POLICY "Public can view published programs" ON public.programs FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Public can view program requirements" ON public.program_requirements;
CREATE POLICY "Public can view program requirements" ON public.program_requirements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view program deadlines" ON public.program_deadlines;
CREATE POLICY "Public can view program deadlines" ON public.program_deadlines FOR SELECT USING (true);

-- User-specific data policies
DROP POLICY IF EXISTS "Users can view own academics" ON public.student_academics;
CREATE POLICY "Users can view own academics" ON public.student_academics FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own academics" ON public.student_academics;
CREATE POLICY "Users can manage own academics" ON public.student_academics FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own academics" ON public.student_academics;
CREATE POLICY "Users can update own academics" ON public.student_academics FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own matches" ON public.program_matches;
CREATE POLICY "Users can view own matches" ON public.program_matches FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own watchlist" ON public.watchlist;
CREATE POLICY "Users can manage own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id);

-- User roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_student_academics_updated_at ON public.student_academics;
CREATE TRIGGER update_student_academics_updated_at
    BEFORE UPDATE ON public.student_academics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_program_matches_updated_at ON public.program_matches;
CREATE TRIGGER update_program_matches_updated_at
    BEFORE UPDATE ON public.program_matches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();