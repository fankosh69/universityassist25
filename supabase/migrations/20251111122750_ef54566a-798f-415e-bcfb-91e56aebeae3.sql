-- Create table for assigning students to sales/admissions users
CREATE TABLE IF NOT EXISTS public.user_student_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  notes text,
  UNIQUE(user_id, student_id)
);

-- Enable RLS
ALTER TABLE public.user_student_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage student assignments" ON public.user_student_assignments;
DROP POLICY IF EXISTS "Sales and admissions can view assigned students" ON public.user_student_assignments;

-- Admins can manage all assignments
CREATE POLICY "Admins can manage student assignments"
ON public.user_student_assignments
FOR ALL
USING (has_role_by_profile(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role_by_profile(auth.uid(), 'admin'::app_role));

-- Sales and admissions can view their assigned students
CREATE POLICY "Sales and admissions can view assigned students"
ON public.user_student_assignments
FOR SELECT
USING (
  auth.uid() = user_id 
  AND (
    has_role_by_profile(auth.uid(), 'company_sales'::app_role) 
    OR has_role_by_profile(auth.uid(), 'company_admissions'::app_role)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_student_assignments_user_id ON public.user_student_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_student_assignments_student_id ON public.user_student_assignments(student_id);