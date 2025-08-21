-- Add new fields to profiles table for enhanced sign-up
ALTER TABLE public.profiles 
ADD COLUMN gender text CHECK (gender IN ('Male', 'Female')),
ADD COLUMN date_of_birth date,
ADD COLUMN country_code text DEFAULT '+49';

-- Add validation trigger for date of birth to ensure it's in the past
CREATE OR REPLACE FUNCTION public.validate_date_of_birth()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.date_of_birth IS NOT NULL AND NEW.date_of_birth >= CURRENT_DATE THEN
    RAISE EXCEPTION 'Date of birth must be in the past';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for date of birth validation
CREATE TRIGGER validate_dob_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_date_of_birth();

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email, 
    gender,
    date_of_birth,
    phone,
    country_code,
    created_at, 
    updated_at
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'date_of_birth')::date,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country_code',
    now(),
    now()
  );
  RETURN new;
END;
$$;