-- Allow NULL values in target_intake to prevent constraint violations
-- This enables partial academic data updates without requiring intake information

ALTER TABLE public.student_academics 
DROP CONSTRAINT IF EXISTS student_academics_target_intake_check;

ALTER TABLE public.student_academics 
ADD CONSTRAINT student_academics_target_intake_check 
CHECK (target_intake IS NULL OR target_intake = ANY (ARRAY['winter'::text, 'summer'::text]));