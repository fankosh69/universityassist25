-- Program Shortlists Table
CREATE TABLE public.program_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Program Recommendations',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for programs in shortlist
CREATE TABLE public.shortlist_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id UUID NOT NULL REFERENCES public.program_shortlists(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  staff_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shortlist_id, program_id)
);

-- RLS Policies
ALTER TABLE public.program_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortlist_programs ENABLE ROW LEVEL SECURITY;

-- Staff can manage shortlists they created
CREATE POLICY "Staff can manage own shortlists"
ON public.program_shortlists
FOR ALL
TO authenticated
USING (
  created_by = auth.uid() OR
  has_role('admin'::app_role)
)
WITH CHECK (
  created_by = auth.uid() OR
  has_role('admin'::app_role)
);

-- Students can view shortlists created for them
CREATE POLICY "Students can view shortlists for them"
ON public.program_shortlists
FOR SELECT
TO authenticated
USING (student_profile_id = auth.uid());

-- Staff can manage programs in their shortlists
CREATE POLICY "Staff can manage shortlist programs"
ON public.shortlist_programs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_shortlists
    WHERE id = shortlist_programs.shortlist_id
    AND (created_by = auth.uid() OR has_role('admin'::app_role))
  )
);

-- Students can view programs in their shortlists
CREATE POLICY "Students can view their shortlist programs"
ON public.shortlist_programs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.program_shortlists
    WHERE id = shortlist_programs.shortlist_id
    AND student_profile_id = auth.uid()
  )
);

-- Indexes for performance
CREATE INDEX idx_shortlists_student ON public.program_shortlists(student_profile_id);
CREATE INDEX idx_shortlists_created_by ON public.program_shortlists(created_by);
CREATE INDEX idx_shortlist_programs_shortlist ON public.shortlist_programs(shortlist_id);

-- Trigger for updated_at
CREATE TRIGGER update_program_shortlists_updated_at
BEFORE UPDATE ON public.program_shortlists
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();