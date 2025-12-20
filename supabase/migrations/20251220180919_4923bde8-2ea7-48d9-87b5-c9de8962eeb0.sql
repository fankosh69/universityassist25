-- Add enhanced program requirements columns to programs table
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gpa_minimum DECIMAL(2,1);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gpa_competitive DECIMAL(2,1);
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gpa_notes TEXT;

-- Standardized test requirements
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gmat_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gmat_minimum INTEGER;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gre_required BOOLEAN DEFAULT FALSE;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gre_minimum_verbal INTEGER;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gre_minimum_quant INTEGER;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS gre_minimum_total INTEGER;

-- Accepted prior degrees (references fields_of_study slugs)
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS accepted_degrees TEXT[] DEFAULT '{}';

-- Subject-specific ECTS requirements (structured JSONB)
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS subject_requirements JSONB DEFAULT '{}';

-- Document URLs (stored in Supabase Storage)
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS admission_regulations_url TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS program_flyer_url TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS module_description_url TEXT;

-- Create storage bucket for program documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-documents', 'program-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for program-documents bucket: Authenticated users can read
CREATE POLICY "Authenticated users can read program documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'program-documents' AND auth.role() = 'authenticated');

-- RLS policy: Only admins can upload/delete program documents
CREATE POLICY "Admins can manage program documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'program-documents' 
  AND has_role('admin'::app_role)
)
WITH CHECK (
  bucket_id = 'program-documents' 
  AND has_role('admin'::app_role)
);

-- Add comments for documentation
COMMENT ON COLUMN public.programs.gpa_minimum IS 'Minimum German GPA required (1.0-4.0 scale)';
COMMENT ON COLUMN public.programs.gpa_competitive IS 'GPA for competitive/excellent chances';
COMMENT ON COLUMN public.programs.accepted_degrees IS 'Array of accepted prior degree field slugs';
COMMENT ON COLUMN public.programs.subject_requirements IS 'Structured ECTS requirements by subject area';
COMMENT ON COLUMN public.programs.admission_regulations_url IS 'URL to admission regulations PDF in storage';
COMMENT ON COLUMN public.programs.program_flyer_url IS 'URL to program flyer PDF in storage';
COMMENT ON COLUMN public.programs.module_description_url IS 'URL to module description PDF in storage';