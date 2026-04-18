-- Add counselor + admin SELECT policies on profiles, scoped to assigned students.
-- Mirrors the existing access pattern on academic_preferences and prevents counselors
-- from being unable to look up their assigned students.

CREATE POLICY "Counselors can view assigned students profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role('counselor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.counselor_students cs
    WHERE cs.counselor_id = auth.uid()
      AND cs.student_id = profiles.id
  )
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role('admin'::app_role));