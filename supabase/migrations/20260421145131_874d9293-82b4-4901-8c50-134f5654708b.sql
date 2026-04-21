-- Remove public read policy on message_templates (lingering from older migration)
DROP POLICY IF EXISTS "All can view message templates" ON public.message_templates;

-- Lock down user_badges writes
DROP POLICY IF EXISTS "Users can insert own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can update own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Users can delete own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Admins can manage user badges" ON public.user_badges;

CREATE POLICY "Admins can insert user badges"
ON public.user_badges FOR INSERT TO authenticated
WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Admins can update user badges"
ON public.user_badges FOR UPDATE TO authenticated
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Admins can delete user badges"
ON public.user_badges FOR DELETE TO authenticated
USING (has_role('admin'::app_role));