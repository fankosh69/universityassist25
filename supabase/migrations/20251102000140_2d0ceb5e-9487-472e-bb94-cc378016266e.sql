-- Create program_inquiries table for tracking user requests for programs not yet in database
CREATE TABLE IF NOT EXISTS public.program_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  program_name TEXT,
  university_name TEXT,
  city TEXT,
  field_of_study TEXT,
  user_query TEXT NOT NULL,
  conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'added', 'declined', 'duplicate')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  inquiry_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.program_inquiries ENABLE ROW LEVEL SECURITY;

-- Users can view their own inquiries
CREATE POLICY "Users can view own inquiries"
  ON public.program_inquiries
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Service role can insert inquiries
CREATE POLICY "Service role can insert inquiries"
  ON public.program_inquiries
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admins can manage all inquiries
CREATE POLICY "Admins can manage all inquiries"
  ON public.program_inquiries
  FOR ALL
  TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_program_inquiries_profile ON public.program_inquiries(profile_id);
CREATE INDEX idx_program_inquiries_status ON public.program_inquiries(status);
CREATE INDEX idx_program_inquiries_date ON public.program_inquiries(inquiry_date DESC);
CREATE INDEX idx_program_inquiries_conversation ON public.program_inquiries(conversation_id);

-- Add trigger for updated_at
CREATE TRIGGER update_program_inquiries_updated_at
  BEFORE UPDATE ON public.program_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create view for admin dashboard with aggregated stats
CREATE OR REPLACE VIEW public.program_inquiries_summary AS
SELECT 
  pi.id,
  pi.program_name,
  pi.university_name,
  pi.city,
  pi.field_of_study,
  pi.user_query,
  pi.status,
  pi.admin_notes,
  pi.inquiry_date,
  pi.created_at,
  p.full_name as user_name,
  p.email as user_email,
  p.nationality as user_nationality,
  reviewer.full_name as reviewed_by_name,
  pi.reviewed_at,
  -- Count similar inquiries
  (SELECT COUNT(*) 
   FROM public.program_inquiries pi2 
   WHERE (pi2.program_name ILIKE pi.program_name OR pi2.field_of_study = pi.field_of_study)
   AND pi2.status = 'pending'
  ) as similar_count
FROM public.program_inquiries pi
LEFT JOIN public.profiles p ON pi.profile_id = p.id
LEFT JOIN public.profiles reviewer ON pi.reviewed_by = reviewer.id
ORDER BY pi.inquiry_date DESC;

-- Grant access to the view
GRANT SELECT ON public.program_inquiries_summary TO authenticated;