-- Add admission test and interview fields to programs table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS admission_test_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS admission_test_details TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS interview_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS interview_details TEXT;