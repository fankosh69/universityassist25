-- Fix security warnings for function search paths

-- Update get_current_application_period function with secure search path
CREATE OR REPLACE FUNCTION public.get_current_application_period(program_uuid UUID)
RETURNS TABLE (
  id UUID,
  intake_season intake_season,
  intake_year INTEGER,
  application_start_date DATE,
  application_end_date DATE,
  semester_start_date DATE,
  status TEXT
) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
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

-- Update get_next_application_period function with secure search path
CREATE OR REPLACE FUNCTION public.get_next_application_period(program_uuid UUID)
RETURNS TABLE (
  id UUID,
  intake_season intake_season,
  intake_year INTEGER,
  application_start_date DATE,
  application_end_date DATE,
  semester_start_date DATE
)
LANGUAGE sql 
STABLE 
SECURITY DEFINER
SET search_path = public
AS $$
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