-- 1. Migrate role checks off the self-editable profiles.role column
DROP POLICY IF EXISTS "Admins can manage badges" ON public.badges;
CREATE POLICY "Admins can manage badges"
ON public.badges FOR ALL TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage message templates" ON public.message_templates;
CREATE POLICY "Admins can manage message templates"
ON public.message_templates FOR ALL TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));

DROP POLICY IF EXISTS "University staff can view applications" ON public.applications;
CREATE POLICY "University staff can view applications"
ON public.applications FOR SELECT TO authenticated
USING (public.has_role('university_staff'::app_role) AND university_visible = true);

-- 2. Prevent self-service edits to profiles.role
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.has_role('admin'::app_role) THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_role_self_change ON public.profiles;
CREATE TRIGGER trg_prevent_profile_role_self_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_self_change();