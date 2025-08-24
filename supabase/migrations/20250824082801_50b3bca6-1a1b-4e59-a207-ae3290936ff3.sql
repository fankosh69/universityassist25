-- Enhanced Database Schema for University Assist Phase 1

-- Create enum for intake seasons
CREATE TYPE public.intake_season AS ENUM ('winter', 'summer', 'spring', 'fall');

-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('not_started', 'in_progress', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted');

-- Create enum for service package types
CREATE TYPE public.package_type AS ENUM ('basic', 'standard', 'premium', 'vip');

-- Enhanced application periods table to replace simple deadlines
CREATE TABLE public.application_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL,
  intake_season intake_season NOT NULL,
  intake_year INTEGER NOT NULL,
  application_start_date DATE NOT NULL,
  application_end_date DATE NOT NULL,
  semester_start_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(program_id, intake_season, intake_year)
);

-- Enable RLS on application periods
ALTER TABLE public.application_periods ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to application periods
CREATE POLICY "Public can view application periods" 
ON public.application_periods 
FOR SELECT 
USING (true);

-- Create services packages table
CREATE TABLE public.service_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  package_type package_type NOT NULL,
  description TEXT,
  price_eur INTEGER NOT NULL DEFAULT 0, -- Price in cents
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on service packages
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to service packages
CREATE POLICY "Public can view active service packages" 
ON public.service_packages 
FOR SELECT 
USING (is_active = true);

-- Create user applications table for tracking application status
CREATE TABLE public.user_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  program_id UUID NOT NULL,
  application_period_id UUID NOT NULL,
  status application_status DEFAULT 'not_started',
  service_package_id UUID,
  applied_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, program_id, application_period_id)
);

-- Enable RLS on user applications
ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for user applications
CREATE POLICY "Users can view own applications" 
ON public.user_applications 
FOR SELECT 
USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own applications" 
ON public.user_applications 
FOR INSERT 
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own applications" 
ON public.user_applications 
FOR UPDATE 
USING (auth.uid() = profile_id);

-- Create function to get current application period for a program
CREATE OR REPLACE FUNCTION public.get_current_application_period(program_uuid UUID)
RETURNS TABLE (
  id UUID,
  intake_season intake_season,
  intake_year INTEGER,
  application_start_date DATE,
  application_end_date DATE,
  semester_start_date DATE,
  status TEXT
) LANGUAGE sql STABLE AS $$
  SELECT 
    ap.id,
    ap.intake_season,
    ap.intake_year,
    ap.application_start_date,
    ap.application_end_date,
    ap.semester_start_date,
    CASE 
      WHEN CURRENT_DATE < ap.application_start_date THEN 'upcoming'
      WHEN CURRENT_DATE BETWEEN ap.application_start_date AND ap.application_end_date THEN 'open'
      WHEN CURRENT_DATE > ap.application_end_date THEN 'closed'
    END as status
  FROM public.application_periods ap
  WHERE ap.program_id = program_uuid 
    AND ap.is_active = true
    AND ap.intake_year >= EXTRACT(YEAR FROM CURRENT_DATE)
  ORDER BY ap.intake_year ASC, 
    CASE ap.intake_season 
      WHEN 'winter' THEN 1 
      WHEN 'spring' THEN 2 
      WHEN 'summer' THEN 3 
      WHEN 'fall' THEN 4 
    END ASC
  LIMIT 1;
$$;

-- Create function to get next application period for a program
CREATE OR REPLACE FUNCTION public.get_next_application_period(program_uuid UUID)
RETURNS TABLE (
  id UUID,
  intake_season intake_season,
  intake_year INTEGER,
  application_start_date DATE,
  application_end_date DATE,
  semester_start_date DATE
) LANGUAGE sql STABLE AS $$
  SELECT 
    ap.id,
    ap.intake_season,
    ap.intake_year,
    ap.application_start_date,
    ap.application_end_date,
    ap.semester_start_date
  FROM public.application_periods ap
  WHERE ap.program_id = program_uuid 
    AND ap.is_active = true
    AND ap.application_start_date > CURRENT_DATE
  ORDER BY ap.application_start_date ASC
  LIMIT 1;
$$;

-- Create triggers for updated_at columns
CREATE TRIGGER update_application_periods_updated_at
BEFORE UPDATE ON public.application_periods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_packages_updated_at
BEFORE UPDATE ON public.service_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_applications_updated_at
BEFORE UPDATE ON public.user_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add some sample application periods data
INSERT INTO public.application_periods (program_id, intake_season, intake_year, application_start_date, application_end_date, semester_start_date) 
SELECT 
  p.id,
  'winter' as intake_season,
  2025 as intake_year,
  '2025-04-01'::date as application_start_date,
  '2025-07-15'::date as application_end_date,
  '2025-10-01'::date as semester_start_date
FROM public.programs p
WHERE p.published = true
LIMIT 20;

INSERT INTO public.application_periods (program_id, intake_season, intake_year, application_start_date, application_end_date, semester_start_date) 
SELECT 
  p.id,
  'summer' as intake_season,
  2025 as intake_year,
  '2024-10-01'::date as application_start_date,
  '2024-12-30'::date as application_end_date,
  '2025-04-01'::date as semester_start_date
FROM public.programs p
WHERE p.published = true
LIMIT 15;

-- Add sample service packages
INSERT INTO public.service_packages (name, package_type, description, price_eur, features, sort_order) VALUES
('Self-Service', 'basic', 'Access to platform features and basic guidance', 0, '["Program search and matching", "Basic eligibility checker", "Application deadline tracking", "Document checklist"]', 1),
('Guided Application', 'standard', 'Professional guidance throughout your application process', 19900, '["Everything in Self-Service", "1-on-1 consultation session", "Document review and feedback", "Application timeline planning", "Email support"]', 2),
('Premium Support', 'premium', 'Comprehensive support with dedicated advisor', 49900, '["Everything in Guided Application", "Dedicated application advisor", "Multiple consultation sessions", "Priority support", "University contact assistance", "Interview preparation"]', 3),
('VIP Experience', 'vip', 'White-glove service with guaranteed acceptance support', 99900, '["Everything in Premium Support", "Guaranteed acceptance program", "Direct university contacts", "Visa assistance", "Accommodation support", "24/7 priority support"]', 4);