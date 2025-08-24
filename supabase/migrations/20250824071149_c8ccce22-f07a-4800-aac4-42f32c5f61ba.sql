-- University Assist Core Schema (Free Plan Compatible)

-- User roles enum
CREATE TYPE public.app_role AS ENUM (
  'student', 'parent', 'school_counselor', 'university_staff', 
  'company_sales', 'company_admissions', 'marketing', 'admin'
);

-- Degree level enum
CREATE TYPE public.degree_level AS ENUM ('bachelor', 'master');

-- User roles table (separate from profiles for RBAC)
CREATE TABLE public.user_roles (
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

-- Cities table (destination-ready)
CREATE TABLE public.cities (
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

-- Institutions table
CREATE TABLE public.institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'DE',
  city_id UUID REFERENCES public.cities(id),
  slug TEXT UNIQUE NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  external_refs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'DE',
  title TEXT NOT NULL,
  major TEXT,
  degree_level degree_level NOT NULL,
  language_of_instruction TEXT[] NOT NULL DEFAULT ARRAY['de'],
  uni_assist_required BOOLEAN DEFAULT FALSE,
  tuition_eur NUMERIC(10,2),
  delivery_mode TEXT DEFAULT 'on_campus',
  slug TEXT UNIQUE NOT NULL,
  published BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  search_doc JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Program requirements
CREATE TABLE public.program_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  requirement_type TEXT NOT NULL, -- 'gpa','language','ects','prereq_course','portfolio'
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Program deadlines
CREATE TABLE public.program_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  intake TEXT CHECK (intake IN ('winter','summer')) NOT NULL,
  application_deadline DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student academics (extends profiles)
CREATE TABLE public.student_academics (
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

-- Program matches
CREATE TABLE public.program_matches (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL,
  components JSONB DEFAULT '{}', -- {gpa: 0.8, language: 0.6, ects: 0.9, intake: 1.0}
  status TEXT CHECK (status IN ('eligible','borderline','missing')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, program_id)
);

-- Watchlist
CREATE TABLE public.watchlist (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, program_id)
);

-- Enable RLS on all tables
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Cities, institutions, programs - public read access
CREATE POLICY "Public can view cities" ON public.cities FOR SELECT USING (true);
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view institutions" ON public.institutions FOR SELECT USING (true);
CREATE POLICY "Admins can manage institutions" ON public.institutions FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view published programs" ON public.programs FOR SELECT USING (published = true);
CREATE POLICY "Admins can manage programs" ON public.programs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view program requirements" ON public.program_requirements FOR SELECT USING (true);
CREATE POLICY "Admins can manage program requirements" ON public.program_requirements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view program deadlines" ON public.program_deadlines FOR SELECT USING (true);
CREATE POLICY "Admins can manage program deadlines" ON public.program_deadlines FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- User-specific data policies
CREATE POLICY "Users can view own academics" ON public.student_academics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own academics" ON public.student_academics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own academics" ON public.student_academics FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own matches" ON public.program_matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage matches" ON public.program_matches FOR ALL USING (true); -- Managed by matching service

CREATE POLICY "Users can manage own watchlist" ON public.watchlist FOR ALL USING (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_academics_updated_at
  BEFORE UPDATE ON public.student_academics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_matches_updated_at
  BEFORE UPDATE ON public.program_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();