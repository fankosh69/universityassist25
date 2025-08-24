-- Add new fields to programs table for comprehensive management
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS application_method TEXT DEFAULT 'direct' CHECK (application_method IN ('direct', 'uni_assist_direct', 'uni_assist_vpd', 'recognition_certificates'));
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS program_url TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS winter_intake BOOLEAN DEFAULT true;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS summer_intake BOOLEAN DEFAULT false;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS winter_deadline DATE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS summer_deadline DATE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS recognition_weeks_before INTEGER DEFAULT 10;

-- Update degree_type to use standard abbreviations
UPDATE public.programs SET degree_type = 
  CASE 
    WHEN degree_level = 'bachelor' AND field_of_study LIKE '%Science%' THEN 'B.Sc.'
    WHEN degree_level = 'bachelor' AND field_of_study LIKE '%Arts%' THEN 'B.A.'
    WHEN degree_level = 'bachelor' AND field_of_study LIKE '%Engineering%' THEN 'B.Eng.'
    WHEN degree_level = 'bachelor' THEN 'B.A.'
    WHEN degree_level = 'master' AND field_of_study LIKE '%Science%' THEN 'M.Sc.'
    WHEN degree_level = 'master' AND field_of_study LIKE '%Arts%' THEN 'M.A.'
    WHEN degree_level = 'master' AND field_of_study LIKE '%Engineering%' THEN 'M.Eng.'
    WHEN degree_level = 'master' THEN 'M.A.'
    ELSE degree_type
  END
WHERE degree_type = '' OR degree_type IS NULL;

-- Create function to automatically update deadlines
CREATE OR REPLACE FUNCTION update_program_deadlines()
RETURNS trigger AS $$
BEGIN
  -- Update winter deadline if it has passed
  IF NEW.winter_deadline IS NOT NULL AND NEW.winter_deadline < CURRENT_DATE THEN
    NEW.winter_deadline := NEW.winter_deadline + INTERVAL '1 year';
  END IF;
  
  -- Update summer deadline if it has passed
  IF NEW.summer_deadline IS NOT NULL AND NEW.summer_deadline < CURRENT_DATE THEN
    NEW.summer_deadline := NEW.summer_deadline + INTERVAL '1 year';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update deadlines
DROP TRIGGER IF EXISTS auto_update_deadlines ON public.programs;
CREATE TRIGGER auto_update_deadlines
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION update_program_deadlines();

-- Create daily cron job to update all program deadlines
SELECT cron.schedule(
  'update-program-deadlines',
  '0 0 * * *', -- Daily at midnight
  $$
  UPDATE public.programs 
  SET updated_at = now()
  WHERE (winter_deadline IS NOT NULL AND winter_deadline < CURRENT_DATE) 
     OR (summer_deadline IS NOT NULL AND summer_deadline < CURRENT_DATE);
  $$
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_deadlines ON public.programs(winter_deadline, summer_deadline);
CREATE INDEX IF NOT EXISTS idx_programs_intake ON public.programs(winter_intake, summer_intake);
CREATE INDEX IF NOT EXISTS idx_programs_application_method ON public.programs(application_method);