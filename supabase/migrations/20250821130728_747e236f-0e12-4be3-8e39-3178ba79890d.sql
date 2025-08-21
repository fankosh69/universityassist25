-- Fix security warning: Set search_path for validate_date_of_birth function
CREATE OR REPLACE FUNCTION public.validate_date_of_birth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth >= CURRENT_DATE THEN
    RAISE EXCEPTION 'Date of birth must be in the past';
  END IF;
  RETURN NEW;
END;
$$;