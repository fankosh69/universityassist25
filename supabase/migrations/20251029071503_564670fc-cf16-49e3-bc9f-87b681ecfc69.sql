-- Create consultations table for lead capture
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  consultation_type TEXT NOT NULL DEFAULT 'program_inquiry',
  notes JSONB DEFAULT '[]'::jsonb,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for performance
CREATE INDEX idx_consultations_profile_id ON public.consultations(profile_id);
CREATE INDEX idx_consultations_program_id ON public.consultations(program_id);
CREATE INDEX idx_consultations_status ON public.consultations(status);

-- Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own consultations"
  ON public.consultations FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can create own consultations"
  ON public.consultations FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can manage consultations"
  ON public.consultations FOR ALL
  USING (has_role('admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER set_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();