-- Restrict eligibility_checks policies to authenticated users to prevent anonymous data pollution
DROP POLICY IF EXISTS "Users can insert own eligibility checks" ON public.eligibility_checks;
DROP POLICY IF EXISTS "Users can view own eligibility checks" ON public.eligibility_checks;
DROP POLICY IF EXISTS "Admins can view all eligibility checks" ON public.eligibility_checks;

CREATE POLICY "Users can insert own eligibility checks"
ON public.eligibility_checks FOR INSERT TO authenticated
WITH CHECK (profile_id = auth.uid() AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own eligibility checks"
ON public.eligibility_checks FOR SELECT TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all eligibility checks"
ON public.eligibility_checks FOR SELECT TO authenticated
USING (has_role('admin'::app_role));