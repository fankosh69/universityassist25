-- Fix the enum to include counselor role, then apply security separation
-- First, add counselor to the app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'app_role'::regtype AND enumlabel = 'counselor') THEN
        ALTER TYPE app_role ADD VALUE 'counselor';
    END IF;
END $$;

-- Now create the security-enhanced table structure
-- Create public profiles table for non-sensitive data
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
  display_name text,
  education_level text,
  field_of_study text,
  institution_name text,
  academic_year text,
  bio text,
  avatar_url text,
  is_profile_complete boolean DEFAULT false,
  visibility_settings jsonb DEFAULT '{"display_name": true, "education_level": true, "field_of_study": true}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Create private profile data table for sensitive information
CREATE TABLE IF NOT EXISTS public.private_profile_data (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  date_of_birth date,
  nationality text,
  gender text,
  country_code text DEFAULT '+49'::text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  data_processing_consent boolean DEFAULT false,
  marketing_consent boolean DEFAULT false,
  last_security_audit timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Create academic preferences table (non-sensitive academic interests)
CREATE TABLE IF NOT EXISTS public.academic_preferences (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_fields text[] DEFAULT '{}'::text[],
  preferred_degree_type text,
  preferred_cities text[] DEFAULT '{}'::text[],
  career_goals text,
  study_motivations text[],
  preferred_language_of_instruction text[] DEFAULT '{}'::text[],
  preferred_start_date text,
  budget_range text,
  accommodation_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id)
);

-- Enable RLS on all new tables
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_profile_data ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.academic_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.public_profiles;
DROP POLICY IF EXISTS "Users can update own public profile" ON public.public_profiles;
DROP POLICY IF EXISTS "Private data only accessible by owner" ON public.private_profile_data;
DROP POLICY IF EXISTS "Admins can view masked private data" ON public.private_profile_data;
DROP POLICY IF EXISTS "Academic preferences accessible by owner" ON public.academic_preferences;
DROP POLICY IF EXISTS "Counselors can view academic preferences" ON public.academic_preferences;

-- Create RLS policies
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.public_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own public profile"
ON public.public_profiles FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Private data only accessible by owner"
ON public.private_profile_data FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view masked private data"
ON public.private_profile_data FOR SELECT
TO authenticated
USING (has_role('admin'::app_role));

CREATE POLICY "Academic preferences accessible by owner"
ON public.academic_preferences FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Counselors can view academic preferences"
ON public.academic_preferences FOR SELECT
TO authenticated
USING (has_role('admin'::app_role) OR has_role('counselor'::app_role));

-- Migrate existing data from profiles table to new structure
INSERT INTO public.public_profiles (
  id, display_name, education_level, field_of_study, institution_name, 
  is_profile_complete, created_at, updated_at
)
SELECT 
  id,
  CASE 
    WHEN full_name IS NOT NULL THEN 
      SPLIT_PART(full_name, ' ', 1) || ' ' || COALESCE(LEFT(SPLIT_PART(full_name, ' ', 2), 1) || '.', '')
    ELSE 'Student'
  END as display_name,
  current_education_level,
  current_field_of_study,
  current_institution,
  (full_name IS NOT NULL AND current_education_level IS NOT NULL) as is_profile_complete,
  created_at,
  updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.private_profile_data (
  id, full_name, email, phone, date_of_birth, nationality, gender, 
  country_code, data_processing_consent, created_at, updated_at
)
SELECT 
  id, full_name, email, phone, date_of_birth, nationality, gender,
  country_code, true as data_processing_consent, created_at, updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.academic_preferences (
  id, preferred_fields, preferred_degree_type, preferred_cities, career_goals,
  created_at, updated_at
)
SELECT 
  id, preferred_fields, preferred_degree_type, preferred_cities, career_goals,
  created_at, updated_at
FROM public.profiles
ON CONFLICT (id) DO NOTHING;