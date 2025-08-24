-- Fix function search path security issue
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public';