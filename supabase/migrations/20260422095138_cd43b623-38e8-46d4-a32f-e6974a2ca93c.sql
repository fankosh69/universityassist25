-- Add missing INSERT policy on xp_events so that signed-in users can record
-- their own XP events directly from the client (gamification flows).
-- Admins keep full control via a separate policy.

CREATE POLICY "Users can insert own xp events"
ON public.xp_events
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Admins can manage xp events"
ON public.xp_events
FOR ALL
TO authenticated
USING (public.has_role('admin'::app_role))
WITH CHECK (public.has_role('admin'::app_role));